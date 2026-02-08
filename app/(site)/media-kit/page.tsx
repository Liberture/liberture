"use client"

import { useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import { LandingSection } from '../(landing)/landing-section'
import { LibertureLogo, LibertureLogoStatic } from '@/components/branding/LibertureLogo'
import { Button } from '@/components/ui/button'

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

export default function MediaKitPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedColor(id)
    setTimeout(() => setCopiedColor(null), 2000)
  }

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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Brand assets, colors, and usage guidelines for Liberture
            </p>
          </div>

          {/* Logo Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Logo</h2>
            
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
                <Button variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download SVG Component
                </Button>
              </div>

              {/* Static Logo */}
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Static Logo</h3>
                <div className="flex justify-center items-center h-48 bg-background rounded-xl mb-6">
                  <LibertureLogoStatic size={120} />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Static vertical alignment. Use when animation isn't suitable.
                </p>
                <Button variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
              </div>
            </div>

            {/* Logo Sizes */}
            <div className="p-8 rounded-2xl bg-card border border-border/50 mb-8">
              <h3 className="text-lg font-semibold mb-6">Logo Sizes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="flex justify-center items-center h-24 bg-background rounded-xl mb-3">
                    <LibertureLogo size={32} animate={true} />
                  </div>
                  <p className="text-sm text-muted-foreground">32px - Small</p>
                </div>
                <div>
                  <div className="flex justify-center items-center h-24 bg-background rounded-xl mb-3">
                    <LibertureLogo size={48} animate={true} />
                  </div>
                  <p className="text-sm text-muted-foreground">48px - Medium</p>
                </div>
                <div>
                  <div className="flex justify-center items-center h-24 bg-background rounded-xl mb-3">
                    <LibertureLogo size={64} animate={true} />
                  </div>
                  <p className="text-sm text-muted-foreground">64px - Large</p>
                </div>
                <div>
                  <div className="flex justify-center items-center h-24 bg-background rounded-xl mb-3">
                    <LibertureLogo size={80} animate={true} />
                  </div>
                  <p className="text-sm text-muted-foreground">80px - XL</p>
                </div>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div className="p-8 rounded-2xl bg-card border border-border/50">
              <h3 className="text-lg font-semibold mb-6">Usage Guidelines</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-green-500">DO</p>
                    <p className="text-sm text-muted-foreground">Use the logo on dark backgrounds (#0a0a0a or darker)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-green-500">DO</p>
                    <p className="text-sm text-muted-foreground">Maintain minimum spacing around the logo (equal to dot height)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-green-500">DO</p>
                    <p className="text-sm text-muted-foreground">Use the static version for print materials</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-red-500">DON'T</p>
                    <p className="text-sm text-muted-foreground">Change the colors of individual dots</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-red-500">DON'T</p>
                    <p className="text-sm text-muted-foreground">Distort or skew the logo proportions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-red-500">DON'T</p>
                    <p className="text-sm text-muted-foreground">Place on light backgrounds without adjustment</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pillar Colors */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Pillar Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PILLAR_COLORS.map((color) => (
                <div key={color.id} className="p-6 rounded-2xl bg-card border border-border/50">
                  <div 
                    className="h-24 rounded-xl mb-4"
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <h3 className="text-lg font-semibold mb-2">{color.name}</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => copyToClipboard(color.hex, `${color.id}-hex`)}
                      className="flex items-center justify-between w-full p-2 rounded-lg bg-background hover:bg-background/80 transition-colors"
                    >
                      <span className="text-sm font-mono">{color.hex}</span>
                      {copiedColor === `${color.id}-hex` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(`rgb(${color.rgb})`, `${color.id}-rgb`)}
                      className="flex items-center justify-between w-full p-2 rounded-lg bg-background hover:bg-background/80 transition-colors"
                    >
                      <span className="text-sm font-mono text-muted-foreground">RGB: {color.rgb}</span>
                      {copiedColor === `${color.id}-rgb` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Brand Colors */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Brand Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BRAND_COLORS.map((color, index) => (
                <div key={index} className="p-6 rounded-2xl bg-card border border-border/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="h-16 w-16 rounded-xl border border-border"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{color.name}</h3>
                      <p className="text-sm text-muted-foreground">{color.use}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => copyToClipboard(color.hex, `brand-${index}-hex`)}
                      className="flex items-center justify-between w-full p-2 rounded-lg bg-background hover:bg-background/80 transition-colors"
                    >
                      <span className="text-sm font-mono">{color.hex}</span>
                      {copiedColor === `brand-${index}-hex` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(`rgb(${color.rgb})`, `brand-${index}-rgb`)}
                      className="flex items-center justify-between w-full p-2 rounded-lg bg-background hover:bg-background/80 transition-colors"
                    >
                      <span className="text-sm font-mono text-muted-foreground">RGB: {color.rgb}</span>
                      {copiedColor === `brand-${index}-rgb` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Typography</h2>
            <div className="p-8 rounded-2xl bg-card border border-border/50">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Primary Font</p>
                  <h3 className="text-4xl font-bold mb-2">Inter</h3>
                  <p className="text-muted-foreground">Used for all UI text, headings, and body copy</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Weights Used</p>
                  <div className="space-y-2">
                    <p className="font-normal">400 - Regular (Body text)</p>
                    <p className="font-medium">500 - Medium (UI elements)</p>
                    <p className="font-semibold">600 - Semibold (Subheadings)</p>
                    <p className="font-bold">700 - Bold (Headings)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
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
