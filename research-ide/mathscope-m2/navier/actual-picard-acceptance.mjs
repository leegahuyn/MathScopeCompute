/** Fixed-order acceptance for the actual source's n=1 inner Picard problem.
 *
 * This finite analytic certificate records the exact six-component equation,
 * its source-derived norm, common collar, strip loss and convergent-series
 * remainder.  Its K-term sum is NOT numerically evaluated.  No later moment
 * repair, residual-decay test, higher order or complete N4 package follows
 * from this certificate.  See research/FINITE_CRITERIA_REAUDIT_KO.md.
 */
import {assertSourceProfile, SOURCE_PROFILE_ID} from './source-profile.mjs';
import {sourcePicardSystem} from './source-background.mjs';
import {actualBackgroundMajorant} from './actual-background-majorant.mjs';
import {buildActualBackgroundJets} from './actual-background-jets.mjs';
import {actualBackgroundAxisObservations, verifyActualBackgroundAxisObservations} from './actual-background-observations.mjs';
import {actualBackgroundPointEnclosures, verifyActualBackgroundPointEnclosures} from './actual-background-points.mjs';

const clone=x=>structuredClone(x), same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const I=n=>({integer:String(n)}), R=ref=>({ref}), P=(a,n)=>({power:[a,n]}), M=(...a)=>({product:a}), D=(a,b)=>({quotient:[a,b]});
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_ACTUAL_PICARD_CERTIFICATE'});};

export const ACTUAL_PICARD_CRITERION = Object.freeze({
  id:'N4-03',title:'차수별 inner Picard 풀이',sourcePage:58,
  criteria:'(5.7)의 6성분 선형계와 (5.8)의 convergent Picard series를 사용하고 영 axis datum을 유지한다. 합격: 선택 analytic\nstrip·Cn·Cauchy radius loss를 기록하고 Picard tail를 상계한다. 반경 interval은 차수에 따라 임의 축소하지 않으며 lemma\n의 공통 interval 조건을 검사한다.',
  sourceName:'MathScope_Research_IDE_Blueprint_v1_KO(1)(9).pdf',
  sourceSHA256:'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac',
  retainedCriteriaPath:'evidence/original-m2-criteria.json',
  retainedCriteriaSHA256:'ae8d51410367ed147fda1e1e4c28bcc8df3e398378482e39102cef900ff15ed3',
  contextPages:[5,57,58,79,81,87],
});

/** Paths are relative to mathscope-m2. The Node and independent Python tests
 * read and hash the bytes; the browser-portable producer does not claim that
 * it has access to the filesystem. */
export const ACTUAL_PICARD_SOURCE_BINDINGS = Object.freeze([
  {path:'navier/source-profile-data.mjs',bytes:8996,sha256:'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'},
  {path:'navier/source-background.mjs',bytes:9764,sha256:'7e9b5c45cd6740dfff1005ce6dd877920f0d43d0d426a6c85c15345faecd6349'},
  {path:'navier/actual-background-majorant.mjs',bytes:7200,sha256:'e741d1cd144481c205874d05842b7961807c923f92155a662347dbcd48785b52'},
  {path:'navier/actual-background-jets.mjs',bytes:12529,sha256:'0f96de9291df0f0c92cad12240f7397f52982eb3bcd8c00f99a512afe322c78f'},
  {path:'navier/actual-background-observations.mjs',bytes:6661,sha256:'fdba06c71759e49e4da61e0bf8396cc08f8481bbe2e1cff061ddf19c32b11b4e'},
  {path:'navier/actual-background-points.mjs',bytes:7293,sha256:'e03dd1eefbd97b40405a71285e2a37a42a90a3b4b0738179828693e736bc50ba'},
  {path:'navier/research/ACTUAL_BACKGROUND_KO.md',bytes:18171,sha256:'4ca9f89d35a3c1e7e6318bec15f76429ddfeb320017e95aab384271408f46f85'},
]);

