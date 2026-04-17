import { BaseControl } from './BaseControl.js';

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

export class ColorPalletControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'pallet' });
    this.colors = Array.isArray(config.colors)
      ? config.colors
      : (typeof config.colors === 'string'
        ? config.colors.split(',').map(c => c.trim())
        : ['#FF0000']);
    this.selectedIndex = 0;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control color-pallet-control';

    const colorSwatches = this.colors.map((color, idx) => `
      <div class="color-pallet__swatch"
           data-swatch="${idx}"
           style="background:${color}"
           title="${color}"></div>
    `).join('');

    el.innerHTML = colorSwatches;

    this._el = el;
    const swatches = el.querySelectorAll('.color-pallet__swatch');
    swatches.forEach((swatch, idx) => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.selectedIndex = idx;
        this._emitColor(this.colors[idx]);
      });
    });

    swatches[this.selectedIndex]?.classList.add('active');
    setTimeout(() => this._emitColor(this.colors[this.selectedIndex]), 0);
    return el;
  }

  _emitColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    this._onChange?.({ id: this.id + '_r', value: parseFloat(r.toFixed(4)) });
    this._onChange?.({ id: this.id + '_g', value: parseFloat(g.toFixed(4)) });
    this._onChange?.({ id: this.id + '_b', value: parseFloat(b.toFixed(4)) });
  }

  toJSON() {
    return { ...super.toJSON(), colors: this.colors };
  }
}
