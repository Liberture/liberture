import { Avatar } from "@/components/habits/account-header"

export function PlayerProfile({ name, picture, small = false }: { name: string; picture?: string | null; small?: boolean }) {
  return <span className="inline-flex min-w-0 items-center justify-center gap-2">
    <Avatar key={picture} src={picture ?? null} name={name} size={small ? 20 : 36} />
    <span className="min-w-0 truncate font-semibold" title={name}>{name}</span>
  </span>
}
