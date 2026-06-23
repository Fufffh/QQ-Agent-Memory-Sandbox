import app from './app.js'
import { startMemoryAutoClearTimer } from './services/memory_cleanup.service.js'

const PORT = Number(process.env.PORT) || 3000

startMemoryAutoClearTimer()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`)
})
