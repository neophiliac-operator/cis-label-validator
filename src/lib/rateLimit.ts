import { supabase } from './supabase'

// Disposable/temp email domains to block
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.de',
  'tempail.com', 'temp-mail.org', 'temp-mail.io', 'fakeinbox.com',
  'dispostable.com', 'trashmail.com', 'trashmail.me', 'trashmail.net',
  'maildrop.cc', 'mailnesia.com', 'mailcatch.com', 'mintemail.com',
  'getnada.com', 'emailondeck.com', '10minutemail.com', 'mohmal.com',
  'burnermail.io', 'harakirimail.com', 'tempinbox.com', 'discard.email',
  'mailsac.com', 'mytemp.email', 'tempr.email', 'inboxbear.com',
  'spamgourmet.com', 'jetable.org', 'trash-mail.com', 'anonbox.net',
  'bugmenot.com', 'mailnull.com', 'binkmail.com', 'safetymail.info',
])

const MAX_SCANS_PER_IP_PER_DAY = 5
const MAX_SCANS_PER_EMAIL_PER_DAY = 3

export type GateResult = {
  allowed: boolean
  reason?: string
}

export async function checkEmailAllowed(email: string): Promise<GateResult> {
  const domain = email.split('@')[1]?.toLowerCase()

  // Block disposable emails
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) {
    return { allowed: false, reason: 'Please use a valid business or personal email address.' }
  }

  // Check if email is banned
  const { data: banned } = await supabase
    .from('banned')
    .select('id')
    .or(`value.eq.${email.toLowerCase()},value.eq.${domain}`)
    .limit(1)

  if (banned && banned.length > 0) {
    return { allowed: false, reason: 'This email has been restricted. Contact support@innovationandsupply.com for assistance.' }
  }

  // Check email rate limit
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: emailCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .gte('created_at', dayAgo)

  if ((emailCount || 0) >= MAX_SCANS_PER_EMAIL_PER_DAY) {
    return { allowed: false, reason: `Daily scan limit reached for this email. Try again tomorrow or contact us for unlimited access.` }
  }

  return { allowed: true }
}

export async function checkIpAllowed(ip: string): Promise<GateResult> {
  // Check if IP is banned
  const { data: banned } = await supabase
    .from('banned')
    .select('id')
    .eq('value', ip)
    .limit(1)

  if (banned && banned.length > 0) {
    return { allowed: false, reason: 'Access restricted. Contact support@innovationandsupply.com for assistance.' }
  }

  // Check IP rate limit
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('validation_uploads')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', dayAgo)

  if ((count || 0) >= MAX_SCANS_PER_IP_PER_DAY) {
    return { allowed: false, reason: 'Daily scan limit reached. Contact us for unlimited access.' }
  }

  return { allowed: true }
}
