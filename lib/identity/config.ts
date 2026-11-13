export function managedAuthEnabled() {
  return process.env.LIBERTURE_MANAGED_AUTH === "true"
}
