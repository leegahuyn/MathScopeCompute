import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createIndependentMeanReader} from '../source-saved-whole-mean-direct-audit.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {openSavedInitializedSource,savedInitializedSourceProgram} from '../source-saved-initialized-authority.mjs';
import {attachSavedQuadraticDerivativeAuthority} from '../source-saved-quadratic-implicit-derivatives.mjs';
import {attachSavedMonotoneDerivativeAuthority} from '../source-saved-monotone-implicit-derivatives.mjs';
import {createNaturalSeriesAuditRule,naturalSeriesScaledTail,attachSavedNaturalSeriesAuditAuthority,assertSavedNaturalSeriesAuditAuthority} from '../source-saved-quadratic-series-audit.mjs';

function fixture(){
  const nodes=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},{op:'coordinate',args:['eta']},{op:'coordinate',args:['Y']},{op:'coordinate',args:['X']}];
  const put=(op,args)=>{const id=nodes.length;nodes.push({op,args});return id;},q=(n,d=1)=>put('rational',[String(n),String(d)]),node=id=>nodes[id];
  const core={eta:2,h:0,Lambda:1,A:q(1,2),D:q(1,2),d:1,L:1,Ustar:0,Hstar:0,Wstar:0,Zstar:2,chi:1,zeta:0,gSquared:1};
  const root=(component='Phi',Y=3,eta=2,k=0,m=0)=>put('actual_natural_series',[component,Y,eta,k,m]);
  const create=()=>{const rule=createNaturalSeriesAuditRule({node,core}),G=createIndependentMeanReader({node,sourceOperationRules:[rule]});return {G,rule};};
  return {nodes,put,q,node,core,root,create};
}

test('natural chain rule retains both nonlinear actual arguments and second derivatives',()=>{
  const f=fixture(),Y=f.put('integer_power',[4,2]),eta=f.put('integer_power',[4,3]),{G,rule}=f.create(),z=G.importSource(f.root('u',Y,eta)),X=G.importSource(4),verify=createFactoredRationalVerifier(G);
  const Ny=G.importSource(f.root('u',Y,eta,1,0)),Ne=G.importSource(f.root('u',Y,eta,0,1));
  const expected=G.add(G.mul(G.q(2),X,Ny),G.mul(G.q(3),G.pow(X,2),Ne));
  assert.equal(verify(G.sub(G.derivative(z,X),expected)).pass,true);
  assert.equal(verify(G.sub(G.derivative(z,X),G.mul(G.q(3),G.pow(X,2),Ne))).pass,false);
  const Nyy=G.importSource(f.root('u',Y,eta,2,0)),Nye=G.importSource(f.root('u',Y,eta,1,1)),Nee=G.importSource(f.root('u',Y,eta,0,2));
  const second=G.add(G.mul(G.q(2),Ny),G.mul(G.q(6),X,Ne),G.mul(G.q(4),G.pow(X,2),Nyy),G.mul(G.q(12),G.pow(X,3),Nye),G.mul(G.q(9),G.pow(X,4),Nee));
  assert.equal(verify(G.sub(G.derivative(G.derivative(z,X),X),second)).pass,true);
  assert.equal(rule.diagnostics(G).sourceCapabilityBound,false);
  assert.ok(G.diagnostics().domainHypotheses.some(r=>r.kind==='EXACT_NATURAL_SERIES_ANALYTIC_DOMAIN'&&r.provedByThisAudit===false&&r.allPremisesDischarged===false));
});

test('finite recurrence retains B.14/B.15 and average coefficients without declaring a partial sum the exact limit',()=>{
  const f=fixture(),{G,rule}=f.create(),Y=G.importSource(3),eta=G.importSource(2),verify=createFactoredRationalVerifier(G),Phi=G.importSource(f.root()),u=G.importSource(f.root('u')),average=G.importSource(f.root('average'));
  // With these explicit inputs Phi_1=-1/4 and u_1=-eta/2.
  assert.equal(verify(G.sub(rule.finitePartialSum(G,Phi,1),G.sub(G.one,G.div(Y,G.q(4))))).pass,true);
  assert.equal(verify(G.sub(rule.finitePartialSum(G,u,1),G.neg(G.div(G.mul(eta,Y),G.q(2))))).pass,true);
  assert.equal(verify(G.sub(rule.finitePartialSum(G,average,1),G.neg(G.div(G.mul(eta,Y),G.q(4))))).pass,true);
  assert.notEqual(rule.finitePartialSum(G,Phi,1),Phi);
  assert.equal(rule.diagnostics(G).finiteApproximantUsedAsExactRoot,false);
  assert.ok(rule.diagnostics(G).finitePartialRows.every(r=>r.finitePartialSumIsNotExactLimit));
});

