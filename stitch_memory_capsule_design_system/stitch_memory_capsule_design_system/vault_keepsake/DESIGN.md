---
name: Vault & Keepsake
colors:
  surface: '#f5faff'
  surface-dim: '#bedff5'
  surface-bright: '#f5faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e9f5ff'
  surface-container: '#ddf1ff'
  surface-container-high: '#d1ecff'
  surface-container-highest: '#c6e7fd'
  on-surface: '#001e2c'
  on-surface-variant: '#44474d'
  inverse-surface: '#123445'
  inverse-on-surface: '#e3f3ff'
  outline: '#75777e'
  outline-variant: '#c5c6cd'
  surface-tint: '#525f77'
  primary: '#020e24'
  on-primary: '#ffffff'
  primary-container: '#17243a'
  on-primary-container: '#7e8ba6'
  inverse-primary: '#bac7e4'
  secondary: '#5f5e5a'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2dc'
  on-secondary-container: '#656460'
  tertiary: '#180c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#351f00'
  on-tertiary-container: '#b28240'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#bac7e4'
  on-primary-fixed: '#0e1c31'
  on-primary-fixed-variant: '#3a475f'
  secondary-fixed: '#e5e2dc'
  secondary-fixed-dim: '#c9c6c1'
  on-secondary-fixed: '#1c1c18'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#f4bd74'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#f5faff'
  on-background: '#001e2c'
  surface-variant: '#c6e7fd'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  title-md:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system establishes an intimate, archival atmosphere where institutional cryptography meets heirloom sentimentality. Built for individuals and families preserving personal legacies, posthumous letters, and future milestone deliveries, the interface balances ironclad trust with warm human nostalgia. 

The aesthetic is Tactile Editorial Antiquarian: high-grade archival paper textures, refined ruled lines, deckled-edge framing references, and wax/amber seal metaphors translated into crisp digital vectors. Interactions feel deliberate, quiet, and weighted—counteracting the ephemeral, disposable cadence of modern social feeds to invoke permanence, reverence, and unconditional privacy.

## Colors
The palette evokes aged stationery preserved inside a midnight-iron vault:

- **Midnight Navy (`#17243A`)**: Primary deep tone used for high-contrast typographic hierarchy, impenetrable surfaces, and primary actions. Conveys absolute cryptographic authority.
- **Warm Ivory (`#F7F4EE`)**: The ambient background canvas. Replaces sterile digital white with the organic warmth of heavy cotton archival vellum.
- **Warm Amber (`#D8A45E`)**: Tertiary accent representing chronological unlocks, wax stamp seals, active time markers, and privileged metadata.
- **Dusty Blue (`#8FAFC4`)**: Atmospheric neutral supporting navigational anchors, secondary rules, and serene balance.
- **Muted Lavender (`#B9A8D5`)**: Evocative supporting tint reserved for memory categories, poetic interludes, and dream-state/future tags.
- **Soft Sage (`#A6B8A2`)**: Verification and security status indicator, signaling active encryption locks, confirmed recipients, and resolved timelines.

Use high-contrast text ratios: Midnight Navy against Warm Ivory surfaces guarantees AAA clarity while retaining an ink-on-parchment feel.

## Typography
Typographic expression bridges literary permanence with crisp digital legibility:

- **Headings (Playfair Display)**: Classic transitional serifs provide an editorial, historical, and deeply human voice. Use italic variations sparingly for dates, introspective quotes, and capsule titles.
- **Body & Metadata (Manrope)**: A clean, geometric Grotesque with open apertures that preserves legibility under encryption keys, technical timestamps, countdown schedules, and prolonged reading of deeply personal correspondence.
- **Uppercase Labels**: Set `label-sm` and `label-md` in uppercase with expanded letter-spacing to emulate typed ledger headers and official archival stamps.

## Layout & Spacing
The layout adheres to a 12-column responsive fluid grid anchored by ample, calm negative space to mirror physical manuscript margins:

