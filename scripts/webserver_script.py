"""
webserverDAT callbacks
"""
import json
import os
from typing import Dict, Any

# In-memory cache of current control values (survives interface reloads)
_control_values: Dict[str, float] = {}


# ── Helpers ────────────────────────────────────────────────────────────────

def _public_dir() -> str:
    return os.path.normpath(project.folder + '/public')

def _interface_path() -> str:
    return os.path.join(_public_dir(), 'interface.json')

def _mime(ext: str) -> str:
    return {
        '.html': 'text/html; charset=utf-8',
        '.css':  'text/css; charset=utf-8',
        '.js':   'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
    }.get(ext.lower(), 'text/plain; charset=utf-8')


# ── Table helpers ───────────────────────────────────────────────────────────

def _ensure_header(dat) -> None:
    """Make sure the first row is [id, value]."""
    if dat.numRows == 0 or dat[0, 0].val != 'id':
        dat.clear()
        dat.appendRow(['id', 'value'])

def _set_row(dat, row_id: str, value) -> None:
    """Update an existing row or append a new one."""
    _ensure_header(dat)
    for i in range(1, dat.numRows):
        if dat[i, 0].val == row_id:
            dat[i, 1] = value
            return
    dat.appendRow([row_id, value])

def _get_controls(iface: dict, scene_id: str = None) -> list:
    """Extract controls from a scene, or from legacy {controls:[]} format."""
    scenes = iface.get('scenes', [])
    if scenes:
        if scene_id:
            scene = next((s for s in scenes if s.get('id') == scene_id), scenes[0])
        else:
            scene = scenes[0]
        return scene.get('controls', [])
    return iface.get('controls', [])

def _hex_to_rgb(hex_str: str):
    """Convert #rrggbb to (r, g, b) floats in 0-1 range."""
    h = hex_str.lstrip('#')
    if len(h) == 6:
        return (int(h[0:2], 16) / 255.0,
                int(h[2:4], 16) / 255.0,
                int(h[4:6], 16) / 255.0)
    return 0.0, 0.0, 0.0

def _init_table_from_json(dat, scene_id: str = None) -> None:
    """
    Populate dat table from interface.json for the given scene.
    Called on server start, after /save, and on scene switch.

    Multi-channel controls use channel suffixes:
      xypad  → {id}_x, {id}_y
      color  → {id}_r, {id}_g, {id}_b, {id}_a
    Label controls are decorative and produce no rows.
    """
    dat.clear()
    dat.appendRow(['id', 'value'])
    try:
        with open(_interface_path(), 'r', encoding='utf-8') as f:
            iface = json.load(f)
        for ctrl in _get_controls(iface, scene_id):
            ctrl_id   = ctrl.get('id', '')
            ctrl_type = ctrl.get('type', '')

            # Labels are decorative — no row in TD
            if ctrl_type == 'label':
                continue

            # XY Pad → {id}_x, {id}_y
            if ctrl_type == 'xypad':
                parts = str(ctrl.get('value', '0.5 0.5')).split()
                x = float(parts[0]) if len(parts) > 0 else 0.5
                y = float(parts[1]) if len(parts) > 1 else 0.5
                _set_row(dat, ctrl_id + '_x', _control_values.get(ctrl_id + '_x', x))
                _set_row(dat, ctrl_id + '_y', _control_values.get(ctrl_id + '_y', y))
                continue

            # Color → {id}_r, {id}_g, {id}_b, {id}_a
            if ctrl_type == 'color':
                r, g, b = _hex_to_rgb(ctrl.get('value', '#000000'))
                alpha   = float(ctrl.get('alpha', 1.0))
                _set_row(dat, ctrl_id + '_r', _control_values.get(ctrl_id + '_r', r))
                _set_row(dat, ctrl_id + '_g', _control_values.get(ctrl_id + '_g', g))
                _set_row(dat, ctrl_id + '_b', _control_values.get(ctrl_id + '_b', b))
                _set_row(dat, ctrl_id + '_a', _control_values.get(ctrl_id + '_a', alpha))
                continue

            # Pallet → {id}_r, {id}_g, {id}_b (first color as default)
            if ctrl_type == 'pallet':
                colors = ctrl.get('colors', ['#FF0000'])
                first  = colors[0] if colors else '#FF0000'
                r, g, b = _hex_to_rgb(first)
                _set_row(dat, ctrl_id + '_r', _control_values.get(ctrl_id + '_r', r))
                _set_row(dat, ctrl_id + '_g', _control_values.get(ctrl_id + '_g', g))
                _set_row(dat, ctrl_id + '_b', _control_values.get(ctrl_id + '_b', b))
                continue

            # All other controls — single value row
            default = ctrl.get('value', 0)
            dat.appendRow([ctrl_id, _control_values.get(ctrl_id, default)])
    except Exception as e:
        print('[webserver] _init_table_from_json error:', e)


