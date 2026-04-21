import { createControl, getEntry } from '../components/registry.js';

export class Renderer {
  constructor(container, ws) {
    this._container = container;
    this._ws        = ws;
    /** @type {Map<string, import('../components/BaseControl.js').BaseControl>} */
    this._controls  = new Map();
  }

  render(interfaceConfig) {
    this._container.innerHTML = '';
    this._controls.clear();

    this._container.style.setProperty('--accent', interfaceConfig.color ?? '#00d4ff');

    const controls = interfaceConfig.controls ?? [];

    if (controls.length === 0) {
      this._container.innerHTML =
        '<p class="viewer-empty">No controls defined.<br>' +
        'Open <a href="/editor.html">editor.html</a> to build your interface.</p>';
      return;
    }

    for (const config of controls) {
      try {
        const entry = getEntry(config.type);
        if (!entry) continue;

        const ctrl = createControl(config);
        ctrl.onChange(({ id, value }) => this._ws.send({ id, value }));

        const size = entry.sizeOf?.(config) ?? entry.size;

        const wrapper = document.createElement('div');
        wrapper.className = 'viewer-item';
        wrapper.style.cssText = [
          `left:${config.x ?? 0}px`,
          `top:${config.y ?? 0}px`,
          `width:${size.w}px`,
          `height:${size.h}px`,
        ].join(';');

        wrapper.appendChild(ctrl.render());
        this._container.appendChild(wrapper);
        this._controls.set(config.id, ctrl);
      } catch (e) {
        console.warn(`Skipping control "${config.id}":`, e.message);
      }
    }
  }

  setValue(id, value) {
    // Direct match
    const ctrl = this._controls.get(id);
    if (ctrl) { ctrl.setValue(value); return; }

    // Channel routing: "base_id_channel" → control.setChannelValue(channel, value)
    // e.g. "color_1_r" → control "color_1", channel "r"
    const sep = id.lastIndexOf('_');
    if (sep > 0) {
      const base    = id.slice(0, sep);
      const channel = id.slice(sep + 1);
      this._controls.get(base)?.setChannelValue?.(channel, value);
    }
  }
}
