import AdminPanel from "./admin-home"
import { managedAuthEnabled } from "@/lib/identity/config"

export default function AdminHome() {
  return <AdminPanel managed={managedAuthEnabled()} />
}
