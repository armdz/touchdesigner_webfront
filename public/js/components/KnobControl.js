import { BaseControl } from './BaseControl.js';

// SVG constants — viewBox "0 0 60 60"
const CX = 30, CY = 30, R_TRACK = 22, R_TIP = 20, R_BASE = 8;
const START = 225, SWEEP = 270;

function pt(angleDeg, r) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function arcPath(a1, a2) {
  const [x1, y1] = pt(a1, R_TRACK);
  const [x2, y2] = pt(a2, R_TRACK);
  const span = ((a2 - a1) % 360 + 360) % 360;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R_TRACK},${R_TRACK} 0 ${span > 180 ? 1 : 0},1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

export class KnobControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'knob' });
    this.min  = config.min  ?? 0;
    this.max  = config.max  ?? 1;
    this.step = config.step ?? 0.01;
    this._fillPath   = null;
    this._ptrLine    = null;
    this._valDisplay = null;
  }

  render() {
    const trackD = arcPath(START, START + SWEEP);
    const el = document.createElement('div');
    el.className = 'control knob-control';
    el.innerHTML = `
      <div class="knob-control__wrap">
        <span class="control__id">${this.id}</span>
        <span class="knob-control__label">${this.label}</span>
        <svg class="knob-control__svg" viewBox="0 0 60 60" data-svg>
          <path class="knob-control__track" d="${trackD}"
                fill="none" stroke-width="4" stroke-linecap="round"/>
          <path class="knob-control__fill" data-fill
                fill="none" stroke-width="4" stroke-linecap="round"/>
          <line class="knob-control__pointer" data-ptr
                stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <span class="knob-control__val" data-val>${this._fmt(this.value)}</span>
      </div>
    `;

    this._fillPath   = el.querySelector('[data-fill]');
    this._ptrLine    = el.querySelector('[data-ptr]');
    this._valDisplay = el.querySelector('[data-val]');
    this._el = el;
    this._updateArc(this.value);

    const svg = el.querySelector('[data-svg]');

    svg.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startY   = e.clientY;
      const startVal = this.value;
      const range    = this.max - this.min;

      const onMove = (ev) => {
        const delta = ((startY - ev.clientY) / 150) * range;
        const raw   = Math.max(this.min, Math.min(this.max, startVal + delta));
        const v     = Math.round(raw / this.step) * this.step;
        this._emit(v);
        this._updateArc(v);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta   = e.deltaY < 0 ? this.step : -this.step;
      const raw     = Math.max(this.min, Math.min(this.max, this.value + delta));
      const v       = Math.round(raw / this.step) * this.step;
      this._emit(v);
      this._updateArc(v);
    }, { passive: false });

    return el;
  }

  _updateArc(value) {
    if (!this._fillPath) return;
    const norm  = (value - this.min) / (this.max - this.min);
    const angle = START + norm * SWEEP;

    this._fillPath.setAttribute('d', norm <= 0 ? '' : arcPath(START, angle));

    const [tx, ty] = pt(angle, R_TIP);
    const [bx, by] = pt(angle, R_BASE);
    this._ptrLine.setAttribute('x1', bx.toFixed(2));
    this._ptrLine.setAttribute('y1', by.toFixed(2));
    this._ptrLine.setAttribute('x2', tx.toFixed(2));
    this._ptrLine.setAttribute('y2', ty.toFixed(2));

    this._valDisplay.textContent = this._fmt(value);
  }

  _syncDOM() { this._updateArc(this.value); }

  _fmt(v) { return Number(v).toFixed(2); }

  toJSON() {
    return { ...super.toJSON(), min: this.min, max: this.max, step: this.step };
  }
}
