import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {solveAxisCoefficients,jetMul} from '../../axis-series.mjs';
import {prepareOuterSchedule,pressureJet} from '../../followup-construction/outer.mjs';
import {getInnerGluingExamples,validateInnerGluingInput} from '../../followup-construction/source-inner-gluing.mjs';
import {makeBudget} from '../../numerics.mjs';
import {Q,qa,qm,qd,qs,binary64Exact,constant,prows,ppack,peval,padd,psub,pmul,ppow,pdiff,pdivideY,pscale,reconstructCore} from './exact-polynomial.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
export async function runExactCoreAudit(options={}){
  const allowed=['radialDegree','etaDegree'];for(const k of Object.keys(options))if(!allowed.includes(k))throw new Error(`Unknown input ${k}`);
  const N=options.radialDegree??10,M=options.etaDegree??2;
  if(!Number.isSafeInteger(N)||N<2||N>10||!Number.isSafeInteger(M)||M<0||M>4)throw new Error('Supported exact audit degree: radial 2..10, eta 0..4');
  const example=getInnerGluingExamples()[0],v=validateInnerGluingInput(example.request.input);
  if(!v.valid)throw new Error(v.message);
  const input=v.parameters.continuation;
  // The validated options key is intentionally resolved from the original validator;
  // no pressure/axis replacement is accepted by this audit.
  const axis={h:input.pressure.parameters.h,j0:input.axis.j0,sigmaStar:input.axis.sigmaStar??.2,Lambda:input.axis.Lambda,logC:input.axis.logC,axisOrder:N};
  const budget=makeBudget({maxOperations:40000000,maxMilliseconds:60000,maxPoints:2048});
  const schedule=prepareOuterSchedule(input.pressure.parameters,budget);
  const solution=solveAxisCoefficients(0,axis,(eta,n)=>pressureJet(schedule,eta,n).coefficients,budget);
  const fRows=solution.phi.map(row=>jetMul(solution.data.g,row).slice(0,M+1));
  const uRows=solution.u.map((row,n)=>row.slice(0,M+1).map((x,m)=>x/solution.data.Lambda+(n===0?solution.data.Us[m]:0)));
  const piRow=solution.data.Pi.slice(0,M+1);
  const h=binary64Exact(axis.h),Lambda=binary64Exact(axis.Lambda),F=prows(fRows),U=prows(uRows),Pi0=prows([piRow]);
  const r=reconstructCore({F,U,Pi0,h,Lambda});
  const identityChecks=Object.entries(r.identities).map(([id,p])=>({id,zeroPolynomial:p.size===0,nonzeroCoefficientCount:p.size,firstNonzero:ppack(p)[0]??null}));
  const stressEntries=['angularStressNumerator','axialStressNumerator'].map(id=>{const p=r.fields[id],terms=ppack(p),value=peval(p,Q(4),Q(0));return {id,identicallyZero:p.size===0,nonzeroCoefficientCount:p.size,firstNonzero:terms[0]??null,atY4Eta0:qs(value),atY4Eta0Zero:value.n===0n};});
  const negative=[];
  // Reconstructing all formulas consistently is essential: a wrong numerical
  // input is a different polynomial, whereas a wrong identity formula must fail.
  const pressureWrong=psub(pscale(pdiff(Pi0,0),Lambda),ppow(F,2));negative.push({id:'omit_pressure_increment',rejected:pressureWrong.size>0,firstNonzero:ppack(pressureWrong)[0]??null});
  const W=pscale(pdivideY(r.fields.nw),Lambda),wu=pmul(W,U),xwu=pmul(r.fields.nw,U);
  const wrongRn=padd(r.fields.rn,psub(xwu,wu));
  const nsWuWrong=psub(pscale(pdiff(wrongRn,0),Lambda),r.fields.Sn);negative.push({id:'historical_minus_WU_divided_by_X',rejected:nsWuWrong.size>0,firstNonzero:ppack(nsWuWrong)[0]??null});
  const sources={};for(const rel of ['../../axis-series.mjs','../../followup-construction/outer.mjs','../../followup-construction/source-inner-gluing.mjs','./exact-polynomial.mjs'])sources[rel]=sha(await readFile(new URL(rel,import.meta.url)));
  const packedFields=Object.fromEntries(Object.entries(r.fields).map(([k,p])=>[k,ppack(p)]));
  return {schema:'MathScope.Navier.ExactCorePolynomialAudit/1',status:identityChecks.every(x=>x.zeroPolynomial)?'EXACT_POLYNOMIAL_IDENTITIES_VERIFIED':'FAILED',sourceCommit:'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',sourcePaper:{sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[25,26,27,28],equations:['4.5','4.7','4.9','4.15','4.16']},
    input:{upstreamExample:example.id,upstreamInput:example.request.input,etaCenter:0,radialDegree:N,etaDegree:M,hExact:qs(h),LambdaExact:qs(Lambda)},
    polynomialMeaning:'Each coefficient is the exact rational value of the actual IEEE754 output. The eta polynomial uses the stored Taylor jet at eta=0. This is an exact model of those finite arrays; it is not asserted to equal the infinite analytic profile.',
    coordinateMeaning:{Y:'Lambda*X',eta:'signed axial parameter, Taylor centered at zero'},
    sourceHashes:sources,rawArrays:{fRows,uRows,piRow},fields:packedFields,identityChecks,axisRegularity:{...r.axisRegularity,etaDomain:['-1','1'],LUniformLowerExact:qs(qa(Q(1),qm(Q(-2),h))),closedRectangleSmoothScalarCoefficients:true,argument:'L=1-2*h*eta^2 >=1-2*h>0; all numerators are polynomials, V0 has a factor X, and E=sqrt(2X)*F. The Cartesian formula (4.5) has smooth scalar coefficients for q>0.'},stressFormula:r.stressFormula,stressEntries,negativeControls:negative,
    gates:{exactFiniteCoefficientModel:true,exactPressureIdentity:identityChecks[0].zeroPolynomial,exactDivergenceIdentity:identityChecks[1].zeroPolynomial,exactIntegratedStressIdentities:identityChecks.slice(2,4).every(x=>x.zeroPolynomial),leadingTangentialStressIdenticallyZero:stressEntries.every(x=>x.identicallyZero),infiniteAxisIdentityCertified:false,uniformAnalyticEtaRemainderCertified:false,fullStressFlatFactorCertified:false,fullProfileCertified:false,formalPass:false},
    obstruction:'A nonzero stress numerator at Y=4,eta=0 proves that this particular finite polynomial cannot have T0 identically zero on the inner axis region. A finite residual magnitude cannot be replaced by exact vanishing or multiplied away with an endpoint cutoff.',
    proofBoundary:'The zero-coefficient checks are exact executable algebra. A separate Lean audit checks the underlying universal scalar identities; it does not prove these arrays equal the published infinite witness.'};
}
