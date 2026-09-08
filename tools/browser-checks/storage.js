async (page) => {
  const assert = (value, label) => { if (!value) throw new Error(label); };
  const settled = async country => page.waitForFunction(country => document.documentElement.dataset.jurisdiction === country && document.querySelector('#learningWorkspace').getAttribute('aria-busy') === 'false', country);
  await page.evaluate(() => {
    localStorage.setItem('socialWorkerResourceRead', JSON.stringify(['care-act']));
    localStorage.setItem('socialWorkerResourceConfidence', JSON.stringify({'care-act':'confident'}));
    localStorage.setItem('socialWorkerResourceCpdEntries', JSON.stringify([{id:'synthetic-legacy', title:'Synthetic legacy CPD', learning:'Test only', date:'08/09/2026'}]));
    for (const key of ['socialWorkerResourceRead','socialWorkerResourceConfidence','socialWorkerResourceCpdEntries']) localStorage.removeItem(`socialWorkerResource:v2:england:${key}`);
  });
  await page.goto('http://127.0.0.1:8765/?jurisdiction=england&resource=cpd-log'); await settled('england');
  assert((await page.locator('#cpdEntries').innerText()).includes('Synthetic legacy CPD'), 'Legacy CPD must survive');
  assert((await page.locator('#progressText').innerText()).startsWith('1 of'), 'Legacy read progress must survive');
  await page.reload(); await settled('england');
  assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('socialWorkerResource:v2:england:socialWorkerResourceCpdEntries')).length === 1 && JSON.parse(localStorage.getItem('socialWorkerResourceCpdEntries')).length === 1), 'Migration must not duplicate or destroy legacy entries');
  await page.locator('.cpd-form [name="title"]').fill('Unsaved synthetic England note');
  await page.evaluate(()=>{ Storage.prototype.setItem = function(){ throw new DOMException('Test quota failure','QuotaExceededError'); }; });
  await page.locator('.cpd-form [name="learning"]').fill('This synthetic note must remain in the form');
  await page.locator('#locationChooserButton').click();await page.locator('[data-location=\"'+'wales'+'\"]').click();
  assert(await page.locator('html').getAttribute('data-jurisdiction') === 'england', 'Blocked storage must prevent destructive country switching');
  assert(await page.locator('.cpd-form [name="learning"]').inputValue() === 'This synthetic note must remain in the form', 'Form must remain intact after save failure');
  assert((await page.locator('#jurisdictionStatus').innerText()).includes('Copy your text'), 'Storage failure must be visible');
  // Restore native browser methods with a fresh document. No real user records are in this CLI test session.
  await page.evaluate(()=>{ document.querySelector('.cpd-form').dataset.dirty='false'; });
  await page.goto('http://127.0.0.1:8765/?jurisdiction=wales&resource=cpd-log'); await settled('wales');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button',{name:'Export Wales reflections',exact:true}).click();
  const download = await downloadEvent;
  assert(download.suggestedFilename() === 'wales-reflections.txt', 'Export must identify Wales');
  await download.saveAs('output/playwright/test-wales-reflections.txt');
  await page.goto('http://127.0.0.1:8765/?jurisdiction=england&resource=readme'); await settled('england');
  return 'PASS: legacy CPD/progress, idempotent non-destructive migration, blocked-storage draft preservation and Wales export.';
}
