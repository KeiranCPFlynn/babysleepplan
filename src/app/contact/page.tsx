import Link from 'next/link'
import { Moon, Clock, MessageCircle, Shield } from 'lucide-react'
import type { Metadata } from 'next'
import { ContactForm } from './contact-form'

export const metadata: Metadata = {
  title: 'Contact Us - LunaCradle',
  description: 'Get in touch with the LunaCradle team.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
          <Link href="/" className="flex items-center gap-2">
            <Moon className="h-7 w-7 text-sky-700" />
            <span className="text-lg font-semibold tracking-tight">LunaCradle</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="text-slate-600 hover:text-slate-900">Terms</Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold mb-2">Contact Us</h1>
        <p className="text-slate-600 mb-10">
          Have a question, need help with your account, or want to share feedback? We&apos;re here to help.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm text-center">
            <MessageCircle className="h-8 w-8 text-sky-600 mx-auto mb-3" />
            <h2 className="font-semibold mb-1">Get in Touch</h2>
            <p className="text-sm text-slate-600">Use the form below for any questions</p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm text-center">
            <Clock className="h-8 w-8 text-sky-600 mx-auto mb-3" />
            <h2 className="font-semibold mb-1">Response Time</h2>
            <p className="text-sm text-slate-600">Within 24 hours on business days</p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm text-center">
            <Shield className="h-8 w-8 text-sky-600 mx-auto mb-3" />
            <h2 className="font-semibold mb-1">Privacy</h2>
            <p className="text-sm text-slate-600">Your data stays private to your account</p>
          </div>
        </div>

        <ContactForm />

        <div className="rounded-2xl border border-white/70 bg-white/80 p-8 shadow-sm mt-8">
          <h2 className="text-xl font-semibold mb-6">Common Questions</h2>
          <div className="space-y-5 text-sm text-slate-700">
            <div>
              <h3 className="font-medium text-slate-900 mb-1">How do I cancel my subscription?</h3>
              <p>You can cancel anytime from your account settings in the dashboard. Your access continues until the end of the current billing period. You can also use the form above and we&apos;ll handle it for you.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">How do I delete my account and data?</h3>
              <p>Use the contact form above and select &ldquo;Delete my data&rdquo; as the topic. We&apos;ll permanently delete your account and all associated data within 48 hours.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">I have a billing issue</h3>
              <p>Send us a message with your account email and a description of the issue. We process payments through Stripe and can resolve most billing questions quickly.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">I have feedback or a feature request</h3>
              <p>We love hearing from parents! Use the form above — your feedback directly shapes how we improve the service.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/70 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} LunaCradle. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
