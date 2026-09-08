import type { Context, Config } from '@netlify/functions';
import { authorized, configReady, json, registry, storage } from './_shared/runtime.mts';
import { createReviewService, githubClient, publishedRelease, ReviewError } from '../../editorial/service.mjs';

export default async (request: Request, context: Context) => {
  if (!authorized(request)) return json({error:'A valid monitoring access key is required.'},401);
  if (!configReady(context)) return json({error:'Approvals are available only on the enabled production site.'},503);
  if (!['GET','POST'].includes(request.method)) return json({error:'Method not allowed.'},405);
  const token = Netlify.env.get('EDITORIAL_GITHUB_TOKEN');
  if (Netlify.env.get('EDITORIAL_ENABLED') !== 'true' || !token) return json({error:'The approval connection has not been enabled yet. The site owner needs to complete the approval setup.'},503);
  const siteUrl = context.site.url;
  if (!siteUrl) return json({error:'The production site URL is unavailable.'},503);
  if (request.method === 'POST') {
    if (request.headers.get('origin') !== new URL(siteUrl).origin) return json({error:'Open the review on this site before approving.'},403);
    if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) return json({error:'Expected a review decision.'},415);
    if (Number(request.headers.get('content-length')) > 4096) return json({error:'Decision too large.'},413);
  }
  try {
    const github = githubClient(token);
    const service = createReviewService({github,registry,store:storage(),publication:(commit:string)=>publishedRelease(commit,siteUrl,github)});
    if (request.method === 'POST') {
      const raw = await request.text();if (raw.length > 4096) return json({error:'Decision too large.'},413);
      let input;try {input=JSON.parse(raw);} catch {return json({error:'Invalid review decision.'},400);}
      return json(await service.decide(input));
    }
    const params = new URL(request.url).searchParams;
    return json(params.has('proposal') ? await service.detail(Number(params.get('proposal'))) : await service.list(Number(params.get('page') ?? '1')));
  } catch (error) {
    return json({error:error instanceof ReviewError ? error.message : 'The review could not be completed. Refresh to confirm its status before trying again.'},error instanceof ReviewError ? error.status : 503);
  }
};
export const config: Config = { method:['GET','POST'] };