function normalizedSystem(){
  const A0=Array.from({length:6},()=>Array(6).fill('0'));
  const A1=Array.from({length:6},()=>Array(6).fill('0'));
  A0[0][4]='1'; A0[1][5]='1'; A0[2][5]='-1'; A0[3][0]='4*xi*F0';
  A0[4][0]='2*(beta*(-1+2*eta*U0)/L+v)';
  A0[4][1]='4*eta*(A-lambda_n)*HF/L+2*ZF0';
  A0[4][2]='-4*eta*(D+lambda_n)*HF/L';
  A0[4][4]='xi/L+xi*v-2*eta*xi*U0/L';
  A0[5][0]='-8*eta*X*F0/L';
  A0[5][1]='2*gamma*(-1+2*eta*U0)/L+4*eta*(A-lambda_n)*HU/L+2*ZU0';
  A0[5][2]='-4*eta*(D+lambda_n)*HU/L';
  A0[5][3]='4*delta_n*eta/L'; A0[5][5]=A0[4][4];
  A1[4][0]='2*(D*eta+d*U0)/L';
  A1[4][1]=A1[4][2]='-2*d*HF/L';
  A1[5][1]='2*(D*eta+d*U0-d*HU)/L';
  A1[5][2]='-2*d*HU/L'; A1[5][3]='2*d/L';
  return {
    coordinates:['F_1','U_1','K_1','Pi_1','partial_xi F_1','partial_xi U_1'],
    diagonalCPowers:[-1,0,0,0,-1,0],
    changeOfUnknown:'W_normalized = diag(C^-1,1,1,1,C^-1,1) W_original',
    transformation:'A_normalized[i,j] = C^(diagonalCPowers[i]-diagonalCPowers[j])*A_original[i,j]',
    definitions:{F0:'phi0/C',HF:'Hphi/C=F0+X*partial_X F0',ZF0:'Z_(-A-1/2)(F0)',ZU0:'Z_(-A)(U0)',v:'V0/X via its regular radial-average reconstruction',lambda_n:'2*h',delta_n:'-2*A+2*h; distinct from the parameter-strip radius delta',pKnown:'-omegaOverX/2',omegaOverX:'Omega0/X; all four source groups retained'},
    A0,A1,
    forcing:['0','0','0','-xi*omegaOverX','-2*ZZF0','-2*ZZU0+2*eta*X*omegaOverX/L'],
    forcingDefinitions:{ZZF0:'Z_(-A-1/2-D) Z_(-A-1/2) F0',ZZU0:'Z_(-A-D) Z_(-A) U0',knownInteriorConvolution:'empty for n=1; i,j>=1 and i+j=1 has no terms'},
  };
}

/** Verify the sparse block itself, rather than trusting a stored PASS bit. */
export function verifyPicardDerivativeBlock(matrix){
  if(!Array.isArray(matrix)||matrix.length!==6||matrix.some(r=>!Array.isArray(r)||r.length!==6))return {pass:false,reason:'A1 must be a 6 by 6 matrix.'};
  const mask=matrix.map(row=>row.map(x=>x!=='0'));
  const illegalEdges=[],twoStepPaths=[];
  for(let i=0;i<6;i++)for(let j=0;j<6;j++){
    if(mask[i][j]&&!(i>=4&&j<4))illegalEdges.push([i,j]);
    for(let k=0;k<6;k++)if(mask[i][k]&&mask[k][j])twoStepPaths.push([i,k,j]);
  }
  return {pass:illegalEdges.length===0&&twoStepPaths.length===0,illegalEdges,twoStepPaths,
    preservesUnderEtaDifferentiation:true,diagonalGreenOperatorPreservesBlock:true,
    maximumEtaDerivatives:'ceil(k/2)',proof:'A1 and every eta derivative have image in span(e5,e6) and annihilate that span. A diagonal Green kernel preserves it, so adjacent derivative factors vanish. A length-k word has at most ceil(k/2) nonadjacent derivative factors.'};
}

function finiteScope(){return {
  actualSourceProfile:true,supportedBackgroundOrders:[1],
  originalCommonCollarCovered:true,parameterDomain:'all real eta in [-1,1] and the stated complex tube',
  fixedOrderConvergentSolutionDefined:true,sourceDerivedCnAndTail:true,
  finiteAxisAndPositiveRadiusEnclosuresComputed:true,
  numericalKTermSumExecuted:false,completeInnerCollarNumericalEvaluator:false,
  higherBackgroundOrdersFinalized:false,globalFiveMomentRepairComplete:false,
  N4_05ResidualDecayComplete:false,fullN4PackageComplete:false,fullM2PackageComplete:false,
  newLeanKernelExecution:false,
};}

function finiteAcceptance(){return {
  id:'N4-03',status:'PASS',level:'CERTIFIED_FINITE_FIXED_ORDER_ANALYTIC_COMPUTATION',
  case:'Actual accepted N3 source, n=1, original common collar, requested tail precision.',
  proofKind:'Source-bound written analytic derivation with executed exact certificate, source-byte, algebra and finite-enclosure checks; not a new formal proof.',
  packageGateSatisfied:false,
  doesNotRequire:'Materializing the enormous integer K or numerically summing all K terms is not an additional condition in the fixed-n tail acceptance. No such execution is claimed.',
};}

