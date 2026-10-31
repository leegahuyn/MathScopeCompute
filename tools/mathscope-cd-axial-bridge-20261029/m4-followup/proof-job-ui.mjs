import {createProofSession} from './proof-session.mjs';
import {DEFAULT_M4_PROOF_INPUT} from './research-ide/mathscope-m4/proof-jobs.mjs';

/** Attach a generated-proof editor to an owned host element. Never claims kernel PASS. */
export function mountM4ProofJobUI(root,options={}){
 if(!root || root.dataset.proofEditorReady) throw new Error('PROOF_EDITOR_ROOT_INVALID');
 const session=createProofSession(options);let generation=0;
 const section=document.createElement('section');section.setAttribute('aria-labelledby','m4-proof-job-title');
 const title=document.createElement('h4');title.id='m4-proof-job-title';title.textContent='새 ProofJob 준비';
 const description=document.createElement('p');description.textContent='입력마다 새 소스와 작업을 준비합니다. 기존 검사 결과는 새 입력에 적용되지 않습니다. 현재 생성되는 정리는 정수 계수 예제입니다.';
 const label=document.createElement('label');label.textContent='ProofJob 입력 JSON';label.style.display='block';
 const input=document.createElement('textarea');input.rows=12;input.spellcheck=false;input.dataset.proof='input';input.style.boxSizing='border-box';input.style.width='100%';input.style.resize='vertical';input.value=JSON.stringify(options.initial ?? DEFAULT_M4_PROOF_INPUT,null,2);label.append(input);
 const status=document.createElement('p');status.dataset.proof='status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const details=document.createElement('pre');details.dataset.proof='details';details.style.whiteSpace='pre-wrap';details.style.overflowWrap='anywhere';
 section.append(title,description,label,status,details);root.append(section);
 root.dataset.proofEditorReady='true';
 const expected=Object.keys(DEFAULT_M4_PROOF_INPUT).sort().join(',');
 async function change(){
   const thisGeneration=++generation;let p;
   try{
    p=JSON.parse(input.value);
    if(!p || Array.isArray(p) || typeof p!=='object' || Object.keys(p).sort().join(',')!==expected)throw Error('입력 필드를 모두 유지해 주세요.');
   }catch(error){session.invalidate(error.message);root.dataset.proofState='INVALID_INPUT';status.textContent='입력을 확인해 주세요. 기존 결과는 적용되지 않습니다.';details.textContent='';return;}
   root.dataset.proofState='GENERATING';status.textContent='새 소스를 준비하고 있습니다. 기존 결과는 적용되지 않습니다.';details.textContent='';
   try{
    const result=await session.update(p);
    if(thisGeneration!==generation || result.state==='SUPERSEDED')return;
    const current=session.snapshot().active;root.dataset.proofState='KERNEL_PENDING';
    status.textContent='새 ProofJob 준비됨 · Lean 커널 검사 대기';
    details.textContent=JSON.stringify({jobId:current.jobId,sourceSha256:current.sources[0].sha256,scope:current.scope,kernelPass:false},null,2);
   }catch(error){
    if(thisGeneration!==generation)return;
    root.dataset.proofState='INVALID_INPUT';status.textContent='입력 오류: '+error.message+' · 기존 결과는 적용되지 않습니다.';details.textContent='';
   }
 }
 input.addEventListener('input',change);
 const ready=change();
 return {ready,snapshot:()=>session.snapshot(),destroy(){generation++;input.removeEventListener('input',change);section.remove();delete root.dataset.proofEditorReady;delete root.dataset.proofState;}};
}
