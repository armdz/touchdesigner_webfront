import { getTypes, getTypeLabel } from '../components/registry.js';

const ICONS = {
  slider: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>`,
  button: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="8" width="18" height="8" rx="2"/>
  </svg>`,
  input: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="7" width="18" height="10" rx="2"/>
    <line x1="7" y1="12" x2="11" y2="12"/>
    <line x1="11" y1="9" x2="11" y2="15"/>
  </svg>`,
};

export class Palette {
  constructor(container) {
    this._container = container;
    this._build();
  }

  _build() {
    this._container.innerHTML = '<p class="palette__title">Components</p>';

    for (const type of getTypes()) {
      const item = document.createElement('div');
      item.className    = 'palette-item';
      item.draggable    = true;
      item.dataset.type = type;
      item.innerHTML    = `
        <span class="palette-item__icon">${ICONS[type] ?? ''}</span>
        <span class="palette-item__label">${getTypeLabel(type)}</span>
      `;
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', type);
        e.dataTransfer.effectAllowed = 'copy';
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      this._container.appendChild(item);
    }
  }
}
