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

- Home: the `O` in `TO` becomes a solid circular wipe.
- Education: the current academic card expands into a full-screen surface.
- Internship: the first or final workflow cell grows from the process rail.
- Projects: the selected project tab expands from the local project rail.
- Awards: the central podium grows into the destination surface.

Each transition uses three fixed phases: source expansion, page swap only after complete coverage, and geometric retraction to reveal the destination. No opacity cross-fade or gradient surface is used. If the preferred source object is outside the viewport, the chapter arrow or title is used as a fallback. Reduced-motion users receive an immediate chapter change.

Project submodules use a single incoming solid mask over the current panel. The previous panel remains stable until the incoming panel has fully covered it, preventing blank frames and double-image flicker.

## Visual system

- The circular structure references RFIC wafers and frequency-domain work.
- The directional block links device, circuit, model, and agent work.
- The grid references layout coordinates and experiment spaces.
- Muted terracotta orange replaces high-saturation red for large surfaces.

These semantics are intentionally kept out of the page content to preserve a minimal portfolio surface.

## Responsive behavior

The layout adapts across large desktop, short laptop, tablet, and mobile viewports. Desktop chapters that only slightly exceed the viewport enter a compact-height mode so key information remains visible without careful internal scrolling.