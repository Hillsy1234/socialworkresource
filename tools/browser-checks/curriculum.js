async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let checks=0;const assert=(v,label)=>{if(!v)throw Error(label);checks++};
 const go=async(id,resource)=>{await page.goto(`http://127.0.0.1:8765/?jurisdiction=${id}&resource=${resource}`);await page.waitForFunction(id=>document.documentElement.dataset.jurisdiction===id&&document.querySelector('#learningWorkspace')?.getAttribute('aria-busy')==='false',id)};
 await go('england','readme');
 const ids=await page.locator('#jurisdictionSelect option').evaluateAll(es=>es.map(e=>e.value));
 const packs=await page.evaluate(async ids=>Promise.all(ids.map(async id=>(await fetch(`content/${id}/manifest.json`)).json())),ids);
 for(const pack of packs){
  await go(pack.id,'readme');
  for(const r of pack.resources){
   await page.locator(`#navList [data-open="${r.id}"]`).click();
   await page.waitForFunction(title=>document.querySelector('#activeTitle')?.textContent===title,r.title);
   assert((await page.locator('#contentView').innerText()).length>150,`${pack.id}/${r.id}: readable content`);
  }
  if(pack.id==='england')continue;
  await go(pack.id,'flashcards');
  assert(await page.locator('[data-flip-card]').count()===40,`${pack.id}: cards`);
  for(const width of [1440,320]){
   await page.setViewportSize({width,height:950});
   const clipped=await page.locator('.flashcard-face').evaluateAll(es=>es.filter(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2).length);
   assert(clipped===0,`${pack.id}: ${clipped} clipped faces at ${width}`);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${pack.id}: page width ${width}`);
  }
  await page.locator('[data-flip-card]').first().click();
  assert(await page.locator('[data-flip-card]').first().getAttribute('aria-pressed')==='true',`${pack.id}: flip`);
  await page.setViewportSize({width:1440,height:950});
  await go(pack.id,'templates');
  const event=page.waitForEvent('download');await page.locator('[data-download-template]').first().click();const download=await event;
  assert(download.suggestedFilename().startsWith(pack.id+'-'),`${pack.id}: local template`);
  await download.saveAs(`output/playwright/curriculum-${pack.id}.txt`);
 }
 await go('scotland','flashcards');await page.locator('[data-flip-card]').first().click();
 await page.setViewportSize({width:390,height:850});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.flashcard-inner')).transform.startsWith('matrix3d(-1,'));
 await page.locator('[data-flip-card]').first().evaluate(el=>window.scrollBy(0,el.getBoundingClientRect().top-360));
 await page.screenshot({path:'output/playwright/curriculum-mobile-card.png'});
 await page.setViewportSize({width:1440,height:1000});await go('canada-british-columbia','children');
 await page.locator('#learningWorkspace').scrollIntoViewIfNeeded();
 await page.screenshot({path:'output/playwright/curriculum-bc-lesson.png'});
 assert(!errors.length,errors.join(';'));
 return `${checks} curriculum browser checks passed across ${packs.length} locations; all 880 expanded card faces fit at desktop and mobile widths.`;
}
