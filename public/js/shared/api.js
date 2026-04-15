/**
 * HTTP API helpers for communicating with the TouchDesigner web server.
 */

export async function loadInterface() {
  try {
    const res = await fetch('/interface.json');
    if (!res.ok) return { controls: [] };
    return await res.json();
  } catch {
    return { controls: [] };
  }
}

export async function saveInterface(data) {
  const res = await fetch('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return res.json();
}
