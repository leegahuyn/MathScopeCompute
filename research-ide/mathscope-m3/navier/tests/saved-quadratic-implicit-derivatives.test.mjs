import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createIndependentMeanReader} from '../source-saved-whole-mean-direct-audit.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {openSavedInitializedSource,savedInitializedSourceProgram} from '../source-saved-initialized-authority.mjs';
import {createQuadraticImplicitDerivativeRule,attachSavedQuadraticDerivativeAuthority,assertSavedQuadraticDerivativeAuthority} from '../source-saved-quadratic-implicit-derivatives.mjs';

function fixture(size=1){
  const nodes=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},{op:'coordinate',args:['eta']},{op:'coordinate',args:['captureX']}];
  const put=(op,args)=>{const id=nodes.length;nodes.push({op,args});return id;},q=(n,d=1)=>put('rational',[String(n),String(d)]),node=id=>nodes[id];
  const d={name:'ExplicitConditionalFixture',linear:Array.from({length:size},(_,i)=>Array.from({length:size},(_,j)=>i===j?1:0)),
    quadraticDiagonal:Array.from({length:size},()=>Array(size).fill(0)),rhs:Array(size).fill(2),scale:1,
    preconditioner:Array.from({length:size},(_,i)=>Array.from({length:size},(_,j)=>i===j?q(17):0)),rootRadius:1,lipschitzUpper:q(1,4),proof:{allChecksPassed:true}};
  const create=()=>{
    const rule=createQuadraticImplicitDerivativeRule({node,systems:[d],eta:2,seedNode:0,branch:'zero-seeded contraction limit'}),
      G=createIndependentMeanReader({node,sourceOperationRules:[rule]});return {rule,G};
  };
  const root=(component=0,eta=2)=>put('actual_quadratic_root',[0,component,eta]);
  return {nodes,node,put,q,d,root,create};
}

test('quadratic implicit derivative and second derivative retain the exact symbolic branch',()=>{
  const f=fixture();f.d.quadraticDiagonal=[[1]];const {G,rule}=f.create(),z=G.importSource(f.root()),eta=G.importSource(2),
    dz=G.derivative(z,eta),ddz=G.derivative(dz,eta),verify=createFactoredRationalVerifier(G),J=G.add(G.one,G.mul(G.q(2),z));
  assert.equal(verify(G.sub(dz,G.inv(J))).pass,true);
  assert.equal(verify(G.sub(ddz,G.neg(G.mul(G.q(2),G.pow(G.inv(J),3))))).pass,true);
  assert.equal(verify(G.sub(dz,G.one)).pass,false);
  assert.equal(rule.diagnostics(G).numericIterateUsedAsRoot,false);
  assert.equal(rule.diagnostics(G).sourceCapabilityBound,false);
  assert.ok(G.diagnostics().domainHypotheses.some(r=>r.kind==='IMPLICIT_QUADRATIC_ROOT_DOMAIN'&&r.continuousJacobianNonzeroRequired&&r.provedByThisAudit===false));
});

test('full A, Q and scale derivatives are retained instead of an eta-independent coefficient shortcut',()=>{
  const f=fixture();f.d.linear=[[f.put('add',[1,2])]];f.d.quadraticDiagonal=[[f.put('add',[f.q(3),2])]];f.d.scale=f.put('add',[f.q(2),2]);
  const {G}=f.create(),z=G.importSource(f.root()),eta=G.importSource(2),A=G.add(G.one,eta),Q=G.add(G.q(3),eta),scale=G.add(G.q(2),eta),
    expected=G.div(G.sub(G.one,G.add(z,G.mul(G.add(Q,scale),G.pow(z,2)))),G.add(A,G.mul(G.q(2),scale,Q,z))),actual=G.derivative(z,eta),verify=createFactoredRationalVerifier(G);
  assert.equal(verify(G.sub(actual,expected)).pass,true);
  assert.equal(verify(G.sub(actual,G.div(G.one,G.add(A,G.mul(G.q(2),scale,Q,z))))).pass,false);
});

test('captured coefficient/RHS coordinates and nonlinear actual-eta composition remain in the chain rule',()=>{
  const f=fixture();f.d.linear=[[3]];f.d.rhs=[f.put('multiply',[3,2])];
  const actualEta=f.put('integer_power',[3,2]),{G}=f.create(),z=G.importSource(f.root(0,actualEta)),X=G.importSource(3),verify=createFactoredRationalVerifier(G);
  assert.equal(verify(G.sub(G.derivative(z,X),G.div(G.sub(G.mul(G.q(3),G.pow(X,2)),z),X))).pass,true);
  // Dropping A_X*z gives 3X instead of the complete conditional derivative.
  assert.equal(verify(G.sub(G.derivative(z,X),G.mul(G.q(3),X))).pass,false);
});

