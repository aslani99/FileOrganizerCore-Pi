const test=require('node:test'),assert=require('node:assert/strict');
const p=require('../web/assets/home-policy.js');
const base='https://fileorganizerpro.mohammadaslanidev.ir/web/index.html';
const good='https://fileorganizerpro.mohammadaslanidev.ir/web/checkout.html?token=test-123';
test('accepts only matching checkout routes and preserves token',()=>{
 assert.equal(p.checkoutLink(good,base).searchParams.get('token'),'test-123');
 assert.ok(p.checkoutLink(good+'&lang=fa',base));
 assert.ok(p.checkoutLink('https://aslani99.github.io/FileOrganizerPro-Pi/web/checkout.html?token=test',base));
});
test('rejects scripts, foreign hosts, credentials, wrong paths and duplicate tokens',()=>{
 for(const url of ['javascript:alert(1)','https://evil.example/checkout.html?token=x',good.replace('.ir/','.ir.evil/'),good.replace('/web/checkout.html','/redirect'),good+'&token=second',good+'&redirect=https://evil.example',good+'#fragment',good.replace('https://','http://'),good.replace('https://','https://user:pass@'),good.replace('test-123',''),good.replace('test-123','x'.repeat(513))])assert.equal(p.checkoutLink(url,base),null,url);
});
test('download allows https and refuses placeholder and executable URL schemes',()=>{
 for(const value of ['#','javascript:alert(1)','data:text/html,x','http://example.com/a.exe'])assert.equal(p.downloadLink(value),null);
 assert.ok(p.downloadLink('https://example.com/release/app.exe'));
});
test('Pi estimate expires at thirty minutes and rejects missing, manual, future or invalid rates',()=>{
 const now=Date.now(),plan={pi_amount:'12.345',pi_rate_updated_at:new Date(now).toISOString(),pi_rate_source:'coingecko'};
 assert.equal(p.freshPi(plan,now),12.345);
 for(const values of [{pi_amount:0},{pi_amount:-1},{pi_amount:'bad'},{pi_rate_source:'manual'},{pi_rate_source:''},{pi_rate_updated_at:new Date(now-1800001).toISOString()},{pi_rate_updated_at:new Date(now+90001).toISOString()}])assert.equal(p.freshPi({...plan,...values},now),null);
});
test('plans use plan_id, accept real 9 GiB quota and never invent a missing price',()=>{
 const free={plan_id:'free',price_usd:0,duration_days:30,organization_limit_bytes:9663676416};
 assert.equal(p.validPlans([free]).length,1);
 for(const changes of [{price_usd:null},{price_usd:''},{duration_days:0},{organization_limit_bytes:null},{organization_limit_bytes:-1},{is_active:false},{plan_id:'unknown'}])assert.equal(p.validPlans([{...free,...changes}]).length,0);
 assert.equal(p.validPlans([free,free]).length,1);
});
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../web/index.html'),'utf8');
const redirect=html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('legacy root links preserve token and language on the same checkout host',()=>{
 let destination;
 vm.runInNewContext(redirect,{URL,URLSearchParams,location:{search:'?token=old-123&lang=fa&redirect=https://evil.example',href:'https://example.test/web/index.html?token=old-123',replace:value=>destination=value}});
 assert.equal(destination,'https://example.test/web/checkout.html?token=old-123&lang=fa');
});
test('normal home visit does not redirect',()=>{
 let redirected=false;
 vm.runInNewContext(redirect,{URL,URLSearchParams,location:{search:'?lang=en',href:'https://example.test/web/index.html',replace:()=>redirected=true}});
 assert.equal(redirected,false);
});
