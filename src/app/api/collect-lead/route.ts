import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkEmailAllowed, checkIpAllowed } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 'unknown'
    const { email, name, company, filename } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Check IP ban/rate limit
    const ipCheck = await checkIpAllowed(ip)
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: ipCheck.reason }, { status: 429 })
    }

    // Check email ban/rate limit/disposable
    const emailCheck = await checkEmailAllowed(email.toLowerCase())
    if (!emailCheck.allowed) {
      return NextResponse.json({ error: emailCheck.reason }, { status: 403 })
    }

    // Store lead
    const { error } = await supabase.from('leads').insert({
      email: email.toLowerCase(),
      name: name || null,
      company: company || null,
      filename: filename || null,
      source: 'validator',
      ip_address: ip,
    })

    if (error) console.error('[LEAD] DB error:', error)
    else console.log(`[LEAD] Captured: ${email} (${company || 'no company'}) from ${ip}`)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[LEAD ERROR]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
