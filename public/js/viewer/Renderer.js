import { createControl, getEntry } from '../components/registry.js';

/**
 * Renderer — places controls on a canvas using the same x/y/size as the editor.
 * The viewer mirrors the editor layout exactly.
 */
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

        const wrapper = document.createElement('div');
        wrapper.className = 'viewer-item';
        wrapper.style.cssText = [
          `left:${config.x ?? 0}px`,
          `top:${config.y ?? 0}px`,
          `width:${entry.size.w}px`,
          `height:${entry.size.h}px`,
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
    this._controls.get(id)?.setValue(value);
  }
}
