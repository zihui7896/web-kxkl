/** Browser regression: serve web/ first, then run with a local Playwright installation.
 * PLAYWRIGHT_MODULE can point to playwright/index.mjs; BROWSER_EXECUTABLE is optional.
 * Example: GUNFIGHT_URL=http://localhost:8765/workspace.html#gunfight node gunfight-browser.test.mjs
 */
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--enable-webgl','--ignore-gpu-blocklist']});
const errors=[];
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.GUNFIGHT_URL || 'http://127.0.0.1:8765/workspace.html#gunfight');
  await page.waitForSelector('.gun-start');
  assert.equal(await page.locator('[data-view="gunfight"]').getAttribute('aria-current'),'page');
  await page.click('.gun-start');
  await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.mouse.down();await page.waitForTimeout(650);await page.mouse.up();
  assert.ok(Number(await page.locator('[data-ammo]').textContent())<30,'shots consume ammo');
  await page.keyboard.press('KeyR');
  await page.waitForFunction(()=>document.querySelector('[data-ammo]').textContent==='30');
  assert.ok(Number(await page.locator('[data-reserve]').textContent())<120,'reload draws from reserve');
  await page.keyboard.press('Digit3');await page.mouse.down({button:'right'});
  await page.waitForFunction(()=>document.querySelector('.gun-scope').classList.contains('on'));
  await page.mouse.up({button:'right'});await page.evaluate(()=>document.exitPointerLock());
  await page.waitForSelector('.gun-menu',{state:'visible'});
  const paused=await page.locator('[data-time]').textContent();await page.waitForTimeout(1100);
  assert.equal(await page.locator('[data-time]').textContent(),paused,'pause freezes match');
  await page.click('[data-view="pet"]');await page.click('[data-view="gunfight"]');
  assert.ok(await page.locator('.gun-menu').isVisible(),'return remains paused');
  await page.selectOption('[data-quality]','low');await page.click('[data-new-round]');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-kd]').textContent(),'击杀 0 · 阵亡 0');
  await page.evaluate(()=>document.exitPointerLock());
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  mobile.on('pageerror',error=>errors.push(error.message));
  await mobile.goto(process.env.GUNFIGHT_URL || 'http://127.0.0.1:8765/workspace.html#gunfight');
  await mobile.waitForSelector('.gun-start');await mobile.click('.gun-start');
  assert.ok(await mobile.locator('.gun-touch').isVisible(),'touch controls shown');
  const fire=await mobile.locator('[data-touch="fire"]').boundingBox();
  await mobile.mouse.move(fire.x+fire.width/2,fire.y+fire.height/2);await mobile.mouse.down();await mobile.waitForTimeout(500);await mobile.mouse.up();
  assert.ok(Number(await mobile.locator('[data-ammo]').textContent())<30,'touch fire consumes ammo');
  await mobile.click('.gun-pause');assert.ok(await mobile.locator('.gun-menu').isVisible());
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
  assert.deepEqual(errors,[],'no runtime exceptions');
  console.log('PASS: routing, shooting, reload, scope, pause, navigation, restart, low quality, touch and responsive layout');
} finally { await browser.close(); }
