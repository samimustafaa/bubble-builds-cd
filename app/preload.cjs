'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const invoke=async(channel,...args)=>{const r=await ipcRenderer.invoke(channel,...args);if(!r.ok)throw Error(r.error);return r.value;};
contextBridge.exposeInMainWorld('builds',{state:()=>invoke('state'),choose:()=>invoke('choose'),apply:(p,a)=>invoke('apply',p,a),restore:()=>invoke('restore'),backups:()=>invoke('backups'),check:()=>invoke('check'),update:()=>invoke('update'),onProgress:f=>ipcRenderer.on('progress',(_,s)=>f(s)),onGame:f=>ipcRenderer.on('game-state',(_,s)=>f(s)),onUpdate:f=>ipcRenderer.on('update-state',(_,s)=>f(s))});
