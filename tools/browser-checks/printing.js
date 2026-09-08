async page => {
 const settled=async c=>page.waitForFunction(c=>document.documentElement.dataset.jurisdiction===c && document.querySelector('#learningWorkspace').getAttribute('aria-busy')==='false',c);
 await page.goto('http://127.0.0.1:8765/?jurisdiction=wales&resource=cpd-log'); await settled('wales');
 const popupEvent=page.waitForEvent('popup');await page.locator('[data-print-cpd]').click();const popup=await popupEvent;await popup.waitForLoadState('domcontentloaded');
 if(!(await popup.locator('body').innerText()).includes('Wales reflections'))throw Error('Missing Wales print heading');
 await popup.pdf({path:'output/playwright/wales-reflections-print.pdf',format:'A4'});await popup.screenshot({path:'output/playwright/wales-reflections-print.png'});await popup.close();
 await page.goto('http://127.0.0.1:8765/learning/wales/mental-health-in-wales.html');
 if(await page.locator('table').count()!==1)throw Error('Missing static table');
 await page.pdf({path:'output/playwright/wales-module-print.pdf',format:'A4'});
 await page.setViewportSize({width:320,height:740});
 if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Static mobile overflow');
 await page.setViewportSize({width:1440,height:1000});
 return 'PASS: Wales reflection print popup/PDF, module print PDF, static table and 320px reading-page layout.';
}
