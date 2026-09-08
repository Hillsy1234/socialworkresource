import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {metadata,allowedFile,REPOSITORY,BRANCH_PREFIX} from '../editorial/service.mjs';
const run=(cmd,args)=>execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const args=process.argv.slice(2),path=args.find(a=>!a.startsWith('--'));
if(!path){console.error('Usage: npm run editorial:prepare -- proposal.json [--submit]\nWithout --submit, writes the review description locally. The JSON needs title, summary, reason, commencement and sourceIds.');process.exit(1);}
try{
 const input=JSON.parse(await readFile(path,'utf8'));
 if(typeof input.title!=='string'||input.title.length<10||input.title.length>150)throw Error('Provide a descriptive title of 10–150 characters.');
 const registry=JSON.parse(await readFile('monitoring/sources.json','utf8'));
 const encoded=JSON.stringify({version:1,...input},null,2).replaceAll('-->','\\u002d\\u002d>');
 const marker=`<!-- social-work-update\n${encoded}\n-->`;
 metadata(marker,registry.sources);
 const sources=input.sourceIds.map(id=>registry.sources.find(s=>s.id===id));
 const body=`${input.summary}\n\n### Why this changes\n\n${input.reason}\n\n### Applicability and commencement\n\n${input.commencement}\n\n### Supporting sources\n\n${sources.map(s=>`- [${s.title}](${s.url})`).join('\n')}\n\n### Review\n\nReview the complete edits and validation results in the site's monitoring approval screen before publication.\n\n${marker}\n`;
 await mkdir('output/editorial',{recursive:true});await writeFile('output/editorial/proposal.md',body);
 if(!args.includes('--submit')){console.log('Review description saved to output/editorial/proposal.md. No GitHub changes made.');process.exit(0);}
 if(run('gh',['repo','view','--json','nameWithOwner','--jq','.nameWithOwner'])!==REPOSITORY)throw Error('Wrong GitHub repository.');
 const branch=run('git',['branch','--show-current']);if(!branch.startsWith(BRANCH_PREFIX))throw Error(`Use a ${BRANCH_PREFIX} branch.`);
 if(run('git',['status','--porcelain']))throw Error('Commit the reviewed content changes before submitting.');
 run('git',['fetch','origin','main']);
 const head=run('git',['rev-parse','HEAD']);
 if(run('git',['ls-remote','origin',`refs/heads/${branch}`]).split(/\s/)[0]!==head)throw Error('Push this branch before submitting; its remote version must match the reviewed local commit.');
 const files=run('git',['diff','--name-only','origin/main...HEAD']).split('\n').filter(Boolean);
 if(!files.length||files.length>150||files.some(p=>!allowedFile(p,registry.jurisdictions)))throw Error('The proposal must contain only allowed curriculum changes and fit within 150 files. Keep technical changes in a separate review.');
 const url=run('gh',['pr','create','--repo',REPOSITORY,'--base','main','--head',branch,'--title',input.title,'--body-file','output/editorial/proposal.md']);
 console.log(url);console.log('Proposal submitted for review. It has not been merged or published.');
}catch(e){console.error(e.message);process.exit(1);}
