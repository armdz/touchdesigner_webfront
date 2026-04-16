import { BaseControl } from './BaseControl.js';

/**
 * Static text label — decorative tag/section header.
 * Displays the label text on the canvas. Sends no WebSocket messages.
 */
export class LabelControl extends BaseControl {
  constructor(config) {
    super({ ...config, type: 'label' });
  }

  render() {
    const el = document.createElement('div');
    el.className = 'control label-control';
    el.innerHTML = `
      <span class="label-control__text">${this.label}</span>
      <span class="control__id">${this.id}</span>
    `;
    this._el = el;
    return el;
  }

  // Labels are read-only — no _syncDOM, no _emit calls
}
