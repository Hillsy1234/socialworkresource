async (page) => {
 await page.route('**/*', route => route.continue());
 const results=[]; const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const assert=(x,m)=>{if(!x)throw Error(m);results.push(m)};
 const settled=async c=>page.waitForFunction(c=>document.documentElement.dataset.jurisdiction===c && document.querySelector('#learningWorkspace').getAttribute('aria-busy')==='false',c);
 const go=async(c,id)=>{await page.goto(`http://127.0.0.1:8765/?jurisdiction=${c}&resource=${id}`);await settled(c)};
 const choose=async c=>{await page.locator('#locationChooserButton').click();await page.locator('[data-location=\"'+c+'\"]').click();await settled(c)};
 await go('wales','readme');
 const packs=await page.evaluate(async()=>Promise.all(['england','wales'].map(async id=>(await fetch(`content/${id}/manifest.json`)).json())));
 for(const pack of packs){
  await go(pack.id,'readme');
  for(const r of pack.resources){
   await page.locator(`#navList [data-open="${r.id}"]`).click();
   assert((await page.locator('#activeTitle').innerText())===r.title,`${pack.id}/${r.id} renders`);
   assert((await page.locator('#contentView').innerText()).length>100,`${pack.id}/${r.id} has content`);
  }
 }
 await go('wales','flashcards');assert(await page.locator('[data-flip-card]').count()===40,'40 Wales flashcards');
 await page.locator('[data-flip-card]').first().click();assert(await page.locator('[data-flip-card]').first().getAttribute('aria-pressed')==='true','Card flip works');
 await page.locator('[data-flashcard-filter="safeguarding"]').click();assert(await page.locator('[data-flip-card]').count()===5,'Module card filter works');
 await go('wales','theory-practice');await page.locator('[data-hypothesis-answer]').first().check();assert(await page.locator('#hypothesisResults .hypothesis-card').count()>0,'Theory finder produces results');
 await go('wales','children-models');await page.locator('[data-model-answer]').first().check();assert(!(await page.locator('#childrenModelResults').innerText()).includes('No child or family'),'Model finder produces results');
 await go('wales','scenarios');assert(await page.locator('[data-scenario-toggle]').count()===8,'Eight scenario workouts');await page.locator('[data-scenario-toggle]').first().click();assert(await page.locator('.scenario-reveal').first().isVisible(),'Scenario answer reveal works');
 await go('wales','student-pathway');assert(await page.locator('.pathway-step').count()===8,'Eight Wales pathway activities');assert(!/ASYE|Section 42|EHCP/.test(await page.locator('#contentView').innerText()),'Wales pathway wording');
 await go('wales','templates');assert(await page.locator('[data-download-template]').count()===10,'Ten Wales downloadable prompts');
 const downloadEvent=page.waitForEvent('download');await page.locator('[data-download-template]').first().click();const download=await downloadEvent;assert(download.suggestedFilename()==='wales-care-support-prompt.txt','Individual download identifies Wales');await download.saveAs('output/playwright/wales-care-support-prompt.txt');
 const allEvent=page.waitForEvent('download');await page.locator('[data-download-all-tools]').click();const all=await allEvent;assert(all.suggestedFilename().startsWith('wales-'),'Combined download identifies Wales');await all.saveAs('output/playwright/wales-all-prompts.txt');
 await go('wales','glossary');await page.locator('#glossarySearch').fill('IDP');assert((await page.locator('#contentView').innerText()).includes('Individual development plan'),'Glossary search works');
 await go('wales','case-route-finder');await page.locator('[data-route-answer="abuse-neglect"]').check();assert((await page.locator('#routeFinderResults').innerText()).includes('Safeguarding Adults in Wales'),'Wales route finder works');
 await page.locator('#searchInput').fill('Section 42');assert(!(await page.locator('#sidebarSearchResults').innerText()).includes('Safeguarding Adults'),'Search excludes England safeguarding');
 await go('wales','cpd-log');await page.locator('.cpd-form [name="title"]').fill('Completion test reflection');await page.locator('.cpd-form [name="learning"]').fill('Synthetic learning only');await choose('england');await choose('wales');assert(await page.locator('.cpd-form [name="title"]').inputValue()==='Completion test reflection','Unsaved reflection survives country switch');await page.locator('.cpd-form [name="activityDate"]').fill('2026-09-08');await page.locator('.cpd-form [name="impact"]').fill('Synthetic impact');await page.getByRole('button',{name:'Save reflection',exact:true}).click();assert((await page.locator('#cpdEntries').innerText()).includes('Completion test reflection'),'Wales reflection saved');await choose('england');assert(!(await page.locator('#cpdEntries').innerText()).includes('Completion test reflection'),'Country reflections are isolated');
 await go('england','care-act');await choose('wales');assert((await page.locator('#activeTitle').innerText())==='Care and Support in Wales','Equivalent topic preserved');await page.goBack();await settled('england');await page.goForward();await settled('wales');assert(true,'Browser Back and Forward preserve country');
 await page.goto('http://127.0.0.1:8765/?resource=care-act');await settled('england');assert(true,'Legacy England links preserved');
 await choose('wales');await page.goto('http://127.0.0.1:8765/');await settled('wales');assert(true,'Country preference remembered');
 await go('england','readme');await page.route('**/content/wales/manifest.json*',r=>r.abort());await page.locator('#locationChooserButton').click();await page.locator('[data-location=\"'+'wales'+'\"]').click();await page.waitForFunction(()=>document.querySelector('#jurisdictionStatus').textContent.includes('Unable to load'));assert(await page.locator('html').getAttribute('data-jurisdiction')==='england','Failed manifest preserves current pack');await page.unroute('**/content/wales/manifest.json*');await choose('wales');assert(true,'Failed load can be retried');
 await go('england','readme');await page.route('**/content/wales/resources/children.md*',r=>r.abort());await page.locator('#locationChooserButton').click();await page.locator('[data-location=\"'+'wales'+'\"]').click();await page.waitForFunction(()=>document.querySelector('#jurisdictionStatus').textContent.includes('Unable to load'));assert(await page.locator('html').getAttribute('data-jurisdiction')==='england','Partial content load rolls back atomically');await page.unroute('**/content/wales/resources/children.md*');await choose('wales');
 for(const id of ['readme','mha','flashcards','theory-practice','children-models','templates','cpd-log']) {await go('wales',id);await page.setViewportSize({width:320,height:740});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`320px layout: ${id}`)}
 await go('wales','readme');await page.screenshot({path:'output/playwright/completed-wales-mobile.png'});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'output/playwright/completed-wales-desktop.png'});
 await page.goto('http://127.0.0.1:8765/learning/wales/');assert((await page.locator('h1').innerText()).includes('Social work'),'Wales static index loads');assert(await page.locator('.index-card').count()===26,'Wales static index lists 26 sections');
 assert(errors.length===0,`No JavaScript exceptions (${errors.join(';')})`);
 return `${results.length} checks passed\n${results.slice(104).join('\n')}`;
}
