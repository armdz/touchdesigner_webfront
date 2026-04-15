# TouchDesigner WebServer — Project Notes

## Overview

A TouchDesigner web interface system. A Python `webserverDAT` serves static files and handles WebSocket messages. The frontend has two pages:

- `/editor.html` — visual drag-and-drop interface editor
- `/` (`index.html`) — live viewer that mirrors the editor layout and sends control values to TD via WebSocket

---

## File Structure

```
Webserver.toe                        ← TouchDesigner project file
scripts/
  webserver_script.py                ← All Python callbacks for webserverDAT

public/
  interface.json                     ← Saved interface definition (scenes + controls)
  editor.html                        ← Editor shell HTML
  index.html                         ← Viewer shell HTML

  css/
    base.css                         ← CSS variables, reset, buttons, header, scene-nav
    editor.css                       ← 3-panel editor layout, canvas, scene tabs
    viewer.css                       ← Viewer canvas layout
    components/
      slider.css
      button.css
      input.css

  js/
    shared/
      api.js                         ← loadInterface(), saveInterface()
      ws.js                          ← WSManager class (auto-reconnect WebSocket)
      utils.js                       ← labelToId(), uniqueId(), snap()

    components/
      BaseControl.js                 ← Abstract base class for all controls
      SliderControl.js               ← Range slider (0–1 default)
      ButtonControl.js               ← Momentary button (sends 1 on press, 0 on release)
      InputControl.js                ← Text/number input field
      registry.js                    ← Central registry: maps type → {Class, label, size, defaults, schema}

    editor/
      main.js                        ← Editor entry point, wires everything together
      Canvas.js                      ← Drag-and-drop canvas with grid snap (20px)
      Palette.js                     ← Left sidebar with draggable component types
      ParamsPanel.js                 ← Right sidebar for editing selected component params
      SceneManager.js                ← Scene tabs (add/rename/delete/switch scenes)
      ControlForm.js                 ← (legacy, unused — replaced by Palette+ParamsPanel)
      ControlList.js                 ← (legacy, unused — replaced by Canvas)

    viewer/
      main.js                        ← Viewer entry point
      Renderer.js                    ← Renders controls at absolute positions from JSON
      SceneNav.js                    ← Scene navigation buttons (hidden if only 1 scene)
```

---

## interface.json Format

```json
{
  "scenes": [
    {
      "id": "scene_abc123",
      "name": "Scene 1",
      "controls": [
        {
          "type": "slider",
          "id": "brightness",
          "label": "Brightness",
          "min": 0, "max": 1, "step": 0.01, "value": 0,
          "x": 40, "y": 40
        },
        {
          "type": "button",
          "id": "trigger",
          "label": "Trigger",
          "text": "Fire",
          "value": 0,
          "x": 40, "y": 140
        },
        {
          "type": "input",
          "id": "message",
          "label": "Message",
          "placeholder": "Type here...",
          "fieldType": "text",
          "value": "",
          "x": 40, "y": 220
        }
      ]
    }
  ]
}
```

**Legacy format** (`{controls: [...]}` without scenes) is auto-migrated to a single scene on load.

`x`, `y` are pixel positions on the canvas (snapped to 20px grid). They are used by both editor and viewer for absolute positioning.

---

## WebSocket Protocol

All messages are JSON strings.

### Client → TouchDesigner

```json
{ "id": "brightness", "value": 0.75 }        // control value changed
{ "action": "scene", "id": "scene_abc123" }   // scene switched
```

### TouchDesigner → Client

```json
{ "ack": true, "id": "brightness", "value": 0.75 }
{ "ack": true, "action": "scene", "id": "scene_abc123" }
{ "error": "message" }
```

### WebSocket URL
`ws://localhost:9980` (same port as HTTP server, default 9980 in TD)

---

## Python (webserver_script.py)

### HTTP Endpoints

| Method | URI | Action |
|--------|-----|--------|
| GET | `/` or `/index.html` | Serves `public/index.html` |
| GET | `/editor.html` | Serves `public/editor.html` |
| GET | `/css/...`, `/js/...` | Serves any static file from `public/` |
| GET | `/interface.json` | Serves `public/interface.json` |
| POST | `/save` | Writes body to `interface.json`, refreshes TD table |

Path traversal protection: all GET requests are validated to stay inside `public/`.

### TouchDesigner Table (webserverDAT)

The dat is used as a table with columns `[id, value]`. Row 0 is the header.

- Populated on **server start** (`onServerStart`) from the first scene in `interface.json`
- Refreshed on **POST /save** (shows all controls of first scene with their default values)
- Updated on **WS control message** — only that row is updated
- Refreshed on **WS scene switch** — full table replaced with new scene's controls

To read the slider value from another TD operator:
```python
op('webserver1')['brightness', 'value']
```

To push a value to a Constant CHOP, uncomment in `onWebSocketReceiveText`:
```python
op('constant1').par.value0 = value
```

### Global state in Python
```python
_control_values  # dict: id → current value (survives scene/save refreshes)
```

---

## Editor Features

### Layout
3-panel grid: `Palette (140px) | Canvas (flex) | Params (220px)`

