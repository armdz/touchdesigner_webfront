import { getEntry }  from '../components/registry.js';
import { labelToId } from '../shared/utils.js';

/**
 * ParamsPanel — right sidebar for editing the selected component's parameters.
 *
 * Callbacks:
 *   onChange(key, value)  — a field was edited
 *   onDelete()            — delete button clicked
 */
export class ParamsPanel {
  constructor(container) {
    this._container = container;
    this._fields    = new Map(); // key → input/select element
    this.onChange   = null;
    this.onDelete   = null;
    this._renderEmpty();
  }

  show(config) {
    this._config = config;
    this._render(config);
  }

  hide() {
    this._config = null;
    this._renderEmpty();
  }

  /** Programmatically update a field display (e.g. after ID auto-adjust) */
  updateField(key, value) {
    const el = this._fields.get(key);
    if (el) el.value = value;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  _renderEmpty() {
    this._fields.clear();
    this._container.innerHTML =
      '<p class="params__empty">Select a component<br>to edit its parameters.</p>';
  }

  _render(config) {
    const entry = getEntry(config.type);
    if (!entry) return this._renderEmpty();

    this._fields.clear();
    this._container.innerHTML = `
      <p class="params__title">${entry.label}</p>
      <div class="params__fields" id="pFields"></div>
      <div class="params__footer">
        <button class="btn btn--ghost btn--full btn--danger" id="btnDelete">Delete component</button>
      </div>
    `;

    const fieldsEl = this._container.querySelector('#pFields');

    for (const field of entry.schema) {
      const row = document.createElement('div');
      row.className = 'form__row';

      const isReadonly = field.readonly === true;
      const val        = config[field.key] ?? field.default ?? '';

      let inputEl;

      if (field.inputType === 'select') {
        inputEl = document.createElement('select');
        inputEl.className = 'form__select';
        for (const opt of field.options ?? []) {
          const o = document.createElement('option');
          o.value = opt; o.textContent = opt;
          if (opt === val) o.selected = true;
          inputEl.appendChild(o);
        }
      } else {
        inputEl = document.createElement('input');
        inputEl.className = `form__input${isReadonly ? ' form__input--readonly' : ''}`;
        inputEl.type  = field.inputType;
        inputEl.value = val;
        if (isReadonly) inputEl.readOnly = true;
      }

      inputEl.name = field.key;

      if (!isReadonly) {
        inputEl.addEventListener('input', () => {
          let v = inputEl.value;
          if (field.inputType === 'number') v = parseFloat(v);
          this.onChange?.(field.key, v);

          // Auto-derive ID from label
          if (field.key === 'label') {
            const newId = labelToId(v);
            this.onChange?.('id', newId);
            // Display will be updated via updateField() after collision check
          }
        });
      }

      const label = document.createElement('label');
      label.className   = 'form__label';
      label.textContent = field.label;

      row.appendChild(label);
      row.appendChild(inputEl);
      fieldsEl.appendChild(row);
      this._fields.set(field.key, inputEl);
    }

    this._container.querySelector('#btnDelete')
      .addEventListener('click', () => this.onDelete?.());
  }
}
