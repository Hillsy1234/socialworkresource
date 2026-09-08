(() => {
  const $=id=>document.getElementById(id);
  const el=(tag,text,className)=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e};
  const link=(title,url)=>{const a=el('a',title);try{if(new URL(url).protocol==='https:'){a.href=url;a.target='_blank';a.rel='noopener noreferrer'}}catch{}return a};
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const demo=local&&new URLSearchParams(location.search).get('demo')==='1';
  const filter=new URLSearchParams(location.search).get('source');
  let key='',selected=null,busy=false,generation=0,nextPage=null,fixture=null,poll=null,polls=0;
  const message=text=>$('reviewMessage').textContent=text;
  function clear(){generation++;key='';selected=null;clearTimeout(poll);$('accessKey').value='';$('proposalList').hidden=true;$('proposalDetail').hidden=true;$('signOut').hidden=true;message('Access cleared.');}
  async function api(params='',body){
    if(demo){
      fixture??=await fetch('/output/editorial/demo.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Create the local review example using npm run editorial:demo.');return r.json()});
      if(body){fixture.detail.state='closed';fixture.detail.merged=body.action==='approve';fixture.detail.deployment=body.action==='approve'?{state:'live'}:null;fixture.detail.blockers=['This demonstration decision has been recorded only in this page.'];return {outcome:body.action==='approve'?'merged':'rejected'};}
      return params.includes('proposal=')?structuredClone(fixture.detail):{proposals:[{...fixture.proposal,state:fixture.detail.state,mergedAt:fixture.detail.merged?'demo':null}],nextPage:null};
    }
    const response=await fetch(`/.netlify/functions/editorial-review${params}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${key}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',redirect:'error'});
    let data;try{data=await response.json()}catch{throw Error('The approval service is unavailable here. Use the production review page, or the local demonstration.');}
    if(!response.ok)throw Error(data.error||'The review could not be loaded.');return data;
  }
  async function loadList(page=1){
    if(busy)return;const ticket=generation;busy=true;$('reloadList').disabled=true;$('more').disabled=true;
    try{const data=await api(`?page=${page}`);if(ticket!==generation)return;if(page===1)$('proposals').replaceChildren();
      if(filter){$('sourceFilter').hidden=false;$('sourceFilter').textContent='Showing proposals for the source you selected. Clear the source filter to see all updates. A proposal without a valid source record may need the editor’s attention.';const a=el('a',' Show all');a.href='./review.html';$('sourceFilter').append(a);}
      const proposals=filter?data.proposals.filter(p=>p.sourceIds?.includes(filter)):data.proposals;
      for(const p of proposals){const row=el('article','','proposal-row'),copy=el('div','');copy.append(el('h3',p.title),el('p',`${p.mergedAt?'Merged':p.state==='closed'?'Closed':p.draft?'Being prepared':'Awaiting review'} · Proposal #${p.number}`,'metadata'));const button=el('button','Review update');button.addEventListener('click',()=>loadDetail(p.number));row.append(copy,button);$('proposals').append(row);}
      nextPage=data.nextPage;$('more').hidden=!nextPage;
      if(!$('proposals').children.length)$('proposals').append(el('p','No prepared updates found. Source changes must first be reviewed and turned into an update proposal.','empty'));
      $('proposalList').hidden=false;$('signOut').hidden=demo;message(demo?'Local demonstration loaded. Nothing here can publish to the live site.':'Proposed updates loaded.');
    }catch(e){if(ticket===generation)message(e.message)}finally{busy=false;$('reloadList').disabled=false;$('more').disabled=false;}
  }
  async function loadDetail(number,focus=true){
    if(busy)return;const ticket=++generation;selected=null;clearTimeout(poll);$('confirmed').checked=false;buttons();message('Loading the current proposal and validation results…');
    try{const data=await api(`?proposal=${number}`);if(ticket!==generation)return;selected=data;render(data);message(demo?'Local demonstration: decisions do not publish.':'Review the edits and the source evidence before deciding.');if(focus)$('proposalDetail').focus();
      if(data.merged&&!['live','included'].includes(data.deployment?.state)&&polls++<20)poll=setTimeout(()=>loadDetail(number,false),15000);
    }catch(e){if(ticket===generation){$('proposalDetail').hidden=true;message(e.message)}}
  }
  function render(p){
    $('proposalTitle').textContent=p.title;$('proposalVersion').replaceChildren(el('span',`Reviewed version ${p.head.slice(0,7)} · Validation: ${p.validation} · `),link('Open proposal in GitHub',p.url));
    $('proposalState').textContent=p.merged?(p.deployment?.state==='live'?'Live — publication confirmed.':p.deployment?.state==='included'?'A newer release is live. This update is in its history; later edits may supersede it.':'Approved and merged — publication is not confirmed yet. Use Refresh status to check again; if it remains pending, check Netlify’s deployment log.'):(p.state==='closed'?'Closed — this proposal was not published.':p.blockers.length?'Needs attention before approval.':'Ready for your review.');
    if(demo)$('proposalState').textContent='Demonstration only · '+$('proposalState').textContent;
    $('proposalExplanation').replaceChildren();for(const [field,title] of [['summary','What changes'],['reason','Why it changes'],['commencement','When it applies']])$('proposalExplanation').append(el('h3',title),el('p',p.record?.[field]||'The editor must complete this explanation.'));
    $('proposalSources').replaceChildren(...p.sources.map(s=>{const li=el('li','');li.append(link(s.title,s.url));return li}));
    $('reviewBlockers').hidden=!p.blockers.length;$('reviewBlockers').replaceChildren(...p.blockers.map(b=>el('p',b)));
    $('proposalChanges').replaceChildren(...p.changes.map(f=>{const details=el('details','','change');details.append(el('summary',`${f.path} · +${f.additions} / −${f.deletions}`));const pre=el('pre','');for(const line of f.patch.split('\n'))pre.append(el('span',line,`diff-line ${line.startsWith('+')?'diff-add':line.startsWith('-')?'diff-remove':''}`));details.append(pre);return details}));
    $('decisionForm').hidden=p.state!=='open';$('proposalDetail').hidden=false;buttons();
  }
  function buttons(){const ready=selected?.state==='open'&&$('confirmed').checked&&!busy;$('approve').disabled=!ready||!!selected?.blockers.length;$('reject').disabled=!ready;}
  $('accessForm').addEventListener('submit',async event=>{event.preventDefault();if(busy)return;const entered=$('accessKey').value;clear();key=entered;$('accessKey').value=entered;await loadList();});
  $('confirmed').addEventListener('change',buttons);
  $('signOut').addEventListener('click',clear);
  $('reloadList').addEventListener('click',()=>loadList());$('more').addEventListener('click',()=>loadList(nextPage));$('reloadDetail').addEventListener('click',()=>{if(selected){polls=0;loadDetail(selected.number)}});
  $('decisionForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!selected||!$('confirmed').checked)return;const current=selected,action=event.submitter?.value,ticket=generation;if(!['approve','reject'].includes(action))return;if(action==='approve'&&current.blockers.length)return;
    busy=true;clearTimeout(poll);buttons();message(action==='approve'?'Submitting your approval…':'Closing this proposal…');
    try{const result=await api('',{number:current.number,head:current.head,reviewDigest:current.reviewDigest,confirmed:true,action});if(ticket!==generation)return;busy=false;polls=0;await loadDetail(current.number,false);message(demo?'Demonstration complete. No live changes were made.':result.outcome==='merged'?'Approved. GitHub has merged the update; Netlify publication is tracked above.':'Proposal rejected. Its edits were not published.');}
    catch(e){if(ticket!==generation)return;busy=false;selected=null;$('confirmed').checked=false;$('proposalDetail').hidden=true;message(e.message+' Reload the proposal to confirm its current state.');}finally{busy=false;buttons();}
  });
  // Never persist the monitoring key in storage or a URL.
  window.addEventListener('pagehide',()=>{key='';$('accessKey').value='';clearTimeout(poll)});
  if(demo){$('demoNotice').hidden=false;$('accessForm').hidden=true;loadList();}
})();
