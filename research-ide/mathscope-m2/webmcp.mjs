const EMPTY={type:'object',properties:{},additionalProperties:false},owners=new WeakMap();
export function createM2Tools(api){
  const wrap=(keys,required,fn)=>async(input={},options={})=>{try{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k))||required.some(k=>!Object.hasOwn(input,k))||JSON.stringify(input).length>300000)throw Error('Invalid or oversized tool input.');if(options.signal?.aborted)return {ok:false,code:'CANCELLED',state:'NOT_STARTED'};return await fn(input,options);}catch(e){return {ok:false,code:e.code||'INVALID_REQUEST',message:String(e.message).slice(0,900)};}};
  const jobSchema={type:'object',properties:{jobId:{type:'string',minLength:1,maxLength:150}},required:['jobId'],additionalProperties:false};
  const id=x=>{if(typeof x!=='string'||x.length<1||x.length>150)throw Error('Invalid job ID.');return x;};
  const make=(name,description,inputSchema,readOnlyHint,execute)=>({name:'mathscope.research_m2.'+name,description,inputSchema,annotations:{readOnlyHint,untrustedContentHint:true},execute});
  return [
    make('status','Read installed M2 examples, original-criteria counts, source hashes, finite jobs and visible visualization metadata. No session mutation or formal proof.',EMPTY,true,wrap([],[],()=>api.getStatus())),
    make('validate_request','Validate an explicit bounded M2 request. It checks the installed input contract, not mathematical hypotheses.',{type:'object',properties:{request:{type:'object'}},required:['request'],additionalProperties:false},true,wrap(['request'],['request'],({request})=>api.validateRequest(request))),
    make('run_example','Load a named M2 example into the visible editor and execute it in the static bounded Worker. Returns a job ID. No evidence is saved automatically.',{type:'object',properties:{exampleId:{type:'string',minLength:1,maxLength:160}},required:['exampleId'],additionalProperties:false},false,wrap(['exampleId'],['exampleId'],({exampleId},options)=>{if(typeof exampleId!=='string'||exampleId.length>160)throw Error('Invalid example ID.');return api.runExample(exampleId,options);})),
    make('run_request','Load an explicit bounded M2 request into the visible editor and execute it. Scope, changed-input and resource limits are preserved; no automatic evidence save.',{type:'object',properties:{request:{type:'object'}},required:['request'],additionalProperties:false},false,wrap(['request'],['request'],({request},options)=>api.runRequest(request,options))),
    make('job_status','Read the exact input, finite result and source bindings of one locally executed M2 job.',jobSchema,true,wrap(['jobId'],['jobId'],({jobId})=>api.getJob(id(jobId)))),
    make('select_job','Select an existing M2 run, restoring its own input and source-bound visualizations together.',jobSchema,false,wrap(['jobId'],['jobId'],({jobId})=>api.selectJob(id(jobId)))),
    make('cancel_job','Cancel an owned M2 Worker and retain diagnostic checkpoint metadata. Restart recomputes the original input.',jobSchema,false,wrap(['jobId'],['jobId'],({jobId})=>api.cancelJob(id(jobId)))),
    make('save_result','Save an already executed M2 finite result to the same unchanged research session. It checks owned receipts, input/result/source hashes and session revision. Never grants FORMAL PASS.',jobSchema,false,wrap(['jobId'],['jobId'],({jobId})=>api.saveResult(id(jobId)))),
    make('replay_job','Recompute an existing owned M2 run under the same installed source and compare semantic digests. No imported evidence is trusted.',jobSchema,false,wrap(['jobId'],['jobId'],({jobId})=>api.replayJob(id(jobId))))
  ];
}
export async function registerM2Tools(api,host=typeof document==='undefined'?null:document){
  if(!host)return {registered:false,reason:'NO_DOCUMENT',dispose(){}};owners.get(host)?.abort();const controller=new AbortController();owners.set(host,controller);const dispose=()=>{controller.abort();if(owners.get(host)===controller)owners.delete(host);};
  if(typeof host.modelContext?.registerTool!=='function')return {registered:false,reason:'NATIVE_REGISTRATION_UNAVAILABLE',dispose};
  const names=[];try{for(const tool of createM2Tools(api)){await host.modelContext.registerTool(tool,{signal:controller.signal});names.push(tool.name);}return {registered:true,names,consumerVerification:'PENDING_CURRENT_CLIENT',dispose};}catch(e){dispose();return {registered:false,reason:'REGISTRATION_REJECTED',message:e.message,dispose};}
}
