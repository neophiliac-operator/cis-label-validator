'use client'

import { useCallback, useState, useRef } from 'react'

type Props = {
  onUpload: (file: File) => void
  loading: boolean
}

export default function FileUpload({ onUpload, loading }: Props) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setFileName(file.name)
        onUpload(file)
      }
    }
  }, [onUpload])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFileName(file.name)
      onUpload(file)
    }
  }, [onUpload])

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl p-14 text-center transition-all duration-300 cursor-pointer
        ${dragActive ? 'border-cis-orange bg-orange-50 scale-[1.01] shadow-lg' : 'border-gray-200 bg-white hover:border-cis-navy hover:bg-gray-50 hover:shadow-md'}
        ${loading ? 'pointer-events-none' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />
      
      {loading ? (
        <div className="py-4">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-cis-navy border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-cis-orange/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-xl font-bold text-cis-navy mb-1">Analyzing {fileName}...</p>
          <p className="text-sm text-gray-500">Auto-detecting format &amp; running 16 validation checks</p>
          <div className="mt-6 flex justify-center gap-8">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              Format Detection
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              Barcode Validation
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              Duplicate Scan
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cis-navy/5 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-cis-navy/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-xl font-bold text-cis-navy mb-2">
            {fileName ? `Upload Another File` : 'Drop your data file here'}
          </p>
          <p className="text-sm text-gray-400">
            or <span className="text-cis-orange font-semibold hover:underline">click to browse</span>
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <span className="inline-flex items-center text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">.xlsx</span>
            <span className="inline-flex items-center text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">.xls</span>
            <span className="inline-flex items-center text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">.csv</span>
          </div>
          <p className="text-[11px] text-gray-300 mt-4">
            All data stays private and secure. Files are processed server-side and never stored.
          </p>
        </div>
      )}
    </div>
  )
}
