"use client"

import { useState, useCallback } from 'react'
import { Download, Copy, Check, Package, Image, Type, Palette, FileText, Monitor, Brain, Heart, Leaf, Zap, Dumbbell, Wallet, Layers, FileJson } from 'lucide-react'
import { LandingSection } from '../(landing)/landing-section'
import { LibertureLogo, LibertureLogoStatic } from '@/components/branding/LibertureLogo'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PILLAR_COLORS = [
  { id: 'cognition', name: 'Cognition', hex: '#8B5CF6', rgb: '139, 92, 246' },
  { id: 'recovery', name: 'Recovery', hex: '#06B6D4', rgb: '6, 182, 212' },
  { id: 'fueling', name: 'Fueling', hex: '#10B981', rgb: '16, 185, 129' },
  { id: 'mental', name: 'Mental', hex: '#EC4899', rgb: '236, 72, 153' },
  { id: 'physicality', name: 'Physicality', hex: '#F59E0B', rgb: '245, 158, 11' },
  { id: 'finance', name: 'Finance', hex: '#EAB308', rgb: '234, 179, 8' },
]

const BRAND_COLORS = [
  { name: 'Background', hex: '#0a0a0a', rgb: '10, 10, 10', use: 'Main background color' },
  { name: 'Card', hex: '#0f0f0f', rgb: '15, 15, 15', use: 'Card backgrounds' },
  { name: 'Border', hex: '#1a1a1a', rgb: '26, 26, 26', use: 'Borders and dividers' },
  { name: 'Text Primary', hex: '#ffffff', rgb: '255, 255, 255', use: 'Main text' },
  { name: 'Text Muted', hex: '#999999', rgb: '153, 153, 153', use: 'Secondary text' },
]

const LOGO_SIZES = [
  { size: 32, label: '32px', desc: 'Favicon' },
  { size: 48, label: '48px', desc: 'Small' },
  { size: 64, label: '64px', desc: 'Medium' },
  { size: 128, label: '128px', desc: 'Large' },
  { size: 256, label: '256px', desc: 'XL' },
  { size: 512, label: '512px', desc: 'Print' },
]

const BANNER_CONFIGS = [
  { id: 'og', name: 'Open Graph', width: 1200, height: 630, desc: 'Link previews (Facebook, Discord, Slack)' },
  { id: 'twitter', name: 'Twitter / X Banner', width: 1500, height: 500, desc: 'Profile header banner' },
  { id: 'linkedin', name: 'LinkedIn Banner', width: 1584, height: 396, desc: 'Company page cover' },
  { id: 'instagram', name: 'Instagram Post', width: 1080, height: 1080, desc: 'Square post format' },
  { id: 'youtube', name: 'YouTube Banner', width: 2560, height: 1440, desc: 'Channel art / banner' },
  { id: 'facebook', name: 'Facebook Cover', width: 820, height: 312, desc: 'Page cover photo' },
  { id: 'pinterest', name: 'Pinterest Pin', width: 1000, height: 1500, desc: 'Standard pin format' },
  { id: 'discord', name: 'Discord Banner', width: 960, height: 540, desc: 'Server banner image' },
]

const PILLAR_ICON_DATA = [
  { id: 'cognition', name: 'Cognition', color: '#8B5CF6', icon: 'Brain', file: '/media-kit/pillars/cognition.svg' },
  { id: 'recovery', name: 'Recovery', color: '#06B6D4', icon: 'Heart', file: '/media-kit/pillars/recovery.svg' },
  { id: 'fueling', name: 'Fueling', color: '#10B981', icon: 'Leaf', file: '/media-kit/pillars/fueling.svg' },
  { id: 'mental', name: 'Mental', color: '#EC4899', icon: 'Zap', file: '/media-kit/pillars/mental.svg' },
  { id: 'physicality', name: 'Physicality', color: '#F59E0B', icon: 'Dumbbell', file: '/media-kit/pillars/physicality.svg' },
  { id: 'finance', name: 'Finance', color: '#EAB308', icon: 'Wallet', file: '/media-kit/pillars/finance.svg' },
]

