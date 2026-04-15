/**
 * SceneNav — horizontal scene selector for viewer and preview.
 * Hidden automatically when there is only one scene.
 *
 * Callback:
 *   onSceneChange(scene, index)
 */
export class SceneNav {
  constructor(container) {
    this._container = container;
    this._scenes    = [];
    this._idx       = 0;
    this.onSceneChange = null;
  }

  load(scenes, activeIdx = 0) {
    this._scenes = scenes;
    this._idx    = activeIdx;
    this._render();
  }

  _render() {
    this._container.innerHTML = '';
    const single = this._scenes.length <= 1;
    this._container.style.display = single ? 'none' : 'flex';
    if (single) return;

    for (let i = 0; i < this._scenes.length; i++) {
      const btn = document.createElement('button');
      btn.className   = `scene-btn${i === this._idx ? ' scene-btn--active' : ''}`;
      btn.textContent = this._scenes[i].name;
      btn.addEventListener('click', () => {
        this._idx = i;
        this._render();
        this.onSceneChange?.(this._scenes[i], i);
      });
      this._container.appendChild(btn);
    }
  }
}
