/* Browser only approves a challenge; it never receives a desktop session. */
'use strict';
(() => {
 const $=id=>document.getElementById(id), texts=window.FOC_PI_TEXT, cfg=window.FOP_CONFIG||{};
 const fragment=location.hash.slice(1).split('?'), secret=fragment[0];
 const query=new URLSearchParams(fragment[1]||'');
 history.replaceState(null,'',location.pathname); // capability never retained in browser history
 const names={en:'English',fa:'فارسی',ar:'العربية',az:'Azərbaycanca',de:'Deutsch',es:'Español',fr:'Français',hi:'हिन्दी',id:'Bahasa Indonesia',it:'Italiano',ja:'日本語',ko:'한국어',pt:'Português',ru:'Русский',tr:'Türkçe',ur:'اردو',vi:'Tiếng Việt','zh-Hans':'简体中文','zh-Hant':'繁體中文'};
 const normalize=s=>texts[s]?s:s?.toLowerCase().startsWith('zh')?(/tw|hk|hant/i.test(s)?'zh-Hant':'zh-Hans'):texts[s?.split('-')[0]]?s.split('-')[0]:'en';
 let lang=normalize(query.get('lang')||navigator.language), challenge=null,busy=false,done=false,statusKey='waiting',statusName='';
 const t=k=>texts[lang]?.[k]||texts.en[k]||'';
 for(const [value,label]of Object.entries(names)){const o=document.createElement('option');o.value=value;o.textContent=label;$('language').append(o)}
 function render(){document.documentElement.lang=lang;document.documentElement.dir=['fa','ar','ur'].includes(lang)?'rtl':'ltr';$('language').value=lang;$('title').textContent=t(challenge?.purpose==='link'?'link':'login');$('help').textContent=t('open_browser');$('matchText').textContent=t('match');$('approve').textContent=t('browser_confirm');$('status').textContent=t(statusKey)+(statusName?' · '+statusName:'');$('approve').disabled=busy||done||!challenge||!$('match').checked||Date.parse(challenge.expires_at)<=Date.now()}
 $('language').addEventListener('change',()=>{lang=$('language').value;render()});$('match').addEventListener('change',render);
 async function call(body){const response=await fetch(cfg.SUPABASE_URL+'/functions/v1/pi-auth',{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.SUPABASE_ANON_KEY},body:JSON.stringify({...body,browser_secret:secret}),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(25000)});const r=await response.json();if(!response.ok)throw new Error(r.error||'error');return r}
 function error(e){statusKey=({expired:'expired',not_configured:'unavailable',identity_conflict:'conflict'})[e.message]||'error';render()}
 $('approve').addEventListener('click',async()=>{
  if(busy||done||!challenge||!$('match').checked)return;
  busy=true;render();
  try{
   if(!window.Pi)throw new Error('not_configured');
   await window.Pi.init({version:'2.0',sandbox:cfg.PI_SANDBOX===true});
   const auth=await window.Pi.authenticate(['username'],()=>{});
   if(!auth?.accessToken)throw new Error('error');
   const token=auth.accessToken;auth.accessToken='';
   const r=await call({action:'approve',pi_token:token});
   done=true;statusKey='browser_done';statusName=r.username||'';
  }catch(e){error(e)}finally{busy=false;render()}
 });
 render();
 if(!/^[a-f0-9]{64}$/.test(secret)){statusKey='expired';render();return}
 call({action:'inspect'}).then(r=>{challenge=r;$('code').textContent=r.code;if(r.state==='approved'){done=true;statusKey='browser_done'}else statusKey='match';render();const interval=setInterval(()=>{const seconds=Math.max(0,Math.ceil((Date.parse(r.expires_at)-Date.now())/1000));$('timer').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(!seconds){clearInterval(interval);if(!done)statusKey='expired';render()}},1000)}).catch(error);
})();
