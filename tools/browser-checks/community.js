async page => {
  const results=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
  const assert=(ok,label)=>{if(!ok)throw new Error(label);results.push(label);};
  const base='http://127.0.0.1:8766',title=`Browser journey ${Date.now()}`,reply='A fictional browser-check reply about learning together.',resourceTitle=`Resource check ${Date.now()}`;
  const ready=()=>page.waitForFunction(()=>document.getElementById('feedStatus').textContent.includes('discussions loaded'));
  async function community(){await page.goto(`${base}/community/?jurisdiction=wales`);await ready();}
  async function admin(status='pending'){
    await page.goto(`${base}/community/moderate.html`);await page.locator('#moderatorKey').fill('local-community-review');await page.locator('#moderatorStatus').selectOption(status);await page.getByRole('button',{name:'Load moderation queue',exact:true}).click();await page.waitForFunction(()=>document.getElementById('moderatorMessage').textContent.includes('contributions loaded'));
  }
  async function decision(card,action){await card.locator('textarea').first().fill('Reviewed fictional local test content only.');if(action==='Approve & publish')await card.locator('input[type=checkbox]').first().check();await card.getByRole('button',{name:action,exact:true}).click();await page.waitForFunction(()=>document.getElementById('moderatorMessage').textContent.includes('contributions loaded'));}
  async function findTopic(){await page.locator('#search').fill(title);await page.getByRole('button',{name:'Search',exact:true}).click();await ready();await page.getByRole('button',{name:title,exact:true}).click();await page.locator('#threadTitle').waitFor();}
  await page.goto(`${base}/community/?jurisdiction=all`);await ready();
  assert((await page.locator('main').textContent()).includes('LOCAL PREVIEW'),'Preview data clearly separated from production');
  assert(await page.locator('#heroFlags img').count()===9,'Existing location symbols reused, including neutral Northern Ireland pin');
  await page.locator('#chooseLocation').click();assert(await page.locator('#locationOptions button').count()===13,'All 12 locations plus shared view available');
  const ids=await page.locator('#locationOptions button').evaluateAll(nodes=>nodes.map(n=>n.dataset.location));
  for(const id of ids){
    if(!await page.locator('#locationDialog').isVisible())await page.locator('#chooseLocation').click();
    await page.locator(`#locationOptions [data-location="${id}"]`).click();await ready();
    assert(await page.locator('#topicList .topic-card').count()>=2,`${id} includes shared learning topics`);
  }
  await community();
  await page.getByRole('button',{name:'Start a discussion',exact:true}).click();
  await page.locator('#composeForm [name=author]').fill('Fictional browser tester');await page.locator('#composeForm [name=title]').fill(title);
  await page.locator('#composeForm [name=body]').fill('Fictional learning text. <img src=x onerror="window.communityXss=true"> This is not real case information.');await page.locator('#composeForm [name=acknowledged]').check();
  // The server deliberately rejects submissions less than two seconds after issuing a challenge.
  await page.waitForTimeout(2200);await page.locator('#submitContribution').click();await page.waitForFunction(()=>document.getElementById('composeStatus').textContent.includes('Received for moderation'));
  assert((await page.locator('#composeStatus').textContent()).includes('not public yet'),'Visitor receives a pending reference, not a false publication confirmation');
  await page.getByRole('button',{name:'Close contribution form',exact:true}).click();await page.locator('#search').fill(title);await page.getByRole('button',{name:'Search',exact:true}).click();await ready();
  assert(await page.locator('#topicList .topic-card').count()===0,'Unapproved submission absent from public search');
  await admin();let card=page.locator('#moderatorList > .moderator-card').filter({hasText:title});await decision(card,'Approve & publish');
  await community();await findTopic();assert((await page.locator('#threadContent .post-body').textContent()).includes('<img'),'Approved contribution renders markup as text');assert(await page.locator('#threadContent .post-body img').count()===0,'Contribution cannot inject image markup');assert(!await page.evaluate(()=>window.communityXss),'No injected script executed');
  await page.getByRole('button',{name:'Add a reply',exact:true}).click();assert(await page.locator('#composeForm [name=location]').inputValue()==='wales','Reply inherits local discussion location');
  await page.locator('#composeForm [name=body]').fill(reply);await page.locator('#composeForm [name=acknowledged]').check();await page.waitForTimeout(2200);await page.locator('#submitContribution').click();await page.waitForFunction(()=>document.getElementById('composeStatus').textContent.includes('Received for moderation'));
  await page.getByRole('button',{name:'Close contribution form',exact:true}).click();assert(await page.locator('#replies .reply-card').count()===0,'Reply stays private before approval');
  await admin();card=page.locator('#moderatorList > .moderator-card').filter({hasText:reply});await card.getByRole('button',{name:'Review parent discussion',exact:true}).click();await card.locator('.selection-context').waitFor();assert((await card.locator('.selection-context').textContent()).includes(title),'Moderator can inspect reply context');await decision(card,'Approve & publish');
  await community();await findTopic();assert((await page.locator('#replies').textContent()).includes(reply),'Approved reply appears in correct thread');
  await page.locator('#replies .reply-card').getByRole('button',{name:'Report',exact:true}).click();await page.locator('#reportForm [name=body]').fill(`Private test report for ${title}`);await page.locator('#reportForm [name=acknowledged]').check();await page.waitForTimeout(2200);await page.getByRole('button',{name:'Send report',exact:true}).click();await page.waitForFunction(()=>document.getElementById('reportStatus').textContent.includes('received privately'));
  await admin('open');card=page.locator('#moderatorList > .moderator-card').filter({hasText:`Private test report for ${title}`});await card.getByRole('button',{name:'Review reported contribution',exact:true}).click();await card.locator('.selection-context').waitFor();assert((await card.locator('.selection-context').textContent()).includes(reply),'Report links to authoritative contribution for review');await decision(card.locator('.selection-context > .moderator-card'),'Remove & erase text');
  card=page.locator('#moderatorList > .moderator-card').filter({hasText:`Private test report for ${title}`});await decision(card,'Resolve report');
  await community();await findTopic();assert(await page.locator('#replies .reply-card').count()===0,'Removed reply disappears publicly');
  await admin('approved');card=page.locator('#moderatorList > .moderator-card').filter({hasText:title});await decision(card,'Close replies');
  await community();await findTopic();assert(!await page.locator('#replyButton').isVisible(),'Closed discussion disables public replies');
  await admin('approved');card=page.locator('#moderatorList > .moderator-card').filter({hasText:title});await decision(card,'Remove & erase text');
  await community();await page.locator('#search').fill(title);await page.getByRole('button',{name:'Search',exact:true}).click();await ready();assert(await page.locator('#topicList .topic-card').count()===0,'Removed topic disappears from search');
  await page.getByRole('button',{name:'Suggest a resource ↗',exact:true}).click();assert(await page.locator('#composeForm [name=category]').inputValue()==='practice-resources','Resource shortcut selects correct category');assert(await page.locator('#composeForm [name=url]').getAttribute('required')!==null,'Resource submissions require a link');
  await page.locator('#composeForm [name=title]').fill(resourceTitle);await page.locator('#composeForm [name=url]').fill('https://www.gov.wales/');await page.locator('#composeForm [name=body]').fill('Fictional test resource submission for a local moderation check.');await page.locator('#composeForm [name=acknowledged]').check();await page.waitForTimeout(2200);await page.locator('#submitContribution').click();await page.waitForFunction(()=>document.getElementById('composeStatus').textContent.includes('Received for moderation'));
  await admin();card=page.locator('#moderatorList > .moderator-card').filter({hasText:resourceTitle});assert(await card.locator('a[href="https://www.gov.wales/"]').count()===1,'Moderator can inspect proposed resource link');await decision(card,'Reject & erase text');
  await page.locator('#clearAccess').click();assert(await page.locator('#moderatorKey').inputValue()===''&&await page.locator('#moderatorList').textContent()==='','Clearing access removes both key and private queue');
  await community();await page.getByRole('button',{name:'Join the discussion →',exact:true}).click();await page.locator('#threadTitle').waitFor();assert((await page.locator('#threadContent').textContent()).includes('FICTIONAL LEARNING SCENARIO'),'Monthly discussion clearly identified as fictional');await page.getByRole('button',{name:'Close discussion',exact:true}).click();
  for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Community fits ${width}px`);if(width===1440||width===390)await page.screenshot({path:`output/playwright/community-${width}.png`,fullPage:true});}
  await page.getByRole('button',{name:'Start a discussion',exact:true}).click();assert(await page.evaluate(()=>document.querySelector('#composeDialog').scrollWidth<=document.querySelector('#composeDialog').clientWidth),'Mobile contribution form has no horizontal overflow');await page.getByRole('button',{name:'Close contribution form',exact:true}).click();
  await admin();await page.setViewportSize({width:390,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Moderator queue fits mobile');await page.screenshot({path:'output/playwright/community-moderator-mobile.png',fullPage:true});await page.locator('#clearAccess').click();
  assert(errors.length===0,`No browser errors: ${errors.join(', ')}`);
  await page.setViewportSize({width:1440,height:1000});await page.goto(`${base}/community/?jurisdiction=all`);return results;
}
