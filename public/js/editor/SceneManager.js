/**
 * SceneManager — manages a list of named scenes in the editor.
 * Renders a tab bar; each scene holds its own controls array.
 *
 * Callbacks:
 *   onSceneChange(scene)          — active scene switched (load into canvas)
 *   onChange(scenes, activeIdx)   — any structural change (for save)
 */
export class SceneManager {
  constructor(container) {
    this._container = container;
    this._scenes    = [{ id: _uid(), name: 'Scene 1', controls: [] }];
    this._idx       = 0;
    this.onSceneChange = null;
    this.onChange      = null;
    this._render();
  }

  // ── Public API ────────────────────────────────────────────────────────

  getActive()   { return this._scenes[this._idx]; }
  getScenes()   { return this._scenes; }

  /** Called by Canvas.onChange — keeps active scene's controls in sync */
  saveControls(controls) {
    this._scenes[this._idx].controls = controls;
  }

  /** Load from saved interface JSON (supports old {controls:[]} format) */
  load(data) {
    if (data.scenes?.length) {
      this._scenes = data.scenes;
    } else {
      // Migrate legacy format
      this._scenes = [{ id: _uid(), name: 'Scene 1', controls: data.controls ?? [] }];
    }
    this._idx = 0;
    this._render();
    this.onSceneChange?.(this.getActive());
  }

  /** Serialise for saving */
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

  _rename(idx) {
    const name = prompt('Scene name:', this._scenes[idx].name);
    if (name?.trim()) {
      this._scenes[idx].name = name.trim();
      this._render();
      this.onChange?.(this._scenes, this._idx);
    }
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

      const nameSpan = document.createElement('span');
      nameSpan.textContent = this._scenes[i].name;
      nameSpan.addEventListener('dblclick', (e) => { e.stopPropagation(); this._rename(i); });
      tab.appendChild(nameSpan);

      if (this._scenes.length > 1) {
        const x = document.createElement('span');
        x.className   = 'scene-tab__del';
        x.textContent = '×';
        x.addEventListener('click', (e) => { e.stopPropagation(); this._delete(i); });
        tab.appendChild(x);
      }

      tab.addEventListener('click', () => this._switch(i));
      this._container.appendChild(tab);
    }

    const add = document.createElement('button');
    add.className   = 'scene-tab scene-tab--add';
    add.textContent = '+ Scene';
    add.addEventListener('click', () => this._add());
    this._container.appendChild(add);
  }
}

function _uid() {
  return 'scene_' + Math.random().toString(36).slice(2, 8);
}
