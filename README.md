# team-6
Vibe Jam 2026 – lag 6

## Rock Rumble

A local multiplayer asteroid shooter for up to 4 players sharing one keyboard.
It is a static site with no server: `index.html` plus a vendored copy of
[Three.js](https://threejs.org) r170 (MIT) in `vendor/three/` for the 3D graphics
(tilted camera, lit low-poly rocks, shadows, bloom glow). Play it at
https://vibe-jam-2026.github.io/team-6/.

To run it locally, serve the folder over HTTP (ES modules don't load from `file://`):

```bash
python3 -m http.server 8000
```

then open http://localhost:8000.

| Player | Thrust | Turn | Fire |
|--------|--------|------|------|
| P1 (red)    | W       | A / D       | S       |
| P2 (blue)   | ↑       | ← / →       | ↓       |
| P3 (green)  | I       | J / L       | K       |
| P4 (yellow) | Num 8   | Num 4 / 6   | Num 5   |

- **Lobby:** press a player's fire key to join/leave, **Tab** switches mode, **Enter** starts.
- **Modes:** *Free-for-all* (bullets hit other ships, 250 pts per kill, last ship flying wins)
  or *Co-op* (no friendly fire, survive as many waves as you can).
- **In game:** **P**/**Esc** pause (Q in pause quits to lobby), **M** mutes sound.
- Asteroids score 20 / 50 / 100 by size; extra life every 10 000 points.

Note: some keyboards can't register many simultaneous keys ("ghosting"), so with
4 players on one keyboard a few key combinations may drop out.
