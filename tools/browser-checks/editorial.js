async page => {
 const errors=[],posts=[];page.on('pageerror',e=>errors.push(e.message));let assertions=0;const assert=(v,m)=>{if(!v)throw Error(m);assertions++};
 await page.goto('http://127.0.0.1:8765/monitoring/review.html?demo=1');
 await page.getByRole('button',{name:'Review update',exact:true}).click();
 assert(await page.locator('#approve').isDisabled(),'Demo requires confirmation');
 await page.locator('#confirmed').check();await page.locator('#approve').click();
 await page.waitForFunction(()=>document.querySelector('#reviewMessage').textContent.includes('Demonstration complete'));
 assert((await page.locator('#proposalState').innerText()).includes('Demonstration only'),'Demo clearly identified');
 let fixture=await page.evaluate(async()=>(await fetch('/output/editorial/demo.json')).json());
 fixture.detail.title='<img src=x onerror=alert(1)> Example content update';
 let details=0;
 await page.route('**/.netlify/functions/editorial-review*',async route=>{
  const req=route.request();assert(req.headers().authorization==='Bearer synthetic-browser-test-key','Request carries only the entered test key');
  if(req.method()==='POST'){posts.push(req.postDataJSON());fixture.detail.state='closed';fixture.detail.merged=posts.at(-1).action==='approve';fixture.detail.deployment={state:'pending'};return route.fulfill({json:{outcome:fixture.detail.merged?'merged':'rejected'}});}
  if(req.url().includes('proposal=')){details++;return route.fulfill({json:fixture.detail});}
  return route.fulfill({json:{proposals:[fixture.proposal],nextPage:null}});
 });
 await page.goto('http://127.0.0.1:8765/monitoring/review.html');
 await page.locator('#accessKey').fill('synthetic-browser-test-key');await page.getByRole('button',{name:'Load proposed updates'}).click();
 await page.getByRole('button',{name:'Review update',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('#proposalDetail').hidden);
 assert(await page.locator('#proposalTitle img').count()===0,'Proposal text cannot inject HTML');
 assert((await page.locator('#proposalTitle').innerText()).startsWith('<img'),'Untrusted title rendered as text');
 assert(await page.locator('#approve').isDisabled(),'Approval initially disabled');
 await page.locator('.change summary').first().click();
 assert((await page.locator('.change pre').first().innerText()).includes('+Record the source'),'Exact additions visible');
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:950});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No overflow at ${width}`);}
 await page.setViewportSize({width:1440,height:1000});await page.locator('#proposalDetail').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/editorial-review-desktop.png'});
 await page.setViewportSize({width:390,height:950});await page.locator('#proposalChanges').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/editorial-review-mobile.png'});
 await page.locator('#confirmed').check();await page.locator('#approve').click();
 await page.waitForFunction(()=>document.querySelector('#proposalState').textContent.includes('Approved and merged'));
 assert(posts.length===1&&posts[0].head==='a'.repeat(40)&&posts[0].reviewDigest==='c'.repeat(64),'Only the reviewed revision is approved once');
 assert(!(await page.locator('#proposalState').innerText()).startsWith('Live'),'Merge does not imply live');
 fixture.detail.deployment={state:'live'};await page.locator('#reloadDetail').click();await page.waitForFunction(()=>document.querySelector('#proposalState').textContent.startsWith('Live'));
 assert(await page.locator('#decisionForm').isHidden(),'Already merged update cannot be submitted again');
 fixture.detail.state='open';fixture.detail.merged=false;fixture.detail.deployment=null;fixture.detail.blockers=['Content validation must pass.'];
 await page.locator('#reloadDetail').click();await page.waitForFunction(()=>!document.querySelector('#decisionForm').hidden);await page.locator('#confirmed').check();assert(await page.locator('#approve').isDisabled(),'Failed checks disable approval');
 await page.locator('#reject').click();await page.waitForFunction(()=>document.querySelector('#proposalState').textContent.startsWith('Closed'));
 assert(posts.length===2&&posts[1].action==='reject','Rejection is a separate action');
 assert(await page.evaluate(()=>!JSON.stringify(localStorage).includes('synthetic-browser-test-key')&&!JSON.stringify(sessionStorage).includes('synthetic-browser-test-key')),'Access key never persisted');
 await page.locator('#signOut').click();assert(await page.locator('#accessKey').inputValue()===''&&await page.locator('#proposalDetail').isHidden(),'Clear access removes key and proposal');
 assert(errors.length===0,errors.join(';'));
 await page.unroute('**/.netlify/functions/editorial-review*');
 return `${assertions} approval-screen checks passed. All publication requests were intercepted locally; no GitHub writes.`;
}
