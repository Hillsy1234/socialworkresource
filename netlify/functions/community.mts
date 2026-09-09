import type {Context,Config} from '@netlify/functions';
import {communityReady,communityStore} from './_shared/community-runtime.mts';
import {publicApi,json} from '../../community/lib/http.mjs';
export default async(request:Request,context:Context)=>{
  if(!communityReady(context))return json({error:'The Practice Community is not open for submissions on this deploy yet.'},503);
  return publicApi(request,{store:communityStore(),secret:Netlify.env.get('MONITOR_TOKEN')!,ip:context.ip,now:new Date().toISOString()});
};
export const config:Config={method:['GET','POST'],rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain'],action:'rate_limit'}};
