const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 let count=0;
 async function scenario({lang='en',theme='light',width=320,lostReply=false,invalid=false,insidePi=false,nativePi=false}={}){
  const c=await browser.newContext({userAgent:insidePi?'Mozilla/5.0 PiBrowser/1.0':'Mozilla/5.0 Chrome/131.0',viewport:{width,height:860},colorScheme:theme==='light'?'dark':'light'}),p=await c.newPage();
  const errors=[];let approved=0,state='pending';p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const now=Date.now;Date.now=()=>now()+20*60*1000}); // Wrong client clock must not expire the server request.
  await p.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(u.hostname==='sdk.minepi.com')return r.fulfill({contentType:'application/javascript',body:'window.Pi={init(){},authenticate:async()=>({accessToken:"test-token"})'+(nativePi?',nativeFeaturesList:async()=>["inline_media"]':'')+'}'});
   if(u.hostname==='backend.invalid'){
    const b=r.request().postDataJSON();assert.equal(b.browser_secret,'a'.repeat(64));
    if(b.action==='approve'){
     approved++;state='approved';assert.equal(b.pi_token,'test-token');
     if(lostReply)return r.fulfill({status:503,json:{error:'temporarily_unavailable'}});
     return r.fulfill({json:{state,username:'<img src=x onerror=alert(1)>',server_now:new Date().toISOString()}});
    }
    await new Promise(resolve=>setTimeout(resolve,150));
    if(invalid)return r.fulfill({status:400,json:{error:'expired'}});
    return r.fulfill({json:{purpose:'link',code:'A1B2C3D4',state,username:state==='approved'?'<img src=x onerror=alert(1)>':null,expires_at:new Date(Date.now()+300000).toISOString(),server_now:new Date().toISOString()}});
   }
   if(u.pathname==='/config.js')return r.fulfill({contentType:'application/javascript',body:'window.FOP_CONFIG={SUPABASE_URL:"https://backend.invalid",SUPABASE_ANON_KEY:"public",PI_SANDBOX:true}'});
   return r.fulfill({path:path.join(__dirname,'../web',u.pathname)});
  });
  await p.goto('https://fileorganizercore.ir/pi-login.html#'+'a'.repeat(64)+'?lang='+lang+'&theme='+theme,{waitUntil:'domcontentloaded'});
  await p.locator('#codeSpinner').waitFor({state:'visible'});
  assert.equal(await p.locator('html').getAttribute('data-theme'),theme,'desktop theme overrides opposite OS theme');
  if(invalid){await p.locator('#status').waitFor({state:'visible'});assert.equal(await p.locator('#status').getAttribute('data-tone'),'error');assert.equal(await p.locator('#approve').isDisabled(),true)}
  else{
   await p.waitForFunction(()=>document.getElementById('codeValue').textContent==='A1B2C3D4');
   assert.equal(new URL(p.url()).hash,'');assert.equal(await p.locator('html').getAttribute('dir'),['fa','ar','ur'].includes(lang)?'rtl':'ltr');
   assert.equal(await p.locator('#browserNotice').isVisible(),!(insidePi||nativePi));
   assert.equal(await p.locator('#approve').isDisabled(),true);assert.match(await p.locator('#timer').innerText(),/^[45]:/,'timer uses server time, not skewed phone clock');
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
   const brand=await p.locator('.brand').evaluate(e=>({core:parseFloat(getComputedStyle(e.children[1]).fontSize),name:parseFloat(getComputedStyle(e.children[0]).fontSize),direction:getComputedStyle(e).direction}));
   assert.ok(brand.core>brand.name);assert.equal(brand.direction,'ltr');
   if(lang==='fa'&&width===320&&!lostReply){fs.mkdirSync('/tmp/auth-layout-previews',{recursive:true});await p.screenshot({path:'/tmp/auth-layout-previews/pending-'+theme+'.png',fullPage:true})}
   await p.locator('#match').check();await p.locator('#approve').click();await p.locator('#account').waitFor({state:'visible'});
   assert.equal(approved,1);assert.equal(await p.locator('#accountName').innerText(),'<img src=x onerror=alert(1)>');assert.equal(await p.locator('#account img').count(),0);
   assert.equal(await p.locator('#status').getAttribute('data-tone'),'success');assert.equal(await p.locator('#approve').isVisible(),false);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(lang==='fa'&&width===320&&!lostReply){fs.mkdirSync('/tmp/auth-layout-previews',{recursive:true});await p.screenshot({path:'/tmp/auth-layout-previews/'+theme+'.png',fullPage:true})}
  }
  assert.deepEqual(errors,[]);await c.close();count++;
 }
 try{
  for(const lang of ['en','fa','ar','ur','az','de','es','fr','hi','id','it','ja','ko','pt','ru','tr','vi','zh-Hans','zh-Hant'])
   for(const theme of ['light','dark'])await scenario({lang,theme});
  await scenario({lang:'fa',theme:'dark',width:560,lostReply:true});await scenario({invalid:true});await scenario({insidePi:true});await scenario({nativePi:true});
  console.log('Passed '+count+' browser cases: 19 locales, both explicit themes, loading, client clock skew, safe usernames, lost approval response and errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
