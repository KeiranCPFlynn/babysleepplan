import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI: GoogleGenerativeAI | null = null

export function getGemini() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY environment variable')
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return genAI
}

// Names are pinned because Google's -latest aliases 404 on the v1beta endpoint
// this SDK uses. Preview names do get retired eventually — if calls start 404ing,
// re-check with: curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
export function getModel() {
  return getGemini().getGenerativeModel({ model: 'gemini-3.1-pro-preview' })
}

// Cheaper model for lightweight structured tasks (extraction, free-tier schedule)
export function getFlashModel() {
  return getGemini().getGenerativeModel({ model: 'gemini-3.8-flash' })
}
