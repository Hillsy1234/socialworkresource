import {createHash, randomUUID} from 'node:crypto';
import registry from '../../monitoring/sources.json' with {type:'json'};

export const locations = ['all', ...registry.jurisdictions];
export const categories = ['student-learning','cpd','practice-resources','general','monthly-discussion'];
export class CommunityError extends Error { constructor(message,status=400){super(message);this.status=status;} }
const fail=(message,status=400)=>{throw new CommunityError(message,status);};
export const monthOK = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '');
export const idOK = value => typeof value==='string' && /^\d{4}-(0[1-9]|1[0-2])-(?:[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}|scenario)$/.test(value);
export function keyFor(kind,id,parentId=''){
  if(!idOK(id))fail('Invalid item reference.');
  if(kind==='topic')return `topics/${id.slice(0,7)}/${id}`;
  if(kind==='report')return `reports/${id.slice(0,7)}/${id}`;
  if(kind==='reply' && idOK(parentId))return `replies/${parentId}/${id}`;
  fail('Invalid item type.');
}
function text(value,label,min,max){
  if(typeof value!=='string')fail(`${label} is required.`);
  const cleaned=value.trim().replace(/\r\n/g,'\n');
  if(cleaned.length<min || cleaned.length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(cleaned))fail(`${label} must contain ${min}–${max} characters.`);
  return cleaned;
}
export function resourceUrl(value){
  if(!value)return '';
  let url;try{url=new URL(value);}catch{fail('Enter a complete HTTPS resource link.');}
  if(value.length>1000 || url.protocol!=='https:' || url.username || url.password || url.port || !url.hostname.includes('.') || /^[\d.]+$/.test(url.hostname) || /[:\[\]]/.test(url.hostname) || /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(url.hostname))fail('Use a public HTTPS website link without login details.');
  url.hash='';return url.href;
}
export function normaliseSubmission(input){
  if(!input || !['topic','reply','report'].includes(input.kind))fail('Choose a submission type.');
  if(input.acknowledged!==true)fail('Confirm the community rules before submitting.');
  if(typeof input.requestId!=='string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(input.requestId))fail('Refresh the form and try again.');
  if(input.kind==='report'){
    keyFor(input.targetKind,input.targetId,input.targetParentId);
    if(!['topic','reply'].includes(input.targetKind))fail('Invalid report target.');
    if(!['identifiable-information','unsafe-advice','spam','abuse','other'].includes(input.reason))fail('Choose a report reason.');
    return {kind:'report',targetKind:input.targetKind,targetId:input.targetId,targetParentId:input.targetParentId||'',reason:input.reason,body:text(input.body||'Please review this contribution.','Report details',5,600)};
  }
  if(!locations.includes(input.location))fail('Choose a supported practice location.');
  const common={kind:input.kind,location:input.location,author:text(input.author||'Community contributor','Display name',2,50),body:text(input.body,'Your contribution',20,3000)};
  if(input.kind==='reply'){if(!idOK(input.parentId))fail('Invalid discussion.');return {...common,parentId:input.parentId};}
  if(!categories.includes(input.category) || input.category==='monthly-discussion')fail('Choose a topic category.');
  const url=resourceUrl(input.url);
  if(input.category==='practice-resources' && !url)fail('Add the resource link you are suggesting.');
  return {...common,title:text(input.title,'Topic title',8,140),category:input.category,url};
}
export function publicItem(item){
  if(!item || item.status!=='approved' || !['topic','reply'].includes(item.kind))return null;
  const keys=['id','kind','parentId','location','author','body','title','category','url','createdAt','approvedAt','locked','fictional','scenarioMonth'];
  return Object.fromEntries(keys.filter(k=>item[k]!==undefined).map(k=>[k,item[k]]));
}
async function rows(store,prefix){
  const keys=await store.list(prefix);const result=[];
  for(let i=0;i<keys.length;i+=20){const batch=await Promise.all(keys.slice(i,i+20).map(key=>store.get(key)));result.push(...batch.filter(Boolean).map(r=>r.data));}
  return result;
}
function pageOf(items,cursor=''){
  if(cursor && (typeof cursor!=='string' || cursor.length>100))fail('Invalid page cursor.');
  const sortKey=item=>`${item.createdAt}|${item.id}`;
  const sorted=items.sort((a,b)=>sortKey(b).localeCompare(sortKey(a))).filter(item=>!cursor || sortKey(item)<cursor);
  return {items:sorted.slice(0,30),nextCursor:sorted.length>30?sortKey(sorted[29]):null};
}
export async function publicTopics(store,{month,location='all',category='all',cursor='',query=''}){
  if(!monthOK(month) || !locations.includes(location) || !['all',...categories].includes(category))fail('Invalid discussion filter.');
  if(typeof query!=='string'||query.length>100)fail('Search must be under 100 characters.');
  const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const items=(await rows(store,`topics/${month}/`)).map(publicItem).filter(Boolean).filter(t=>(location==='all'||t.location==='all'||t.location===location)&&(category==='all'||t.category===category)&&words.every(word=>`${t.title} ${t.body}`.toLowerCase().includes(word)));
  return {month,...pageOf(items,cursor)};
}
export async function publicThread(store,id,cursor=''){
  const topic=publicItem((await store.get(keyFor('topic',id)))?.data);
  if(!topic)fail('This discussion is unavailable.',404);
  const replies=(await rows(store,`replies/${id}/`)).map(publicItem).filter(Boolean);
  // Recheck the parent after fetching replies so a removed thread is not returned from a stale first read.
  if(!publicItem((await store.get(keyFor('topic',id)))?.data))fail('This discussion is unavailable.',404);
  return {topic,...pageOf(replies,cursor)};
}
export async function submit(store,input,{now=new Date().toISOString(),clientHash='' }={}){
  const data=normaliseSubmission(input),month=now.slice(0,7),id=`${month}-${input.requestId}`;
  const key=keyFor(data.kind,id,data.parentId);
  const fingerprint=createHash('sha256').update(JSON.stringify(data)+clientHash).digest('hex');
  const previous=await store.get(key);
  if(previous){if(previous.data.fingerprint!==fingerprint)fail('This form was already used. Open a new form.',409);return {id,status:'received'};}
  if(data.kind==='reply'){
    const parent=publicItem((await store.get(keyFor('topic',data.parentId)))?.data);
    if(!parent || parent.locked)fail('This discussion is not accepting replies.',409);
    if(parent.location!=='all' && data.location!==parent.location)fail('Replies must use the discussion’s practice location.');
  }
  if(data.kind==='report'){
    const target=publicItem((await store.get(keyFor(data.targetKind,data.targetId,data.targetParentId)))?.data);
    if(!target)fail('This contribution is no longer available.',404);
    if(data.targetKind==='reply' && !publicItem((await store.get(keyFor('topic',data.targetParentId)))?.data))fail('This discussion is unavailable.',404);
  }
  const item={...data,id,status:data.kind==='report'?'open':'pending',createdAt:now,updatedAt:now,fingerprint};
  // Write the queue pointer first. A failed content write leaves a harmless pointer; retries remain discoverable.
  await store.set(`queue/${month}/${data.kind}-${data.parentId||'root'}-${id}`,{kind:data.kind,id,parentId:data.parentId||''});
  const saved=await store.set(key,item,{onlyIfNew:true});
  if(!saved.modified){const current=await store.get(key);if(current?.data.fingerprint!==fingerprint)fail('Submission conflict. Please retry.',409);}
  return {id,status:'received'};
}
export async function moderationQueue(store,{month,status='pending'}){
  if(!monthOK(month) || !['pending','approved','rejected','removed','open','resolved','all'].includes(status))fail('Invalid moderation filter.');
  const pointers=await rows(store,`queue/${month}/`),items=[];
  for(let i=0;i<pointers.length;i+=20){
    const batch=await Promise.all(pointers.slice(i,i+20).map(async p=>{
      const found=await store.get(keyFor(p.kind,p.id,p.parentId));if(!found || (status!=='all' && found.data.status!==status))return null;
      const {fingerprint,...item}=found.data;return {...item,etag:found.etag};
    }));items.push(...batch.filter(Boolean));
  }
  return {items:items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),month,status};
}
export async function moderate(store,input,now=new Date().toISOString()){
  const key=keyFor(input.kind,input.id,input.parentId),record=await store.get(key);
  if(!record)fail('Contribution not found.',404);
  if(typeof input.etag!=='string' || input.etag!==record.etag)fail('This item changed. Refresh the queue before deciding.',409);
  const item={...record.data},action=input.action;
  const reason=text(input.note||'','Moderator note',5,500);
  if(action==='edit-name'){
    if(item.status!=='pending' || item.kind==='report')fail('Only pending contribution names can be edited.',409);
    item.author=text(input.author,'Display name',2,50);
  } else if(action==='approve'){
    if(item.status!=='pending' || item.kind==='report')fail('Only pending contributions can be approved.',409);
    if(item.kind==='reply'){
      const parent=publicItem((await store.get(keyFor('topic',item.parentId)))?.data);
      if(!parent || parent.locked)fail('The parent discussion is unavailable or closed.',409);
    }
    if(input.checked!==true)fail('Confirm that you checked the contribution and any links.');
    item.status='approved';item.approvedAt=now;
  } else if(action==='reject' || action==='remove'){
    if(item.kind==='report' || (action==='reject'?item.status!=='pending':item.status!=='approved'))fail('This action does not match the item’s current status.',409);
    item.status=action==='reject'?'rejected':'removed';item.body='';item.title='';item.url='';item.author='';
  } else if(action==='lock' || action==='unlock'){
    if(item.kind!=='topic' || item.status!=='approved')fail('Only published discussions can be closed or reopened.',409);
    item.locked=action==='lock';
  } else if(action==='resolve'){
    if(item.kind!=='report' || item.status!=='open')fail('Only open reports can be resolved.',409);
    item.status='resolved';item.body='';
  } else fail('Unknown moderator action.');
  item.updatedAt=now;item.moderatorNote=reason;
  item.history=[...(item.history||[]),{action,at:now,note:reason}].slice(-20);
  const saved=await store.set(key,item,{onlyIfMatch:record.etag});
  if(!saved.modified)fail('Another moderator changed this item. Refresh and retry.',409);
  return {id:item.id,status:item.status,locked:item.locked||false};
}
export async function createMonthly(store,scenario,now=new Date().toISOString()){
  const month=now.slice(0,7),id=`${month}-scenario`,key=keyFor('topic',id);
  const item={id,kind:'topic',location:'all',category:'monthly-discussion',author:'Practice Community team',title:scenario.title,body:scenario.body,status:'pending',fictional:true,scenarioMonth:month,createdAt:now,updatedAt:now};
  await store.set(`queue/${month}/topic-root-${id}`,{kind:'topic',id,parentId:''});
  const saved=await store.set(key,item,{onlyIfNew:true});
  return {id,created:saved.modified};
}
