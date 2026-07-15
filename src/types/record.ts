export interface VoicemailRecord {
  id: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm, entered manually by the supervisor
  siteLocation?: string; // Optional for compatibility with previously saved records
  unitNo: string;
  phoneNumber: string;
  plateNumber: string;
  vehicleMake: string;
  colour: string;
  guardName: string;
  parkingDurationHours: number;
  expiresAt?: string;
  createdAt: string; // ISO timestamp
}

export interface RecordFormValues extends
  Omit<VoicemailRecord, 'id' | 'createdAt' | 'siteLocation'> {
  siteLocation: string;
}
