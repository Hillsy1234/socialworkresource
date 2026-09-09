// Loopback-only preview of the real community handlers with isolated, persistent local storage.
import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {publicApi,moderatorApi,json} from '../community/lib/http.mjs';
import {submit,moderate,keyFor,createMonthly} from '../community/lib/model.mjs';
import {monthlyScenario} from '../community/lib/scenarios.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),publicRoot=resolve(root,'dist'),dataDir=resolve(root,'output/community'),dataFile=resolve(dataDir,'local-store.json');
if(!existsSync(resolve(publicRoot,'community/index.html')))throw new Error('Run npm run build before starting the community preview.');
mkdirSync(dataDir,{recursive:true});
const saved=existsSync(dataFile)?JSON.parse(readFileSync(dataFile,'utf8')):{version:0,entries:[]};let version=saved.version;const entries=new Map(saved.entries);
function persist(){const text=JSON.stringify({version,entries:[...entries]},null,2);writeFileSync(dataFile,text,{mode:0o600});}
const store={get:async key=>structuredClone(entries.get(key)||null),list:async prefix=>[...entries.keys()].filter(k=>k.startsWith(prefix)),set:async(key,data,options={})=>{const old=entries.get(key);if(options.onlyIfNew&&old||options.onlyIfMatch&&old?.etag!==options.onlyIfMatch)return {modified:false};const etag=String(++version);entries.set(key,{data:structuredClone(data),etag});persist();return {modified:true,etag};}};
const now=new Date().toISOString(),secret='loopback-only-community-preview-secret-not-for-production',access='local-community-review';
if(!saved.entries.length){
  async function publish(id){const record=await store.get(keyFor('topic',id));await moderate(store,{kind:'topic',id,etag:record.etag,action:'approve',note:'Fictional demonstration content for the isolated local preview.',checked:true},now);}
  const monthly=await createMonthly(store,monthlyScenario(now.slice(0,7)),now);await publish(monthly.id);
  for(const item of [
    {location:'all',category:'student-learning',title:'What helps you prepare for a useful supervision session?',body:'FICTIONAL PREVIEW CONTRIBUTION. I am exploring ways to make learning goals clearer before supervision. What general questions or preparation habits have you found useful? Please discuss learning approaches only.'},
    {location:'wales',category:'cpd',title:'Turning a learning session into a thoughtful CPD reflection',body:'FICTIONAL PREVIEW CONTRIBUTION. What helps you move from describing a training session to reflecting on its possible impact? I would welcome general learning approaches and links to current local guidance.'},
    {location:'canada-ontario',category:'practice-resources',title:'A starting point for checking Ontario professional guidance',url:'https://www.ocswssw.org/',body:'FICTIONAL PREVIEW CONTRIBUTION. This is the regulator’s website as an example of how a resource suggestion would appear. Check the relevant pages and current requirements before relying on any guidance.'}
  ]){const result=await submit(store,{...item,kind:'topic',author:'Preview contributor (fictional)',acknowledged:true,requestId:randomUUID()},{now});await publish(result.id);}
  await submit(store,{kind:'topic',location:'new-zealand',category:'general',title:'A fictional question awaiting moderator review',body:'FICTIONAL PREVIEW CONTRIBUTION. This example stays private until a moderator chooses to approve it. It is available only in the isolated local preview.',author:'Preview contributor (fictional)',acknowledged:true,requestId:randomUUID()},{now});
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.md':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1:8766');let response;
    if(url.pathname.startsWith('/.netlify/functions/community')){
      let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>14000){res.writeHead(413);res.end('Too large');return;}chunks.push(chunk);}
      const body=Buffer.concat(chunks);const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body})});
      const options={store,secret,ip:'127.0.0.1',now:new Date().toISOString()};
      if(url.pathname==='/.netlify/functions/community')response=await publicApi(request,options);
      else if(url.pathname==='/.netlify/functions/community-moderate')response=req.headers.authorization===`Bearer ${access}`?await moderatorApi(request,options):json({error:'Local preview key: local-community-review'},401);
      else response=json({error:'Not found'},404);
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    let path=resolve(publicRoot,'.'+decodeURIComponent(url.pathname));if(!path.startsWith(publicRoot+sep)&&path!==publicRoot){res.writeHead(403);res.end();return;}
    if(existsSync(path)&&statSync(path).isDirectory())path=resolve(path,'index.html');
    if(!existsSync(path)||!statSync(path).isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(readFileSync(path));
  }catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local preview request failed.'}));}
}).listen(8766,'127.0.0.1',()=>console.log('Practice Community preview: http://127.0.0.1:8766/community/\nModerator preview: http://127.0.0.1:8766/community/moderate.html\nLocal-only access key: local-community-review\nAll contributions are stored separately in ignored output/community/. No production storage or search providers are used.'));
