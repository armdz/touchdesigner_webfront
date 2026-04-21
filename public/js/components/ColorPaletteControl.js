import { BaseControl } from './BaseControl.js';

/**
 * Color palette — displays a grid of color buttons.
 * Each button is tinted with its color and sends the hex value on click.
 */
export class ColorPaletteControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'colorPalette' });
    this.colors = config.colors ?? ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control color-palette-control';
    el.innerHTML = `
      <div class="control__header">
        <span class="control__label">${this.label}</span>
        <span class="control__id">${this.id}</span>
      </div>
      <div class="color-palette-control__body">
        ${this.colors.map(color => `
          <button class="color-palette-control__btn"
                  style="background-color: ${color};"
                  data-color="${color}"
                  title="${color}">
          </button>
        `).join('')}
      </div>
    `;

    const buttons = el.querySelectorAll('.color-palette-control__btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = btn.getAttribute('data-color');
        this._onChange?.({ id: this.id, value: color });
      });
    });

    this._el = el;
    return el;
  }

  toJSON() {
    return { ...super.toJSON(), colors: this.colors };
  }
}
