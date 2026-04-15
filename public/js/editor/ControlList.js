import { createControl } from '../components/registry.js';

/**
 * ControlList — manages the ordered list of controls in the editor.
 * Renders each one as a card with a live (non-interactive) preview and a delete button.
 *
 * Usage:
 *   const list = new ControlList(containerEl);
 *   list.onChange = (controls) => { ... };
 *   list.add(config);
 */
export class ControlList {
  constructor(container) {
    this._container = container;
    /** @type {object[]} */
    this._controls = [];
    /** @type {((controls: object[]) => void)|null} */
    this.onChange = null;
    this._render();
  }

  /** Add a control. Rejects duplicate IDs. */
  add(config) {
    if (this._controls.some(c => c.id === config.id)) {
      alert(`A control with ID "${config.id}" already exists.`);
      return false;
    }
    this._controls.push(config);
    this._render();
    this.onChange?.(this._controls);
    return true;
  }

  /** Remove control by ID */
  remove(id) {
    this._controls = this._controls.filter(c => c.id !== id);
    this._render();
    this.onChange?.(this._controls);
  }

  /** Replace the full list (used when loading from JSON) */
  load(controls) {
    this._controls = [...controls];
    this._render();
  }

  /** Returns a shallow copy of the current config array */
  getAll() { return [...this._controls]; }

  // ── Private ──────────────────────────────────────────────

  _render() {
    this._container.innerHTML = '';

    if (this._controls.length === 0) {
      this._container.innerHTML =
        '<p class="list__empty">No controls yet — add one on the left.</p>';
      return;
    }

    for (const config of this._controls) {
      this._container.appendChild(this._buildCard(config));
    }
  }

  _buildCard(config) {
    const card = document.createElement('div');
    card.className = 'control-card';

    // Header
    const header = document.createElement('div');
    header.className = 'control-card__header';
    header.innerHTML = `
      <span class="control-card__type">${config.type}</span>
      <span class="control-card__id">${config.id}</span>
    `;
    const del = document.createElement('button');
    del.className = 'btn btn--ghost btn--icon';
    del.textContent = '✕';
    del.title = 'Remove';
    del.addEventListener('click', () => this.remove(config.id));
    header.appendChild(del);
    card.appendChild(header);

    // Preview (non-interactive — CSS disables pointer-events)
    const preview = document.createElement('div');
    preview.className = 'control-card__preview';
    try {
      preview.appendChild(createControl(config).render());
    } catch {
      preview.textContent = 'Preview unavailable';
    }
    card.appendChild(preview);

    return card;
  }
}