const STATIC_ASSETS = [
  { name: 'Logo (transparent)', file: '/media-kit/logos/liberture-logo-static.svg', dims: '512 x 512', w: 512, h: 512 },
  { name: 'Logo (dark bg)', file: '/media-kit/logos/liberture-logo-dark-bg.svg', dims: '512 x 512', w: 512, h: 512 },
  { name: 'Wordmark White', file: '/media-kit/wordmarks/liberture-wordmark-white.svg', dims: '400 x 80', w: 400, h: 80 },
  { name: 'Wordmark Gradient', file: '/media-kit/wordmarks/liberture-wordmark-gradient.svg', dims: '400 x 80', w: 400, h: 80 },
  { name: 'Lockup Horizontal', file: '/media-kit/lockups/liberture-lockup-horizontal.svg', dims: '460 x 100', w: 460, h: 100 },
  { name: 'Lockup Vertical', file: '/media-kit/lockups/liberture-lockup-vertical.svg', dims: '240 x 220', w: 240, h: 220 },
  { name: 'App Icon', file: '/media-kit/icons/liberture-icon-512.svg', dims: '512 x 512', w: 512, h: 512 },
  { name: 'Pillars Overview', file: '/media-kit/pillars/liberture-pillars-overview.svg', dims: '1200 x 320', w: 1200, h: 320 },
  { name: 'Design Tokens', file: '/media-kit/liberture-design-tokens.json', dims: 'JSON', w: 0, h: 0 },
]

const ICON_SIZES = [
  { size: 16, name: 'favicon-16' },
  { size: 32, name: 'favicon-32' },
  { size: 48, name: 'icon-48' },
  { size: 64, name: 'icon-64' },
  { size: 128, name: 'icon-128' },
  { size: 192, name: 'icon-192' },
  { size: 512, name: 'icon-512' },
  { size: 1024, name: 'icon-1024' },
]

const BOILERPLATE = {
  tagline: 'Master your biology. Unlock your potential.',
  oneLiner: 'Liberture is the Biological Operating System — a unified platform for evidence-based human optimization across six pillars: Cognition, Recovery, Fueling, Mental, Physicality, and Finance.',
  press: `Liberture is a free, open-access platform for human optimization. Built around six core pillars — Cognition, Recovery, Fueling, Mental, Physicality, and Finance — Liberture provides science-backed protocols, a curated directory of experts and organizations, and a growing knowledge base. Founded by Leon Acosta (CEO), Fabricio Acosta (CTO), and Robert Claw (AI Architect), Liberture is committed to radical self-ownership, evidence-first health optimization, and open access for all.`,
}

// ---------------------------------------------------------------------------
// SVG Generators
// ---------------------------------------------------------------------------

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#EC4899', '#F59E0B', '#EAB308']

// Hexagon positions: top-left, top-right, right, bottom-right, bottom-left, left
function hexPositions(cx: number, cy: number, r: number) {
  return [
    { x: cx - 0.5 * r, y: cy - 0.866 * r },
    { x: cx + 0.5 * r, y: cy - 0.866 * r },
    { x: cx + r,        y: cy },
    { x: cx + 0.5 * r, y: cy + 0.866 * r },
    { x: cx - 0.5 * r, y: cy + 0.866 * r },
    { x: cx - r,        y: cy },
  ]
}

function hexCircles(cx: number, cy: number, r: number, dotR: number, filterId: string) {
  return hexPositions(cx, cy, r).map((p, i) =>
    `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${dotR}" fill="${COLORS[i]}" filter="url(#${filterId})"/>`
  ).join('\n    ')
}

function generateLogoSVG(size: number, withBg = false): string {
  const dotSize = size * 0.08
  const r = size * 0.3
  const glowSize = dotSize * 0.5
  const circles = hexCircles(size / 2, size / 2, r, dotSize, `glow-${size}`)

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow-${size}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${glowSize}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  ${withBg ? `<rect width="${size}" height="${size}" rx="${size * 0.1875}" fill="#0a0a0a"/>` : ''}
    ${circles}
</svg>`
}

function generateWordmarkSVG(variant: 'white' | 'gradient' = 'white'): string {
  const w = 400, h = 80

  const fill = variant === 'gradient'
    ? 'url(#wm-grad)'
    : '#ffffff'

  const gradDef = variant === 'gradient'
    ? `<linearGradient id="wm-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="50%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>`
    : ''

  const circles = hexCircles(30, h / 2, 16, 4, 'wm-glow')

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="wm-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${gradDef}
  </defs>
    ${circles}
  <text x="62" y="${h / 2 + 10}" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="${fill}">Liberture</text>
</svg>`
}

