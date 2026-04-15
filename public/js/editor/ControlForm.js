import { getTypes, getTypeLabel, getSchema } from '../components/registry.js';

/**
 * ControlForm — renders a form to configure and add a new control.
 *
 * Usage:
 *   const form = new ControlForm(containerEl);
 *   form.onAdd = (config) => { ... };
 */
export class ControlForm {
  constructor(container) {
    this._container = container;
    /** @type {((config: object) => void)|null} */
    this.onAdd = null;
    this._build();
  }

  _build() {
    this._container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'form';

    // ── Type selector ──────────────────────────────────────
    const typeRow = document.createElement('div');
    typeRow.className = 'form__row';
    typeRow.innerHTML = `
      <label class="form__label">Type</label>
      <select class="form__select" id="ctrlType">
        ${getTypes().map(t => `<option value="${t}">${getTypeLabel(t)}</option>`).join('')}
      </select>
    `;
    wrap.appendChild(typeRow);

    // ── Dynamic fields ─────────────────────────────────────
    this._fieldsEl = document.createElement('div');
    this._fieldsEl.className = 'form__fields';
    wrap.appendChild(this._fieldsEl);

    // ── Submit ─────────────────────────────────────────────
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary btn--full';
    btn.textContent = '+ Add Control';
    btn.addEventListener('click', () => this._submit());
    wrap.appendChild(btn);

    this._container.appendChild(wrap);

    this._typeSelect = wrap.querySelector('#ctrlType');
    this._typeSelect.addEventListener('change', () => this._renderFields());
    this._renderFields();
  }

  _renderFields() {
    const schema = getSchema(this._typeSelect.value);
    this._fieldsEl.innerHTML = schema.map(field => `
      <div class="form__row">
        <label class="form__label">${field.label}${field.required ? ' *' : ''}</label>
        <input class="form__input"
               type="${field.inputType}"
               name="${field.key}"
               placeholder="${field.placeholder ?? ''}"
               value="${field.default ?? ''}"
               ${field.required ? 'required' : ''} />
      </div>
    `).join('');
  }

  _submit() {
    const type   = this._typeSelect.value;
    const schema = getSchema(type);
    const config = { type };
    let valid = true;

    for (const field of schema) {
      const input = this._fieldsEl.querySelector(`[name="${field.key}"]`);
      if (!input) continue;
      const raw = input.value.trim();

      if (field.required && !raw) {
        input.classList.add('form__input--error');
        valid = false;
        continue;
      }
      input.classList.remove('form__input--error');

      if (field.inputType === 'number') {
        config[field.key] = parseFloat(raw !== '' ? raw : field.default ?? 0);
      } else {
        config[field.key] = raw || (field.key === 'label' ? config.id : '');
      }
    }

    if (!valid) return;

    // Default label to id if left blank
    if (!config.label) config.label = config.id;

    this.onAdd?.(config);
    this._renderFields(); // reset
  }
}
