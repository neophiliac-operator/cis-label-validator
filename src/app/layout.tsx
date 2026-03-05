import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CIS Label Validator | Country Innovation & Supply',
  description: 'Validate your warehouse label data files before they go to print. Catch errors, prevent reprints, save money.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cis-light min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="gradient-navy text-white px-6 py-4 shadow-xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/cis-logo.png" alt="Country Innovation &amp; Supply" className="h-10 w-auto brightness-0 invert" />
              <div className="hidden sm:block border-l border-white/30 pl-3 ml-1">
                <span className="text-lg font-semibold tracking-tight">Label Validator</span>
                <span className="block text-[10px] text-gray-300 -mt-0.5 font-light tracking-wider uppercase">Powered by CIS</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:7705615285" className="hidden md:flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                (770) 561-5285
              </a>
              <a
                href="https://innovationandsupply.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cis-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Visit CIS
              </a>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="gradient-navy text-gray-400 py-8 mt-auto">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/cis-logo.png" alt="CIS" className="h-8 w-auto brightness-0 invert opacity-60" />
                <div className="text-sm">
                  <p className="text-gray-300 font-medium">Country Innovation &amp; Supply, LLC</p>
                  <p className="text-xs text-gray-500">Warehouse Identification &amp; Labeling Experts</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <a href="https://innovationandsupply.com" className="text-cis-orange hover:underline" target="_blank" rel="noopener noreferrer">innovationandsupply.com</a>
                <span className="text-gray-600">|</span>
                <a href="tel:7705615285" className="hover:text-white transition-colors">(770) 561-5285</a>
                <span className="text-gray-600">|</span>
                <a href="mailto:keaton@innovationandsupply.com" className="hover:text-white transition-colors">Email Us</a>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-6 pt-4 text-center text-xs text-gray-500">
              &copy; 2026 Country Innovation &amp; Supply, LLC. All rights reserved. | Women-Owned Small Business (WOSB)
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
