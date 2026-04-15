# TouchDesigner Webfront

Another browser-based control interface system for TouchDesigner. Build custom control panels visually in an editor, then open the viewer on any device on your local network to send values back to TD in real time over WebSocket — no external dependencies, no Node.js, no bundler.

---

## How it works

TouchDesigner serves everything: the editor, the viewer, and the static files, all from a single `webserverDAT` on port `9980`. You open `/editor.html` to design your interface, save it to TD, then open `/` on any browser (phone, tablet, second monitor) to control your patch.

```
Browser /editor.html  ──────────────────────────────────────────────────────┐
         drag-and-drop interface builder                                     │
         saves interface.json via POST /save                                 │
                                                                             ▼
                                                               TouchDesigner (port 9980)
                                                               webserverDAT + Python
                                                               writes interface.json
                                                               updates [id, value] table

Browser /index.html  ───────────────────────────────────────────────────────┐
         live viewer, mirrors editor layout                                  │
         sends WebSocket messages on every control change  ◄────────────────┘
```

---

## Features

- **Visual editor** — drag components from a palette onto a grid canvas, position freely, edit label/params in a right sidebar
- **Multiple scenes** — tab-based scene management; switch scenes live from both editor and viewer
- **Real-time WebSocket** — values stream from the browser to TD on every interaction with auto-reconnect
- **TD table output** — the webserverDAT doubles as a `[id, value]` table readable from any other TD operator
- **Self-contained** — everything is served from TD itself; no separate server needed
- **ES modules, no bundler** — plain JavaScript with `type="module"` imports, works in any modern browser

---

## Getting Started

**Requirements:** TouchDesigner 2023.x or newer, a modern browser (Chrome 111+, Firefox 113+)

1. Clone or download this repo into a folder of your choice
2. Open `Webserver.toe` in TouchDesigner
3. In a browser, go to `http://localhost:9980/editor.html`
4. Drag controls from the left palette onto the canvas
5. Click **Save to TD** — this writes `interface.json` and populates the TD table
6. Open `http://localhost:9980` to use the live viewer

---

## License

MIT
