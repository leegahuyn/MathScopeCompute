/** Additive host-runtime fix. The original M1 source and Worker stay intact. */
export const M1_RETAINED_JOB_LIMIT = 128;

export function makeM1RetentionPatches(engineSource) {
  const start = engineSource.indexOf('export function createM1Engine(options={}) {');
  if (start < 0) throw Error('Expected the original exported M1 engine.');
  const original = engineSource.slice(start).trimEnd().replace(/^export /, '');
  const guard = 'jobs.size>=LIMITS.maxJobs';
  if (original.split(guard).length - 1 !== 2) throw Error('Expected both original M1 admission guards.');
  let replacement = original.replace(
    'function createM1Engine(options={}) {',
    'function createM1Engine(options={}) {\n  // Host history capacity covers all 59 M1 examples plus replay; per-job Worker budgets are unchanged.\n  const retainedJobLimit = ' + M1_RETAINED_JOB_LIMIT + ';'
  ).replaceAll(guard, 'jobs.size>=retainedJobLimit');
  replacement = replacement.replace(
    "throw Error('Duplicate ID or retained job limit. Export completed results before starting a new runtime.');",
    "throw Error(jobs.has(id)?'Duplicate M1 job ID.':'M1 실행 기록 128개가 모두 찼습니다. 필요한 실행 기록을 내보낸 뒤 페이지를 새로고침하세요.');"
  );
  replacement = replacement.replace('return Object.freeze({submit,wait,cancel,', 'return Object.freeze({retainedJobLimit,submit,wait,cancel,');
  return [
    {operation:'replace',find:original,replace:replacement},
    {operation:'replace',find:"text('m1-job-count',all.length+' jobs');",replace:"text('m1-job-count',all.length+' / '+engine.retainedJobLimit+' jobs');"},
    {
      operation:'replace',
      find:'    pending.set(id,{prepared,sessionId:s.id});selected=id;\n    const job=await engine.submit(request,{id});',
      replace:"    let job;\n    try {job=await engine.submit(request,{id});}\n    catch(e){status('계산을 시작하지 못했습니다. '+e.message,true);renderJobs();throw e;}\n    pending.set(id,{prepared,sessionId:s.id});selected=id;"
    },
    {operation:'replace',find:'jobs:engine.listJobs().map(j=>({id:j.id,status:j.status,kind:j.request.kind,inputHash:j.inputHash})),auditCount:',replace:'hostRuntime:{retainedJobLimit:engine.retainedJobLimit,workerLimitsUnchanged:true},jobs:engine.listJobs().map(j=>({id:j.id,status:j.status,kind:j.request.kind,inputHash:j.inputHash})),auditCount:'},
    {operation:'replace',find:"    status('계산 시작 · '+request.kind+' · 입력 '+job.inputHash.slice(0,12));renderJobs();return",replace:"    renderResult();status('계산 시작 · '+request.kind+' · 입력 '+job.inputHash.slice(0,12));renderJobs();return"},
    {
      operation:'replace',
      find:"text('m1-result-description',j.request.kind+' 계산 중 · '+j.id);$('m1-metrics').replaceChildren();scene.set({points:[],lines:[],arrows:[],axes:['x','y','z']});text('m1-observation','현재 작업의 계산 결과를 기다리고 있습니다.');",
      replace:"const waitingView=window.MathScopeM2Visualization.makeVisualization(j,{currentEditorMatches:currentEditorMatches(j)});text('m1-result-description',j.request.kind+' · '+j.status+' · '+j.id);$('m1-metrics').replaceChildren();scene.setVisualization(waitingView);text('m1-observation',waitingView.description);"
    }
  ];
}
