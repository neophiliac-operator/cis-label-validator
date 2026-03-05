'use client'

import { useState } from 'react'
import type { ValidationReport, Finding } from '@/app/page'

type Props = {
  report: ValidationReport
}

function StatusBanner({ status }: { status: string }) {
  const config = {
    PASS: { bg: 'from-green-500 to-emerald-600', icon: '&#10004;', label: 'ALL CHECKS PASSED', sub: 'Your data looks great! Ready for print.' },
    PASS_WITH_WARNINGS: { bg: 'from-yellow-500 to-amber-600', icon: '&#9888;&#65039;', label: 'PASSED WITH WARNINGS', sub: 'Review the warnings below before printing.' },
    FAIL: { bg: 'from-red-500 to-rose-600', icon: '&#10060;', label: 'ERRORS FOUND', sub: 'Fix the issues below before sending to print.' },
  }
  const c = config[status as keyof typeof config] || config.FAIL
  return (
    <div className={`bg-gradient-to-r ${c.bg} rounded-2xl p-6 text-white shadow-lg mb-6`}>
      <div className="flex items-center gap-4">
        <span className="text-4xl" dangerouslySetInnerHTML={{ __html: c.icon }} />
        <div>
          <h2 className="text-xl font-bold tracking-tight">{c.label}</h2>
          <p className="text-white/80 text-sm mt-0.5">{c.sub}</p>
        </div>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'error') return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    </span>
  )
  if (severity === 'warning') return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    </span>
  )
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </span>
  )
}

function FindingRow({ finding, index }: { finding: Finding; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const borderColor = finding.severity === 'error' ? 'border-l-red-500 bg-red-50/50' : finding.severity === 'warning' ? 'border-l-yellow-500 bg-yellow-50/50' : 'border-l-blue-500 bg-blue-50/50'
  
  return (
    <div 
      className={`border-l-4 ${borderColor} rounded-r-xl p-4 mb-3 cursor-pointer hover:shadow-md transition-all duration-200`} 
      onClick={() => setExpanded(!expanded)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <SeverityBadge severity={finding.severity} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium leading-snug">{finding.message}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {finding.sheet && (
              <span className="inline-flex items-center text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {finding.sheet}
              </span>
            )}
            {finding.rows.length > 0 && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                {finding.rows.length} row{finding.rows.length !== 1 ? 's' : ''} affected
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </span>
            )}
          </div>
        </div>
      </div>
      {expanded && finding.rows.length > 0 && (
        <div className="mt-3 ml-10 bg-white rounded-lg p-3 border border-gray-100 text-xs text-gray-600 font-mono">
          Rows: {finding.rows.slice(0, 30).join(', ')}{finding.rows.length > 30 ? ` ... and ${finding.rows.length - 30} more` : ''}
        </div>
      )}
    </div>
  )
}