- **Desktop (1024px+)**: 12 columns, 48px canvas margin, 24px gutters. Main reading corridors remain constrained to a max-width of 720px to prevent visual fatigue and create an intimate reading pane.
- **Tablet (768px - 1023px)**: 8 columns, 32px canvas margin, 16px gutters.
- **Mobile (320px - 767px)**: 4 columns, 20px canvas margin, 16px gutters. Vertical card decks replace multi-column chronologies.

Use `space-xl` between modular sections to slow user pace deliberately. Group cryptographic timestamps, locks, and author credentials closely with `space-xs` and `space-sm` for dense contextual pairing.

## Elevation & Depth
Depth is created through physical stationery layering rather than high-tech blurs or aggressive drop shadows:

- **Surface Tiers**: Base canvas sits on `#F7F4EE`. Primary content containers, envelopes, and editor modules rest on clean `#FFFFFF` cards, framed by low-contrast 1px rules in `#8FAFC4` at 30% opacity.
- **Physical Shadows**: Shadows emulate stationery sitting on wood or felt desks: dual-light ambient diffusion with low opacity and a gentle warm tint (`rgba(23, 36, 58, 0.04)` offset 0px 4px with 20px blur, paired with `rgba(216, 164, 94, 0.03)` offset 0px 1px with 2px blur).
- **Capsule Layers**: Modals and locked viewports feature an overlaid structural backdrop blur (12px blur over `#17243A` at 65% opacity), highlighting the encrypted separation between current viewing and future reveal.

## Shapes
Geometry is disciplined and architectural, referencing traditional envelopes, paper stock, and safe deposit boxes:

- **Core Geometry**: Standard containers, cards, and input modules use `0.25rem` (Soft) radiuses to maintain clean, razor-cut paper edges.
- **Envelopes & Seals**: Interactive time-stamps, status chips, and seal tokens utilize full circle borders (`50%` or pill-shaped) to reference wax insignias and classic circular postal cancellations.
- **Borders**: Favor fine, hairline strokes (`1px`) over heavy divisions. Cards employ a double-ruled subtle stroke motif on top borders to emulate classic bond certificates.

## Components

- **Buttons**:
  - *Primary*: Midnight Navy fill, Warm Ivory typography, `0.25rem` corner radius, subtle hover shift with an internal 1px golden border (`#D8A45E` at 30%).
  - *Secondary / Seal*: Warm Ivory fill, 1px Midnight Navy stroke, Midnight Navy typography. 
  - *Vault Trigger (Seal Action)*: Circular or soft-corner button with Warm Amber background, debossed icon, and subtle outer ring simulating an authentic wax seal.

- **Cards & Envelope Containers**:
  - Bound by crisp 1px borders in Dusty Blue tint. Headers feature subtle serif dates separated by an organic hairline rule.
  - Locked state displays a textured Midnight Navy backdrop with a centered Soft Sage or Warm Amber cipher indicator and a countdown timer.

- **Chips & Time Markers**:
  - Archival labels with `label-sm` typography, pill-shaped contour, 1px border.
  - Time Markers: Connected with a delicate 1px dotted vertical timeline rule in Dusty Blue, highlighted by Warm Amber node pips representing scheduled future release dates.

- **Input Fields**:
  - Crisp Warm Ivory surfaces shifting to pure white on focus. Bottom-heavy border emphasis (underlined ledger style) or subtle 1px frame. Active state triggers a Warm Amber border glow with zero harsh shadows.

- **Checkboxes & Radio Buttons**:
  - Checkboxes use square, sharp-cornered forms with a delicate Warm Amber checkmark. Radio buttons utilize concentric ring targets referencing astronomical or mechanical dial markings.

- **Encryption & Delivery Indicators**:
  - Specialized component featuring cryptographic fingerprint string in monospaced/micro Manrope, paired with an animated SVG padlock seal that transitions from Soft Sage (armed & secured) to Warm Amber (unlocked at target date).