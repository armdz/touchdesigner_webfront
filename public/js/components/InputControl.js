import { BaseControl } from './BaseControl.js';

/**
 * Text / number input field.
 * Sends value on blur/enter.
 */
export class InputControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'input' });
    this.placeholder = config.placeholder ?? 'Type here…';
    this.fieldType   = config.fieldType   ?? 'text';
    this.defaultValue = config.defaultValue ?? null;
    if (this.defaultValue !== null && this.defaultValue !== '') {
      this.value = this.defaultValue;
    }
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control input-control';
    el.innerHTML = `
      <div class="control__header">
        <span class="control__label">${this.label}</span>
        <span class="control__id">${this.id}</span>
      </div>
      <div class="control__body">
        <input class="input-control__field"
               type="${this.fieldType}"
               placeholder="${this.placeholder}"
               value="${this.value ?? ''}" />
      </div>
    `;

    const input = el.querySelector('.input-control__field');
    const emit  = () => {
      const v = this.fieldType === 'number' ? parseFloat(input.value) : input.value;
      this._emit(v);
    };
    input.addEventListener('change', emit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') emit(); });

    this._el    = el;
    this._input = input;
    return el;
  }

  _syncDOM() {
    if (this._input) this._input.value = this.value ?? '';
  }

  toJSON() {
    return { ...super.toJSON(), placeholder: this.placeholder, fieldType: this.fieldType, defaultValue: this.defaultValue };
  }
}