export default function ValidationResults({ report }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'warnings' | 'info'>('all')
  
  const filteredFindings = report.findings.filter(f => {
    if (activeTab === 'all') return true
    if (activeTab === 'errors') return f.severity === 'error'
    if (activeTab === 'warnings') return f.severity === 'warning'
    return f.severity === 'info'
  })

  const itemLabel = report.total_items_label || 'labels'

  return (
    <div className="mt-8">
      {/* Status banner */}
      <StatusBanner status={report.status} />

      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-cis-navy flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {report.filename}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {report.sheets_analyzed} sheet{report.sheets_analyzed !== 1 ? 's' : ''} analyzed &bull; {report.total_labels.toLocaleString()} {itemLabel}
            </p>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`rounded-xl p-4 text-center transition-all duration-300 ${report.summary.errors > 0 ? 'bg-red-50 ring-2 ring-red-200' : 'bg-gray-50'}`}>
            <div className={`text-3xl font-bold ${report.summary.errors > 0 ? 'text-red-600' : 'text-gray-300'}`}>{report.summary.errors}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Errors</div>
          </div>
          <div className={`rounded-xl p-4 text-center transition-all duration-300 ${report.summary.warnings > 0 ? 'bg-yellow-50 ring-2 ring-yellow-200' : 'bg-gray-50'}`}>
            <div className={`text-3xl font-bold ${report.summary.warnings > 0 ? 'text-yellow-600' : 'text-gray-300'}`}>{report.summary.warnings}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Warnings</div>
          </div>
          <div className="rounded-xl p-4 text-center bg-blue-50">
            <div className="text-3xl font-bold text-blue-600">{report.summary.info}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Info</div>
          </div>
        </div>
      </div>

      {/* Auto-detected format */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
        <h3 className="font-bold text-cis-navy mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-cis-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          Auto-Detected Format
        </h3>
        <div className="space-y-3">
          {report.profiles.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-50 last:border-0">
              <span className="bg-cis-navy text-white text-xs px-3 py-1 rounded-lg font-semibold">{p.sheet}</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium">{p.type.replace(/_/g, ' ')}</span>
              {p.symbology !== 'unknown' && (
                <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-lg font-medium">{p.symbology.replace(/_/g, ' ')}</span>
              )}
              {p.delimiter !== 'unknown' && (
                <span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-lg font-medium">{p.delimiter} delimited</span>
              )}
              {p.is_totem && (
                <span className="bg-cis-orange/10 text-cis-orange text-xs px-2.5 py-1 rounded-lg font-bold">{p.totem_levels}-level totem</span>
              )}
              {p.has_color_coding && (
                <span className="bg-pink-50 text-pink-700 text-xs px-2.5 py-1 rounded-lg font-medium">color coded</span>
              )}
              <span className="text-xs text-gray-400 ml-auto font-medium">{p.rows.toLocaleString()} rows</span>
            </div>
          ))}
        </div>
      </div>

      {/* Findings */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-cis-navy flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Detailed Findings
          </h3>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'errors', 'warnings', 'info'] as const).map(tab => {
              const count = tab === 'all' ? report.findings.length : 
                tab === 'errors' ? report.summary.errors :
                tab === 'warnings' ? report.summary.warnings : report.summary.info
              const activeStyles = tab === 'errors' ? 'bg-red-600 text-white shadow-md' :
                tab === 'warnings' ? 'bg-yellow-500 text-white shadow-md' :
                tab === 'info' ? 'bg-blue-600 text-white shadow-md' : 'bg-cis-navy text-white shadow-md'
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === tab ? activeStyles : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                </button>
              )
            })}
          </div>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto findings-scroll pr-1">
          {filteredFindings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">&#127881;</div>
              <p className="text-gray-400 font-medium">No findings in this category</p>
            </div>
          ) : (
            filteredFindings.map((f, i) => <FindingRow key={i} finding={f} index={i} />)
          )}
        </div>
      </div>

      {/* CTA */}
      {report.status !== 'PASS' && (
        <div className="mt-8 gradient-navy rounded-2xl p-8 text-center text-white shadow-xl animate-pulse-glow">
          <div className="text-3xl mb-3">&#128640;</div>
          <h3 className="text-2xl font-bold mb-2">Need Help Fixing These Issues?</h3>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            CIS offers complete warehouse labeling services &mdash; from data validation to printing to nationwide installation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:keaton@innovationandsupply.com?subject=Label%20Validation%20Results"
              className="inline-block bg-cis-orange hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
            >
              Get a Free Quote
            </a>
            <a href="tel:7705615285" className="text-gray-300 hover:text-white text-sm transition-colors">
              or call (770) 561-5285
            </a>
          </div>
        </div>
      )}

      {/* Pass CTA */}
      {report.status === 'PASS' && (
        <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <div className="text-4xl mb-3">&#127881;</div>
          <h3 className="text-2xl font-bold mb-2">Your Data is Clean!</h3>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Ready to go to print. Need labels, signs, or installation services?
          </p>
          <a
            href="mailto:keaton@innovationandsupply.com?subject=Ready%20to%20Print%20-%20Label%20Order"
            className="inline-block bg-white text-green-700 font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
          >
            Request a Quote from CIS
          </a>
        </div>
      )}
    </div>
  )
}
