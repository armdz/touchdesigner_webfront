import { BaseControl } from './BaseControl.js';

export class XYPadControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'xypad' });
    const parts = String(config.value ?? '0.50 0.50').split(' ');
    this.x = parseFloat(parts[0]) || 0.5;
    this.y = parseFloat(parts[1]) || 0.5;
    this.value = `${this.x.toFixed(2)} ${this.y.toFixed(2)}`;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control xypad-control';
    el.innerHTML = `
      <div class="control__header">
        <span class="control__label">${this.label}</span>
        <span class="control__id">${this.id}</span>
      </div>
      <div class="xypad-control__pad" data-pad>
        <div class="xypad-control__line xypad-control__line--h" data-hline></div>
        <div class="xypad-control__line xypad-control__line--v" data-vline></div>
        <div class="xypad-control__thumb" data-thumb></div>
      </div>
    `;

    const pad   = el.querySelector('[data-pad]');
    const thumb = el.querySelector('[data-thumb]');
    const hline = el.querySelector('[data-hline]');
    const vline = el.querySelector('[data-vline]');
    this._el = el;

    const setPos = (nx, ny) => {
      this.x = Math.max(0, Math.min(1, nx));
      this.y = Math.max(0, Math.min(1, ny));
      this.value = `${this.x.toFixed(2)} ${this.y.toFixed(2)}`;
      const px = (this.x * 100).toFixed(1);
      const py = ((1 - this.y) * 100).toFixed(1); // y=0 → bottom, y=1 → top
      thumb.style.left = `${px}%`;
      thumb.style.top  = `${py}%`;
      hline.style.top  = `${py}%`;
      vline.style.left = `${px}%`;
      this._emitChannels();
    };

    const fromEvent = (e) => {
      const rect = pad.getBoundingClientRect();
      return [
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      ];
    };

    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pad.setPointerCapture(e.pointerId);
      setPos(...fromEvent(e));
    });
    pad.addEventListener('pointermove', (e) => {
      if (e.buttons === 0) return;
      setPos(...fromEvent(e));
    });

    // Set initial thumb position without emitting
    const px = (this.x * 100).toFixed(1);
    const py = ((1 - this.y) * 100).toFixed(1);
    thumb.style.left = `${px}%`;
    thumb.style.top  = `${py}%`;
    hline.style.top  = `${py}%`;
    vline.style.left = `${px}%`;

    return el;
  }

  _emitChannels() {
    this._onChange?.({ id: this.id + '_x', value: parseFloat(this.x.toFixed(4)) });
    this._onChange?.({ id: this.id + '_y', value: parseFloat(this.y.toFixed(4)) });
  }

  /** Called by Renderer when live values arrive for e.g. "pad_1_x" */
  setChannelValue(channel, value) {
    const num = parseFloat(value);
    if (channel === 'x') this.x = isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
    else if (channel === 'y') this.y = isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
    this.value = `${this.x.toFixed(2)} ${this.y.toFixed(2)}`;
    this._syncDOM();
  }

  _syncDOM() {
    if (!this._el) return;
    const px = (this.x * 100).toFixed(1);
    const py = ((1 - this.y) * 100).toFixed(1);
    const thumb = this._el.querySelector('[data-thumb]');
    const hline = this._el.querySelector('[data-hline]');
    const vline = this._el.querySelector('[data-vline]');
    if (thumb) { thumb.style.left = `${px}%`; thumb.style.top = `${py}%`; }
    if (hline) hline.style.top  = `${py}%`;
    if (vline) vline.style.left = `${px}%`;
  }

  toJSON() {
    return { type: this.type, id: this.id, label: this.label, value: this.value };
  }
}
