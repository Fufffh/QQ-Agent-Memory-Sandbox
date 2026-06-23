import database from '../db/database.js'

const insertMemoryStatement = database.prepare(`
  INSERT INTO memories (user_id, content, created_at)
  VALUES (?, ?, ?)
`)

export function createMemory(userId, content) {
  const createdAt = new Date().toISOString()

  const result = insertMemoryStatement.run(userId, content, createdAt)

  return {
    id: Number(result.lastInsertRowid),
    userId: userId,
    content: content,
    createdAt: createdAt,
    updatedAt: null
  }
}

const selectAllMemoriesStatement = database.prepare(`
  SELECT
  id,
  user_id AS userId,
  content,
  created_at AS createdAt,
  updated_at AS updatedAt
  FROM memories
  ORDER BY id ASC
`)

export function getAllMemories() {
  return selectAllMemoriesStatement.all()
}

const selectMemoryByIdStatement = database.prepare(`
  SELECT
  id,
  user_id AS userId,
  content,
  created_at AS createdAt,
  updated_at AS updatedAt
  From memories
  WHERE id = ?
`)

export function getMemoryById(memoryId) {
  return selectMemoryByIdStatement.get(memoryId)
}

const deleteMemoryByIdStatement = database.prepare(`
  DELETE FROM memories
  WHERE id = ?
`)

const deleteMemoriesByUserIdStatement = database.prepare(`
  DELETE FROM memories
  WHERE user_id = ?
`)

export function deleteMemoryById(memoryId) {
  const memory = selectMemoryByIdStatement.get(memoryId)
  if (!memory) {
    return undefined
  }

  deleteMemoryByIdStatement.run(memoryId)

  return memory
}

export function deleteMemoriesByUserId(userId) {
  const result = deleteMemoriesByUserIdStatement.run(userId)

  return result.changes
}

const updateMemoryByIdStatement = database.prepare(`
  UPDATE memories
  SET content = ?, updated_at = ?
  WHERE id = ?
`)

export function updateMemoryById(memoryId, content) {
  const updatedAt = new Date().toISOString()
  const result = updateMemoryByIdStatement.run(content, updatedAt, memoryId)

  if (result.changes === 0) {
    return undefined
  }

  return getMemoryById(memoryId)
}

const selectMemoriesByUserIdStatement = database.prepare(`
  SELECT
    id,
    user_id AS userId,
    content,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM memories
  WHERE user_id = ?
  ORDER BY id ASC
`)

export function getMemoriesByUserId(userId) {
  return selectMemoriesByUserIdStatement.all(userId)
}

const searchMemoriesByUserIdStatement = database.prepare(`
  SELECT
    id,
    user_id AS userId,
    content,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM memories
  WHERE user_id = ?
    AND content LIKE ?
  ORDER BY id DESC
  LIMIT ?
`)

export function searchMemoriesByUserId(userId, query, limit) {
  const searchPattern = `%${query}%`

  return searchMemoriesByUserIdStatement.all(userId, searchPattern, limit)
}

const selectDuplicateMemoryStatement = database.prepare(`
  SELECT
    id,
    user_id AS userId,
    content,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM memories
  WHERE user_id = ?
    AND content = ?
  LIMIT 1
`)

export function findDuplicateMemory(userId, content) {
  return selectDuplicateMemoryStatement.get(userId, content)
}
