import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {AUDITS,REFERENCES} from './audit-data.mjs';
import {ANALYTIC_CONTRACTS,validateAnalyticContract} from './analytic-contracts.mjs';
const clone=x=>JSON.parse(canonicalStringify(x));
export function listTheoremReferences(){return clone(REFERENCES);}
export function listAnalyticHypotheses(){return clone(ANALYTIC_CONTRACTS);}
export function listPinnedAudits(){return AUDITS.map(a=>({id:a.id,label:a.label,targets:a.targets,environment:a.environment,sourceFiles:a.sourceFiles.map(f=>({path:f.path,sha256:f.sha256})),negativeControls:a.negativeControls,scope:a.scope}));}
export function getPinnedAudit(id){const a=AUDITS.find(x=>x.id===id);if(!a)throw Error('Unknown installed Lean audit.');return clone(a);}
export async function checkPinnedAudit(id,sourceFiles){
  const a=getPinnedAudit(id),files=sourceFiles||a.sourceFiles,errors=[];
  if(!Array.isArray(files)||files.length!==a.sourceFiles.length)return {status:'STALE',kernelRerun:false,formalPass:false,errors:['The complete audited source set is required.']};
  for(const pinned of a.sourceFiles){const candidate=files.find(f=>f.path===pinned.path);if(!candidate||candidate.content!==pinned.content||await sha256(candidate.content)!==pinned.sha256)errors.push('Source content differs: '+pinned.path);}
  for(const build of a.builds||[])if(build.exitCode!==0)errors.push('Pinned positive compile failed.');
  if(!a.targets?.length)errors.push('No checked Lean targets in this audit.');
  if((a.targets||[]).some(t=>!t.name||!t.type||!Array.isArray(t.axioms)||t.axioms.some(x=>/sorryAx/.test(x))))errors.push('Missing theorem type/axiom audit or sorryAx dependency.');
  return {status:errors.length?'STALE':'MATCHED_LOCAL_KERNEL_AUDIT',kernelRerun:false,formalPass:false,errors,scope:a.scope,targets:a.targets,environment:a.environment,negativeControls:a.negativeControls,sourceDigests:a.sourceFiles.map(f=>({path:f.path,sha256:f.sha256})),meaning:'This browser compares the exact shipped source with recorded local Lean kernel checks. It does not compile edited Lean or import an external paper theorem.'};
}
export function checkTheoremAdapter(value){
  const errors=[];
  if(!value||typeof value!=='object')return {ok:false,status:'INVALID',errors:['An adapter record is required.'],formalPass:false};
  if(value.role==='THEOREM_REFERENCE'){
    const ref=REFERENCES.find(r=>r.id===value.referenceId);
    if(!ref)errors.push('Unknown source reference.');
    if(value.kernelVerified===true||value.formalPass===true||value.leanImport)errors.push('A paper reference cannot assert a Lean import or kernel verification.');
    return {ok:!errors.length,status:errors.length?'INVALID':'THEOREM_REFERENCE',reference:ref?clone(ref):null,errors,formalPass:false};
  }
  if(value.role==='LOCAL_LEAN_TARGET'){
    const audit=AUDITS.find(a=>a.id===value.auditId),target=audit?.targets.find(t=>t.name===value.target);
    if(!target)errors.push('The exact target is not in the installed local audit.');
    if(target&&value.type!==target.type)errors.push('Lean theorem type differs from the checked target.');
    if(value.externalTheoremId)errors.push('A finite local lemma cannot be renamed as the full external theorem.');
    return {ok:!errors.length,status:errors.length?'INVALID':'PINNED_LOCAL_TARGET_REFERENCE',target:target?clone(target):null,errors,formalPass:false,requiresExactSourceAudit:true};
  }
  return {ok:false,status:'INVALID',errors:['Role must be THEOREM_REFERENCE or LOCAL_LEAN_TARGET.'],formalPass:false};
}
export function verifyAdapterFixtures(){
  const checks=ANALYTIC_CONTRACTS.map(c=>({id:c.id,pass:validateAnalyticContract(c).ok}));
  for(const ref of REFERENCES){checks.push({id:ref.id+':reference',pass:checkTheoremAdapter({role:'THEOREM_REFERENCE',referenceId:ref.id}).ok});checks.push({id:ref.id+':reject-fake-kernel',pass:!checkTheoremAdapter({role:'THEOREM_REFERENCE',referenceId:ref.id,kernelVerified:true}).ok});}
  checks.push({id:'reject-missing-norm',pass:!validateAnalyticContract({...ANALYTIC_CONTRACTS[0],norm:''}).ok});
  checks.push({id:'reject-unknown-lean',pass:!checkTheoremAdapter({role:'LOCAL_LEAN_TARGET',auditId:'invented',target:'proved_everything',type:'True'}).ok});
  return {pass:checks.every(c=>c.pass),passed:checks.filter(c=>c.pass).length,total:checks.length,checks,scope:'Contract/provenance guards; no analytic hypothesis is proved by this validator.'};
}
