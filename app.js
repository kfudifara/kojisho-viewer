'use strict';

const $=s=>document.querySelector(s);
const ui={dictionary:$('#dictionary'),volume:$('#volume'),page:$('#page'),faces:$('#faces'),toc:$('#toc'),image:$('#pageImage'),stage:$('#stage'),viewer:$('#viewer'),loading:$('#loading'),error:$('#error'),location:$('#location'),sidebar:$('#sidebar'),scrim:$('#scrim'),zoomBadge:$('#zoomBadge')};
let rows=[],current=[],index=0,scale=1,fitScale=1,x=0,y=0,rotation=0,pointers=new Map(),gesture=null;

function parseCSV(text){
  const out=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell.replace(/\r$/,''));out.push(row);row=[];cell=''}else cell+=c}
  if(cell||row.length){row.push(cell);out.push(row)}
  const head=out.shift().map(x=>x.replace(/^\uFEFF/,''));return out.filter(r=>r.length>1).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])));
}
const uniq=a=>[...new Set(a)];
function natural(a,b){return String(a).localeCompare(String(b),'ja',{numeric:true})}
function setOptions(el,values,selected,label=x=>x){el.innerHTML='';for(const value of values){const o=document.createElement('option');o.value=value;o.textContent=label(value);o.selected=value===selected;el.append(o)}}
function filtered(dict=ui.dictionary.value,volume=ui.volume.value){return rows.filter(r=>r['辞書名']===dict&&r['巻']===volume)}

function selectDictionary(name,restore=true){
  const dicts=uniq(rows.map(r=>r['辞書名']));setOptions(ui.dictionary,dicts,name||dicts[0]);
  const vols=uniq(rows.filter(r=>r['辞書名']===ui.dictionary.value).map(r=>r['巻'])).sort(natural);setOptions(ui.volume,vols,restore?localStorage.getItem('kojisho.volume')||vols[0]:vols[0],v=>v?`巻 ${v}`:'巻なし');
  if(!vols.includes(ui.volume.value))ui.volume.value=vols[0];selectVolume();
}
function selectVolume(target){
  current=filtered().sort((a,b)=>natural(a['頁'],b['頁'])||natural(a['面'],b['面']));
  const saved=target||localStorage.getItem('kojisho.key');const hit=current.findIndex(r=>key(r)===saved);index=hit>=0?hit:0;buildTOC();show(index);
}
const key=r=>`${r['辞書名']}|${r['巻']}|${r['頁']}|${r['面']}`;
function frameInfo(row){const m=row.URL.match(/pid\/(\d+)\/(\d+)/);return m?{pid:m[1],frame:m[2]}:null}
function imageURL(row){const f=frameInfo(row);return f?`https://www.dl.ndl.go.jp/api/iiif/${f.pid}/R${f.frame.padStart(7,'0')}/full/!2000,2000/0/default.jpg`:''}
function sourceURL(row){const f=frameInfo(row);return f?`https://dl.ndl.go.jp/pid/${f.pid}/${f.frame}`:row.URL}

function show(nextIndex){
  if(!current.length)return;index=Math.max(0,Math.min(current.length-1,nextIndex));const r=current[index];
  const pages=uniq(current.map(x=>x['頁']));setOptions(ui.page,pages,r['頁'],p=>`${p}頁`);
  const faces=current.filter(x=>x['頁']===r['頁']);ui.faces.innerHTML='';for(const f of faces){const b=document.createElement('button');b.textContent=f['面']==='なし'?'頁':f['面'];b.className=key(f)===key(r)?'active':'';b.onclick=()=>show(current.indexOf(f));ui.faces.append(b)}
  ui.location.textContent=`${r['巻']?r['巻']+'巻・':''}${r['頁']}頁${r['面']==='なし'?'':`・${r['面']}`}`;
  document.querySelectorAll('.toc-pages button').forEach(b=>b.classList.toggle('active',b.dataset.key===key(r)));
  const active=$('.toc-pages button.active');active?.scrollIntoView({block:'nearest'});
  localStorage.setItem('kojisho.dictionary',r['辞書名']);localStorage.setItem('kojisho.volume',r['巻']);localStorage.setItem('kojisho.key',key(r));
  loadImage(imageURL(r));
}
function loadImage(src){ui.loading.hidden=false;ui.loading.style.display='flex';ui.error.hidden=true;ui.image.style.visibility='hidden';ui.image.onload=()=>{ui.loading.style.display='none';ui.image.style.visibility='visible';fit()};ui.image.onerror=()=>{ui.loading.style.display='none';ui.error.hidden=false};ui.image.src=src}
function buildTOC(){
  ui.toc.innerHTML='';const group=document.createElement('div');group.className='toc-group';const title=document.createElement('div');title.className='toc-title';title.textContent=ui.volume.value?`巻 ${ui.volume.value}`:'全頁';const pages=document.createElement('div');pages.className='toc-pages';
  for(const p of uniq(current.map(r=>r['頁']))){const first=current.find(r=>r['頁']===p);const b=document.createElement('button');b.textContent=p;b.dataset.key=key(first);b.onclick=()=>{show(current.indexOf(first));closeSidebar()};pages.append(b)}group.append(title,pages);ui.toc.append(group)
}