# ── Static file serving ─────────────────────────────────────────────────────

def _serve_static(response: Dict[str, Any], uri: str) -> Dict[str, Any]:
    public = _public_dir()
    rel    = uri.lstrip('/') or 'index.html'
    path   = os.path.normpath(os.path.join(public, rel))

    # Path-traversal protection
    if not path.startswith(public):
        response['statusCode']   = 403
        response['statusReason'] = 'Forbidden'
        response['data']         = 'Forbidden'
        return response

    try:
        with open(path, 'r', encoding='utf-8') as f:
            response['statusCode']    = 200
            response['statusReason']  = 'OK'
            response['content-type']  = _mime(os.path.splitext(path)[1])
            response['cache-control'] = 'no-cache, no-store, must-revalidate'
            response['pragma']        = 'no-cache'
            response['expires']       = '0'
            response['data']          = f.read()
    except FileNotFoundError:
        response['statusCode']   = 404
        response['statusReason'] = 'Not Found'
        response['data']         = f'Not Found: {uri}'
    except Exception as e:
        response['statusCode']   = 500
        response['statusReason'] = 'Internal Server Error'
        response['data']         = str(e)

    return response


# ── Callbacks ───────────────────────────────────────────────────────────────

def onHTTPRequest(dat, request: Dict[str, Any],
                  response: Dict[str, Any]) -> Dict[str, Any]:
    uri    = request.get('uri', '/')
    method = request.get('method', 'GET')

    # GET /values  →  return current live control values from TD
    if method == 'GET' and uri == '/values':
        response['statusCode']   = 200
        response['statusReason'] = 'OK'
        response['content-type'] = 'application/json'
        response['data']         = json.dumps(_control_values)
        return response

    # POST /save  →  write interface.json and refresh table
    if method == 'POST' and uri == '/save':
        try:
            iface = json.loads(request.get('data', '{}'))
            with open(_interface_path(), 'w', encoding='utf-8') as f:
                json.dump(iface, f, indent=2)
            _init_table_from_json(dat)
            response['statusCode']   = 200
            response['statusReason'] = 'OK'
            response['content-type'] = 'application/json'
            response['data']         = json.dumps({'ok': True})
        except Exception as e:
            response['statusCode']   = 500
            response['statusReason'] = 'Internal Server Error'
            response['data']         = json.dumps({'error': str(e)})
        return response

    # Everything else  →  serve from public/
    return _serve_static(response, uri)


def onWebSocketOpen(dat, client: str, uri: str):
    return

def onWebSocketClose(dat, client: str):
    return

def onWebSocketReceiveText(dat, client: str, data: str):
    """
    Expects JSON: {"id": "control_id", "value": 0.5}
    Updates dat table row and acknowledges client.
    """
    global _control_values
    try:
        msg = json.loads(data)
        # Scene switch
        if msg.get('action') == 'scene':
            scene_id = str(msg.get('id', ''))
            _init_table_from_json(dat, scene_id)
            dat.webSocketSendText(client, json.dumps({'ack': True, 'action': 'scene', 'id': scene_id}))
            return

        if 'id' in msg and 'value' in msg:
            ctrl_id = str(msg['id'])
            raw     = msg['value']
            try:
                value = float(raw)
            except (TypeError, ValueError):
                value = str(raw)   # text inputs send strings
            _control_values[ctrl_id] = value
            _set_row(dat, ctrl_id, value)
            dat.webSocketSendText(client, json.dumps({'ack': True, 'id': ctrl_id, 'value': value}))
    except Exception as e:
        dat.webSocketSendText(client, json.dumps({'error': str(e)}))

def onWebSocketReceiveBinary(dat, client: str, data: bytes):
    dat.webSocketSendBinary(client, data)

def onWebSocketReceivePing(dat, client: str, data: bytes):
    dat.webSocketSendPong(client, data=data)

def onWebSocketReceivePong(dat, client: str, data: bytes):
    return

def onServerStart(dat):
    """Populate the table as soon as TD starts the server."""
    _init_table_from_json(dat)

def onServerStop(dat):
    return