test('mixed finite coefficient derivatives occur before nonlinear eta substitution',()=>{
  const f=fixture(),actualEta=f.put('integer_power',[4,2]),{G,rule}=f.create(),X=G.importSource(4),Y=G.importSource(3),verify=createFactoredRationalVerifier(G),u=G.importSource(f.root('u',3,actualEta)),ue=G.importSource(f.root('u',3,actualEta,0,1));
  assert.equal(verify(G.sub(rule.finitePartialSum(G,u,1),G.neg(G.div(G.mul(G.pow(X,2),Y),G.q(2))))).pass,true);
  assert.equal(verify(G.sub(rule.finitePartialSum(G,ue,1),G.neg(G.div(Y,G.q(2))))).pass,true);
  assert.equal(verify(G.sub(G.derivative(rule.finitePartialSum(G,u,1),X),G.neg(G.mul(X,Y)))).pass,true);
});

test('degree three recurrence includes angular quadratic, mixed parameter and pressure primitive terms',()=>{
  const f=fixture(),{G,rule}=f.create(),u=G.importSource(f.root('u')),Y=G.importSource(3),eta=G.importSource(2),verify=createFactoredRationalVerifier(G);
  // Here p_1=1, p_2=-1/4. At radial order two the complete R2
  // contributes -121*eta/64-3*eta^3/8, so u_3=R2/18.
  const u1=G.neg(G.div(eta,G.q(2))),u2=G.neg(G.div(G.mul(G.q(25),eta),G.q(32))),u3=G.neg(G.add(G.div(G.mul(G.q(121),eta),G.q(1152)),G.div(G.pow(eta,3),G.q(48))));
  const expected=G.add(G.mul(u1,Y),G.mul(u2,G.pow(Y,2)),G.mul(u3,G.pow(Y,3)));
  const actual=rule.finitePartialSum(G,u,3);assert.equal(verify(G.sub(actual,expected)).pass,true);
  // Omitting the angular quadratic -eta*u_1^2 changes u_3 by eta^3/72.
  assert.equal(verify(G.sub(actual,G.add(expected,G.div(G.mul(G.pow(eta,3),G.pow(Y,3)),G.q(72))))).pass,false);
});

test('series chain rule agrees with independent differentiated recurrence approximants',()=>{
  const f=fixture(),Y=f.put('integer_power',[4,3]),eta=f.put('integer_power',[4,2]),{G,rule}=f.create(),X=G.importSource(4),verify=createFactoredRationalVerifier(G);
  const z=G.importSource(f.root('u',Y,eta)),Ny=G.importSource(f.root('u',Y,eta,1,0)),Ne=G.importSource(f.root('u',Y,eta,0,1));
  const actual=G.derivative(rule.finitePartialSum(G,z,3),X),expected=G.add(G.mul(G.q(3),G.pow(X,2),rule.finitePartialSum(G,Ny,3)),G.mul(G.q(2),X,rule.finitePartialSum(G,Ne,3)));
  assert.equal(verify(G.sub(actual,expected)).pass,true);
  assert.equal(rule.diagnostics(G).coefficientNormProved,false);
});

test('local coefficient eta cannot capture an actual argument when the root is substituted',()=>{
  const f=fixture(),{G,rule}=f.create(),z=G.importSource(f.root('u')),eta=G.importSource(2),X=G.importSource(4),changed=G.substitute(z,eta,G.pow(X,2)),verify=createFactoredRationalVerifier(G),Y=G.importSource(3);
  assert.equal(verify(G.sub(rule.finitePartialSum(G,changed,1),G.neg(G.div(G.mul(G.pow(X,2),Y),G.q(2))))).pass,true);
  assert.equal(G.derivative(changed,eta),G.zero);
  const row=rule.diagnostics(G).calls.find(r=>r.id===changed);assert.equal(row.derivedFrom.sourceAuthenticatedTuple,false);
  assert.ok(G.nodes[z].args[5]!==eta,'The recurrence eta is an alpha-renamed local binder.');
});

test('primitive coefficient captures and unreviewed input operations are rejected instead of hidden by the function signature',()=>{
  const a=fixture();a.core.Zstar=4;assert.throws(()=>a.create(),/undeclared captured coordinate/);
  const b=fixture();b.core.Zstar=b.put('unreviewed_limit',[2]);assert.throws(()=>b.create(),{code:'UNRESOLVED_NATURAL_INPUT_CLOSURE'});
  const c=fixture(),{G}=c.create();assert.throws(()=>G.importSource(c.put('actual_natural_series',['not-actual',3,2,0,0])));
  assert.throws(()=>createNaturalSeriesAuditRule({node:c.node,core:c.core,originalN602Complete:true}));
});

