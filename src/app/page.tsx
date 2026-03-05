'use client'

import { useState, useCallback } from 'react'
import FileUpload from '@/components/FileUpload'
import ValidationResults from '@/components/ValidationResults'

export type Finding = {
  severity: 'error' | 'warning' | 'info'
  check: string
  message: string
  sheet: string
  rows: number[]
}

export type SheetProfile = {
  sheet: string
  type: string
  rows: number
  symbology: string
  delimiter: string
  arrow_format: string
  is_totem: boolean
  totem_levels: number
  bc_equals_hr: boolean
  has_color_coding: boolean
}

export type ValidationReport = {
  filename: string
  status: 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL'
  total_items_label?: string
  sheets_analyzed: number
  total_labels: number
  summary: { errors: number; warnings: number; info: number }
  profiles: SheetProfile[]
  findings: Finding[]
}

export default function Home() {
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Validation failed')
      }

      const data = await response.json()
      setReport(data)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-cis-navy mb-4">
          Warehouse Label Data Validator
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your Excel data file and catch errors <strong>before</strong> they go to print.
          No more reprints. No more finger pointing. No more wasted money.
        </p>
      </div>

      {/* How it works */}
      {!report && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-3">1&#xFE0F;&#x20E3;</div>
            <h3 className="font-semibold text-cis-navy mb-2">Upload Your File</h3>
            <p className="text-sm text-gray-500">Drop your Excel (.xlsx) or CSV data file. We auto-detect the format.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-3">2&#xFE0F;&#x20E3;</div>
            <h3 className="font-semibold text-cis-navy mb-2">Instant Validation</h3>
            <p className="text-sm text-gray-500">16 checks run in seconds: duplicates, format errors, arrow conflicts, sequence gaps, and more.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-3">3&#xFE0F;&#x20E3;</div>
            <h3 className="font-semibold text-cis-navy mb-2">Fix Before Print</h3>
            <p className="text-sm text-gray-500">Get a detailed report with exact rows and cells to fix. Save thousands on reprints.</p>
          </div>
        </div>
      )}

      {/* Upload area */}
      <FileUpload onUpload={handleFileUpload} loading={loading} />

      {/* Error */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {report && <ValidationResults report={report} />}

      {/* Trust badges */}
      {!report && (
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400 mb-4">Trusted by warehouse operations nationwide</p>
          <div className="flex justify-center gap-8 text-gray-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-cis-navy">63.2M+</div>
              <div className="text-xs">Labels Produced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cis-navy">576K+</div>
              <div className="text-xs">Signs Produced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cis-navy">15+</div>
              <div className="text-xs">Years Experience</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
