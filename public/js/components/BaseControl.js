/**
 * BaseControl — abstract base class for all interface controls.
 *
 * Subclasses must implement:
 *   render()  → HTMLElement
 *   toJSON()  → plain config object (call super.toJSON() and spread)
 *
 * Subclasses should override:
 *   _syncDOM()  → update DOM when setValue() is called externally
 */
export class BaseControl {
  /**
   * @param {object} config
   * @param {string} config.type
   * @param {string} config.id
   * @param {string} [config.label]
   * @param {number} [config.value]
   */
  constructor(config) {
    this.type  = config.type;
    this.id    = config.id;
    this.label = config.label || config.id;
    this.value = config.value ?? 0;

    /** @type {HTMLElement|null} */
    this._el = null;

    /** @type {((event: {id: string, value: any}) => void)|null} */
    this._onChange = null;
  }

  /** @returns {HTMLElement} */
  render() {
    throw new Error(`${this.constructor.name}.render() is not implemented`);
  }

  getValue() { return this.value; }

  /** Set value programmatically and update DOM */
  setValue(v) {
    this.value = v;
    this._syncDOM();
  }

  /** Override to update the DOM when setValue() is called */
  _syncDOM() {}

  /** Register a callback for user-triggered value changes */
  onChange(fn) {
    this._onChange = fn;
    return this; // chainable
  }

  /** Called by subclasses when the user changes the value */
  _emit(value) {
    this.value = value;
    this._onChange?.({ id: this.id, value });
  }

  /** Serialize to a plain config object */
  toJSON() {
    return { type: this.type, id: this.id, label: this.label, value: this.value };
  }
}