test('order thirteen rejects and axis evaluation retains exact finite axis coefficients',()=>{
  const f=fixture(),{G,rule}=f.create(),z=G.importSource(f.root('u',3,2,0,12)),eta=G.importSource(2);
  assert.throws(()=>G.derivative(z,eta),{code:'NATURAL_DERIVATIVE_ORDER_LIMIT'});
  assert.equal(rule.diagnostics(G).stops[0].derivativeReturned,false);
  const uy=G.importSource(f.root('u',0,2,1,0)),verify=createFactoredRationalVerifier(G);
  assert.equal(verify(G.sub(rule.finitePartialSum(G,uy,1),G.neg(G.div(eta,G.q(2))))).pass,true);
  assert.notEqual(uy,G.zero);
});

test('exact positive series tail matches the full combinatorial formula and decreases under refinement',()=>{
  const tail=naturalSeriesScaledTail({degree:0,Y:'1',radialOrder:0,etaOrder:0});
  assert.equal(tail.firstTerm,'1/80');assert.equal(tail.ratioUpper,'1/20');assert.equal(tail.scaledTailUpper,'1/76');
  const rational=s=>s.includes('/')?s.split('/').map(BigInt):[BigInt(s),1n];
  const a=rational(naturalSeriesScaledTail({degree:3,Y:'41/10',radialOrder:1,etaOrder:2}).scaledTailUpper),b=rational(naturalSeriesScaledTail({degree:6,Y:'41/10',radialOrder:1,etaOrder:2}).scaledTailUpper);
  assert.ok(b[0]*a[1]<a[0]*b[1]);assert.equal(tail.coefficientNormProved,false);
  assert.throws(()=>naturalSeriesScaledTail({degree:0,Y:'5',etaOrder:12}),{code:'INSUFFICIENT_DEGREE'});
  assert.throws(()=>naturalSeriesScaledTail({degree:2,Y:'1',coefficientNormProved:true}));
});

test('unused natural rule diagnostics preserve the first exhausted reader stop without source hydration',()=>{
  const f=fixture(),rule=createNaturalSeriesAuditRule({node:f.node,core:f.core}),G=createIndependentMeanReader({node:f.node,sourceOperationRules:[rule],maxWork:30});
  let stop=null;try{for(let j=0;j<100;j++)G.put('coordinate',[`exhaust-work-${j}`]);}catch(error){stop={code:error.code,reason:error.message};}
  assert.equal(stop.code,'RESOURCE_LIMIT');
  const beforeWork=G.diagnostics().workUsed,diagnostics=rule.diagnostics(G),after=G.diagnostics();
  assert.equal(after.workUsed,beforeWork,'Reading diagnostics must not consume more work.');
  assert.equal(diagnostics.readerInitialized,false);assert.deepEqual(diagnostics.calls,[]);assert.deepEqual(diagnostics.derivativeRows,[]);
  assert.equal(after.selectedSourceNodeCount,0,'An unused rule diagnostic must not import or bind a source node.');
  assert.equal(after.sourceOperatorAudits[0].readerInitialized,false);
  assert.equal(diagnostics.sourceAnalyticDomainProved,false);assert.equal(diagnostics.originalN602Complete,false);
  assert.equal(stop.reason,'Independent whole-mean replay exhausted its work budget.');
});

let pending;
const setup=()=>pending||=(async()=>{const cap=await openSavedInitializedSource(),source=savedInitializedSourceProgram(cap),rule=attachSavedNaturalSeriesAuditAuthority(cap);return {cap,source,rule};})();

