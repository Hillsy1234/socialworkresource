# The Quiet Garden

An optional browser-rendered 3D break at `/garden/`, linked from the shared learning workspace for every practice location. It is recreational, with no claim to treat stress or automatically count as CPD.

## First-person garden walk

A roughly 281-metre looping path passes nine places: the garden gate, wildflower border, water garden, silver birches, woodland bench, evening border, woodland trail, wildflower meadow and reading nook. The larger landscape uses textured ground, individual grass blades, leafy tree crowns, shrubs, flowers, a gently arched timber bridge and a reflecting pond. Geometry and textures are generated locally. Optional sound effects are served as small local audio files; no external models, image services or accounts are required.

- W A S D / arrow keys move at eye level. Drag to look; Q / E turn using a keyboard. Touch devices show hold-to-walk directional buttons. The camera has no artificial head bob.
- Follow the path guides the camera at the selected pace (0.8, 1.3 or 1.8 metres per second). It stops after one loop. Pause, Escape, manual movement, instructions, the map, tab hiding and window blur stop guided movement. A paused walk does not resume by itself.
- The map and Next quiet spot move instantly to one of nine locations. Sit a while uses a nearby bench when available, otherwise a lower seated viewpoint; standing restores the previous safe position.
- Free movement respects the pond, bridge width, trunks, boulders, benches and garden perimeter. The bridge has smooth approaches along the guided route.
- Flower and pond interactions support direct canvas touches and a labelled button. Lanterns can be illuminated at the evening border. No points, countdowns or leaderboards.
- Morning, golden hour and evening settings. Recorded gravel, grass and timber footsteps follow actual distance travelled, with subtle variations and alternating stereo position. Grass recordings also provide filtered foliage rustles. Recorded water laps fade with pond proximity; a splash accompanies the ripple interaction. They sit beneath the synthesised wind and occasional birdsong. All sound starts only after pressing Sound, pauses in the background and never autoplays after reload. Stopping or hitting an obstacle does not produce new footsteps.
- Still mode freezes ambient animation and disables continuous camera movement. Instant map navigation and seated views remain available. A system reduced-motion preference enables it automatically. WebGL unavailability or context loss provides a quiet fallback and a return link.
- Walking preferences use `quietGarden.walk.v1` in localStorage. Theme, pace, Still mode and flower interactions are validated. Saved preferences do not contain personal data. A blocked storage API leaves the current visit playable.

## Original miniature

`/garden/miniature.html` retains the floating island, six-flower journey and arrangement controls. Users can add twelve flower clusters, stone stacks or lanterns, with Place for me and Undo alternatives. Its existing `quietGarden.v1` save remains separate and is not migrated, reset or overwritten by the walk.

## Returning to learning

`garden-link.js` saves the exact learning URL and scroll position in sessionStorage after saving any CPD draft. Both garden views return to that page. The return link accepts only the same-origin root learning page. After the learning pack has loaded, a one-use marker restores the scroll position. Return information expires after one day. A directly opened garden has a normal home link.

## Build and verification

The public build bundles Three.js and the walk into `dist/garden/app.js`; the miniature uses a separate `miniature-app.js`. The library's MIT licence is copied alongside. Source modules, tests and documentation remain outside the garden's public directory. The learning homepage loads neither 3D bundle.

Run `npm run build` and `npm run typecheck`. Start `npm run community:dev` for the local preview at http://127.0.0.1:8766/garden/.

`garden/tests/` checks save validation, safe return URLs, the complete path, smooth bridge approaches and movement boundaries. `tools/browser-checks/garden-walk.js` checks desktop/mobile controls, pause behaviour, six destinations, preferences, the miniature, CPD return, blocked storage and unavailable WebGL. `tools/browser-checks/garden.js` retains the miniature regression checks. These browser scripts use isolated contexts, keeping existing user records separate.

