import { BaseControl } from './BaseControl.js';

export class SliderControl extends BaseControl {
  /**
   * @param {object} config
   * @param {number} [config.min=0]
   * @param {number} [config.max=1]
   * @param {number} [config.step=0.01]
   */
  constructor(config) {
    super({ ...config, type: 'slider' });
    this.min  = config.min  ?? 0;
    this.max  = config.max  ?? 1;
    this.step = config.step ?? 0.01;

    /** @type {HTMLInputElement|null} */
    this._input   = null;
    /** @type {HTMLElement|null} */
    this._display = null;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control slider-control';
    el.innerHTML = `
      <div class="control__header">
        <span class="control__label">${this.label}</span>
        <span class="control__id">${this.id}</span>
        <span class="control__value" data-value>${this._fmt(this.value)}</span>
      </div>
      <div class="control__body">
        <span class="control__min">${this.min}</span>
        <input class="slider-control__input" type="range"
               min="${this.min}" max="${this.max}"
               step="${this.step}" value="${this.value}" />
        <span class="control__max">${this.max}</span>
      </div>
    `;

    this._input   = el.querySelector('input');
    this._display = el.querySelector('[data-value]');
    this._el      = el;

    this._input.addEventListener('input', () => {
      const v = parseFloat(this._input.value);
      this._display.textContent = this._fmt(v);
      this._emit(v);
    });

    return el;
  }

  _syncDOM() {
    if (!this._input) return;
    this._input.value         = this.value;
    this._display.textContent = this._fmt(this.value);
  }

  _fmt(v) {
    return Number(v).toFixed(2);
  }

  toJSON() {
    return { ...super.toJSON(), min: this.min, max: this.max, step: this.step };
  }
}
