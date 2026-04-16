import { loadInterface, loadValues } from '../shared/api.js';
import { WSManager }     from '../shared/ws.js';
import { Renderer }      from './Renderer.js';
import { SceneNav }      from './SceneNav.js';

const dot       = document.getElementById('statusDot');
const container = document.getElementById('controls');
const navEl     = document.getElementById('sceneNav');

const ws       = new WSManager();
const renderer = new Renderer(container, ws);
const sceneNav = new SceneNav(navEl);

ws.onStatus = (s) => {
  dot.className = `status__dot status__dot--${s}`;
};

ws.onMessage = ({ id, value } = {}) => {
  if (id !== undefined) renderer.setValue(id, value);
};

async function applyLiveValues() {
  const values = await loadValues();
  for (const [id, value] of Object.entries(values)) {
    renderer.setValue(id, value);
  }
}

sceneNav.onSceneChange = (scene) => {
  renderer.render(scene);
  ws.send({ action: 'scene', id: scene.id });
  applyLiveValues();
};

loadInterface().then(async iface => {
  const name = iface.name?.trim() || 'Untitled Project';
  document.getElementById('projectName').textContent = name;
  document.title = name;

  // Support both {scenes:[...]} and legacy {controls:[...]}
  const scenes = iface.scenes?.length
    ? iface.scenes
    : [{ id: 'default', name: 'Default', controls: iface.controls ?? [] }];

  sceneNav.load(scenes, 0);
  renderer.render(scenes[0]);
  await applyLiveValues();
});
