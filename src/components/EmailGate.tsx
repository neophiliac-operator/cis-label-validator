'use client'

import { useState } from 'react'

interface EmailGateProps {
  onSubmit: (email: string, name?: string, company?: string) => void
  filename: string
}

export default function EmailGate({ onSubmit, filename }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    onSubmit(email, name || undefined, company || undefined)
  }

  return (
    <div className="mt-8 animate-slide-up">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cis-navy to-cis-navy/90 px-6 py-5 text-white text-center">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-lg font-bold">Validation Complete!</h3>
            <p className="text-sm text-white/70 mt-1">
              Your report for <span className="font-semibold text-white/90">{filename}</span> is ready
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-500 text-center mb-2">
              Enter your email to view your detailed validation report
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cis-orange focus:ring-2 focus:ring-cis-orange/20 outline-none transition-all text-sm"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Name <span className="text-gray-300">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cis-orange focus:ring-2 focus:ring-cis-orange/20 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Company <span className="text-gray-300">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Warehousing"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cis-orange focus:ring-2 focus:ring-cis-orange/20 outline-none transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cis-orange hover:bg-cis-orange/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm uppercase tracking-wider"
            >
              View My Report →
            </button>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              Your data is secure and will not be shared. We may send you helpful tips about label data quality.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
