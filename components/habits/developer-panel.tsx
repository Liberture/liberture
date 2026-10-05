"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Download, Trash2, Settings, Activity, Wifi, Database, FileText, Clock, AlertTriangle, CheckCircle, XCircle, Copy, Check, X } from "lucide-react"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/habits/ui/select"
import { Textarea } from "@/components/habits/ui/textarea"
import { Badge } from "@/components/habits/ui/badge"
import { developerLogger, LogLevel, type LogEntry } from "@/lib/habits/nostr/logger"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"

interface DeveloperPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DeveloperPanel({ isOpen, onClose }: DeveloperPanelProps) {
  const t = useTranslations().habits.app.developerPanel
  const locale = useLocale()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [loggingEnabled, setLoggingEnabled] = useState(developerLogger.isEnabled())
  const [logLevel, setLogLevel] = useState<LogLevel>(developerLogger.getLevel())
  const [maxLogs, setMaxLogs] = useState(developerLogger.getMaxLogs())
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState(developerLogger.getStats())
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [copied, setCopied] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (!isOpen) return

    // Load initial logs
    const initialLogs = developerLogger.getRecentLogs(100)
    setLogs(initialLogs)
    setFilteredLogs(initialLogs)

    // Set up real-time log updates
    const unsubscribe = developerLogger.onLogsUpdate((newLogs) => {
      setLogs(prev => {
        const updated = [...prev, ...newLogs].slice(-100)
        setFilteredLogs(updated)
        setStats(developerLogger.getStats())
        return updated
      })
    })

    // Update stats periodically
    const statsInterval = setInterval(() => {
      setStats(developerLogger.getStats())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(statsInterval)
    }
  }, [isOpen])

  // Filter logs when filters change
  useEffect(() => {
    let filtered = logs

    if (selectedCategory !== "all") {
      filtered = filtered.filter(log => log.category === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        log.category.toLowerCase().includes(term) ||
        (log.eventId && log.eventId.toLowerCase().includes(term)) ||
        (log.relayUrl && log.relayUrl.toLowerCase().includes(term))
      )
    }

    setFilteredLogs(filtered)
  }, [logs, selectedCategory, searchTerm])

  // Auto-scroll when filtered logs change
  useEffect(() => {
    if (filteredLogs.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [filteredLogs])

  const handleLoggingToggle = (enabled: boolean) => {
    setLoggingEnabled(enabled)
    developerLogger.setEnabled(enabled)
  }

  const handleLevelChange = (level: string) => {
    const newLevel = parseInt(level) as LogLevel
    setLogLevel(newLevel)
    developerLogger.setLevel(newLevel)
  }

  const handleMaxLogsChange = (value: string) => {
    const newMax = Math.max(100, Math.min(10000, parseInt(value) || 1000))
    setMaxLogs(newMax)
    developerLogger.setMaxLogs(newMax)
  }

  const handleClearLogs = () => {
    developerLogger.clearLogs()
    setLogs([])
    setFilteredLogs([])
  }

  const handleExportLogs = () => {
    const data = developerLogger.exportLogs()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nostr-dev-logs-${new Date().toISOString().slice(0, 19)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyLog = async (log: LogEntry) => {
    await navigator.clipboard.writeText(JSON.stringify(log, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR: return "text-destructive"
      case LogLevel.WARN: return "text-exercise"
      case LogLevel.INFO: return "text-work"
      case LogLevel.DEBUG: return "text-muted-foreground"
      default: return "text-muted-foreground"
    }
  }

  const getLogLevelBadge = (level: LogLevel) => {
    const colors = {
      [LogLevel.ERROR]: "bg-destructive/10 text-destructive ",
      [LogLevel.WARN]: "bg-exercise/10 text-exercise ",
      [LogLevel.INFO]: "bg-work/10 text-work ",
      [LogLevel.DEBUG]: "bg-secondary text-foreground ",
    }
    return colors[level] || colors[LogLevel.DEBUG]
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(locale)
  }

  const getUniqueCategories = () => {
    const categories = new Set(logs.map(log => log.category))
    return Array.from(categories).sort()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 duration-200 animate-in zoom-in-95 slide-in-from-bottom-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t.title}
          </h2>
          <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={t.close}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Panel - Settings & Stats */}
          <div className="w-80 border-r border-border flex flex-col">
            {/* Settings Section */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t.loggingSettings}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="logging-enabled">{t.enableLogging}</Label>
                  <input
                    id="logging-enabled"
                    type="checkbox"
                    checked={loggingEnabled}
                    onChange={(event) => handleLoggingToggle(event.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-level">{t.logLevel}</Label>
                  <Select value={logLevel.toString()} onValueChange={handleLevelChange} disabled={!loggingEnabled}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LogLevel.ERROR.toString()}>{t.levelError}</SelectItem>
                      <SelectItem value={LogLevel.WARN.toString()}>{t.levelWarning}</SelectItem>
                      <SelectItem value={LogLevel.INFO.toString()}>{t.levelInfo}</SelectItem>
                      <SelectItem value={LogLevel.DEBUG.toString()}>{t.levelDebug}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-logs">{t.maxLogs}</Label>
                  <Input
                    id="max-logs"
                    type="number"
                    min="100"
                    max="10000"
                    value={maxLogs}
                    onChange={(e) => handleMaxLogsChange(e.target.value)}
                    disabled={!loggingEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t.statistics}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.totalLogs}</div>
                  <div className="text-xs text-muted-foreground">{t.totalLogs}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.logsLast24h}</div>
                  <div className="text-xs text-muted-foreground">{t.last24h}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{stats.errorsLast24h}</div>
                  <div className="text-xs text-muted-foreground">{t.errors}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-nutrition">{stats.eventsPublished}</div>
                  <div className="text-xs text-muted-foreground">{t.published}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-work">{stats.eventsReceived}</div>
                  <div className="text-xs text-muted-foreground">{t.received}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.relayOperations}</div>
                  <div className="text-xs text-muted-foreground">{t.relayOps}</div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="p-4">
              <h3 className="font-semibold mb-3">{t.actions}</h3>
              <div className="space-y-2">
                <Button onClick={handleClearLogs} variant="outline" size="sm" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t.clearLogs}
                </Button>
                <Button onClick={handleExportLogs} variant="outline" size="sm" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  {t.exportLogs}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Logs */}
          <div className="flex-1 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b border-border">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t.allCategories} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCategories}</SelectItem>
                    {getUniqueCategories().map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Logs Display */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getLogLevelBadge(log.level)}>
                            {LogLevel[log.level]}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.category}
                          </span>
                          {log.eventId && (
                            <Badge variant="outline" className="text-xs">
                              {log.eventId.slice(0, 8)}...
                            </Badge>
                          )}
                          {log.relayUrl && (
                            <Badge variant="outline" className="text-xs">
                              {new URL(log.relayUrl).hostname}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-foreground break-words">
                          {log.message}
                        </div>
                        {log.data && (
                          <div className="text-xs text-muted-foreground mt-1 font-mono">
                            {JSON.stringify(log.data).slice(0, 100)}
                            {JSON.stringify(log.data).length > 100 && '...'}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyLog(log)
                        }}
                        className="flex-shrink-0"
                        aria-label={t.copyLog}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    {t.noLogs}
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Log Details Modal */}
            {selectedLog && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h3 className="font-semibold">{t.logDetails}</h3>
                    <Button onClick={() => setSelectedLog(null)} variant="ghost" size="sm" aria-label={t.close}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                    <pre className="text-xs font-mono bg-muted p-4 rounded whitespace-pre-wrap">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}