// Install Playwright 1.51.1 and its Chromium browser before running this mocked UI test.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../web'),host='https://fileorganizerpro.mohammadaslanidev.ir';
const plans=[{plan_id:'free',price_usd:0,duration_days:30,organization_limit_bytes:9663676416},{plan_id:'pro',price_usd:1.99,duration_days:182,organization_limit_bytes:null,pi_amount:12,pi_rate_source:'coingecko',pi_rate_updated_at:new Date().toISOString()},{plan_id:'max',price_usd:8.99,duration_days:365,organization_limit_bytes:null}];
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
let cases=0;
for(const language of ['fa','en'])for(const theme of ['light','dark'])for(const width of [320,390,1280]){
 const context=await browser.newContext({viewport:{width,height:900},permissions:['camera'],colorScheme:theme});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let offline=false,authCalls=0;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='backend.invalid')return offline?route.abort():route.fulfill({json:plans});
  if(u.hostname==='sdk.minepi.com')return route.fulfill({body:'window.Pi={init:async()=>{},authenticate:async()=>{window.__authCalls=(window.__authCalls||0)+1;return {user:{username:"test-pioneer"}}}};',contentType:'application/javascript'});
  if(u.pathname==='/web/config.js')return route.fulfill({body:'window.FOP_CONFIG={SUPABASE_URL:"https://backend.invalid",SUPABASE_ANON_KEY:"mock",DOWNLOAD_URL:"#"};',contentType:'application/javascript'});
  if(/\/(home-policy|home-locale|home-i18n|home-v2|jsQR-1\.4\.0)\.js$/.test(u.pathname))return route.fulfill({status:404,body:'Not found'});
  const local=path.join(root,u.pathname.replace(/^\/web\//,''));
  if(!local.startsWith(root)||!fs.existsSync(local))return route.abort();
  return route.fulfill({body:fs.readFileSync(local),contentType:local.endsWith('.png')?'image/png':local.endsWith('.ico')?'image/x-icon':local.endsWith('.css')?'text/css':local.endsWith('.js')?'application/javascript':'text/html'});
 });
 await page.goto(host+'/web/index.html?lang='+language);
 await page.waitForSelector('.plan');
 await page.locator('#piShortcut').click();assert.equal(new URL(page.url()).hash,'#pi');
 assert.ok(await page.locator('#piAuth').isVisible());
 assert.equal(await page.locator('.plan').count(),3);
 assert.equal(await page.locator('html').getAttribute('dir'),language==='fa'?'rtl':'ltr');
 assert.equal(await page.locator('#downloadButton').isVisible(),false);
 assert.equal(await page.locator('body').getAttribute('data-theme'),theme);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'viewport overflow');
 const other=theme==='light'?'dark':'light';
 await page.emulateMedia({colorScheme:other});await page.waitForFunction(t=>document.body.dataset.theme===t,other);
 await page.emulateMedia({colorScheme:theme});
 await page.waitForFunction(t=>document.body.dataset.theme===t,theme);
 const positions=await page.evaluate(()=>['theme','language','piShortcut'].map(id=>document.getElementById(id).getBoundingClientRect().x));
 assert.ok(positions[0]<positions[1]&&positions[1]<positions[2]);

 await page.locator('#theme').click();assert.notEqual(await page.locator('body').getAttribute('data-theme'),theme);
 await page.locator('#theme').click();
 await page.reload();await page.waitForSelector('.plan');
 await page.emulateMedia({colorScheme:other});assert.equal(await page.locator('body').getAttribute('data-theme'),theme);
 // Opening the scanner is the camera gesture; no separate start button.
 assert.equal(await page.locator('#startCamera').count(),0);
 assert.equal(await page.locator('#camera').evaluate(e=>e.srcObject),null);
 await page.locator('.scan-banner [data-scan]').click();
 assert.equal(await page.locator('#scanner').evaluate(e=>e.open),true);

 await page.waitForFunction(()=>document.getElementById('camera').srcObject?.active);
 await page.evaluate(()=>window.__tracks=document.getElementById('camera').srcObject.getTracks());
 await page.locator('#stopCamera').click();assert.ok(await page.evaluate(()=>__tracks.every(t=>t.readyState==='ended')));
 assert.equal(await page.locator('#stopCamera').textContent(),await page.evaluate(()=>FOP_HOME_TEXT[document.documentElement.lang].cameraStart));
 await page.locator('#stopCamera').click();await page.waitForFunction(()=>document.getElementById('camera').srcObject?.active);
 await page.evaluate(()=>window.__tracks=document.getElementById('camera').srcObject.getTracks());
 await page.locator('#closeScanner').click();assert.ok(await page.evaluate(()=>__tracks.every(t=>t.readyState==='ended')));
 await page.locator('.scan-banner [data-scan]').click();
 await page.locator('#qrImage').setInputFiles(path.join(__dirname,'fixtures/payment-qr.png'));
 await page.waitForSelector('#scanResult:not([hidden])');
 assert.ok((await page.locator('#resultHost').textContent()).includes('/web/checkout.html'));
 assert.ok(!page.url().includes('checkout.html'),'scanning must not navigate');
 await page.locator('#qrImage').setInputFiles(path.join(__dirname,'fixtures/foreign-qr.png'));
 await page.waitForFunction(()=>document.getElementById('scanStatus').classList.contains('error'));
 assert.equal(await page.locator('#scanResult').isVisible(),false);
 await page.locator('.manual summary').click();
 await page.locator('#paymentLink').fill(host+'/web/checkout.html?token=mock');await page.locator('#checkLink').click();
 assert.equal(await page.locator('#scanResult').isVisible(),true);
 await page.locator('#paymentLink').fill('javascript:alert(1)');await page.locator('#checkLink').click();
 assert.equal(await page.locator('#scanResult').isVisible(),false);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#scanner').evaluate(e=>e.open),false);
 if(width===390 && language==='fa' && theme==='dark'){
  await page.evaluate(()=>{window.__originalCamera=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError')};});
  await page.locator('.scan-banner [data-scan]').click();await page.waitForFunction(()=>document.getElementById('scanStatus').classList.contains('error'));
  await page.locator('#closeScanner').click();
  assert.equal(await page.locator('#camera').evaluate(e=>e.srcObject),null);
  await page.evaluate(async()=>{window.__lateStream=await __originalCamera({video:true});navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.__resolveCamera=resolve);});
  await page.locator('.scan-banner [data-scan]').click();await page.locator('#closeScanner').click();
  await page.evaluate(()=>__resolveCamera(__lateStream));
  await page.waitForFunction(()=>__lateStream.getTracks().every(t=>t.readyState==='ended'));
  await page.evaluate(()=>navigator.mediaDevices.getUserMedia=__originalCamera);
  await page.locator('.scan-banner [data-scan]').click();await page.waitForFunction(()=>document.getElementById('camera').srcObject?.active);
  await page.evaluate(()=>{window.__hiddenTracks=document.getElementById('camera').srcObject.getTracks();Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.ok(await page.evaluate(()=>__hiddenTracks.every(t=>t.readyState==='ended')));
  await page.evaluate(()=>{delete document.hidden;});await page.locator('#closeScanner').click();
 }
 await page.locator('#piAuth').click();assert.equal(await page.locator('#scanner').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>window.__authCalls||0),0);await page.locator('#closeScanner').click();
 assert.equal(await page.locator('#piDebug').count(),0);
 assert.equal(await page.locator('#piUser').isVisible(),false);
 offline=true;await page.locator('#reloadPlans').click();await page.waitForFunction(()=>document.getElementById('plansStatus').classList.contains('error'));assert.equal(await page.locator('.plan').count(),0);
 offline=false;await page.locator('#reloadPlans').click();await page.waitForSelector('.plan');
 if(width===1280||width===390){await page.screenshot({path:path.resolve(__dirname,`../preview-${language}-${theme}-${width}.png`),fullPage:true});}
 assert.deepEqual(errors,[]);await context.close();cases++;
}
await browser.close();console.log('PASS '+cases+' real Chromium scenarios: layout, themes, directions, camera start/stop, actual QR decoding, unsafe links, Pi mock, plan retry.');
})().catch(e=>{console.error(e);process.exit(1)});
