import { loadInterface } from '../shared/api.js';
import { WSManager }     from '../shared/ws.js';
import { Renderer }      from './Renderer.js';
import { SceneNav }      from './SceneNav.js';

const dot       = document.getElementById('statusDot');
const statusTxt = document.getElementById('statusText');
const container = document.getElementById('controls');
const navEl     = document.getElementById('sceneNav');

const STATUS_TEXT = {
  connected:  'Connected to TouchDesigner',
  connecting: 'Connecting…',
  error:      'Connection error',
};

const ws       = new WSManager();
const renderer = new Renderer(container, ws);
const sceneNav = new SceneNav(navEl);

ws.onStatus = (s) => {
  dot.className         = `status__dot status__dot--${s}`;
  statusTxt.textContent = STATUS_TEXT[s] ?? s;
};

ws.onMessage = ({ id, value } = {}) => {
  if (id !== undefined) renderer.setValue(id, value);
};

sceneNav.onSceneChange = (scene) => {
  renderer.render(scene);
  ws.send({ action: 'scene', id: scene.id });
};

loadInterface().then(iface => {
  // Support both {scenes:[...]} and legacy {controls:[...]}
  const scenes = iface.scenes?.length
    ? iface.scenes
    : [{ id: 'default', name: 'Default', controls: iface.controls ?? [] }];

  sceneNav.load(scenes, 0);
  renderer.render(scenes[0]);
});
