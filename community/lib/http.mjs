import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {CommunityError,publicTopics,publicThread,submit,moderationQueue,moderate,createMonthly,normaliseSubmission} from './model.mjs';
import {monthlyScenario} from './scenarios.mjs';
const digest=(secret,value)=>createHmac('sha256',secret).update(value).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});}
export function failure(error){return json({error:error instanceof CommunityError?error.message:'The community service is temporarily unavailable. Please try again.'},error instanceof CommunityError?error.status:503);}
export function makeChallenge(secret,ip,now){
  const payload=Buffer.from(JSON.stringify({at:Date.parse(now),nonce:randomUUID()})).toString('base64url');
  return `${payload}.${digest(secret,`${ip}|${payload}`)}`;
}
export function validChallenge(token,secret,ip,now){
  if(typeof token!=='string'||token.length>400)return false;
  const [payload,signature,...extra]=token.split('.');if(extra.length||!payload||!equal(signature,digest(secret,`${ip}|${payload}`)))return false;
  try{const age=Date.parse(now)-JSON.parse(Buffer.from(payload,'base64url')).at;return Number.isFinite(age)&&age>=2000&&age<=2*60*60*1000;}catch{return false;}
}
export async function bodyOf(request){
  if(request.headers.get('origin')!==new URL(request.url).origin)throw new CommunityError('Submit using the community page on this website.',403);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw new CommunityError('Unsupported submission format.',415);
  if(Number(request.headers.get('content-length'))>14000)throw new CommunityError('Submission is too large.',413);
  const reader=request.body?.getReader();if(!reader)throw new CommunityError('Submission is empty.');
  let size=0;const chunks=[];
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>14000){await reader.cancel();throw new CommunityError('Submission is too large.',413);}chunks.push(value);}}finally{reader.releaseLock();}
  try{const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!result||typeof result!=='object'||Array.isArray(result))throw new Error();return result;}catch{throw new CommunityError('Submission could not be read.');}
}
export async function consumeLimit(store,key,limit){
  for(let attempt=0;attempt<8;attempt++){
    const current=await store.get(key),count=current?.data.count||0;
    if(count>=limit)throw new CommunityError('The community submission limit has been reached. Please try later.',429);
    const result=await store.set(key,{count:count+1},current?{onlyIfMatch:current.etag}:{onlyIfNew:true});
    if(result.modified)return;
  }
  throw new CommunityError('The community is busy. Please retry shortly.',429);
}
export async function publicApi(request,{store,secret,ip,now=new Date().toISOString()}){
  try{
    const query=new URL(request.url).searchParams;
    if(request.method==='GET'){
      if(query.get('action')==='challenge')return json({challenge:makeChallenge(secret,ip,now)});
      if(query.get('action')==='thread')return json(await publicThread(store,query.get('id'),query.get('cursor')||''));
      return json(await publicTopics(store,{month:query.get('month')||now.slice(0,7),location:query.get('location')||'all',category:query.get('category')||'all',cursor:query.get('cursor')||'',query:query.get('q')||''}));
    }
    if(request.method!=='POST')return json({error:'Method not allowed.'},405);
    const input=await bodyOf(request);
    if(input.website)return json({error:'Please leave the extra website field empty.'},400);
    if(!validChallenge(input.challenge,secret,ip,now))throw new CommunityError('Your form has expired or was sent too quickly. Reopen it and try again.',403);
    normaliseSubmission(input);
    const clientHash=digest(secret,`${now.slice(0,10)}|${ip}`);
    // A bounded pilot protects storage/compute usage. Reports have a separate allowance.
    await consumeLimit(store,`limits/month/${now.slice(0,7)}/${input.kind==='report'?'reports':'contributions'}`,1000);
    await consumeLimit(store,`limits/${now.slice(0,10)}/${clientHash}`,20);
    return json(await submit(store,input,{now,clientHash}),202);
  }catch(error){return failure(error);}
}
export async function moderatorApi(request,{store,now=new Date().toISOString()}){
  try{
    if(request.method==='GET'){
      const params=new URL(request.url).searchParams;
      if(params.get('action')==='item'){
        const {keyFor}=await import('./model.mjs');const result=await store.get(keyFor(params.get('kind'),params.get('id'),params.get('parentId')||''));
        if(!result)throw new CommunityError('Contribution not found.',404);
        const {fingerprint,...item}=result.data;return json({...item,etag:result.etag});
      }
      return json(await moderationQueue(store,{month:params.get('month')||now.slice(0,7),status:params.get('status')||'pending'}));
    }
    if(request.method!=='POST')return json({error:'Method not allowed.'},405);
    const input=await bodyOf(request);
    if(input.action==='prepare-monthly')return json(await createMonthly(store,monthlyScenario(now.slice(0,7)),now));
    return json(await moderate(store,input,now));
  }catch(error){return failure(error);}
}