function apply(){ui.stage.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(${scale}) rotate(${rotation}deg)`;ui.zoomBadge.textContent=Math.abs(scale-fitScale)<.01?'全体':`${Math.round(scale/fitScale*100)}%`}
function fit(){const vw=ui.viewer.clientWidth*.94,vh=ui.viewer.clientHeight*.94;const rotated=Math.abs(rotation%180)===90;const iw=rotated?ui.image.naturalHeight:ui.image.naturalWidth,ih=rotated?ui.image.naturalWidth:ui.image.naturalHeight;fitScale=Math.min(vw/iw,vh/ih);scale=fitScale;x=y=0;apply()}
function zoom(mult,cx=ui.viewer.clientWidth/2,cy=ui.viewer.clientHeight/2){const old=scale;scale=Math.max(fitScale*.65,Math.min(fitScale*8,scale*mult));const rect=ui.viewer.getBoundingClientRect(),px=cx-rect.left-rect.width/2,py=cy-rect.top-rect.height/2;x=px-(px-x)*(scale/old);y=py-(py-y)*(scale/old);apply()}
function move(delta){show(index+delta)}
function openSidebar(){ui.sidebar.classList.add('open');ui.scrim.classList.add('open')}
function closeSidebar(){ui.sidebar.classList.remove('open');ui.scrim.classList.remove('open')}

ui.dictionary.onchange=()=>selectDictionary(ui.dictionary.value,false);ui.volume.onchange=()=>selectVolume();ui.page.onchange=()=>{const r=current.find(x=>x['頁']===ui.page.value);show(current.indexOf(r))};
$('#previous').onclick=()=>move(-1);$('#next').onclick=()=>move(1);$('#previousFrame').onclick=()=>move(1);$('#nextFrame').onclick=()=>move(-1);
$('#zoomIn').onclick=()=>zoom(1.15);$('#zoomOut').onclick=()=>zoom(1/1.15);$('#fit').onclick=fit;$('#rotateLeft').onclick=()=>{rotation-=90;fit()};$('#rotateRight').onclick=()=>{rotation+=90;fit()};
$('#sourceButton').onclick=()=>window.open(sourceURL(current[index]),'_blank','noopener');$('#retry').onclick=()=>loadImage(imageURL(current[index]));$('#tocToggle').onclick=openSidebar;$('#closeSidebar').onclick=closeSidebar;ui.scrim.onclick=closeSidebar;

ui.viewer.addEventListener('pointerdown',e=>{if(e.target.classList.contains('edge'))return;ui.viewer.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture={x,y,scale,points:[...pointers.values()]}});
ui.viewer.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...pointers.values()];if(pts.length===1&&gesture){x=gesture.x+pts[0].x-gesture.points[0].x;y=gesture.y+pts[0].y-gesture.points[0].y;apply()}else if(pts.length===2){const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),d0=Math.hypot(gesture.points[0].x-gesture.points[1].x,gesture.points[0].y-gesture.points[1].y);scale=Math.max(fitScale*.65,Math.min(fitScale*8,gesture.scale*d/d0));x=gesture.x+(pts[0].x+pts[1].x-gesture.points[0].x-gesture.points[1].x)/2;y=gesture.y+(pts[0].y+pts[1].y-gesture.points[0].y-gesture.points[1].y)/2;apply()}});
function pointerUp(e){pointers.delete(e.pointerId);if(pointers.size){gesture={x,y,scale,points:[...pointers.values()]}}}ui.viewer.addEventListener('pointerup',pointerUp);ui.viewer.addEventListener('pointercancel',pointerUp);
ui.viewer.addEventListener('dblclick',e=>zoom(1.5,e.clientX,e.clientY));ui.viewer.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();zoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY)}},{passive:false});
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='+'||e.key==='=')zoom(1.15);if(e.key==='-')zoom(1/1.15)});window.addEventListener('resize',()=>ui.image.complete&&fit());

function start(data){rows=data;const saved=localStorage.getItem('kojisho.dictionary');selectDictionary(saved&&rows.some(r=>r['辞書名']===saved)?saved:rows[0]['辞書名'])}
if(Array.isArray(window.KOJISHO_DATA)&&window.KOJISHO_DATA.length){start(window.KOJISHO_DATA)}else{fetch('古辞書.csv').then(r=>{if(!r.ok)throw Error(r.status);return r.text()}).then(text=>start(parseCSV(text))).catch(()=>{ui.loading.style.display='none';ui.error.hidden=false;ui.error.querySelector('strong').textContent='辞書データを読み込めません'})}
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
