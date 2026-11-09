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

const {automaticCamera}=require('../web/assets/home-policy.js');
test('camera 0 facing back wins regardless of list order',()=>{
 const target=d('zero','camera 0, facing back');
 for(const list of [[...cameras,target],[target,...cameras]])assert.equal(automaticCamera(list,'ultra'),'zero');
 assert.equal(automaticCamera([d('front0','camera 0, facing front'),d('back10','camera 10, facing back'),d('zero','Camera 0, Facing Back')],'front0'),'zero');
});
test('other phones retain a sensible rear fallback',()=>{
 assert.equal(automaticCamera(cameras,'ultra'),'main');assert.equal(automaticCamera([],''),'');
});
