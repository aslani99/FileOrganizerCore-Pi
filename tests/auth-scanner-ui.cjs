const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const root=path.resolve(__dirname,'../web');let cases=0;
 for(const lang of ['en','fa','ar','zh-hans'])for(const theme of ['light','dark']){
  const c=await browser.newContext({viewport:{width:390,height:844},permissions:['camera'],colorScheme:theme,userAgent:'Mozilla/5.0 PiBrowser/1.0'}),p=await c.newPage(),errors=[];
  let approvals=0;p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='sdk.minepi.com')return route.fulfill({contentType:'application/javascript',body:'window.Pi={init:async()=>{},authenticate:async()=>({accessToken:"test-token"})}'});
   if(u.hostname==='backend.invalid'){
    if(u.pathname.includes('/pi-auth')){
     const b=route.request().postDataJSON();assert.equal(b.browser_secret,'a'.repeat(64));
     if(b.action==='approve'){approvals++;assert.equal(b.pi_token,'test-token');return route.fulfill({json:{state:'approved',username:'test-pioneer'}})}
     return route.fulfill({json:{state:'pending',purpose:'login',code:'A1B2C3D4',server_now:new Date().toISOString(),expires_at:new Date(Date.now()+300000).toISOString()}});
    }
    return route.fulfill({json:[{plan_id:'free',price_usd:0,duration_days:30,organization_limit_bytes:9663676416}]});
   }
   if(u.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.FOP_CONFIG={SUPABASE_URL:"https://backend.invalid",SUPABASE_ANON_KEY:"public",PI_SANDBOX:true}'});
   const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(!fs.existsSync(f))return route.fulfill({status:404,body:''});
   return route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});
  });
  await p.goto('https://fileorganizercore.ir/?lang='+lang);
  await p.locator('#piAuth').click();assert.equal(await p.locator('#scanner').evaluate(e=>e.open),true);
  await p.waitForFunction(()=>document.getElementById('camera').srcObject?.active);
  assert.equal(approvals,0,'opening camera never approves account');
  await p.locator('.manual').evaluate(e=>e.open=true);
  await p.locator('#paymentLink').fill('https://evil.example/pi-login.html#'+'a'.repeat(64));await p.locator('#checkLink').click();assert.equal(await p.locator('#scanResult').isVisible(),false);
  await p.locator('#paymentLink').fill('https://fileorganizercore.ir/pi-login.html#'+'a'.repeat(64)+'?lang='+lang+'&theme='+theme);await p.locator('#checkLink').click();
  assert.equal(await p.locator('#scanResult').isVisible(),true);assert.equal(await p.locator('#camera').evaluate(e=>e.srcObject),null);
  assert.equal(approvals,0);await p.locator('#openPayment').click();await p.locator('#codeValue').filter({hasText:'A1B2C3D4'}).waitFor();
  assert.equal(await p.locator('#approve').isEnabled(),false);await p.locator('#match').check();await p.locator('#approve').click();await p.locator('#accountName').filter({hasText:'test-pioneer'}).waitFor();
  assert.equal(approvals,1);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'approval page fits viewport');await p.locator('#returnHome').click();await p.locator('#piUser').filter({hasText:'test-pioneer'}).waitFor();
  assert.equal(await p.locator('#piUser').isVisible(),true);
  await p.locator('.scan-banner [data-scan]').click();await p.locator('#qrImage').setInputFiles(path.join(__dirname,'fixtures/payment-qr.png'));await p.locator('#scanResult').waitFor({state:'visible'});assert.ok((await p.locator('#resultHost').textContent()).includes('checkout.html'));await p.locator('#closeScanner').click();assert.equal(await p.locator('#camera').evaluate(e=>e.srcObject),null);
  assert.deepEqual(errors,[]);await c.close();cases++;
 }
 await browser.close();console.log(cases+' auth scanner/approval/return scenarios passed');
})().catch(e=>{console.error(e);process.exit(1)});