test('quadratic vector Cramer solve uses the full continuous matrix instead of its stored preconditioner',()=>{
  const f=fixture(2);f.d.linear=[[f.q(2),f.q(1)],[f.q(1),f.q(3)]];f.d.rhs=[2,f.put('multiply',[f.q(2),2])];
  const {G,rule}=f.create(),eta=G.importSource(2),a=G.derivative(G.importSource(f.root(0)),eta),b=G.derivative(G.importSource(f.root(1)),eta),verify=createFactoredRationalVerifier(G);
  assert.equal(verify(G.sub(a,G.q(1,5))).pass,true);assert.equal(verify(G.sub(b,G.q(3,5))).pass,true);
  assert.equal(verify(G.sub(a,G.q(17))).pass,false);
  assert.equal(rule.diagnostics(G).continuousMatrixReplacedByPreconditioner,false);
});

test('substitution transforms every captured equation/branch operand and does not authenticate a derived tuple',()=>{
  const f=fixture();f.d.linear=[[3]];f.d.rhs=[f.put('multiply',[3,2])];f.d.preconditioner=[[3]];
  const {G,rule}=f.create(),z=G.importSource(f.root()),X=G.importSource(3),eta=G.importSource(2),changed=G.substitute(z,X,G.q(2)),verify=createFactoredRationalVerifier(G);
  assert.notEqual(changed,z);assert.equal(verify(G.sub(G.derivative(changed,eta),G.one)).pass,true);
  assert.equal(G.derivative(changed,X),G.zero);
  const call=rule.diagnostics(G).calls.find(r=>r.id===changed);
  assert.equal(call.actualSourceTupleAuthenticated,false);assert.equal(call.derivedFrom.sourceAuthenticatedTuple,false);
  assert.notDeepEqual(call.completeEquationAndBranchOperandTuple,rule.diagnostics(G).calls.find(r=>r.id===z).completeEquationAndBranchOperandTuple);
});

test('zero and algebraically singular continuous Jacobians reject even when all serialized checks claim PASS',()=>{
  const a=fixture();a.d.linear=[[0]];const A=a.create();assert.throws(()=>A.G.derivative(A.G.importSource(a.root()),A.G.importSource(2)),{code:'SINGULAR_IMPLICIT_ROOT'});
  const b=fixture(2);b.d.linear=[[3,3],[3,3]];b.d.proof={allChecksPassed:true,determinantNonzero:true};const B=b.create();
  assert.throws(()=>B.G.derivative(B.G.importSource(b.root()),B.G.importSource(2)),{code:'SINGULAR_IMPLICIT_ROOT'});
});

test('unsupported branches, nonzero seeds and incomplete equations reject before derivative construction',()=>{
  const f=fixture(),options={node:f.node,systems:[f.d],eta:2,seedNode:0,branch:'zero-seeded contraction limit'};
  assert.throws(()=>createQuadraticImplicitDerivativeRule({...options,branch:'caller-selected alternate root'}));
  assert.throws(()=>createQuadraticImplicitDerivativeRule({...options,seedNode:1}));
  assert.throws(()=>createQuadraticImplicitDerivativeRule({...options,systems:[{...f.d,linear:[]}]}));
  assert.throws(()=>createQuadraticImplicitDerivativeRule({...options,completeN6:true}));
  const {G}=f.create();assert.throws(()=>G.importSource(f.put('actual_quadratic_root',[0,9,2])));
});

test('an unknown coefficient derivative remains unresolved and cannot be replaced by zero',()=>{
  const f=fixture();f.d.rhs=[f.put('unreviewed_limit',[2])];const {G,rule}=f.create(),z=G.importSource(f.root());
  assert.throws(()=>G.derivative(z,G.importSource(2)),{code:'UNRESOLVED_CUSTOM_DERIVATIVE'});
  assert.equal(rule.diagnostics(G).stops[0].derivativeReturned,false);assert.equal(rule.diagnostics(G).stops[0].completeJacobianConstructed,true);
});

function integralCaptureFixture(){
  const f=fixture(),body=f.put('exp',[f.put('multiply',[3,2])]);
  f.d.rhs=[f.put('definite_integral',[body,3,0,1])];return f;
}
function assertRenamedIntegralDerivative(G,rule,z,X){
  const derivative=G.derivative(z,X),row=rule.diagnostics(G).derivativeRows.find(r=>r.root===z&&r.variable===X),rhs=G.nodes[row.forcing[0]];
  assert.equal(rhs.op,'definite_integral');const binder=rhs.args[1];assert.notEqual(binder,X,'The original integration binder must not capture the actual root argument.');
  const expected=G.integral(G.mul(binder,G.put('exp',[G.mul(binder,X)])),binder,G.zero,G.one),verify=createFactoredRationalVerifier(G);
  assert.notEqual(derivative,G.zero,'Capture cannot erase the derivative of the integral RHS.');
  assert.equal(verify(G.sub(derivative,expected)).pass,true);
}

test('integral operand import alpha-renames a binder occurring in the actual quadratic argument',()=>{
  const f=integralCaptureFixture(),{G,rule}=f.create(),z=G.importSource(f.root(0,3)),X=G.importSource(3);
  assertRenamedIntegralDerivative(G,rule,z,X);
});

