# Solar Selection and Visual Refresh Design

**Status:** Approved for planning  
**Date:** 2026-07-22

## Objective

Refine the Solar System guide so it feels visually consistent with the Milky Way scene and behaves like the existing galaxy beacons. The Sun should use the same layered-core visual language as the galactic centre, selecting a body should reveal information without moving the camera or stopping the simulation, and every Solar System card should include a locally bundled image.

## Interaction

- Selecting a planet, dwarf planet, moon, or the Sun must not change the Solar camera position, target, zoom, or orientation.
- Selection opens the information panel immediately. It must not create or step a camera flight.
- The simulation continues while a body is selected: orbital motion, axial rotation, the asteroid belt, the Solar backdrop, and animated Solar materials remain active.
- Selection still establishes the existing navigation hierarchy. Selecting a planet exposes its representative moons and local orbit lines; selecting a moon retains its parent context.
- Closing the card only closes the card. The existing Back control continues to restore the parent system or Solar overview.
- Labels, raycasting, keyboard dismissal, Earth-to-sky routing, and five-language content remain supported.

## Sun Visual

The Sun keeps a spherical mesh for depth, occlusion, LOD, and reliable pointer targeting. Its visible treatment changes from a single noise sphere and corona to a compact version of the galactic-core construction:

- a hot white inner glow;
- a pale gold middle glow;
- an amber outer halo;
- a faint orange fringe;
- sparse, low-cost surface or near-corona texture;
- a restrained 18–22 second breathing cycle.

The glow layers use the existing radial glow texture and additive sprite pattern. Their scale follows the Sun's display radius, so they remain correct if scene scale changes. The effect must not add another renderer, animation loop, post-processing chain, or large particle system. Reduced-motion mode freezes the breathing variation while retaining the static layered glow.

## Motion

- Axial rotation runs at 20% of the current visual rate while preserving each body's relative direction and speed.
- Orbital motion runs at 35% of the current visual rate while preserving current relative periods and hierarchy.
- Selection does not change either multiplier.
- Existing reduced-motion behavior remains authoritative when the operating system requests less motion.

These are presentation multipliers, not claims of literal real-time scale.

## Information Panel Images

Solar cards reuse the beacon-card image structure:

1. localized body name;
2. localized type badge;
3. a 150-pixel image area;
4. image credit;
5. facts, description, optional Earth-sky entry, and catalog label.

Each non-Sun card uses the body's bundled local albedo image. The image is static and lazy-loaded, with `object-fit: cover`, a localized alternative description, and a concise source credit derived from the existing Solar asset provenance. The Sun card uses one cached data-URL thumbnail generated once from the same four-layer radial-glow treatment used in the scene. It must not introduce a remote request or a second animation surface.

No live miniature WebGL scene is added to the panel. This keeps selection inexpensive and avoids increasing CPU/GPU work.

## State and Data Changes

- Add card-credit metadata to the existing Solar body records and use `maps.albedo` directly as the card image for every non-Sun body. The Sun's body record selects the cached generated thumbnail explicitly.
- Replace the selection-time flight call with immediate panel rendering and visibility/navigation updates.
- Do not call `setSolarPaused(true)` during selection.
- Retain the flight helpers only where another route still requires them; otherwise remove the dead path and update its self-tests.
- Keep the current LOD2 ownership rule: selected bodies may receive the highest-detail texture while other bodies remain governed by distance and performance stage.

## Accessibility and Responsive Behaviour

- The card image has a localized `alt` value based on the localized body name.
- Image credits remain readable but visually subordinate.
- The existing mobile bottom drawer, safe-area padding, 44-pixel targets, staged Escape behaviour, and localized Back labels remain unchanged.
- Opening the drawer on a compact viewport must not reframe the camera. The selected object may continue moving naturally and can leave the visible region; the UI must not force it back into view.

## Performance

- Reuse the existing glow texture and shared geometry.
- Use four glow sprites and only a small fixed surface/corona detail layer for the Sun.
- Do not add continuous panel rendering or an additional `requestAnimationFrame` loop.
- Card images load only when their card is opened and remain ordinary browser image resources.
- Existing performance stages, texture fallback, mobile ceiling, and selected-body LOD2 preservation remain intact.

## Verification

Automated and browser verification must cover:

- camera position, target, zoom bounds, and orientation remain unchanged after selecting a body;
- selection immediately opens the correct localized card;
- Solar elapsed time, an orbit angle, and an axial rotation value continue advancing while a card is open;
- selecting a planet still exposes its representative moons without moving the camera;
- every Solar body card renders a local image and non-empty credit without remote requests or 404 responses;
- the Sun has the expected layered glow objects and reduced-motion-safe breathing behaviour;
- axial and orbital presentation multipliers are 0.20 and 0.35 respectively;
- Earth card routing, Back/Escape hierarchy, five languages, mobile layout, and LOD safeguards continue to pass.

## Non-goals

- Adding live ephemerides or literal time scale.
- Adding a second renderer for card previews.
- Creating or sourcing a new astronomical photo set.
- Changing the galaxy beacon selection behaviour.
- Redesigning the full information panel beyond adding the established image treatment.
