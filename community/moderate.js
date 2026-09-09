(() => {
  const $=id=>document.getElementById(id),endpoint='/.netlify/functions/community-moderate';
  const el=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;};
  let generation=0;
  const place=id=>id==='all'?'All locations':practiceLocations.find(p=>p.id===id)?.name||id;
  $('moderatorMonth').value=new Date().toISOString().slice(0,7);
  function message(text,error=false){$('moderatorMessage').textContent=text;$('moderatorMessage').classList.toggle('error',error);}
  async function request(params={},body){
    const headers={Authorization:`Bearer ${$('moderatorKey').value}`};const options={headers,cache:'no-store',redirect:'error'};
    if(body){options.method='POST';headers['Content-Type']='application/json';options.body=JSON.stringify(body);}
    const response=await fetch(`${endpoint}?${new URLSearchParams(params)}`,options);let data;try{data=await response.json();}catch{throw new Error('Moderation service could not be reached.');}
    if(!response.ok)throw new Error(data.error||`Request failed (${response.status}).`);return data;
  }
  function card(item){
    const article=el('article','','moderator-card');article.append(el('span',`${item.kind} · ${item.status}`,'pill'),el('h2',item.title||item.reason||'Community reply'),el('p',`Reference: ${item.id}`,'small'),el('p',`${place(item.location)||'Private report'} · ${item.author||'No public name'} · ${new Date(item.createdAt).toLocaleString()}`,'meta'));
    if(item.fictional)article.append(el('p','Fictional monthly learning scenario. Requires your approval.','pill'));
    if(item.body)article.append(el('p',item.body,'post-body'));
    if(item.url){const a=el('a',item.url);a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';article.append(a);}
    if(item.kind==='reply' || item.kind==='report'){
      const review=el('button',item.kind==='report'?'Review reported contribution':'Review parent discussion','secondary');review.type='button';
      review.addEventListener('click',async()=>{review.disabled=true;const seq=generation;try{const target=await request({action:'item',kind:item.kind==='reply'?'topic':item.targetKind,id:item.kind==='reply'?item.parentId:item.targetId,parentId:item.targetParentId||''});if(seq!==generation)return;let context=article.querySelector('.selection-context');if(!context){context=el('div','','selection-context');article.append(context);}context.replaceChildren(card(target));}catch(error){if(seq===generation)message(error.message,true);}finally{review.disabled=false;}});const reviewActions=el('div','','post-actions');reviewActions.append(review);article.append(reviewActions);
    }
    if(item.moderatorNote)article.append(el('p',`Latest moderator note: ${item.moderatorNote}`,'small'));
    const actions=item.kind==='report'?(item.status==='open'?['resolve']:[]):item.status==='pending'?['approve','reject']:item.status==='approved'?['remove',...(item.kind==='topic'?[item.locked?'unlock':'lock']:[])]:[];
    if(!actions.length)return article;
    const label=el('label','Moderator decision note');const note=el('textarea');note.rows=2;note.minLength=5;note.maxLength=500;note.required=true;label.append(note);article.append(label);
    if(item.status==='pending' && item.kind!=='report'){
      const nameLabel=el('label','Display name — add any training label before approval');const name=el('input');name.className='pending-display-name';name.value=item.author;name.minLength=2;name.maxLength=50;name.required=true;nameLabel.append(name);article.append(nameLabel);
      const saveName=el('button','Save display name','secondary');saveName.type='button';
      article.append(el('p','Saving a name keeps this contribution pending. Identify fictional contributors clearly; do not attribute examples to real members.','small'));
      saveName.addEventListener('click',async()=>{
        if(!name.reportValidity() || !note.reportValidity())return;
        const seq=generation;article.querySelectorAll('button').forEach(button=>button.disabled=true);
        try{await request({}, {kind:item.kind,id:item.id,parentId:item.parentId||'',etag:item.etag,action:'edit-name',author:name.value,note:note.value});if(seq!==generation)return;await load();message('Display name saved. Contribution is still awaiting approval.');}
        catch(error){if(seq===generation)message(error.message,true);article.querySelectorAll('button').forEach(button=>button.disabled=false);}
      });article.append(saveName);
    }
    const check=el('input');check.type='checkbox';const ack=el('label','','check');ack.append(check,el('span','I checked this contribution for identifiable information, suitability and any resource links.'));if(actions.includes('approve'))article.append(ack);
    const buttons=el('div','','moderator-actions');const labels={approve:'Approve & publish',reject:'Reject & erase text',remove:'Remove & erase text',lock:'Close replies',unlock:'Reopen replies',resolve:'Resolve report'};
    for(const action of actions){const button=el('button',labels[action],`secondary ${['remove','reject'].includes(action)?'danger':''}`);button.type='button';button.addEventListener('click',async()=>{
      if(!note.reportValidity())return;if(action==='approve'&&article.querySelector('.pending-display-name')?.value!==item.author){message('Save the display name before approving this contribution.',true);return;}if(action==='approve'&&!check.checked){message('Confirm the publication checks before approving.',true);check.focus();return;}
      const seq=generation;buttons.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{await request({}, {kind:item.kind,id:item.id,parentId:item.parentId||'',etag:item.etag,action,note:note.value,checked:check.checked});if(seq!==generation)return;message(`Decision saved: ${labels[action]}.`);await load();}
      catch(error){if(seq===generation)message(error.message,true);buttons.querySelectorAll('button').forEach(b=>b.disabled=false);}
    });buttons.append(button);}article.append(buttons);return article;
  }
  async function load(){
    if(!$('moderatorForm').reportValidity())return;const seq=++generation;message('Loading private moderation queue…');
    try{const data=await request({month:$('moderatorMonth').value,status:$('moderatorStatus').value});if(seq!==generation)return;$('moderatorList').replaceChildren(...data.items.map(card));if(!data.items.length)$('moderatorList').append(el('p','No contributions match this month and status.','empty'));message(`${data.items.length} contributions loaded.`);}
    catch(error){if(seq!==generation)return;$('moderatorList').replaceChildren();message(error.message,true);}
  }
  $('moderatorForm').addEventListener('submit',event=>{event.preventDefault();load();});
  $('prepareMonthly').addEventListener('click',async()=>{if(!$('moderatorKey').value){message('Enter your owner monitoring access key first.',true);return;}const seq=generation;$('prepareMonthly').disabled=true;try{const result=await request({}, {action:'prepare-monthly'});if(seq!==generation)return;$('moderatorMonth').value=new Date().toISOString().slice(0,7);$('moderatorStatus').value='pending';await load();message(result.created?'This month’s fictional scenario is ready for your review.':'This month’s scenario already exists; no duplicate was created. Check other statuses if it is not awaiting approval.');}catch(error){if(seq===generation)message(error.message,true);}finally{$('prepareMonthly').disabled=false;}});
  $('clearAccess').addEventListener('click',()=>{generation++;$('moderatorKey').value='';$('moderatorList').replaceChildren();message('Access key cleared.');});
  if(['127.0.0.1','localhost'].includes(location.hostname)&&location.port==='8766')message('LOCAL PREVIEW ONLY. Use access key: local-community-review. This does not access live contributions.');
})();
