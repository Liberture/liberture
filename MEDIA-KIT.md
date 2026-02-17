# Liberture Media Kit — Complete Reference

> Use this document as a blueprint to create a media kit for any personal or brand website.
> It documents every decision, asset, structure, and technique used in Liberture's media kit.

---

## 1. Brand Foundation

Before creating any assets, define these core elements:

### Identity

| Element | Liberture Value | Your Value |
|---------|----------------|------------|
| Brand Name | Liberture | ___________ |
| Tagline | "Master your biology. Unlock your potential." | ___________ |
| One-liner | "Liberture is the Biological Operating System — a unified platform for evidence-based human optimization." | ___________ |
| Descriptor | "Your Biological Operating System" | ___________ |

### Press Boilerplate

A ready-to-copy paragraph for journalists, partners, and directory listings:

> Liberture is a free, open-access platform for human optimization. Built around six core pillars — Cognition, Recovery, Fueling, Mental, Physicality, and Finance — Liberture provides science-backed protocols, a curated directory of experts and organizations, and a growing knowledge base. Founded by Leon Acosta (CEO), Fabricio Acosta (CTO), and Robert Claw (AI Architect), Liberture is committed to radical self-ownership, evidence-first health optimization, and open access for all.

---

## 2. Logo System

### 2a. Logo Mark (Icon)

The primary logo is a **hexagonal arrangement of 6 colored dots**, each representing a pillar. It uses a **glow effect** (`feGaussianBlur` filter) for a neon feel.

**Construction:**
- 6 circles positioned using hexagon math: `(cx ± 0.5r, cy ± 0.866r)` for top/bottom pairs, `(cx ± r, cy)` for left/right
- Each dot uses a pillar color (see Color section below)
- Glow filter: `feGaussianBlur` with `stdDeviation` proportional to dot radius (~50% of dot size)
- Dot radius = 8% of canvas size
- Hex radius (distance from center to dot center) = 30% of canvas size
- Corner radius for background variants = 18.75% of canvas size

**Variants created:**

| Variant | File | Size | Background |
|---------|------|------|------------|
| Static (transparent) | `logos/liberture-logo-static.svg` | 512x512 | None (transparent) |
| Dark background | `logos/liberture-logo-dark-bg.svg` | 512x512 | `#0a0a0a` rounded rect |
| App icon (no glow) | `icons/liberture-icon-512.svg` | 512x512 | `#0a0a0a` rounded rect, no glow filter |

**Key difference:** The app icon variant omits the glow filter for crispness at small sizes. The logo versions include glow for the signature neon look.

### 2b. Wordmark

The brand name set in **Inter Bold 36px**, paired with the small hexagonal logo mark on the left.

| Variant | File | Size | Text Fill |
|---------|------|------|-----------|
| White | `wordmarks/liberture-wordmark-white.svg` | 400x80 | `#ffffff` |
| Gradient | `wordmarks/liberture-wordmark-gradient.svg` | 400x80 | Linear gradient: `#8B5CF6` → `#06B6D4` → `#10B981` |

**Structure:** Small hex logo (dot radius 4px, hex radius 16px) at left, text at x=62 with Inter Bold.

### 2c. Lockups (Logo + Wordmark)

| Variant | File | Size | Layout |
|---------|------|------|--------|
| Horizontal | `lockups/liberture-lockup-horizontal.svg` | 460x100 | Logo left, name + descriptor right |
| Vertical | `lockups/liberture-lockup-vertical.svg` | 240x220 | Logo top, name + descriptor below |

Both include the descriptor text "Your Biological Operating System" in `#999999` at a smaller size (10-12px).

### 2d. Animated Logo (React component only)

The animated version is a **React component** (`<LibertureLogo animate={true} />`), not a static file. It uses CSS animations to orbit the dots. This is web-only and not exported as a downloadable asset.

---

## 3. Color Palette

### Pillar Colors (Primary Accent Colors)

Each pillar has a signature color. These are the most important brand colors:

