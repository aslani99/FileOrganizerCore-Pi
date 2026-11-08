const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:["--no-sandbox"]});let count=0;
 try{for(const lang of ['fa','ar','ur','en','de','zh-Hans'])for(const colorScheme of ['light','dark']){
 const c=await browser.newContext({viewport:{width:320,height:780},colorScheme}),p=await c.newPage();let approved=0;const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='sdk.minepi.com')return r.fulfill({contentType:'application/javascript',body:'window.Pi={init(){},authenticate:async()=>({accessToken:"test-token"})}'});
 if(u.hostname==='backend.invalid'){const b=r.request().postDataJSON();assert.equal(b.browser_secret,'a'.repeat(64));if(b.action==='approve'){approved++;assert.equal(b.pi_token,'test-token');return r.fulfill({json:{state:'approved',username:'<img src=x onerror=alert(1)>'}})}return r.fulfill({json:{purpose:'link',code:'A1B2C3D4',state:'pending',expires_at:new Date(Date.now()+300000).toISOString()}})}
 if(u.pathname==='/config.js')return r.fulfill({contentType:'application/javascript',body:'window.FOP_CONFIG={SUPABASE_URL:"https://backend.invalid",SUPABASE_ANON_KEY:"public",PI_SANDBOX:false}'});
 return r.fulfill({path:path.join(__dirname,'../web',u.pathname)});
 });
 await p.goto('https://fileorganizercore.ir/pi-login.html#'+'a'.repeat(64)+'?lang='+lang);await p.waitForFunction(()=>document.getElementById('code').textContent==='A1B2C3D4');
 assert.equal(new URL(p.url()).hash,'');assert.equal(await p.locator('html').getAttribute('dir'),['fa','ar','ur'].includes(lang)?'rtl':'ltr');assert.equal(await p.locator('#approve').isDisabled(),true);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('#match').check();await p.locator('#approve').click();await p.waitForFunction(()=>document.getElementById('status').textContent.includes('<img'));
 assert.equal(approved,1);assert.equal(await p.locator('#status img').count(),0);assert.equal(await p.locator('#approve').isDisabled(),true);assert.deepEqual(errors,[]);await c.close();count++;
 }console.log('Passed '+count+' browser cases: RTL/LTR, themes, 320px, explicit approval, safe text, secret history removal.');}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
