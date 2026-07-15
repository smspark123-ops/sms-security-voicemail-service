import React from 'react';
import { motion } from 'framer-motion';
const SECTIONS: {
  title: string;
  body: string;
}[] = [
{
  title: '1. Acceptance of Terms',
  body: 'By accessing and using the SMS Security Voicemail Service ("the Service"), you agree to be bound by these Terms and Policies. If you do not agree, you should not use the Service.'
},
{
  title: '2. Purpose & Authorised Use',
  body: 'The Service is provided to assist Mobile Patrol Supervisors and authorised security personnel in logging voicemail and patrol records. It must only be used for legitimate operational purposes by authorised staff.'
},
{
  title: '3. Data & Records',
  body: 'Records entered into the Service are sent to the authorised SMS Security Google Drive and organised by month and site. A local browser copy may also be retained for convenient viewing. You are responsible for the accuracy of the information you enter.'
},
{
  title: '4. Privacy',
  body: 'The Service sends submitted records to an authorised Google Apps Script endpoint for storage in Google Sheets. Personal data—including names, phone numbers, and vehicle details—must be handled in accordance with applicable privacy laws and your organisation’s policies.'
},
{
  title: '5. Acceptable Conduct',
  body: 'You agree not to misuse the Service, enter false or misleading information, or use it in any way that violates applicable laws or the rights of others.'
},
{
  title: '6. Limitation of Liability',
  body: 'The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, the copyright holder shall not be liable for any loss of data or damages arising from use of the Service.'
},
{
  title: '7. Changes to These Terms',
  body: 'These Terms and Policies may be updated from time to time. Continued use of the Service after changes constitutes acceptance of the revised terms.'
},
{
  title: '8. Ownership',
  body: 'All rights, title, and interest in the Service, including its design and content, are owned by Jagroop Singh. See the About & Copyright page for details.'
}];

export function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.div
        initial={{
          opacity: 0,
          y: 8
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.3
        }}>
        
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Terms &amp; Policies
        </h1>
        <p className="mt-2 text-sm text-ink/50">
          Operational use, privacy, and record-handling information
        </p>
      </motion.div>

      <div className="mt-8 space-y-4">
        {SECTIONS.map((s, i) =>
        <motion.section
          key={s.title}
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.3,
            delay: Math.min(i * 0.04, 0.3)
          }}
          className="rounded-3xl border border-black/5 bg-white p-6 shadow-card">
          
            <h2 className="text-[16px] font-bold text-ink">{s.title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink/60">
              {s.body}
            </p>
          </motion.section>
        )}
      </div>
    </div>);

}
