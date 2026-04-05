import Link from 'next/link'

const externalLinks = [
  { label: 'GitHub', href: 'https://github.com/Hanseooo' },
  { label: 'Portfolio', href: 'http://hanseoo.vercel.app/' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/hanseooo' },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-400">
            ClinicalScribe. Educational tool for nursing students.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-400">
              Developed by Hanseo
            </p>
            <div className="flex gap-3">
              {externalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 transition-colors hover:text-teal-600"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
