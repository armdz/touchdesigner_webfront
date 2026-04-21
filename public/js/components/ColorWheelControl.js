import { BaseControl } from './BaseControl.js';

const TWO_PI  = Math.PI * 2;
const WHEEL_D = 130;   // wheel canvas diameter (px)
const VBAR_W  = 18;    // brightness bar width
const VBAR_H  = 130;   // brightness bar height

function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r, g, b;
  if      (h < 60)  [r,g,b] = [c,x,0];
  else if (h < 120) [r,g,b] = [x,c,0];
  else if (h < 180) [r,g,b] = [0,c,x];
  else if (h < 240) [r,g,b] = [0,x,c];
  else if (h < 300) [r,g,b] = [x,0,c];
  else              [r,g,b] = [c,0,x];
  return [r + m, g + m, b + m];
}

function hexToHsv(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let h = 0;
  if (d) {
    if      (max === r) h = ((g - b) / d + 6) % 6 * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else                h = ((r - g) / d + 4) * 60;
  }
  return [h, max ? d / max : 0, max];
}

function toHex(r, g, b) {
  return '#' + [r,g,b].map(c => Math.round(c * 255).toString(16).padStart(2,'0')).join('');
}

export class ColorWheelControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'colorwheel' });
    const hex = /^#[0-9a-fA-F]{6}$/.test(config.value) ? config.value : '#00d4ff';
    [this._h, this._s, this._v] = hexToHsv(hex);
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control colorwheel-control';
    el.innerHTML = `
      <div class="control__header">
        <span class="control__label">${this.label}</span>
        <span class="control__id">${this.id}</span>
      </div>
      <div class="colorwheel-control__body">
        <canvas class="colorwheel-control__canvas"
                width="${WHEEL_D}" height="${WHEEL_D}"></canvas>
        <div class="colorwheel-control__sidebar">
          <canvas class="colorwheel-control__vbar"
                  width="${VBAR_W}" height="${VBAR_H}"></canvas>
          <div class="colorwheel-control__swatch"></div>
        </div>
      </div>
    `;

    this._el      = el;
    this._wcanvas = el.querySelector('.colorwheel-control__canvas');
    this._vcanvas = el.querySelector('.colorwheel-control__vbar');
    this._swatch  = el.querySelector('.colorwheel-control__swatch');

    this._drawWheel();
    this._drawVBar();
    this._updateSwatch();
    this._setupInteraction();
    return el;
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  _drawWheel() {
    const ctx  = this._wcanvas.getContext('2d');
    const size = WHEEL_D;
    const cx   = size / 2, cy = size / 2, r = size / 2 - 1;
    const img  = ctx.createImageData(size, size);

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx = px - cx, dy = py - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > r) continue;
        const h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        const s = dist / r;
        const [rr, gg, bb] = hsvToRgb(h, s, this._v);
        const i = (py * size + px) * 4;
        img.data[i]   = rr * 255;
        img.data[i+1] = gg * 255;
        img.data[i+2] = bb * 255;
        img.data[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Selector dot
    const sx = cx + Math.cos(this._h * Math.PI / 180) * this._s * r;
    const sy = cy + Math.sin(this._h * Math.PI / 180) * this._s * r;
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, TWO_PI);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, TWO_PI);
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.stroke();
  }

  _drawVBar() {
    const ctx  = this._vcanvas.getContext('2d');
    const [rr, gg, bb] = hsvToRgb(this._h, Math.max(this._s, 0.01), 1);
    const top  = `rgb(${Math.round(rr*255)},${Math.round(gg*255)},${Math.round(bb*255)})`;
    const grad = ctx.createLinearGradient(0, 0, 0, VBAR_H);
    grad.addColorStop(0, top);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VBAR_W, VBAR_H);

    const iy = (1 - this._v) * VBAR_H;
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillRect(0, iy - 2, VBAR_W, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, iy - 1, VBAR_W, 2);
  }

  _updateSwatch() {
    const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
    this._swatch.style.background = toHex(r, g, b);
  }

  // ── Output ─────────────────────────────────────────────────────────────────

  _emitChannels() {
    const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
    this._onChange?.({ id: this.id + '_r', value: parseFloat(r.toFixed(4)) });
    this._onChange?.({ id: this.id + '_g', value: parseFloat(g.toFixed(4)) });
    this._onChange?.({ id: this.id + '_b', value: parseFloat(b.toFixed(4)) });
  }

  // ── Interaction ────────────────────────────────────────────────────────────

  _setupInteraction() {
    const r = WHEEL_D / 2 - 1;
    const cx = WHEEL_D / 2, cy = WHEEL_D / 2;

    const onWheel = (e) => {
      const rect = this._wcanvas.getBoundingClientRect();
      const cl   = e.touches?.[0] ?? e;
      const dx   = cl.clientX - rect.left - cx;
      const dy   = cl.clientY - rect.top  - cy;
      this._h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      this._s = Math.min(1, Math.sqrt(dx*dx + dy*dy) / r);
      this._drawWheel(); this._drawVBar(); this._updateSwatch(); this._emitChannels();
    };

    const onVBar = (e) => {
      const rect = this._vcanvas.getBoundingClientRect();
      const cl   = e.touches?.[0] ?? e;
      this._v = Math.max(0, Math.min(1, 1 - (cl.clientY - rect.top) / VBAR_H));
      this._drawWheel(); this._drawVBar(); this._updateSwatch(); this._emitChannels();
    };

    const drag = (canvas, handler) => {
      canvas.addEventListener('mousedown', (e) => {
        handler(e);
        const move = (e) => handler(e);
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', () => document.removeEventListener('mousemove', move), { once: true });
      });
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handler(e); }, { passive: false });
      canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); handler(e); }, { passive: false });
    };

    drag(this._wcanvas, onWheel);
    drag(this._vcanvas, onVBar);
  }

  // ── Serialization ──────────────────────────────────────────────────────────

  toJSON() {
    const [r,g,b] = hsvToRgb(this._h, this._s, this._v);
    return { ...super.toJSON(), value: toHex(r, g, b) };
  }
}
