import { BreadcrumbSchema } from "@/components/seo/JsonLd"

const labels: Record<string,string> = { about:"About", articles:"Articles", books:"Books", contact:"Contact", directory:"Directory", docs:"Documentation", games:"Games", "get-started":"Get started", "media-kit":"Media kit", organizations:"Organizations", people:"People", pillars:"Pillars", privacy:"Privacy", protocols:"Protocols", support:"Support", terms:"Terms", chatgpt:"ChatGPT", claude:"Claude", api:"API", permissions:"Permissions", updates:"Updates", sleep:"Sleep", hydration:"Hydration", work:"Work", nutrition:"Nutrition", exercise:"Exercise", finance:"Finance", mind:"Mind" }
const directorySections = ["people","books","organizations","articles"]

export function sectionTrail(section: string) {
  const root = "https://liberture.com"
  return [
    {name:"Liberture", url:root},
    ...(directorySections.includes(section) ? [{name:"Directory",url:root+"/directory"}] : []),
    {name:labels[section], url:root+"/"+section},
  ]
}

export function SectionBreadcrumbs({pathname}: {pathname:string}) {
  const segments = pathname.split("/").filter(Boolean)
  if (!segments.length || !segments.every(s => Object.hasOwn(labels,s))) return null
  if (segments.length > 1 && (segments.length !== 2 || !["docs","games","pillars"].includes(segments[0]))) return null
  const items = sectionTrail(segments[0])
  if (segments.length === 2) items.push({name:labels[segments[1]],url:"https://liberture.com"+pathname})
  return <BreadcrumbSchema items={items} />
}