The scene defaults to 30 fps, with an optional 60 fps target and adaptive rendering detail, uses instancing for foliage/grass/flowers, reduces phone geometry and pixel ratio, and avoids continuous redraws in Still mode. Testing uses desktop Chromium and phone viewport/touch emulation; physical phones may vary in performance. There are no additional search or AI API charges for using the garden.

## Audio assets

The 19 local CC0 recordings load only after Sound is enabled. Credits, source filenames, modifications and hashes are in `assets/garden-audio/`. Recorded footsteps and splashes vary without immediately repeating a sample. Quiet water uses proximity-based volume and stereo placement relative to the viewing direction. Switching Sound off clears active effects so they do not resume midway later. Individual download failures leave available effects usable and offer a retry by toggling Sound. The miniature retains its original audio.

## Garden weather

The Weather button in the top-right header opens four choices independent of the time of day: Clear skies, Cloudy, Light rain and Mist. Cloud cover softens sunlight; rain darkens surfaces, adds falling drops and small pond ripples; mist increases atmospheric haze and adds low translucent wisps among the trees. The rain sound is generated locally as a quiet stereo bed and fades with rainfall intensity. It uses the existing Sound opt-in and mute controls; no new audio downloads are needed.

Manual weather changes blend over eight seconds. Optional automatic weather follows clear → cloud → rain → cloud → mist → clear, changing about every two minutes of active garden time. It starts off. Both the selected weather and automatic preference save alongside the existing walk preferences. Old saves default to clear skies without changing their lighting selection.

Still mode freezes the rendered rain, ripples, mist and ongoing transitions, and pauses the automatic clock. An explicit weather selection in Still mode switches instantly to its static view. Sound remains independently optional. Background tabs and the welcome view do not advance the automatic clock. There is no thunder, lightning, weather API or location lookup.

`garden/tests/weather.test.mjs` checks save compatibility, interrupted transitions and the paused automatic clock. `tools/browser-checks/garden-weather.js` checks the controls, persistence, lighting independence, pixel-identical still frames, silent opt-in behaviour and small-screen layouts.


## Immersive visits

The garden now builds on the existing walk, weather and seasonal systems:

- **Just enjoy the garden** hides the HUD, toolbar and header while guided walks continue. A small Show controls button remains. A tap restores the interface; Escape also pauses walking. Mouse movement leaves it hidden. Hidden controls are inert and cannot receive focus. Seated and Still visits remain stationary, and sound stays opt-in.
- **Your visit** saves one favourite location, whether seated, its season, weather, exact daylight level and all sound levels. The welcome screen offers a direct return. Restoring a favourite disables automatic weather/daylight so the saved atmosphere stays in place. Sound still requires opt-in. Clearing the favourite is available in the same dialog; failed writes are reported without falsely confirming a save.
- **Sound balance** retains the nature and footsteps master levels and adds independent birdsong, wind, rain and water controls. Visible resting birds emit short HRTF-positioned calls. A spatial stream layer and roof patter use the same listener position and orientation. The original recorded woodland ambience remains quiet underneath. All layers respect mute, background pause and zero-volume preferences.
- **The reading shelter** excludes falling rain beneath its actual roof footprint. Roof patter rises and wind softens as the visitor moves under cover; ambient rain stays audible outside. A small clearing makes the seated view readable. The reading nook has four optional original poems/observations, with no external content or personal notes.
- **Wildlife** alternates between resting, foraging, hopping and flying to another destination with varied timing. Nearby birds can move away gently; butterflies settle near actual flower heads and dragonflies pause close to the water. Seasonal/rain restrictions remain, and Still mode freezes movement.
- **The pond and stream** include fish beneath the partially transparent reflection, floating leaves and moving reeds. Canvas touches produce ripples at the actual hit point; the labelled water button remains an alternative. A short stream feeds the pond from the east, with rocks and collision boundaries. Reeds and stream rocks use instancing to reduce draw calls.
- **Daylight** can progress from the chosen lighting toward evening, taking six active minutes per lighting interval (twelve minutes from morning to evening). It stops at evening without jumping back to morning. Manual lighting selection stops the automatic journey. Moving clouds, gradually changing shadows and lantern glow accompany the transition. Stars and a procedural moon appear in clear evening skies and fade with cloud/mist.
- **Display preference** offers Automatic (30 fps target), Smoother motion (60 fps target), and Lower battery use (30 fps with a lower pixel ratio). Sustained slow frames reduce pixel ratio and reflection resolution; sustained headroom can recover detail. The targets are not device guarantees. Look sensitivity is adjustable from 40% to 180%, with no head bob.

