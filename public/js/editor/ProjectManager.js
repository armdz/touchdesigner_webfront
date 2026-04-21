const STORE_KEY   = 'webfront_projects';
const CURRENT_KEY = 'webfront_current';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class ProjectManager {
  constructor() {
    this._projects = this._load();
    if (!this._projects.length) {
      this._projects = [this._blank('Untitled Project')];
      this._persist();
    }
    this._currentId = localStorage.getItem(CURRENT_KEY) || this._projects[0].id;
    if (!this._projects.find(p => p.id === this._currentId)) {
      this._currentId = this._projects[0].id;
    }
    localStorage.setItem(CURRENT_KEY, this._currentId);
  }

  get current() { return this._projects.find(p => p.id === this._currentId) ?? null; }
  getAll()      { return this._projects; }

  _blank(name)  { return { id: uid(), name, data: null }; }

  _load() {
    try   { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch { return []; }
  }

  _persist() { localStorage.setItem(STORE_KEY, JSON.stringify(this._projects)); }

  commit(data) {
    const p = this.current;
    if (!p) return;
    p.data = JSON.parse(JSON.stringify(data));
    p.name = data.name || p.name;
    this._persist();
  }

  create(name = 'New Project') {
    const p = this._blank(name);
    this._projects.push(p);
    this._currentId = p.id;
    localStorage.setItem(CURRENT_KEY, p.id);
    this._persist();
    return p;
  }

  switchTo(id) {
    const p = this._projects.find(p => p.id === id);
    if (!p) return null;
    this._currentId = id;
    localStorage.setItem(CURRENT_KEY, id);
    return p;
  }

  duplicate() {
    const src = this.current;
    if (!src) return null;
    const copy     = JSON.parse(JSON.stringify(src));
    copy.id        = uid();
    copy.name      = src.name + ' copy';
    if (copy.data) copy.data.name = copy.name;
    this._projects.push(copy);
    this._currentId = copy.id;
    localStorage.setItem(CURRENT_KEY, copy.id);
    this._persist();
    return copy;
  }

  deleteCurrent() {
    if (this._projects.length <= 1) return null;
    const idx  = this._projects.findIndex(p => p.id === this._currentId);
    this._projects.splice(idx, 1);
    const next = this._projects[Math.max(0, idx - 1)];
    this._currentId = next.id;
    localStorage.setItem(CURRENT_KEY, next.id);
    this._persist();
    return next;
  }

  rename(name) {
    const p = this.current;
    if (!p) return;
    p.name = name;
    if (p.data) p.data.name = name;
    this._persist();
  }
}
