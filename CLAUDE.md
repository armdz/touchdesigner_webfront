# WebFront — TouchDesigner Web Interface Editor

## Qué es esto
App web que corre en TouchDesigner (webserverDAT). Tiene dos vistas:
- `/editor.html` — editor drag-and-drop de controles
- `/index.html` — interfaz final que el usuario usa, conectada a TD por WebSocket

## Stack
- Vanilla JS (ES modules, sin bundler)
- CSS custom properties
- Python (webserver_script.py) en TD
- WebSocket para comunicación en tiempo real con TD

## Estructura de archivos clave

```
public/
  index.html          ← vista usuario final
  editor.html         ← editor
  interface.json      ← config guardada de la interfaz
  js/
    components/       ← controles individuales
      BaseControl.js  ← clase base de todos los controles
      registry.js     ← REGISTRO CENTRAL: define tipos, tamaños, schemas, defaults
      ButtonControl.js
      SliderControl.js
      InputControl.js
      ToggleControl.js
      ColorControl.js
      ColorPalletControl.js  ← paleta de colores, envía id_r/g/b a TD
      XYPadControl.js
      KnobControl.js
      LabelControl.js
    editor/
      main.js         ← wiring del editor (conecta canvas, params, sceneMgr, palette)
      Canvas.js       ← canvas donde se arrastran y posicionan controles
      Palette.js      ← panel izquierdo con controles arrastrables
      ParamsPanel.js  ← panel derecho de propiedades (componente o escena)
      SceneManager.js ← gestión de escenas (tabs superiores)
    viewer/
      main.js         ← wiring del viewer
      Renderer.js     ← renderiza controles y conecta WebSocket
      SceneNav.js     ← navegación de escenas en vista usuario
    shared/
      api.js          ← loadInterface / saveInterface (fetch a /save y /values)
      ws.js           ← WSManager (WebSocket)
      utils.js        ← labelToId, uniqueId, snap
  css/
    base.css
    editor.css
    viewer.css
    components/       ← un CSS por componente
scripts/
  webserver_script.py ← callbacks del webserverDAT de TD
```

## Cómo agregar un componente nuevo

1. Crear `public/js/components/MiControl.js` extendiendo `BaseControl`
2. Crear `public/css/components/mi-control.css`
3. Registrar en `registry.js`: `{ Class, label, size, defaults, schema }`
4. Agregar `<link>` del CSS en `editor.html` e `index.html`
5. Agregar icono en `Palette.js` (ICONS object)
6. Si el tipo envía canales especiales (como `_r/_g/_b`), manejar en `webserver_script.py` → `_init_table_from_json`

## Flujo de datos (editor)
```
Palette (drag) → Canvas.drop → createControl → canvas-item
Canvas.onSelect(config) → ParamsPanel.show(config)
ParamsPanel.onChange(key, val) → Canvas.updateSelected → _refreshPreview
Canvas.onChange(controls) → SceneManager.saveControls
btnSave → POST /save → webserver_script.py escribe interface.json
```

## Flujo de datos (viewer/TD)
```
index.html → Renderer.render(scene)
ctrl.onChange → ws.send({ id, value })
webserverDAT recibe → _set_row(dat, id, value) → CHOP/DAT en TD
```

## Tamaños del sistema de grilla
```
CELL = 140 × 80 px
GAP  = 20 px
sz(cols, rows) = cols*140 + (cols-1)*20  ×  rows*80 + (rows-1)*20
Ej: 1×1 = 140×80,  2×1 = 300×80,  2×2 = 300×180
```

## Formato de mensajes a TD
- Controles simples: `{ id: "mi_control", value: 0.5 }`
- Color/Pallet: `{ id: "color_r", value: 0.1 }, { id: "color_g", value: 0.5 }, ...`
- XYPad: `{ id: "pad_x", value: 0.5 }, { id: "pad_y", value: 0.3 }`

## Notas importantes
- `ControlForm.js` y `ControlList.js` están eliminados — no se usan
- El editor usa drag & drop desde Palette al Canvas, NO formularios de agregar
- Las propiedades de escena se muestran en ParamsPanel (panel derecho), no en popup
- `ColorPalletControl` siempre envía r/g/b (0-1), no hex
- El CSS `.canvas-item__preview .control` fuerza `flex-direction: column` — los controles que necesiten row deben usar `!important`
