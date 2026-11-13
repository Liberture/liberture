import { BreadcrumbSchema } from "@/components/seo/JsonLd"

const labels: Record<string,string> = { about:"About", articles:"Articles", books:"Books", contact:"Contact", directory:"Directory", docs:"Documentation", games:"Games", "get-started":"Get started", "media-kit":"Media kit", organizations:"Organizations", people:"People", pillars:"Pillars", privacy:"Privacy", protocols:"Protocols", support:"Support", terms:"Terms", chatgpt:"ChatGPT", claude:"Claude", api:"API", permissions:"Permissions", updates:"Updates", sleep:"Sleep", hydration:"Hydration", work:"Work", nutrition:"Nutrition", exercise:"Exercise", finance:"Finance", mind:"Mind" }
export default async function Page({params}: {params: Promise<{segments:string[]}>}) {
  const {segments} = await params
  if (!segments.every(s => Object.hasOwn(labels,s)) || (segments.length > 1 && !["docs","games","pillars"].includes(segments[0]))) return null
  const origin = "https://liberture.com"
  return <BreadcrumbSchema items={[{name:"Liberture", url:origin}, ...segments.map((s,i) => ({name:labels[s],url:origin+"/"+segments.slice(0,i+1).join("/")}))]} />
}
