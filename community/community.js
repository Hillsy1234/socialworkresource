(() => {
  const $=id=>document.getElementById(id),api='/.netlify/functions/community';
  const categoryNames={'all':'All topics','student-learning':'Student learning',cpd:'CPD & reflection','practice-resources':'Practice resources',general:'General questions','monthly-discussion':'Monthly discussion'};
  const places=[{id:'all',name:'All locations',country:'Shared learning across borders'},...practiceLocations];
  const place=id=>places.find(p=>p.id===id)||places[0];
  const el=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;};
  const date=value=>new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
  const flag=id=>{const p=place(id);if(!p.flag)return el('span','◎','all-icon');const img=el('img');img.src=`/assets/flags/${p.flag}.svg`;img.alt='';return img;};
  const message=(id,text,error=false)=>{$(id).textContent=text;$(id).classList.toggle('error',error);};
  const query=new URLSearchParams(location.search);
  let selected=query.get('jurisdiction')||'all';
  if(!query.has('jurisdiction'))try{selected=JSON.parse(localStorage.getItem('socialWorkerResourceJurisdiction'))||'all';}catch{}
  if(!places.some(p=>p.id===selected))selected='all';
  let category='all',cursor=null,feedSequence=0,threadSequence=0,activeThread=null,replyCursor=null,compose=null,reportTarget=null;
  let composeChallenge='',reportChallenge='',composeRequestId='',reportRequestId='';
  const currentMonth=new Date().toISOString().slice(0,7);$('month').value=currentMonth;
  async function request(params={},body){
    const options={cache:'no-store',redirect:'error'};
    if(body){options.method='POST';options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(body);}
    const response=await fetch(`${api}?${new URLSearchParams(params)}`,options);
    let data;try{data=await response.json();}catch{throw new Error('The community service could not be reached. Please try again.');}
    if(!response.ok)throw new Error(data.error||`Request failed (${response.status}).`);return data;
  }
  async function challenge(){return (await request({action:'challenge'})).challenge;}
  function locationIdentity(){
    $('selectedFlag').replaceChildren(flag(selected));$('selectedLocation').textContent=place(selected).name;$('selectedCountry').textContent=place(selected).country;
    document.querySelectorAll('.learning-link').forEach(a=>a.href=selected==='all'?'/':`/?jurisdiction=${encodeURIComponent(selected)}`);
    const url=new URL(location.href);url.searchParams.set('jurisdiction',selected);history.replaceState(null,'',url);
  }
  function renderPlaces(){
    const q=$('locationSearch').value.trim().toLowerCase();$('locationOptions').replaceChildren();
    for(const p of places.filter(p=>`${p.name} ${p.country} ${p.aliases||''}`.toLowerCase().includes(q))){
      const b=el('button');b.type='button';b.dataset.location=p.id;b.setAttribute('aria-pressed',String(p.id===selected));b.append(flag(p.id));const label=el('span',p.name);label.append(el('small',p.country));b.append(label);
      b.addEventListener('click',()=>{selected=p.id;$('locationDialog').close();locationIdentity();loadFeed();});$('locationOptions').append(b);
    }
    if(!$('locationOptions').children.length)$('locationOptions').append(el('p','No locations found. Try a country, state or province.'));
  }
  $('chooseLocation').addEventListener('click',()=>{$('locationSearch').value='';renderPlaces();$('locationDialog').showModal();$('locationSearch').focus({preventScroll:true});});
  $('locationSearch').addEventListener('input',renderPlaces);
  const uniqueFlags=new Set();for(const p of practiceLocations)if(!uniqueFlags.has(p.flag)){uniqueFlags.add(p.flag);$('heroFlags').append(flag(p.id));}
  for(const [id,name] of Object.entries(categoryNames)){
    const b=el('button',name);b.type='button';b.dataset.category=id;b.setAttribute('aria-pressed',String(id===category));
    b.addEventListener('click',()=>{category=id;document.querySelectorAll('[data-category]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.category===id)));loadFeed();});$('categoryFilters').append(b);
  }
  function meta(item){const n=el('div','','meta');n.append(flag(item.location),el('span',place(item.location).name),el('span','·'),el('span',date(item.createdAt)));return n;}
  function reportButton(item){const b=el('button','Report','text-button');b.type='button';b.addEventListener('click',()=>openReport(item));return b;}
  function topicCard(item){
    const card=el('article','','topic-card');card.append(el('span',categoryNames[item.category]||'Discussion','pill'));
    const heading=el('h3'),button=el('button',item.title);button.type='button';button.addEventListener('click',()=>openThread(item.id));heading.append(button);card.append(heading,meta(item));
    card.append(el('p',item.body.slice(0,230)+(item.body.length>230?'…':'')),el('div',`${item.author} · Community contribution${item.locked?' · Replies closed':''}`,'meta'));return card;
  }
  async function loadFeed(append=false){
    if(!$('month').validity.valid)return;
    const seq=++feedSequence,params={month:$('month').value,location:selected,category,q:$('search').value};if(append&&cursor)params.cursor=cursor;
    $('loadMore').disabled=true;message('feedStatus','Loading discussions…');
    try{const data=await request(params);if(seq!==feedSequence)return;
      if(!append)$('topicList').replaceChildren();for(const item of data.items)$('topicList').append(topicCard(item));
      cursor=data.nextCursor;$('loadMore').hidden=!cursor;message('feedStatus',`${$('topicList').querySelectorAll('.topic-card').length} discussions loaded`);
      if(!$('topicList').children.length){const empty=el('div','','empty');empty.append(el('h3','Room for a new conversation.'),el('p','No published discussions match this selection yet. Try another category or month, or start a thoughtful question.'));$('topicList').append(empty);}
    }catch(error){if(seq!==feedSequence)return;message('feedStatus',error.message,true);if(!append){$('topicList').replaceChildren(el('p',error.message,'empty'));$('loadMore').hidden=true;}}
    finally{if(seq===feedSequence)$('loadMore').disabled=false;}
  }
  async function loadMonthly(){
    try{const data=await request({action:'thread',id:`${currentMonth}-scenario`});const topic=data.topic;
      const button=el('button','Join the discussion →','secondary');button.type='button';button.addEventListener('click',()=>openThread(topic.id));
      $('monthlyContent').replaceChildren(el('span','Fictional learning scenario · All locations','pill'),el('h3',topic.title),el('p',topic.body.split('\n\n')[1]||topic.body.slice(0,160)),button);
    }catch{$('monthlyContent').replaceChildren(el('p','The next monthly discussion will appear here once published. You can explore community topics below in the meantime.'));}
  }
  function renderReply(item){const card=el('article','','reply-card');card.append(el('strong',item.author),meta(item),el('p',item.body,'post-body'),reportButton(item));return card;}
  async function openThread(id,append=false){
    const seq=++threadSequence;
    if(!append){$('threadContent').replaceChildren(el('h2','Loading discussion…'));$('replies').replaceChildren();$('replyButton').hidden=true;$('moreReplies').hidden=true;if(!$('threadDialog').open)$('threadDialog').showModal();}
    message('threadStatus','');
    try{const data=await request({action:'thread',id,...(append&&replyCursor?{cursor:replyCursor}:{})});if(seq!==threadSequence)return;activeThread=data.topic;
      if(!append){const title=el('h2',data.topic.title);title.id='threadTitle';const body=el('p',data.topic.body,'post-body');$('threadContent').replaceChildren(el('span',categoryNames[data.topic.category],'pill'),title,meta(data.topic),el('p',`${data.topic.author} · Community contribution`,'small'),body);
        if(data.topic.url){const a=el('a','Open suggested resource ↗');a.href=data.topic.url;a.target='_blank';a.rel='noopener noreferrer nofollow';$('threadContent').append(a,el('p','Shared by a contributor. Check the original source and its relevance to your location.','small'));}
        $('threadContent').append(reportButton(data.topic));
      }
      if(append)$('replies').querySelector('.empty')?.remove();for(const reply of data.items)$('replies').append(renderReply(reply));
      if(!$('replies').children.length)$('replies').append(el('p','No published replies yet. Add a perspective from your practice location.','empty'));
      replyCursor=data.nextCursor;$('moreReplies').hidden=!replyCursor;$('replyButton').hidden=data.topic.locked===true;
      if(data.topic.locked)message('threadStatus','This discussion is closed to new replies.');
    }catch(error){if(seq!==threadSequence)return;message('threadStatus',error.message,true);$('replyButton').hidden=true;$('moreReplies').hidden=true;if(!append)$('threadContent').replaceChildren(el('h2','Discussion unavailable'));}
  }
  $('threadDialog').addEventListener('close',()=>{threadSequence++;});
  $('moreReplies').addEventListener('click',()=>openThread(activeThread.id,true));
  function categoryFields(){const resource=$('composeForm').elements.category.value==='practice-resources'&&compose?.kind==='topic';$('urlField').hidden=!resource;$('composeForm').elements.url.required=resource;}
  async function openCompose(kind='topic',suggested=false){
    compose={kind,parentId:kind==='reply'?activeThread.id:''};composeChallenge='';composeRequestId=crypto.randomUUID();$('composeForm').reset();message('composeStatus','Preparing your form…');$('submitContribution').disabled=true;
    $('composeTitle').textContent=kind==='reply'?'Add your perspective':suggested?'Suggest a useful resource':'Start a discussion';
    for(const id of ['categoryField','titleField'])$(id).hidden=kind==='reply';$('composeForm').elements.title.required=kind==='topic';
    const options=kind==='reply'&&activeThread.location!=='all'?places.filter(p=>p.id===activeThread.location):places;
    $('composeForm').elements.location.replaceChildren(...options.map(p=>new Option(p.name,p.id)));$('composeForm').elements.location.value=options.some(p=>p.id===selected)?selected:options[0].id;
    $('composeForm').elements.category.value=suggested?'practice-resources':'general';categoryFields();$('composeDialog').showModal();
    try{composeChallenge=await challenge();message('composeStatus','Your contribution will appear after moderator approval.');$('submitContribution').disabled=false;}catch(error){message('composeStatus',error.message,true);}
  }
  $('composeForm').elements.category.addEventListener('change',categoryFields);
  $('newTopic').addEventListener('click',()=>openCompose());$('suggestResource').addEventListener('click',()=>openCompose('topic',true));$('replyButton').addEventListener('click',()=>openCompose('reply'));
  $('composeForm').addEventListener('submit',async event=>{
    event.preventDefault();const fields=Object.fromEntries(new FormData(event.target));$('submitContribution').disabled=true;message('composeStatus','Sending for moderation…');
    try{const result=await request({}, {...fields,...compose,acknowledged:fields.acknowledged==='on',requestId:composeRequestId,challenge:composeChallenge});
      message('composeStatus',`Received for moderation. Reference: ${result.id}. Your contribution is not public yet.`);event.target.reset();$('submitContribution').textContent='Received for moderation';
    }catch(error){message('composeStatus',error.message,true);$('submitContribution').disabled=false;try{composeChallenge=await challenge();}catch{}}
  });
  $('composeDialog').addEventListener('close',()=>{$('submitContribution').textContent='Send for moderation';});
  async function openReport(item){
    reportTarget={targetKind:item.kind,targetId:item.id,targetParentId:item.parentId||''};reportRequestId=crypto.randomUUID();reportChallenge='';$('reportForm').reset();message('reportStatus','Preparing report…');$('reportForm').querySelector('button[type=submit]').disabled=true;$('reportDialog').showModal();
    try{reportChallenge=await challenge();message('reportStatus','');$('reportForm').querySelector('button[type=submit]').disabled=false;}catch(error){message('reportStatus',error.message,true);}
  }
  $('reportForm').addEventListener('submit',async event=>{
    event.preventDefault();const b=event.target.querySelector('button[type=submit]');b.disabled=true;const fields=Object.fromEntries(new FormData(event.target));
    try{const result=await request({}, {...fields,...reportTarget,kind:'report',acknowledged:fields.acknowledged==='on',requestId:reportRequestId,challenge:reportChallenge});message('reportStatus',`Report received privately. Reference: ${result.id}.`);event.target.reset();}
    catch(error){message('reportStatus',error.message,true);b.disabled=false;try{reportChallenge=await challenge();}catch{}}
  });
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $('searchForm').addEventListener('submit',event=>{event.preventDefault();loadFeed();});$('month').addEventListener('change',()=>loadFeed());$('loadMore').addEventListener('click',()=>loadFeed(true));
  if(['127.0.0.1','localhost'].includes(location.hostname)&&location.port==='8766'){const banner=el('div','LOCAL PREVIEW — demonstration contributions are fictional and stored separately from the live site.','review-boundary');document.querySelector('main').prepend(banner);}
  locationIdentity();loadFeed();loadMonthly();
})();