### Canvas
- Grid: 20px snap
- Drop a component from palette → places at cursor, snapped to grid
- Click component → selects it (blue border), shows params in right panel
- Drag component → repositions with snap
- Click background → deselects
- `Delete` or `Backspace` key → deletes selected component (only if focus not in an input)

### Scene Tabs (above canvas)
- Click to switch scene (auto-saves current canvas controls to scene in memory)
- Double-click tab name → rename prompt
- `×` on tab → delete scene (disabled if only 1 scene)
- `+ Scene` → adds new empty scene

### Params Panel
- Label field → ID auto-derives from label using `labelToId()` (snake_case)
- ID collision → auto-increments (`brightness_1`, `brightness_2`, etc.)
- ID field is readonly (always derived from label)
- Delete button → removes selected component

### Preview Mode
- Click ▶ **Preview** button → hides palette and params, shows interactive preview
- Controls are functional and send WS messages
- WS status indicator shown in header
- Scene navigation buttons appear if multiple scenes
- Click `← Edit` to return to edit mode

### Save
- Click 💾 **Save to TD** → POSTs current scenes to `/save`
- Python writes `interface.json` and updates the TD table

---

## Component System

### Adding a New Control Type

1. Create `public/js/components/MyControl.js` extending `BaseControl`
2. Implement `render()` → returns `HTMLElement`
3. Optionally override `_syncDOM()` for `setValue()` support
4. Override `toJSON()` → spread `super.toJSON()` and add extra fields
5. Create `public/css/components/my-control.css`
6. Add to `public/js/components/registry.js`:

```javascript
import { MyControl } from './MyControl.js';

// In REGISTRY:
mycontrol: {
  Class:    MyControl,
  label:    'My Control',
  size:     { w: 200, h: 80 },   // must be multiples of 20 (grid)
  defaults: { value: 0, myParam: 'default' },
  schema: [
    { key: 'id',      label: 'ID',       inputType: 'text',   readonly: true },
    { key: 'label',   label: 'Label',    inputType: 'text',   required: true },
    { key: 'myParam', label: 'My Param', inputType: 'text',   default: 'default' },
    // inputType: 'text' | 'number' | 'select' (add options:[] for select)
  ],
},
```

7. Add icon SVG to `Palette.js` ICONS map
8. Link the CSS in both `editor.html` and `index.html`

### BaseControl API

```javascript
class MyControl extends BaseControl {
  constructor(config) {
    super(config); // sets this.type, this.id, this.label, this.value
  }

  render() {
    // Build and return HTMLElement
    // Call this._emit(value) when user changes value
    // Store root element as this._el
  }

  _syncDOM() {
    // Called when setValue() is used externally (e.g. from WS message)
  }

  toJSON() {
    return { ...super.toJSON(), myExtraField: this.myExtraField };
  }
}
```

### WS Message sent per control
```json
{ "id": "control_id", "value": <number or string> }
```
- Sliders send numbers
- Buttons send `1` (press) or `0` (release)
- Input fields send strings (text) or numbers (number type)
- Python handles both: tries `float()`, falls back to `str()`

---

## CSS Design System

```css
/* Variables (in base.css) */
--bg:       #111    /* page background */
--bg-2:     #1a1a1a /* card background */
--bg-3:     #222    /* input background */
--border:   #2a2a2a
--text:     #eee
--text-dim: #888
--accent:   #00d4ff /* cyan */
--ok:       #00ff88
--warn:     #ffaa00
--error:    #ff4444
--radius:   6px
```

All controls share `.control` base class. The `.control__id` span is hidden in viewer and preview (shown only in editor canvas for reference).

---

## Known Quirks / Watch Out

- **`project` global** — `project.folder` is a TouchDesigner global, not standard Python. The IDE linter warns "not defined" — this is a false positive, it works fine at runtime in TD.
- **`webserverDAT` type hints** — same deal, TD-specific type that linters don't know.
- **ES Modules** — all JS uses `type="module"` with relative imports including file extensions (`.js`). No bundler needed.
- **`color-mix()`** — used in CSS for transparent accent overlays. Requires a modern browser (Chrome 111+, Firefox 113+).
- **Static file serving** — Python serves any file from `public/` generically based on extension. Adding a new file just works without Python changes.
- **Button text vs label** — ButtonControl has both `label` (shown in params panel, used to derive ID) and `text` (shown on the button face). They start equal but can differ.
- **Scene controls saved in memory** — switching scenes auto-saves current controls to `sceneMgr._scenes[idx].controls`. They are NOT written to disk until Save is clicked.

---

## Pending Ideas / Next Steps

- Toggle control (on/off, sends 0/1)
- XY Pad (2D control, sends `{id, x, y}`)
- Color picker
- Number display (read-only label that shows incoming WS values)
- Resize components on canvas (drag corner handle)
- Reorder scenes (drag tabs)
- Keyboard shortcuts (Ctrl+S to save, Escape to deselect)
- Lock mode (prevent accidental moves in editor)
- Export interface as standalone HTML
- Multiple webserverDAT table outputs (one per scene)
