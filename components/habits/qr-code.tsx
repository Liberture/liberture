"use client"

import { useMemo } from "react"
import qrcode from "qrcode-generator"
import { useTranslations } from "@/components/i18n/locale-provider"

interface QrCodeProps {
  value: string
  className?: string
  title?: string
}

export function QrCode({ value, className, title }: QrCodeProps) {
  const t = useTranslations().habits.app.qrCode
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, "L")
    if (/^[0-9A-Z $%*+./:-]+$/.test(value)) {
      qr.addData(value, "Alphanumeric")
    } else {
      // Byte mode takes a binary string. Preserve UTF-8 in pairing and migration URLs.
      const bytes = new TextEncoder().encode(value)
      qr.addData(Array.from(bytes, byte => String.fromCharCode(byte)).join(""), "Byte")
    }
    qr.make()
    const count = qr.getModuleCount()
    const quietZone = 4
    const modules: string[] = []
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        if (qr.isDark(y, x)) modules.push(`M${x + quietZone} ${y + quietZone}h1v1h-1z`)
      }
    }
    return { size: count + quietZone * 2, path: modules.join("") }
  }, [value])

  return <svg role="img" aria-label={title ?? t.defaultTitle} viewBox={`0 0 ${size} ${size}`}
    shapeRendering="crispEdges" className={className}>
    <rect width={size} height={size} fill="white" />
    <path d={path} fill="black" />
  </svg>
}
