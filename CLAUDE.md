# WebFront — TouchDesigner Web Interface Editor

## Qué es esto
App web que corre en TouchDesigner (webserverDAT). Tiene dos vistas:
- `/editor.html` — editor drag-and-drop de controles
- `/index.html` — interfaz final que el usuario usa, conectada a TD por WebSocket

## Stack
- Vanilla JS (ES modules, sin bundler, sin framework)
- CSS custom properties (`--accent`, `--bg`, `--text`, etc.)
- Python (`webserver_script.py`) en TD como servidor HTTP + WebSocket
- WebSocket para comunicación en tiempo real con TD

## Estructura de archivos clave

```
public/
  index.html          ← vista usuario final
  editor.html         ← editor drag-and-drop
  interface.json      ← config guardada (escenas + controles)
  js/
    components/       ← controles individuales
      BaseControl.js  ← clase base: render(), setValue(), _emit(), toJSON()
      registry.js     ← REGISTRO CENTRAL: tipos, tamaños, schemas, defaults
      ButtonControl.js
      RoundButtonControl.js
      SliderControl.js     ← horizontal + vertical (orientation param)
      InputControl.js
      ToggleControl.js
      ColorControl.js
      ColorPalletControl.js  ← paleta de colores, envía id_r/g/b a TD
      XYPadControl.js
      KnobControl.js
      LabelControl.js
    editor/
      main.js         ← wiring del editor
      Canvas.js       ← canvas de arrastre y posicionamiento
      Palette.js      ← panel izquierdo con controles arrastrables
      ParamsPanel.js  ← panel derecho de propiedades (componente o escena)
      SceneManager.js ← gestión de escenas (tabs)
      ProjectManager.js ← multi-proyecto en localStorage
    viewer/
      main.js         ← wiring del viewer
      Renderer.js     ← renderiza controles, aplica color de escena, conecta WS
      SceneNav.js     ← navegación de escenas en vista usuario
    shared/
      api.js          ← loadInterface / saveInterface / loadValues
      ws.js           ← WSManager (WebSocket con reconexión)
      utils.js        ← labelToId, uniqueId, snap
  css/
    base.css          ← variables, botones, header, status, scene-nav
    editor.css        ← layout 3 columnas, canvas-items, params panel
    viewer.css        ← viewer-item, viewer-canvas
    components/       ← un CSS por componente
scripts/
  webserver_script.py ← callbacks del webserverDAT de TD
```

## Sistema de grilla — REGLA FUNDAMENTAL

Todos los tamaños deben ser **múltiplos de 20** (el snap grid = 20px).

```
CELL = 140 × 80 px    (celda base)
GAP  = 20 px          (espacio entre componentes)
SQ   = 80 × 80 px     (celda cuadrada)
HALF = 40 px          (media fila, válido como múltiplo de 20)

sz(cols, rows) = { w: cols*140 + (cols-1)*20, h: rows*80 + (rows-1)*20 }
```

### Tamaños actuales de cada componente

| Componente       | W   | H   | Fórmula              |
|-----------------|-----|-----|----------------------|
| button          | 140 | 80  | sz(1,1)              |
| roundbutton     | 80  | 80  | SQ                   |
| slider H        | 300 | 80  | sz(2,1)              |
| slider V        | 80  | 180 | SQ.w × sz(1,2).h     |
| input           | 300 | 80  | sz(2,1)              |
| toggle          | 80  | 80  | SQ                   |
| color           | 300 | 80  | sz(2,1)              |
| pallet (n cols) | 20+60n | 80 | n=1→80, n=2→140…  |
| xypad           | 300 | 180 | sz(2,2)              |
| knob            | 80  | 80  | SQ                   |
| label           | 300 | 40  | ancho sz(2,1), HALF  |

La fórmula del pallet es `{ w: 20 + 60*n, h: 80 }` donde n = número de colores.
Con `padding: 20px` y `gap: 20px` en el CSS, los swatches de 40×40px encajan exactamente.

## Cómo agregar un componente nuevo

1. Crear `public/js/components/MiControl.js` extendiendo `BaseControl`
2. Crear `public/css/components/mi-control.css`
3. Registrar en `registry.js`: `{ Class, label, size, defaults, schema }`
   - `size` debe ser múltiplo de 20 en ambas dimensiones
   - Si el tamaño varía con config: agregar `sizeOf(cfg) → {w, h}`
4. Agregar `<link>` del CSS en `editor.html` e `index.html`
5. Agregar icono en `Palette.js` (objeto `ICONS`)
6. Si el tipo envía canales especiales, manejar en `webserver_script.py` → `_init_table_from_json`

