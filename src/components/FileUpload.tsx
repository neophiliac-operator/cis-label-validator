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
        relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
        ${dragActive ? 'border-cis-orange bg-orange-50' : 'border-gray-300 bg-white hover:border-cis-navy hover:bg-gray-50'}
        ${loading ? 'opacity-60 pointer-events-none' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />
      
      {loading ? (
        <div>
          <div className="animate-spin w-12 h-12 border-4 border-cis-navy border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-cis-navy">Validating {fileName}...</p>
          <p className="text-sm text-gray-500 mt-2">Auto-detecting format and running 16 checks</p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 inline-block">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Heads up:</span> First analysis may take up to 60 seconds while our server wakes up. Hang tight — it&apos;s working!
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-5xl mb-4">&#128196;</div>
          <p className="text-lg font-semibold text-cis-navy mb-2">
            {fileName ? `Replace ${fileName}` : 'Drop your Excel file here'}
          </p>
          <p className="text-sm text-gray-500">
            or <span className="text-cis-orange font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Supports .xlsx, .xls, and .csv files. All data stays private and secure.
          </p>
        </div>
      )}
    </div>
  )
}
