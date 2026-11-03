import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../web/checkout.js',import.meta.url),'utf8');
async function setup(options={}){
 const elements=new Map(),timers=new Map(),requests=[],events={};let timerId=0,created=0;
 const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',className:'',disabled:false,classList:{add(){},remove(){}},addEventListener(e,f){this[e]=f;}});return elements.get(id);};
 let current={status:'approved',hasLinkedPayment:true,amountPi:1,plan:'pro',...options.session};
 let broken=false;
 const texts={unfinished:'WAIT; DO NOT PAY AGAIN',checking:'CHECKING',success:'SUCCESS',syncPending:'SYNC',network:'NETWORK',pay:'PAY',ready:'READY'};
 const context={URLSearchParams,AbortSignal,Date,console,location:{search:'?token=current'},document:{getElementById:el,body:{dataset:{}}},
 setTimeout:(fn)=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),
 fetch:async(url,init)=>{requests.push({url,init});if(broken)throw new Error('offline');return {ok:true,json:async()=>url.includes('pi-complete')?{awaitingConfirmation:true,recoverySessionToken:'original'}:current};}
 };
 context.window={FOP_CONFIG:{SUPABASE_URL:'https://backend',SUPABASE_ANON_KEY:'public'},FOP_I18N:{text:texts,number:String},addEventListener:(name,fn)=>events[name]=fn};
 context.Pi=context.window.Pi={init:async()=>{},authenticate:async(scopes,cb)=>{if(options.incomplete)await cb({identifier:'old'});return {accessToken:'access'};},createPayment:async()=>{created++;}};
 vm.runInNewContext(code,context);
 const flush=async()=>{for(let n=0;n<8;n++)await new Promise(r=>setImmediate(r));};await flush();
 return {body:context.document.body,elements,requests,timers,events,get created(){return created},set(v){current=v},offline(v){broken=v},async click(){await el('payButton').click();await flush()},async tick(){const [id,fn]=timers.entries().next().value;timers.delete(id);await fn();await flush()}};
}
test('linked approval waits, polls, and never creates another payment',async()=>{
 const f=await setup();assert.equal(f.elements.get('payButton').textContent,'CHECKING');assert.equal(f.timers.size,1);
 await f.click();assert.equal(f.created,0);await f.tick();assert.equal(f.timers.size,1);
 f.set({status:'completed',subscriptionPendingSync:false});await f.tick();assert.equal(f.elements.get('status').textContent,'SUCCESS');assert.equal(f.timers.size,0);
});
test('incomplete callback on unlinked replacement follows original session, no SDK replacement',async()=>{
 const f=await setup({session:{status:'pending',hasLinkedPayment:false},incomplete:true});await f.click();assert.equal(f.created,0);
 await f.tick();assert.ok(f.requests.at(-1).url.endsWith('token=original'));
});
test('network error and pending activation retain one poll chain and disable purchase',async()=>{
 const f=await setup();await f.click();f.offline(true);await f.tick();assert.equal(f.timers.size,1);assert.equal(f.elements.get('payButton').disabled,true);
 f.offline(false);f.set({status:'completed',subscriptionPendingSync:true});await f.tick();assert.equal(f.timers.size,1);assert.equal(f.elements.get('status').textContent,'SYNC');
 f.events.pagehide();assert.equal(f.timers.size,0);
});
test('nineteen languages retain RTL configuration and use nonempty pending messages',async()=>{
 const code=await readFile(new URL('../web/checkout-i18n.js',import.meta.url),'utf8');
 for(const lang of ['en','fa','ar','ur','tr','ru','zh-hans','zh-hant','id','vi','es','fr','de','hi','ja','ko','it','pt','az']){
 const ctx={window:{},location:{search:'?lang='+lang},navigator:{language:lang},document:{documentElement:{}},URLSearchParams,Intl};vm.runInNewContext(code,ctx);
 assert.ok(ctx.window.FOP_I18N.text.unfinished.length>20);assert.equal(ctx.document.documentElement.dir,['fa','ar','ur'].includes(lang)?'rtl':'ltr');
 }
});

test('presentation follows confirmed success, waiting and network errors',async()=>{
 const f=await setup();assert.equal(f.body.dataset.state,'waiting');
 f.offline(true);await f.tick();assert.equal(f.body.dataset.state,'error');
 f.offline(false);f.set({status:'completed',subscriptionPendingSync:false});await f.tick();assert.equal(f.body.dataset.state,'success');
});
test('all presentation labels are localized for all nineteen languages',async()=>{
 const code=await readFile(new URL('../web/checkout-i18n.js',import.meta.url),'utf8');
 const ctx={window:{},location:{search:'?lang=fa'},navigator:{language:'en'},document:{documentElement:{}},URLSearchParams,Intl};vm.runInNewContext(code,ctx);
 assert.equal(Object.keys(ctx.window.FOP_CHECKOUT_TEXT).length,19);
 for(const labels of Object.values(ctx.window.FOP_CHECKOUT_TEXT)) for(const key of ['summary','heading','amountLabel','browserNote'])assert.ok(labels[key]?.length>0);
 assert.equal(ctx.document.documentElement.dir,'rtl');
});
