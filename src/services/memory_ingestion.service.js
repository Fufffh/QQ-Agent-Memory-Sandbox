import {
  createMemory,
  findDuplicateMemory,
  getMemoriesByUserId,
  updateMemoryById
} from '../repositories/memory.repository.js'
import { decideMemoryDeduplication } from './memory_deduplication.service.js'
import { extractMemoryFromMessage } from './memory_extraction.service.js'

export async function ingestMemoryFromMessage(userId, messageText) {
  const normalizedUserId = userId.trim()
  const extraction = await extractMemoryFromMessage(messageText.trim())

  if (
    !extraction.shouldRemember ||
    extraction.content === null ||
    !extraction.content.trim()
  ) {
    return {
      saved: false,
      action: 'ignored',
      extraction: extraction
    }
  }

  const normalizedContent = extraction.content.trim()
  const exactDuplicateMemory = findDuplicateMemory(
    normalizedUserId,
    normalizedContent
  )

  if (exactDuplicateMemory) {
    return {
      saved: false,
      action: 'duplicate',
      memory: exactDuplicateMemory,
      extraction: extraction,
      deduplication: {
        action: 'duplicate',
        memoryId: exactDuplicateMemory.id,
        content: null,
        reason: '内容完全重复'
      }
    }
  }

  const existingMemories = getMemoriesByUserId(normalizedUserId)
  const deduplication = await decideMemoryDeduplication(
    normalizedContent,
    existingMemories
  )

  const matchedMemory = existingMemories.find((memory) => {
    return memory.id === deduplication.memoryId
  })

  if (deduplication.action === 'duplicate' && matchedMemory) {
    return {
      saved: false,
      action: 'duplicate',
      memory: matchedMemory,
      extraction: extraction,
      deduplication: deduplication
    }
  }

  if (
    deduplication.action === 'update' &&
    matchedMemory &&
    deduplication.content !== null &&
    deduplication.content.trim()
  ) {
    const updatedMemory = updateMemoryById(
      matchedMemory.id,
      deduplication.content.trim()
    )

    return {
      saved: true,
      action: 'update',
      memory: updatedMemory,
      extraction: extraction,
      deduplication: deduplication
    }
  }

  const contentToSave =
    deduplication.action === 'new' &&
    deduplication.content !== null &&
    deduplication.content.trim()
      ? deduplication.content.trim()
      : normalizedContent

  const memory = createMemory(normalizedUserId, contentToSave)

  return {
    saved: true,
    action: 'new',
    memory: memory,
    extraction: extraction,
    deduplication: deduplication
  }
}
