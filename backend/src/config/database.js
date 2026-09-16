import dns from 'node:dns'
import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDatabase() {
  mongoose.set('strictQuery', true)
  if (env.mongoDnsServers.length > 0) {
    dns.setServers(env.mongoDnsServers)
  }
  await mongoose.connect(env.mongoUri)
  return mongoose.connection
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}