## Flujo de datos (editor)
```
Palette (drag) → Canvas.drop → _addItem → _renderItem
Canvas.onSelect(config) → ParamsPanel.show(config)
ParamsPanel.onChange(key, val) → Canvas.updateSelected → _refreshPreview
Canvas.onChange(controls) → SceneManager.saveControls → commitToProject
btnSave → POST /save → webserver_script.py escribe interface.json
```

## Flujo de datos (viewer/TD)
```
index.html carga → loadInterface() → SceneNav.load + Renderer.render(scene)
ctrl.onChange → ws.send({ id, value })
webserverDAT recibe → _set_row(dat, id, value) → CHOP/DAT en TD
```

## Modelo de datos — interface.json

```json
{
  "name": "Nombre del proyecto",
  "scenes": [
    {
      "id": "scene_abc123",
      "name": "Scene 1",
      "color": "#00d4ff",
      "controls": [
        {
          "type": "slider",
          "id": "mi_slider",
          "label": "Velocidad",
          "x": 20, "y": 20,
          "min": 0, "max": 1, "step": 0.01, "value": 0,
          "orientation": "horizontal"
        }
      ]
    }
  ]
}
```

El campo `color` en cada escena es **opcional** (default `#00d4ff`). Si no existe, los componentes usan el acento por defecto.

## Sistema de color por escena

Cada escena puede tener su propio color de acento. Se guarda como `scene.color` (hex).

- **Editor**: al seleccionar una escena, se aplica `--accent` sobre `#canvas` y `#preview` mediante `element.style.setProperty('--accent', color)`
- **Viewer/Renderer**: `Renderer.render(scene)` aplica `scene.color ?? '#00d4ff'` sobre el contenedor antes de renderizar
- **ParamsPanel**: `showScene()` muestra un `<input type="color">` + botón Reset para cambiar el color

Todos los componentes usan `--accent` para sus colores activos (fill de knob, thumb de slider, switch de toggle, etc.), por lo que el cambio de variable CSS los afecta automáticamente.

## Formato de mensajes a TD (WebSocket)
- Controles simples: `{ id: "mi_control", value: 0.5 }`
- Color: `{ id: "color_r", value: 0.1 }`, `{ id: "color_g", value: 0.5 }`, `{ id: "color_b", value: 0.9 }`, `{ id: "color_a", value: 1.0 }`
- Pallet: `{ id: "pallet_r", value: 0.1 }`, `{ id: "pallet_g", value: 0.5 }`, `{ id: "pallet_b", value: 0.9 }`
- XYPad: `{ id: "pad_x", value: 0.5 }`, `{ id: "pad_y", value: 0.3 }`
- Cambio de escena: `{ action: "scene", id: "scene_abc123" }`

## Sistema de multi-proyecto (ProjectManager)

Los proyectos viven en `localStorage` (claves `webfront_projects` y `webfront_current`). Cada proyecto tiene `{ id, name, data }` donde `data` es el objeto completo de interface.json. El servidor solo conoce un `interface.json` en disco; los proyectos adicionales solo existen en el browser hasta que se guarda con "Save to TD".

## BaseControl — contrato de subclases

```js
class MiControl extends BaseControl {
  render()    // → HTMLElement (obligatorio)
  _syncDOM()  // → void (actualizar DOM cuando setValue() es llamado externamente)
  toJSON()    // → { ...super.toJSON(), ...propiedades_extra }
}
// Para emitir cambios al viewer/TD:
this._emit(value)  // guarda this.value y llama this._onChange
```

## Notas arquitecturales importantes
- `ControlForm.js` y `ControlList.js` están eliminados — no se usan
- El editor usa drag & drop desde Palette al Canvas, NO formularios
- Las propiedades de escena se muestran en ParamsPanel (click en tab de escena)
- `ColorPalletControl` siempre envía r/g/b (0-1), no hex
- El CSS `.canvas-item__preview .control` fuerza `flex-direction: column` — los controles que necesiten row deben usar `!important` en su CSS
- El snap grid es `GRID = 20` en `Canvas.js` — todos los tamaños de componentes deben ser múltiplos de 20
- `Renderer.js` y el editor preview usan el mismo `entry.sizeOf?.(config) ?? entry.size` para dimensionar los wrappers

## Posibles áreas de optimización (para quien optimice)
- `_refreshPreview` en Canvas crea una nueva instancia del control cada vez que cambia cualquier propiedad — podría actualizarse in-place
- `ParamsPanel._renderPalletColors` usa estilos inline — podría migrar a clases CSS
- Los proyectos en localStorage no tienen límite de tamaño — podría agregar compresión o aviso
- `webserver_script.py` sirve archivos leyendo en texto (`open(..., 'r')`) — archivos binarios (imágenes) no funcionarían
- No hay validación de IDs duplicados entre escenas — dos controles en escenas distintas pueden tener el mismo ID sin conflicto en el canvas, pero sí en la tabla TD
