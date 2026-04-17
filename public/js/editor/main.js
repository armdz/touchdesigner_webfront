import { loadInterface, saveInterface } from '../shared/api.js';
import { WSManager }     from '../shared/ws.js';
import { Renderer }      from '../viewer/Renderer.js';
import { SceneNav }      from '../viewer/SceneNav.js';
import { Palette }       from './Palette.js';
import { Canvas }        from './Canvas.js';
import { ParamsPanel }   from './ParamsPanel.js';
import { SceneManager }  from './SceneManager.js';

// ── Panels ────────────────────────────────────────────────────────────────

const palette      = new Palette(document.getElementById('palette'));
const canvas       = new Canvas(document.getElementById('canvas'));
const params       = new ParamsPanel(document.getElementById('params'));
const sceneMgr     = new SceneManager(document.getElementById('sceneBar'));

// ── Edit-mode wiring ──────────────────────────────────────────────────────

canvas.onSelect = (config) => {
  config ? params.show(config) : params.hide();
};

canvas.onChange = (controls) => {
  sceneMgr.saveControls(controls);
};

canvas.onIdAdjusted = (newId) => params.updateField('id', newId);

params.onChange = (key, value) => canvas.updateSelected(key, value);
params.onDelete = () => canvas.deleteSelected();

sceneMgr.onSceneChange = (scene) => {
  canvas.load(scene.controls);
};

sceneMgr.onSceneSelect = (scene, idx) => {
  const canDelete = sceneMgr.getScenes().length > 1;
  params.showScene(scene, {
    onRename: (name) => {
      scene.name = name;
      sceneMgr._render();
      sceneMgr.onChange?.(sceneMgr.getScenes(), idx);
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

// ── Preview mode ──────────────────────────────────────────────────────────

const editorEl   = document.querySelector('.editor');
const btnPreview = document.getElementById('btnPreview');
const previewEl  = document.getElementById('preview');
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
  btnPreview.querySelector('.btn__text').textContent = isPreview ? 'Editor' : 'Preview';

  if (isPreview) {
    const scenes = sceneMgr.getScenes();
    previewSceneNav.load(scenes, 0);
    previewRenderer.render(scenes[0]);
  } else {
    previewEl.innerHTML = '';
  }
});

// ── Project name ──────────────────────────────────────────────────────────

const projectNameEl = document.getElementById('projectName');

projectNameEl.addEventListener('input', () => {
  document.title = (projectNameEl.value.trim() || 'Untitled') + ' — WebFront Editor';
});

// Select all text on focus for quick rename
projectNameEl.addEventListener('focus', () => projectNameEl.select());

// ── Load existing interface ───────────────────────────────────────────────

loadInterface().then(iface => {
  const name = iface.name?.trim() || 'Untitled Project';
  projectNameEl.value = name;
  document.title = name + ' — WebFront Editor';
  sceneMgr.load(iface);
});

// ── Save ──────────────────────────────────────────────────────────────────

const btnSave    = document.getElementById('btnSave');
const saveStatus = document.getElementById('saveStatus');

btnSave.addEventListener('click', async () => {
  btnSave.disabled = true;
  saveStatus.textContent = '';

  try {
    const name = projectNameEl.value.trim() || 'Untitled Project';
    await saveInterface({ name, ...sceneMgr.export() });
    saveStatus.textContent = '✓';
    saveStatus.className   = 'save-status save-status--ok';
  } catch (e) {
    saveStatus.textContent = '✗';
    saveStatus.className   = 'save-status save-status--error';
  } finally {
    btnSave.disabled = false;
    setTimeout(() => { saveStatus.textContent = ''; }, 2000);
  }
});
