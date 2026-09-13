// The garden is a separate, optional experience. Preserve the exact learning view.
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-garden-link]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(typeof stashCpdDraft==='function'&&!stashCpdDraft()){event.preventDefault();return;}
  try{sessionStorage.setItem('quietGarden.return',JSON.stringify({url:location.pathname+location.search+location.hash,y:scrollY,at:Date.now()}));}catch{}
});
async function restoreGardenPosition(){
  try{
    if(sessionStorage.getItem('quietGarden.returning')!=='yes')return;
    sessionStorage.removeItem('quietGarden.returning');
    const record=JSON.parse(sessionStorage.getItem('quietGarden.return'));
    if(!record||Date.now()-record.at>86400000||!Number.isFinite(record.y))return;
    const u=new URL(record.url,location.origin);
    if(u.origin!==location.origin||u.pathname!==location.pathname||u.search!==location.search)return;
    await document.fonts.ready;
    requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo({top:Math.max(0,record.y),behavior:'instant'})));
  }catch{}
}
