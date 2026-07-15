const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
const RECORDS_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('RECORDS_FOLDER_ID');
const CONFIG_SPREADSHEET_ID = SCRIPT_PROPERTIES.getProperty('CONFIG_SPREADSHEET_ID');
const TIME_ZONE = 'America/Toronto';
const LIVE_SHEET_NAME = 'Live Parking Authorizations';

const SITE_LOCATIONS = [
  '3131 BRIDLETOWNE CIRCLE', '315 BRIDLETOWN CIR', '3151 BRIDLETOWNE CIRCLE',
  '5 VICORA LINKWAY', '10 EDGECLIFF GOLFWAY', 'GALLOWAY RD', 'Fashion Roseway',
  '8 CLAPPISON BLVD', '10 GOWER ST', '1947 LAWRENCE AVE WEST + 38 GIB',
  '1580 MISSISSAUGA VALLEY BLVD', 'MORLEY CRESCENT, Brampton, ON',
  '745 New Westminster Dr', '224 Rosemount Ave', '42 PINERY TR',
  '47 WINDY GOLFWAY', '451 THE WEST MALL'
];

const HEADERS = ['DATE', 'TIME', 'UNIT', 'LICENCE PLATE', 'MAKE', 'COLOUR', 'PHONE', 'GUARD NAME', 'AUTHORIZED HOURS', 'EXPIRES AT', 'SUBMITTED AT', 'RECORD ID'];
const LIVE_HEADERS = ['RECORD ID', 'SITE', 'DATE', 'TIME', 'UNIT', 'LICENCE PLATE', 'MAKE', 'COLOUR', 'AUTHORIZED HOURS', 'EXPIRES AT', 'SUBMITTED AT'];

function doGet(event) {
  try {
    if (event && event.parameter && ['parking', 'months', 'records'].indexOf(event.parameter.action) !== -1) requireProxySecret_(event.parameter.proxySecret);
    if (event && event.parameter && event.parameter.action === 'parking') {
      return jsonResponse_({ ok: true, generatedAt: new Date().toISOString(), records: readParkingRecords_() });
    }
    if (event && event.parameter && event.parameter.action === 'months') {
      return jsonResponse_({ ok: true, months: listRecordMonths_() });
    }
    if (event && event.parameter && event.parameter.action === 'records') {
      return jsonResponse_({ ok: true, records: readMonthlyRecords_(String(event.parameter.month || '')) });
    }
    return jsonResponse_({ ok: true, service: 'SMS Security Voicemail Backend', version: 2 });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || String(error) });
  }
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const record = JSON.parse((event.postData && event.postData.contents) || '{}');
    requireProxySecret_(record.proxySecret);
    delete record.proxySecret;
    validateRecord_(record);
    const entryDateTime = Utilities.parseDate(record.date + ' ' + record.time, TIME_ZONE, 'yyyy-MM-dd HH:mm');
    const durationHours = Number(record.parkingDurationHours || 24);
    const expiresAt = new Date(entryDateTime.getTime() + durationHours * 60 * 60 * 1000);
    const recordId = Utilities.getUuid();
    const entryDate = Utilities.parseDate(record.date, TIME_ZONE, 'yyyy-MM-dd');
    const fileName = 'V.P Log ' + Utilities.formatDate(entryDate, TIME_ZONE, 'MMMM yyyy');
    const spreadsheet = getOrCreateMonthlySpreadsheet_(fileName);
    const sheet = getOrCreateSiteSheet_(spreadsheet, record.siteLocation);

    sheet.appendRow([entryDate, record.time, cleanCell_(record.unitNo), cleanCell_(record.plateNumber).toUpperCase(), cleanCell_(record.vehicleMake), cleanCell_(record.colour), cleanCell_(record.phoneNumber), cleanCell_(record.guardName), durationHours, expiresAt, new Date(), recordId]);
    const row = sheet.getLastRow();
    sheet.getRange(row, 1).setNumberFormat('d');
    sheet.getRange(row, 10, 1, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');

    const liveSheet = getOrCreateLiveSheet_();
    liveSheet.appendRow([recordId, record.siteLocation, entryDate, record.time, cleanCell_(record.unitNo), cleanCell_(record.plateNumber).toUpperCase(), cleanCell_(record.vehicleMake), cleanCell_(record.colour), durationHours, expiresAt, new Date()]);
    const liveRow = liveSheet.getLastRow();
    liveSheet.getRange(liveRow, 3).setNumberFormat('yyyy-mm-dd');
    liveSheet.getRange(liveRow, 10, 1, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    SpreadsheetApp.flush();

    return jsonResponse_({ ok: true, message: 'Record saved', id: recordId, month: fileName, site: record.siteLocation, row: row, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || String(error) });
  } finally {
    lock.releaseLock();
  }
}

