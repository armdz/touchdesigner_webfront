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

  showScene(scene, { onRename, onClear, onDelete } = {}) {
    this._fields.clear();
    this._container.innerHTML = `
      <p class="params__title">Scene</p>
      <div class="params__fields" id="pFields"></div>
      <div class="params__footer"></div>
    `;
    const fieldsEl = this._container.querySelector('#pFields');
    const footer   = this._container.querySelector('.params__footer');

    // Name
    const nameRow = document.createElement('div');
    nameRow.className = 'form__row';
    const nameLabel = document.createElement('label');
    nameLabel.className = 'form__label';
    nameLabel.textContent = 'Nombre';
    const nameInput = document.createElement('input');
    nameInput.className = 'form__input';
    nameInput.type  = 'text';
    nameInput.value = scene.name;
    nameInput.addEventListener('input', () => {
      const v = nameInput.value.trim();
      if (v) onRename?.(v);
    });
    nameRow.appendChild(nameLabel);
    nameRow.appendChild(nameInput);
    fieldsEl.appendChild(nameRow);

    // Clear
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn--ghost btn--full btn--danger';
    clearBtn.textContent = 'Borrar todos los controles';
    clearBtn.addEventListener('click', () => {
      if (!confirm(`¿Borrar todos los controles de "${scene.name}"?`)) return;
      onClear?.();
    });
    footer.appendChild(clearBtn);

    // Delete scene
    if (onDelete) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn--ghost btn--full';
      delBtn.style.marginTop = '6px';
      delBtn.textContent = 'Eliminar escena';
      delBtn.addEventListener('click', () => onDelete?.());
      footer.appendChild(delBtn);
    }
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
          if (String(opt) === String(val)) o.selected = true;
          inputEl.appendChild(o);
        }
      } else if (field.inputType === 'checkbox') {
        inputEl = document.createElement('input');
        inputEl.className = 'form__checkbox';
        inputEl.type    = 'checkbox';
        inputEl.checked = !!val;
        row.classList.add('form__row--checkbox');
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
          let v;
          if (field.inputType === 'checkbox') v = inputEl.checked;
          else if (field.inputType === 'number') v = parseFloat(inputEl.value);
          else v = inputEl.value;

          this.onChange?.(field.key, v);

          if (field.key === 'label') {
            const newId = labelToId(v);
            this.onChange?.('id', newId);
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

    if (config.type === 'pallet') {
      this._renderPalletColors(fieldsEl, config);
    }

    this._container.querySelector('#btnDelete')
      .addEventListener('click', () => this.onDelete?.());
  }

  _renderPalletColors(container, config) {
    const colors = Array.isArray(config.colors) ? [...config.colors] : ['#FF0000'];

    const label = document.createElement('label');
    label.className = 'form__label';
    label.textContent = 'Colors';
    container.appendChild(label);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex; flex-direction:column; gap:6px; margin-top:4px;';

    const emitColors = () => {
      const pickers = list.querySelectorAll('input[type="color"]');
      const updated = Array.from(pickers).map(p => p.value);
      this.onChange?.('colors', updated);
    };

    const addRow = (color = '#FF0000') => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; gap:6px; align-items:center;';

      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = color;
      picker.style.cssText = 'width:40px; height:32px; cursor:pointer; border:1px solid #555; flex-shrink:0;';
      picker.addEventListener('input', emitColors);

      const del = document.createElement('button');
      del.textContent = '✕';
      del.type = 'button';
      del.style.cssText = 'padding:4px 10px; background:#444; color:#fff; border:none; cursor:pointer; font-size:12px;';
      del.addEventListener('click', () => {
        if (list.children.length > 1) { row.remove(); emitColors(); }
      });

      row.appendChild(picker);
      row.appendChild(del);
      list.appendChild(row);
    };

    colors.forEach(c => addRow(c));
    container.appendChild(list);

    const randHex = () => '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');

    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Color';
    addBtn.type = 'button';
    addBtn.style.cssText = 'margin-top:6px; padding:6px 12px; background:#444; color:#fff; border:none; cursor:pointer; font-size:12px;';
    addBtn.addEventListener('click', () => { addRow(randHex()); emitColors(); });
    container.appendChild(addBtn);
  }
}
