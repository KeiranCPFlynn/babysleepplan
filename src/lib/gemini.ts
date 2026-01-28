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
  // Using gemini-2.0-flash for higher free tier limits
  return getGemini().getGenerativeModel({ model: 'gemini-2.0-flash' })
}
