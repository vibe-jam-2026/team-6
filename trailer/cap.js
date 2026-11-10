const { chromium } = require('playwright');
const fs = require('fs');
const W = +process.env.W || 1280, H = +process.env.H || 720;
const init = () => {
  let t = 1000; let cbs = []; let id = 0;
  const seedRand = (() => { let s = 1234567; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  Math.random = seedRand;
  performance.now = () => t;
  const d0 = Date.now(); Date.now = () => d0 + t;
  window.requestAnimationFrame = cb => { cbs.push(cb); return ++id; };
  window.cancelAnimationFrame = () => {};
  window.__step = (dt) => { t += dt * 1000; const c = cbs; cbs = []; c.forEach(f => f(t)); };
};
(async () => {
  const shots = JSON.parse(fs.readFileSync(process.argv[2]));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.addInitScript(init);
  await page.route(/DemoView\.js/, r => r.fulfill({ contentType: 'text/javascript', body: 'export class DemoView { draw() {} }' }));
  const patch = (re, fn) => page.route(re, async r => { const res = await r.fetch(); r.fulfill({ response: res, body: fn(await res.text()) }); });
  await patch(/HudView\.js/, t => t.replace("if (session.invincible) o.text('INVINCIBLE'", "if (false) o.text('INVINCIBLE'"));
  await patch(/ComputerShipController\.js/, t => t.replace('selfDestructPressed() { return false; }', 'selfDestructPressed() { if (window.__nuke) { window.__nuke = false; return true; } return false; }'));
  await page.addStyleTag && 0;
  await page.goto('http://localhost:8765/index.html?touch=0');
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '#foot{display:none!important}' });
  const step = async (n) => { for (let i = 0; i < n; i++) await page.evaluate(() => window.__step(1/30)); };
  const fast = async (sec) => { for (let i = 0; i < Math.round(sec*10); i++) await page.evaluate(() => window.__step(0.1)); };
  const only = process.argv[3] ? process.argv[3].split(',') : null;
  for (const shot of shots) {
    if (only && !only.includes(shot.name)) continue;
    await page.goto('http://localhost:8765/index.html?touch=0'); await page.waitForTimeout(1500);
    await page.addStyleTag({ content: '#foot{display:none!important}' });
    const dir = `frames/${shot.name}`; fs.mkdirSync(dir, { recursive: true });
    let f = 0;
    for (const a of shot.actions) {
      if (a.key) { await page.keyboard.down(a.key); await step(2); await page.keyboard.up(a.key); await step(1); }
      if (a.eval) { await page.evaluate(a.eval); }
      if (a.wait) await fast(a.wait);
      if (a.rec) {
        const n = Math.round(a.rec * 30);
        for (let i = 0; i < n; i++) {
          await page.evaluate(() => window.__step(1/30));
          await page.screenshot({ path: `${dir}/${String(f++).padStart(5,'0')}.jpg`, type: 'jpeg', quality: 92 });
        }
        console.log(shot.name, f, new Date().toISOString());
      }
    }
  }
  await browser.close();
})();
