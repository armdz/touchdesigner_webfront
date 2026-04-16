import { BaseControl } from './BaseControl.js';

export class VSliderControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'vslider' });
    this.min  = config.min  ?? 0;
    this.max  = config.max  ?? 1;
    this.step = config.step ?? 0.01;
    this._padEl   = null;
    this._thumbEl = null;
    this._fillEl  = null;
    this._dispEl  = null;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control vslider-control';
    el.innerHTML = `
      <div class="control__header">
        <span class="control__label">${this.label}</span>
        <span class="control__id">${this.id}</span>
        <span class="control__value" data-val>${this._fmt(this.value)}</span>
      </div>
      <div class="vslider-control__pad" data-pad>
        <div class="vslider-control__track">
          <div class="vslider-control__fill" data-fill></div>
          <div class="vslider-control__thumb" data-thumb></div>
        </div>
        <div class="vslider-control__minmax">
          <span>${this.max}</span>
          <span>${this.min}</span>
        </div>
      </div>
    `;

    this._padEl   = el.querySelector('[data-pad]');
    this._thumbEl = el.querySelector('[data-thumb]');
    this._fillEl  = el.querySelector('[data-fill]');
    this._dispEl  = el.querySelector('[data-val]');
    this._el = el;

    this._updateThumb(this._norm(this.value));

    this._padEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._padEl.setPointerCapture(e.pointerId);
      this._onMove(e);
    });
    this._padEl.addEventListener('pointermove', (e) => {
      if (e.buttons === 0) return;
      this._onMove(e);
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? this.step : -this.step;
      const v     = Math.max(this.min, Math.min(this.max, this.value + delta));
      const snapped = Math.round(v / this.step) * this.step;
      this._emit(snapped);
      this._updateThumb(this._norm(snapped));
      this._dispEl.textContent = this._fmt(snapped);
    }, { passive: false });

    return el;
  }

  _onMove(e) {
    const rect = this._padEl.getBoundingClientRect();
    const norm  = 1 - (e.clientY - rect.top) / rect.height;
    const raw   = this.min + Math.max(0, Math.min(1, norm)) * (this.max - this.min);
    const v     = Math.round(raw / this.step) * this.step;
    this._emit(v);
    this._updateThumb(this._norm(v));
    this._dispEl.textContent = this._fmt(v);
  }

  _norm(v) {
    return (v - this.min) / (this.max - this.min);
  }

  _updateThumb(norm) {
    const pct = (Math.max(0, Math.min(1, norm)) * 100).toFixed(1);
    if (this._thumbEl) this._thumbEl.style.bottom = `${pct}%`;
    if (this._fillEl)  this._fillEl.style.height  = `${pct}%`;
  }

  _syncDOM() {
    this._updateThumb(this._norm(this.value));
    if (this._dispEl) this._dispEl.textContent = this._fmt(this.value);
  }

  _fmt(v) { return Number(v).toFixed(2); }

  toJSON() {
    return { ...super.toJSON(), min: this.min, max: this.max, step: this.step };
  }
}
