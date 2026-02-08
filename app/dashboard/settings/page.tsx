"use client"

import { useState, useEffect } from 'react'
import { Bell, Mail, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: true,
    weeklyDigest: true,
    newContentAlerts: false,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // TODO: Fetch user preferences on mount
  useEffect(() => {
    // fetchPreferences()
  }, [])

  const updatePreference = async (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    
    // TODO: Update via API
    setLoading(true)
    try {
      // await fetch('/api/user/notifications', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ [key]: value }),
      // })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to update preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how and when you receive updates from Liberture
          </p>
        </div>

        {saved && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
            ✓ Preferences saved
          </div>
        )}

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="email-notifications" className="text-lg font-semibold">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive important updates and account activity notifications
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Marketing Emails */}
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <Zap className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="marketing-emails" className="text-lg font-semibold">
                    Marketing & Product Updates
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    New features, protocols, and optimization tips
                  </p>
                </div>
              </div>
              <Switch
                id="marketing-emails"
                checked={preferences.marketingEmails}
                onCheckedChange={(checked) => updatePreference('marketingEmails', checked)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Weekly Digest */}
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="weekly-digest" className="text-lg font-semibold">
                    Weekly Optimization Report
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your progress summary, new content, and personalized recommendations
                  </p>
                </div>
              </div>
              <Switch
                id="weekly-digest"
                checked={preferences.weeklyDigest}
                onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)}
                disabled={loading}
              />
            </div>
          </div>

          {/* New Content Alerts */}
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Bell className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="new-content-alerts" className="text-lg font-semibold">
                    New Content Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get notified when new protocols or articles match your interests
                  </p>
                </div>
              </div>
              <Switch
                id="new-content-alerts"
                checked={preferences.newContentAlerts}
                onCheckedChange={(checked) => updatePreference('newContentAlerts', checked)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-muted/50 border border-border/30">
          <h3 className="font-semibold mb-2">Need a Break?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You can unsubscribe from all emails at once, or manage individual preferences above.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to unsubscribe from all emails?')) {
                Object.keys(preferences).forEach(key => {
                  updatePreference(key, false)
                })
              }
            }}
          >
            Unsubscribe from All Emails
          </Button>
        </div>
      </div>
    </div>
  )
}
