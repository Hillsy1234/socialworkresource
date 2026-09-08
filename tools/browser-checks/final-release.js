async page => {
 const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assert=(ok,label)=>{if(!ok)throw Error(label);results.push(label)};
 const settled=async id=>page.waitForFunction(id=>document.documentElement.dataset.jurisdiction===id && document.querySelector('#learningWorkspace').getAttribute('aria-busy')==='false',id);
 const go=async(id,resource='readme')=>{await page.goto(`http://127.0.0.1:8765/?jurisdiction=${id}&resource=${resource}`);await settled(id)};
 await go('england');
 const ids=await page.locator('#jurisdictionSelect option').evaluateAll(os=>os.map(o=>o.value));
 assert(ids.length===12,'12 selectable locations');
 const packs=await page.evaluate(async ids=>Promise.all(ids.map(async id=>(await fetch(`content/${id}/manifest.json`)).json())),ids);
 for(const pack of packs){
  const name=pack.label.replace(' practice guide','');
  await go(pack.id);
  assert((await page.locator('#jurisdictionStatus').innerText()).includes('Final learning guide'),`${pack.id}: final release label`);
  for(const resource of pack.resources){
   await page.locator(`#navList [data-open="${resource.id}"]`).click();
   assert(await page.locator('#activeTitle').innerText()===resource.title,`${pack.id}/${resource.id}: heading`);
   assert((await page.locator('#contentView').innerText()).length>150,`${pack.id}/${resource.id}: content`);
  }
  if(pack.id==='england')continue;
  await go(pack.id,'flashcards');assert(await page.locator('[data-flip-card]').count()===40,`${pack.id}: 40 cards`);
  await page.locator('[data-flip-card]').first().click();assert(await page.locator('[data-flip-card]').first().getAttribute('aria-pressed')==='true',`${pack.id}: card flip`);
  await go(pack.id,'student-pathway');assert(!(await page.locator('#contentView').innerText()).includes('ASYE'),`${pack.id}: no England qualification label`);
  await go(pack.id,'templates');assert(await page.locator('[data-download-template]').count()===10,`${pack.id}: ten templates`);
  const templateEvent=page.waitForEvent('download');await page.locator('[data-download-template]').first().click();const template=await templateEvent;
  assert(template.suggestedFilename().startsWith(pack.id+'-'),`${pack.id}: template filename`);
  await template.saveAs(`output/playwright/final-${pack.id}-template.txt`);
  await go(pack.id,'cpd-log');
  assert((await page.locator('.tool-panel h2').innerText()).includes(name),`${pack.id}: reflection heading`);
  await page.locator('[name="title"]').fill(`Final check ${pack.id}`);
  await page.locator('[name="activityDate"]').fill('2026-09-08');
  await page.locator('[name="learning"]').fill(`Synthetic ${pack.id} learning only`);
  await page.locator('[name="impact"]').fill('Test impact');
  await page.locator('[name="peerLearning"]').fill('Test discussion');
  await page.locator('[name="action"]').fill('Test next action');
  await page.locator('#locationChooserButton').click();await page.locator('[data-location=\"'+'england'+'\"]').click();await settled('england');
  assert(!(await page.locator('#cpdEntries').innerText()).includes(`Final check ${pack.id}`),`${pack.id}: country isolation`);
  await page.locator('#locationChooserButton').click();await page.locator('[data-location=\"'+pack.id+'\"]').click();await settled(pack.id);
  assert(await page.locator('[name="title"]').inputValue()===`Final check ${pack.id}`,`${pack.id}: unfinished notes preserved`);
  await page.getByRole('button',{name:'Save reflection',exact:true}).click();
  assert((await page.locator('#cpdEntries').innerText()).includes('Test discussion') && (await page.locator('#cpdEntries').innerText()).includes(name),`${pack.id}: saved reflection correct label and fields`);
  await page.reload();await settled(pack.id);
  assert((await page.locator('#cpdEntries').innerText()).includes('Test next action'),`${pack.id}: saved after reload`);
  const exportEvent=page.waitForEvent('download');await page.locator('[data-export-cpd]').click();const download=await exportEvent;
  assert(download.suggestedFilename()===`${pack.id}-reflections.txt`,`${pack.id}: export filename`);
  await download.saveAs(`output/playwright/final-${pack.id}-reflections.txt`);
  const popupEvent=page.waitForEvent('popup');await page.locator('[data-print-cpd]').click();const popup=await popupEvent;await popup.waitForLoadState('domcontentloaded');
  assert((await popup.locator('body').innerText()).includes(`${name} reflections`) && (await popup.locator('body').innerText()).includes('Test next action'),`${pack.id}: print location and content`);
  if(pack.id==='australia-victoria')await popup.screenshot({path:'output/playwright/final-victoria-reflections.png'});
  await popup.close();
  await page.setViewportSize({width:320,height:740});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${pack.id}: mobile reflection layout`);
  await page.setViewportSize({width:1440,height:1000});
 }
 await go('canada-british-columbia','children');await page.screenshot({path:'output/playwright/final-bc-desktop.png'});
 await page.setViewportSize({width:320,height:740});await page.screenshot({path:'output/playwright/final-bc-mobile.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'BC mobile module layout');
 assert(errors.length===0,`No JavaScript errors: ${errors.join(';')}`);
 return `${results.length} final-release checks passed across ${packs.length} locations.`;
}
