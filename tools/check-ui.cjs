'use strict';
// Visual smoke test. Set PLAYWRIGHT_MODULE and CHROME_EXECUTABLE for your environment.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const {pathToFileURL}=require('node:url'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:940,height:680}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  let current={version:'0.1.0',windows:true,folder:'',repo:'',status:null};
  window.builds={state:async()=>current,choose:async()=>{current={...current,folder:'C:\\Creative Destruction',status:{game:{state:'closed'},backup:false,preset:'Not applied'}};return current;},apply:async p=>{current.status.backup=true;current.status.preset=p==='bubble'?'Bubble Wrap — Test 01':'Mobile / flat';return current;},restore:async()=>{current.status.preset='Restored backup';return current;},backups:async()=>{},saveRepo:async r=>r,check:async()=>{},update:async()=>{},onProgress:()=>{},onGame:()=>{},onUpdate:()=>{}};
 });
 await page.goto(pathToFileURL(path.join(__dirname,'../app/index.html')).href);await page.waitForFunction(()=>document.getElementById('version').textContent==='v0.1.0');
 assert.equal(await page.locator('#apply').isDisabled(),true);await page.click('#browse');assert.equal(await page.locator('#apply').isEnabled(),true);
 await page.click('#mobile');assert.equal(await page.locator('#mobile').getAttribute('aria-checked'),'true');await page.click('#bubble');await page.click('#apply');await page.waitForFunction(()=>document.getElementById('status').classList.contains('success'));assert.equal(await page.locator('#restore').isEnabled(),true);
 await page.click('#restore');await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Backup restored'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false,'Main view overflows fixed window');
 await page.screenshot({path:process.env.UI_SCREENSHOT||'/tmp/bubble-ui.png'});await page.click('#openSettings');assert.equal(await page.locator('dialog').isVisible(),true);await page.click('#closeSettings');assert.deepEqual(errors,[]);console.log('UI: folder selection, preset selection, apply, restore, settings and fixed-window layout passed.');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