function generateLockupSVG(orientation: 'horizontal' | 'vertical'): string {
  if (orientation === 'horizontal') {
    const w = 460, h = 100
    const circles = hexCircles(55, h / 2, 24, 5, 'lu-glow')

    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="lu-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
    ${circles}
  <text x="110" y="${h / 2 + 2}" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="#ffffff" dominant-baseline="middle">Liberture</text>
  <text x="110" y="${h / 2 + 22}" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="12" fill="#999999" dominant-baseline="middle">Your Biological Operating System</text>
</svg>`
  }

  // Vertical
  const w = 240, h = 220
  const circles = hexCircles(w / 2, 75, 30, 6, 'luv-glow')

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="luv-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
    ${circles}
  <text x="${w / 2}" y="150" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#ffffff" text-anchor="middle">Liberture</text>
  <text x="${w / 2}" y="170" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="10" fill="#999999" text-anchor="middle">Your Biological Operating System</text>
</svg>`
}

function generateBannerSVG(width: number, height: number): string {
  const hexR = Math.min(height * 0.18, 50)
  const dotR = hexR * 0.28
  const logoX = width * 0.12
  const logoY = height / 2

  const circles = hexCircles(logoX, logoY, hexR, dotR, 'b-glow')

  // Decorative background orbs
  const orb1X = width * 0.15, orb1Y = height * 0.25
  const orb2X = width * 0.85, orb2Y = height * 0.75
  const orb3X = width * 0.6, orb3Y = height * 0.2
  const orbR = height * 0.3

  const textX = logoX + hexR + dotR + 30
  const textY = height / 2

  const fontSize = Math.max(Math.min(height * 0.14, 72), 28)
  const subSize = Math.max(Math.min(height * 0.06, 28), 12)
  const tagSize = Math.max(Math.min(height * 0.045, 22), 10)

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#581c87"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="b-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${dotR * 0.8}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="orb-blur">
      <feGaussianBlur stdDeviation="${orbR * 0.5}"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg-grad)"/>
  <circle cx="${orb1X}" cy="${orb1Y}" r="${orbR}" fill="#8B5CF6" opacity="0.15" filter="url(#orb-blur)"/>
  <circle cx="${orb2X}" cy="${orb2Y}" r="${orbR}" fill="#06B6D4" opacity="0.15" filter="url(#orb-blur)"/>
  <circle cx="${orb3X}" cy="${orb3Y}" r="${orbR * 0.6}" fill="#10B981" opacity="0.1" filter="url(#orb-blur)"/>
    ${circles}
  <text x="${textX}" y="${textY - subSize * 0.3}" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" dominant-baseline="middle">Liberture</text>
  <text x="${textX}" y="${textY + fontSize * 0.55}" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="${subSize}" fill="#a78bfa" dominant-baseline="middle">Your Biological Operating System</text>
  <text x="${textX}" y="${textY + fontSize * 0.55 + subSize * 1.6}" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="${tagSize}" fill="#94a3b8" dominant-baseline="middle">Master your biology. Unlock your potential.</text>
</svg>`
}

function generatePillarsOverviewSVG(): string {
  const w = 1200, h = 320
  const pillars = [
    { name: 'Work', color: '#A78BFA' },
    { name: 'Sleep', color: '#67E8F9' },
    { name: 'Nutrition', color: '#4ADE80' },
    { name: 'Mind', color: '#F472B6' },
    { name: 'Exercise', color: '#FB923C' },
    { name: 'Finance', color: '#FACC15' },
  ]

  const circles = pillars.map((p, i) => {
    const cx = 100 + i * 200
    return `<circle cx="${cx}" cy="130" r="52" fill="${p.color}" filter="url(#po-glow)"/>
    <text x="${cx}" y="228" fill="white" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="26" font-weight="500" text-anchor="middle">${p.name}</text>`
  }).join('\n    ')

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="po-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#120825"/>
      <stop offset="30%" stop-color="#2d1b69"/>
      <stop offset="50%" stop-color="#3b1f8e"/>
      <stop offset="70%" stop-color="#2d1b69"/>
      <stop offset="100%" stop-color="#120825"/>
    </linearGradient>
    <filter id="po-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#po-bg)"/>
  <rect x="30" y="28" width="1140" height="264" rx="12" fill="none" stroke="rgba(139,92,246,0.25)" stroke-width="1.5"/>
    ${circles}
</svg>`
}

