import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { notifyUpload } from '@/lib/notify'

export async function POST(request: NextRequest) {
  try {
    const { email, name, company, filename } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Store lead in Supabase
    const { error } = await supabase.from('leads').insert({
      email,
      name: name || null,
      company: company || null,
      filename: filename || null,
      source: 'validator',
    })

    if (error) console.error('[LEAD] DB error:', error)
    else console.log(`[LEAD] Captured: ${email} (${company || 'no company'})`)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[LEAD ERROR]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
