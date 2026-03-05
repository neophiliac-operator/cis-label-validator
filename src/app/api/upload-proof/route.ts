import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('proof') as File
    const dataFilename = formData.get('dataFilename') as string || 'unknown'

    if (!file) {
      return NextResponse.json({ error: 'No proof file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, image, or Word document.' }, { status: 400 })
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 50MB.' }, { status: 400 })
    }

    // Save to /tmp/proofs/ (ephemeral on Render, but we'll move to Supabase storage later)
    const uploadsDir = path.join('/tmp', 'proofs')
    await mkdir(uploadsDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const safeDataName = dataFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${timestamp}_${safeDataName}_PROOF_${safeName}`
    
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadsDir, filename), buffer)

    console.log(`[PROOF UPLOAD] ${filename} (${(file.size / 1024).toFixed(1)} KB) — paired with data file: ${dataFilename}`)

    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      pairedWith: dataFilename,
    })
  } catch (err: any) {
    console.error('[PROOF UPLOAD ERROR]', err)
    return NextResponse.json({ error: 'Failed to upload proof file' }, { status: 500 })
  }
}
