import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Simple admin endpoint protected by a secret header
// Usage: curl -X POST https://validator.innovationandsupply.com/api/admin/ban \
//   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
//   -H "Content-Type: application/json" \
//   -d '{"type": "email", "value": "spammer@competitor.com", "reason": "Competitor abuse"}'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, value, reason } = await request.json()
  if (!value) {
    return NextResponse.json({ error: 'Value required (email, domain, or IP)' }, { status: 400 })
  }

  const { error } = await supabase.from('banned').insert({
    type: type || 'email',
    value: value.toLowerCase(),
    reason: reason || null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, banned: value })
}

// List all bans
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('banned')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bans: data })
}

// Unban
export async function DELETE(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { value } = await request.json()
  if (!value) return NextResponse.json({ error: 'Value required' }, { status: 400 })

  const { error } = await supabase
    .from('banned')
    .delete()
    .eq('value', value.toLowerCase())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, unbanned: value })
}
