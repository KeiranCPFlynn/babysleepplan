import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Moon, Baby, Clock, Heart, CheckCircle, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Baby Sleep Plan</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Better Sleep for Baby,<br />
          <span className="text-blue-600">Better Rest for You</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get a personalized, AI-powered sleep plan tailored to your baby's unique needs.
          Evidence-based strategies that actually work.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">Create Your Plan - $29</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#how-it-works">Learn More</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          30-day money-back guarantee
        </p>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Parents Love Baby Sleep Plan
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Baby className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Personalized for Your Baby</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Our AI considers your baby's age, temperament, and unique challenges
                to create a plan that fits your family.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Your Comfort Level Matters</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                From gentle no-cry methods to more structured approaches -
                we match the plan to what you're comfortable with.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Ready in Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Complete a simple questionnaire, and receive your detailed
                sleep plan within minutes - not days or weeks.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your free account in seconds' },
              { step: '2', title: 'Add Your Baby', description: 'Tell us about your little one' },
              { step: '3', title: 'Complete Questionnaire', description: "Share your baby's sleep patterns and challenges" },
              { step: '4', title: 'Get Your Plan', description: 'Receive your personalized sleep plan instantly' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          What's Included in Your Plan
        </h2>
        <div className="max-w-2xl mx-auto">
          <ul className="space-y-4">
            {[
              'Customized sleep schedule based on your baby\'s age',
              'Step-by-step bedtime routine',
              'Sleep training method matched to your comfort level',
              'Personalized solutions for your specific challenges',
              'Week-by-week implementation guide',
              'Nap optimization strategies',
              'Night waking solutions',
              'Troubleshooting guide',
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Parents Are Saying
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Within a week, our 6-month-old was sleeping through the night. The plan was so easy to follow!",
                author: "Sarah M.",
                baby: "Mom of 6-month-old"
              },
              {
                quote: "I loved that the plan respected my preference for gentle methods. No cry-it-out for us, and it still worked!",
                author: "Jessica T.",
                baby: "Mom of 8-month-old"
              },
              {
                quote: "Best $29 I've ever spent. We went from 5 wake-ups a night to 1. Life-changing!",
                author: "Michael R.",
                baby: "Dad of 10-month-old"
              },
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.baby}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready for Better Sleep?
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
          Join thousands of parents who have transformed their nights with a personalized sleep plan.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">Get Your Sleep Plan Now</Link>
        </Button>
        <p className="mt-4 text-sm text-gray-500">
          One-time payment of $29 • 30-day money-back guarantee
        </p>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                q: 'What age is this for?',
                a: 'Our plans work for babies from 4 months to 3 years old. We adjust recommendations based on your child\'s specific age and development.'
              },
              {
                q: 'Do I have to let my baby cry?',
                a: 'No! We offer methods ranging from completely no-cry approaches to more structured options. You choose what you\'re comfortable with, and we tailor the plan accordingly.'
              },
              {
                q: 'How long until I see results?',
                a: 'Most families see improvement within the first week. Significant changes typically occur within 2-3 weeks of consistent implementation.'
              },
              {
                q: 'What if it doesn\'t work?',
                a: 'We offer a 30-day money-back guarantee. If you\'re not satisfied with your plan, contact us for a full refund.'
              },
            ].map((faq, index) => (
              <div key={index}>
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Moon className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">Baby Sleep Plan</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Baby Sleep Plan. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms</Link>
              <Link href="mailto:support@babysleepplan.com" className="hover:text-gray-900">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
