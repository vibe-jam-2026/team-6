# Mach Mania – 30 second trailer

`mach-mania-trailer.mp4` (1920×1080, 30 fps, 30 s). Everything in it is made from the game itself
plus a soundtrack synthesized for the trailer.

How to rebuild it (run from this folder, with the game served on port 8765):

```bash
(cd .. && python3 -m http.server 8765) &
node cap.js shots.json   # records gameplay frames into frames/<shot>/ with Playwright (needs ~30 min)
python3 music.py         # writes music.wav (120 BPM, cuts land on the beat)
python3 edit.py          # composites the cut, titles and effects and writes trailer.mp4
```

- `cap.js` puts the game on a virtual clock (`performance.now` and `requestAnimationFrame` are
  replaced) and steps it 1/30 s per screenshot, so the footage is smooth however slowly the
  software renderer runs. It starts a co-op demo with Ace computer pilots, invincible, jumps to a
  wave and sets the camera. It also hides the DEMO and INVINCIBLE labels and lets the demo trigger the self-destruct.
- `shots.json` lists the shots: the actions to take and how long to record.
- `edit.py` holds the edit decision list (`C`), the title cards (`TEXT`) and the impact times that
  get flashes and chromatic aberration.
