'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('builds',{importSeason3:()=>ipcRenderer.invoke('ui-import-season3'),state:()=>ipcRenderer.invoke('ui-state'),choose:()=>ipcRenderer.invoke('ui-choose'),apply:(id,animated)=>ipcRenderer.invoke('ui-apply',id,animated),restore:()=>ipcRenderer.invoke('ui-restore'),backups:async()=>{},check:async()=>{},update:async()=>{},onProgress:()=>{},onGame:()=>{},onUpdate:()=>{}});
