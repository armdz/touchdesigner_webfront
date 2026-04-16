import { BaseControl } from './BaseControl.js';

export class ToggleControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'toggle' });
    this.value     = +config.value ? 1 : 0;
    this._switchEl = null;
  }

  render() {
    const on = !!this.value;
    const el = document.createElement('div');
    el.className = 'control toggle-control';
    el.innerHTML = `
      <div class="control__header">
        <span class="control__label">${this.label}</span>
        <span class="control__id">${this.id}</span>
      </div>
      <div class="control__body">
        <div class="toggle-control__switch${on ? ' toggle-control__switch--on' : ''}" data-switch>
          <div class="toggle-control__thumb"></div>
        </div>
      </div>
    `;

    this._switchEl = el.querySelector('[data-switch]');
    this._el = el;

    this._switchEl.addEventListener('click', () => {
      this._emit(this.value ? 0 : 1);
      this._switchEl.classList.toggle('toggle-control__switch--on', !!this.value);
    });

    return el;
  }

  _syncDOM() {
    if (!this._switchEl) return;
    this._switchEl.classList.toggle('toggle-control__switch--on', !!this.value);
  }
}
