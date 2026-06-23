import express from 'express'
import {
  createMemory,
  getAllMemories,
  getMemoryById,
  deleteMemoryById,
  deleteMemoriesByUserId,
  updateMemoryById,
  getMemoriesByUserId,
  searchMemoriesByUserId,
  findDuplicateMemory
} from './repositories/memory.repository.js'

import { extractMemoryFromMessage } from './services/memory_extraction.service.js'
import { ingestMemoryFromMessage } from './services/memory_ingestion.service.js'
import { parseOnebotGroupMessageEvent } from './services/qq_message.service.js'

const app = express()

app.use(express.json())

function isValidMemoryId(memoryId) {
  return Number.isInteger(memoryId) && memoryId > 0
}

app.get('/health', (request, response) => {
  response.json({
    status: 'ok'
  })
})

app.get('/api/v1/memories', (request, response) => {
  const memories = getAllMemories()

  response.json(memories)
})

app.post('/api/v1/memories/extract', async (request, response) => {
  const messageText = request.body.messageText

  if (typeof messageText !== 'string' || !messageText.trim()) {
    return response.status(400).json({
      error: 'messageText must be a non-empty string'
    })
  }

  if (messageText.length > 1000) {
    return response.status(400).json({
      error: 'messageText must be at most 1000 characters'
    })
  }

  try {
    const extraction = await extractMemoryFromMessage(messageText.trim())

    return response.json(extraction)
  } catch (error) {
    console.log(error)

    return response.status(502).json({
      error: 'Failed to extract memory'
    })
  }
})

app.post(
  '/api/v1/users/:userId/memories/extract-and-save',
  async (request, response) => {
    const userId = request.params.userId
    const messageText = request.body.messageText

    if (typeof userId !== 'string' || !userId.trim()) {
      return response.status(400).json({
        error: 'userId must be a non-empty string'
      })
    }

    if (typeof messageText !== 'string' || !messageText.trim()) {
      return response.status(400).json({
        error: 'messageText must be a non-empty string'
      })
    }

    if (messageText.length > 1000) {
      return response.status(400).json({
        error: 'messageText must be at most 1000 characters'
      })
    }

    try {
      const result = await ingestMemoryFromMessage(userId, messageText)
      const statusCode = result.action === 'new' ? 201 : 200

      return response.status(statusCode).json(result)
    } catch (error) {
      console.error(error)

      return response.status(502).json({
        error: 'Failed to extract and save memory'
      })
    }
  }
)

app.post('/api/v1/qq/onebot/events', async (request, response) => {
  const qqMessage = parseOnebotGroupMessageEvent(request.body)

  if (!qqMessage.shouldProcess) {
    return response.json({
      handled: false,
      reason: qqMessage.reason,
      groupId: qqMessage.groupId,
      qqUserId: qqMessage.qqUserId
    })
  }

  try {
    const result = await ingestMemoryFromMessage(
      qqMessage.memoryUserId,
      qqMessage.messageText
    )
    const statusCode = result.action === 'new' ? 201 : 200

    return response.status(statusCode).json({
      handled: true,
      source: 'onebot',
      groupId: qqMessage.groupId,
      qqUserId: qqMessage.qqUserId,
      memoryUserId: qqMessage.memoryUserId,
      result: result
    })
  } catch (error) {
    console.error(error)

    return response.status(502).json({
      error: 'Failed to handle QQ message event'
    })
  }
})

app.get('/api/v1/memories/:id', (request, response) => {
  const memoryId = Number(request.params.id)

  if (!isValidMemoryId(memoryId)) {
    return response.status(400).json({
      error: 'Memory id must be a positive integer'
    })
  }

  const memory = getMemoryById(memoryId)
  if (!memory) {
    return response.status(404).json({
      error: 'Memory not found!'
    })
  }

  return response.json(memory)
})

app.post('/api/v1/memories', (request, response) => {
  const userId = request.body.userId
  const content = request.body.content

  if (
    typeof userId !== 'string' ||
    typeof content !== 'string' ||
    !userId.trim() ||
    !content.trim()
  ) {
    return response.status(400).json({
      error: 'userId and content must be non-empty strings'
    })
  }

  const normalizedUserId = userId.trim()
  const normalizedContent = content.trim()

  const duplicateMemory = findDuplicateMemory(
    normalizedUserId,
    normalizedContent
  )

  if (duplicateMemory) {
    return response.status(409).json({
      error: 'Memory already exists',
      memory: duplicateMemory
    })
  }

  const memory = createMemory(normalizedUserId, normalizedContent)

  response.status(201).json(memory)
})

app.delete('/api/v1/memories/:id', (request, response) => {
  const memoryId = Number(request.params.id)

  if (!isValidMemoryId(memoryId)) {
    return response.status(400).json({
      error: 'Memory id must be a positive integer'
    })
  }

  const deletedMemory = deleteMemoryById(memoryId)

  if (!deletedMemory) {
    return response.status(404).json({
      error: 'Memory not found!'
    })
  }

  response.json(deletedMemory)
})

app.delete('/api/v1/users/:userId/memories', (request, response) => {
  const userId = request.params.userId

  if (typeof userId !== 'string' || !userId.trim()) {
    return response.status(400).json({
      error: 'userId must be a non-empty string'
    })
  }

  const deletedCount = deleteMemoriesByUserId(userId.trim())

  return response.json({
    deletedCount: deletedCount
  })
})

app.patch('/api/v1/memories/:id', (request, response) => {
  const memoryId = Number(request.params.id)

  if (!isValidMemoryId(memoryId)) {
    return response.status(400).json({
      error: 'Memory id must be a positive integer'
    })
  }

  const content = request.body.content

  if (typeof content !== 'string' || !content.trim()) {
    return response.status(400).json({
      error: 'content must be a non-empty string'
    })
  }

  const updatedMemory = updateMemoryById(memoryId, content.trim())

  if (!updatedMemory) {
    return response.status(404).json({
      error: 'Memory not found'
    })
  }

  response.json(updatedMemory)
})

app.get('/api/v1/users/:userId/memories', (request, response) => {
  const userId = request.params.userId
  const query = request.query.query
  const limitValue = request.query.limit
  const limit = limitValue === undefined ? 10 : Number(limitValue)

  if (typeof userId !== 'string' || !userId.trim()) {
    return response.status(400).json({
      error: 'userId must be a non-empty string'
    })
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return response.status(400).json({
      error: 'limit must be an integer between 1 and 50'
    })
  }

  if (query === undefined) {
    const memories = getMemoriesByUserId(userId.trim())

    return response.json(memories)
  }

  if (typeof query !== 'string' || !query.trim()) {
    return response.status(400).json({
      error: 'query must be a non-empty string'
    })
  }

  const memories = searchMemoriesByUserId(userId.trim(), query.trim(), limit)

  response.json(memories)
})

export default app