test('later root substitution alpha-renames integral binders in the complete retained equation tuple',()=>{
  const f=integralCaptureFixture(),{G,rule}=f.create(),original=G.importSource(f.root()),eta=G.importSource(2),X=G.importSource(3),changed=G.substitute(original,eta,X);
  assertRenamedIntegralDerivative(G,rule,changed,X);
  const call=rule.diagnostics(G).calls.find(r=>r.id===changed);assert.equal(call.actualSourceTupleAuthenticated,false);assert.equal(call.derivedFrom.sourceAuthenticatedTuple,false);
});

let pending;
const setup=()=>pending||=(async()=>{const cap=await openSavedInitializedSource(),source=savedInitializedSourceProgram(cap),rule=attachSavedQuadraticDerivativeAuthority(cap);return {cap,source,rule};})();

test('actual saved node 5029 binds all three equations and records a conditional derivative or the exact unresolved gate',{timeout:120000},async()=>{
  const {cap,source,rule}=await setup(),startedAtUTC=new Date().toISOString();assert.equal(assertSavedQuadraticDerivativeAuthority(rule,cap),true);
  assert.deepEqual(source.node(5029),{op:'actual_quadratic_root',args:[0,4,2]});
  const definitions=Object.fromEntries(source.definitionCollections.map(r=>[r.namespace.split('.').at(-1),r.value])),
    G=createIndependentMeanReader({node:source.node,definitions,sourceOperationRules:[rule],maxWork:200000,maxNodes:200000}),root=G.importSource(5029),eta=G.importSource(2);
  let result=null,stop=null;try{result=G.derivative(root,eta);}catch(error){stop={code:error.code??'ERROR',reason:error.message};}
  const diagnostics=rule.diagnostics(G),readerDiagnostics=G.diagnostics();
  assert.equal(diagnostics.definitionBindings.length,3);assert.deepEqual(diagnostics.definitionBindings.map(r=>r.dimension),[5,5,3]);
  assert.equal(diagnostics.calls.find(r=>r.id===root).actualSourceTupleAuthenticated,true);
  assert.equal(diagnostics.calls.find(r=>r.id===root).sourceCalls[0].sourceId,5029);
  for(const key of ['originalDerivativeRoutineCalled','originalPassBitsUsedAsProof','numericIterateUsedAsRoot','sourceDomainAndClassProved','nonsingularityProved','uniformAllOrderClassProved','newLeanKernelProof','originalN601Complete','originalN602Complete','completeN6','wholeM3Complete','wholeM4Complete'])assert.equal(diagnostics[key],false,key);
  assert.ok(result!==null||stop,'Every incomplete derivative must retain its actual stop.');
  if(stop)assert.ok(['UNRESOLVED_CUSTOM_DERIVATIVE','RESOURCE_LIMIT','CAPTURED_COORDINATE_DERIVATIVE','DEPENDENCY_CYCLE'].includes(stop.code),JSON.stringify(stop));
  const artifact={schema:'MathScope.SavedQuadraticImplicitDerivativeAudit/1',startedAtUTC,completedAtUTC:new Date().toISOString(),
    source:cap.source,actualSourceCall:{sourceId:5029,node:source.node(5029)},status:stop?'UNRESOLVED':'CONDITIONAL_DERIVATIVE_CONSTRUCTED',result,stop,diagnostics,readerDiagnostics,
    derivativeIdentityConditionalOnOriginalDomain:true,actualDomainOrClassAcceptance:false,originalN602Complete:false,countsChanged:false};
  const directory=process.env.MATHSCOPE_QUADRATIC_IMPLICIT_EVIDENCE_DIR;
  if(directory){await mkdir(resolve(directory),{recursive:true});const file=`quadratic-implicit-${startedAtUTC.replace(/[^0-9]/g,'')}.json`,raw=JSON.stringify(artifact,null,2)+'\n';
    await writeFile(resolve(directory,file),raw,{flag:'wx'});console.log('QUADRATIC_IMPLICIT_AUDIT',JSON.stringify({status:artifact.status,stop,artifact:file,sha256:createHash('sha256').update(raw).digest('hex'),sourceImplementationSha256:createHash('sha256').update(await readFile(new URL('../source-saved-quadratic-implicit-derivatives.mjs',import.meta.url))).digest('hex'),originalN602Complete:false}));
  }else console.log('QUADRATIC_IMPLICIT_AUDIT',JSON.stringify({status:artifact.status,stop,originalN602Complete:false}));
});

test('copied authorities, alternate caller roots and forged/decorated reader providers cannot mint saved source derivatives',async()=>{
  const {cap,source,rule}=await setup();assert.throws(()=>attachSavedQuadraticDerivativeAuthority(structuredClone(cap)));
  assert.throws(()=>attachSavedQuadraticDerivativeAuthority(cap,{root:5029,completeN6:true}));
  assert.throws(()=>assertSavedQuadraticDerivativeAuthority({...rule},cap));
  const copiedProvider=createIndependentMeanReader({node:id=>source.node(id),sourceOperationRules:[rule]});
  assert.throws(()=>copiedProvider.importSource(5029));
  const G=createIndependentMeanReader({node:source.node,sourceOperationRules:[rule]});
  assert.throws(()=>{G.derivative=()=>G.zero;},TypeError);
  assert.throws(()=>rule.importCall({...G,derivative:()=>G.zero},5029));
});
