(() => {
  'use strict';
  const $ = id => document.getElementById(id), cfg = window.FOP_CONFIG || {}, policy = window.FOP_HOME_POLICY;
  const text = window.FOP_HOME_TEXT;
  const diagnostics = [];
  function trace(stage) {
    // Call with fixed literals only; never record URLs, errors, SDK payloads or identity.
    diagnostics.push(new Date().toISOString() + ' ' + stage);
    if (diagnostics.length > 50) diagnostics.shift();
    $('piDebugLog').textContent = diagnostics.join('\n');
  }
  window.addEventListener('error', () => trace('BROWSER_SCRIPT_ERROR'));
  window.addEventListener('unhandledrejection', () => trace('ASYNC_ERROR'));
  trace('HOME_READY');
  const readPref = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const writePref = (k,v) => { try { localStorage.setItem(k,v); } catch { } };
  const locale = window.FOP_HOME_LOCALE;
  const browserLanguages = () => [...(navigator.languages || []), navigator.language];
  let choice = locale.choice(readPref('fop-home-language'), new URLSearchParams(location.search).get('lang'));
  let language = locale.resolve(choice, browserLanguages());
  $('language').replaceChildren(...[['auto',''], ...Object.entries(locale.names)].map(([value,label]) => { const o=document.createElement('option');o.value=value;o.textContent=label;return o; }));
  let T = text[language], currentPlans = [], selectedPlan = '', piUsername = '', piBusy = false, sdkPromise;
  let requestingCamera = false, stream = null, scanTimer = null, epoch = 0, facing = 'environment', torchOn = false, resultURL = null;
  let plansController = null, plansGeneration = 0, plansState = 'loading', scannerMessage = 'cameraHint', scannerError = false, piMessage = 'piExplain';
  const paths = {
    folder:'M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z M8 13l3 3 5-5',
    scan:'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6 M8 8h3v3H8Zm5 0h3v3h-3Zm-5 5h3v3H8Zm5 0h3v3h-3Z',
    sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    image:'M4 3h16v18H4Z M4 16l5-5 4 4 3-3 4 4 M15 7h.01',
    video:'M3 6h12v12H3Zm12 4 6-3v10l-6-3',
    document:'M5 3h9l5 5v13H5Zm9 0v5h5M8 12h8m-8 4h6',
    audio:'M9 17V5l11-2v12M9 8l11-2M9 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0m11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    arrow:'M4 12h16m-6-6 6 6-6 6',check:'m5 12 4 4L19 6',
    layers:'m12 3-9 5 9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
    copy:'M8 8h13v13H8ZM16 8V3H3v13h5',activity:'M2 12h5l3-8 4 16 3-8h5',
    shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
    chart:'M4 3v18h17M8 17v-5m5 5V7m5 10V4',globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
    refresh:'M20 7a9 9 0 0 0-15-2L3 8m0-5v5h5m-4 9a9 9 0 0 0 15 2l2-3m0 5v-5h-5',close:'m6 6 12 12M6 18 18 6'
  };
  document.querySelectorAll('[data-icon]').forEach(el => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    for (const [k,v] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.6','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'})) svg.setAttribute(k,v);
    const p = document.createElementNS(svg.namespaceURI,'path'); p.setAttribute('d',paths[el.dataset.icon] || paths.folder); svg.append(p); el.append(svg);
  });
  const number = n => new Intl.NumberFormat(language,{maximumFractionDigits:7}).format(n);
  function scanStatus(key, error = false) { scannerMessage = key; scannerError = error; $('scanStatus').textContent = T[key]; $('scanStatus').classList.toggle('error',error); }
  function piStatus(key, error = false) { piMessage = key; $('piStatus').textContent = T[key]; $('piStatus').classList.toggle('error',error); }
  function applyLanguage() {
    for(const id of ['privacyStatus','piDebugState']){const el=$(id);if(el){const key=Object.keys(T).find(k=>T[k]===el.textContent);if(key)el.textContent=text[language][key];}}
    T = text[language]; document.documentElement.lang = language; document.documentElement.dir = locale.rtl.includes(language) ? 'rtl' : 'ltr';
    $('language').value = choice;
    $('language').options[0].textContent = T.browserLanguage;
    $('language').setAttribute('aria-label',T.languageLabel);
    $('language').title=T.languageLabel+' — '+(choice==='auto'?T.browserLanguage:locale.names[choice]);
    $('piShortcut').setAttribute('aria-label',T.piLogin);$('piShortcut').title=T.piLogin;
    $('theme').title=T.themeLabel;
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = T[el.dataset.t]; });
    $('theme').setAttribute('aria-label',T.themeLabel);
    $('closeScanner').setAttribute('aria-label',T.closeLabel); $('closePrivacy').setAttribute('aria-label',T.closeLabel);
    $('switchCamera').setAttribute('aria-label',T.switchLabel); document.querySelector('nav').setAttribute('aria-label',T.navLabel);
    document.title = 'FileOrganizerPro — ' + T.eyebrow;
    renderPlans(); wireDownload(); scanStatus(scannerMessage,scannerError); piStatus(piMessage,$('piStatus').classList.contains('error'));
    $('stopCamera').textContent=(stream||requestingCamera)?T.cameraStop:T.cameraStart;
    renderPi(); renderSelected();
  }
  function renderSelected() { $('selectedPlan').textContent = selectedPlan ? T.selected+' '+T[selectedPlan]+'. '+T.selectNote : T.selectNote; }
  function renderPi() { $('piUser').hidden = !piUsername; $('piUser').textContent = piUsername ? T.piConnected+' '+piUsername : ''; $('piAuth').textContent = piUsername ? T.disconnect : T.piLogin; $('piAuth').disabled = piBusy; }
  function applyTheme(value) { document.body.dataset.theme = value; $('theme').setAttribute('aria-pressed',String(value === 'light')); }
  const browserTheme = matchMedia('(prefers-color-scheme:dark)');
  let manualTheme = ['light','dark'].includes(readPref('fop-home-theme')) ? readPref('fop-home-theme') : null;
  const systemTheme = () => browserTheme.matches ? 'dark' : 'light';
  applyTheme(manualTheme || systemTheme());
  const followTheme = () => { if(!manualTheme)applyTheme(systemTheme()); };
  if(browserTheme.addEventListener)browserTheme.addEventListener('change',followTheme);else browserTheme.addListener(followTheme);
  $('theme').onclick = () => { manualTheme = document.body.dataset.theme === 'light'?'dark':'light'; applyTheme(manualTheme);writePref('fop-home-theme',manualTheme); };
  $('language').onchange = () => { choice = $('language').value;writePref('fop-home-language',choice);language=locale.resolve(choice,browserLanguages());applyLanguage(); };
  window.addEventListener('languagechange',()=>{if(choice==='auto'){language=locale.resolve(choice,browserLanguages());applyLanguage();}});
  $('year').textContent = new Date().getFullYear();
  function wireDownload() {
    const url = policy.downloadLink(cfg.DOWNLOAD_URL);
    $('downloadButton').hidden = !url;
    if (url) { $('downloadButton').href = url; $('downloadButton').rel = 'noopener noreferrer'; }
    else $('downloadButton').removeAttribute('href');
    $('downloadStatus').textContent = url ? '' : T.noDownload;
  }
  const node = (tag, value, className) => { const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el; };
  function renderPlans() {
    $('pricingGrid').replaceChildren();
    $('plansStatus').textContent = plansState === 'ok' ? '' : T[plansState];
    $('plansStatus').classList.toggle('error',plansState==='plansError');
    $('reloadPlans').disabled = plansState==='loading';
    for (const plan of currentPlans) {
      const card=node('article','', 'plan'+(plan.plan_id==='max'?' highlight':''));
      card.append(node('h3',T[plan.plan_id]));
      card.append(node('bdi',Number(plan.price_usd)===0?T.free:new Intl.NumberFormat(language,{style:'currency',currency:'USD'}).format(Number(plan.price_usd)),'plan-price'));
      card.append(node('p',number(Number(plan.duration_days))+' '+T.days,'duration'));
      card.append(node('p',plan.organization_limit_bytes==null?T.unlimited:T.totalQuota+' '+number(Number(plan.organization_limit_bytes)/1024**3)+' '+T.gib,'quota'));
      if (Number(plan.price_usd)>0) {
        const estimate=policy.freshPi(plan);
        const line=node('p',estimate?T.estimated+': ':T.rateMissing,estimate?'estimate':'');
        if(estimate){const value=node('bdi',number(estimate)+' Pi');value.dir='ltr';line.append(value);}
        card.append(line);
      }
      const action=node('button',plan.plan_id==='free'?T.freeAction:T.choosePlan,'button'+(plan.plan_id==='max'?' primary':''));
      action.type='button';action.onclick=()=>{if(plan.plan_id==='free'){$('download').scrollIntoView({behavior:'smooth'});}else openScanner(plan.plan_id);};card.append(action);$('pricingGrid').append(card);
    }
  }
  async function loadPlans() {
    const generation=++plansGeneration;plansController?.abort();plansController=new AbortController();
    const controller=plansController;
    const timer=setTimeout(()=>controller.abort(),15000);
    currentPlans=[];plansState='loading';renderPlans();trace('PLANS_REQUEST');
    try {
      const origin=new URL(cfg.SUPABASE_URL);if(origin.protocol!=='https:'||!cfg.SUPABASE_ANON_KEY)throw Error();
      const fields='plan_id,price_usd,pi_amount,pi_rate_updated_at,pi_rate_source,duration_days,organization_limit_bytes,is_active,display_order';
      const response=await fetch(origin.origin+'/rest/v1/plans?select='+fields+'&is_active=eq.true&order=display_order.asc',{headers:{apikey:cfg.SUPABASE_ANON_KEY,Authorization:'Bearer '+cfg.SUPABASE_ANON_KEY},signal:controller.signal,cache:'no-store'});
      if(!response.ok)throw Error();const data=await response.json();if(generation!==plansGeneration)return;
      currentPlans=policy.validPlans(data);plansState=currentPlans.length?'ok':'noPlans';trace('PLANS_RESPONSE');
    }catch{if(generation===plansGeneration){plansState='plansError';trace('PLANS_FAILED');}}
    finally{clearTimeout(timer);if(generation===plansGeneration)renderPlans();}
  }
  $('reloadPlans').onclick=loadPlans;
  $('piDebugClear').onclick=()=>{diagnostics.length=0;$('piDebugLog').textContent='';$('piDebugState').textContent=T.diagnosticsCleared;};
  $('piDebugCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('piDebugLog').textContent);$('piDebugState').textContent=T.diagnosticsCopied;}catch{$('piDebugState').textContent=T.diagnosticsCopyFailed;}};
  // No token or image is persisted. Only the user can navigate to a validated checkout.
  function clearResult() { resultURL=null;$('scanResult').hidden=true;$('resultHost').textContent=''; }
  function stopCamera() {
    epoch++;clearTimeout(scanTimer);scanTimer=null;
    if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;
    $('camera').srcObject=null;$('cameraPlaceholder').hidden=false;
    requestingCamera=false;$('stopCamera').hidden=false;$('stopCamera').textContent=T.cameraStart;$('stopCamera').disabled=false;$('switchCamera').hidden=true;$('torch').hidden=true;torchOn=false;
  }
  function openScanner(plan='') {
    selectedPlan=plan;clearResult();$('paymentLink').value='';$('qrImage').value='';renderSelected();scanStatus('cameraHint');
    $('scanner').showModal();document.body.classList.add('modal-open');startCamera();
  }
  document.querySelectorAll('[data-scan]').forEach(button=>button.onclick=()=>openScanner());
  $('closeScanner').onclick=()=>{stopCamera();$('scanner').close();};
  $('scanner').addEventListener('cancel',stopCamera);
  $('scanner').addEventListener('close',()=>{stopCamera();clearResult();$('paymentLink').value='';$('qrImage').value='';document.body.classList.remove('modal-open');});
  $('stopCamera').onclick=()=>{if(stream||requestingCamera){stopCamera();scanStatus('cameraStopped');}else startCamera();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){const active=!!stream||requestingCamera;stopCamera();if(active)scanStatus('cameraStopped');}});
  window.addEventListener('pagehide',stopCamera);
  function acceptLink(raw) {
    clearResult();const url=policy.checkoutLink(raw,location.href,cfg.CHECKOUT_URL);
    if(!url){scanStatus('invalidQR',true);return false;}
    stopCamera();resultURL=url;$('resultHost').textContent=url.host+url.pathname;$('scanResult').hidden=false;scanStatus('foundQR');$('openPayment').focus();return true;
  }
  $('checkLink').onclick=()=>{stopCamera();acceptLink($('paymentLink').value);};
  $('paymentLink').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();$('checkLink').click();}});
  $('paymentLink').addEventListener('input',clearResult);
  $('openPayment').onclick=()=>{
    if(!resultURL)return;const safe=policy.checkoutLink(resultURL.href,location.href,cfg.CHECKOUT_URL);if(!safe)return;
    if(!safe.searchParams.has('lang'))safe.searchParams.set('lang',language);
    stopCamera();location.assign(safe.href);
  };
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
  function decode(source,width,height,limit=1100) {
    if(!ctx||!window.jsQR)throw Error();
    const scale=Math.min(1,limit/Math.max(width,height));canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    ctx.drawImage(source,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    return window.jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'})?.data || null;
  }
  async function startCamera() {
    stopCamera();clearResult();const ticket=epoch;
    if(!isSecureContext||!navigator.mediaDevices?.getUserMedia){scanStatus('cameraUnsupported',true);return;}
    if(!window.jsQR||!ctx){scanStatus('readerMissing',true);return;}
    requestingCamera=true;$('stopCamera').textContent=T.cameraStop;scanStatus('cameraRequest');
    try {
      const received=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720}}});
      if(ticket!==epoch||!$('scanner').open||document.hidden){received.getTracks().forEach(t=>t.stop());return;}
      stream=received;$('camera').srcObject=stream;await $('camera').play();
      if(ticket!==epoch)return;
      $('cameraPlaceholder').hidden=true;$('stopCamera').hidden=false;$('stopCamera').textContent=T.cameraStop;$('switchCamera').hidden=false;
      const track=stream.getVideoTracks()[0];$('torch').hidden=!track.getCapabilities?.().torch;scanStatus('cameraScanning');
      const tick=()=>{
        if(ticket!==epoch||!stream||!$('scanner').open)return;
        try { if($('camera').readyState>=2&&$('camera').videoWidth){const code=decode($('camera'),$('camera').videoWidth,$('camera').videoHeight);if(code&&acceptLink(code))return;} }
        catch {stopCamera();scanStatus('readerMissing',true);return;}
        scanTimer=setTimeout(tick,250);
      };tick();
    }catch(error){if(ticket===epoch){stopCamera();scanStatus(['NotAllowedError','SecurityError'].includes(error.name)?'cameraDenied':'cameraMissing',true);}}
    finally{if(ticket===epoch)requestingCamera=false;}
  }
  $('switchCamera').onclick=()=>{facing=facing==='environment'?'user':'environment';startCamera();};
  $('torch').onclick=async()=>{try{const track=stream?.getVideoTracks()[0];if(!track)return;await track.applyConstraints({advanced:[{torch:!torchOn}]});torchOn=!torchOn;$('torch').setAttribute('aria-pressed',String(torchOn));}catch{scanStatus('torchFailed',true);}};
  $('qrImage').onchange=async()=>{
    const file=$('qrImage').files[0];if(!file)return;stopCamera();clearResult();const ticket=epoch;scanStatus('imageReading');
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12*1024*1024){scanStatus('imageError',true);return;}
    let objectURL;
    try{
      if(!window.jsQR)throw Error();
      const image=new Image();objectURL=URL.createObjectURL(file);image.src=objectURL;await image.decode();
      if(ticket!==epoch||!$('scanner').open)return;
      if(image.naturalWidth*image.naturalHeight>40000000)throw Error();
      let value=decode(image,image.naturalWidth,image.naturalHeight,1600);
      if(!value)value=decode(image,image.naturalWidth,image.naturalHeight,900);
      if(!value)throw Error();acceptLink(value);
    }catch{if(ticket===epoch)scanStatus('imageError',true);}
    finally{if(objectURL)URL.revokeObjectURL(objectURL);$('qrImage').value='';}
  };
  function loadPiSDK() {
    if(window.Pi)return Promise.resolve();if(sdkPromise)return sdkPromise;
    sdkPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='https://sdk.minepi.com/pi-sdk.js';script.async=true;
      const timeout=setTimeout(()=>{script.remove();reject(Error());},15000);
      script.onload=()=>{clearTimeout(timeout);window.Pi?resolve():reject(Error());};script.onerror=()=>{clearTimeout(timeout);script.remove();reject(Error());};document.head.append(script);
    }).catch(error=>{sdkPromise=null;throw error;});return sdkPromise;
  }
  $('piAuth').onclick=async()=>{
    if(piBusy)return;
    if(piUsername){piUsername='';renderPi();piStatus('piExplain');return;}
    piBusy=true;renderPi();piStatus('piBusy');trace('PI_CONNECT_REQUEST');
    try{await loadPiSDK();trace('PI_SDK_LOADED');await window.Pi.init({version:'2.0',sandbox:cfg.PI_SANDBOX===true});
      trace('PI_AUTH_STARTED');const auth=await window.Pi.authenticate(['username'],()=>{});
      if(!auth?.user?.username)throw Error();piUsername=String(auth.user.username);piStatus('piExplain');trace('PI_AUTH_SUCCESS');
    }catch{piStatus('piFailed',true);trace('PI_AUTH_FAILED');}
    finally{piBusy=false;renderPi();}
  };
  $('privacy').onclick=()=>{$('privacyDialog').showModal();document.body.classList.add('modal-open');};
  $('closePrivacy').onclick=()=>$('privacyDialog').close();
  $('privacyDialog').addEventListener('close',()=>document.body.classList.remove('modal-open'));
  $('clearPrefs').onclick=()=>{try{localStorage.removeItem('fop-home-language');localStorage.removeItem('fop-home-theme');}catch{}choice='auto';language=locale.resolve(choice,browserLanguages());manualTheme=null;applyTheme(systemTheme());applyLanguage();$('privacyStatus').textContent=T.prefsCleared;};
  applyLanguage();loadPlans();
})();
