import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('proof') as File
    const dataFilename = formData.get('dataFilename') as string || 'unknown'

    if (!file) {
      return NextResponse.json({ error: 'No proof file uploaded' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 50MB.' }, { status: 400 })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const safeDataName = dataFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${timestamp}_${safeDataName}_PROOF_${safeName}`
    
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('proofs')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('[PROOF] Storage upload failed:', error)
      return NextResponse.json({ error: 'Failed to store proof file' }, { status: 500 })
    }

    console.log(`[PROOF] ${storagePath} (${(file.size / 1024).toFixed(1)} KB) → Supabase Storage`)

    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      pairedWith: dataFilename,
    })
  } catch (err: any) {
    console.error('[PROOF ERROR]', err)
    return NextResponse.json({ error: 'Failed to upload proof file' }, { status: 500 })
  }
}
