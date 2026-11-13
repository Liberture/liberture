import { Globe, Instagram, Mic, Youtube } from "lucide-react"
import { BrandMark, SocialIcon } from "@/components/ui/social-icon"

type Profile = {
  name: string
  slug: string
  wikipedia: string | null
  website: string | null
  twitter: string | null
  instagram: string | null
  youtube: string | null
  podcast: string | null
}

function webUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return ["http:", "https:"].includes(url.protocol) ? url : null
  } catch { return null }
}

function accountLink(value: string | null, site: string) {
  if (!value) return null
  const path = (webUrl(value)?.pathname ?? value).replace(/^\/+|\/+$/g, "")
  if (!path) return null
  const handle = path.replace(/^@/, "")
  const channel = site === "youtube.com" && path.includes("/")
  return { href: `https://${site}/${channel ? path : (site === "youtube.com" ? "@" : "") + handle}`, alias: channel ? path : "@" + handle }
}

export function ProfileSocials({ person }: { person: Profile }) {
  const website = webUrl(person.website)
  const wiki = webUrl(person.wikipedia)
  const podcast = webUrl(person.podcast)
  const x = accountLink(person.twitter, "x.com")
  const instagram = accountLink(person.instagram, "instagram.com")
  const youtube = accountLink(person.youtube, "youtube.com")
  const links = [
    wiki && !(person.slug.startsWith("dan-s-kennedy") && wiki.pathname.endsWith("/Dan_Kennedy_(author)")) && { label: `Wikipedia · ${person.name}`, href: wiki.href, icon: <BrandMark brand="wikipedia" /> },
    website && { label: website.hostname, href: website.href, icon: <Globe /> },
    x && { label: `X · ${x.alias}`, href: x.href, icon: <BrandMark brand="x" /> },
    instagram && { label: `Instagram · ${instagram.alias}`, href: instagram.href, icon: <Instagram /> },
    youtube && { label: `YouTube · ${youtube.alias}`, href: youtube.href, icon: <Youtube /> },
    person.podcast && { label: `Podcast · ${podcast?.hostname ?? person.podcast}`, href: podcast?.href, icon: <Mic /> },
  ]
  return <div className="flex flex-wrap gap-1">{links.map(link => link && (
    <SocialIcon key={link.label} href={link.href} label={link.label}>{link.icon}</SocialIcon>
  ))}</div>
}
