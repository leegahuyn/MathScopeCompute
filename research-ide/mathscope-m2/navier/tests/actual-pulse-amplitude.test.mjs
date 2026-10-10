import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {actualMeanPulseAmplitude,encloseLiouvilleTransfer} from '../actual-pulse-amplitude-integrator.mjs';
import {actualMeanPulseIntegrationScales,compileActualMeanPulsePhase} from '../actual-pulse-amplitude-phase.mjs';
import {ACTUAL_PULSE_BINDINGS} from '../actual-pulse-source.mjs';
import {point} from '../../../mathscope-m1/navier/numerics.mjs';

const covers=(z,x)=>z[0]<=x&&x<=z[1],overlap=(a,b)=>Math.max(a[0],b[0])<=Math.min(a[1],b[1]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),transpose=a=>a[0].map((_,i)=>a.map(r=>r[i]));
const matmul=(a,b)=>a.map(r=>transpose(b).map(c=>dot(r,c))),matrixClose=(a,b,tolerance=5e-10)=>a.forEach((row,i)=>row.forEach((x,j)=>assert(Math.abs(x-b[i][j])<tolerance,`${i},${j}: ${x} versus ${b[i][j]}`)));

// Test-only finite substitutions verify the compiler's universal matrix algebra.
// They are not a production evaluator and never replace any actual source input.
function finiteMatrixDiagnostic(program,values){
  const roots=program.roots,overrides=new Map(Object.entries(values.roots).map(([name,value])=>[roots[name],value])),memo=new Map();
  function ev(id){
    if(overrides.has(id))return overrides.get(id);if(memo.has(id))return memo.get(id);
    const {op,args}=program.nodes[id];let x;
    if(op==='rational')x=Number(args[0])/Number(args[1]);
    else if(op==='coordinate')x=values.coordinates[args[0]];
    else if(op==='source_parameter')x=values.parameters[args[0]];
    else if(op==='add')x=ev(args[0])+ev(args[1]);
    else if(op==='multiply')x=ev(args[0])*ev(args[1]);
    else if(op==='inverse')x=1/ev(args[0]);
    else if(op==='integer_power')x=ev(args[0])**args[1];
    else if(op==='sqrt_positive')x=Math.sqrt(ev(args[0]));
    else if(op==='exp')x=Math.exp(ev(args[0]));
    else if(op==='log_positive')x=Math.log(ev(args[0]));
    else throw Error('The finite matrix diagnostic must not execute source scale oracles: '+op);
    assert(Number.isFinite(x),op+' requires an explicit finite diagnostic substitution');memo.set(id,x);return x;
  }
  const value=name=>{const walk=x=>Array.isArray(x)?x.map(walk):ev(x);return walk(roots[name]);};
  return {value,sourceInstanceCertified:false};
}

function diagnosticFrame(program,{sign=1,v=.8}={}){
  const F=1.4,lambda=.09,R=2,u=3,Ls=5,Bs=.7,p=sign*.23;
  const roots={F,FR:-(2+2*lambda)*F/R,FZ:0,FT:.04,radialBackground:-.001,epsilon:.04,k:5,p,pz:-Bs,Bs,Ls,uStar:u,c0:-Math.sqrt(lambda)};
  return finiteMatrixDiagnostic(program,{roots,coordinates:{R,Z:0,T_c:1,v,theta:.3},parameters:{lambda}});
}

