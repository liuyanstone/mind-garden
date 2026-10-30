import {GAMES,BY_ID,gameURL,route,filteredGames} from './games.mjs?v=9';
import {ART,HERO} from './art.mjs?v=4';
import {zh,en} from './i18n.mjs?v=4';
const $=s=>document.querySelector(s);
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
let lang=read('mind-garden-language')||(/^zh/i.test(navigator.language)?'zh':'en');
if(!['zh','en'].includes(lang))lang='zh';
let category='all',active=null,frame=null,shown=false,homeScroll=0;
const t=()=>lang==='zh'?zh:en;
$('#hero-art').innerHTML=HERO;
function cards(){
 const games=filteredGames(category);
 $('#game-count').textContent=t().count.replace('{count}',games.length);
 $('#game-grid').innerHTML=games.map(g=>`<article class="card "><a class="card-art" href="#play/${g.id}" aria-label="${t().play} · ${g.name[lang]}">${ART[g.id]}</a><div class="card-body"><div class="card-topline"><span class="tag">${g.tag[lang]}</span><span class="card-index">${String(GAMES.indexOf(g)+1).padStart(2,'0')}</span></div><h3><a href="#play/${g.id}">${g.name[lang]}</a></h3><p>${g.description[lang]}</p><small>${g.detail[lang]}</small><a class="play-link" href="#play/${g.id}"><span>${t().play}</span><span aria-hidden="true">↗</span></a></div></article>`).join('');
 const last=BY_ID[read('mind-garden-last')];
 $('#last-played').hidden=!last;
 if(last)$('#last-played').innerHTML=`<span>${t().last}</span><strong>${last.name[lang]}</strong><a href="#play/${last.id}">${t().openLast} ↗</a>`;
}
function labels(){
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=active&&shown?`${BY_ID[active].name[lang]} · ${t().brand}`:t().title;
 document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t()[el.dataset.t]);
 $('#language').value=lang;
 $('#back').textContent=`← ${t().back}`;
 $('#standalone').textContent=`${t().standalone} ↗`;
 if(active){$('#player-title').textContent=BY_ID[active].name[lang];$('#loading-title').textContent=t().loading.replace('{game}',BY_ID[active].name[lang]);if(frame)frame.title=t().frame.replace('{game}',BY_ID[active].name[lang]);}
 cards();
}
function setLanguage(value,sync=true){if(!['en','zh'].includes(value))return;lang=value;write('mind-garden-language',lang);labels();if(sync&&frame)try{const select=frame.contentDocument.querySelector('#language');if(select&&select.value!==lang){select.value=lang;select.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));}}catch{}}
function suspend(){if(!frame)return;try{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('blur'));frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));}catch{}}
function remember(id){write('mind-garden-last',id);cards();}
function updatePlayer(){const url=gameURL(active);$('#standalone').href=url;$('#loading-link').href=url;labels();}
function openGame(id){
 if(!shown)homeScroll=window.scrollY;
 shown=true;$('#home').hidden=true;$('#player').classList.add('active');$('#player').inert=false;document.body.classList.add('playing');
 if(active!==id||!frame){suspend();active=id;write(BY_ID[id].languageKey,lang);$('#loading').hidden=false;
 frame=document.createElement('iframe');frame.src=gameURL(id);frame.allow='autoplay; fullscreen';frame.setAttribute('allowfullscreen','');
 frame.addEventListener('load',()=>{
  $('#loading').hidden=true;
  try{
   const path=frame.contentWindow.location.pathname.split('/').filter(Boolean)[0];
   if(BY_ID[path]&&path!==active){active=path;history.replaceState(null,'',`#play/${path}`);remember(path);updatePlayer();}
   const select=frame.contentDocument.querySelector('#language');
   if(select){if(select.value!==lang){select.value=lang;select.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));}select.addEventListener('change',()=>setLanguage(select.value,false));}
  }catch{/* Local previews embed public games across origins. */}
  if(shown)frame.focus();
 });$('#frame-host').replaceChildren(frame);
 }else{try{frame.contentWindow.document.dispatchEvent(new frame.contentWindow.Event('visibilitychange'));frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('focus'));}catch{}frame.focus();}
 remember(id);updatePlayer();
}
function home(){if(shown){suspend();shown=false;$('#player').classList.remove('active');$('#player').inert=true;$('#home').hidden=false;document.body.classList.remove('playing');labels();window.scrollTo(0,homeScroll);const link=document.querySelector(`.play-link[href="#play/${active}"]`);link?.focus({preventScroll:true});}}
function navigate(){const id=route(location.hash);if(id)openGame(id);else home();}
$('#language').addEventListener('change',e=>setLanguage(e.target.value));
$('.filters').addEventListener('click',e=>{const button=e.target.closest('[data-filter]');if(!button)return;category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));cards();});
$('#back').addEventListener('click',()=>{location.hash='games';});
window.addEventListener('hashchange',navigate);
window.addEventListener('pagehide',suspend);
labels();navigate();