function generateIconSVG(size: number): string {
  const r = size * 0.1875
  const dotR = size * 0.08
  const hexR = size * 0.28
  const positions = hexPositions(size / 2, size / 2, hexR)

  const circles = positions.map((p, i) =>
    `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${dotR}" fill="${COLORS[i]}"/>`
  ).join('\n  ')

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0a0a0a"/>
  ${circles}
</svg>`
}

// ---------------------------------------------------------------------------
// Download helpers
// ---------------------------------------------------------------------------

function downloadSVG(svgString: string, filename: string) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadPNG(svgString: string, filename: string, width: number, height: number, scale = 2) {
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new window.Image()
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return
      const pngUrl = URL.createObjectURL(pngBlob)
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(pngUrl)
    }, 'image/png')
  }
  img.src = url
}

async function downloadStaticSVGAsPNG(svgUrl: string, filename: string, width: number, height: number, scale = 2) {
  try {
    const res = await fetch(svgUrl)
    const svgString = await res.text()
    downloadPNG(svgString, filename, width, height, scale)
  } catch {
    // Fallback: open file in new tab
    window.open(svgUrl, '_blank')
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-3xl font-bold">{title}</h2>
    </div>
  )
}

function DownloadButton({ onClick, label, variant = 'svg' }: { onClick: () => void; label: string; variant?: 'svg' | 'png' | 'both' }) {
  return (
    <Button variant="outline" className="gap-2" onClick={onClick}>
      <Download className="h-4 w-4" />
      {label}
      {variant !== 'both' && (
        <span className="text-xs text-muted-foreground uppercase ml-1">{variant}</span>
      )}
    </Button>
  )
}

function DownloadLink({ href, label, dims, onPNG }: { href: string; label: string; dims?: string; onPNG?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
      <Download className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium flex-1">{label}</span>
      {dims && <span className="text-xs text-muted-foreground mr-2">{dims}</span>}
      <a href={href} download className="text-xs font-medium px-2 py-1 rounded bg-card hover:bg-primary/20 transition-colors">SVG</a>
      {onPNG && (
        <button onClick={onPNG} className="text-xs font-medium px-2 py-1 rounded bg-card hover:bg-primary/20 transition-colors">PNG</button>
      )}
    </div>
  )
}

function SVGPreview({ svg, className = '' }: { svg: string; className?: string }) {
  return (
    <div
      className={`flex justify-center items-center bg-background rounded-xl overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MediaKitPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const CopyBtn = ({ text, id, mono = true }: { text: string; id: string; mono?: boolean }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex items-center justify-between w-full p-2 rounded-lg bg-background hover:bg-background/80 transition-colors"
    >
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{text}</span>
      {copiedId === id ? <Check className="h-4 w-4 text-green-500 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
    </button>
  )

  return (
    <main className="min-h-screen pt-24 pb-16">
      <LandingSection>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
                Media Kit
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Brand assets, colors, and usage guidelines for Liberture
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 gap-2"
                onClick={() => {
                  const assets = [
                    { svg: generateLogoSVG(512), name: 'liberture-logo-512.svg' },
                    { svg: generateLogoSVG(512, true), name: 'liberture-logo-bg-512.svg' },
                    { svg: generateWordmarkSVG('white'), name: 'liberture-wordmark-white.svg' },
                    { svg: generateWordmarkSVG('gradient'), name: 'liberture-wordmark-gradient.svg' },
                    { svg: generateLockupSVG('horizontal'), name: 'liberture-lockup-horizontal.svg' },
                    { svg: generateLockupSVG('vertical'), name: 'liberture-lockup-vertical.svg' },
                    { svg: generateBannerSVG(1200, 630), name: 'liberture-og-banner.svg' },
                    { svg: generateBannerSVG(1500, 500), name: 'liberture-twitter-banner.svg' },
                    { svg: generateBannerSVG(1584, 396), name: 'liberture-linkedin-banner.svg' },
                    { svg: generateIconSVG(512), name: 'liberture-icon-512.svg' },
                    { svg: generatePillarsOverviewSVG(), name: 'liberture-pillars-overview.svg' },
                  ]
                  assets.forEach(({ svg, name }, i) => {
                    setTimeout(() => downloadSVG(svg, name), i * 200)
                  })
                }}
              >
                <Package className="h-5 w-5" />
                Download All SVG
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const assets = [
                    { svg: generateLogoSVG(512), name: 'liberture-logo-512.png', w: 512, h: 512 },
                    { svg: generateLogoSVG(512, true), name: 'liberture-logo-bg-512.png', w: 512, h: 512 },
                    { svg: generateWordmarkSVG('white'), name: 'liberture-wordmark-white.png', w: 400, h: 80 },
                    { svg: generateWordmarkSVG('gradient'), name: 'liberture-wordmark-gradient.png', w: 400, h: 80 },
                    { svg: generateLockupSVG('horizontal'), name: 'liberture-lockup-horizontal.png', w: 460, h: 100 },
                    { svg: generateLockupSVG('vertical'), name: 'liberture-lockup-vertical.png', w: 240, h: 220 },
                    { svg: generateBannerSVG(1200, 630), name: 'liberture-og-banner.png', w: 1200, h: 630 },
                    { svg: generateBannerSVG(1500, 500), name: 'liberture-twitter-banner.png', w: 1500, h: 500 },
                    { svg: generateIconSVG(512), name: 'liberture-icon-512.png', w: 512, h: 512 },
                    { svg: generatePillarsOverviewSVG(), name: 'liberture-pillars-overview.png', w: 1200, h: 320 },
                  ]
                  assets.forEach(({ svg, name, w, h }, i) => {
                    setTimeout(() => downloadPNG(svg, name, w, h), i * 300)
                  })
                }}
              >
                <Package className="h-5 w-5" />
                Download All PNG
              </Button>
            </div>
          </div>

          {/* ============================================================= */}
          {/* 1. LOGO                                                       */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Image} title="Logo" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Animated Logo */}
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Animated Logo</h3>
                <div className="flex justify-center items-center h-48 bg-background rounded-xl mb-6">
                  <LibertureLogo size={120} animate={true} />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Continuous orbit animation. 6 dots representing our 6 pillars.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  The animated version is a React component. Download the static SVG for non-web use.
                </p>
                <DownloadButton
                  label="Download Static Logo"
                  variant="svg"
                  onClick={() => downloadSVG(generateLogoSVG(512), 'liberture-logo-512.svg')}
                />
              </div>

              {/* Static Logo */}
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Static Logo</h3>
                <div className="flex justify-center items-center h-48 bg-background rounded-xl mb-6">
                  <LibertureLogoStatic size={120} />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Static vertical alignment. Use when animation isn&apos;t suitable.
                </p>
                <div className="flex gap-3">
                  <DownloadButton
                    label="SVG"
                    variant="svg"
                    onClick={() => downloadSVG(generateLogoSVG(512), 'liberture-logo-static.svg')}
                  />
                  <DownloadButton
                    label="PNG"
                    variant="png"
                    onClick={() => downloadPNG(generateLogoSVG(512), 'liberture-logo-static.png', 512, 512)}
                  />
                  <DownloadButton
                    label="With Background"
                    variant="png"
                    onClick={() => downloadPNG(generateLogoSVG(512, true), 'liberture-logo-bg.png', 512, 512)}
                  />
                </div>
              </div>
            </div>

            {/* Logo Sizes */}
            <div className="p-8 rounded-2xl bg-card border border-border/50 mb-8">
              <h3 className="text-lg font-semibold mb-6">Logo Sizes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
                {LOGO_SIZES.map(({ size, label, desc }) => (
                  <button
                    key={size}
                    onClick={() => downloadPNG(generateLogoSVG(size), `liberture-logo-${size}.png`, size, size)}
                    className="group cursor-pointer"
                    title={`Download ${label} PNG`}
                  >
                    <div className="flex justify-center items-center h-24 bg-background rounded-xl mb-3 group-hover:ring-2 ring-primary/50 transition-all">
                      <LibertureLogoStatic size={Math.min(size, 64)} />
                    </div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                    <Download className="h-3 w-3 mx-auto mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">Click any size to download as PNG (2x retina)</p>
            </div>

            {/* Usage Guidelines */}
            <div className="p-8 rounded-2xl bg-card border border-border/50">
              <h3 className="text-lg font-semibold mb-6">Usage Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[
                    'Use the logo on dark backgrounds (#0a0a0a or darker)',
                    'Maintain minimum spacing around the logo (equal to dot height)',
                    'Use the static version for print materials',
                    'Use the version with background for light surfaces',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                      <div>
                        <p className="font-medium text-green-500">DO</p>
                        <p className="text-sm text-muted-foreground">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[
                    'Change the colors of individual dots',
                    'Distort or skew the logo proportions',
                    'Place on light backgrounds without the dark background version',
                    'Add drop shadows or effects beyond the built-in glow',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                      <div>
                        <p className="font-medium text-red-500">DON&apos;T</p>
                        <p className="text-sm text-muted-foreground">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* 2. WORDMARK & LOCKUPS                                         */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Type} title="Wordmark & Lockups" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Wordmark White */}
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Wordmark — White</h3>
                <SVGPreview svg={generateWordmarkSVG('white')} className="h-32 p-4 mb-4" />
                <div className="flex gap-3">
                  <DownloadButton label="SVG" variant="svg" onClick={() => downloadSVG(generateWordmarkSVG('white'), 'liberture-wordmark-white.svg')} />
                  <DownloadButton label="PNG" variant="png" onClick={() => downloadPNG(generateWordmarkSVG('white'), 'liberture-wordmark-white.png', 400, 80)} />
                </div>
              </div>

              {/* Wordmark Gradient */}
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Wordmark — Gradient</h3>
                <SVGPreview svg={generateWordmarkSVG('gradient')} className="h-32 p-4 mb-4" />
                <div className="flex gap-3">
                  <DownloadButton label="SVG" variant="svg" onClick={() => downloadSVG(generateWordmarkSVG('gradient'), 'liberture-wordmark-gradient.svg')} />
                  <DownloadButton label="PNG" variant="png" onClick={() => downloadPNG(generateWordmarkSVG('gradient'), 'liberture-wordmark-gradient.png', 400, 80)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Horizontal Lockup */}
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Lockup — Horizontal</h3>
                <SVGPreview svg={generateLockupSVG('horizontal')} className="h-36 p-4 mb-4" />
                <div className="flex gap-3">
                  <DownloadButton label="SVG" variant="svg" onClick={() => downloadSVG(generateLockupSVG('horizontal'), 'liberture-lockup-horizontal.svg')} />
                  <DownloadButton label="PNG" variant="png" onClick={() => downloadPNG(generateLockupSVG('horizontal'), 'liberture-lockup-horizontal.png', 460, 100)} />
                </div>
              </div>

              {/* Vertical Lockup */}
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Lockup — Vertical</h3>
                <SVGPreview svg={generateLockupSVG('vertical')} className="h-56 p-4 mb-4" />
                <div className="flex gap-3">
                  <DownloadButton label="SVG" variant="svg" onClick={() => downloadSVG(generateLockupSVG('vertical'), 'liberture-lockup-vertical.svg')} />
                  <DownloadButton label="PNG" variant="png" onClick={() => downloadPNG(generateLockupSVG('vertical'), 'liberture-lockup-vertical.png', 240, 220)} />
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* 3. BANNERS                                                    */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Monitor} title="Social Banners" />
            <p className="text-muted-foreground mb-8 -mt-4">
              Ready-to-use banners for social media profiles and link previews.
            </p>

            <div className="space-y-8">
              {BANNER_CONFIGS.map((banner) => {
                const svg = generateBannerSVG(banner.width, banner.height)
                const aspectRatio = `${banner.width} / ${banner.height}`
                return (
                  <div key={banner.id} className="p-8 rounded-2xl bg-card border border-border/50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{banner.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {banner.width} x {banner.height}px — {banner.desc}
                        </p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <DownloadButton
                          label="SVG"
                          variant="svg"
                          onClick={() => downloadSVG(svg, `liberture-${banner.id}-banner.svg`)}
                        />
                        <DownloadButton
                          label="PNG"
                          variant="png"
                          onClick={() => downloadPNG(svg, `liberture-${banner.id}-banner.png`, banner.width, banner.height)}
                        />
                      </div>
                    </div>
                    <div
                      className="w-full bg-background rounded-xl overflow-hidden"
                      style={{ aspectRatio }}
                    >
                      <div
                        className="w-full h-full"
                        dangerouslySetInnerHTML={{
                          __html: svg.replace(
                            `width="${banner.width}" height="${banner.height}"`,
                            `width="100%" height="100%" preserveAspectRatio="xMidYMid meet"`
                          ),
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ============================================================= */}
          {/* 4. APP ICONS                                                  */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Image} title="App Icons" />
            <p className="text-muted-foreground mb-8 -mt-4">
              Rounded square icons with dark background for favicons, app stores, and PWA manifests.
            </p>

            <div className="p-8 rounded-2xl bg-card border border-border/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 text-center">
                {ICON_SIZES.map(({ size, name }) => (
                  <button
                    key={size}
                    onClick={() => downloadPNG(generateIconSVG(size), `${name}.png`, size, size, size <= 64 ? 1 : 2)}
                    className="group cursor-pointer"
                    title={`Download ${size}x${size} PNG`}
                  >
                    <div className="flex justify-center items-center h-20 bg-background rounded-xl mb-2 group-hover:ring-2 ring-primary/50 transition-all">
                      <SVGPreview svg={generateIconSVG(Math.min(size, 48))} />
                    </div>
                    <p className="text-xs font-medium">{size}px</p>
                    <Download className="h-3 w-3 mx-auto mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">Click any size to download as PNG</p>
            </div>
          </section>

          {/* ============================================================= */}
          {/* 5a. PILLARS OVERVIEW                                          */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Layers} title="Pillars Overview" />
            <p className="text-muted-foreground mb-8 -mt-4">
              The 6 pillars of Liberture — a single graphic showing all categories at a glance.
            </p>

            <div className="p-8 rounded-2xl bg-card border border-border/50">
              <div className="w-full rounded-xl overflow-hidden mb-6" style={{ aspectRatio: '1200 / 320' }}>
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{
                    __html: generatePillarsOverviewSVG().replace(
                      'width="1200" height="320"',
                      'width="100%" height="100%" preserveAspectRatio="xMidYMid meet"'
                    ),
                  }}
                />
              </div>
              <div className="flex gap-3">
                <DownloadButton
                  label="SVG"
                  variant="svg"
                  onClick={() => downloadSVG(generatePillarsOverviewSVG(), 'liberture-pillars-overview.svg')}
                />
                <DownloadButton
                  label="PNG"
                  variant="png"
                  onClick={() => downloadPNG(generatePillarsOverviewSVG(), 'liberture-pillars-overview.png', 1200, 320)}
                />
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* 5b. PILLAR ICONS                                              */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Layers} title="Pillar Icons" />
            <p className="text-muted-foreground mb-8 -mt-4">
              Individual icons for each of the 6 pillars. 256 x 256px SVG with glow effect.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PILLAR_ICON_DATA.map((pillar) => (
                <div key={pillar.id} className="p-6 rounded-2xl bg-card border border-border/50">
                  <div
                    className="flex justify-center items-center h-32 rounded-xl mb-4"
                    style={{ backgroundColor: `${pillar.color}10` }}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: pillar.color }}>
                      {pillar.icon === 'Brain' && <Brain className="h-8 w-8 text-white" />}
                      {pillar.icon === 'Heart' && <Heart className="h-8 w-8 text-white" />}
                      {pillar.icon === 'Leaf' && <Leaf className="h-8 w-8 text-white" />}
                      {pillar.icon === 'Zap' && <Zap className="h-8 w-8 text-white" />}
                      {pillar.icon === 'Dumbbell' && <Dumbbell className="h-8 w-8 text-white" />}
                      {pillar.icon === 'Wallet' && <Wallet className="h-8 w-8 text-white" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{pillar.name}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{pillar.color}</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={pillar.file}
                      download
                      className="flex items-center justify-center gap-2 flex-1 p-2 rounded-lg bg-background hover:bg-background/80 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      SVG
                    </a>
                    <button
                      onClick={() => downloadStaticSVGAsPNG(pillar.file, `liberture-${pillar.id}.png`, 256, 256)}
                      className="flex items-center justify-center gap-2 flex-1 p-2 rounded-lg bg-background hover:bg-background/80 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      PNG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================= */}
          {/* 6. STATIC FILE DOWNLOADS                                      */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={FileJson} title="Static Assets & Tokens" />
            <p className="text-muted-foreground mb-8 -mt-4">
              Pre-built SVG files and design tokens for direct use in your projects.
            </p>

            <div className="p-8 rounded-2xl bg-card border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STATIC_ASSETS.map((asset) => (
                  <DownloadLink
                    key={asset.file}
                    href={asset.file}
                    label={asset.name}
                    dims={asset.dims}
                    onPNG={asset.w > 0 ? () => downloadStaticSVGAsPNG(
                      asset.file,
                      asset.file.replace('.svg', '.png').split('/').pop()!,
                      asset.w,
                      asset.h
                    ) : undefined}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* 7. PILLAR COLORS                                              */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Palette} title="Pillar Colors" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PILLAR_COLORS.map((color) => (
                <div key={color.id} className="p-6 rounded-2xl bg-card border border-border/50">
                  <div
                    className="h-24 rounded-xl mb-4"
                    style={{ backgroundColor: color.hex }}
                  />
                  <h3 className="text-lg font-semibold mb-2">{color.name}</h3>
                  <div className="space-y-2">
                    <CopyBtn text={color.hex} id={`${color.id}-hex`} />
                    <CopyBtn text={`rgb(${color.rgb})`} id={`${color.id}-rgb`} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================= */}
          {/* 6. BRAND COLORS                                               */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Palette} title="Brand Colors" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BRAND_COLORS.map((color, index) => (
                <div key={index} className="p-6 rounded-2xl bg-card border border-border/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="h-16 w-16 rounded-xl border border-border shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{color.name}</h3>
                      <p className="text-sm text-muted-foreground">{color.use}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <CopyBtn text={color.hex} id={`brand-${index}-hex`} />
                    <CopyBtn text={`rgb(${color.rgb})`} id={`brand-${index}-rgb`} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================= */}
          {/* 7. TYPOGRAPHY                                                 */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={Type} title="Typography" />
            <div className="p-8 rounded-2xl bg-card border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Primary Font</p>
                    <h3 className="text-4xl font-bold mb-2">Inter</h3>
                    <p className="text-muted-foreground mb-3">Used for all UI text, headings, and body copy</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://fonts.google.com/specimen/Inter" target="_blank" rel="noopener noreferrer" className="gap-2">
                        <Download className="h-3 w-3" />
                        Download from Google Fonts
                      </a>
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Weights Used</p>
                    <div className="space-y-2">
                      <p className="font-normal">400 — Regular (Body text)</p>
                      <p className="font-medium">500 — Medium (UI elements)</p>
                      <p className="font-semibold">600 — Semibold (Subheadings)</p>
                      <p className="font-bold">700 — Bold (Headings)</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">Type Scale</p>
                  <p className="text-5xl font-bold">Heading 1</p>
                  <p className="text-4xl font-bold">Heading 2</p>
                  <p className="text-3xl font-bold">Heading 3</p>
                  <p className="text-2xl font-semibold">Heading 4</p>
                  <p className="text-xl font-semibold">Heading 5</p>
                  <p className="text-lg font-medium">Heading 6</p>
                  <p className="text-base">Body text — The quick brown fox jumps over the lazy dog.</p>
                  <p className="text-sm text-muted-foreground">Caption text — Secondary information and metadata.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* 8. BOILERPLATE & TAGLINES                                     */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle icon={FileText} title="Boilerplate & Taglines" />
            <p className="text-muted-foreground mb-8 -mt-4">
              Ready-to-copy text for press releases, partner pages, and social media bios.
            </p>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tagline</h3>
                </div>
                <p className="text-xl font-semibold mb-3">{BOILERPLATE.tagline}</p>
                <CopyBtn text={BOILERPLATE.tagline} id="bp-tagline" mono={false} />
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">One-Liner</h3>
                </div>
                <p className="text-base mb-3">{BOILERPLATE.oneLiner}</p>
                <CopyBtn text={BOILERPLATE.oneLiner} id="bp-oneliner" mono={false} />
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Press Boilerplate</h3>
                </div>
                <p className="text-base text-muted-foreground mb-3 leading-relaxed">{BOILERPLATE.press}</p>
                <CopyBtn text={BOILERPLATE.press} id="bp-press" mono={false} />
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* CTA                                                           */}
          {/* ============================================================= */}
          <section>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-400/20 border border-primary/30 text-center">
              <h2 className="text-2xl font-bold mb-4">Need More Assets?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                For press inquiries, partnership requests, or custom assets, please contact our team.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <a href="/contact">Contact Us</a>
              </Button>
            </div>
          </section>
        </div>
      </LandingSection>
    </main>
  )
}
