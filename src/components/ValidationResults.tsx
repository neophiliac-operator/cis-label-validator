'use client'

import { useState } from 'react'
import type { ValidationReport, Finding } from '@/app/page'

type Props = {
  report: ValidationReport
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    PASS: 'bg-green-100 text-green-800 border-green-200',
    PASS_WITH_WARNINGS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    FAIL: 'bg-red-100 text-red-800 border-red-200',
  }
  const labels = {
    PASS: 'PASS',
    PASS_WITH_WARNINGS: 'WARNINGS',
    FAIL: 'ERRORS FOUND',
  }
  const icons = {
    PASS: '\u2705',
    PASS_WITH_WARNINGS: '\u26A0\uFE0F',
    FAIL: '\u274C',
  }
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${colors[status as keyof typeof colors] || colors.FAIL}`}>
      {icons[status as keyof typeof icons]} {labels[status as keyof typeof labels]}
    </span>
  )
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'error') return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">✕</span>
  if (severity === 'warning') return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold">!</span>
  return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">i</span>
}

function FindingRow({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false)
  const bgColor = finding.severity === 'error' ? 'bg-red-50' : finding.severity === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
  
  return (
    <div className={`${bgColor} rounded-lg p-3 mb-2 cursor-pointer`} onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start gap-3">
        <SeverityIcon severity={finding.severity} />
        <div className="flex-1">
          <p className="text-sm text-gray-800">{finding.message}</p>
          {finding.sheet && <span className="text-xs text-gray-500">Sheet: {finding.sheet}</span>}
        </div>
        {finding.rows.length > 0 && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {finding.rows.length} row{finding.rows.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {expanded && finding.rows.length > 0 && (
        <div className="mt-2 ml-8 text-xs text-gray-500">
          Rows: {finding.rows.slice(0, 20).join(', ')}{finding.rows.length > 20 ? ` ... and ${finding.rows.length - 20} more` : ''}
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

  return (
    <div className="mt-8">
      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cis-navy">{report.filename}</h2>
            <p className="text-sm text-gray-500">
              {report.sheets_analyzed} sheet{report.sheets_analyzed !== 1 ? 's' : ''} analyzed &bull; {report.total_labels.toLocaleString()} {report.total_items_label || 'labels'}
            </p>
          </div>
          <StatusBadge status={report.status} />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{report.summary.errors}</div>
            <div className="text-xs text-red-500 font-medium">Errors</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</div>
            <div className="text-xs text-yellow-500 font-medium">Warnings</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{report.summary.info}</div>
            <div className="text-xs text-blue-500 font-medium">Info</div>
          </div>
        </div>
      </div>

      {/* Sheet profiles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-cis-navy mb-4">Auto-Detected Format</h3>
        {report.profiles.map((p, i) => (
          <div key={i} className="flex flex-wrap gap-2 mb-2">
            <span className="bg-cis-navy text-white text-xs px-2 py-1 rounded">{p.sheet}</span>
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{p.type.replace('_', ' ')}</span>
            {p.symbology !== 'unknown' && (
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{p.symbology.replace('_', ' ')}</span>
            )}
            {p.delimiter !== 'unknown' && (
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{p.delimiter} delimiter</span>
            )}
            {p.is_totem && (
              <span className="bg-cis-orange text-white text-xs px-2 py-1 rounded">{p.totem_levels}-level totem</span>
            )}
            {p.has_color_coding && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">color coded</span>
            )}
            <span className="text-xs text-gray-400 py-1">{p.rows.toLocaleString()} rows</span>
          </div>
        ))}
      </div>

      {/* Findings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-cis-navy">Findings</h3>
          <div className="flex gap-1">
            {(['all', 'errors', 'warnings', 'info'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTab === tab ? 'bg-cis-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'all' ? `All (${report.findings.length})` :
                 tab === 'errors' ? `Errors (${report.summary.errors})` :
                 tab === 'warnings' ? `Warnings (${report.summary.warnings})` :
                 `Info (${report.summary.info})`}
              </button>
            ))}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredFindings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No findings in this category</p>
          ) : (
            filteredFindings.map((f, i) => <FindingRow key={i} finding={f} />)
          )}
        </div>
      </div>

      {/* CTA */}
      {report.status !== 'PASS' && (
        <div className="mt-8 bg-cis-navy rounded-xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Need help fixing these issues?</h3>
          <p className="text-gray-300 mb-4">
            CIS offers complete warehouse labeling services — from data validation to printing to installation.
          </p>
          <a
            href="mailto:keaton@innovationandsupply.com?subject=Label%20Validation%20Results"
            className="inline-block bg-cis-orange hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Contact CIS for a Quote
          </a>
        </div>
      )}
    </div>
  )
}
