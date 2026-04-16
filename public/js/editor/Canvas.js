import { getEntry }                   from '../components/registry.js';
import { labelToId, uniqueId, snap }  from '../shared/utils.js';

const GRID = 20;

export class Canvas {
  constructor(container) {
    this._el       = container;
    this._items    = [];
    this._selected = null;

    this.onSelect     = null;
    this.onChange     = null;
    this.onIdAdjusted = null;

    this._setupDrop();
    this._setupDeselect();
    this._setupDeleteKey();
  }

  // ── Public API ──────────────────────────────────────────────────────────

  load(controls) {
    this._el.querySelectorAll('.canvas-item').forEach(e => e.remove());
    this._items    = [];
    this._selected = null;
    this.onSelect?.(null);

    for (const ctrl of controls) {
      const item = { config: { ...ctrl }, x: ctrl.x ?? 0, y: ctrl.y ?? 0, el: null };
      this._items.push(item);
      item.el = this._renderItem(item);
    }
  }

  getControls() { return this._export(); }

  updateSelected(key, value) {
    if (!this._selected) return;

    if (key === 'id') {
      const otherIds = this._items
        .filter(i => i !== this._selected)
        .map(i => i.config.id);
      value = uniqueId(String(value), otherIds);
      if (value !== this._selected.config.id) this.onIdAdjusted?.(value);
    }

    this._selected.config[key] = value;

    // Resize canvas-item if size depends on config (e.g. slider orientation)
    const entry = getEntry(this._selected.config.type);
    if (entry?.sizeOf) {
      const { w, h } = entry.sizeOf(this._selected.config);
      this._selected.el.style.width  = `${w}px`;
      this._selected.el.style.height = `${h}px`;
    }

    this._refreshPreview(this._selected);
    this.onChange?.(this._export());
  }

  deleteSelected() {
    if (!this._selected) return;
    this._selected.el.remove();
    this._items    = this._items.filter(i => i !== this._selected);
    this._selected = null;
    this.onSelect?.(null);
    this.onChange?.(this._export());
  }

  // ── Delete key ──────────────────────────────────────────────────────────

  _setupDeleteKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      this.deleteSelected();
    });
  }

  // ── Drop from palette ───────────────────────────────────────────────────

  _setupDrop() {
    this._el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    this._el.addEventListener('drop', (e) => {
      e.preventDefault();
      const type  = e.dataTransfer.getData('text/plain');
      const entry = getEntry(type);
      if (!entry) return;

      const rect         = this._el.getBoundingClientRect();
      const defaultConfig = { type, ...entry.defaults };
      const { w, h }     = entry.sizeOf?.(defaultConfig) ?? entry.size;
      const x = Math.max(0, snap(e.clientX - rect.left - w / 2 + this._el.scrollLeft, GRID));
      const y = Math.max(0, snap(e.clientY - rect.top  - h / 2 + this._el.scrollTop,  GRID));
      this._addItem(type, x, y);
    });
  }

  _setupDeselect() {
    this._el.addEventListener('click', (e) => {
      if (e.target === this._el) this._select(null);
    });
  }

  // ── Item lifecycle ──────────────────────────────────────────────────────

  _addItem(type, x, y) {
    const entry  = getEntry(type);
    const baseId = labelToId(entry.label);
    const id     = uniqueId(baseId, this._items.map(i => i.config.id));
    const config = { type, id, label: entry.label, x, y, ...entry.defaults };
    const item   = { config, x, y, el: null };
    this._items.push(item);
    item.el = this._renderItem(item);
    this._select(item);
    this.onChange?.(this._export());
  }

  _sizeOf(config) {
    const entry = getEntry(config.type);
    return entry?.sizeOf?.(config) ?? entry?.size ?? { w: 140, h: 80 };
  }

  _renderItem(item) {
    const { w, h } = this._sizeOf(item.config);

    const el = document.createElement('div');
    el.className = 'canvas-item';
    el.style.cssText = `left:${item.x}px; top:${item.y}px; width:${w}px; height:${h}px;`;

    const preview = document.createElement('div');
    preview.className = 'canvas-item__preview';
    el.appendChild(preview);

    item.el = el;
    this._refreshPreview(item);

    el.addEventListener('click',     (e) => { e.stopPropagation(); this._select(item); });
    this._makeDraggable(el, item);

    this._el.appendChild(el);
    return el;
  }

  _refreshPreview(item) {
    const entry   = getEntry(item.config.type);
    const preview = item.el?.querySelector('.canvas-item__preview');
    if (!preview) return;
    preview.innerHTML = '';
    try { preview.appendChild(new entry.Class(item.config).render()); } catch { /* ignore */ }
  }

  _select(item) {
    this._selected?.el?.classList.remove('selected');
    this._selected = item;
    item?.el?.classList.add('selected');
    this.onSelect?.(item?.config ?? null);
  }

  _makeDraggable(el, item) {
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const ox = e.clientX, oy = e.clientY, sx = item.x, sy = item.y;

      const onMove = (e) => {
        item.x = Math.max(0, snap(sx + e.clientX - ox, GRID));
        item.y = Math.max(0, snap(sy + e.clientY - oy, GRID));
        el.style.left = `${item.x}px`;
        el.style.top  = `${item.y}px`;
        item.config.x = item.x;
        item.config.y = item.y;
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
        this.onChange?.(this._export());
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  _export() {
    return this._items.map(({ config, x, y }) => ({ ...config, x, y }));
  }
}