All additions use the existing browser and locally generated scenery/audio; they introduce no external API, account requirement or usage-based AI cost. New settings are validated within `quietGarden.walk.v1`, and older saves receive safe defaults. The miniature remains separate.

Still mode freezes water, wildlife, cloud motion, rain, petals and both automatic clocks. Manual location and atmosphere changes remain available. Background tabs do not advance either automatic clock. Existing system reduced-motion handling remains in place.

### Regression checks

`garden/tests/immersion.test.mjs` covers favourite validation, zero-volume persistence, daylight boundaries, shelter edges and adaptive-quality limits. `tools/browser-checks/garden-immersion.js` checks the built renderer through Three.js's existing devtools hook, including actual seated roof coverage, spatial audio, point-of-touch pond ripples, original readings, favourite restoration, visual Still-mode equality and moon/stars. It uses an isolated browser context and does not add a debug API to the shipped application.

Run the browser function with Playwright CLI on a local garden tab, alongside `garden-immersion-mobile.js`, `garden-walk.js`, `garden-expansion.js`, `garden-weather.js` and `garden-audio.js`. The existing scripts expect `http://127.0.0.1:8766`; build first, then use the local preview server. Generated screenshots stay under ignored `output/playwright/`.

### Tossing pebbles

Near the pond, **Toss a pebble** opens a deliberate aiming mode. Tap/click open
water to toss there, or use the keyboard-accessible **Gentle toss** button for a
suggested landing spot. Dragging continues to look around. Escape, another
control, or walking puts the held pebble down. There is no hand or arm overlay. The pebble launches from just below the
viewpoint, rising into view with a slight tumble. Its irregular geometry,
mineral mottling and fine bump texture respond to the garden lighting.
Standing and seated throws use the actual release height. Still mode cancels
throwing; hidden tabs pause the flight and waves. Sound remains opt-in.

`pebble-physics.mjs` evaluates ballistic flight in metres with gravity 9.81 m/s².
The trajectory is swept in intervals no larger than 1/120 s, independent of the
render rate. `stone-collisions.mjs` partitions static bank, ground, rock, bench
and bridge triangles for local collision checks, sampling the pebble's centre
and six radius offsets. This is a small-stone collision approximation, not a
full rigid-body solver. Blocked or out-of-range throws are rejected before
release; live collision checks also stop the stone at the first solid contact.

`pond-waves.js` shares eight damped wave packets between the water surface and
the reflection shader. Impacts create a small pooled splash; rings are clipped
to the pond boundary, leaves respond to wave height, and the stone slows and
sinks below the surface. Water response is procedural, not a fluid simulation.
One pebble is active at a time and temporary rings are capped and disposed.

Verification: `npm run test:garden` includes trajectory, frame-rate, surface
contact and swept-collision checks. Run `tools/browser-checks/garden-pebbles.js`
and `garden-pebbles-mobile.js` through Playwright CLI against the built preview
for desktop, touch, sound, pebble appearance and Still-mode checks.

### Clear view during a walk

**Just enjoy the garden** preserves guided walking and the two-minute break.
Manual movement keys are released when entering clear view; seated and Still
visits remain stationary. A visible hint before entry and a brief announcement
explain that the walk continues. Tap anywhere or use **Show controls** to restore
the interface while continuing the walk. Escape restores controls and pauses.
Mouse movement leaves the view clear. The restoring tap/key is consumed so it
cannot accidentally interact with the pond or trigger a walking control.
