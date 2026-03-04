import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CIS Label Validator | Country Innovation & Supply',
  description: 'Validate your warehouse label data files before they go to print. Catch errors, prevent reprints, save money.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cis-light min-h-screen">
        <nav className="bg-cis-navy text-white px-6 py-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cis-orange rounded-sm flex items-center justify-center font-bold text-sm">CIS</div>
              <span className="text-lg font-semibold">Label Validator</span>
            </div>
            <div className="text-sm text-gray-300">
              Powered by Country Innovation & Supply
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="bg-cis-dark text-gray-400 text-center py-6 text-sm mt-12">
          <p>&copy; 2026 Country Innovation & Supply, LLC. All rights reserved.</p>
          <p className="mt-1">
            <a href="https://innovationandsupply.com" className="text-cis-orange hover:underline">innovationandsupply.com</a>
            {' '}&bull;{' '}
            <a href="tel:7705615285" className="hover:text-white">(770) 561-5285</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
