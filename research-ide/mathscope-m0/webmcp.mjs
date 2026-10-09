/** Thin tools over the same M0 controller used by visible controls.
 * API baseline: document.modelContext, checked 2026-10-09 against the draft
 * and Chrome's 2026-09-21 imperative guide. No legacy global/polyfill.
 */
const ownership = new WeakMap();
const ADAPTERS = ['prime-segment', 'padic-delta', 'rational-interval', 'integer-matrix-product'];
const EMPTY = { type: 'object', properties: {}, additionalProperties: false };

function checkedInput(input, keys, required = []) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('An input object is required.');
  if (Object.keys(input).some(k => !keys.includes(k))) throw Error('Unknown input field.');
  if (required.some(k => !Object.hasOwn(input, k))) throw Error('Required input field missing.');
  if (JSON.stringify(input).length > 65536) throw Error('Tool input exceeds 64 KiB.');
  return input;
}

export function createM0ToolDefinitions(api) {
  const wrap = (keys, required, fn) => async (input = {}, options = {}) => {
    try {
      checkedInput(input, keys, required);
      if (options.signal?.aborted) return { ok: false, state: 'NOT_STARTED', code: 'CANCELLED' };
      return await fn(input, options);
    } catch (error) {
      return { ok: false, state: 'NOT_STARTED', code: error.code || 'INVALID_REQUEST', message: String(error.message).slice(0,600) };
    }
  };
  return [
    {
      name: 'mathscope.research_m0.status',
      description: 'Read the active MathScope M0 session, typed-object counts, bounded compute capabilities, jobs and evidence-audit summary. Does not modify the session.',
      inputSchema: EMPTY, annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: wrap([], [], () => api.getStatus())
    },
    {
      name: 'mathscope.research_m0.validate_contract',
      description: 'Validate a versioned MathScope research contract without saving it. Schemas and data validation do not prove the mathematical hypotheses.',
      inputSchema: { type: 'object', properties: { kind: { type: 'string', maxLength: 100 }, value: { type: 'object' } }, required: ['kind','value'], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: wrap(['kind','value'], ['kind','value'], ({kind,value}) => {
        if (typeof kind !== 'string' || kind.length > 100 || !value || typeof value !== 'object' || Array.isArray(value)) throw Error('A contract name and object are required.');
        return api.validateContract(kind,value);
      })
    },
    {
      name: 'mathscope.research_m0.run_fixture',
      description: 'Run one named small M0 reference calculation in the current browser worker. Adds only a local job and displays its result; does not save mathematical evidence or replace edited inputs. Returns the job ID for status/cancel.',
      inputSchema: { type: 'object', properties: { adapter: { type: 'string', enum: ADAPTERS } }, required:['adapter'], additionalProperties:false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: wrap(['adapter'],['adapter'], async ({adapter},{signal}) => {
        if (!ADAPTERS.includes(adapter)) throw Error('Unsupported fixture adapter.');
        return api.runFixture(adapter, { signal });
      })
    },
    {
      name: 'mathscope.research_m0.job_status',
      description: 'Read one M0 browser job using an ID returned by run_fixture or the job list. This does not issue proof status.',
      inputSchema: { type:'object', properties:{ jobId:{type:'string',minLength:1,maxLength:160} },required:['jobId'],additionalProperties:false },
      annotations:{readOnlyHint:true,untrustedContentHint:true},
      execute:wrap(['jobId'],['jobId'],({jobId})=>{
        if (typeof jobId !== 'string' || !jobId || jobId.length > 160) throw Error('Invalid job ID.');
        return api.getJobStatus(jobId);
      })
    },
    {
      name:'mathscope.research_m0.cancel_job',
      description:'Request cancellation of a named M0 browser calculation. Preserves its last checkpoint for resume. Cancellation is not a rollback of previously saved session records.',
      inputSchema:{type:'object',properties:{jobId:{type:'string',minLength:1,maxLength:160}},required:['jobId'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute:wrap(['jobId'],['jobId'],({jobId})=>{
        if(typeof jobId !== 'string'||!jobId||jobId.length>160) throw Error('Invalid job ID.');
        return api.cancelJob(jobId);
      })
    },
    {
      name:'mathscope.research_m0.self_test',
      description:'Run bounded M0 contract, arithmetic, selective-stale and proof-audit acceptance checks in isolated memory. No active-session mutation and no external computation.',
      inputSchema:EMPTY,annotations:{readOnlyHint:true,untrustedContentHint:false},
      execute:wrap([],[],(_,options)=>api.runChecks(options))
    },
    {
      name:'mathscope.research_m0.proof_audit',
      description:'Compare the selected Lean source and assumptions with the exact shipped local kernel audit. Modified or untrusted imported sources require revalidation. This neither runs a remote compiler nor issues the existing FORMAL PASS certificate.',
      inputSchema:EMPTY,annotations:{readOnlyHint:true,untrustedContentHint:true},
      execute:wrap([],[],()=>api.checkSelectedProof())
    }
  ];
}

export async function registerM0Tools(api, host = typeof document === 'undefined' ? null : document) {
  if (!host) return { implemented:true,registered:false,reason:'NO_DOCUMENT',dispose(){} };
  const prior = ownership.get(host);
  if (prior) prior.abort();
  const controller = new AbortController();
  ownership.set(host,controller);
  const dispose = () => { controller.abort(); if (ownership.get(host)===controller) ownership.delete(host); };
  const mc = host.modelContext;
  if (!mc || typeof mc.registerTool !== 'function') return {implemented:true,registered:false,reason:'NATIVE_REGISTRATION_UNAVAILABLE',dispose};
  const names=[];
  try {
    for(const tool of createM0ToolDefinitions(api)) {
      if(controller.signal.aborted) return {implemented:true,registered:false,reason:'DISPOSED',dispose};
      await mc.registerTool(tool,{signal:controller.signal});
      names.push(tool.name);
    }
    if(controller.signal.aborted) return {implemented:true,registered:false,reason:'DISPOSED',dispose};
    return {implemented:true,registered:true,contract:'document.modelContext.registerTool + AbortSignal',checkedDocsAt:'2026-10-09',names,consumerVerification:'REQUIRES_CURRENT_CLIENT_INVOCATION',dispose};
  } catch(error) {
    dispose();
    return {implemented:true,registered:false,reason:'REGISTRATION_REJECTED',message:String(error.message).slice(0,300),dispose};
  }
}
