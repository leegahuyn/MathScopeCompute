import test from 'node:test';
import assert from 'node:assert/strict';
import {directedArithmetic,intervalJets,rational as Q,readRational,qcompare,qmul,qdiv,qsub,qpow} from '../actual-continuation-arithmetic.mjs';
import {terminalTargetElementary,terminalTargetRegularIntegrandJet,terminalTargetPerturbationAudit,encloseTerminalTargetRegularCoefficient} from '../actual-terminal-target-coefficient-kernel.mjs';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {outerStressFactorAlgebra} from '../actual-stress-direction-program.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

const contains=(A,box,value)=>{const v=Q(value[0]*A.S,value[1]);assert.ok(Q(box[0])[0]*v[1]<=v[0]&&Q(box[1])[0]*v[1]>=v[0]);};

test('the original outer angular target retains all three factors after positive normalization',()=>{
  const G=new ActualSourceExpressions(),names=['rho','Kstar','H','Cdelta','r','delta','Ac','slow','flat','Jvis','Jinv'],v=Object.fromEntries(names.map(n=>[n,G.fresh('tau_'+n)])),q=n=>G.q(n),
    theta=outerStressFactorAlgebra(G,{K:G.mul(v.Kstar,v.H),c:G.mul(v.rho,v.Cdelta),r:v.r,delta:v.delta,L:G.one,
      viscous:G.mul(v.rho,v.r,v.Kstar,v.Jvis),inviscid:G.mul(v.rho,G.pow(v.r,3),v.Kstar,v.Jinv),axialIntegral:G.zero}).theta,
    tau=G.div(G.mul(v.slow,v.flat,theta),G.mul(G.pow(v.delta,3),v.Ac)),scale=G.div(G.mul(v.rho,v.Kstar,v.r,v.slow,v.flat),G.mul(q(4),v.Ac)),
    coefficient=G.add(v.Jinv,G.div(G.mul(q(2),v.Jvis),G.pow(v.r,2)),G.div(G.mul(q(8),v.H,v.Cdelta),G.mul(G.pow(v.delta,3),G.pow(v.r,2)))),
    proof=x=>sourceGraphRationalIdentity(G,x,{maxMonomials:2000,maxVisits:20000});
  assert.equal(proof(G.sub(tau,G.mul(scale,coefficient))).pass,true);
  assert.equal(proof(G.sub(tau,G.mul(q(4),scale,coefficient))).pass,false,'The J=1/4 integral factor is not removed a second time.');
  assert.equal(proof(G.sub(tau,G.mul(scale,v.Jinv))).pass,false,'The positive boundary and viscous target terms are not silently deleted.');
});

test('directed regular exponentials include the true e and preserve a positive tiny upper bound',()=>{
  const A=directedArithmetic(192),E=terminalTargetElementary(A),e=E.exp(A.point(1));
  assert.ok(qcompare(Q(e[0],A.S),Q(2718281828459045n,1000000000000000n))>0);
  assert.ok(qcompare(Q(e[1],A.S),Q(2718281828459046n,1000000000000000n))<0);
  contains(A,A.mul(E.exp(A.point(2)),E.exp(A.point(-2))),Q(1));
  const tiny=E.exp(A.point(-1000));assert.equal(tiny[0],0n);assert.ok(tiny[1]>0n);assert.notDeepEqual(tiny,[0n,0n]);
});

test('every generated positive-square-root and exponential Taylor coefficient includes its independent exact value',()=>{
  const A=directedArithmetic(192),E=terminalTargetElementary(A),J=intervalJets(A,12),x=J.c(1);x[1]=A.one();
  const root=E.sqrtJet(x);let binomial=Q(1);
  for(let n=0;n<=12;n++){if(n)binomial=qmul(binomial,Q(3-2*n,2*n));contains(A,root[n],binomial);}
  const z=J.c(0);z[1]=A.one();const ex=E.expJet(z);let f=1n;
  for(let n=0;n<=12;n++){if(n)f*=BigInt(n);contains(A,ex[n],Q(1,f));}
});

test('whole-cell integrand values overlap the endpoint jets and all interval widths stay outward',()=>{
  const A=directedArithmetic(160),E=terminalTargetElementary(A),left=Q(0),right=Q(1,2),whole=terminalTargetRegularIntegrandJet(A,E,left,right),
    a=terminalTargetRegularIntegrandJet(A,E,left,left),b=terminalTargetRegularIntegrandJet(A,E,right,right);
  for(let n=0;n<whole.length;n++){
    assert.ok(whole[n][0]<=whole[n][1]);assert.ok(whole[n][0]<=a[n][1]&&whole[n][1]>=a[n][0]);assert.ok(whole[n][0]<=b[n][1]&&whole[n][1]>=b[n][0]);
  }
  assert.throws(()=>terminalTargetRegularIntegrandJet(A,E,Q(-1),Q(0)),{code:'INVALID_INPUT'});
});

test('the original h, new point and heat perturbations have a strictly positive quantified reserve',()=>{
  const a=terminalTargetPerturbationAudit();assert.equal(a.pass,true);assert.ok(a.checks.every(x=>x.pass));
  assert.equal(a.requiredActualPremises.profileL,'1');assert.equal(a.sourceAuthenticated,false);
  const sum=qsub(qsub(qsub(qsub(Q(1,1n<<2400n),Q(1,1n<<2542n)),Q(1,1n<<4090n)),Q(1,1n<<6648n)),Q(1,1n<<16368n));
  assert.ok(qcompare(sum,Q(0))>0);assert.ok(qcompare(readRational(a.bounds.allActualPerturbationsRadius),Q(0))>0);
});

test('a finite Taylor derivative remainder plus the original infinite tail encloses the positive coefficient',()=>{
  const r=encloseTerminalTargetRegularCoefficient();assert.equal(r.pass,true);assert.equal(r.scope.actualSourcePointAuthenticated,false);
  assert.equal(r.errorBudget.toleranceMet,true);assert.equal(r.proof.refinementDifferenceUsedAsProof,false);
  assert.ok(qcompare(readRational(r.absoluteWidth),readRational(r.request.tolerance))<=0);
  assert.ok(qcompare(readRational(r.regularCoefficient.lower),Q(7397744229103n,1000000000000n))>0);
  assert.ok(qcompare(readRational(r.regularCoefficient.upper),Q(7397744229106n,1000000000000n))<0);
  assert.ok(qcompare(readRational(r.errorBudget.positiveInfiniteTailUpper),Q(0))>0);
  assert.ok(r.history.length>1&&r.history.slice(0,-1).some(x=>!x.quadraturePass));
});

test('insufficient verified quadrature budgets and caller-supplied source shortcuts are rejected',()=>{
  for(const input of [{h:0},{sourceAuthenticated:true},{point:{delta:'1/4'}},{tolerance:'0'},{maxCells:20}])
    assert.throws(()=>encloseTerminalTargetRegularCoefficient(input),{code:'INVALID_INPUT'});
  assert.throws(()=>encloseTerminalTargetRegularCoefficient({maxCells:16}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>encloseTerminalTargetRegularCoefficient({precisionBits:96,tolerance:'1/'+String(1n<<100n)}),{code:'PRECISION_REQUIRED'});
});
