import { getMessages } from "next-intl/server"
import type { Catalog } from "@/lib/translations"

/** Typed access to structured messages such as guide sections and habit presets. */
export async function getSiteMessages() {
  return (await getMessages()) as unknown as Catalog
}
