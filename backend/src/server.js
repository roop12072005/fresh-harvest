import { env } from './config/env.js'
import { connectDatabase } from './config/database.js'
import { createApp } from './app.js'

const app = createApp()

async function start() {
  await connectDatabase()
  app.listen(env.port, () => {
    console.log(`FreshCart API listening on http://localhost:${env.port}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error.message)
  process.exit(1)
})
