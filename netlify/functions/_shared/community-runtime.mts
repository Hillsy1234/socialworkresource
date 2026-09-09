import {getStore} from '@netlify/blobs';
import type {Context} from '@netlify/functions';
import {CommunityError} from '../../../community/lib/model.mjs';
export {authorized} from './runtime.mts'; // Reuse the existing owner access key; no new member-account system.
export function communityReady(context:Context){
  return context.deploy.context==='production' && context.deploy.published && Netlify.env.get('COMMUNITY_ENABLED')==='true' && (Netlify.env.get('MONITOR_TOKEN')?.length||0)>=32;
}
export function communityStore(){
  const raw=getStore({name:'social-work-community-v1',consistency:'strong'});
  return {
    get:async(key:string)=>{const value=await raw.getWithMetadata(key,{type:'json'});return value?{data:value.data as any,etag:value.etag}:null;},
    set:(key:string,value:unknown,conditions:{onlyIfMatch?:string,onlyIfNew?:boolean}={})=>raw.setJSON(key,value,conditions.onlyIfMatch?{onlyIfMatch:conditions.onlyIfMatch}:conditions.onlyIfNew?{onlyIfNew:true}:{}),
    list:async(prefix:string)=>{
      const keys:string[]=[];
      for await(const page of raw.list({prefix,paginate:true})){keys.push(...page.blobs.map(item=>item.key));if(keys.length>2500)throw new CommunityError('This discussion archive needs maintenance. Please contact the moderator.',503);}
      return keys;
    }
  };
}
