import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Moon, Flame, Dumbbell } from "lucide-react"

const activities = [
  {
    pillar: "Sleep",
    icon: Moon,
    action: "Logged 7.5h sleep",
    xp: 25,
    time: "2h ago",
    color: "text-cyan-400",
  },
  {
    pillar: "Exercise",
    icon: Dumbbell,
    action: "Completed strength training",
    xp: 50,
    time: "5h ago",
    color: "text-orange-400",
  },
  {
    pillar: "Work",
    icon: Brain,
    action: "Focus session (45min)",
    xp: 35,
    time: "6h ago",
    color: "text-indigo-400",
  },
  {
    pillar: "Nutrition",
    icon: Flame,
    action: "Logged meals",
    xp: 15,
    time: "8h ago",
    color: "text-green-400",
  },
]

export function RecentActivity() {
  return (
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm shadow-xl rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-400 text-sm font-medium uppercase tracking-wider">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, i) => {
            const Icon = activity.icon
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-gray-900/50 border border-gray-700">
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-100 truncate">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <span className="text-xs text-green-400 font-medium">+{activity.xp} XP</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
