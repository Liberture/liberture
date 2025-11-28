import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Zap, Target, BarChart3 } from "lucide-react"

const actions = [
  { name: "Log Activity", icon: Plus, description: "Track a metric" },
  { name: "Quick Protocol", icon: Zap, description: "5-min boost" },
  { name: "Set Goal", icon: Target, description: "New objective" },
  { name: "View Analytics", icon: BarChart3, description: "Deep insights" },
]

export function QuickActions() {
  return (
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm shadow-xl rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-400 text-sm font-medium uppercase tracking-wider">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.name}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 bg-gray-900/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600 text-gray-100"
              >
                <Icon className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-medium">{action.name}</span>
                <span className="text-xs text-gray-500">{action.description}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
