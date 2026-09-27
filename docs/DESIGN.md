# Ground Control interface design

## Principles

1. Every scanned mark has a measurement. The Sky's topic angle, README lag radius, star size, and drift state have a visible key; unscanned holding-orbit marks are explicitly unmeasured.
2. Evidence stays one action away. A selected repo names the commit and tiers checked before offering a scan, source change, or correction.
3. Status is a word and a shape. An amber outline marks a possible mismatch to review; a broken amber ring marks confirmed drift. Simulated data has a dashed hollow mark and never enters measured findings.

## Color and type

| Token | Hex | Role |
| --- | --- | --- |
| Night | `#0D171B` | Main background |
| Hull | `#18282E` | Raised instrument panels |
| Rule | `#627982` | Boundaries, axes, secondary marks |
| Paper | `#F2F3ED` | Primary text, focus and selection |
| Mist | `#C2CFCA` | Secondary text and quiet marks |
| Drift | `#F2B84B` | Review outlines and confirmed drift rings |

IBM Plex Sans is the interface face. IBM Plex Mono sets telemetry, numbers, URLs, commands, and hashes. Labels use sentence case. Symbols accompany status; color alone never names a state. Solid surfaces and hairline rules echo flight consoles and navigation plots. There are no gradients, glass surfaces, idle particles, or decorative glow.

## Screen sketches

```text
Sky · desktop / stage (1920×1080)
┌ brand · Sky / Repos / Add source / Connect · account ───────────────┐
│ title · live/cached/simulated provenance · last scan · scan input   │
│ ┌ topic/lag star chart, legend and scale ┐ ┌ findings / inspector ┐ │
│ │ representative measured marks          │ │ selected commit      │ │
│ │ keyboard list directly below chart     │ │ tiers and evidence   │ │
│ └─────────────────────────────────────────┘ └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

Sky · phone portrait (390×844)
┌ brand · menu ┐
│ provenance  │
│ star chart  │
│ legend      │
│ selected evidence / measured findings / searchable satellite list │
└─────────────┘

Repo view: status and degrees → measured trajectory → sources → runs.
Run detail: verdict and commit → grouped evidence → every check → confirm/drop.
Add source: repo and source URL form → privacy disclosure → result.
Connect: GitHub repo form → connection result and next setup action.
Sign-in: GitHub action → return to the requested view.
```

At stage size, headline values and the chart key use at least 24 px. At phone width, the chart precedes secondary controls and remains reachable after the keyboard closes; the inspector follows it rather than covering it. Touch controls are at least 44 px high.

## Visualization contract

- **Job:** monitor documentation drift across public repos and inspect one repo's evidence. One Sky Canvas2D instance draws up to four representative scans per topic on desktop or two on phone, plus up to twelve or six holding-orbit marks. A repo view has one small SVG trajectory. React owns fetched data, filters, semantic controls, and inspector; the Canvas owns geometry and hit testing.
- **Encoding:** topic cluster selects one of five angular sectors; README lag days set a monotonic compressed radius; stars set log-scaled dot radius; status sets symbol and brightness. Marks have distinct angular slots within each topic, with a small bounded glide that cannot swap their order. The legend states each mapping. Drift flicker speed follows degrees; reduced-motion users see a static mark. Simulated marks are hollow and dashed.
- **Interaction:** pointer click selects the nearest displayed mark. The paged searchable list below the chart contains every filtered repository and lets keyboard and screen-reader users select any one; a selected repo enters the representative map. The selected repo is mirrored in `?repo=owner/name`; browser Back restores it. The inspector links to exact run evidence when available. A tap/focus replaces hover on touch and keyboard.
- **Data state:** `/api/sky` is the source of truth. `live`, `cached`, and `simulated` are shown by name with `updatedAt`. Findings are derived from non-simulated entries only. A failed refresh keeps the previous snapshot with an offline message; no snapshot gets an actionable empty state. Server-Sent Events trigger bounded refreshes while visible.
- **Performance:** layout is computed once per data/size change with d3 scales, using the full filtered set for stable scale extents. Canvas DPR is capped at 2. The chart turns once every five minutes and each mark glides within its own topic slot, with inner marks faster (period ∝ radius^1.5); radius never animates, so README lag stays exact. Animation runs only while visible; reduced motion is static. Pointer picking uses the displayed point array. The list offers a non-Canvas fallback. No WebGL context is needed.
- **Trajectory:** each run's confirmed check results define its drift angle; the chart never infers an angle from `failingCount` alone. If run detail is unavailable, the telemetry list remains and the trajectory says why it is absent.
- **QA:** test mode labels, simulated exclusion, deterministic 500-point layout, keyboard selection, stale/empty states, and desktop/phone rendering. Verify contrast, reduced motion, and screenshot legibility at 1920×1080 and 390×844.
