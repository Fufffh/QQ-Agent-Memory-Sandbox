import { deleteAllMemories } from '../repositories/memory.repository.js'

const HOURS_TO_MILLISECONDS = 60 * 60 * 1000
const DEFAULT_AUTO_CLEAR_INTERVAL_HOURS = 24

function getAutoClearIntervalHours() {
  const intervalHours = Number(process.env.MEMORY_AUTO_CLEAR_INTERVAL_HOURS)

  if (
    Number.isFinite(intervalHours) &&
    Number.isInteger(intervalHours) &&
    intervalHours > 0
  ) {
    return intervalHours
  }

  return DEFAULT_AUTO_CLEAR_INTERVAL_HOURS
}

export function startMemoryAutoClearTimer() {
  const intervalHours = getAutoClearIntervalHours()
  const intervalMilliseconds = intervalHours * HOURS_TO_MILLISECONDS

  console.log(`Memory auto clear timer started: every ${intervalHours} hours`)

  return setInterval(() => {
    const deletedCount = deleteAllMemories()

    console.log(`Memory auto clear completed: deleted ${deletedCount} memories`)
  }, intervalMilliseconds)
}
