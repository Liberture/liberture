import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, CheckCircle2 } from "lucide-react"

export function ActiveProtocol() {
  const protocol = {
    name: "Morning Activation",
    category: "Work",
    progress: 60,
    steps: [
      { name: "Cold Exposure (2min)", completed: true },
      { name: "Breathing Protocol", completed: true },
      { name: "Light Therapy (10min)", completed: true },
      { name: "Focus Stack", completed: false },
      { name: "Review Goals", completed: false },
    ],
    xpReward: 150,
  }

  const completedSteps = protocol.steps.filter((s) => s.completed).length

  return (
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm shadow-xl rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-400 text-sm font-medium uppercase tracking-wider">Active Protocol</CardTitle>
          <span className="text-xs px-2 py-1 bg-indigo-900/50 text-indigo-400 rounded-full border border-indigo-500/50">
            {protocol.category}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-xl font-bold text-gray-100 mb-2">{protocol.name}</h3>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-gray-100">
              {completedSteps}/{protocol.steps.length} steps
            </span>
          </div>
          <Progress value={protocol.progress} className="h-2 bg-gray-700" />
        </div>

        <div className="space-y-2 mb-4">
          {protocol.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`h-4 w-4 ${step.completed ? "text-green-400" : "text-gray-600"}`} />
              <span className={step.completed ? "text-gray-400 line-through" : "text-gray-100"}>{step.name}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <span className="text-sm text-gray-400">
            Reward: <span className="text-green-400 font-medium">{protocol.xpReward} XP</span>
          </span>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Play className="h-4 w-4 mr-1" />
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
