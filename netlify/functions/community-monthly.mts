import type {Context,Config} from '@netlify/functions';
import {communityReady,communityStore} from './_shared/community-runtime.mts';
import {createMonthly} from '../../community/lib/model.mjs';
import {monthlyScenario} from '../../community/lib/scenarios.mjs';
import {json} from '../../community/lib/http.mjs';
export default async(_request:Request,context:Context)=>{
  if(!communityReady(context))return json({status:'inactive'});
  const now=new Date().toISOString();
  return json(await createMonthly(communityStore(),monthlyScenario(now.slice(0,7)),now));
};
// Prepares a fictional prompt for moderation; never publishes automatically.
export const config:Config={schedule:'15 6 1 * *'};
