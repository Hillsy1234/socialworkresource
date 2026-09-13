# The Quiet Garden

An optional browser-rendered 3D break at `/garden/`, linked from the shared learning workspace for every practice location. It is recreational, with no claim to treat stress or automatically count as CPD.

## First-person garden walk

A roughly 191-metre looping gravel path passes six places: the garden gate, wildflower border, water garden, silver birches, woodland bench and evening border. The larger landscape uses textured ground, individual grass blades, leafy tree crowns, shrubs, flowers, a gently arched timber bridge and a reflecting pond. Geometry and textures are generated locally. Optional sound effects are served as small local audio files; no external models, image services or accounts are required.

- W A S D / arrow keys move at eye level. Drag to look; Q / E turn using a keyboard. Touch devices show hold-to-walk directional buttons. The camera has no artificial head bob.
- Follow the path guides the camera at the selected pace (0.8, 1.3 or 1.8 metres per second). It stops after one loop. Pause, Escape, manual movement, instructions, the map, tab hiding and window blur stop guided movement. A paused walk does not resume by itself.
- The map and Next quiet spot move instantly to one of six locations. Sit a while uses a nearby bench when available, otherwise a lower seated viewpoint; standing restores the previous safe position.
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

The scene caps rendering at 30 fps, uses instancing for foliage/grass/flowers, reduces phone geometry and pixel ratio, and avoids continuous redraws in Still mode. Testing uses desktop Chromium and phone viewport/touch emulation; physical phones may vary in performance. There are no additional search or AI API charges for using the garden.

## Audio assets

The 17 CC0 MP3 effects total about 145 KB and load only after Sound is enabled. Credits, source filenames, modifications and hashes are in `assets/garden-audio/`. Recorded footsteps and splashes vary without immediately repeating a sample. Quiet water uses proximity-based volume and stereo placement relative to the viewing direction. Switching Sound off clears active effects so they do not resume midway later. Individual download failures leave available effects usable and offer a retry by toggling Sound. The miniature retains its original audio.

## Garden weather

The Weather button in the top-right header opens four choices independent of the time of day: Clear skies, Cloudy, Light rain and Mist. Cloud cover softens sunlight; rain darkens surfaces, adds falling drops and small pond ripples; mist increases atmospheric haze and adds low translucent wisps among the trees. The rain sound is generated locally as a quiet stereo bed and fades with rainfall intensity. It uses the existing Sound opt-in and mute controls; no new audio downloads are needed.

Manual weather changes blend over eight seconds. Optional automatic weather follows clear → cloud → rain → cloud → mist → clear, changing about every two minutes of active garden time. It starts off. Both the selected weather and automatic preference save alongside the existing walk preferences. Old saves default to clear skies without changing their lighting selection.

Still mode freezes the rendered rain, ripples, mist and ongoing transitions, and pauses the automatic clock. An explicit weather selection in Still mode switches instantly to its static view. Sound remains independently optional. Background tabs and the welcome view do not advance the automatic clock. There is no thunder, lightning, weather API or location lookup.

`garden/tests/weather.test.mjs` checks save compatibility, interrupted transitions and the paused automatic clock. `tools/browser-checks/garden-weather.js` checks the controls, persistence, lighting independence, pixel-identical still frames, silent opt-in behaviour and small-screen layouts.