function tailProof(bits){return {
  norm:'sup norm of the normalized six-component vector on 0<=xi<=a and dist(eta,[-1,1])<delta/8',
  coefficientMajorant:'B_k=A^(k+1)/(k+1)! * max(1,ceil(k/2)/Delta)^ceil(k/2)',
  A:'C1*a',Delta:'delta/8',tailBeginsAt:'K',partialSumIndices:'0<=k<K',
  requiredConditions:['A>0','0<Delta<=1','K>=1','K>=ceil(72*A^2/Delta)','K>=ceil(bits/2)'],
  factorialLowerBound:'r! >= (r/3)^r for integers r>=1, from the integral bound for log(r!) and e<3',
  derivativeExponentBound:'For k>=1, p=ceil(k/2)<=r/2 with r=k+1, and (p/Delta)^p <= (r/(2*Delta))^(r/2)',
  termUpper:'[3*A/sqrt(2*Delta*(k+1))]^(k+1)',
  thresholdProof:'K>=72*A^2/Delta implies 9*A^2/(2*Delta*(K+1))<1/16',
  geometricTail:'sum_(k>=K) 4^(-k-1)=4^(-K)/3',
  targetExact:`1/2^${bits}`,targetPowerOfTwo:-bits,
  KEncoding:'EXACT_FINITE_INTEGER_EXPRESSION',KDecimalMaterialized:false,
  truncationActuallyEvaluated:false,
};}

function jetWitness(graph){return {
  schema:graph.schema,order:graph.order,radialDegree:graph.radialDegree,
  nodeCount:graph.nodes.length,roots:clone(graph.positive),
  zeroAxisNodeIDs:Object.fromEntries(['F','U','K','Pi','V'].map(k=>[k,graph.positive[k][0]])),
  zeroAxisNodeValues:Object.fromEntries(['F','U','K','Pi','V'].map(k=>[k,clone(graph.nodes[graph.positive[k][0]])])),
  leadingDatumRoots:clone(graph.fixed),scope:clone(graph.scope),
  role:'Executed finite coefficient recurrence witness; not a replacement of the infinite leading source by its finite jet.',
};}

