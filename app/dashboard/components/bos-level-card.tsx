import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function BosLevelCard() {
  const currentLevel = 7
  const currentXP = 2450
  const xpToNextLevel = 3000
  const progress = (currentXP / xpToNextLevel) * 100

  return (
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-400 text-sm font-medium uppercase tracking-wider">BOS Level</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Level Display */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-6xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            {currentLevel}
          </span>
          <span className="text-gray-400 text-lg">Operator</span>
        </div>

        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Experience</span>
            <span className="text-gray-100 font-medium">
              {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-700" />
          <p className="text-xs text-gray-500">
            {(xpToNextLevel - currentXP).toLocaleString()} XP to Level {currentLevel + 1}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-100">42</p>
            <p className="text-xs text-gray-500">Day Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-100">156</p>
            <p className="text-xs text-gray-500">Protocols</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">+12%</p>
            <p className="text-xs text-gray-500">Emergence</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
