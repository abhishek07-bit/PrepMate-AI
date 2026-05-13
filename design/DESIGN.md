---
name: The Pebble System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e3e2e2'
  on-secondary-container: '#646464'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-bold:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-padding: 32px
  max-width: 1200px
---

## Brand & Style

This design system is defined by a rigorous adherence to **Japanese minimalism** and **Swiss typographic precision**. It eschews the chaotic visual tropes of contemporary AI—glassmorphism, neon glows, and animated particles—in favor of a calm, editorial atmosphere. 

The aesthetic is "human-centered tech": it feels like high-quality stationery or a premium architectural monograph. The "Pebble" geometry introduces a soft, organic touch to an otherwise disciplined, mathematical layout. The goal is to evoke a sense of quiet intelligence and effortless organization, where the interface recedes to let the user's content and the AI's logic provide the value.

## Colors

The palette is strictly monochromatic, relying on value and contrast rather than hue to establish meaning. 

- **Pure Black (#000000):** Used for primary text, high-emphasis headings, and solid-action buttons.
- **Pure White (#FFFFFF):** The primary background color, providing an expansive, "infinite" canvas.
- **Surface Grey (#F5F5F5):** Used for large container backgrounds and "Pebble" cards to subtly distinguish them from the base canvas.
- **Border Grey (#E5E5E5):** The standard for all 1px outlines.
- **Muted Grey (#737373):** Used for secondary information, meta-data, and disabled states.

Zero accent colors are permitted. Success, error, or warning states must be communicated through iconography, weight, or clear instructional text rather than red or green.

## Typography

The design system utilizes **Geist** for its technical precision and neutral, Swiss-inspired character. Hierarchy is the primary tool for navigation. 

**Headlines** must feature tight tracking (letter-spacing) to create a dense, "blocky" visual impact similar to modern editorial layouts. **Body text** requires generous line height (1.6) to ensure maximum readability against the high-contrast background. 

For mobile, `display` sizes should scale down to `headline-lg` values to maintain comfortable reading widths, while maintaining the heavy font weights that signal importance.

## Layout & Spacing

This design system uses a strict **8px grid** but applies it with a "breathable" philosophy. Whitespace is not empty; it is a functional element used to group related concepts without the need for heavy dividers.

The layout follows a **Fixed-Fluid Hybrid**:
- **Desktop:** A centered 12-column grid with a maximum width of 1200px. Gutters are fixed at 24px.
- **Mobile:** A single-column fluid layout with generous 24px side margins.
- **Sectioning:** Vertical spacing between major sections should be aggressive (e.g., 80px to 120px) to maintain the premium, minimalist feel.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Borders**, never shadows. 

1.  **Level 0 (Base):** Pure White (#FFFFFF) background.
2.  **Level 1 (Pebble Containers):** Light Grey (#F5F5F5) surfaces with a 1px Border (#E5E5E5).
3.  **Level 2 (Interactive):** Pure Black (#000000) for active elements or high-contrast callouts.

The absence of shadows creates a "flat-stack" aesthetic that feels modern and architectural. All interactive surfaces remain on the same perceived Z-plane, separated only by their outlines and background fills.

## Shapes

The "Pebble" geometry is the defining visual characteristic. 

- **Primary Cards:** Use a generous 32px radius to create a soft, organic feel.
- **Secondary Elements:** Buttons and input fields use a 12px to 16px radius.
- **Checkboxes/Small Tags:** Use a 4px radius or full pills.

The juxtaposition of these extremely soft, rounded shapes against the rigid, sharp-edged Swiss typography creates the "sophisticated tech" tension central to the design system's identity.

## Components

### Buttons
- **Primary:** Solid #000000 background with #FFFFFF text. No border. 16px corner radius.
- **Secondary:** #FFFFFF background with #000000 text and a 1px #E5E5E5 border.
- **Tertiary/Ghost:** No background or border. #000000 text with bold weight.

### Cards (The "Pebble")
- Background: #F5F5F5.
- Border: 1px #E5E5E5.
- Radius: 32px.
- Padding: 32px or 40px for a "roomy" feel.

### Input Fields
- Background: #FFFFFF.
- Border: 1px #E5E5E5. 
- Radius: 12px.
- Focus State: Border color changes to #000000. No glow.

### Chips & Lists
- Chips should be fully rounded (pill-shaped) with #F5F5F5 backgrounds and #000000 labels.
- Lists should utilize 1px #E5E5E5 horizontal dividers with generous padding (16px - 24px) between items.

### Icons
- Use 24px grid icons.
- Stroke weight: 1.5px or 2px.
- Cap/Join: Round (to match the pebble geometry).
- Color: Always #000000 (Primary) or #737373 (Secondary).