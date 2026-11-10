const { chromium } = require(require.resolve('playwright', {paths:[process.cwd(), process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const fs=require('fs'), path=require('path'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../web');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
let runs=0;
for(const lang of ['en','fa','ar','ur','tr','ru','zh-hans','zh-hant','id','vi','es','fr','de','hi','ja','ko','it','pt','az']){
 for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:lang==='en'?1280:390,height:900},colorScheme:theme});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='backend.invalid')return route.fulfill({json:{status:'pending',hasLinkedPayment:false,plan:'max',amountPi:'118.2557491'}});
   if(u.hostname==='sdk.minepi.com')return route.fulfill({body:'',contentType:'application/javascript'});
   if(u.pathname==='/config.js')return route.fulfill({body:'window.FOP_CONFIG={SUPABASE_URL:"https://backend.invalid",SUPABASE_ANON_KEY:"mock"}',contentType:'application/javascript'});
   const file=path.join(root,u.pathname);
   return fs.existsSync(file)?route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.ico')?'image/x-icon':file.endsWith('.js')?'application/javascript':'text/html'}):route.abort();
  });
  await page.goto('https://checkout.invalid/checkout.html?token=mock&lang='+lang);
  await page.waitForFunction(()=>document.body.dataset.state==='ready');
  assert.equal(await page.locator('html').getAttribute('dir'),['fa','ar','ur'].includes(lang)?'rtl':'ltr');
  assert.ok(await page.locator('#payButton').isVisible());
  assert.equal(await page.locator('#details').isVisible(),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await page.locator('#checkout-heading').textContent());
  for(const state of ['success','waiting','error','closed']){
   await page.evaluate(state=>{document.body.dataset.state=state;document.querySelector('#status').textContent=window.FOP_I18N.text[state==='waiting'?'unfinished':state==='closed'?'closed':state];},state);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.evaluate(()=>{document.body.dataset.state='ready';document.querySelector('#status').textContent=window.FOP_I18N.text.ready;});
  if(['en','fa'].includes(lang))await page.screenshot({path:path.resolve(__dirname,`../preview-${lang}-${theme}.png`),fullPage:true});
  await page.setViewportSize({width:320,height:740});
  assert.equal(await page.locator('#payment-diagnostics').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  await page.close();runs++;
 }
}
console.log('PASS '+runs+' language/theme cases; ready/state layouts, 320px overflow, no diagnostics, no script errors.');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