| Pillar | Hex | RGB | Tailwind-style Name |
|--------|-----|-----|---------------------|
| Cognition | `#8B5CF6` | 139, 92, 246 | Purple/Violet |
| Recovery | `#06B6D4` | 6, 182, 212 | Cyan |
| Fueling | `#10B981` | 16, 185, 129 | Emerald/Green |
| Mental | `#EC4899` | 236, 72, 153 | Pink |
| Physicality | `#F59E0B` | 245, 158, 11 | Amber/Orange |
| Finance | `#EAB308` | 234, 179, 8 | Yellow |

### Brand Colors (UI/Surface Colors)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | `#0a0a0a` | 10, 10, 10 | Main page background |
| Card | `#0f0f0f` | 15, 15, 15 | Card/section backgrounds |
| Border | `#1a1a1a` | 26, 26, 26 | Borders and dividers |
| Text Primary | `#ffffff` | 255, 255, 255 | Main text |
| Text Muted | `#999999` | 153, 153, 153 | Secondary/caption text |

### Brand Gradient

Used in the wordmark and page headings:
```css
background: linear-gradient(to right, #8B5CF6, #06B6D4, #10B981);
/* Tailwind: bg-gradient-to-r from-primary via-cyan-400 to-green-400 */
```

### Design Tokens File