test('actual amplitude source is byte-bound to the unmodified N3 and completed velocity restriction',async()=>{
  const root=new URL('../../../',import.meta.url);
  for(const source of[ACTUAL_PULSE_BINDINGS.assembly,...ACTUAL_PULSE_BINDINGS.sourceFiles]){
    const bytes=await readFile(new URL(source.path,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
  }
  const scales=actualMeanPulseIntegrationScales();assert(scales.pass);assert.equal(scales.checks.length,13);
  assert.equal(scales.completedBackgroundRestriction.velocityIsExactRestriction,true);
  assert.deepEqual(scales.completedBackgroundRestriction.equations,['5.18','5.44','5.45']);
  assert.equal(scales.completedBackgroundRestriction.pressureOrStressCorrectionsAssumedZero,false);
  assert.equal(scales.unknownSmallParametersNotSetToZero,true);
  assert.equal(scales.carrierIntegerMaterialized,false);
  assert(BigInt(scales.checks.find(c=>c.id==='strong-rounding-endpoint').numerator)<0n);
});

test('the complete phase/frame expression graph has actual operands and every nonzero denominator guard',()=>{
  const p=compileActualMeanPulsePhase();
  for(const name of['Phi','n','nPrime','shear','Aphi','U','J','B','Bprime','Bleft','projectedMovingFrame','damping','pressureImaginaryCoefficientRow','eikonalDefect','detJ','gramDet'])assert(Object.hasOwn(p.roots,name),name);
  assert(p.operations.includes('integer_ceiling'));assert(p.operations.includes('integer_floor'));assert(p.operations.includes('implicit_positive_root'));
  assert(!p.operations.some(x=>/oracle/.test(x)));assert.equal(p.operatorCertificates.angularFrequency.includes('nonzero integer'),true);
  assert.equal(p.operatorCertificates.gramDetLower,'4/M^2');assert.deepEqual(p.operatorCertificates.epsilonK2,[1,4]);
  assert.equal(p.operatorCertificates.appliesTo,'domain.certifiedOperatorDomain');assert.equal(p.domain.certifiedOperatorDomain.slowCoordinateDistanceUpper,'4*Sstar^-3');
  assert.equal(p.domain.certifiedOperatorDomain.normalAndFrameBoundsOutsideThisNeighborhoodClaimed,false);
  assert(p.fullPhysicalResidual.timeConvention.includes('tau=-t'));
  assert.equal(p.fullPhysicalResidual.completeSlowResidualEvaluated,false);
  assert.equal(p.scope.wholeAnnulusPhaseCertified,false);
  const root=p.nodes[p.roots.implicitTime];assert.equal(root.op,'implicit_positive_root');assert.equal(root.args.length,4);
  assert.equal(p.parametersExactExpressions.h.exp.product[0].integer,-8002);
  assert.equal(p.representative.yExact,'5/2');
});

test('compiled n, B and its left inverse satisfy the transverse algebra for both signs',()=>{
  for(const sign of[-1,1])for(const v of[0,.2,.8,2.5,5]){
    const p=compileActualMeanPulsePhase({sign}),f=diagnosticFrame(p,{sign,v}),n=f.value('n'),B=f.value('B'),left=f.value('Bleft');
    assert.equal(f.sourceInstanceCertified,false);
    matrixClose(matmul([n],B),[[0,0]]);matrixClose(matmul(left,B),[[1,0],[0,1]]);
    const gram=matmul(transpose(B),B),det=gram[0][0]*gram[1][1]-gram[0][1]*gram[1][0];
    assert(det>0);assert(Math.abs(det-f.value('gramDet'))<1e-8);
    const J=f.value('J');assert(Math.abs(J[0][0]*J[1][1]-J[0][1]*J[1][0]-f.value('detJ'))<1e-12);
  }
});

test('the explicit compiler retains both moving normal and moving frame derivatives',()=>{
  const p=compileActualMeanPulsePhase(),v=.8,f=diagnosticFrame(p,{v}),h=1e-5;
  const B=f.value('B'),Bp=f.value('Bprime'),plus=diagnosticFrame(p,{v:v+h}).value('B'),minus=diagnosticFrame(p,{v:v-h}).value('B');
  matrixClose(Bp,plus.map((r,i)=>r.map((x,j)=>(x-minus[i][j])/(2*h))),3e-9);
  const n=f.value('n'),np=f.value('nPrime'),A=f.value('Aphi'),K=f.value('shear'),left=f.value('Bleft'),nK=transpose(K).map(c=>dot(n,c)),n2=dot(n,n);
  const direct=K.map((row,i)=>row.map((x,j)=>-x+n[i]*(nK[j]-np[j])/n2));matrixClose(A,direct);
  const actual=f.value('projectedMovingFrame'),withoutMovingNormal=K.map((row,i)=>row.map((x,j)=>-x+n[i]*nK[j]/n2));
  matrixClose(actual,matmul(left,matmul(A,B).map((r,i)=>r.map((x,j)=>x-Bp[i][j]))));
  const wrong=matmul(left,matmul(withoutMovingNormal,B).map((r,i)=>r.map((x,j)=>x-Bp[i][j])));
  assert(actual.flat().some((x,i)=>Math.abs(x-wrong.flat()[i])>1e-4));
  const wrongNoBprime=matmul(left,matmul(A,B));assert(actual.flat().some((x,i)=>Math.abs(x-wrongNoBprime.flat()[i])>1e-4));
  const t=B.map(r=>r[0]),derivative=withoutMovingNormal.map(r=>dot(r,t));
  assert(Math.abs(dot(np,t)+dot(n,derivative))>1e-3,'Omitting the moving normal violates the differentiated constraint.');
  assert(Math.abs(dot(np,t)+dot(n,A.map(r=>dot(r,t))))<1e-10);
});

test('full source principal pressure and energy identities agree with the compiled operator',()=>{
  const f=diagnosticFrame(compileActualMeanPulsePhase()),B=f.value('B'),t=B.map(r=>r[0]+.27*r[1]),A=f.value('Aphi'),K=f.value('shear'),n=f.value('n'),d=f.value('damping'),pRow=f.value('pressureImaginaryCoefficientRow');
  const tp=A.map((row,i)=>dot(row,t)-d*t[i]),pressureImag=dot(pRow,t),k=5;
  const z=[1,.27],zPrime=f.value('projectedMovingFrame').map((row,i)=>dot(row,z)-d*z[i]),frameDerivative=f.value('Bprime');
  const reconstructed=B.map((row,i)=>dot(row,zPrime)+dot(frameDerivative[i],z));
  reconstructed.forEach((x,i)=>assert(Math.abs(x-tp[i])<1e-10,'(7.17) reconstructs the full principal derivative'));
  for(let i=0;i<3;i++)assert(Math.abs(tp[i]+dot(K[i],t)+d*t[i]-k*n[i]*pressureImag)<1e-10);
  assert(Math.abs(2*dot(t,tp)-(-2*dot(t,K.map(r=>dot(r,t)))-2*d*dot(t,t)))<1e-10);
  assert(Math.abs(dot(t,n))<1e-12);
});

test('original growing data, actual midpoint and both endpoint scales remain distinct',()=>{
  const r=actualMeanPulseAmplitude({steps:16});assert(r.pass);assert.equal(r.rows.length,17);assert.equal(r.cells.length,16);
  assert.deepEqual(r.rows[0].radialOverP,[1,1]);assert.deepEqual(r.initial.dividedByP0,[1,0]);assert.equal(r.initial.midpointUnitSeedUsed,false);
  assert.equal(r.initial.problem,'HOMOGENEOUS_M1_GROWING_SOLUTION');assert.equal(r.initial.zeroDatumSourcedInverse,false);assert.equal(r.scope.generalForcingInverseComplete,false);
  const m=r.rows[8];assert.deepEqual(m.referenceNormalizedLogP,[0,0]);assert(covers(m.radialOverP,Math.SQRT1_2/2));assert(!covers(m.radialOverP,1));
  for(const end of[r.rows[0],r.rows.at(-1)]){
    assert(end.actualNormalizedLogNorm[1]<-.3);assert(end.actualAmplitude.strictlyPositiveRadial);assert(end.actualAmplitude.P.underflowIsNotZero);
    assert(end.actualAmplitude.radialMultiplierInterval[0]>0);assert.equal(end.actualAmplitude.unitMidpointAmplitudeImposed,false);
  }
  assert(r.cells.every(c=>c.wholeCellPotentialEnclosed));assert.equal(r.gaussian.proofUsesSampling,false);
});

test('actual source amplitudes and positive energy are enclosed over the entire returned grid',()=>{
  const r=actualMeanPulseAmplitude({steps:32});
  for(const row of r.rows){
    // These limits are independent arithmetic probes INSIDE the actual enclosure,
    // never a replacement for the positive source parameters or the solution.
    const a=row.a,x=(.5/a)**1.5,y=.5**1.5/a**.5,energy=.125/a;
    assert(covers(row.radialOverP,x));assert(covers(row.minusMovingNOverSqrtLambdaUStarP,y));assert(covers(row.energyOverP2UStar2,energy));
    assert(covers(row.orthogonalityResidualInterval,0));assert(row.energyOverP2UStar2[0]>0);
    assert.equal(row.sourcePath,`result.results.rows[${row.index}]`);
    const fields=['radialOverP','minusMovingNOverSqrtLambdaUStarP','thetaOverSqrtLambdaUStarP','zOverUStarP','energyOverP2UStar2','energyDerivativeOverGScaleP2UStar2','actualNormalizedLogNorm'];
    for(const key of fields)assert(row[key].every(Number.isFinite),key);
    const derivative=2*(x*y-a*a*energy);assert(covers(row.energyDerivativeOverGScaleP2UStar2,derivative));
  }
});

test('the two source signs share radial growth and reverse axial covariance direction',()=>{
  const a=actualMeanPulseAmplitude({steps:16,sign:1}),b=actualMeanPulseAmplitude({steps:16,sign:-1});
  a.rows.forEach((r,i)=>{
    const s=b.rows[i];assert.deepEqual(r.radialOverP,s.radialOverP);assert.deepEqual(r.thetaOverSqrtLambdaUStarP,s.thetaOverSqrtLambdaUStarP);
    assert.deepEqual(r.zOverUStarP,[-s.zOverUStarP[1],-s.zOverUStarP[0]]);assert.deepEqual(r.energyOverP2UStar2,s.energyOverP2UStar2);
  });
  assert.equal(a.phaseProgram.representative.sign,1);assert.equal(b.phaseProgram.representative.sign,-1);
  assert.notDeepEqual(a.phaseProgram.roots,b.phaseProgram.roots);
});

test('dyadic cell refinements are independent enclosures and agree at common pulse positions',()=>{
  const a=actualMeanPulseAmplitude({steps:16}),b=actualMeanPulseAmplitude({steps:32}),c=actualMeanPulseAmplitude({steps:64});
  a.rows.forEach((r,i)=>{for(const key of['radialOverP','thetaOverSqrtLambdaUStarP','energyOverP2UStar2']){assert(overlap(r[key],b.rows[2*i][key]));assert(overlap(r[key],c.rows[4*i][key]));}});
  assert.equal(a.arithmetic.method,'CELLWISE_POSITIVE_VOLTERRA_COMPARISON');assert(a.gaussian.wholeInterval);
});

test('variable-potential comparison contains an independently evaluated constant-potential special case',()=>{
  const G=4,H=.75,L=.3,inv=point(1/G),r=encloseLiouvilleTransfer({potential:[.5,1],step:point(L),inverseGrowth:inv}),kappa=Math.sqrt(G*G+H),scale=Math.exp(-G*L),c=Math.cosh(kappa*L)*scale,s=Math.sinh(kappa*L)*scale;
  assert(covers(r.matrix[0][0],c));assert(covers(r.matrix[0][1],s*G/kappa));assert(covers(r.matrix[1][0],s*kappa/G));assert(covers(r.matrix[1][1],c));
  assert.equal(r.sourceInstanceCertified,false);assert(r.matrix.flat().every(z=>z[0]>0));
  const huge=encloseLiouvilleTransfer({potential:[.24,.26],step:point(.03125),inverseGrowth:[0,2**-1000]});
  assert(huge.matrix.flat().every(z=>covers(z,.5)));assert(huge.decayingModeFactor[1]>0);assert.equal(huge.decayingModeFactor[0],0);
});

test('finite-source-family scope, normalized units, and no full residual/covariance claim are explicit',()=>{
  const r=actualMeanPulseAmplitude({y:4.75,steps:8});
  assert.equal(r.status,'PARTIAL');assert.equal(r.scope.certifiedRepresentativeEta,0);assert(r.scope.actualFullPulseInterval);
  for(const k of['generalForcingInverseComplete','allSlowDerivativeGaussianBoundsCertified','wholeAnnulusPulseCertified','actualT0CovarianceMatched','fullPhysicalResidualEvaluated','allOriginalN5PackageComplete','newLeanKernelProof'])assert.equal(r.scope[k],false,k);
  assert.equal(r.actualMeanField.coordinateFrame,'BAND_CHART_Q_FIXED');assert.equal(r.actualMeanField.restoredQuantitiesArePhysicalCartesian,false);
  assert.equal(r.phaseProgram.representative.yExact,'19/4');assert.equal(r.reduction.dampingRetained,true);assert.equal(r.reduction.movingNormalTermRetained,true);
});

test('no alternative profile, carrier, tolerance, or claimed certificate can enter actual integration',()=>{
  for(const input of[null,[],42,{h:0},{lambda:.1},{sourceProfile:'different'},{y:0},{y:5},{y:NaN},{eta:.01},{s:.5},{ell:8},{sign:0},{sign:'1'},{steps:7},{steps:12},{steps:257},{bits:512},{certified:true}])assert.throws(()=>actualMeanPulseAmplitude(input),e=>e.code==='INVALID_INPUT'||e.message.includes('exact accepted N3'),JSON.stringify(input));
  for(const p of[{potential:[-.1,.1],step:point(1),inverseGrowth:point(.5)},{potential:point(1),step:point(0),inverseGrowth:point(.5)},{potential:point(1),step:point(1),inverseGrowth:point(0)}])assert.throws(()=>encloseLiouvilleTransfer(p));
  assert.throws(()=>compileActualMeanPulsePhase({y:Infinity}));
});

test('actual amplitude replay is stable and cancellation can interrupt a cell sequence',()=>{
  const a=actualMeanPulseAmplitude({y:1.25,steps:8}),b=actualMeanPulseAmplitude({y:1.25,steps:8});assert.deepEqual(a,b);const json=JSON.stringify(a);assert(!json.includes('Infinity'));assert(!json.includes('NaN'));
  const finiteTree=x=>{if(typeof x==='number')assert(Number.isFinite(x));else if(x&&typeof x==='object')Object.values(x).forEach(finiteTree);};finiteTree(a);
  let calls=0;assert.throws(()=>actualMeanPulseAmplitude({steps:32},{checkCancelled(){if(++calls>4)throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),e=>e.code==='CANCELLED');
});