function readParkingRecords_() {
  const sheet = getOrCreateLiveSheet_();
  if (sheet.getLastRow() < 2) return [];
  const startRow = Math.max(2, sheet.getLastRow() - 999);
  const values = sheet.getRange(startRow, 1, sheet.getLastRow() - startRow + 1, LIVE_HEADERS.length).getValues();
  return values.reverse().map(function (row) {
    return { id: String(row[0]), siteLocation: String(row[1]), date: formatDateValue_(row[2]), time: formatTimeValue_(row[3]), unitNo: String(row[4]), plateNumber: String(row[5]), vehicleMake: String(row[6]), colour: String(row[7]), parkingDurationHours: Number(row[8]), expiresAt: isoValue_(row[9]), submittedAt: isoValue_(row[10]) };
  });
}

function listRecordMonths_() {
  const folder = DriveApp.getFolderById(RECORDS_FOLDER_ID);
  const files = folder.getFiles();
  const months = [];
  while (files.hasNext()) {
    const name = files.next().getName();
    const match = name.match(/^V\.P Log (.+)$/);
    if (match) {
      const parsed = new Date(match[1] + ' 1');
      if (!isNaN(parsed.getTime())) months.push(Utilities.formatDate(parsed, TIME_ZONE, 'yyyy-MM'));
    }
  }
  return Array.from(new Set(months)).sort().reverse();
}

function readMonthlyRecords_(monthKey) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error('Invalid month');
  const parts = monthKey.split('-').map(Number);
  const fileName = 'V.P Log ' + Utilities.formatDate(new Date(parts[0], parts[1] - 1, 1), TIME_ZONE, 'MMMM yyyy');
  const files = DriveApp.getFolderById(RECORDS_FOLDER_ID).getFilesByName(fileName);
  if (!files.hasNext()) return [];
  const spreadsheet = SpreadsheetApp.openById(files.next().getId());
  const records = [];
  spreadsheet.getSheets().forEach(function (sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    const rows = sheet.getRange(2, 1, lastRow - 1, Math.max(HEADERS.length, sheet.getLastColumn())).getValues();
    rows.forEach(function (row, index) {
      if (!row[0] && !row[3]) return;
      const submitted = row[10] instanceof Date ? row[10] : (row[8] instanceof Date ? row[8] : new Date());
      records.push({
        id: String(row[11] || sheet.getSheetId() + '-' + (index + 2)),
        date: formatDateValue_(row[0]), time: formatTimeValue_(row[1]), siteLocation: sheet.getName(),
        unitNo: String(row[2] || ''), plateNumber: String(row[3] || ''), vehicleMake: String(row[4] || ''),
        colour: String(row[5] || ''), phoneNumber: String(row[6] || ''), guardName: String(row[7] || ''),
        parkingDurationHours: typeof row[8] === 'number' ? row[8] : 24,
        expiresAt: row[9] instanceof Date ? row[9].toISOString() : '', createdAt: submitted.toISOString()
      });
    });
  });
  return records.sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });
}

function getOrCreateLiveSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG_SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(LIVE_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(LIVE_SHEET_NAME);
  if (sheet.getLastRow() === 0) formatSheet_(sheet, LIVE_HEADERS);
  return sheet;
}

function getOrCreateMonthlySpreadsheet_(fileName) {
  const folder = DriveApp.getFolderById(RECORDS_FOLDER_ID);
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) return SpreadsheetApp.openById(files.next().getId());
  const spreadsheet = SpreadsheetApp.create(fileName);
  DriveApp.getFileById(spreadsheet.getId()).moveTo(folder);
  const firstSheet = spreadsheet.getSheets()[0];
  firstSheet.setName(safeSheetName_(SITE_LOCATIONS[0]));
  formatSheet_(firstSheet, HEADERS);
  SITE_LOCATIONS.slice(1).forEach(function (site) { formatSheet_(spreadsheet.insertSheet(safeSheetName_(site)), HEADERS); });
  return spreadsheet;
}

function getOrCreateSiteSheet_(spreadsheet, siteLocation) {
  const name = safeSheetName_(siteLocation);
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) { sheet = spreadsheet.insertSheet(name); formatSheet_(sheet, HEADERS); }
  else sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sheet;
}

function formatSheet_(sheet, headers) {
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setBackground('#a9dcea').setFontWeight('bold').setHorizontalAlignment('center').setBorder(true, true, true, true, true, true, '#1d1d1f', SpreadsheetApp.BorderStyle.SOLID);
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, headers.length, 130);
}

function validateRecord_(record) {
  const required = ['date', 'time', 'siteLocation', 'unitNo', 'phoneNumber', 'plateNumber', 'vehicleMake', 'colour', 'guardName'];
  required.forEach(function (field) { if (!record[field] || !String(record[field]).trim()) throw new Error('Missing required field: ' + field); });
  if (SITE_LOCATIONS.indexOf(record.siteLocation) === -1) throw new Error('Unknown site location');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) throw new Error('Invalid date');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time)) throw new Error('Invalid time');
  const hours = Number(record.parkingDurationHours || 24);
  if (!Number.isFinite(hours) || hours < 1 || hours > 8760) throw new Error('Authorization must be between 1 and 8760 hours');
  const limits = { unitNo: 40, phoneNumber: 40, plateNumber: 20, vehicleMake: 60, colour: 40, guardName: 80 };
  Object.keys(limits).forEach(function (field) {
    if (String(record[field]).length > limits[field]) throw new Error(field + ' is too long');
  });
}

function cleanCell_(value) { const text = String(value || '').trim(); return /^[=+\-@]/.test(text) ? "'" + text : text; }
function requireProxySecret_(provided) { const expected = SCRIPT_PROPERTIES.getProperty('PROXY_SECRET'); if (!expected || !provided || String(provided) !== expected) throw new Error('Unauthorized'); }
function safeSheetName_(name) { return String(name).replace(/[\\/?*\[\]:]/g, '-').slice(0, 100); }
function formatDateValue_(value) { return value instanceof Date ? Utilities.formatDate(value, TIME_ZONE, 'yyyy-MM-dd') : String(value); }
function formatTimeValue_(value) { return value instanceof Date ? Utilities.formatDate(value, TIME_ZONE, 'HH:mm') : String(value).slice(0, 5); }
function isoValue_(value) { return value instanceof Date ? value.toISOString() : new Date(value).toISOString(); }
function jsonResponse_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
function testSetup() { if (!RECORDS_FOLDER_ID || !CONFIG_SPREADSHEET_ID || !SCRIPT_PROPERTIES.getProperty('PROXY_SECRET')) throw new Error('Add RECORDS_FOLDER_ID, CONFIG_SPREADSHEET_ID, and PROXY_SECRET script properties first'); DriveApp.getFolderById(RECORDS_FOLDER_ID).getName(); SpreadsheetApp.openById(CONFIG_SPREADSHEET_ID).getName(); getOrCreateLiveSheet_(); return 'Secure setup is valid'; }
