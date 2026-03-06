'use client'

import { useState, useCallback } from 'react'
import FileUpload from '@/components/FileUpload'
import ProofUpload from '@/components/ProofUpload'
import EmailGate from '@/components/EmailGate'
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
  const [pendingReport, setPendingReport] = useState<ValidationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataFileName, setDataFileName] = useState<string | null>(null)
  const [proofUploaded, setProofUploaded] = useState(false)
  const [emailCollected, setEmailCollected] = useState(false)

  const handleProofUpload = useCallback(async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('proof', file)
      formData.append('dataFilename', dataFileName || 'unknown')
      const response = await fetch('/api/upload-proof', { method: 'POST', body: formData })
      if (response.ok) setProofUploaded(true)
    } catch (err) {
      console.error('Proof upload failed:', err)
    }
  }, [dataFileName])

  const [gateError, setGateError] = useState<string | null>(null)

  const handleEmailSubmit = useCallback(async (email: string, name?: string, company?: string) => {
    if (!pendingReport) return
    setGateError(null)
    try {
      const res = await fetch('/api/collect-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company, filename: dataFileName }),
      })
      if (!res.ok) {
        const data = await res.json()
        setGateError(data.error || 'Unable to proceed. Please try again.')
        return
      }
      setEmailCollected(true)
      setReport(pendingReport)
    } catch (e) {
      setEmailCollected(true)
      setReport(pendingReport)
    }
  }, [pendingReport, dataFileName])

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setReport(null)
    setPendingReport(null)
    setDataFileName(file.name)
    setProofUploaded(false)
    setEmailCollected(false)

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
      setPendingReport(data) // Hold report behind email gate
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-block bg-cis-orange/10 text-cis-orange text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
          Free Tool &mdash; No Account Required
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-cis-navy mb-4 leading-tight">
          Warehouse Label<br className="hidden sm:block" /> Data Validator
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Upload your Excel data file and catch errors <strong className="text-gray-700">before</strong> they go to print.
          No more reprints. No more finger pointing. No more wasted money.
        </p>
      </div>

      {/* How it works */}
      {!report && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-up">
          <div className="stat-card group">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors">&#128196;</div>
            <h3 className="font-bold text-cis-navy mb-2 text-lg">Upload Your File</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Drop your Excel (.xlsx) or CSV data file. We auto-detect your format instantly.</p>
          </div>
          <div className="stat-card group">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-green-50 flex items-center justify-center text-2xl group-hover:bg-green-100 transition-colors">&#9889;</div>
            <h3 className="font-bold text-cis-navy mb-2 text-lg">16 Instant Checks</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Duplicates, format errors, arrow conflicts, sequence gaps, barcode validation, and more.</p>
          </div>
          <div className="stat-card group">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl group-hover:bg-orange-100 transition-colors">&#128176;</div>
            <h3 className="font-bold text-cis-navy mb-2 text-lg">Save Thousands</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Get a detailed report with exact rows and cells to fix. Prevent costly reprints.</p>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div className="animate-fade-in">
        <FileUpload onUpload={handleFileUpload} loading={loading} />
        <ProofUpload onProofUpload={handleProofUpload} disabled={loading} />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="text-xl">&#9888;&#65039;</span>
            <div>
              <p className="font-semibold">Validation Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Email Gate */}
      {pendingReport && !emailCollected && (
        <EmailGate onSubmit={handleEmailSubmit} filename={pendingReport.filename} error={gateError} />
      )}

      {/* Results */}
      {report && emailCollected && (
        <div className="animate-slide-up">
          <ValidationResults report={report} />
        </div>
      )}

      {/* Trust section */}
      {!report && !loading && (
        <div className="mt-16 animate-fade-in">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Trusted by warehouse operations nationwide</p>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-cis-navy">63.2M+</div>
              <div className="text-xs text-gray-400 mt-1 font-medium">Labels Produced</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cis-navy">576K+</div>
              <div className="text-xs text-gray-400 mt-1 font-medium">Signs Produced</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cis-navy">15+</div>
              <div className="text-xs text-gray-400 mt-1 font-medium">Years Experience</div>
            </div>
          </div>
          
          {/* Extra trust */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Your data stays private
              </span>
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Encrypted &amp; secure
              </span>
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                No account needed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
