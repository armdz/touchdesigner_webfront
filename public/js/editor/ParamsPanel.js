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

  showScene(scene, { onRename, onClear, onDelete, onColorChange } = {}) {
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

    // Accent color
    const colorRow = document.createElement('div');
    colorRow.className = 'form__row';
    const colorLabel = document.createElement('label');
    colorLabel.className = 'form__label';
    colorLabel.textContent = 'Color de acento';
    const colorWrap = document.createElement('div');
    colorWrap.className = 'scene-color-row';
    const colorInput = document.createElement('input');
    colorInput.type  = 'color';
    colorInput.value = scene.color ?? '#00d4ff';
    colorInput.className = 'scene-color-input';
    const colorReset = document.createElement('button');
    colorReset.type = 'button';
    colorReset.className = 'btn btn--ghost btn--small';
    colorReset.textContent = 'Reset';
    colorInput.addEventListener('input', () => onColorChange?.(colorInput.value));
    colorReset.addEventListener('click', () => {
      colorInput.value = '#00d4ff';
      onColorChange?.('#00d4ff');
    });
    colorWrap.appendChild(colorInput);
    colorWrap.appendChild(colorReset);
    colorRow.appendChild(colorLabel);
    colorRow.appendChild(colorWrap);
    fieldsEl.appendChild(colorRow);

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
    list.className = 'pallet-colors-list';

    const emitColors = () => {
      const pickers = list.querySelectorAll('input[type="color"]');
      this.onChange?.('colors', Array.from(pickers).map(p => p.value));
    };

    const addRow = (color = '#FF0000') => {
      const row = document.createElement('div');
      row.className = 'pallet-color-row';

      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = color;
      picker.className = 'pallet-color-picker';
      picker.addEventListener('input', emitColors);

      const del = document.createElement('button');
      del.textContent = '✕';
      del.type = 'button';
      del.className = 'pallet-color-del';
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
    addBtn.className = 'pallet-color-add';
    addBtn.addEventListener('click', () => { addRow(randHex()); emitColors(); });
    container.appendChild(addBtn);
  }
}
