/**
 * WSManager — handles WebSocket connection with auto-reconnect.
 *
 * Usage:
 *   const ws = new WSManager();
 *   ws.onStatus  = (status) => { ... }   // 'connected' | 'connecting' | 'error'
 *   ws.onMessage = (data)   => { ... }   // parsed JSON object
 *   ws.send({ id: 'brightness', value: 0.5 });
 */
export class WSManager {
  constructor() {
    const port   = location.port || 9980;
    this._url    = `ws://${location.hostname}:${port}`;
    this._ws     = null;
    this._timer  = null;
    this.status  = 'connecting';

    /** @type {((status: string) => void) | null} */
    this.onStatus  = null;

    /** @type {((data: object) => void) | null} */
    this.onMessage = null;

    this._connect();
  }

  _connect() {
    this._ws = new WebSocket(this._url);

    this._ws.onopen = () => {
      clearTimeout(this._timer);
      this._setStatus('connected');
    };

    this._ws.onclose = () => {
      this._setStatus('connecting');
      this._timer = setTimeout(() => this._connect(), 2000);
    };

    this._ws.onerror = () => {
      this._setStatus('error');
    };

    this._ws.onmessage = (e) => {
      try { this.onMessage?.(JSON.parse(e.data)); } catch { /* ignore malformed */ }
    };
  }

  /** Send a JSON-serialisable object */
  send(data) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(data));
    }
  }

  _setStatus(s) {
    this.status = s;
    this.onStatus?.(s);
  }
}
