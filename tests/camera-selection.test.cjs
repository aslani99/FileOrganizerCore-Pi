const test=require('node:test'),assert=require('node:assert/strict');
const {preferredCamera,cameraRank}=require('../web/assets/home-policy.js');
const d=(deviceId,label)=>({kind:'videoinput',deviceId,label});
const cameras=[d('front','Front camera'),d('ultra','Back Ultra Wide 0.5x'),d('main','Back camera 1x'),d('tele','Rear telephoto')];
test('select main rear instead of default ultra wide; plain wide is not ultra wide',()=>{
 assert.equal(preferredCamera(cameras,'ultra',''),'main');assert.ok(cameraRank('Back Wide camera')>cameraRank('Back Ultra Wide'));
});
test('manual preference wins; missing saved ID falls back to available main',()=>{
 assert.equal(preferredCamera(cameras,'ultra','tele'),'tele');assert.equal(preferredCamera(cameras,'ultra','removed'),'main');
});
test('unknown labels preserve current device; no device available is tolerated',()=>{
 assert.equal(preferredCamera([d('a',''),d('b','')],'b',''),'b');assert.equal(preferredCamera([],'',''),'');
});
