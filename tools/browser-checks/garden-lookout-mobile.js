async page => {
 const checks=[];
 for(const size of [{width:390,height:844},{width:320,height:700},{width:844,height:390}]){
 const c=await page.context().browser().newContext({viewport:size,isMobile:true,hasTouch:true});try{const p=await c.newPage();await p.goto('http://127.0.0.1:8766/garden/');await p.waitForSelector('body[data-garden-ready=true]');await p.locator('#enterButton').click();await p.locator('#lookoutButton').click();await p.locator('#viewLookout').click();await p.waitForTimeout(500);await p.screenshot({path:`output/playwright/lookout-mobile-${size.width}.png`});const h=await p.locator('#walkHud').boundingBox(),d=await p.locator('#bottomDock').boundingBox();if(h.y+h.height>d.y&&size.width<760)throw Error(`HUD overlaps dock at ${size.width}`);if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Page overflows at ${size.width}`);await p.locator('#motionButton').click();await p.locator('#descendLookout').click();checks.push(`Tower controls and Still return work at ${size.width}×${size.height}`);}finally{await c.close();}
 }
 return checks;
}