All colors, typography, and brand data exported as a JSON design tokens file following the [Design Tokens Community Group format](https://design-tokens.github.io/community-group/format/):

**File:** `liberture-design-tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "brand": {
    "name": "Liberture",
    "tagline": "Master your biology. Unlock your potential.",
    "description": "Your Biological Operating System"
  },
  "colors": { ... },
  "pillar-colors": { ... },
  "typography": {
    "font-family": { "value": "Inter, system-ui, -apple-system, sans-serif" },
    "weights": { "regular": 400, "medium": 500, "semibold": 600, "bold": 700 }
  }
}
```

---

## 4. Typography

| Property | Value |
|----------|-------|
| Primary Font | **Inter** (Google Fonts) |
| Fallback Stack | `Inter, system-ui, -apple-system, sans-serif` |
| Mono Font | **Geist Mono** (for code/data) |
| Weights Used | 400 Regular, 500 Medium, 600 Semibold, 700 Bold |

**Type Scale (displayed on media kit page):**
- H1: `text-5xl` / 3rem Bold
- H2: `text-4xl` / 2.25rem Bold
- H3: `text-3xl` / 1.875rem Bold
- H4: `text-2xl` / 1.5rem Semibold
- H5: `text-xl` / 1.25rem Semibold
- H6: `text-lg` / 1.125rem Medium
- Body: `text-base` / 1rem Regular
- Caption: `text-sm` / 0.875rem Muted color

---

## 5. Pillar Icons

Individual 256x256 SVG icons for each pillar category. Each icon has:
- An outer circle (stroke only, `opacity="0.2"`, `r=80`)
- An inner filled circle (`r=32`) with glow filter
- A white icon path drawn on top (brain, heart, leaf, zap, dumbbell, wallet)
- All in the pillar's signature color

**Files:** `pillars/{pillar-name}.svg` (cognition, recovery, fueling, mental, physicality, finance)

**Also:** `pillars/liberture-pillars-overview.svg` — A 1200x320 banner showing all 6 pillars side by side with a purple gradient background.

---

## 6. Social Media Banners

Generated dynamically via SVG with this structure:
- Dark gradient background (`#0f172a` → `#581c87` → `#0f172a`)
- Decorative blurred orbs (purple, cyan, green at low opacity)
- Hexagonal logo mark on the left
- Brand name, descriptor, and tagline as text on the right
- Font sizes scale proportionally to banner height

**Banner sizes generated:**

| Platform | Width | Height | Aspect |
|----------|-------|--------|--------|
| Open Graph | 1200 | 630 | ~1.9:1 |
| Twitter/X Banner | 1500 | 500 | 3:1 |
| LinkedIn Banner | 1584 | 396 | 4:1 |
| Instagram Post | 1080 | 1080 | 1:1 |
| YouTube Banner | 2560 | 1440 | ~1.78:1 |
| Facebook Cover | 820 | 312 | ~2.6:1 |
| Pinterest Pin | 1000 | 1500 | 2:3 |
| Discord Banner | 960 | 540 | ~1.78:1 |

---

## 7. App Icons (Favicon / PWA)

Generated at multiple sizes from the same logo mark, with dark background and rounded corners. **No glow filter** at small sizes for clarity.

| Size | Use |
|------|-----|
| 16px | Browser favicon (tiny tab icon) |
| 32px | Browser favicon (standard) |
| 48px | Windows taskbar |
| 64px | Desktop shortcut |
| 128px | Chrome Web Store |
| 192px | PWA manifest (`"purpose": "any"` + `"maskable"`) |
| 512px | PWA manifest / app stores |
| 1024px | High-res app icon |

**PWA Manifest references:**
```json
{
  "icons": [
    { "src": "/favicon.ico", "sizes": "32x32", "type": "image/x-icon" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/apple-icon.png", "sizes": "180x180", "type": "image/png", "purpose": "any" }
  ]
}
```

**Next.js icon files:**
- `app/icon.png` — Auto-used as favicon (512x512, converted from SVG via `rsvg-convert`)
- `app/apple-icon.png` — Auto-used as Apple touch icon (180x180)

---

## 8. File Structure

```
public/
  media-kit/
    logos/
      liberture-logo-static.svg          # Transparent bg, with glow
      liberture-logo-dark-bg.svg         # #0a0a0a bg, with glow
    wordmarks/
      liberture-wordmark-white.svg       # White text + small hex mark
      liberture-wordmark-gradient.svg    # Gradient text + small hex mark
    lockups/
      liberture-lockup-horizontal.svg    # Logo + name + descriptor side-by-side
      liberture-lockup-vertical.svg      # Logo above name + descriptor
    icons/
      liberture-icon-512.svg             # App icon (no glow, dark bg)
    pillars/
      cognition.svg                      # Individual pillar icons (256x256)
      recovery.svg
      fueling.svg
      mental.svg
      physicality.svg
      finance.svg
      liberture-pillars-overview.svg     # All 6 pillars banner (1200x320)
    liberture-design-tokens.json         # Design tokens (colors, typography, brand)

app/
  icon.png                               # Next.js auto-favicon (512x512)
  apple-icon.png                         # Next.js auto Apple touch icon (180x180)

public/
  icons/
    icon-192.png                         # PWA icon
    icon-512.png                         # PWA icon
    apple-icon.png                       # PWA Apple icon
    icon.svg                             # SVG version
  favicon.ico                            # Classic favicon (32x32)
  manifest.json                          # PWA manifest referencing all icons
```

---

## 9. Media Kit Page Architecture

**File:** `app/(site)/media-kit/page.tsx` (client component)

### Page Sections (in order)

1. **Header** — Title with gradient text, subtitle, "Download All SVG" + "Download All PNG" bulk buttons
2. **Logo** — Animated preview, static preview, size grid (32-512px), usage DO/DON'T guidelines
3. **Wordmark & Lockups** — White/gradient wordmarks, horizontal/vertical lockups with SVG+PNG downloads
4. **Social Banners** — 8 platform-specific banners with live previews and download buttons
5. **App Icons** — Grid of 8 sizes (16-1024px), click to download PNG
6. **Pillars Overview** — Full-width banner of all 6 pillars
7. **Pillar Icons** — Individual cards for each pillar with icon preview, color code, SVG+PNG downloads
8. **Static Assets & Tokens** — Grid of all downloadable files (SVGs + design tokens JSON)
9. **Pillar Colors** — Color swatches with copy-to-clipboard (hex + rgb)
10. **Brand Colors** — UI color swatches with copy-to-clipboard
11. **Typography** — Font specimen, weight showcase, type scale H1-caption, Google Fonts link
12. **Boilerplate & Taglines** — Tagline, one-liner, press boilerplate with copy-to-clipboard
13. **CTA** — "Need More Assets?" with contact link

### Key Technical Patterns

**SVG Generation (client-side):**
All SVGs are generated via JavaScript functions, not served as static files for the page. This means every preview and download is dynamically created in the browser. Static SVG files in `/public/media-kit/` are pre-built for direct linking.

**Download Helpers:**
- `downloadSVG(svgString, filename)` — Creates a Blob, generates object URL, triggers `<a>` click
- `downloadPNG(svgString, filename, w, h, scale=2)` — Renders SVG to a `<canvas>` at 2x retina, exports as PNG blob
- `downloadStaticSVGAsPNG(svgUrl, filename, w, h)` — Fetches a static SVG file, then uses `downloadPNG`

**Copy-to-Clipboard:**
```tsx
navigator.clipboard.writeText(text)
// Shows a check icon for 2s, then reverts to copy icon
```

**Responsive SVG Previews:**
For banners, the SVG `width/height` attributes are replaced with `width="100%" height="100%" preserveAspectRatio="xMidYMid meet"` and the container uses CSS `aspect-ratio` to maintain proportions.

---

## 10. Usage Guidelines

### DO
- Use the logo on dark backgrounds (`#0a0a0a` or darker)
- Maintain minimum spacing around the logo (equal to one dot's height)
- Use the static version for print materials
- Use the "with background" version for light surfaces

### DON'T
- Change the colors of individual dots
- Distort or skew the logo proportions
- Place on light backgrounds without the dark background version
- Add drop shadows or effects beyond the built-in glow

---

## 11. How to Recreate This for Your Own Site

### Step-by-step

1. **Define your brand** — Name, tagline, one-liner, press boilerplate, color palette, typography
2. **Design your logo** — Create SVG versions (transparent bg, dark bg, app icon without effects)
3. **Create wordmarks** — Logo mark + brand name in your font (white + gradient variants)
4. **Create lockups** — Horizontal (side-by-side) and vertical (stacked) combinations
5. **Define your categories** — If you have categories/pillars, assign colors and icons
6. **Export design tokens** — JSON file with all colors, fonts, and brand metadata
7. **Generate app icons** — Use `rsvg-convert` or similar to create PNG versions at all needed sizes:
   ```bash
   rsvg-convert -w 512 -h 512 logo.svg -o icon-512.png
   rsvg-convert -w 192 -h 192 logo.svg -o icon-192.png
   rsvg-convert -w 180 -h 180 logo.svg -o apple-icon.png
   rsvg-convert -w 32 -h 32 logo.svg -o favicon.png
   ```
8. **Set up PWA manifest** — Reference all icon sizes
9. **Build the media kit page** — Use the section structure above as a template
10. **Wire up downloads** — Client-side SVG→Blob→download for SVG, SVG→Canvas→PNG for raster

### Tools Used
- **SVG creation:** Hand-coded SVG with `<circle>`, `<text>`, `<filter>` elements
- **PNG conversion:** `rsvg-convert` (from librsvg, install via `brew install librsvg`)
- **Client-side PNG export:** HTML Canvas API (`canvas.toBlob('image/png')`)
- **Framework:** Next.js 16 with `app/icon.png` convention for auto-favicon
- **Fonts:** Google Fonts (Inter) loaded via `next/font/google`
- **Icons:** Lucide React icon library for UI icons

---

## 12. Still TODO (Not Yet Created)

These items from the original plan are not yet implemented:

- [ ] Founder headshots (need professional photos)
- [ ] Product screenshots (need to capture at exact dimensions)
- [ ] Social media templates as pre-built images (currently SVG-only)
- [ ] Designer palette files (.ase, .clr, .sketchpalette)
- [ ] ZIP bundle of all assets (`liberture-media-kit.zip`)
- [ ] Animated logo exported as standalone SVG with embedded CSS
- [ ] Co-branding guidelines section
- [ ] PNG versions of logos in `/public/media-kit/` (currently SVG-only, PNGs are generated client-side)
