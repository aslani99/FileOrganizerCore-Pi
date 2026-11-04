const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const locale=require('../web/assets/home-locale.js'),root=path.resolve(__dirname,'../web');
(async()=>{
 const browser=await chromium.launch();let cases=0;
 for(const lang of Object.keys(locale.names))for(const theme of ['light','dark']){
  const context=await browser.newContext({locale:lang,viewport:{width:320,height:850},colorScheme:theme});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async r=>{const u=new URL(r.request().url());
   if(u.pathname==='/config.js')return r.fulfill({body:'window.FOP_CONFIG={}',contentType:'application/javascript'});
   const file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
   if(!file.startsWith(root)||!fs.existsSync(file))return r.abort();
   return r.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'});
  });
  await page.goto('https://home.test/');await page.waitForFunction(()=>window.FOP_HOME_LOCALE&&document.querySelector('#language').options.length===20);
  assert.equal(await page.locator('html').getAttribute('lang'),lang);
  assert.equal(await page.locator('html').getAttribute('dir'),locale.rtl.includes(lang)?'rtl':'ltr');
  assert.equal(await page.locator('#language').inputValue(),'auto');
  assert.equal(await page.locator('#language').evaluate(e=>getComputedStyle(e).opacity),'0');
  assert.ok(await page.locator('#piShortcut').getAttribute('aria-label'));
  assert.ok(await page.locator('.language-control').isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),lang+' overflow '+JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('header,header .brand,header .tools,header .tools>*')].map(e=>[e.id||e.className,e.getBoundingClientRect().width,getComputedStyle(e).minWidth,e.textContent.slice(0,30)]))));
  assert.ok(await page.evaluate(()=>{const a=document.querySelector('header .brand').getBoundingClientRect(),b=document.querySelector('header .tools').getBoundingClientRect();return a.right<=b.left&&Math.abs((a.top+a.height/2)-(b.top+b.height/2))<2;}),lang+' header wraps or overlaps');
  assert.ok(await page.evaluate(()=>[...document.querySelectorAll('[data-t]')].every(e=>e.textContent===FOP_HOME_TEXT[document.documentElement.lang][e.dataset.t])));
  await page.locator('#language').selectOption('de');await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'),'de');
  await page.locator('#language').selectOption('auto');assert.equal(await page.locator('html').getAttribute('lang'),lang);
  await page.evaluate(()=>{Object.defineProperty(navigator,'languages',{configurable:true,value:['nl-NL','fa-IR']});window.dispatchEvent(new Event('languagechange'));});
  assert.equal(await page.locator('html').getAttribute('lang'),'fa');
  await page.locator('#language').selectOption('ja');
  await page.evaluate(()=>window.dispatchEvent(new Event('languagechange')));assert.equal(await page.locator('html').getAttribute('lang'),'ja');
  assert.deepEqual(errors,[]);await context.close();cases++;
 }
 await browser.close();console.log(cases+' language/theme mobile cases passed, including manual persistence and browser language changes');
})().catch(e=>{console.error(e);process.exit(1)});
