# TouchDesigner Webfront

Yes, another browser-based control interface builder for TouchDesigner. Design panels visually in an editor, then open the viewer on any device on your local network — values stream to TD in real time over WebSocket. No external dependencies, no Node.js, no bundler.

---

## How it works

TouchDesigner serves everything from a single `webserverDAT` on port `9980`. Open `/editor.html` to build your interface, save it to TD, then open `/` on any device to start sending values.

```
Browser /editor.html  ─────────────────────────────────────────────────────┐
         drag-and-drop interface builder                                    │
         POST /save → writes interface.json                                 │
                                                                            ▼
                                                            TouchDesigner (port 9980)
                                                            webserverDAT + Python
                                                            writes interface.json
                                                            maintains [id, value] table

Browser /index.html  ──────────────────────────────────────────────────────┐
         live viewer, mirrors editor layout                                 │
         WebSocket message on every interaction  ◄──────────────────────── ┘
```

---

## Features

- **Visual editor** — drag components from the palette, position freely, edit params in the right sidebar
- **Multiple scenes** — tab-based scene management; switch live from editor or viewer
- **Preview mode** — toggle in-editor preview to test the interface before deploying
- **Real-time WebSocket** — values stream on every interaction, auto-reconnect
- **TD table output** — `webserverDAT` doubles as an `[id, value]` table readable from any TD operator
- **Multi-channel controls** — color and XY pad emit separate float channels (`_r/_g/_b/_a`, `_x/_y`) instead of combined strings
- **Self-contained** — served entirely from TD; no separate server needed
- **ES modules, no bundler** — plain JavaScript with `type="module"`, works in any modern browser

---

## Components

| Component | Size | Description |
|-----------|------|-------------|
| **Slider** (horizontal) | 300 × 80 | Native range input with min/max/step |
| **Slider** (vertical) | 80 × 180 | Pointer-drag track, same params as horizontal |
| **Knob** | 80 × 80 | SVG arc knob, drag or scroll to change value |
| **Button** | 140 × 80 | Momentary press, sends 1 on down / 0 on up |
| **Toggle** | 80 × 80 | On/off switch, sends 0 or 1 |
| **Input** | 300 × 80 | Text or number field |
| **Color** | 300 × 80 | Hex color picker + alpha slider; emits `_r/_g/_b/_a` channels |
| **XY Pad** | 300 × 180 | 2D pad; emits `_x` and `_y` channels |
| **Label** | 300 × 40 | Decorative text strip — no TD row |

---

## TD Table Format

Each control maps to one or more rows `[id, value]` in the webserverDAT table:

- Most controls → single row, e.g. `slider_1 → 0.75`
- Color → four rows: `color_1_r`, `color_1_g`, `color_1_b`, `color_1_a` (float 0–1)
- XY Pad → two rows: `pad_1_x`, `pad_1_y` (float 0–1)
- Label → no row (decorative only)

---

## Grid System

The canvas uses a fixed block grid:

- **Cell**: 140 × 80 px
- **Gap**: 20 px between cells
- `sz(cols, rows)` = `cols×140 + (cols−1)×20` × `rows×80 + (rows−1)×20`
- **Square cell** (knob, toggle, vertical slider): 80 × 80 (or 80 × 180 for vertical)

---

## Getting Started

**Requirements:** TouchDesigner 2023.x or newer, Chrome 111+ / Firefox 113+

1. Clone or download this repo
2. Open `Webserver.toe` in TouchDesigner
3. In a browser, go to `http://localhost:9980/editor.html`
4. Drag controls from the palette onto the canvas
5. Click **Save to TD** — writes `interface.json` and populates the TD table
6. Open `http://localhost:9980` to use the live viewer

---

## File Structure

```
public/
  index.html          ← viewer (full-screen, no-select UI)
  editor.html         ← visual editor
  css/
    base.css          ← CSS variables, reset, monospace font stack
    viewer.css
    editor.css
    components/       ← one CSS file per component type
  js/
    components/       ← BaseControl + one JS class per type
    viewer/           ← Renderer (WebSocket + layout)
    editor/           ← Canvas, Palette, ParamsPanel, main
scripts/
  webserver_script.py ← TouchDesigner webserverDAT callback
interface.json        ← saved layout (scenes → controls)
```

---

## License

MIT
