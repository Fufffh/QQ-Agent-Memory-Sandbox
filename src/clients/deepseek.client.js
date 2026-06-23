import OpenAI from 'openai'

let deepseekClient

export function getDeepseekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseURL = process.env.DEEPSEEK_BASE_URL

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is required')
  }

  if (!baseURL) {
    throw new Error('DEEPSEEK_BASE_URL is required')
  }

  if (!deepseekClient) {
    deepseekClient = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL
    })
  }

  return deepseekClient
}

export function getDeepseekModel() {
  const model = process.env.DEEPSEEK_MODEL

  if (!model) {
    throw new Error('DEEPSEEK_MODEL is required')
  }

  return model
}
