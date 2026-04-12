import{r as p,u as I,j as i,g as ne,R as ie}from"./react-vendor-D0Dg9dgZ.js";const Z=p.createContext(null);function Fe(){const e=p.useContext(Z);if(!e)throw new Error("useConfirm must be used inside ConfirmDialogProvider");return e}function Ve({children:e}){const{t:a}=I("common"),[t,s]=p.useState(null),o=p.useRef(null),d=p.useCallback(h=>new Promise(u=>{o.current=u,s(h)}),[]),c=p.useCallback(h=>{var u;(u=o.current)==null||u.call(o,h),o.current=null,s(null)},[]);return p.useEffect(()=>{if(!t)return;const h=u=>{u.key==="Escape"&&c(!1),u.key==="Enter"&&c(!0)};return window.addEventListener("keydown",h),()=>window.removeEventListener("keydown",h)},[t,c]),i.jsxs(Z.Provider,{value:{confirm:d},children:[e,t&&i.jsx("div",{className:"modal-overlay",onClick:()=>c(!1),children:i.jsxs("div",{className:"modal glass",onClick:h=>h.stopPropagation(),style:{maxWidth:420},children:[i.jsx("h3",{style:{marginBottom:t.message?8:24,fontSize:16},children:t.title}),t.message&&i.jsx("p",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:24,lineHeight:1.6},children:t.message}),i.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"flex-end"},children:[i.jsx("button",{className:"btn btn-ghost",onClick:()=>c(!1),children:a("buttons.cancel")}),i.jsx("button",{className:`btn ${t.danger!==!1?"btn-danger":"btn-primary"}`,onClick:()=>c(!0),autoFocus:!0,children:t.confirmLabel??a("buttons.confirm")})]})]})})]})}const de={},G=e=>{let a;const t=new Set,s=(g,b)=>{const x=typeof g=="function"?g(a):g;if(!Object.is(x,a)){const f=a;a=b??(typeof x!="object"||x===null)?x:Object.assign({},a,x),t.forEach(v=>v(a,f))}},o=()=>a,u={setState:s,getState:o,getInitialState:()=>k,subscribe:g=>(t.add(g),()=>t.delete(g)),destroy:()=>{(de?"production":void 0)!=="production"&&console.warn("[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."),t.clear()}},k=a=e(s,o,u);return u},ce=e=>e?G(e):G;var K={exports:{}},X={},Q={exports:{}},Y={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var w=p;function le(e,a){return e===a&&(e!==0||1/e===1/a)||e!==e&&a!==a}var ye=typeof Object.is=="function"?Object.is:le,he=w.useState,ue=w.useEffect,pe=w.useLayoutEffect,ge=w.useDebugValue;function me(e,a){var t=a(),s=he({inst:{value:t,getSnapshot:a}}),o=s[0].inst,d=s[1];return pe(function(){o.value=t,o.getSnapshot=a,D(o)&&d({inst:o})},[e,t,a]),ue(function(){return D(o)&&d({inst:o}),e(function(){D(o)&&d({inst:o})})},[e]),ge(t),t}function D(e){var a=e.getSnapshot;e=e.value;try{var t=a();return!ye(e,t)}catch{return!0}}function fe(e,a){return a()}var ke=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?fe:me;Y.useSyncExternalStore=w.useSyncExternalStore!==void 0?w.useSyncExternalStore:ke;Q.exports=Y;var xe=Q.exports;/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var N=p,be=xe;function ve(e,a){return e===a&&(e!==0||1/e===1/a)||e!==e&&a!==a}var Se=typeof Object.is=="function"?Object.is:ve,we=be.useSyncExternalStore,Oe=N.useRef,$e=N.useEffect,je=N.useMemo,Te=N.useDebugValue;X.useSyncExternalStoreWithSelector=function(e,a,t,s,o){var d=Oe(null);if(d.current===null){var c={hasValue:!1,value:null};d.current=c}else c=d.current;d=je(function(){function u(f){if(!k){if(k=!0,g=f,f=s(f),o!==void 0&&c.hasValue){var v=c.value;if(o(v,f))return b=v}return b=f}if(v=b,Se(g,f))return v;var O=s(f);return o!==void 0&&o(v,O)?(g=f,v):(g=f,b=O)}var k=!1,g,b,x=t===void 0?null:t;return[function(){return u(a())},x===null?void 0:function(){return u(x())}]},[a,t,s,o]);var h=we(e,d[0],d[1]);return $e(function(){c.hasValue=!0,c.value=h},[h]),Te(h),h};K.exports=X;var Pe=K.exports;const Ce=ne(Pe),ee={},{useDebugValue:Ee}=ie,{useSyncExternalStoreWithSelector:Me}=Ce;let W=!1;const _e=e=>e;function Ne(e,a=_e,t){(ee?"production":void 0)!=="production"&&t&&!W&&(console.warn("[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"),W=!0);const s=Me(e.subscribe,e.getState,e.getServerState||e.getInitialState,a,t);return Ee(s),s}const B=e=>{(ee?"production":void 0)!=="production"&&typeof e!="function"&&console.warn("[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`.");const a=typeof e=="function"?ce(e):e,t=(s,o)=>Ne(a,s,o);return Object.assign(t,a),t},R=e=>e?B(e):B,te="/api";async function r(e,a){const t=await fetch(`${te}${e}`,{cache:"no-store",headers:{"Content-Type":"application/json",...a==null?void 0:a.headers},credentials:"include",...a});if(!t.ok){const s=await t.json().catch(()=>({error:"Unknown error"}));throw new Error(s.detail??s.error??`HTTP ${t.status}`)}if(t.status!==204)return t.json()}const l={services:{list:()=>r("/services"),create:e=>r("/services",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/services/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/services/${e}`,{method:"DELETE"}),check:e=>r(`/services/${e}/check`,{method:"POST",body:JSON.stringify({})}),checkAll:()=>r("/services/check-all",{method:"POST",body:JSON.stringify({})}),uploadIcon:(e,a,t)=>r(`/services/${e}/icon`,{method:"POST",body:JSON.stringify({data:a,content_type:t})}),export:()=>fetch("/api/services/export",{credentials:"include"}).then(e=>e.blob()),import:e=>r("/services/import",{method:"POST",body:JSON.stringify({services:e})})},icons:{search:e=>r(`/icons/search?q=${encodeURIComponent(e)}`),download:(e,a)=>r("/icons/download",{method:"POST",body:JSON.stringify({name:e,format:a})}),upload:(e,a,t)=>r("/icons/upload",{method:"POST",body:JSON.stringify({data:e,content_type:a,name:t})})},groups:{list:()=>r("/groups"),create:e=>r("/groups",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/groups/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/groups/${e}`,{method:"DELETE"})},settings:{get:()=>r("/settings"),update:e=>r("/settings",{method:"PATCH",body:JSON.stringify(e)})},auth:{status:()=>r("/auth/status"),logout:()=>r("/auth/logout",{method:"POST",body:JSON.stringify({})}),me:()=>r("/auth/me")},appdataBackup:{status:async()=>{const a=(await r("/backup/status")).sources.find(t=>t.type==="ca_backup")??null;return a?a.error||a.success===!1?{status:"error",label:a.error?"Fehler":"Fehlgeschlagen",sourceFound:!0,lastRun:a.lastRun??null,error:a.error??null}:a.success===!0?{status:"ok",label:"OK",sourceFound:!0,lastRun:a.lastRun??null,error:null}:{status:"warning",label:"Unklar",sourceFound:!0,lastRun:a.lastRun??null,error:null}:{status:"warning",label:"Nicht eingerichtet",sourceFound:!1,lastRun:null,error:null}}},pollen:{status:()=>r("/pollen/topbar")},widgets:{list:()=>r("/widgets"),create:e=>r("/widgets",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/widgets/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/widgets/${e}`,{method:"DELETE"}),stats:e=>r(`/widgets/${e}/stats`),setAdGuardProtection:(e,a)=>r(`/widgets/${e}/adguard/protection`,{method:"POST",body:JSON.stringify({enabled:a})}),triggerButton:(e,a)=>r(`/widgets/${e}/trigger`,{method:"POST",body:JSON.stringify({button_id:a})}),haToggle:(e,a,t)=>r(`/widgets/${e}/ha/toggle`,{method:"POST",body:JSON.stringify({entity_id:a,current_state:t})}),setPiholeProtection:(e,a)=>r(`/widgets/${e}/pihole/protection`,{method:"POST",body:JSON.stringify({enabled:a})}),uploadIcon:(e,a,t)=>r(`/widgets/${e}/icon`,{method:"POST",body:JSON.stringify({data:a,content_type:t})})},dashboard:{list:()=>r("/dashboard"),createGroup:e=>r("/dashboard/groups",{method:"POST",body:JSON.stringify({name:e})}),updateGroup:(e,a)=>r(`/dashboard/groups/${e}`,{method:"PATCH",body:JSON.stringify(a)}),deleteGroup:e=>r(`/dashboard/groups/${e}`,{method:"DELETE"}),reorderGroups:e=>r("/dashboard/groups/reorder",{method:"PATCH",body:JSON.stringify({ids:e})}),moveItemToGroup:(e,a)=>r(`/dashboard/items/${e}/group`,{method:"PATCH",body:JSON.stringify({group_id:a})}),reorderGroupItems:(e,a)=>r(`/dashboard/groups/${e}/reorder-items`,{method:"PATCH",body:JSON.stringify({ids:a})}),addItem:(e,a)=>r("/dashboard/items",{method:"POST",body:JSON.stringify({type:e,ref_id:a})}),removeItem:e=>r(`/dashboard/items/${e}`,{method:"DELETE"}),removeByRef:(e,a)=>r("/dashboard/items/by-ref",{method:"DELETE",body:JSON.stringify({type:e,ref_id:a})}),reorder:e=>r("/dashboard/reorder",{method:"PATCH",body:JSON.stringify({ids:e})})},docker:{containers:()=>r("/docker/containers"),stats:e=>r(`/docker/containers/${e}/stats`),allStats:()=>r("/docker/stats"),control:(e,a)=>r(`/docker/containers/${e}/${a}`,{method:"POST",body:JSON.stringify({})})},backgrounds:{list:()=>r("/backgrounds"),mine:()=>r("/backgrounds/mine"),upload:(e,a,t)=>r("/backgrounds",{method:"POST",body:JSON.stringify({name:e,data:a,content_type:t})}),delete:e=>r(`/backgrounds/${e}`,{method:"DELETE"})},ha:{instances:{list:()=>r("/ha/instances"),create:e=>r("/ha/instances",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/ha/instances/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/ha/instances/${e}`,{method:"DELETE"}),test:e=>r(`/ha/instances/${e}/test`,{method:"POST",body:JSON.stringify({})}),states:e=>r(`/ha/instances/${e}/states`),persons:e=>r(`/ha/instances/${e}/persons`),areas:e=>r(`/ha/instances/${e}/areas`),entityArea:(e,a)=>r(`/ha/instances/${e}/entity-area?entity_id=${encodeURIComponent(a)}`),call:(e,a,t,s,o)=>r(`/ha/instances/${e}/call`,{method:"POST",body:JSON.stringify({domain:a,service:t,entity_id:s,service_data:o})})},energy:(e,a)=>r(`/ha/instances/${e}/energy?period=${a}`),panels:{list:()=>r("/ha/panels"),add:e=>r("/ha/panels",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/ha/panels/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/ha/panels/${e}`,{method:"DELETE"}),reorder:e=>r("/ha/panels/reorder",{method:"PATCH",body:JSON.stringify({ids:e})})},alerts:{list:()=>r("/ha/alerts"),create:e=>r("/ha/alerts",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/ha/alerts/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/ha/alerts/${e}`,{method:"DELETE"})},history:(e,a,t)=>r(`/ha/instances/${e}/history?entity_id=${encodeURIComponent(a)}&hours=${t}`),scenes:e=>r(`/ha/instances/${e}/scenes`),automations:e=>r(`/ha/instances/${e}/automations`),automationToggle:(e,a)=>r(`/ha/instances/${e}/automations/${encodeURIComponent(a)}/toggle`,{method:"POST",body:JSON.stringify({})}),automationTrigger:(e,a)=>r(`/ha/instances/${e}/automations/${encodeURIComponent(a)}/trigger`,{method:"POST",body:JSON.stringify({})}),floorplans:{list:()=>r("/ha/floorplans"),create:e=>r("/ha/floorplans",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/ha/floorplans/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/ha/floorplans/${e}`,{method:"DELETE"}),uploadImage:(e,a,t)=>r(`/ha/floorplans/${e}/image`,{method:"POST",body:JSON.stringify({data:a,content_type:t})}),deleteImage:e=>r(`/ha/floorplans/${e}/image`,{method:"DELETE"}),export:()=>r("/ha/floorplans/export"),import:e=>r("/ha/floorplans/import",{method:"POST",body:JSON.stringify(e)}),entities:{list:e=>r(`/ha/floorplans/${e}/entities`),add:(e,a)=>r(`/ha/floorplans/${e}/entities`,{method:"POST",body:JSON.stringify(a)}),update:(e,a,t)=>r(`/ha/floorplans/${e}/entities/${a}`,{method:"PATCH",body:JSON.stringify(t)}),remove:(e,a)=>r(`/ha/floorplans/${e}/entities/${a}`,{method:"DELETE"})}}},activity:{list:e=>{const a=e&&e!=="all"?`/activity?category=${encodeURIComponent(e)}`:"/activity";return r(a)}},admin:{guestVisibility:async()=>({services:[],arr:[],widgets:[]})},services_extra:{healthHistory:e=>r(`/services/${e}/health-history`)},network:{devices:{list:()=>r("/network/devices"),create:e=>r("/network/devices",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/network/devices/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/network/devices/${e}`,{method:"DELETE"})},wol:e=>r(`/network/devices/${e}/wol`,{method:"POST",body:JSON.stringify({})}),scan:e=>r(`/network/scan?subnet=${encodeURIComponent(e)}`),history:e=>r(`/network/devices/${e}/history`)},backup:{sources:{list:()=>r("/backup/sources"),create:e=>r("/backup/sources",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/backup/sources/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/backup/sources/${e}`,{method:"DELETE"})},status:()=>r("/backup/status"),dockerExport:()=>fetch("/api/backup/docker/export",{credentials:"include"}).then(e=>e.blob())},resources:{history:e=>r(`/resources/history${e?`?range=${e}`:""}`)},changelog:{list:()=>r("/changelog")},health:()=>r("/health"),serverTime:()=>r("/time"),unraid:{instances:{list:()=>r("/unraid/instances"),create:e=>r("/unraid/instances",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/unraid/instances/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/unraid/instances/${e}`,{method:"DELETE"}),reorder:e=>r("/unraid/instances/reorder",{method:"POST",body:JSON.stringify({ids:e})}),test:(e,a)=>r("/unraid/test",{method:"POST",body:JSON.stringify({url:e,api_key:a})})},ping:e=>r(`/unraid/${e}/ping`),info:e=>r(`/unraid/${e}/info`),array:e=>r(`/unraid/${e}/array`),parity:e=>r(`/unraid/${e}/parityhistory`),arrayStart:e=>r(`/unraid/${e}/array/start`,{method:"POST",body:JSON.stringify({})}),arrayStop:e=>r(`/unraid/${e}/array/stop`,{method:"POST",body:JSON.stringify({})}),parityStart:(e,a)=>r(`/unraid/${e}/parity/start`,{method:"POST",body:JSON.stringify({correct:a})}),parityPause:e=>r(`/unraid/${e}/parity/pause`,{method:"POST",body:JSON.stringify({})}),parityResume:e=>r(`/unraid/${e}/parity/resume`,{method:"POST",body:JSON.stringify({})}),parityCancel:e=>r(`/unraid/${e}/parity/cancel`,{method:"POST",body:JSON.stringify({})}),diskSpinUp:(e,a)=>r(`/unraid/${e}/disks/${encodeURIComponent(a)}/spinup`,{method:"POST",body:JSON.stringify({})}),diskSpinDown:(e,a)=>r(`/unraid/${e}/disks/${encodeURIComponent(a)}/spindown`,{method:"POST",body:JSON.stringify({})}),docker:e=>r(`/unraid/${e}/docker`),dockerControl:(e,a,t)=>r(`/unraid/${e}/docker/${encodeURIComponent(a)}/${t}`,{method:"POST",body:JSON.stringify({})}),dockerUpdate:(e,a)=>r(`/unraid/${e}/docker/${encodeURIComponent(a)}/update`,{method:"POST",body:JSON.stringify({})}),dockerUpdateAll:e=>r(`/unraid/${e}/docker/update-all`,{method:"POST",body:JSON.stringify({})}),vms:e=>r(`/unraid/${e}/vms`),vmControl:(e,a,t)=>r(`/unraid/${e}/vms/${encodeURIComponent(a)}/${t}`,{method:"POST",body:JSON.stringify({})}),shares:e=>r(`/unraid/${e}/shares`),users:e=>r(`/unraid/${e}/users`),notifications:e=>r(`/unraid/${e}/notifications`),notificationsArchive:e=>r(`/unraid/${e}/notifications/archive`),archiveNotification:(e,a)=>r(`/unraid/${e}/notifications/archive/${encodeURIComponent(a)}`,{method:"POST",body:JSON.stringify({})}),archiveAllNotifications:e=>r(`/unraid/${e}/notifications/archive-all`,{method:"POST",body:JSON.stringify({})}),config:e=>r(`/unraid/${e}/config`),physicalDisks:e=>r(`/unraid/${e}/physicaldisks`),diskMount:(e,a)=>r(`/unraid/${e}/disks/${encodeURIComponent(a)}/mount`,{method:"POST",body:JSON.stringify({})}),diskUnmount:(e,a)=>r(`/unraid/${e}/disks/${encodeURIComponent(a)}/unmount`,{method:"POST",body:JSON.stringify({})}),services:e=>r(`/unraid/${e}/services`),flash:e=>r(`/unraid/${e}/flash`),server:e=>r(`/unraid/${e}/server`),network:e=>r(`/unraid/${e}/network`),connect:e=>r(`/unraid/${e}/connect`),upsDevices:e=>r(`/unraid/${e}/ups/devices`),upsConfig:e=>r(`/unraid/${e}/ups/configuration`),configureUps:(e,a)=>r(`/unraid/${e}/ups/configure`,{method:"POST",body:JSON.stringify(a)}),logs:e=>r(`/unraid/${e}/logs`),logFile:(e,a,t)=>r(`/unraid/${e}/logs/${encodeURIComponent(a)}${t?`?lines=${t}`:""}`),plugins:e=>r(`/unraid/${e}/plugins`),removePlugin:(e,a)=>r(`/unraid/${e}/plugins`,{method:"DELETE",body:JSON.stringify({names:a})}),apiKeys:e=>r(`/unraid/${e}/apikeys`),createApiKey:(e,a)=>r(`/unraid/${e}/apikeys`,{method:"POST",body:JSON.stringify(a)}),deleteApiKey:(e,a)=>r(`/unraid/${e}/apikeys/${encodeURIComponent(a)}`,{method:"DELETE"}),dockerNetworks:e=>r(`/unraid/${e}/docker/networks`),portConflicts:e=>r(`/unraid/${e}/docker/port-conflicts`),removeDockerContainer:(e,a,t)=>r(`/unraid/${e}/docker/${encodeURIComponent(a)}${t?"?withImage=true":""}`,{method:"DELETE"}),createNotification:(e,a)=>r(`/unraid/${e}/notifications`,{method:"POST",body:JSON.stringify(a)}),deleteNotificationPerm:(e,a,t)=>r(`/unraid/${e}/notifications/${encodeURIComponent(a)}?type=${t}`,{method:"DELETE"}),metrics:e=>r(`/unraid/${e}/metrics`)},bookmarks:{list:()=>r("/bookmarks"),create:(e,a,t)=>r("/bookmarks",{method:"POST",body:JSON.stringify({name:e,url:a,description:t})}),update:(e,a)=>r(`/bookmarks/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/bookmarks/${e}`,{method:"DELETE"}),uploadIcon:(e,a,t)=>r(`/bookmarks/${e}/icon`,{method:"POST",body:JSON.stringify({data:a,content_type:t})}),toggleDashboard:(e,a)=>r(`/bookmarks/${e}/dashboard`,{method:"PATCH",body:JSON.stringify({show:a})}),export:async()=>{const e=await fetch(`${te}/bookmarks/export`,{credentials:"include",cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.blob()},import:e=>r("/bookmarks/import",{method:"POST",body:JSON.stringify({bookmarks:e})})},instances:{list:()=>r("/instances"),create:e=>r("/instances",{method:"POST",body:JSON.stringify(e)}),update:(e,a)=>r(`/instances/${e}`,{method:"PATCH",body:JSON.stringify(a)}),delete:e=>r(`/instances/${e}`,{method:"DELETE"}),test:e=>r(`/instances/${e}/test`,{method:"POST",body:JSON.stringify({})}),reorder:e=>r("/instances/reorder",{method:"POST",body:JSON.stringify({ids:e})})},helbackup:{health:()=>r("/helbackup/health"),status:()=>r("/helbackup/status"),jobs:()=>r("/helbackup/jobs"),backups:()=>r("/helbackup/backups"),history:e=>{const a=new URLSearchParams;e!=null&&e.jobId&&a.set("jobId",e.jobId),e!=null&&e.status&&a.set("status",e.status),e!=null&&e.limit&&a.set("limit",String(e.limit));const t=a.toString();return r(`/helbackup/history${t?`?${t}`:""}`)},streamToken:e=>r(`/helbackup/logs/${e}/stream-token`,{method:"POST",body:JSON.stringify({})}),triggerJob:e=>r(`/helbackup/jobs/${e}/trigger`,{method:"POST",body:JSON.stringify({})})}};function Ae(e){return e.icon_url?e.icon_url:e.icon_id?`/api/icons/${e.icon_id}`:e.icon&&/^https?:\/\//i.test(e.icon)?e.icon:null}const Ze=Object.freeze(Object.defineProperty({__proto__:null,api:l,getIconUrl:Ae},Symbol.toStringTag,{value:"Module"}));function ze(e,a){const t=new Date,s=t.getHours()*60+t.getMinutes(),[o,d]=(e||"08:00").split(":").map(Number),[c,h]=(a||"20:00").split(":").map(Number),u=o*60+d,k=c*60+h;return u<k?s>=u&&s<k?"light":"dark":s>=u||s<k?"light":"dark"}function Ke(e){let a=0,t=0,s=0;for(const o of e)o.state==="running"?a++:o.state==="restarting"?s++:(o.state==="exited"||o.state==="dead"||o.state==="created")&&t++;return{running:a,stopped:t,restarting:s}}function M(e){return{...e,tags:typeof e.tags=="string"?JSON.parse(e.tags):e.tags,check_enabled:!!e.check_enabled}}let j=null;const Xe=R((e,a)=>({services:[],groups:[],settings:null,loading:!1,error:null,authUser:null,isAuthenticated:!0,isAdmin:!0,needsSetup:!1,authReady:!1,backgrounds:[],myBackground:null,loadAll:async()=>{e({loading:!0,error:null});try{const[t,s,o]=await Promise.all([l.services.list(),l.groups.list(),l.settings.get()]),d=t.map(M),c={...o};e({services:d,groups:s,settings:c,loading:!1}),J(c)}catch(t){e({error:t.message,loading:!1})}},loadServices:async()=>{const t=await l.services.list();e({services:t.map(M)})},createService:async t=>{const s=M(await l.services.create(t));return e(o=>({services:[...o.services,s]})),s.check_enabled&&a().checkService(s.id).catch(()=>{}),s.id},uploadServiceIcon:async(t,s)=>{const o=await new Promise((c,h)=>{const u=new FileReader;u.onload=()=>c(u.result.split(",")[1]),u.onerror=h,u.readAsDataURL(s)}),d=await l.services.uploadIcon(t,o,s.type);e(c=>({services:c.services.map(h=>h.id===t?{...h,icon_url:d.icon_url}:h)}))},updateService:async(t,s)=>{const o=M(await l.services.update(t,s));e(d=>({services:d.services.map(c=>c.id===t?o:c)}))},deleteService:async t=>{await l.services.delete(t),e(s=>({services:s.services.filter(o=>o.id!==t)}))},checkService:async t=>{const s=await l.services.check(t);e(o=>({services:o.services.map(d=>d.id===t?{...d,last_status:s.status,last_checked:s.checked_at}:d)}))},reorderGroups:async t=>{e(s=>({groups:t.map((o,d)=>({...s.groups.find(h=>h.id===o),position:d}))})),await Promise.all(t.map((s,o)=>l.groups.update(s,{position:o})))},reorderServices:async(t,s)=>{e(o=>{const d=Object.fromEntries(s.map((c,h)=>[c,h]));return{services:o.services.map(c=>d[c.id]!==void 0?{...c,position_x:d[c.id]}:c)}}),await Promise.all(s.map((o,d)=>l.services.update(o,{position_x:d})))},checkAllServices:async()=>{const t=await l.services.checkAll(),s=Object.fromEntries(t.map(o=>[o.id,o.status]));e(o=>({services:o.services.map(d=>s[d.id]?{...d,last_status:s[d.id],last_checked:new Date().toISOString()}:d)}))},loadGroups:async()=>{const t=await l.groups.list();e({groups:t})},createGroup:async t=>{const s=await l.groups.create(t);e(o=>({groups:[...o.groups,s]}))},updateGroup:async(t,s)=>{const o=await l.groups.update(t,s);e(d=>({groups:d.groups.map(c=>c.id===t?o:c)}))},deleteGroup:async t=>{await l.groups.delete(t),e(s=>({groups:s.groups.filter(o=>o.id!==t)}))},loadSettings:async()=>{const t=await l.settings.get();e({settings:t}),J(t)},updateSettings:async t=>{const s=await l.settings.update(t);e({settings:s}),J(s)},setThemeMode:async t=>{await a().updateSettings({theme_mode:t})},setThemeAccent:async t=>{await a().updateSettings({theme_accent:t})},startHealthPolling:()=>{j||(a().loadServices().catch(()=>{}),j=setInterval(async()=>{try{await a().loadServices()}catch{}},15e3))},stopHealthPolling:()=>{j&&(clearInterval(j),j=null)},checkAuth:async()=>{try{const{user:t}=await l.auth.status();e({needsSetup:!1,authUser:t??{sub:"local-admin",username:"lokal",role:"admin",groupId:null},isAuthenticated:!0,isAdmin:!0,authReady:!0})}catch{e({authUser:{sub:"local-admin",username:"lokal",role:"admin",groupId:null},authReady:!0,needsSetup:!1,isAuthenticated:!0,isAdmin:!0})}},logout:async()=>{},loadBackgrounds:async()=>{const t=await l.backgrounds.list();e({backgrounds:t})},loadMyBackground:async()=>{try{const t=await l.backgrounds.mine();e({myBackground:(t==null?void 0:t.url)??null})}catch{e({myBackground:null})}},uploadBackground:async(t,s)=>{const o=await new Promise((c,h)=>{const u=new FileReader;u.onload=()=>c(u.result.split(",")[1]),u.onerror=h,u.readAsDataURL(s)}),d=await l.backgrounds.upload(t,o,s.type);e(c=>({backgrounds:[d,...c.backgrounds]}))},deleteBackground:async t=>{await l.backgrounds.delete(t),e(s=>({backgrounds:s.backgrounds.filter(o=>o.id!==t)}))}}));function J(e){const a=document.documentElement,t=e.auto_theme_enabled?ze(e.auto_theme_light_start??"08:00",e.auto_theme_dark_start??"20:00"):e.theme_mode;a.setAttribute("data-theme",t),a.setAttribute("data-accent",e.theme_accent),a.setAttribute("data-radius",e.design_border_radius??"default"),a.setAttribute("data-blur",e.design_glass_blur??"medium"),a.setAttribute("data-density",e.design_density??"comfortable"),a.setAttribute("data-animations",e.design_animations??"full"),a.setAttribute("data-sidebar",e.design_sidebar_style??"default");let s=document.getElementById("mardash-custom-css");s||(s=document.createElement("style"),s.id="mardash-custom-css",document.head.appendChild(s)),s.textContent=e.design_custom_css??""}/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),ae=(...e)=>e.filter((a,t,s)=>!!a&&s.indexOf(a)===t).join(" ");/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Je={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=p.forwardRef(({color:e="currentColor",size:a=24,strokeWidth:t=2,absoluteStrokeWidth:s,className:o="",children:d,iconNode:c,...h},u)=>p.createElement("svg",{ref:u,...Je,width:a,height:a,stroke:e,strokeWidth:s?Number(t)*24/Number(a):t,className:ae("lucide",o),...h},[...c.map(([k,g])=>p.createElement(k,g)),...Array.isArray(d)?d:[d]]));/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=(e,a)=>{const t=p.forwardRef(({className:s,...o},d)=>p.createElement(Le,{ref:d,iconNode:a,className:ae(`lucide-${De(e)}`,s),...o}));return t.displayName=`${e}`,t};/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=n("Activity",[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=n("AppWindow",[["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}],["path",{d:"M10 4v4",key:"pp8u80"}],["path",{d:"M2 8h20",key:"d11cs7"}],["path",{d:"M6 4v4",key:"1svtjw"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const et=n("BarChart2",[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tt=n("BatteryCharging",[["path",{d:"M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2",key:"1sdynx"}],["path",{d:"M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1",key:"1gkd3k"}],["path",{d:"m11 7-3 5h4l-3 5",key:"b4a64w"}],["line",{x1:"22",x2:"22",y1:"11",y2:"13",key:"4dh1rd"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const at=n("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rt=n("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const st=n("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ot=n("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nt=n("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const it=n("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dt=n("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ct=n("CircleCheckBig",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lt=n("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yt=n("CircleHelp",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=n("CircleX",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ut=n("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie=n("Cloud",[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pt=n("Cpu",[["rect",{width:"16",height:"16",x:"4",y:"4",rx:"2",key:"14l7u7"}],["rect",{width:"6",height:"6",x:"9",y:"9",rx:"1",key:"5aljv4"}],["path",{d:"M15 2v2",key:"13l42r"}],["path",{d:"M15 20v2",key:"15mkzm"}],["path",{d:"M2 15h2",key:"1gxd5l"}],["path",{d:"M2 9h2",key:"1bbxkp"}],["path",{d:"M20 15h2",key:"19e6y8"}],["path",{d:"M20 9h2",key:"19tzq7"}],["path",{d:"M9 2v2",key:"165o2o"}],["path",{d:"M9 20v2",key:"i2bqo8"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=n("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mt=n("Droplets",[["path",{d:"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",key:"1ptgy4"}],["path",{d:"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",key:"1sl1rz"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ft=n("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kt=n("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xt=n("Flame",[["path",{d:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",key:"96xj49"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bt=n("Gauge",[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vt=n("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=n("Grid3x3",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wt=n("GripVertical",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=n("HardDrive",[["line",{x1:"22",x2:"2",y1:"12",y2:"12",key:"1y58io"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}],["line",{x1:"6",x2:"6.01",y1:"16",y2:"16",key:"sgf278"}],["line",{x1:"10",x2:"10.01",y1:"16",y2:"16",key:"1l4acy"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $t=n("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Re=n("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=n("Key",[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4",key:"g0fldk"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=n("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pt=n("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=n("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Et=n("Lightbulb",[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mt=n("List",[["line",{x1:"8",x2:"21",y1:"6",y2:"6",key:"7ey8pc"}],["line",{x1:"8",x2:"21",y1:"12",y2:"12",key:"rjfblc"}],["line",{x1:"8",x2:"21",y1:"18",y2:"18",key:"c3b1m8"}],["line",{x1:"3",x2:"3.01",y1:"6",y2:"6",key:"1g7gq3"}],["line",{x1:"3",x2:"3.01",y1:"12",y2:"12",key:"1pjlvk"}],["line",{x1:"3",x2:"3.01",y1:"18",y2:"18",key:"28t2mc"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _t=n("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=n("Loader",[["path",{d:"M12 2v4",key:"3427ic"}],["path",{d:"m16.2 7.8 2.9-2.9",key:"r700ao"}],["path",{d:"M18 12h4",key:"wj9ykh"}],["path",{d:"m16.2 16.2 2.9 2.9",key:"1bxg5t"}],["path",{d:"M12 18v4",key:"jadmvz"}],["path",{d:"m4.9 19.1 2.9-2.9",key:"bwix9q"}],["path",{d:"M2 12h4",key:"j09sii"}],["path",{d:"m4.9 4.9 2.9 2.9",key:"giyufr"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const At=n("LockOpen",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=n("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dt=n("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jt=n("Monitor",[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lt=n("Network",[["rect",{x:"16",y:"16",width:"6",height:"6",rx:"1",key:"4q2zg0"}],["rect",{x:"2",y:"16",width:"6",height:"6",rx:"1",key:"8cvhb9"}],["rect",{x:"9",y:"2",width:"6",height:"6",rx:"1",key:"1egb70"}],["path",{d:"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3",key:"1jsf9p"}],["path",{d:"M12 12V8",key:"2874zd"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const It=n("Package",[["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=n("Palette",[["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["path",{d:"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",key:"12rzf8"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ht=n("Pause",[["rect",{x:"14",y:"4",width:"4",height:"16",rx:"1",key:"zuxfzm"}],["rect",{x:"6",y:"4",width:"4",height:"16",rx:"1",key:"1okwgv"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=n("Pen",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qt=n("Pencil",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gt=n("PersonStanding",[["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["path",{d:"m9 20 3-6 3 6",key:"se2kox"}],["path",{d:"m6 8 6 2 6-2",key:"4o3us4"}],["path",{d:"M12 10v4",key:"1kjpxc"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wt=n("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=n("PlugZap",[["path",{d:"M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z",key:"goz73y"}],["path",{d:"m2 22 3-3",key:"19mgm9"}],["path",{d:"M7.5 13.5 10 11",key:"7xgeeb"}],["path",{d:"M10.5 16.5 13 14",key:"10btkg"}],["path",{d:"m18 3-4 4h6l-4 4",key:"16psg9"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ft=n("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vt=n("Power",[["path",{d:"M12 2v10",key:"mnfbl"}],["path",{d:"M18.4 6.6a9 9 0 1 1-12.77.04",key:"obofu9"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=n("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=n("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=n("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xt=n("Server",[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qt=n("Settings2",[["path",{d:"M20 7h-9",key:"3s1dr2"}],["path",{d:"M14 17H5",key:"gfn3mx"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=n("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ea=n("ShieldOff",[["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71",key:"1jlk70"}],["path",{d:"M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264",key:"18rp1v"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ta=n("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const aa=n("SkipBack",[["polygon",{points:"19 20 9 12 19 4 19 20",key:"o2sva"}],["line",{x1:"5",x2:"5",y1:"19",y2:"5",key:"1ocqjk"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ra=n("SkipForward",[["polygon",{points:"5 4 15 12 5 20 5 4",key:"16p6eg"}],["line",{x1:"19",x2:"19",y1:"5",y2:"19",key:"futhcm"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=n("SlidersHorizontal",[["line",{x1:"21",x2:"14",y1:"4",y2:"4",key:"obuewd"}],["line",{x1:"10",x2:"3",y1:"4",y2:"4",key:"1q6298"}],["line",{x1:"21",x2:"12",y1:"12",y2:"12",key:"1iu8h1"}],["line",{x1:"8",x2:"3",y1:"12",y2:"12",key:"ntss68"}],["line",{x1:"21",x2:"16",y1:"20",y2:"20",key:"14d8ph"}],["line",{x1:"12",x2:"3",y1:"20",y2:"20",key:"m0wm8r"}],["line",{x1:"14",x2:"14",y1:"2",y2:"6",key:"14e1ph"}],["line",{x1:"8",x2:"8",y1:"10",y2:"14",key:"1i6ji0"}],["line",{x1:"16",x2:"16",y1:"18",y2:"22",key:"1lctlv"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=n("Square",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=n("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=n("Tag",[["path",{d:"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",key:"vktsd0"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor",key:"kqv944"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=n("Thermometer",[["path",{d:"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z",key:"17jzev"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=n("ToggleLeft",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"6",ry:"6",key:"f2vt7d"}],["circle",{cx:"8",cy:"12",r:"2",key:"1nvbw3"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=n("ToggleRight",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"6",ry:"6",key:"f2vt7d"}],["circle",{cx:"16",cy:"12",r:"2",key:"4ma0v8"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=n("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=n("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=n("Undo",[["path",{d:"M3 7v6h6",key:"1v2h90"}],["path",{d:"M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",key:"1r6uu6"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=n("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=n("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=n("WifiOff",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}],["path",{d:"M5 12.859a10 10 0 0 1 5.17-2.69",key:"1dl1wf"}],["path",{d:"M19 12.859a10 10 0 0 0-2.007-1.523",key:"4k23kn"}],["path",{d:"M2 8.82a15 15 0 0 1 4.177-2.643",key:"1grhjp"}],["path",{d:"M22 8.82a15 15 0 0 0-11.288-3.764",key:"z3jwby"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=n("Wifi",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=n("Wind",[["path",{d:"M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2",key:"1k4u03"}],["path",{d:"M9.6 4.6A2 2 0 1 1 11 8H2",key:"b7d0fd"}],["path",{d:"M12.6 19.4A2 2 0 1 0 14 16H2",key:"1p5cb3"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=n("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=n("ZapOff",[["path",{d:"M10.513 4.856 13.12 2.17a.5.5 0 0 1 .86.46l-1.377 4.317",key:"193nxd"}],["path",{d:"M15.656 10H20a1 1 0 0 1 .78 1.63l-1.72 1.773",key:"27a7lr"}],["path",{d:"M16.273 16.273 10.88 21.83a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4a1 1 0 0 1-.78-1.63l4.507-4.643",key:"1e0qe9"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=n("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ba=n("ZoomIn",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=n("ZoomOut",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]]),_=new Map,T=new Map,V={unraid_status:2e3,appdata_backup:6e5,weather:6e5,pollen:6e5},qe=R((e,a)=>({widgets:[],stats:{},loading:!1,loadWidgets:async()=>{e({loading:!0});try{const t=await l.widgets.list();e({widgets:t})}finally{e({loading:!1})}},createWidget:async t=>{const s=await l.widgets.create(t);return e(o=>({widgets:[...o.widgets,s]})),s.id},updateWidget:async(t,s)=>{const o=await l.widgets.update(t,s);e(d=>({widgets:d.widgets.map(c=>c.id===t?o:c)}))},deleteWidget:async t=>{await l.widgets.delete(t),e(s=>({widgets:s.widgets.filter(o=>o.id!==t),stats:Object.fromEntries(Object.entries(s.stats).filter(([o])=>o!==t))}))},uploadWidgetIcon:async(t,s,o)=>{const{icon_url:d}=await l.widgets.uploadIcon(t,s,o);e(c=>({widgets:c.widgets.map(h=>h.id===t?{...h,icon_url:d}:h)}))},loadStats:async t=>{try{const s=await l.widgets.stats(t);e(o=>({stats:{...o.stats,[t]:s}}))}catch{}},setAdGuardProtection:async(t,s)=>{await l.widgets.setAdGuardProtection(t,s),await a().loadStats(t)},triggerButton:async(t,s)=>{await l.widgets.triggerButton(t,s)},haToggle:async(t,s,o)=>{await l.widgets.haToggle(t,s,o),await a().loadStats(t),setTimeout(()=>a().loadStats(t).catch(()=>{}),2e3)},setPiholeProtection:async(t,s)=>{await l.widgets.setPiholeProtection(t,s),await a().loadStats(t)},startPolling:(t,s)=>{const o=(T.get(t)??0)+1;if(T.set(t,o),o===1){const d=V[s]??3e4;s in V||console.warn(`[useWidgetStore] Unknown widget type "${s}" — using default 30s interval`);const c=setInterval(()=>{qe.getState().loadStats(t).catch(()=>{})},d);_.set(t,c)}},stopPolling:t=>{const s=(T.get(t)??1)-1;if(s<=0){const o=_.get(t);o!==void 0&&clearInterval(o),_.delete(t),T.delete(t)}else T.set(t,s)},startPollingAll:t=>{t.forEach(s=>a().startPolling(s.id,s.type))},stopPollingAll:()=>{[..._.keys()].forEach(s=>a().stopPolling(s))}})),Sa=R((e,a)=>({groups:[],items:[],loading:!1,editMode:!1,showVisibilityOverlay:!1,loadDashboard:async()=>{e({loading:!0});try{const{groups:t,items:s}=await l.dashboard.list();e({groups:t,items:s,loading:!1})}catch{e({loading:!1})}},setEditMode:t=>e({editMode:t}),setShowVisibilityOverlay:t=>e({showVisibilityOverlay:t}),addServiceItem:async t=>{await l.dashboard.addItem("service",t),await a().loadDashboard()},addWidgetItem:async t=>{await l.dashboard.addItem("widget",t),await a().loadDashboard()},addPlaceholder:async t=>{await l.dashboard.addItem(t),await a().loadDashboard()},removeItem:async t=>{await l.dashboard.removeItem(t),await a().loadDashboard()},removeByRef:async(t,s)=>{await l.dashboard.removeByRef(t,s),await a().loadDashboard()},reorder:async t=>{await l.dashboard.reorder(t),await a().loadDashboard()},createGroup:async t=>{await l.dashboard.createGroup(t),await a().loadDashboard()},updateGroup:async(t,s)=>{await l.dashboard.updateGroup(t,s),await a().loadDashboard()},deleteGroup:async t=>{await l.dashboard.deleteGroup(t),await a().loadDashboard()},reorderGroups:async t=>{await l.dashboard.reorderGroups(t),await a().loadDashboard()},moveItemToGroup:async(t,s)=>{await l.dashboard.moveItemToGroup(t,s),await a().loadDashboard()},reorderGroupItems:async(t,s)=>{await l.dashboard.reorderGroupItems(t,s),await a().loadDashboard()}}));function wa({iconId:e,iconUrl:a,onChange:t}){const{t:s}=I("common"),[o,d]=p.useState(!1),[c,h]=p.useState("search"),[u,k]=p.useState(""),[g,b]=p.useState([]),[x,f]=p.useState(!1),[v,O]=p.useState(null),[A,P]=p.useState(null),[H,$]=p.useState(null),U=p.useRef(null),z=p.useRef(null),C=e?`/api/icons/${e}`:a;p.useEffect(()=>{o||(k(""),b([]),P(null),$(null))},[o]);const re=y=>{if(k(y),z.current&&clearTimeout(z.current),!y.trim()){b([]);return}z.current=setTimeout(async()=>{f(!0),P(null);try{const m=await l.icons.search(y.trim());b(m.icons)}catch(m){P(m instanceof Error?m.message:s("icon_picker.error_search"))}finally{f(!1)}},300)},se=async y=>{O(y.name);try{const m=await l.icons.download(y.name);t(m.id),d(!1)}catch(m){P(m instanceof Error?m.message:s("icon_picker.error_download"))}finally{O(null)}},q=async y=>{if(y.size>512*1024){$(s("icon_picker.error_too_large"));return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(y.type)){$(s("icon_picker.error_unsupported"));return}$(null);const S=new FileReader;S.onload=async()=>{const oe=S.result.split(",")[1];try{const E=await l.icons.upload(oe,y.type,y.name.replace(/\.[^.]+$/,""));t(E.id),d(!1)}catch(E){$(E instanceof Error?E.message:s("icon_picker.error_upload"))}},S.readAsDataURL(y)};return i.jsxs(i.Fragment,{children:[i.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[C?i.jsx("div",{style:{width:40,height:40,borderRadius:"var(--radius-sm)",border:"1px solid var(--glass-border)",background:"var(--glass-bg)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0},children:i.jsx("img",{src:C,alt:"",style:{width:32,height:32,objectFit:"contain"}})}):i.jsx("div",{style:{width:40,height:40,borderRadius:"var(--radius-sm)",border:"1px solid var(--glass-border)",background:"var(--glass-bg)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},children:i.jsx(Re,{size:16,style:{color:"var(--text-muted)"}})}),i.jsx("button",{type:"button",className:"btn btn-ghost btn-sm",onClick:()=>d(!0),style:{gap:4},children:s(C?"icon_picker.change":"icon_picker.choose")}),C&&i.jsx("button",{type:"button",className:"btn btn-ghost btn-sm",onClick:()=>t(null),style:{color:"var(--text-muted)",padding:"4px 8px"},children:i.jsx(F,{size:12})})]}),o&&i.jsx("div",{className:"modal-overlay",onClick:y=>{y.target===y.currentTarget&&d(!1)},style:{zIndex:1100},children:i.jsxs("div",{className:"glass modal",style:{width:"100%",maxWidth:560,maxHeight:"80vh",display:"flex",flexDirection:"column"},onClick:y=>y.stopPropagation(),children:[i.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 20px 0"},children:[i.jsx("h3",{style:{margin:0,fontFamily:"var(--font-display)",fontSize:16},children:s("icon_picker.modal_title")}),i.jsx("button",{className:"btn btn-ghost btn-icon",onClick:()=>d(!1),children:i.jsx(F,{size:16})})]}),i.jsx("div",{style:{display:"flex",gap:4,padding:"12px 20px 0"},children:["search","upload"].map(y=>i.jsx("button",{type:"button",className:`btn btn-sm ${c===y?"btn-primary":"btn-ghost"}`,onClick:()=>h(y),style:{fontSize:12},children:s(y==="search"?"icon_picker.tab_search":"icon_picker.tab_upload")},y))}),i.jsxs("div",{style:{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",padding:"12px 20px 20px"},children:[c==="search"&&i.jsxs(i.Fragment,{children:[i.jsxs("div",{style:{position:"relative",marginBottom:12},children:[i.jsx(He,{size:14,style:{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",pointerEvents:"none"}}),i.jsx("input",{className:"form-input",style:{paddingLeft:32},placeholder:s("icon_picker.search_placeholder"),value:u,onChange:y=>re(y.target.value),autoFocus:!0})]}),A&&i.jsx("div",{style:{color:"var(--status-offline)",fontSize:12,marginBottom:8},children:A}),i.jsxs("div",{style:{flex:1,overflowY:"auto"},children:[x&&i.jsx("div",{style:{display:"flex",justifyContent:"center",padding:20},children:i.jsx("div",{className:"spinner",style:{width:20,height:20,borderWidth:2}})}),!x&&!u.trim()&&i.jsx("div",{style:{textAlign:"center",padding:"32px 0",color:"var(--text-muted)",fontSize:13},children:s("icon_picker.search_hint")}),!x&&u.trim()&&g.length===0&&!A&&i.jsx("div",{style:{textAlign:"center",padding:"32px 0",color:"var(--text-muted)",fontSize:13},children:s("icon_picker.no_results",{query:u})}),!x&&g.length>0&&i.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(72px, 1fr))",gap:8},children:g.map(y=>i.jsxs("button",{type:"button",className:"icon-picker-item",onClick:()=>se(y),disabled:v===y.name,title:y.name,children:[v===y.name?i.jsx("div",{className:"spinner",style:{width:16,height:16,borderWidth:2}}):i.jsx("img",{src:y.preview_url,alt:y.name,loading:"lazy",style:{width:36,height:36,objectFit:"contain"}}),i.jsx("span",{style:{fontSize:10,color:"var(--text-muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",width:"100%",textAlign:"center"},children:y.name})]},y.name))})]})]}),c==="upload"&&i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[H&&i.jsx("div",{style:{color:"var(--status-offline)",fontSize:12},children:H}),i.jsxs("div",{className:"icon-picker-dropzone",onClick:()=>{var y;return(y=U.current)==null?void 0:y.click()},onDragOver:y=>y.preventDefault(),onDrop:y=>{y.preventDefault();const m=y.dataTransfer.files[0];m&&q(m)},children:[i.jsx(Ue,{size:24,style:{color:"var(--text-muted)",marginBottom:8}}),i.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:s("icon_picker.dropzone_label")}),i.jsx("div",{style:{fontSize:11,color:"var(--text-muted)",marginTop:4},children:s("icon_picker.dropzone_hint")})]}),i.jsx("input",{ref:U,type:"file",accept:"image/png,image/jpeg,image/svg+xml,image/webp",style:{display:"none"},onChange:y=>{var S;const m=(S=y.target.files)==null?void 0:S[0];m&&q(m)}})]})]})]})})]})}const Ge={0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌦️",61:"🌧️",63:"🌧️",65:"🌧️",71:"🌨️",73:"🌨️",75:"🌨️",77:"🌨️",80:"🌦️",81:"🌦️",82:"🌧️",85:"🌨️",86:"🌨️",95:"⛈️",96:"⛈️",99:"⛈️"};function Oa({stats:e,config:a}){const{t}=I("widgets");if(e.error)return i.jsx("div",{style:{fontSize:12,color:"var(--status-offline)"},children:e.error});const s=t(`weather.codes.${e.weather_code}`,`Code ${e.weather_code}`),o=Ge[e.weather_code]??"🌡️",d=a.location_name||null;return i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:10},children:[d&&i.jsxs("div",{style:{fontSize:11,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:4},children:[i.jsx(Ie,{size:11}),d]}),i.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[i.jsx("span",{style:{fontSize:40,lineHeight:1,flexShrink:0},children:o}),i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[i.jsxs("span",{style:{fontSize:32,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--accent)",lineHeight:1},children:[e.temperature,e.unit]}),i.jsx("span",{style:{fontSize:12,color:"var(--text-secondary)"},children:s})]})]}),i.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12},children:[i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[i.jsx("span",{style:{color:"var(--text-muted)",fontSize:10},children:t("weather.feels_like")}),i.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontWeight:500},children:[e.apparent_temperature,e.unit]})]}),i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[i.jsx("span",{style:{color:"var(--text-muted)",fontSize:10},children:t("weather.humidity")}),i.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontWeight:500},children:[e.humidity,"%"]})]}),i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[i.jsx("span",{style:{color:"var(--text-muted)",fontSize:10},children:t("weather.wind")}),i.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontWeight:500},children:[e.wind_speed," km/h"]})]}),e.precipitation>0&&i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[i.jsx("span",{style:{color:"var(--text-muted)",fontSize:10},children:t("weather.precipitation")}),i.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontWeight:500},children:[e.precipitation," mm"]})]})]})]})}function L(e){return e==null?"var(--text-muted)":e>=3?"var(--status-offline)":e>=2?"#f59e0b":e>=1?"#facc15":"var(--text-muted)"}function $a({stats:e}){if(!e||e.error)return i.jsx("div",{style:{fontSize:12,color:"var(--text-muted)",textAlign:"center",padding:"8px 0"},children:(e==null?void 0:e.error)||"Pollen aktuell nicht verfügbar"});const a=[{label:"Hasel",level:e.hasel,text:e.hasel_text},{label:"Birke",level:e.birke,text:e.birke_text},{label:"Gräser",level:e.graeser,text:e.graeser_text},...e.pappel_text||e.pappel!=null?[{label:"Pappel",level:e.pappel,text:e.pappel_text}]:[]];return i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:8},children:[i.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:8,alignItems:"baseline"},children:[i.jsx("div",{style:{fontSize:12,fontWeight:600},children:e.source_region||"Pollen"}),i.jsx("div",{style:{fontSize:10,color:"var(--text-muted)"},children:e.updated_at?new Date(e.updated_at).toLocaleDateString("de-DE"):""})]}),a.map(t=>i.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",fontSize:12},children:[i.jsx("div",{style:{color:"var(--text-secondary)"},children:t.label}),i.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,minWidth:0},children:[i.jsx("span",{style:{color:L(t.level),fontWeight:600,textAlign:"right"},children:t.text||"—"}),i.jsx("span",{title:t.text||"—",style:{width:10,height:10,borderRadius:"50%",background:L(t.level),boxShadow:`0 0 6px ${L(t.level)}66`,flexShrink:0}})]})]},t.label))]})}export{ma as $,Qe as A,Ut as B,ut as C,mt as D,kt as E,He as F,wt as G,dt as H,Re as I,nt as J,at as K,zt as L,Dt as M,Xe as N,$t as O,qt as P,na as Q,Kt as R,ta as S,ya as T,Ue as U,ka as V,fa as W,F as X,xt as Y,xa as Z,tt as _,l as a,ga as a0,Ae as a1,wa as a2,Zt as a3,ht as a4,ha as a5,ct as a6,Qt as a7,Xt as a8,pt as a9,lt as aA,Bt as aB,Ct as aC,Ye as aD,Ze as aE,oa as aa,Lt as ab,It as ac,vt as ad,Jt as ae,Tt as af,Ot as ag,jt as ah,ia as ai,pa as aj,qe as ak,Pt as al,sa as am,ot as an,Ke as ao,Sa as ap,Ve as aq,Fe as ar,Oa as as,$a as at,Mt as au,ea as av,et as aw,Rt as ax,ft as ay,_t as az,At as b,R as c,Nt as d,aa as e,Ht as f,Wt as g,ra as h,st as i,it as j,la as k,ca as l,bt as m,da as n,ba as o,va as p,Vt as q,yt as r,Et as s,Gt as t,Ft as u,gt as v,St as w,ua as x,Yt as y,rt as z};
