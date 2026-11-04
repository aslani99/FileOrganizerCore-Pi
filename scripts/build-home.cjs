// Dependency-free: ship one complete runtime so partial asset publication cannot break actions.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../web/assets');
const files=['vendor/jsQR-1.4.0.js','home-policy.js','home-locale.js','home-i18n.js','home-v2.js'];
fs.writeFileSync(path.join(root,'home-runtime.js'),'/* jsQR 1.4.0 license:\n'+fs.readFileSync(path.join(root,'vendor/jsQR-LICENSE.txt'),'utf8')+'\n*/\n'+files.map(f=>'/* Source: '+f+' */\n'+fs.readFileSync(path.join(root,f),'utf8').replace(/[ \t]+$/gm,'')+'\n;').join('\n'));
