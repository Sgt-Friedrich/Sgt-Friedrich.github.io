# Sgt-Friedrich.github.io

Bilingual constructivist engineering portfolio for Yifan Zeng.

## Information architecture

- Home
- Education
- Internship
- Projects
- Awards

Internship and project entries use local numbered rails and panel transitions. In the project chapter, one vertical mouse-wheel gesture advances one project; the final gesture advances to Awards.

## Page-derived chapter transitions

Chapter transitions originate from visible objects already present in the current page:

- Home: the `O` in `TO` expands as a circular aperture.
- Education: the active academic card expands into the next chapter surface.
- Internship: the first or final pipeline cell expands from the workflow rail.
- Projects: the currently selected project tab expands into the next chapter.
- Awards: the central podium expands into the destination surface.

The implementation clones the visible source element, preserves its viewport geometry, and animates a matching surface from that origin. If the preferred source object has scrolled out of view, the current chapter arrow or title is used as a fallback. Reduced-motion users receive an immediate chapter change.

## Visual system

- The circular structure references RFIC wafers and frequency-domain work.
- The directional block links device, circuit, model, and agent work.
- The grid references layout coordinates and experiment spaces.
- Muted terracotta orange replaces high-saturation red for large surfaces.

These semantics are intentionally kept out of the page content to preserve a minimal portfolio surface.

## Responsive behavior

The layout adapts across large desktop, short laptop, tablet, and mobile viewports. Desktop chapters that only slightly exceed the viewport enter a compact-height mode so key information remains visible without careful internal scrolling.
