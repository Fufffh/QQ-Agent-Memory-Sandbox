import { z } from 'zod'
import {
  getDeepseekClient,
  getDeepseekModel
} from '../clients/deepseek.client.js'

const MAX_MEMORY_CONTENT_LENGTH = 120
const MAX_MEMORY_REASON_LENGTH = 80

const memoryExtractionSchema = z.object({
  shouldRemember: z.boolean(),
  content: z.string().nullable().transform((content) => {
    if (content === null) {
      return null
    }

    return content.slice(0, MAX_MEMORY_CONTENT_LENGTH)
  }),
  reason: z.string().default('').transform((reason) => {
    return reason.slice(0, MAX_MEMORY_REASON_LENGTH)
  })
})

export async function extractMemoryFromMessage(messageText) {
  const deepseekClient = getDeepseekClient()
  const model = getDeepseekModel()

  const completion = await deepseekClient.chat.completions.create({
    model: model,
    response_format: {
      type: 'json_object'
    },
    messages: [
      {
        role: 'system',
        content: [
          'You are a long-term memory extractor for a QQ Agent.',
          'Your job is to decide whether the user message contains information worth remembering long term, and summarize daily group messages',
          'Remember only stable preferences, long-term facts, important background, explicit goals, and persistent constraints.',
          'Do not remember greetings, temporary emotions, one-time requests, verification codes, passwords, ID numbers, bank card numbers, or other sensitive information.',
          'Both content and reason must be short Chinese summaries, not long explanations.',
          'If the message is worth remembering, return shouldRemember=true and write content in concise Chinese within 60 Chinese characters.',
          'If the message is not worth remembering, return shouldRemember=false and content must be null.',
          'The reason must be written in concise Chinese within 30 Chinese characters.',
          'Do not copy the original message. Summarize the stable memory point only.',
          'You must return JSON only. Do not return Markdown.',
          'The JSON must have exactly these fields:',
          '{"shouldRemember": boolean, "content": string|null, "reason": string}'
        ].join('\n')
      },
      {
        role: 'user',
        content: messageText
      }
    ]
  })

  const rawContent = completion.choices[0].message.content
  const parsedContent = JSON.parse(rawContent)

  return memoryExtractionSchema.parse(parsedContent)
}
