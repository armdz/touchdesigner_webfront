import { loadInterface, saveInterface } from '../shared/api.js';
import { WSManager }      from '../shared/ws.js';
import { Renderer }       from '../viewer/Renderer.js';
import { SceneNav }       from '../viewer/SceneNav.js';
import { Palette }        from './Palette.js';
import { Canvas }         from './Canvas.js';
import { ParamsPanel }    from './ParamsPanel.js';
import { SceneManager }   from './SceneManager.js';
import { ProjectManager } from './ProjectManager.js';

// ── Panels ────────────────────────────────────────────────────────────────

const palette    = new Palette(document.getElementById('palette'));
const canvas     = new Canvas(document.getElementById('canvas'));
const params     = new ParamsPanel(document.getElementById('params'));
const sceneMgr   = new SceneManager(document.getElementById('sceneBar'));
const projectMgr = new ProjectManager();

// ── Project helpers ───────────────────────────────────────────────────────

const projectNameEl = document.getElementById('projectName');
const projectPicker = document.getElementById('projectPicker');

function getCurrentData() {
  return { name: projectNameEl.value.trim() || 'Untitled Project', ...sceneMgr.export() };
}

function commitToProject() {
  projectMgr.commit(getCurrentData());
}

function applyProject(proj) {
  const data = proj.data || { name: proj.name };
  const name = data.name || proj.name;
  projectNameEl.value = name;
  document.title      = name + ' — WebFront Editor';
  sceneMgr.load(data);
}

// ── Project picker ────────────────────────────────────────────────────────

function renderPicker() {
  const all     = projectMgr.getAll();
  const current = projectMgr.current;
  projectPicker.innerHTML = `
    <div class="project-picker__header">
      <span class="project-picker__title">Projects</span>
      <span class="project-picker__count">${all.length}</span>
    </div>
    <div class="project-picker__list">
      ${all.map(p => `
        <div class="project-picker__item${p.id === current?.id ? ' project-picker__item--active' : ''}"
             data-id="${p.id}">
          <span class="project-picker__dot"></span>
          <span class="project-picker__name">${p.name}</span>
        </div>
      `).join('')}
    </div>
  `;
  projectPicker.querySelectorAll('.project-picker__item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (id !== projectMgr.current?.id) {
        commitToProject();
        const proj = projectMgr.switchTo(id);
        if (proj) applyProject(proj);
      }
      closePicker();
    });
  });
}

function openPicker() {
  renderPicker();
  const btn  = document.getElementById('btnOpenProject');
  const rect = btn.getBoundingClientRect();
  projectPicker.style.top  = (rect.bottom + 4) + 'px';
  projectPicker.style.left = rect.left + 'px';
  projectPicker.classList.add('open');
}

function closePicker() {
  projectPicker.classList.remove('open');
}

// ── Edit-mode wiring ──────────────────────────────────────────────────────

canvas.onSelect = (config) => {
  config ? params.show(config) : params.hide();
};

canvas.onChange = (controls) => {
  sceneMgr.saveControls(controls);
  commitToProject();
};

canvas.onIdAdjusted = (newId) => params.updateField('id', newId);

params.onChange = (key, value) => canvas.updateSelected(key, value);
params.onDelete = () => canvas.deleteSelected();

sceneMgr.onSceneChange = (scene) => {
  canvas.load(scene.controls);
  applySceneColor(scene.color);
};

sceneMgr.onSceneSelect = (scene, idx) => {
  const canDelete = sceneMgr.getScenes().length > 1;
  params.showScene(scene, {
    onRename: (name) => {
      scene.name = name;
      sceneMgr._render();
      sceneMgr.onChange?.(sceneMgr.getScenes(), idx);
    },
    onColorChange: (color) => {
      scene.color = color;
      applySceneColor(color);
      commitToProject();
    },
    onClear: () => {
      scene.controls = [];
      canvas.load([]);
      params.hide();
      sceneMgr.onChange?.(sceneMgr.getScenes(), idx);
    },
    onDelete: canDelete ? () => {
      sceneMgr._delete(idx);
      params.hide();
    } : null,
  });
};

sceneMgr.onClearScene = () => {
  canvas.load([]);
  params.hide();
};

