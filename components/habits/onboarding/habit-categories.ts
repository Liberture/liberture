import { Dumbbell, Book, Heart, Sunrise, Sparkles, Target } from "lucide-react"

export const habitCategories = [
  {
    id: "exercise",
    animation: "exercise",
    icon: Dumbbell,
    color: "#8B5CF6",
    exampleTime: "07:00"
  },
  {
    id: "reading",
    animation: "work",
    icon: Book,
    color: "#3B82F6",
    exampleTime: "20:00"
  },
  {
    id: "meditation",
    animation: "mind",
    icon: Heart,
    color: "#10B981",
    exampleTime: "06:30"
  },
  {
    id: "health",
    animation: "nutrition",
    icon: Sparkles,
    color: "#F59E0B",
    exampleTime: "08:00"
  },
  {
    id: "morning_routine",
    animation: "sleep",
    icon: Sunrise,
    color: "#EC4899",
    exampleTime: "06:00"
  },
  {
    id: "personal",
    animation: "work",
    icon: Target,
    color: "#6366F1",
    exampleTime: "09:00"
  }
] as const
