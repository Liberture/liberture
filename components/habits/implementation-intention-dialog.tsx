"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/habits/ui/dialog"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import { Card } from "@/components/habits/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/habits/ui/select"
import { Brain, Plus, X } from "lucide-react"
import { ImplementationIntention } from "@/lib/habits/types"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface ImplementationIntentionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habitName: string
  currentIntention?: ImplementationIntention
  onSave: (intention: ImplementationIntention) => void
}

/** Select value for the "custom trigger" option; its label comes from translations. */
const CUSTOM_TRIGGER = "__custom__"

export function ImplementationIntentionDialog({
  open,
  onOpenChange,
  habitName,
  currentIntention,
  onSave
}: ImplementationIntentionDialogProps) {
  const tr = useTranslations().habits.app.implementationIntentionDialog
  const commonTriggers = tr.triggers
  const [trigger, setTrigger] = useState(currentIntention?.trigger ||"")
  const [customTrigger, setCustomTrigger] = useState("")
  const [behavior, setBehavior] = useState(currentIntention?.behavior ||"")
  const [obstacles, setObstacles] = useState<Array<{ obstacle: string; strategy: string }>>(
    currentIntention?.obstacles || []
  )

  const handleAddObstacle = () => {
    setObstacles([...obstacles, { obstacle: "", strategy: "" }])
  }

  const handleRemoveObstacle = (index: number) => {
    setObstacles(obstacles.filter((_, i) => i !== index))
  }

  const handleObstacleChange = (index: number, field: "obstacle" |"strategy", value: string) => {
    const newObstacles = [...obstacles]
    newObstacles[index][field] = value
    setObstacles(newObstacles)
  }

  const handleSave = () => {
    const finalTrigger = trigger === CUSTOM_TRIGGER ? customTrigger : trigger

    if (!finalTrigger || !behavior) return

    const intention: ImplementationIntention = {
      trigger: finalTrigger,
      behavior,
      obstacles: obstacles.filter(o => o.obstacle && o.strategy)
    }

    onSave(intention)
    onOpenChange(false)
  }

  const isCustom = trigger === CUSTOM_TRIGGER

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>{formatMessage(tr.title, { name: habitName })}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Educational Card */}
          <Card className="p-4 bg-primary/10 border-primary/30">
            <h3 className="font-semibold text-primary mb-2">
              {tr.whatTitle}
            </h3>
            <p className="text-sm text-primary">
              {tr.whatBody}
            </p>
          </Card>

          {/* Main If-Then Plan */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trigger" className="text-lg font-semibold">
                {tr.ifLabel}
              </Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger id="trigger">
                  <SelectValue placeholder={tr.triggerPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {commonTriggers.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_TRIGGER}>{tr.customTrigger}</SelectItem>
                </SelectContent>
              </Select>

              {isCustom && (
                <Input
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  placeholder={tr.customTriggerPlaceholder}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="behavior" className="text-lg font-semibold">
                {tr.thenLabel}
              </Label>
              <Input
                id="behavior"
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder={formatMessage(tr.behaviorPlaceholder, { name: habitName.toLowerCase() })}
              />
            </div>
          </div>

          {/* Preview */}
          {trigger && behavior && (
            <Card className="p-4 bg-nutrition/10 border-nutrition/30">
              <p className="text-sm font-medium text-nutrition">
                {tr.previewTitle}
              </p>
              <p className="text-nutrition mt-2">
{formatMessage(tr.previewSentence, { trigger: isCustom ? customTrigger : trigger, behavior })}
              </p>
            </Card>
          )}

          {/* Obstacle Planning */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  {tr.obstaclesTitle}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tr.obstaclesHint}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddObstacle}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>{tr.addObstacle}</span>
              </Button>
            </div>

            {obstacles.map((obstacle, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start space-x-2">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {tr.obstacleLabel}
                      </Label>
                      <Input
                        value={obstacle.obstacle}
                        onChange={(e) => handleObstacleChange(index,"obstacle", e.target.value)}
                        placeholder={tr.obstaclePlaceholder}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {tr.strategyLabel}
                      </Label>
                      <Input
                        value={obstacle.strategy}
                        onChange={(e) => handleObstacleChange(index,"strategy", e.target.value)}
                        placeholder={tr.strategyPlaceholder}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveObstacle(index)}
                    className="flex-shrink-0"
                    aria-label={tr.removeObstacle}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {obstacles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {tr.empty}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tr.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!trigger || (isCustom && !customTrigger) || !behavior}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {tr.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
