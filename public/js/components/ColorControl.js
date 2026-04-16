import { BaseControl } from './BaseControl.js';

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function rgbToHex(r, g, b) {
  const toByte = (v) => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

export class ColorControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'color' });
    this.value = /^#[0-9a-fA-F]{6}$/.test(config.value) ? config.value : '#00d4ff';
    this.alpha = config.alpha ?? 1;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control color-control';
    el.innerHTML = `
      <div class="control__header">
        <span class="control__label">${this.label}</span>
        <span class="control__id">${this.id}</span>
      </div>
      <div class="color-control__body">
        <div class="color-control__swatch" data-swatch style="background:${this.value}">
          <input type="color" class="color-control__native" value="${this.value}" tabindex="-1" />
        </div>
        <div class="color-control__inputs">
          <input type="text" class="color-control__hex" value="${this.value}"
                 maxlength="7" spellcheck="false" />
          <div class="color-control__alpha-row">
            <span class="color-control__alpha-label">A</span>
            <input type="range" class="color-control__alpha-range"
                   min="0" max="1" step="0.01" value="${this.alpha}" />
            <span class="color-control__alpha-val" data-aval>${this.alpha.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

    const swatch   = el.querySelector('[data-swatch]');
    const native   = el.querySelector('.color-control__native');
    const hexInput = el.querySelector('.color-control__hex');
    const alphaRng = el.querySelector('.color-control__alpha-range');
    const alphaVal = el.querySelector('[data-aval]');
    this._el = el;

    const update = (hex) => {
      this.value = hex;
      swatch.style.background = hex;
      native.value   = hex;
      hexInput.value = hex;
      this._emitChannels();
    };

    swatch.addEventListener('click', (e) => {
      if (e.target !== native) native.click();
    });
    native.addEventListener('input', () => update(native.value));
    hexInput.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) update(hexInput.value);
    });
    alphaRng.addEventListener('input', () => {
      this.alpha = parseFloat(alphaRng.value);
      alphaVal.textContent = this.alpha.toFixed(2);
      this._emitChannels();
    });

    return el;
  }

  _emitChannels() {
    const { r, g, b } = hexToRgb(this.value);
    this._onChange?.({ id: this.id + '_r', value: parseFloat(r.toFixed(4)) });
    this._onChange?.({ id: this.id + '_g', value: parseFloat(g.toFixed(4)) });
    this._onChange?.({ id: this.id + '_b', value: parseFloat(b.toFixed(4)) });
    this._onChange?.({ id: this.id + '_a', value: parseFloat(this.alpha.toFixed(4)) });
  }

  /** Called by Renderer when live values arrive for e.g. "color_1_r" */
  setChannelValue(channel, value) {
    const num = parseFloat(value);
    if (channel === 'a') {
      this.alpha = isNaN(num) ? 1 : Math.max(0, Math.min(1, num));
      if (this._el) {
        this._el.querySelector('.color-control__alpha-range').value = this.alpha;
        this._el.querySelector('[data-aval]').textContent = this.alpha.toFixed(2);
      }
      return;
    }
    if (channel === 'r' || channel === 'g' || channel === 'b') {
      const ch = hexToRgb(this.value);
      ch[channel] = isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
      this.value = rgbToHex(ch.r, ch.g, ch.b);
      this._syncDOM();
    }
  }

  _syncDOM() {
    if (!this._el) return;
    this._el.querySelector('[data-swatch]').style.background      = this.value;
    this._el.querySelector('.color-control__native').value        = this.value;
    this._el.querySelector('.color-control__hex').value           = this.value;
  }

  toJSON() {
    return { ...super.toJSON(), alpha: this.alpha };
  }
}
