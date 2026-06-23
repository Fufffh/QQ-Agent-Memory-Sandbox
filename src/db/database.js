import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const DATABASE_PATH = process.env.DATABASE_PATH || 'data/memories.db'

const database = new DatabaseSync(DATABASE_PATH)

const schema = fs.readFileSync('src/db/schema.sql', 'utf8')

database.exec(schema)

export default database
