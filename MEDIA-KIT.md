# Liberture Media Kit — Improvements & Asset Checklist

Current media kit page: `/app/(site)/media-kit/page.tsx` → [liberture.com/media-kit](https://liberture.com/media-kit)

---

## Current State

The existing page displays:
- Animated + static logo (SVG component rendered in-browser, no real download)
- Logo size variations (32–80px previews)
- Usage guidelines (basic DO/DON'T list)
- 6 pillar colors with copy-to-clipboard
- 5 brand colors with copy-to-clipboard
- Typography section (Inter font, weights)
- CTA to contact page

**Main problem:** The download buttons don't actually download anything. There are no real downloadable asset files behind them.

---

## Assets to Create

### 1. Logo Files (Priority: HIGH)

Create a `/public/media-kit/` directory with the following:

| File | Format | Details |
|------|--------|---------|
| `liberture-logo-animated.svg` | SVG | Animated version (CSS animation embedded) |
| `liberture-logo-static.svg` | SVG | Static 6-dot orbit mark |
| `liberture-logo-static.png` | PNG | 1024x1024, transparent background |
| `liberture-logo-static@2x.png` | PNG | 2048x2048, transparent background |
| `liberture-logo-dark-bg.png` | PNG | Logo on #0a0a0a background, 1200x1200 |
| `liberture-logo-light-bg.png` | PNG | Logo adapted for white/light backgrounds, 1200x1200 |
| `liberture-logo-favicon.ico` | ICO | Multi-size favicon (16, 32, 48) |

### 2. Wordmark / Logotype (Priority: HIGH)

Currently missing entirely — the media kit has no wordmark.

| File | Format | Details |
|------|--------|---------|
| `liberture-wordmark-white.svg` | SVG | "Liberture" text in Inter Bold, white |
| `liberture-wordmark-white.png` | PNG | Same, transparent background |
| `liberture-wordmark-gradient.svg` | SVG | With the brand gradient (primary → cyan → green) |
| `liberture-wordmark-gradient.png` | PNG | Same, transparent background |
| `liberture-lockup-horizontal.svg` | SVG | Logo mark + wordmark side by side |
| `liberture-lockup-horizontal.png` | PNG | Same, transparent background |
| `liberture-lockup-vertical.svg` | SVG | Logo mark above wordmark (stacked) |
| `liberture-lockup-vertical.png` | PNG | Same, transparent background |

### 3. Pillar Icons (Priority: MEDIUM)

Individual icons for each of the 6 pillars:

| Pillar | Color | Files Needed |
|--------|-------|-------------|
| Cognition | #8B5CF6 (Purple) | `.svg`, `.png` (256x256) |
| Recovery | #06B6D4 (Cyan) | `.svg`, `.png` (256x256) |
| Fueling | #10B981 (Green) | `.svg`, `.png` (256x256) |
| Mental | #EC4899 (Pink) | `.svg`, `.png` (256x256) |
| Physicality | #F59E0B (Orange) | `.svg`, `.png` (256x256) |
| Finance | #EAB308 (Yellow) | `.svg`, `.png` (256x256) |

Each icon should be a simple symbol representing the pillar (brain, moon/bed, leaf/fork, heart/mind, dumbbell, chart), rendered in the pillar color on transparent background.

### 4. Social Media Templates (Priority: MEDIUM)

| File | Dimensions | Use |
|------|-----------|-----|
| `og-image-default.png` | 1200x630 | Default Open Graph / link preview |
| `og-image-pillars.png` | 1200x630 | Variant showing all 6 pillars |
| `twitter-banner.png` | 1500x500 | X/Twitter profile banner |
| `linkedin-banner.png` | 1584x396 | LinkedIn cover |
| `instagram-profile.png` | 320x320 | Instagram profile picture |
| `social-avatar-circle.png` | 500x500 | Circular crop-safe avatar for all platforms |

### 5. Brand Pattern / Background Assets (Priority: LOW)

The site uses custom SVG pattern components. Export some as standalone files:

| File | Format | Details |
|------|--------|---------|
| `brand-pattern-topographic.svg` | SVG | From `TopographicBackground` component |
| `brand-pattern-ripple.svg` | SVG | From `RippleBloom` component |
| `brand-pattern-terrain.svg` | SVG | From `MicroterrainRidge` component |

### 6. Downloadable Bundle (Priority: HIGH)

| File | Contents |
|------|---------|
| `liberture-media-kit.zip` | All logos, wordmarks, lockups, color palette file, and brand guidelines PDF |

---

## Page Improvements

### Section: Downloads Must Actually Work

The current "Download SVG Component" and "Download PNG" buttons are non-functional. Wire them up to serve real files from `/public/media-kit/`.

### Section: Add a "Wordmark & Lockups" Section

Add between the Logo and Colors sections:
- Show horizontal lockup (mark + text)
- Show vertical lockup (mark over text)
- Show wordmark alone
- White and gradient variants
- Download buttons for each

### Section: Add "One-Click Download All" Button

At the top of the page, add a prominent button to download `liberture-media-kit.zip` with everything bundled.

### Section: Add "Tagline & Boilerplate" Copy

Add a section with ready-to-copy text blocks:

- **Short tagline:** "Master your biology. Unlock your potential."
- **One-liner:** "Liberture is the Biological Operating System — a unified platform for evidence-based human optimization."
- **Boilerplate (press):**
  > Liberture is a free, open-access platform for human optimization. Built around six core pillars — Cognition, Recovery, Fueling, Mental, Physicality, and Finance — Liberture provides science-backed protocols, a curated directory of experts and organizations, and a growing knowledge base. Founded by Leon Acosta (CEO), Fabricio Acosta (CTO), and Robert Claw (AI Architect), Liberture is committed to radical self-ownership and evidence-first health optimization.

- **Founder bios** (short, 1-2 sentences each)

Each block should have a copy-to-clipboard button, same pattern as the color swatches.

### Section: Add "Founder Photos"

Press outlets will need headshots. Prepare:

| File | Person | Specs |
|------|--------|-------|
| `leon-acosta-headshot.jpg` | Leon Acosta | 800x800, neutral background |
| `leon-acosta-headshot-wide.jpg` | Leon Acosta | 1200x800, for article headers |
| `fabricio-acosta-headshot.jpg` | Fabricio Acosta | 800x800, neutral background |
| `fabricio-acosta-headshot-wide.jpg` | Fabricio Acosta | 1200x800, for article headers |
| `robert-claw-headshot.jpg` | Robert Claw | 800x800, neutral background |
| `robert-claw-headshot-wide.jpg` | Robert Claw | 1200x800, for article headers |
| `founders-group.jpg` | All three | 1600x900, team shot |

### Section: Add "Product Screenshots"

Press and partners need to see the product. Prepare:

| File | Description |
|------|------------|
| `screenshot-homepage.png` | Full landing page hero (1440x900) |
| `screenshot-pillars.png` | The 6 pillars overview (1440x900) |
| `screenshot-knowledge.png` | Knowledge base article view (1440x900) |
| `screenshot-directory.png` | People/Organizations directory (1440x900) |
| `screenshot-marketplace.png` | Marketplace protocols (1440x900) |
| `screenshot-mobile-home.png` | Mobile view of homepage (390x844) |
| `screenshot-mobile-pillar.png` | Mobile view of a pillar page (390x844) |

Display these in a gallery grid on the media kit page with individual download buttons.

### Section: Add "Color Palette File"

Provide downloadable palette files for designers:

| File | Format | Use |
|------|--------|-----|
| `liberture-colors.ase` | Adobe Swatch Exchange | Photoshop, Illustrator |
| `liberture-colors.clr` | macOS Color Palette | macOS apps |
| `liberture-colors.sketchpalette` | Sketch Palette | Sketch |
| `liberture.tokens.json` | Design Tokens | Figma, Style Dictionary |

### Section: Improve "Typography" Section

- Add a type specimen showing heading hierarchy (H1–H6 at actual sizes)
- Link to [Google Fonts — Inter](https://fonts.google.com/specimen/Inter) for download
- Show example body text paragraph at actual size/weight
- Note the monospace font used for code/data (if any)

### Section: Add "Icon Library" Preview

Show the Lucide icons commonly used across the platform, with their names, for visual consistency in partner materials.

### Section: Add "Co-Branding Guidelines"

- How partners should combine their logo with Liberture's
- Minimum clearance/spacing rules
- Acceptable and unacceptable combinations
- Light/dark background requirements
- Size relationship rules

---

## Suggested File Structure

```
public/
  media-kit/
    logos/
      liberture-logo-animated.svg
      liberture-logo-static.svg
      liberture-logo-static.png
      liberture-logo-static@2x.png
      liberture-logo-dark-bg.png
      liberture-logo-light-bg.png
    wordmarks/
      liberture-wordmark-white.svg
      liberture-wordmark-white.png
      liberture-wordmark-gradient.svg
      liberture-wordmark-gradient.png
    lockups/
      liberture-lockup-horizontal.svg
      liberture-lockup-horizontal.png
      liberture-lockup-vertical.svg
      liberture-lockup-vertical.png
    pillars/
      cognition.svg
      cognition.png
      recovery.svg
      recovery.png
      fueling.svg
      fueling.png
      mental.svg
      mental.png
      physicality.svg
      physicality.png
      finance.svg
      finance.png
    social/
      og-image-default.png
      og-image-pillars.png
      twitter-banner.png
      linkedin-banner.png
      instagram-profile.png
      social-avatar-circle.png
    founders/
      leon-acosta-headshot.jpg
      leon-acosta-headshot-wide.jpg
      fabricio-acosta-headshot.jpg
      fabricio-acosta-headshot-wide.jpg
      robert-claw-headshot.jpg
      robert-claw-headshot-wide.jpg
      founders-group.jpg
    screenshots/
      screenshot-homepage.png
      screenshot-pillars.png
      screenshot-knowledge.png
      screenshot-directory.png
      screenshot-marketplace.png
      screenshot-mobile-home.png
      screenshot-mobile-pillar.png
    palettes/
      liberture-colors.ase
      liberture-colors.clr
      liberture.tokens.json
    patterns/
      brand-pattern-topographic.svg
      brand-pattern-ripple.svg
      brand-pattern-terrain.svg
    liberture-media-kit.zip
```

---

## Implementation Order

1. **Create `/public/media-kit/` directory structure** — organize folders
2. **Export logos as real files** — convert the SVG component to standalone SVG/PNG exports
3. **Design wordmarks and lockups** — these don't exist yet, design them in Figma/Illustrator
4. **Take founder headshots** — professional photos, consistent style
5. **Capture product screenshots** — at exact dimensions listed above
6. **Wire download buttons** — make every button on the page serve a real file
7. **Add missing page sections** — boilerplate copy, wordmarks, screenshots, founders
8. **Create the ZIP bundle** — script to auto-generate `liberture-media-kit.zip` from the folder
9. **Add social templates** — design OG images and platform banners
10. **Create palette files** — export color values in designer-friendly formats
11. **Add pillar icons** — design a simple icon set for the 6 pillars
12. **Polish** — co-branding guidelines, type specimens, pattern exports

---

## Notes

- All PNGs should be exported at 2x resolution minimum for Retina displays
- Include both dark-background and light-background variants for logos/lockups
- The ZIP bundle should be regenerated with a build script whenever assets change
- Consider adding a Figma community file link with all assets as an alternative to downloads
- The current OG image (`/public/og-image.png` at 47KB) is very small — replace with a higher quality version
