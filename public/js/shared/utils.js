/**
 * Converts a human label to a safe snake_case ID.
 * "My Slider" → "my_slider"
 */
export function labelToId(label) {
  return (label ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    || 'control';
}

/**
 * Returns a unique ID based on base, avoiding collisions with existingIds.
 * "brightness" → "brightness_1" if already taken.
 */
export function uniqueId(base, existingIds = []) {
  if (!existingIds.includes(base)) return base;
  let i = 1;
  while (existingIds.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

/**
 * Snap a pixel value to the nearest grid step.
 */
export function snap(v, grid) {
  return Math.round(v / grid) * grid;
}
