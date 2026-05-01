import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Footer } from '@/components/layout/Footer'

const techStack = [
  { layer: 'Framework', tool: 'Next.js 16 (App Router)', detail: 'Full-stack React, Vercel-native' },
  { layer: 'AI Model', tool: 'Gemini 2.5 Flash', detail: 'Native audio + text, generous free tier' },
  { layer: 'AI Orchestration', tool: 'LangChain.js', detail: 'Clean chain abstraction, prompt templates' },
  { layer: 'UI', tool: 'shadcn/ui + Tailwind CSS', detail: 'Headless, composable, accessible' },
  { layer: 'Audio', tool: 'ffmpeg.wasm (Web Worker)', detail: 'Client-side conversion to 16kHz mono .wav' },
  { layer: 'Editor', tool: 'Tiptap v3', detail: 'WYSIWYG rich-text editing with Markdown as source of truth' },
  { layer: 'Export', tool: 'Browser print + Blob', detail: 'Zero-dependency PDF and Markdown export' },
]

const flowSteps = [
  {
    title: 'Input',
    description: 'Students record a patient handover using their browser microphone, upload an existing audio file, or type/paste clinical notes directly into the app.',
    detail: 'Audio is converted client-side via ffmpeg.wasm. No server processing needed. Text goes directly to the AI pipeline.',
  },
  {
    title: 'AI Processing',
    description: 'The input is sent to a single Next.js API route that calls AI for processing.',
    detail: 'Audio gets transcribed AND structured in one call. Text skips transcription and goes straight to structuring. Both paths return the same output format.',
  },
  {
    title: 'Review & Export',
    description: 'The generated handover appears as editable markdown with safety-critical values highlighted.',
    detail: 'Students can edit in the Edit tab, review highlights in Preview, then export as Markdown or PDF. Everything is session-only. Nothing is stored.',
  },
]

export const metadata = {
  title: 'About',
  description: 'Learn about ClinicalScribe. How it works, the tech stack, and its purpose.',
}

export default function AboutPage() {
  return (
    <div className="bg-stone-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #0D9488 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="font-heading text-sm font-semibold uppercase tracking-widest text-teal-600">
              About ClinicalScribe
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Better handovers, better patient care
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-500">
              A free, open tool built to help nursing students practice structured clinical
              handover documentation and develop the habit of double-checking critical values.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Purpose */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Why this exists
              </h2>
              <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Clinical handovers are one of the most critical communication moments in healthcare.
                  As of 2024, the FDAR (Focus, Data, Action, Response) format is the recommended national standard for nursing handovers in the Philippines, per updated hospital policies and curricula. Poorly structured handovers, regardless of format, lead to missed information, delayed interventions, and patient harm.
                </p>
                <p>
ClinicalScribe was built specifically for <strong className="font-medium text-slate-800">Philippine nursing students</strong>.
They are the primary users who need to practice FDAR, ISBAR, SBAR, and ISOBAR formats regularly. FDAR (Focus, Data, Action, Response) is now the 2024 recommended default in most PH hospitals and nursing schools, as endorsed by official guidelines and curricula.
                </p>
                <p>
                  The tool lets students record real or simulated handover scenarios, get instant
                  output in the default FDAR format (or ISBAR/SBAR/ISOBAR if selected), and most importantly, learn to identify and verify
                  safety-critical information like dosages, vital signs, and unclear values.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-heading text-lg font-semibold text-slate-900">
                Design Principles
              </h3>
              <ul className="mt-4 space-y-3">
                {[
                  ['Free tier only', 'No paid APIs, no subscriptions, no paywalls'],
                  ['Privacy-first', 'No database, no auth, no data stored. Session only'],
                  ['Safety-forward', 'Every critical value highlighted for manual verification'],
                  ['Educational use', 'Not a clinical tool. Always verify with an instructor'],
                  ['Open & extensible', 'Modular design, easy to add templates or features'],
                ].map(([title, desc]) => (
                  <li key={title} className="flex gap-3">
                    <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-600" />
                    <div>
                      <span className="text-sm font-medium text-slate-800">{title}</span>
                      <p className="text-sm text-slate-500">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* How It Works - Detailed */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mb-12">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
How it works — why FDAR is default
            </h2>
            <p className="mt-3 text-slate-500">
              From input to export, here’s what happens at each step. As of 2024, FDAR is set as the default for this tool: FDAR (Focus, Data, Action, Response) puts problem focus and action-planning at the center, and is the recommended template in most modern PH nursing education/clinical settings. You can still select ISBAR, SBAR, or ISOBAR if your rotation/instructor requires.
            </p>
          </div>

          <div className="space-y-8">
            {flowSteps.map((step, i) => (
              <div key={step.title} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  {i < flowSteps.length - 1 && (
                    <div className="mt-2 h-full w-px bg-slate-200" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-heading text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Tech Stack */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 className="mb-10 font-heading text-2xl font-bold tracking-tight text-slate-900">
            Tech Stack
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-stone-50/50">
                  <th className="px-5 py-3 text-left font-medium text-slate-500">Layer</th>
                  <th className="px-5 py-3 text-left font-medium text-slate-500">Technology</th>
                  <th className="hidden px-5 py-3 text-left font-medium text-slate-500 sm:table-cell">Why</th>
                </tr>
              </thead>
              <tbody>
                {techStack.map((item, i) => (
                  <tr key={item.layer} className={i < techStack.length - 1 ? 'border-b border-slate-100' : ''}>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{item.layer}</td>
                    <td className="px-5 py-3.5 text-slate-600">{item.tool}</td>
                    <td className="hidden px-5 py-3.5 text-slate-500 sm:table-cell">{item.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Separator />

      {/* Safety Disclaimer */}
      {/* <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 sm:p-8">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-amber-900">
                  Safety Disclaimer
                </h3>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-amber-800">
                  <p>
                    ClinicalScribe is an <strong>educational tool only</strong>. It is not a clinical
                    decision support system and should never be used as a substitute for professional
                    clinical judgment.
                  </p>
                  <p>
                    All AI-generated documents must be reviewed by a qualified clinical instructor
                    before any clinical use. Numbers, dosages, units, and <code className="rounded bg-amber-100 px-1.5 py-0.5 font-medium">[VERIFY]</code> tags
                    must be manually confirmed.
                  </p>
                  <p>
                    <strong>Do not submit real patient data.</strong> This application has no
                    authentication, no encryption beyond HTTPS, and no server-side storage.
                    Any data sent through it is processed in-session only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:pb-20 sm:pt-12">
          <div className="text-center">
            <Link
              href="/app"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-teal-600 px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md active:scale-[0.98]"
            >
              Open the App
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