test('saved node 4483 and node 5029 preserve complete original source arguments and report the actual derivative outcome',{timeout:240000},async()=>{
  const {cap,source,rule}=await setup(),startedAtUTC=new Date().toISOString();assert.equal(assertSavedNaturalSeriesAuditAuthority(rule,cap),true);
  assert.deepEqual(source.node(4483),{op:'actual_natural_series',args:['average',474,2,0,0]});assert.deepEqual(source.node(5029),{op:'actual_quadratic_root',args:[0,4,2]});
  const fixed=source.definitionCollections.filter(r=>r.namespace.endsWith('.fixed'))[0].value,definitions=Object.fromEntries(source.definitionCollections.map(r=>[r.namespace.split('.').at(-1),r.value]));
  const quadratic=attachSavedQuadraticDerivativeAuthority(cap),monotone=attachSavedMonotoneDerivativeAuthority(cap),G=createIndependentMeanReader({node:source.node,definitions,sourceOperationRules:[rule,quadratic,monotone],maxWork:400000,maxNodes:200000});
  const natural=G.importSource(4483),eta=G.importSource(fixed.core.eta);let naturalDerivative=null,quadraticDerivative=null,quadraticRoot=null,stop=null;
  naturalDerivative=G.derivative(natural,eta);assert.ok(Number.isSafeInteger(naturalDerivative));
  try{quadraticRoot=G.importSource(5029);quadraticDerivative=G.derivative(quadraticRoot,eta);}catch(error){stop={code:error.code??'ERROR',reason:error.message};}
  if(stop){assert.ok(['UNRESOLVED_CUSTOM_DERIVATIVE','RESOURCE_LIMIT','CAPTURED_COORDINATE_DERIVATIVE','DEPENDENCY_CYCLE','NATURAL_DERIVATIVE_ORDER_LIMIT'].includes(stop.code),JSON.stringify(stop));assert.ok(!stop.reason.includes('No independent exact derivative rule for unreviewed_source_operation (actual_natural_series, actual source node 4483)'));}
  const diagnostics=rule.diagnostics(G),quadraticDiagnostics=quadratic.diagnostics(G),readerDiagnostics=G.diagnostics();
  assert.ok(diagnostics.calls.some(r=>r.id===natural&&r.sourceCalls.some(x=>x.sourceId===4483&&x.actualSourceTupleAuthenticated)));
  assert.ok(diagnostics.derivativeRows.length>0);assert.equal(diagnostics.reviewedProducerBindings.length,3);
  for(const key of ['originalDerivativeRoutineCalled','sourcePassBitsUsedAsProof','finiteApproximantUsedAsExactRoot','coefficientNormProved','sourceAnalyticDomainProved','newLeanKernelProof','originalN601Complete','originalN602Complete','completeN6','wholeM3Complete','existingWholeMeanAuditAutomaticallyExtended'])assert.equal(diagnostics[key],false,key);
  const artifact={schema:'MathScope.SavedQuadraticNaturalSeriesAudit/1',startedAtUTC,completedAtUTC:new Date().toISOString(),source:cap.source,
    actualSourceCalls:[4483,5029].map(sourceId=>({sourceId,node:source.node(sourceId)})),
    status:stop?'NATURAL_CONDITIONAL_DERIVATIVE_CONSTRUCTED_QUADRATIC_UNRESOLVED':'CONDITIONAL_QUADRATIC_DERIVATIVE_CONSTRUCTED',
    natural,naturalDerivative,quadraticRoot,quadraticDerivative,stop,diagnostics,quadraticDiagnostics,readerDiagnostics,
    tailExample:naturalSeriesScaledTail({degree:8,Y:'41/10',radialOrder:source.node(4483).args[3],etaOrder:source.node(4483).args[4]}),
    actualDomainOrClassAcceptance:false,originalN601Complete:false,originalN602Complete:false,countsChanged:false,
    limitation:'The new source rule is attached only in this explicit integration test. The existing full-mean audit still stops at maximum node 539400. Infinite-limit existence, B_rho norm, analytic parameter domain, continuous implicit-Jacobian nonsingularity and full physical nonzero-angular PDE acceptance are not proved.'};
  const directory=process.env.MATHSCOPE_QUADRATIC_SERIES_EVIDENCE_DIR;
  if(directory){await mkdir(resolve(directory),{recursive:true});const file=`quadratic-series-${startedAtUTC.replace(/[^0-9]/g,'')}.json`,raw=JSON.stringify(artifact,null,2)+'\n';await writeFile(resolve(directory,file),raw,{flag:'wx'});console.log('QUADRATIC_SERIES_AUDIT',JSON.stringify({status:artifact.status,stop,actualNaturalSourceNode:source.node(4483),artifact:file,sha256:createHash('sha256').update(raw).digest('hex'),implementationSHA256:createHash('sha256').update(await readFile(new URL('../source-saved-quadratic-series-audit.mjs',import.meta.url))).digest('hex'),originalN602Complete:false}));}
  else console.log('QUADRATIC_SERIES_AUDIT',JSON.stringify({status:artifact.status,stop,actualNaturalSourceNode:source.node(4483),originalN602Complete:false}));
});

test('copied capability, overridden root and changed reader provider cannot mint authenticated natural series',async()=>{
  const {cap,source,rule}=await setup();assert.throws(()=>attachSavedNaturalSeriesAuditAuthority(structuredClone(cap)));
  assert.throws(()=>attachSavedNaturalSeriesAuditAuthority(cap,{root:4483,completeN6:true}));assert.throws(()=>assertSavedNaturalSeriesAuditAuthority({...rule},cap));
  const copied=createIndependentMeanReader({node:id=>source.node(id),sourceOperationRules:[rule]});assert.throws(()=>copied.importSource(4483));
  const G=createIndependentMeanReader({node:source.node,sourceOperationRules:[rule]});assert.throws(()=>rule.importCall({...G,derivative:()=>G.zero},4483));
});