export function buildActualPicardAcceptance(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('An options object is required.');
  for(const k of Object.keys(input))if(!['profileId','order','bits'].includes(k))fail('No caller coefficient, radius, strip, Cn or replacement source is accepted: '+k);
  const {profileId=SOURCE_PROFILE_ID,order=1,bits=128}=input;
  const source=assertSourceProfile(profileId);
  const majorant=actualBackgroundMajorant({profileId,order,bits});
  const original=sourcePicardSystem(order),normalized=normalizedSystem();
  const certificate={
    schema:'MathScope.ActualFixedOrderPicardAcceptance/1',criterion:clone(ACTUAL_PICARD_CRITERION),
    profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,order,bits,
    sourcePaperSHA256:source.sourcePaperSHA256,sourceBindings:clone(ACTUAL_PICARD_SOURCE_BINDINGS),
    sourceInputs:clone(majorant.sourceInputs),originalSystem:original,normalizedSystem:normalized,
    derivativeBlock:verifyPicardDerivativeBlock(normalized.A1),majorant,
    tailProof:tailProof(bits),
    sourceJetWitness:jetWitness(buildActualBackgroundJets({profileId,order,radialDegree:2})),
    axisObservations:actualBackgroundAxisObservations({profileId}),
    pointEnclosures:actualBackgroundPointEnclosures({profileId,locationScaleBits:bits}),
    scope:finiteScope(),
    acceptance:finiteAcceptance(),
  };
  const verified=verifyActualPicardAcceptance(certificate);
  if(!verified.pass)fail('Internal actual Picard certificate failed: '+verified.checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return certificate;
}

/** Exact structural/math-rule checker. Source inequalities are supplied by
 * the byte-pinned written derivation, not proved by JSON equality. Independent
 * tests separately prove the matrix similarity and tail algebra and verify
 * the retained source bytes and actual coefficient enclosures. */
export function verifyActualPicardAcceptance(c){
  const checks=[];const check=(id,pass,detail)=>checks.push({id,pass:Boolean(pass),...(detail?{detail}: {})});
  try{
    if(!c||c.schema!=='MathScope.ActualFixedOrderPicardAcceptance/1')fail('Unsupported certificate schema.');
    const source=assertSourceProfile(c.profileId);
    if(c.order!==1||!Number.isSafeInteger(c.bits)||c.bits<16||c.bits>4096)fail('Only actual n=1 and bits 16..4096 are certified.');
    check('verbatim-original-criterion',same(c.criterion,ACTUAL_PICARD_CRITERION));
    check('pinned-source',c.parameterExpressionSHA256===source.parameterExpressionSHA256&&c.sourcePaperSHA256===source.sourcePaperSHA256&&same(c.sourceBindings,ACTUAL_PICARD_SOURCE_BINDINGS));
    check('original-six-component-system',same(c.originalSystem,sourcePicardSystem(1)));
    check('exact-change-of-unknown-and-complete-forcing',same(c.normalizedSystem,normalizedSystem()));
    const block=verifyPicardDerivativeBlock(c.normalizedSystem.A1);
    check('sparse-derivative-block',block.pass&&same(c.derivativeBlock,block));
    const d=c.majorant?.derivedConstants;
    check('source-derived-norm-graph',same(c.majorant,actualBackgroundMajorant({profileId:c.profileId,order:1,bits:c.bits}))&&same(c.sourceInputs,c.majorant.sourceInputs));
    check('matrix-and-forcing-slack',same(d?.matrixInfinityNormBound,D(M(I(512),R('radialBaseBound')),R('delta')))&&same(d?.forcingInfinityNormBound,D(M(I(65536),P(R('radialBaseBound'),2)),P(R('delta'),2)))&&same(d?.C1,D(M(I(262144),P(R('radialBaseBound'),2)),P(R('delta'),2))),
      'For B>=1 and 0<delta<=1: C1/(2 forcing)=2 and C1/(2 matrix)=256B/delta>=256.');
    check('nonzero-strip-and-cauchy-loss',same(d?.sourceStripRadius,D(R('delta'),I(4)))&&same(d?.solutionStripRadius,D(R('delta'),I(8)))&&same(d?.cauchyRadiusLoss,D(R('delta'),I(8)))&&c.majorant.analyticStrip.nonvanishingPhiLower==='63/256',
      'delta=rho/(1024Q)>0; delta/4 - delta/8 = delta/8. No tiny positive parameter is substituted by zero.');
    check('original-common-collar',same(c.majorant.commonInterval.X,['0','Xa*exp(t1/16)'])&&c.majorant.commonInterval.independentOfOrder===true&&same(d?.aSquared,M(R('Xa'),{exp:D(R('t1'),I(16))})),
      't1>0 implies exp(t1/128)<exp(t1/64)<exp(t1/32)<exp(t1/16)<exp(t1/8). The observation disc does not change this interval.');
    const expectedK={max:[I(1),{ceil:D(M(I(72),P(R('picardA'),2)),R('cauchyRadiusLoss'))},I(Math.ceil(c.bits/2))]};
    check('finite-symbolic-K-and-tail',same(d?.truncationIndex,expectedK)&&same(d?.tailUpper,P(I(2),-c.bits))&&same(c.tailProof,tailProof(c.bits)));
    check('zero-axis-datum',same(c.originalSystem.axisDatum,[0,0,0,0,0,0])&&same(c.majorant.picard.zeroAxisDatum,[0,0,0,0,0,0])&&same(c.originalSystem.singularDiagonal,[0,0,2,0,3,1]));
    check('actual-source-jet-executed',same(c.sourceJetWitness,jetWitness(buildActualBackgroundJets({profileId:c.profileId,order:1,radialDegree:2}))));
    check('actual-axis-enclosures',verifyActualBackgroundAxisObservations(c.axisObservations).pass);
    check('actual-positive-radius-enclosures',c.pointEnclosures.locationScaleBits===c.bits&&verifyActualBackgroundPointEnclosures(c.pointEnclosures).pass);
    check('finite-scope-and-no-unexecuted-claim',same(c.scope,finiteScope())&&c.majorant.picard.truncationActuallyEvaluated===false&&c.tailProof.truncationActuallyEvaluated===false&&same(c.acceptance,finiteAcceptance()));
  }catch(e){check('well-formed-source-bound-certificate',false,e.message);}
  return {pass:checks.length>=15&&checks.every(x=>x.pass),checks,
    verificationScope:'Exact certificate rules plus cited source derivation; numerical K-term solution and later package gates are excluded.'};
}
