/**
 * Local file-based storage for development
 * This allows testing without setting up a database
 */

import fs from 'fs/promises'
import path from 'path'
import { StorageData } from './types'

const STORAGE_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(STORAGE_DIR, 'users.json')

interface LocalUser {
  apiKey: string
  data: StorageData
  createdAt: string
  updatedAt: string
}

interface LocalUsersDB {
  users: LocalUser[]
}

/**
 * Ensure storage directory and file exist
 */
async function ensureStorage(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true })

    try {
      await fs.access(USERS_FILE)
    } catch {
      // File doesn't exist, create it
      const emptyDB: LocalUsersDB = { users: [] }
      await fs.writeFile(USERS_FILE, JSON.stringify(emptyDB, null, 2))
    }
  } catch (error) {
    console.error('Failed to ensure storage:', error)
    throw error
  }
}

/**
 * Read users database
 */
async function readUsersDB(): Promise<LocalUsersDB> {
  await ensureStorage()
  const content = await fs.readFile(USERS_FILE, 'utf-8')
  return JSON.parse(content)
}

/**
 * Write users database
 */
async function writeUsersDB(db: LocalUsersDB): Promise<void> {
  await ensureStorage()
  await fs.writeFile(USERS_FILE, JSON.stringify(db, null, 2))
}

/**
 * Create a new user
 */
export async function createLocalUser(apiKey: string, data: StorageData): Promise<void> {
  const db = await readUsersDB()

  const newUser: LocalUser = {
    apiKey,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  db.users.push(newUser)
  await writeUsersDB(db)
}

/**
 * Get user by API key
 */
export async function getLocalUser(apiKey: string): Promise<StorageData | null> {
  const db = await readUsersDB()
  const user = db.users.find(u => u.apiKey === apiKey)
  return user ? user.data : null
}

/**
 * Update user data
 */
export async function updateLocalUser(apiKey: string, data: StorageData): Promise<boolean> {
  const db = await readUsersDB()
  const userIndex = db.users.findIndex(u => u.apiKey === apiKey)

  if (userIndex === -1) {
    return false
  }

  db.users[userIndex].data = data
  db.users[userIndex].updatedAt = new Date().toISOString()

  await writeUsersDB(db)
  return true
}

/**
 * Check if user exists
 */
export async function localUserExists(apiKey: string): Promise<boolean> {
  const db = await readUsersDB()
  return db.users.some(u => u.apiKey === apiKey)
}

/**
 * Check if local storage is being used
 */
export function isLocalStorageMode(): boolean {
  const dbUrl = process.env.DATABASE_URL
  // Use local storage if DATABASE_URL is not set or is a placeholder
  return !dbUrl ||
         dbUrl === 'your_neon_database_url_here' ||
         dbUrl.includes('placeholder') ||
         dbUrl.includes('your_')
}

/** Remove a user entirely (Settings → Delete account). */
export async function deleteLocalUser(apiKey: string): Promise<boolean> {
  const db = await readUsersDB()
  const before = db.users.length
  db.users = db.users.filter((u) => u.apiKey !== apiKey)
  if (db.users.length === before) return false
  await writeUsersDB(db)
  return true
}
