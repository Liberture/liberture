import { Button } from "@/components/ui/button"
import type { PillarId } from "@/lib/translations"
import type { PillarOption } from "@/lib/pillars"

type PillarFilterValue<T extends string = "all"> = PillarId | T

interface PillarFilterProps<T extends string = "all"> {
  label: string
  options: PillarOption<T>[]
  selected: PillarFilterValue<T>
  onSelect: (value: PillarFilterValue<T>) => void
}

export function PillarFilter<T extends string = "all">({
  label,
  options,
  selected,
  onSelect,
}: PillarFilterProps<T>) {
  return (
    <div className="mb-6">
      <p className="text-sm text-muted-foreground mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((pillar) => (
          <Button
            key={pillar.id}
            variant={selected === pillar.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(pillar.id)}
            className={`gap-2 ${selected === pillar.id ? "" : pillar.background ?? "bg-card/50"}`}
          >
            {pillar.icon && (
              <pillar.icon className={`h-4 w-4 ${selected === pillar.id ? "" : pillar.color}`} />
            )}
            {pillar.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
