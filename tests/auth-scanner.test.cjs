const {test}=require('node:test'),assert=require('node:assert/strict');
const {authLink,checkoutLink}=require('../web/assets/home-policy.js');
const base='https://fileorganizercore.ir/index.html',secret='a'.repeat(64);
test('auth scanner accepts only same-origin dedicated login route with browser secret',()=>{
 for(const route of ['/pi-login.html','/pi-login']){
  const u=authLink('https://fileorganizercore.ir'+route+'#'+secret+'?lang=fa&theme=dark',base);
  assert.equal(u.pathname,'/pi-login.html');assert.equal(u.hash,'#'+secret+'?lang=fa&theme=dark');
 }
});
test('auth scanner rejects foreign hosts, payment tokens, injected routes and duplicate parameters',()=>{
 const bad=['https://evil.example/pi-login.html#'+secret,'https://fileorganizercore.ir/checkout.html?token=x','javascript:alert(1)','https://user@fileorganizercore.ir/pi-login.html#'+secret,'http://fileorganizercore.ir/pi-login.html#'+secret,'https://fileorganizercore.ir/pi-login.html?redirect=evil#'+secret,'https://fileorganizercore.ir/pi-login.html#short','https://fileorganizercore.ir/pi-login.html#'+secret+'?lang=en&lang=fa','https://fileorganizercore.ir/pi-login.html#'+secret+'?redirect=evil','https://fileorganizercore.ir/pi-login.html#'+secret+'?theme=other'];
 for(const raw of bad)assert.equal(authLink(raw,base),null,raw);
 assert.equal(checkoutLink('https://fileorganizercore.ir/pi-login.html#'+secret,base),null);
});
