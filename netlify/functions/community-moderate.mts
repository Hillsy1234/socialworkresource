import type {Context,Config} from '@netlify/functions';
import {communityReady,communityStore,authorized} from './_shared/community-runtime.mts';
import {moderatorApi,json} from '../../community/lib/http.mjs';
export default async(request:Request,context:Context)=>{
  if(!authorized(request))return json({error:'Enter your existing owner monitoring access key.'},401);
  if(!communityReady(context))return json({error:'The Practice Community is not enabled on this deploy.'},503);
  return moderatorApi(request,{store:communityStore(),now:new Date().toISOString()});
};
export const config:Config={method:['GET','POST'],rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain'],action:'rate_limit'}};
