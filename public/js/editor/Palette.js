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
  toggle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="2" y="8" width="20" height="8" rx="4"/>
    <circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>`,
  color: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none"/>
  </svg>`,
  xypad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke-width="1" opacity=".5"/>
    <line x1="12" y1="3" x2="12" y2="21" stroke-width="1" opacity=".5"/>
    <circle cx="15" cy="9" r="2.5" fill="currentColor" stroke="none"/>
  </svg>`,
  knob: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="12" x2="12" y2="5" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,
  label: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="4" y1="8" x2="20" y2="8"/>
    <line x1="4" y1="14" x2="13" y2="14"/>
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
