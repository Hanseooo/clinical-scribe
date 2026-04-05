import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Footer } from '@/components/layout/Footer'

const steps = [
  {
    number: '01',
    title: 'Record or Type',
    description:
      'Record a clinical handover in-browser, upload an audio file, or paste typed notes directly.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'AI Structures',
    description:
      'AI transcribes and organizes your input into a structured ISBAR, SBAR, or ISOBAR format.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Review & Export',
    description:
      'Edit the generated handover, review safety-highlighted values, then export as Markdown or PDF.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
]

const templates = [
  { id: 'SBAR', sections: 'Situation, Background, Assessment, Recommendation' },
  { id: 'ISBAR', sections: 'Identity, Situation, Background, Assessment, Recommendation', default: true },
  { id: 'ISOBAR', sections: 'Identity, Situation, Observations, Background, Assessment, Recommendation' },
]

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-50">
        {/* Subtle dot pattern background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #0D9488 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:pb-32 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
            >
              Built for nursing students
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Clinical handovers,{' '}
              <span className="text-teal-600">structured</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl">
              Record a patient handover or paste your notes to get a clean, structured
              ISBAR document in seconds. Safety-critical values highlighted for review.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-teal-600 px-7 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md active:scale-[0.98]"
              >
                Start Scribing
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mb-14 text-center">
            <p className="font-heading text-sm font-semibold uppercase tracking-widest text-teal-600">
              How It Works
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to a structured handover
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                {/* Connector line between steps (hidden on mobile) */}
                {i < steps.length - 1 && (
                  <div className="absolute left-full top-10 hidden h-px w-8 -translate-y-1/2 bg-slate-200 sm:block" style={{ transform: 'translateX(-1rem) translateY(-50%)' }} />
                )}
                <div className="rounded-xl border border-slate-200 bg-stone-50/50 p-6 transition-all hover:border-teal-200 hover:bg-teal-50/30 hover:shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600 text-white">
                    {step.icon}
                  </div>
                  <div className="mb-1 font-mono text-xs font-medium text-teal-600">
                    Step {step.number}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Templates */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mb-14 text-center">
            <p className="font-heading text-sm font-semibold uppercase tracking-widest text-teal-600">
              Handover Templates
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Choose your format
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              Switch between templates anytime. ISBAR is the default and most common in Philippine nursing curricula.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className="relative rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-teal-200 hover:shadow-sm"
              >
                {t.default && (
                  <Badge className="absolute -right-1 -top-2 bg-teal-600 text-[10px] font-medium text-white">
                    Default
                  </Badge>
                )}
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {t.id}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {t.sections}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Safety */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Safety-first by design
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-500">
              Every dosage, vital sign, and time value is automatically highlighted for
              manual verification. AI flags uncertain content with <code className="rounded bg-red-50 px-1.5 py-0.5 text-sm font-medium text-red-600">[VERIFY]</code> tags.
              Nothing goes unchecked.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-stone-50 px-6 py-14 text-center sm:px-12 sm:py-16">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Ready to try it?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-500">
              No signup, no account needed. Just open the app and start documenting.
            </p>
            <Link
              href="/app"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-teal-600 px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md active:scale-[0.98]"
            >
              Open ClinicalScribe
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
