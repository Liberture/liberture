export function legacyTrackerPath(params: URLSearchParams) {
  const requested = params.get("view")
  params.delete("view")
  let section = "habits"
  if (requested && ["habits","todos","stats","calendar","catalog","challenges"].includes(requested)) section = requested
  if (requested && ["coach","market","discover"].includes(requested)) section = "catalog"
  if (requested === "coach") params.set("tab","coach")
  if (requested === "market") params.delete("tab")
  if (requested === "morning") params.set("morning","1")
  return "/tracker/" + section
}
