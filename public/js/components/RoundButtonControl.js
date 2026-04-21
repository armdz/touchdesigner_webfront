import { BaseControl } from './BaseControl.js';

export class RoundButtonControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'roundbutton' });
    this.text      = config.text || config.label;
    this.isToggle  = config.isToggle ?? false;
    this.toggleValue = 0;
    this._btn = null;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control roundbtn-control';
    el.innerHTML = `
      <span class="control__id">${this.id}</span>
      <button class="roundbtn-control__btn">
        <span class="roundbtn-control__text">${this.text}</span>
      </button>
    `;

    const btn = el.querySelector('.roundbtn-control__btn');

    if (this.isToggle) {
      if (this.toggleValue) btn.classList.add('roundbtn-control__btn--active');
      btn.addEventListener('click', () => {
        this.toggleValue = this.toggleValue ? 0 : 1;
        btn.classList.toggle('roundbtn-control__btn--active');
        this._onChange?.({ id: this.id, value: this.toggleValue });
      });
    } else {
      btn.addEventListener('mousedown',  () => this._emit(1));
      btn.addEventListener('mouseup',    () => this._emit(0));
      btn.addEventListener('mouseleave', () => this._emit(0));
    }

    this._el  = el;
    this._btn = btn;
    return el;
  }

  _syncDOM() {
    if (this._btn && this.isToggle)
      this._btn.classList.toggle('roundbtn-control__btn--active', !!this.toggleValue);
  }

  toJSON() {
    return { ...super.toJSON(), text: this.text, isToggle: this.isToggle };
  }
}
