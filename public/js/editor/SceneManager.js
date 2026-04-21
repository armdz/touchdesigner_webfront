export class SceneManager {
  constructor(container) {
    this._container = container;
    this._scenes    = [{ id: _uid(), name: 'Scene 1', controls: [] }];
    this._idx       = 0;
    this.onSceneChange  = null;
    this.onSceneSelect  = null;
    this.onChange       = null;
    this.onClearScene   = null;
    this._render();
  }

  // ── Public API ────────────────────────────────────────────────────────

  getActive()   { return this._scenes[this._idx]; }
  getScenes()   { return this._scenes; }

  saveControls(controls) {
    this._scenes[this._idx].controls = controls;
  }

  load(data) {
    if (data.scenes?.length) {
      this._scenes = data.scenes;
    } else {
      this._scenes = [{ id: _uid(), name: 'Scene 1', controls: data.controls ?? [] }];
    }
    this._idx = 0;
    this._render();
    this.onSceneChange?.(this.getActive());
  }

  export() { return { scenes: this._scenes }; }

  // ── Private ───────────────────────────────────────────────────────────

  _add() {
    const n = this._scenes.length + 1;
    this._scenes.push({ id: _uid(), name: `Scene ${n}`, controls: [] });
    this._switch(this._scenes.length - 1);
  }

  _switch(idx) {
    this._idx = idx;
    this._render();
    this.onSceneChange?.(this.getActive());
    this.onChange?.(this._scenes, this._idx);
  }

  _delete(idx) {
    if (this._scenes.length <= 1) return;
    this._scenes.splice(idx, 1);
    if (this._idx >= this._scenes.length) this._idx = this._scenes.length - 1;
    this._render();
    this.onSceneChange?.(this.getActive());
    this.onChange?.(this._scenes, this._idx);
  }

  _render() {
    this._container.innerHTML = '';

    for (let i = 0; i < this._scenes.length; i++) {
      const active = i === this._idx;
      const tab    = document.createElement('button');
      tab.className = `scene-tab${active ? ' scene-tab--active' : ''}`;
      tab.dataset.idx = i;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'scene-tab__name';
      nameSpan.textContent = this._scenes[i].name;
      tab.appendChild(nameSpan);

      tab.addEventListener('click', () => {
        this._switch(i);
        this.onSceneSelect?.(this._scenes[i], i);
      });

      this._container.appendChild(tab);
    }

    const spacer = document.createElement('div');
    spacer.className = 'scene-bar__spacer';
    this._container.appendChild(spacer);

    const add = document.createElement('button');
    add.className   = 'scene-tab scene-tab--add';
    add.textContent = '+';
    add.title       = 'Nueva escena';
    add.addEventListener('click', () => this._add());
    this._container.appendChild(add);
  }
}

function _uid() {
  return 'scene_' + Math.random().toString(36).slice(2, 8);
}
