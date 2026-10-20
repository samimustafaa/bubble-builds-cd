'use strict';
function releaseFeed(value){const repo=String(value||'').trim();if(!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(repo))throw Error('Enter a GitHub repository as owner/repository.');return {repo,url:'https://github.com/'+repo+'/releases/latest/download'};}
class Updates{
 constructor(updater,{packaged,onState,canInstall}){
  this.u=updater;this.packaged=packaged;this.emit=onState;this.canInstall=canInstall;this.repo='';this.available=false;this.busy=false;this.installing=false;
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.autoRunAppAfterInstall=true;updater.disableDifferentialDownload=true;updater.disableWebInstaller=true;
  updater.on('update-available',i=>{this.available=true;this.emit({state:'available',version:i.version});});
  updater.on('update-not-available',()=>{this.available=false;this.emit({state:'current'});});
  updater.on('download-progress',i=>this.emit({state:'downloading',percent:Math.floor(i.percent)}));
  updater.on('error',e=>this.emit({state:'error',message:e.message}));
 }
 configure(repo){const f=releaseFeed(repo);this.repo=f.repo;this.u.setFeedURL({provider:'generic',url:f.url});this.available=false;return f.repo;}
 async check(){if(!this.repo){this.emit({state:'unlinked'});return;}if(!this.packaged)throw Error('Update checks run in the installed Windows app.');if(this.busy)return;this.busy=true;this.emit({state:'checking'});try{return await this.u.checkForUpdates();}catch(e){this.emit({state:'error',message:e.message});throw e;}finally{this.busy=false;}}
 async install(){
  if(!this.packaged||!this.repo||!this.available)throw Error('Check for a newer release first.');if(this.busy||!this.canInstall())throw Error('Wait for the current file operation.');this.busy=true;
  try{const r=await this.u.checkForUpdates();if(!r?.updateInfo?.version||!this.available)throw Error('No newer release is available.');const files=await this.u.downloadUpdate();if(!files?.length)throw Error('Update download did not complete.');this.installing=true;this.emit({state:'installing'});this.u.quitAndInstall(true,true);}catch(e){this.busy=false;this.emit({state:'error',message:e.message});throw e;}
 }
}
module.exports={Updates,releaseFeed};
