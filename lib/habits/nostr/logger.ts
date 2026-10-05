/**
 * Developer logging system for Nostr operations
 * Provides configurable logging levels and storage for debugging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  category: string
  message: string
  data?: any
  eventId?: string
  relayUrl?: string
}

export interface NostrEventLog extends LogEntry {
  event: {
    id: string
    pubkey: string
    created_at: number
    kind: number
    tags: string[][]
    contentLength: number
  }
  operation: 'publish' | 'receive' | 'decrypt' | 'encrypt'
  success: boolean
  duration?: number
  error?: string
}

export interface RelayLog extends LogEntry {
  relayUrl: string
  operation: 'connect' | 'disconnect' | 'publish' | 'subscribe' | 'message'
  success: boolean
  messageCount?: number
  latency?: number
  duration?: number
  error?: string
}

class DeveloperLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private enabled = false
  private level = LogLevel.INFO
  private listeners: ((logs: LogEntry[]) => void)[] = []

  constructor() {
    this.loadSettings()
    this.loadPersistedLogs()
  }

  private loadSettings() {
    try {
      const settings = localStorage.getItem('nostr_dev_logging_settings')
      if (settings) {
        const { enabled, level, maxLogs } = JSON.parse(settings)
        this.enabled = enabled ?? false
        this.level = level ?? LogLevel.INFO
        this.maxLogs = maxLogs ?? 1000
      }
    } catch (err) {
      console.warn('Failed to load logging settings:', err)
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('nostr_dev_logging_settings', JSON.stringify({
        enabled: this.enabled,
        level: this.level,
        maxLogs: this.maxLogs
      }))
    } catch (err) {
      console.warn('Failed to save logging settings:', err)
    }
  }

  private loadPersistedLogs() {
    try {
      const persisted = localStorage.getItem('nostr_dev_logs')
      if (persisted) {
        const parsed = JSON.parse(persisted)
        this.logs = parsed.slice(-this.maxLogs) // Keep only recent logs
      }
    } catch (err) {
      console.warn('Failed to load persisted logs:', err)
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem('nostr_dev_logs', JSON.stringify(this.logs.slice(-this.maxLogs)))
    } catch (err) {
      console.warn('Failed to persist logs:', err)
    }
  }

  private addLog(entry: LogEntry) {
    if (!this.enabled) return

    this.logs.push(entry)

    // Maintain max log limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Persist logs periodically (every 10 entries)
    if (this.logs.length % 10 === 0) {
      this.saveLogs()
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener([entry])
      } catch (err) {
        console.error('Log listener error:', err)
      }
    })
  }

  // Configuration methods
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    this.saveSettings()
  }

  setLevel(level: LogLevel) {
    this.level = level
    this.saveSettings()
  }

  setMaxLogs(maxLogs: number) {
    this.maxLogs = Math.max(100, Math.min(10000, maxLogs))
    this.saveSettings()
    // Trim existing logs if needed
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
      this.saveLogs()
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  getLevel(): LogLevel {
    return this.level
  }

  getMaxLogs(): number {
    return this.maxLogs
  }

  // Logging methods
  error(category: string, message: string, data?: any, eventId?: string, relayUrl?: string) {
    if (this.level >= LogLevel.ERROR) {
      this.addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: LogLevel.ERROR,
        category,
        message,
        data,
        eventId,
        relayUrl
      })
    }
  }

  warn(category: string, message: string, data?: any, eventId?: string, relayUrl?: string) {
    if (this.level >= LogLevel.WARN) {
      this.addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: LogLevel.WARN,
        category,
        message,
        data,
        eventId,
        relayUrl
      })
    }
  }

  info(category: string, message: string, data?: any, eventId?: string, relayUrl?: string) {
    if (this.level >= LogLevel.INFO) {
      this.addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: LogLevel.INFO,
        category,
        message,
        data,
        eventId,
        relayUrl
      })
    }
  }

  debug(category: string, message: string, data?: any, eventId?: string, relayUrl?: string) {
    if (this.level >= LogLevel.DEBUG) {
      this.addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: LogLevel.DEBUG,
        category,
        message,
        data,
        eventId,
        relayUrl
      })
    }
  }

  // Specialized Nostr logging methods
  logEvent(log: Omit<NostrEventLog, 'id' | 'timestamp' | 'level'>) {
    const level = log.success ? LogLevel.INFO : LogLevel.ERROR
    if (this.level >= level) {
      this.addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level,
        ...log
      } as NostrEventLog)
    }
  }

  logRelay(log: Omit<RelayLog, 'id' | 'timestamp' | 'level'>) {
    const level = log.success ? LogLevel.DEBUG : LogLevel.WARN
    if (this.level >= level) {
      this.addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level,
        ...log
      } as RelayLog)
    }
  }

  // Log management
  getLogs(category?: string, level?: LogLevel): LogEntry[] {
    let filtered = this.logs

    if (category) {
      filtered = filtered.filter(log => log.category === category)
    }

    if (level !== undefined) {
      filtered = filtered.filter(log => log.level <= level)
    }

    return filtered
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  clearLogs() {
    this.logs = []
    this.saveLogs()
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Real-time updates
  onLogsUpdate(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Statistics
  getStats() {
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)

    const recentLogs = this.logs.filter(log => log.timestamp > last24h)

    return {
      totalLogs: this.logs.length,
      logsLast24h: recentLogs.length,
      errorsLast24h: recentLogs.filter(log => log.level === LogLevel.ERROR).length,
      eventsPublished: this.logs.filter(log => 'operation' in log && (log as NostrEventLog).operation === 'publish').length,
      eventsReceived: this.logs.filter(log => 'operation' in log && (log as NostrEventLog).operation === 'receive').length,
      relayOperations: this.logs.filter(log => 'relayUrl' in log).length
    }
  }
}

// Singleton instance
export const developerLogger = new DeveloperLogger()

// Utility functions for common logging patterns
export const logNostrEvent = {
  publishStart: (eventId: string, relayUrl?: string) =>
    developerLogger.debug('event.publish', `Starting publish of event ${eventId}`, undefined, eventId, relayUrl),

  publishSuccess: (eventId: string, relayUrl: string, duration: number) =>
    developerLogger.logRelay({
      category: 'relay.publish',
      message: `Successfully published event ${eventId}`,
      relayUrl,
      operation: 'publish',
      success: true,
      duration
    }),

  publishFailure: (eventId: string, relayUrl: string, error: string) =>
    developerLogger.logRelay({
      category: 'relay.publish',
      message: `Failed to publish event ${eventId}: ${error}`,
      relayUrl,
      operation: 'publish',
      success: false,
      error
    }),

  receiveEvent: (eventId: string, relayUrl?: string) =>
    developerLogger.logEvent({
      category: 'event.receive',
      message: `Received event ${eventId}`,
      event: { id: eventId } as any, // Will be filled by caller
      operation: 'receive',
      success: true
    }),

  decryptSuccess: (eventId: string, dataSize: number, duration: number) =>
    developerLogger.logEvent({
      category: 'event.decrypt',
      message: `Successfully decrypted event ${eventId} (${dataSize} bytes)`,
      event: { id: eventId } as any,
      operation: 'decrypt',
      success: true,
      duration,
      data: { dataSize }
    }),

  decryptFailure: (eventId: string, error: string) =>
    developerLogger.logEvent({
      category: 'event.decrypt',
      message: `Failed to decrypt event ${eventId}: ${error}`,
      event: { id: eventId } as any,
      operation: 'decrypt',
      success: false,
      error
    })
}