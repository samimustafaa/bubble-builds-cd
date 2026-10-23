'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('Windows Electron gallery supports nineteen bubble, wood and portrait presets without window overflow',{skip:process.platform!=='win32'},()=>{const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const output=execFileSync(require('electron'),[path.join(__dirname,'support/ui-main.cjs'),...(process.env.UI_SCREENSHOT?[process.env.UI_SCREENSHOT]:[])],{env,encoding:'utf8',timeout:60000});assert.match(output,/UI passed/);});
