import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'keaton@innovationandsupply.com'

export async function notifyUpload(data: {
  filename: string
  status: string
  errors: number
  warnings: number
  info: number
  sheets: number
  labels: number
  email?: string
  proofFilename?: string
}) {
  if (!resend || process.env.RESEND_API_KEY === 'placeholder_keaton_will_provide') {
    console.log('[NOTIFY] Resend not configured — skipping email notification')
    return
  }

  const statusEmoji = data.status === 'PASS' ? '✅' : data.status === 'FAIL' ? '❌' : '⚠️'
  
  try {
    await resend.emails.send({
      from: 'CIS Validator <notifications@innovationandsupply.com>',
      to: NOTIFICATION_EMAIL,
      subject: `${statusEmoji} Validator Upload: ${data.filename} — ${data.status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background: #1B3A5C; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">New Validator Upload</h2>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280;">File</td><td style="padding: 8px 0; font-weight: bold;">${data.filename}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Status</td><td style="padding: 8px 0; font-weight: bold;">${statusEmoji} ${data.status}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Sheets</td><td style="padding: 8px 0;">${data.sheets}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Labels</td><td style="padding: 8px 0;">${data.labels}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Errors</td><td style="padding: 8px 0; color: ${data.errors > 0 ? '#dc2626' : '#16a34a'};">${data.errors}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Warnings</td><td style="padding: 8px 0; color: ${data.warnings > 0 ? '#ca8a04' : '#16a34a'};">${data.warnings}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Info</td><td style="padding: 8px 0;">${data.info}</td></tr>
              ${data.email ? `<tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;">${data.email}</td></tr>` : ''}
              ${data.proofFilename ? `<tr><td style="padding: 8px 0; color: #6b7280;">Proof</td><td style="padding: 8px 0;">${data.proofFilename}</td></tr>` : ''}
            </table>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">CIS Label Validator — validator.innovationandsupply.com</p>
          </div>
        </div>
      `,
    })
    console.log(`[NOTIFY] Email sent to ${NOTIFICATION_EMAIL}`)
  } catch (err) {
    console.error('[NOTIFY] Failed to send email:', err)
  }
}
