// Game space is screen-like: x right, y down, origin top-left, size = bounds.
// Scene space centres the arena on the origin with +y up and +z towards the camera.
export const toSceneX = (bounds, x) => x - bounds.width / 2;
export const toSceneY = (bounds, y) => bounds.height / 2 - y;
