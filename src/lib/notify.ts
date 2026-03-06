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
  name?: string
  company?: string
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
      subject: `${statusEmoji} New Scan: ${data.filename} — ${data.status} | ${data.name || 'Unknown'} @ ${data.company || 'Unknown'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background: #1B3A5C; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">New Validator Scan Complete</h2>
            <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Full cycle report — lead info + scan results</p>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            
            <!-- Lead Information -->
            <h3 style="margin: 0 0 12px 0; color: #1B3A5C; font-size: 16px; border-bottom: 2px solid #E8792B; padding-bottom: 6px;">👤 Lead Information</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              ${data.name ? `<tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">Name</td><td style="padding: 6px 0; font-weight: bold;">${data.name}</td></tr>` : ''}
              ${data.company ? `<tr><td style="padding: 6px 0; color: #6b7280;">Company</td><td style="padding: 6px 0; font-weight: bold;">${data.company}</td></tr>` : ''}
              ${data.email ? `<tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td style="padding: 6px 0;"><a href="mailto:${data.email}" style="color: #E8792B; text-decoration: none;">${data.email}</a></td></tr>` : ''}
            </table>

            <!-- Scan Results -->
            <h3 style="margin: 0 0 12px 0; color: #1B3A5C; font-size: 16px; border-bottom: 2px solid #E8792B; padding-bottom: 6px;">📊 Scan Results</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">File</td><td style="padding: 6px 0; font-weight: bold;">${data.filename}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Status</td><td style="padding: 6px 0; font-weight: bold; font-size: 16px;">${statusEmoji} ${data.status}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Sheets</td><td style="padding: 6px 0;">${data.sheets}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Labels</td><td style="padding: 6px 0;">${data.labels}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Errors</td><td style="padding: 6px 0; color: ${data.errors > 0 ? '#dc2626' : '#16a34a'}; font-weight: bold;">${data.errors}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Warnings</td><td style="padding: 6px 0; color: ${data.warnings > 0 ? '#ca8a04' : '#16a34a'};">${data.warnings}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Info</td><td style="padding: 6px 0;">${data.info}</td></tr>
              ${data.proofFilename ? `<tr><td style="padding: 6px 0; color: #6b7280;">Proof</td><td style="padding: 6px 0;">📎 ${data.proofFilename}</td></tr>` : ''}
            </table>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">CIS Label Validator — validator.innovationandsupply.com</p>
          </div>
        </div>
      `,
    })
    console.log(`[NOTIFY] Consolidated report sent to ${NOTIFICATION_EMAIL} for ${data.email}`)
  } catch (err) {
    console.error('[NOTIFY] Failed to send email:', err)
  }
}
