# Water Ring Toss — Build Plan

A mobile web version of the classic handheld water ring toss toy: rings float in a
water tank, you press buttons to shoot jets of water, and tilt/shake the phone to
guide rings onto pegs.

**Approach:** build one step at a time. Phase 1 is functionality only (plain shapes,
debug drawing). Phase 2 is the look and feel. Each step ends with something we can
open on a phone and test, then a commit.

---

## Tech choices

| Area | Choice | Why |
|---|---|---|
| Language | Plain JavaScript (ES modules) | No compile step to learn; easy to read |
| Dev server / build | [Vite](https://vitejs.dev) | Fast reload; can serve to your phone over Wi‑Fi with HTTPS |
| Physics | [Matter.js](https://brm.io/matter-js/) (2D rigid bodies) + our own water forces | Handles collisions of rings and pegs; we add buoyancy, drag and jets on top |
| Rendering | HTML `<canvas>` | Full control, fast on phones |
| Sensors | `DeviceOrientationEvent` (tilt), `DeviceMotionEvent` (shake) | Built into mobile browsers |
| Hosting | GitHub Pages (from the repo) | Free HTTPS, which phones require before they share motion sensors |

### How the "water" works
We won't simulate real fluid (too slow for a phone). We fake it with forces applied
to each ring every physics step:

- **Buoyancy** — pushes up against gravity so rings sink slowly.
- **Drag** — slows rings down in proportion to their speed (makes motion feel "thick").
- **Jets** — when a button is held, an upward cone of force from that nozzle; strongest
  near the nozzle, fading with distance. Holding longer builds pressure.
- **Currents** — a simple velocity field that jets and shakes stir up and that slowly
  calms down, so rings keep drifting after you let go.
- **Tilt** — rotates the gravity/buoyancy direction, so rings slide toward the low side.
- **Shake** — a sharp acceleration adds a burst to the current field.

### Rings and pegs
The game is a 2D side view (like the real toy, which is a thin tank). A ring is
drawn as a flattened oval, and physically is two small "rim" circles joined together.
The peg only collides with the rims, so a ring centred over a peg can slide down onto
it. A ring counts as **scored** when its centre is below the peg tip and within the
peg's width.

### Phone gotchas we must handle
- iPhone asks for motion permission, and only after a tap → "Tap to start" screen.
- Sensors need HTTPS → test via GitHub Pages or Vite's HTTPS dev server.
- Stop page scrolling/zoom while playing; lock to portrait.
- Desktop fallback for development: arrow keys = tilt, space = shake, A/L keys = buttons.

---

## Phase 1 — Functionality

### Step 0: Project setup
- `git init`, connect to `github.com/naomishah99/waterful_Ring_Toss`.
- Create a Vite project, add Matter.js.
- Set up GitHub Pages deploy so every push is playable on a phone.
- **Done when:** a blank page loads on your phone from the GitHub Pages URL.

### Step 1: Tank and game loop
- Full-screen canvas in portrait, tank walls as static bodies.
- Fixed-timestep physics loop, debug drawing of all bodies, FPS counter.
- **Done when:** the empty tank fits any phone screen without scrolling.

### Step 2: Rings in water
- Add ~8 rings; apply buoyancy + drag so they sink slowly and settle at the bottom.
- Tune constants with an on-screen debug slider panel.
- **Done when:** rings drift down and feel like they're underwater, not falling in air.

### Step 3: Pegs and scoring
- Add 2 pegs; rim-only collision so rings can land on them.
- Detect and count rings on pegs (and rings that fall back off).
- **Done when:** dragging a ring with your finger (debug mode) onto a peg scores it.

### Step 4: Buttons and water jets
- Left and right on-screen buttons (multi-touch, both at once).
- Each press is one pump stroke (a burst that fades even if held); letting go
  refills the pump, so rhythmic pressing works best. Jet cone + current field.
- **Done when:** you can push rings up and over to pegs with button presses alone.

### Step 5: Tilt
- Ask permission on "Tap to start"; read tilt, smooth it, rotate gravity direction.
- Calibrate "level" to however the player is holding the phone at start.
- **Done when:** tilting the phone makes rings drift sideways naturally.

### Step 6: Shake
- Detect acceleration spikes; add a burst to the current field.
- Avoid false triggers from normal tilting.
- **Done when:** a quick shake stirs the rings; normal play doesn't trigger it.

### Step 7: Game rules
- Win when all rings are on pegs; timer and move counter; reset button.
- **Done when:** a full game can be played start to finish and restarted.

### Step 8: Tuning and device testing
- Test on iPhone Safari and Android Chrome; check performance (steady 60 fps).
- Tune physics until it's challenging but fair.
- Revisit speed and physics feel (requested after the Step 6 phone test).
- **Done when:** it feels good on at least one iPhone and one Android phone.

---

## Phase 2 — UI and polish

### Step 9: Visual design
- Original toy-style casing, translucent water, coloured rings, bubbles from jets.

### Step 10: Sound and haptics
- Button press, jet whoosh, ring "clink" on a peg; vibration where supported (Android).

### Step 11: App feel
- Add to Home Screen (PWA), full-screen, start/win screens, high score saved on device.

---

## Open questions
- How many pegs and rings? (Default: 2 pegs, 8 rings.)
- Levels/difficulty, or one classic mode? (Default: one mode first.)
