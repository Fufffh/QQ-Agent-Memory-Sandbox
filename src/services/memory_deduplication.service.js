import { z } from 'zod'
import {
  getDeepseekClient,
  getDeepseekModel
} from '../clients/deepseek.client.js'

const MAX_DEDUPLICATION_CONTENT_LENGTH = 120
const MAX_DEDUPLICATION_REASON_LENGTH = 80

const memoryDeduplicationSchema = z.object({
  action: z.enum(['new', 'duplicate', 'update']),
  memoryId: z.number().int().positive().nullable(),
  content: z.string().nullable().transform((content) => {
    if (content === null) {
      return null
    }

    return content.slice(0, MAX_DEDUPLICATION_CONTENT_LENGTH)
  }),
  reason: z.string().default('').transform((reason) => {
    return reason.slice(0, MAX_DEDUPLICATION_REASON_LENGTH)
  })
})

export async function decideMemoryDeduplication(
  newMemoryContent,
  existingMemories
) {
  if (existingMemories.length === 0) {
    return {
      action: 'new',
      memoryId: null,
      content: newMemoryContent,
      reason: '暂无旧记忆'
    }
  }

  const memoryList = existingMemories.map((memory) => {
    return {
      id: memory.id,
      content: memory.content
    }
  })
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
          'You are a semantic memory deduplication judge for a QQ Agent.',
          'Compare one new memory with the existing memories of the same user.',
          'Return action="duplicate" if the new memory has the same meaning as an existing memory.',
          'Return action="update" if the new memory is about the same topic but contains useful new details. In this case, merge the old and new memory into a short Chinese content.',
          'Return action="new" if the new memory is clearly different from all existing memories.',
          'Only use memoryId from the provided existing memories. For action="new", memoryId must be null.',
          'Both content and reason must be short Chinese summaries.',
          'For action="duplicate", content must be null.',
          'For action="update" or action="new", content must be concise Chinese within 60 Chinese characters.',
          'The reason must be concise Chinese within 30 Chinese characters.',
          'You must return JSON only. Do not return Markdown.',
          'The JSON must have exactly these fields:',
          '{"action": "new"|"duplicate"|"update", "memoryId": number|null, "content": string|null, "reason": string}'
        ].join('\n')
      },
      {
        role: 'user',
        content: JSON.stringify({
          newMemoryContent: newMemoryContent,
          existingMemories: memoryList
        })
      }
    ]
  })

  const rawContent = completion.choices[0].message.content
  const parsedContent = JSON.parse(rawContent)

  return memoryDeduplicationSchema.parse(parsedContent)
}
