const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();let errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  window.calls=[];window.tracks=[];window.constraints=[];
  localStorage.setItem('foc-camera-id','front');
  const cameras=[{kind:'videoinput',deviceId:'ultra',label:'Back Ultra Wide 0.5x'},{kind:'videoinput',deviceId:'main',label:'camera 0, facing back'},{kind:'videoinput',deviceId:'front',label:'Front camera'}];
  Object.defineProperty(navigator.mediaDevices,'enumerateDevices',{value:async()=>cameras});
  Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async options=>{
   const id=options.video.deviceId?.exact||'ultra';calls.push(id);
   if(window.deny)throw new DOMException('Denied','NotAllowedError');
   if(id==='removed')throw new DOMException('Missing','OverconstrainedError');
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,640,480);
   const stream=canvas.captureStream(10),track=stream.getVideoTracks()[0];tracks.push(track);
   track.getSettings=()=>({deviceId:id});track.getCapabilities=()=>({focusMode:['continuous'],zoom:{min:1,max:4}});
   track.applyConstraints=async q=>{constraints.push(q);if(window.failFocus)throw Error('Unsupported');};
   if(window.delay)await new Promise(resolve=>window.release=resolve);
   return stream;
  }});
 });
 await p.route('**/*',r=>{
  const u=new URL(r.request().url());if(u.hostname==='backend.invalid')return r.fulfill({json:[]});
  if(u.pathname==='/config.js')return r.fulfill({contentType:'application/javascript',body:'window.FOP_CONFIG={SUPABASE_URL:"https://backend.invalid",SUPABASE_ANON_KEY:"mock"}'});
  const file=path.join(__dirname,'../web',u.pathname==='/'?'index.html':u.pathname);
  if(!fs.existsSync(file))return r.fulfill({status:404,body:''});
  return r.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 await p.goto('https://fileorganizercore.ir/?lang=fa');await p.locator('#piAuth').click();
 await p.waitForFunction(()=>document.getElementById('camera').srcObject?.active);
 assert.deepEqual(await p.evaluate(()=>calls),['ultra','main']);assert.equal(await p.evaluate(()=>tracks[0].readyState),'ended');
 assert.equal(await p.locator('#cameraChoice,#switchCamera,#torch').count(),0);
 assert.ok(await p.evaluate(()=>constraints.some(c=>c.advanced[0].focusMode==='continuous')));
 await p.locator('#closeScanner').click();assert.ok(await p.evaluate(()=>tracks.every(t=>t.readyState==='ended')));
 await p.evaluate(()=>{window.failFocus=true;});await p.locator('.scan-banner [data-scan]').click();
 await p.waitForFunction(()=>document.getElementById('camera').srcObject?.active);assert.equal(await p.evaluate(()=>document.getElementById('camera').srcObject.getVideoTracks()[0].getSettings().deviceId),'main');
 await p.locator('#qrImage').setInputFiles(path.join(__dirname,'fixtures/payment-qr.png'));await p.locator('#scanResult').waitFor({state:'visible'});assert.ok(await p.evaluate(()=>tracks.every(t=>t.readyState==='ended')));
 await p.locator('#closeScanner').click();
 await p.evaluate(()=>{window.delay=true;});await p.locator('#piAuth').click();await p.waitForFunction(()=>typeof window.release==='function');await p.locator('#closeScanner').click();await p.evaluate(()=>release());await p.waitForFunction(()=>tracks.every(t=>t.readyState==='ended'));
 await p.evaluate(()=>{window.delay=false;window.deny=true;});await p.locator('#piAuth').click();await p.waitForFunction(()=>document.getElementById('scanStatus').classList.contains('error'));assert.equal(await p.locator('#camera').evaluate(e=>e.srcObject),null);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS automatic camera 0 selection in both scanners, obsolete manual preference ignored, controls removed, optional focus failure, payment QR decoding, late stream cleanup and permission rejection.');
})().catch(e=>{console.error(e);process.exit(1)});