sceneMgr.onChange = () => commitToProject();

// ── Preview mode ──────────────────────────────────────────────────────────

const editorEl   = document.querySelector('.editor');
const btnPreview = document.getElementById('btnPreview');
const previewEl  = document.getElementById('preview');
const canvasDomEl = document.getElementById('canvas');

function applySceneColor(color) {
  const c = color || '#00d4ff';
  canvasDomEl.style.setProperty('--accent', c);
  previewEl.style.setProperty('--accent', c);
}
const wsStatus   = document.getElementById('wsStatus');
const statusDot  = document.getElementById('statusDot');
const statusTxt  = document.getElementById('statusText');
const sceneNavEl = document.getElementById('previewSceneNav');

const ws              = new WSManager();
const previewRenderer = new Renderer(previewEl, ws);
const previewSceneNav = new SceneNav(sceneNavEl);
let   isPreview       = false;

ws.onStatus = (s) => {
  statusDot.className   = `status__dot status__dot--${s}`;
  statusTxt.textContent = { connected: 'Connected', connecting: 'Connecting…', error: 'Error' }[s] ?? s;
};

previewSceneNav.onSceneChange = (scene) => {
  previewRenderer.render(scene);
  ws.send({ action: 'scene', id: scene.id });
};

btnPreview.addEventListener('click', () => {
  isPreview = !isPreview;
  editorEl.classList.toggle('preview', isPreview);
  wsStatus.style.display = isPreview ? 'flex' : 'none';
  btnPreview.classList.toggle('btn--preview-active', isPreview);
  btnPreview.title = isPreview ? 'Back to editor' : 'Preview';

  if (isPreview) {
    const scenes = sceneMgr.getScenes();
    previewSceneNav.load(scenes, 0);
    previewRenderer.render(scenes[0]);
  } else {
    previewEl.innerHTML = '';
  }
});

// ── Project actions ───────────────────────────────────────────────────────

document.getElementById('btnNewProject').addEventListener('click', () => {
  commitToProject();
  const p = projectMgr.create('New Project');
  applyProject(p);
});

document.getElementById('btnOpenProject').addEventListener('click', (e) => {
  if (projectPicker.classList.contains('open')) {
    closePicker();
  } else {
    e.stopPropagation();
    openPicker();
  }
});

document.getElementById('btnDupProject').addEventListener('click', () => {
  commitToProject();
  const p = projectMgr.duplicate();
  if (p) applyProject(p);
});

document.getElementById('btnDelProject').addEventListener('click', () => {
  if (projectMgr.getAll().length <= 1) return;
  if (!confirm(`Delete "${projectMgr.current?.name}"?`)) return;
  const next = projectMgr.deleteCurrent();
  if (next) applyProject(next);
});

document.addEventListener('click', () => closePicker());
projectPicker.addEventListener('click', (e) => e.stopPropagation());

// ── Project name ──────────────────────────────────────────────────────────

projectNameEl.addEventListener('input', () => {
  const name = projectNameEl.value.trim() || 'Untitled';
  document.title = name + ' — WebFront Editor';
  projectMgr.rename(name);
});

projectNameEl.addEventListener('focus', () => projectNameEl.select());

// ── Init ──────────────────────────────────────────────────────────────────

const _init = projectMgr.current;
if (_init.data) {
  applyProject(_init);
} else {
  loadInterface().then(iface => {
    projectMgr.commit(iface);
    applyProject(projectMgr.current);
  });
}

// ── Save to TD ────────────────────────────────────────────────────────────

const btnSave    = document.getElementById('btnSave');
const saveStatus = document.getElementById('saveStatus');

btnSave.addEventListener('click', async () => {
  btnSave.disabled = true;
  saveStatus.textContent = '';

  try {
    const data = getCurrentData();
    commitToProject();
    await saveInterface(data);
    saveStatus.textContent = '✓';
    saveStatus.className   = 'save-status save-status--ok';
  } catch {
    saveStatus.textContent = '✗';
    saveStatus.className   = 'save-status save-status--error';
  } finally {
    btnSave.disabled = false;
    setTimeout(() => { saveStatus.textContent = ''; }, 2000);
  }
});
