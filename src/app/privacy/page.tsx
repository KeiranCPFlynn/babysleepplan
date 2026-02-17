import Link from 'next/link'
import type { Metadata } from 'next'
import { BrandLogo } from '@/components/brand/brand-logo'

export const metadata: Metadata = {
  title: 'Privacy Policy - LunaCradle',
  description: 'How LunaCradle collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="marketing-shell min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/75">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={28} className="h-7 w-7" />
            <span className="text-lg font-semibold tracking-tight text-sky-800 dark:text-sky-200">LunaCradle</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/terms" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">Terms</Link>
            <Link href="/contact" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">Contact</Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: February 2026</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
            <p className="mb-3">When you use LunaCradle, we collect information you provide directly:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li><strong>Account information:</strong> name, email address, and password when you create an account.</li>
              <li><strong>Baby profile data:</strong> your baby&apos;s name, date of birth, and sleep-related details you share through the intake questionnaire.</li>
              <li><strong>Sleep diary entries:</strong> daily sleep logs, nap times, wake times, and notes you record.</li>
              <li><strong>Payment information:</strong> billing details are processed securely by Stripe. We do not store your full card number.</li>
            </ul>
            <p className="mt-3 text-sm">We also automatically collect basic usage data such as pages visited, device type, and browser information to improve the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>Generate and update your personalized sleep plan.</li>
              <li>Provide weekly plan updates based on your diary entries.</li>
              <li>Process payments and manage your subscription.</li>
              <li>Send account-related emails (confirmations, plan updates, billing).</li>
              <li>Improve and develop the service.</li>
            </ul>
            <p className="mt-3 text-sm">We do not sell your personal data. We do not use your baby&apos;s information for advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. AI-Generated Content</h2>
            <p className="text-sm">
              Your sleep plans are generated using AI models. The information you provide (baby profile, diary entries, preferences) is sent to our AI provider to generate personalized guidance. This data is used solely for plan generation and is not used to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Sharing</h2>
            <p className="text-sm mb-3">We share your information only with:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li><strong>Stripe:</strong> for payment processing.</li>
              <li><strong>AI providers:</strong> to generate your sleep plan (data is not retained by providers for training).</li>
              <li><strong>Hosting providers:</strong> to run the service securely.</li>
            </ul>
            <p className="mt-3 text-sm">We will never sell, rent, or trade your information to third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Security</h2>
            <p className="text-sm">
              We use industry-standard security measures including encryption in transit (TLS/SSL), secure password hashing, and access controls. While no system is 100% secure, we take reasonable steps to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Data Retention &amp; Deletion</h2>
            <p className="text-sm">
              Your data is retained while your account is active. If you cancel your subscription, your data is retained for 30 days in case you return, then permanently deleted. You can request immediate deletion of your account and all associated data through our{' '}
              <Link href="/contact" className="text-sky-700 hover:underline">contact form</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Cookies</h2>
            <p className="text-sm">
              We use essential cookies to keep you logged in and remember your preferences. We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-sm">
              LunaCradle is a service for parents and caregivers. We do not knowingly collect information from children under 13. The baby profile data you enter is collected from you, the parent or caregiver, not from the child.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Your Rights</h2>
            <p className="text-sm mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Export your data in a portable format.</li>
            </ul>
            <p className="mt-3 text-sm">
              To exercise any of these rights, reach out through our{' '}
              <Link href="/contact" className="text-sky-700 hover:underline">contact form</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-sm">
              We may update this privacy policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Contact</h2>
            <p className="text-sm">
              Questions about this policy? Reach out through our{' '}
              <Link href="/contact" className="text-sky-700 hover:underline">contact form</Link>.
            </p>
          </section>
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
