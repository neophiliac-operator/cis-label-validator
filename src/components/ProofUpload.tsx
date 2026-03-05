'use client'

import { useCallback, useState, useRef } from 'react'

type Props = {
  onProofUpload: (file: File) => void
  disabled?: boolean
}

export default function ProofUpload({ onProofUpload, disabled }: Props) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.gif,.docx,.doc'

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setFileName(file.name)
      setUploaded(true)
      onProofUpload(file)
    }
  }, [onProofUpload])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFileName(file.name)
      setUploaded(true)
      onProofUpload(file)
    }
  }, [onProofUpload])

  return (
    <div className="mt-4">
      <div
        className={`
          relative border border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer
          ${disabled ? 'opacity-40 pointer-events-none' : ''}
          ${uploaded ? 'border-green-300 bg-green-50/50' : dragActive ? 'border-cis-orange bg-orange-50/50' : 'border-gray-200 bg-white/50 hover:border-gray-300 hover:bg-gray-50/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleChange}
          className="hidden"
        />
        
        {uploaded ? (
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold text-green-700">Proof attached: {fileName}</p>
              <p className="text-xs text-green-500">Click to replace</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-left">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-600">Attach proof file</span> (PDF, image, or Word) &mdash; <span className="text-gray-400 italic">optional</span>
              </p>
              <p className="text-xs text-gray-400">Helps us cross-reference your data against the visual proof</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
