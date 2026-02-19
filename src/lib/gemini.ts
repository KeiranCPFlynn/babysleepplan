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

export function getModel() {
  return getGemini().getGenerativeModel({ model: 'gemini-3-pro-preview' })
}

// Cheaper model for lightweight structured tasks (extraction, free-tier schedule)
export function getFlashModel() {
  return getGemini().getGenerativeModel({ model: 'gemini-3-flash-preview' })
}
