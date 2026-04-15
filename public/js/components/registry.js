import { SliderControl } from './SliderControl.js';
import { ButtonControl } from './ButtonControl.js';
import { InputControl }  from './InputControl.js';

const REGISTRY = {

  slider: {
    Class:    SliderControl,
    label:    'Slider',
    size:     { w: 280, h: 80 },
    defaults: { min: 0, max: 1, step: 0.01, value: 0 },
    schema: [
      { key: 'id',    label: 'ID',      inputType: 'text',   readonly: true },
      { key: 'label', label: 'Label',   inputType: 'text',   required: true },
      { key: 'min',   label: 'Min',     inputType: 'number', default: 0 },
      { key: 'max',   label: 'Max',     inputType: 'number', default: 1 },
      { key: 'step',  label: 'Step',    inputType: 'number', default: 0.01 },
      { key: 'value', label: 'Default', inputType: 'number', default: 0 },
    ],
  },

  button: {
    Class:    ButtonControl,
    label:    'Button',
    size:     { w: 140, h: 60 },
    defaults: { value: 0 },
    schema: [
      { key: 'id',    label: 'ID',    inputType: 'text', readonly: true },
      { key: 'label', label: 'Label', inputType: 'text', required: true },
      { key: 'text',  label: 'Text',  inputType: 'text', default: 'Press' },
    ],
  },

  input: {
    Class:    InputControl,
    label:    'Input Field',
    size:     { w: 220, h: 80 },
    defaults: { value: '', placeholder: 'Type here…', fieldType: 'text' },
    schema: [
      { key: 'id',          label: 'ID',          inputType: 'text',   readonly: true },
      { key: 'label',       label: 'Label',        inputType: 'text',   required: true },
      { key: 'placeholder', label: 'Placeholder',  inputType: 'text',   default: 'Type here…' },
      { key: 'fieldType',   label: 'Field Type',   inputType: 'select',
        options: ['text', 'number'], default: 'text' },
    ],
  },

  // ── Add future types here ─────────────────────────────────────────────
  // toggle: { Class: ToggleControl, label: 'Toggle', size: {w:140,h:60}, ... },
};

export function getRegistry()       { return REGISTRY; }
export function getTypes()          { return Object.keys(REGISTRY); }
export function getEntry(type)      { return REGISTRY[type]; }
export function getTypeLabel(type)  { return REGISTRY[type]?.label ?? type; }

export function createControl(config) {
  const entry = REGISTRY[config.type];
  if (!entry) throw new Error(`Unknown control type: "${config.type}"`);
  return new entry.Class(config);
}
