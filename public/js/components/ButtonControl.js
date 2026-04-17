import { BaseControl } from './BaseControl.js';

/**
 * Momentary button — sends 1 on press, 0 on release.
 * Can be toggled to act as a toggle button.
 * Fills the entire card — no header, just the button with label + id overlay.
 */
export class ButtonControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'button' });
    this.text = config.text || config.label;
    this.isToggle = config.isToggle ?? false;
    this.toggleValue = 0;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control button-control';
    el.innerHTML = `
      <button class="button-control__btn">
        <span class="button-control__text">${this.text}</span>
        <span class="control__id">${this.id}</span>
      </button>
    `;

    const btn = el.querySelector('.button-control__btn');

    if (this.isToggle) {
      if (this.toggleValue) btn.classList.add('button-control__btn--active');
      btn.addEventListener('click', () => {
        this.toggleValue = this.toggleValue ? 0 : 1;
        btn.classList.toggle('button-control__btn--active');
        this._onChange?.({ id: this.id, value: this.toggleValue });
      });
    } else {
      btn.addEventListener('mousedown',  () => this._emit(1));
      btn.addEventListener('mouseup',    () => this._emit(0));
      btn.addEventListener('mouseleave', () => this._emit(0));
    }

    this._el = el;
    this._btn = btn;
    return el;
  }

  _syncDOM() {
    if (this._btn && this.isToggle) {
      if (this.toggleValue) {
        this._btn.classList.add('button-control__btn--active');
      } else {
        this._btn.classList.remove('button-control__btn--active');
      }
    }
  }

  toJSON() {
    return { ...super.toJSON(), text: this.text, isToggle: this.isToggle };
  }
}
