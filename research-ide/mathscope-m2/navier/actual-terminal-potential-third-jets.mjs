/** Third slow jets of one actual admissible terminal source potential.
 * The full original H, target, inverse, positive square root, pulse,
 * moving frame, transverse/longitudinal and fixed-label slow cutoffs remain.
 * Source domain is the declared open terminal chart with frozen labels.
 * These are exact convergent expressions, not numerical residual bounds.
 */
import {prepareActualAdmissibleTerminalCovariance,assertActualAdmissibleTerminalCovariance} from './actual-admissible-terminal-covariance.mjs';
import {ActualPulseThirdJetExpressions,thirdJetIndices,thirdJetBinomial,thirdJetSubindices,differentiatedThirdScalarJet,differentiatedThirdMatrixJet} from './actual-pulse-third-jet-kernel.mjs';
import {actualPulseMatrixFTCNorm} from './actual-pulse-jet-source.mjs';
import {fixedLabelSourcePartitionFactor} from './actual-physical-full-curl.mjs';
import {normalizeEqualPiecewiseBranches} from './actual-full-curl.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {retainedThirdBodyBinding,instantiateRetainedThirdBodies,retainedCommonDenominatorIdentity} from './actual-third-jet-algebra.mjs';
import {retainedThirdMatrixFTCNorm,clearDisposableThirdJetCaches} from './actual-third-jet-ftc.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),key=alpha=>alpha.join(','),degree=alpha=>alpha.reduce((a,b)=>a+b,0),sameArray=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const root=(G,id)=>Number.isSafeInteger(id)&&id>=0&&!!G.nodes[id];
const atoms=(G,values)=>[...new Set(values.flat(Infinity))].filter(id=>root(G,id)&&G.nodes[id].op!=='rational');
const same=(G,a,b,variables=[])=>{
  const atomicNodes=atoms(G,variables),equality=normalizeEqualPiecewiseBranches(G,G.sub(a,b),atomicNodes);
  return {...sourceGraphRationalIdentity(G,equality.normalized,{atomicNodes,maxTerms:160000}),originalExpression:equality.expression,equalBranchNormalization:equality.identities};
};
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
const mv=(G,A,w)=>A.map(row=>G.add(...row.map((x,j)=>G.mul(x,w[j]))));
const progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G?.nodes.length??null,...extra});};

/** Generic independent multi-factor Leibniz check. The factors, not their
 * derivatives, are caller inputs. This result has no source authority. */
export function scalarThirdProductAudit(G,{factors,directions}){
  if(!Array.isArray(factors)||!factors.length||factors.some(x=>!root(G,x)))fail('INVALID_INPUT','Supply retained scalar factor bodies.');
  const bindings=factors.map(x=>retainedThirdBodyBinding(G,x,directions)),factorJets=factors.map(x=>differentiatedThirdScalarJet(G,x,directions)),indices=thirdJetIndices(directions.length),lookup=new Map(indices.map((a,i)=>[key(a),i]));
  let expanded=indices.map((_,i)=>i?G.zero:G.one);
  for(const factor of bindings)expanded=indices.map(alpha=>G.add(...thirdJetSubindices(alpha,indices).map(beta=>
    G.mul(G.q(thirdJetBinomial(alpha,beta)),expanded[lookup.get(key(beta))],factor.roots[lookup.get(key(alpha.map((x,j)=>x-beta[j])))]))));
  const body=G.mul(...factors),actual=differentiatedThirdScalarJet(G,body,directions),formal=differentiatedThirdScalarJet(G,G.mul(...bindings.map(b=>b.value)),directions);
  const checks=indices.map((orders,i)=>{
    const algebra=retainedCommonDenominatorIdentity(G,formal.roots[i],expanded[i]),materialized=instantiateRetainedThirdBodies(G,formal.roots[i],bindings);
    return {orders,algebra,materialized,retained:actual.roots[i],bodyDerivativeBinding:materialized===actual.roots[i],pass:algebra.pass&&materialized===actual.roots[i]};
  });
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','An actual third product derivative omitted a mixed or repeated Leibniz term.');
  return {body,directions:[...directions],indices,factorJets,bodyBindings:bindings,roots:actual.roots,expanded:expanded.map(x=>instantiateRetainedThirdBodies(G,x,bindings)),checks,pass:true,sourceAuthenticated:false};
}

/** Independently collect all binomial terms of P*B*w. The original P
 * must actually be frozen in the selected slow directions. */
export function vectorThirdAmplitudeAudit(G,{matrix,vector,envelope,directions}){
  if(!Array.isArray(matrix)||!matrix.length||matrix.some(row=>row?.length!==2||row.some(x=>!root(G,x)))||vector?.length!==2||vector.some(x=>!root(G,x))||!root(G,envelope)||directions.some(x=>G.derivative(envelope,x)!==G.zero))
    fail('INVALID_INPUT','Use a retained two-column moving basis, original vector and actually frozen envelope.');
  const B=matrix.map(row=>row.map(x=>retainedThirdBodyBinding(G,x,directions))),w=vector.map(x=>retainedThirdBodyBinding(G,x,directions)),P=retainedThirdBodyBinding(G,envelope,directions),bindings=[...B.flat(),...w,P];
  const indices=thirdJetIndices(directions.length),lookup=new Map(indices.map((a,i)=>[key(a),i])),body=mv(G,matrix,vector.map(x=>G.mul(envelope,x))),actual=body.map(x=>differentiatedThirdScalarJet(G,x,directions));
  const formal=mv(G,B.map(row=>row.map(b=>b.value)),w.map(b=>G.mul(P.value,b.value))),formalJets=formal.map(x=>differentiatedThirdScalarJet(G,x,directions));
  const expanded=indices.map(alpha=>matrix.map((_,row)=>G.mul(P.value,G.add(...thirdJetSubindices(alpha,indices).flatMap(beta=>{
    const b=lookup.get(key(beta)),rest=lookup.get(key(alpha.map((x,j)=>x-beta[j])));return [0,1].map(j=>G.mul(G.q(thirdJetBinomial(alpha,beta)),B[row][j].roots[b],w[j].roots[rest]));
  })))));
  const jets=indices.map((orders,at)=>({orders,roots:actual.map(j=>j.roots[at]),expanded:expanded[at].map(x=>instantiateRetainedThirdBodies(G,x,bindings)),checks:matrix.map((_,row)=>{
    const algebra=retainedCommonDenominatorIdentity(G,formalJets[row].roots[at],expanded[at][row]),materialized=instantiateRetainedThirdBodies(G,formalJets[row].roots[at],bindings);
    return {algebra,materialized,retained:actual[row].roots[at],bodyDerivativeBinding:materialized===actual[row].roots[at],pass:algebra.pass&&materialized===actual[row].roots[at]};
  })}));
  if(jets.some(j=>j.checks.some(c=>!c.pass)))fail('INTERNAL_VALIDATION','The full P*B*w third derivative did not preserve a basis or solution jet.');
  return {body,indices,jets,bodyBindings:bindings,pass:true,envelopeSlowDerivativesActuallyZero:true,sourceAuthenticated:false};
}

/** Differentiate the actual adjugate inverse, then check every coefficient
 * of H*y=T. It never accepts supplied H/target/weight derivative arrays. */
export function covarianceThirdInverseAudit(G,{matrix,target,directions}){
  if(matrix?.length!==2||matrix.some(row=>row?.length!==2||row.some(x=>!root(G,x)))||target?.length!==2||target.some(x=>!root(G,x)))fail('INVALID_INPUT','Use an actual 2x2 matrix and two retained target bodies.');
  const matrixJet=differentiatedThirdMatrixJet(G,matrix,directions),targetScalars=target.map(x=>differentiatedThirdScalarJet(G,x,directions)),indices=matrixJet.indices,lookup=new Map(indices.map((a,i)=>[key(a),i]));
  const determinant=G.sub(G.mul(matrix[0][0],matrix[1][1]),G.mul(matrix[0][1],matrix[1][0])),adjugate=[[matrix[1][1],G.neg(matrix[0][1])],[G.neg(matrix[1][0]),matrix[0][0]]];
  if(determinant===G.zero)fail('SINGULAR_COVARIANCE','The supplied actual matrix is identically singular.');
  const weights=mv(G,adjugate,target).map(x=>G.div(x,determinant)),weightScalars=weights.map(x=>differentiatedThirdScalarJet(G,x,directions));
  const targetJets=indices.map((_,i)=>targetScalars.map(jet=>jet.roots[i])),weightJets=indices.map((_,i)=>weightScalars.map(jet=>jet.roots[i])),checks=[];
  const matrixBindings=matrix.map(row=>row.map(x=>retainedThirdBodyBinding(G,x,directions))),targetBindings=target.map(x=>retainedThirdBodyBinding(G,x,directions)),bodyBindings=[...matrixBindings.flat(),...targetBindings];
  const formalH=matrixBindings.map(row=>row.map(b=>b.value)),formalT=targetBindings.map(b=>b.value),formalDet=G.sub(G.mul(formalH[0][0],formalH[1][1]),G.mul(formalH[0][1],formalH[1][0]));
  const formalAdj=[[formalH[1][1],G.neg(formalH[0][1])],[G.neg(formalH[1][0]),formalH[0][0]]],formalWeights=mv(G,formalAdj,formalT).map(x=>G.div(x,formalDet)),formalScalars=formalWeights.map(x=>differentiatedThirdScalarJet(G,x,directions));
  for(const[at,alpha]of indices.entries()){
    const product=[0,1].map(row=>G.add(...thirdJetSubindices(alpha,indices).flatMap(beta=>{
      const b=lookup.get(key(beta)),rest=lookup.get(key(alpha.map((x,j)=>x-beta[j]))),c=G.q(thirdJetBinomial(alpha,beta));
      return [0,1].map(j=>G.mul(c,matrixBindings[row][j].roots[b],formalScalars[j].roots[rest]));
    })));
    checks.push(...product.map((x,row)=>{
      const algebra=retainedCommonDenominatorIdentity(G,x,targetBindings[row].roots[at],{denominators:[formalDet]}),materialized=instantiateRetainedThirdBodies(G,formalScalars[row].roots[at],bodyBindings);
      return {orders:alpha,row,algebra,materialized,retained:weightJets[at][row],bodyDerivativeBinding:materialized===weightJets[at][row],pass:algebra.pass&&materialized===weightJets[at][row]};
    }));
  }
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The actual third inverse derivative lost an H or target derivative.');
  return {matrix,matrixJet,target,targetJets,determinant,adjugate,weights,weightJets,indices,bodyBindings,checks,pass:true,
    recurrence:'H*y_alpha=T_alpha-sum_(0<beta<=alpha) binomial(alpha,beta)*H_beta*y_(alpha-beta)',
    determinantNonzeroRequired:true,sourceAuthenticated:false,numericalInverseEvaluated:false};
}

/** The positive root itself, all generated derivatives, and every strict
 * subindex in the derivative of sigma^2=y. The caller supplies only y. */
export function positiveSqrtThirdAudit(G,{value,directions}){
  if(!root(G,value))fail('INVALID_INPUT','Use a retained scalar weight.');
  const sigma=G.sqrt(value),rootJet=differentiatedThirdScalarJet(G,sigma,directions),valueJet=differentiatedThirdScalarJet(G,value,directions),indices=rootJet.indices,lookup=new Map(indices.map((a,i)=>[key(a),i]));
  const binding=retainedThirdBodyBinding(G,value,directions),formalSigma=G.sqrt(binding.value),formalJet=differentiatedThirdScalarJet(G,formalSigma,directions);
  const checks=indices.slice(1).map(alpha=>{
    const at=lookup.get(key(alpha)),middle=thirdJetSubindices(alpha,indices).filter(beta=>degree(beta)>0&&key(beta)!==key(alpha));
    const product=G.add(G.mul(G.q(2),formalSigma,formalJet.roots[at]),...middle.map(beta=>G.mul(G.q(thirdJetBinomial(alpha,beta)),formalJet.roots[lookup.get(key(beta))],formalJet.roots[lookup.get(key(alpha.map((x,j)=>x-beta[j])))])));
    const algebra=retainedCommonDenominatorIdentity(G,product,binding.roots[at],{denominators:[formalSigma]}),materialized=instantiateRetainedThirdBodies(G,formalJet.roots[at],[binding]);
    return {orders:alpha,middleSubindexCount:middle.length,algebra,materialized,retained:rootJet.roots[at],bodyDerivativeBinding:materialized===rootJet.roots[at],pass:algebra.pass&&materialized===rootJet.roots[at]};
  });
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','A third square-root derivative omitted an interior product term.');
  return {value,sigma,indices,roots:rootJet.roots,valueRoots:valueJet.roots,bodyBinding:binding,checks,pass:true,positiveValueDomainRequired:true,
    recurrence:'2*sigma*sigma_alpha=y_alpha-sum_(0<beta<alpha) binomial(alpha,beta)*sigma_beta*sigma_(alpha-beta)',
    endpointsExcludedFromMiddleSum:true,sourceAuthenticated:false,numericalSquareRootEvaluated:false};
}

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','terms'].includes(k)))fail('INVALID_INPUT','Only the pinned source profile and finite term count are inputs. Bands, matrices, targets, bounds, weights and labels are internal.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(sourceProfile);
  const terms=input.terms??1;if(!Number.isSafeInteger(terms)||terms<0||terms>1)fail('RESOURCE_LIMIT','Use zero or one displayed exact integral correction; keep the exact limit separate.');
  return {sourceProfile,terms};
}
const metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);};
const publicData=p=>canonicalStringify({request:p.request,coordinates:p.coordinates,pulses:p.pulses,inverse:p.inverse,squareRoots:p.squareRoots,slowCutoff:p.slowCutoff,
  potentials:p.potentials,roots:p.roots,checks:p.checks,domain:p.domain,scope:p.scope,sourceBinding:p.sourceBinding,covarianceChecks:p.covarianceChecks});

function sourceSlowCutoff(G,source,directions){
  const q=(n,d=1)=>G.q(n,d),ell=source.geometry.ell,ell6=G.pow(ell,6),representative=[source.frozen.Rrep,source.frozen.Zrep,source.frozen.Trep];
  const meshLabels=representative.map(x=>G.neg(G.ceiling(G.neg(G.add(G.mul(ell6,x),q(1,2))))));
  const meshAxes=directions.map((x,j)=>fixedLabelSourcePartitionFactor(G,G.sub(G.mul(ell6,x),meshLabels[j])));
  const bandCoordinate=G.neg(G.div(G.log(source.chart.qActual),G.log(q(2)))),bandAxis=fixedLabelSourcePartitionFactor(G,G.sub(bandCoordinate,ell)),body=G.mul(bandAxis.value,...meshAxes.map(x=>x.value));
  const jet=differentiatedThirdScalarJet(G,body,directions);
  return {body,jet,meshLabels,meshAxes,bandCoordinate,bandAxis,representative,ell6,
    choice:'a_j=floor(ell^6*C_rep,j+1/2), selected once from the frozen original representative. No rounded label is slow-differentiated.',
    originalPartition:'chi_ell(-log(q)/log2)*product_j chi_a_j(ell^6*C_j), with the complete original normalized bump denominator on its active support.',
    sameBox:'An active fixed mesh numerator has |ell^6*C_j-a_j|<3/4 while the representative offset is <=1/2. Hence Euclidean slow distance <(5*sqrt(3)/4)/S^3<4/S^3.',
    domain:'Intersect the active cutoff with the original declared terminal slow chart; no square-root evaluation on an uncertified complement.',
    allThirdSlowDerivativesGenerated:true,integerLabelsNumericallyEvaluated:false,globalLabelSumConstructed:false};
}

export function prepareActualTerminalPotentialThirdJets(input={},context={}){
  const request=requestOf(input);progress(context,'admissible-source-start');
  const source=prepareActualAdmissibleTerminalCovariance({sourceProfile:request.sourceProfile},context);
  progress(context,'admissible-source-ready',source.G);
  return attachActualTerminalPotentialThirdJets(source,{terms:request.terms},context);
}

export function attachActualTerminalPotentialThirdJets(source,controls={},context={}){
  assertActualAdmissibleTerminalCovariance(source);
  if(!controls||typeof controls!=='object'||Object.keys(controls).some(k=>k!=='terms'))fail('INVALID_INPUT','Only the exact finite display term count may accompany the authentic source.');
  const request=requestOf({sourceProfile:source.request.sourceProfile,...controls}),sourceCount=source.G.nodes.length;
  const holders=new Set(),graphs=new Set(),visit=holder=>{
    if(!holder||typeof holder!=='object'||holders.has(holder))return;holders.add(holder);
    if(holder.G?.lookup instanceof Map)graphs.add(holder.G);
    for(const name of ['operator','background','prepared','bootstrap','completedOrderOne','actualHeat','leading','loop','pre','completed','orderOne','orderTwo','originalLeading'])visit(holder[name]);
  };visit(source);
  const discarded=[...graphs].map(clearDisposableThirdJetCaches);assertActualAdmissibleTerminalCovariance(source);
  progress(context,'third-source-disposable-caches-cleared',source.G,{graphCount:graphs.size,memoizedEntriesDiscarded:discarded.reduce((s,x)=>s+x.rows.reduce((n,row)=>n+row.entries,0),0)});
  const G=new ActualPulseThirdJetExpressions(source.G,{maxNodes:3000000,checkCancelled:context.checkCancelled,compactFTC:true,onProgress:context.onProgress});
  const coordinates=structuredClone(source.coordinates),directions=['R','Z','T'].map(k=>coordinates[k]),indices=thirdJetIndices(3),lookup=new Map(indices.map((a,i)=>[key(a),i])),v=coordinates.v,pulses=[];
  progress(context,'third-source-copy-ready',G);
  for(const family of source.families){
    const original=G.covarianceSystems[family.system],system=G.definePulseThirdVariation({name:'ActualAdmissibleTerminalThirdPulse_'+family.sign,variable:v,parameters:original.parameters,directions,
      matrix:original.matrix,initial:original.initial,left:G.zero,length:original.length});
    G.bindOriginalCovarianceThirdJet(family.system,system);pulses.push({sign:family.sign,originalCovarianceSystem:family.system,system});
    progress(context,'third-matrix-and-time-FTC-'+family.sign,G);
  }
  for(const[p,family]of pulses.map((p,j)=>[p,source.families[j]])){
    const system=G.pulseThirdJetSystems[p.system],wScalars=family.w.map(x=>differentiatedThirdScalarJet(G,x,directions)),wJets=indices.map((_,i)=>wScalars.map(jet=>jet.roots[i]));
    const basisJet=differentiatedThirdMatrixJet(G,family.frame.B,directions),amplitudeAudit=vectorThirdAmplitudeAudit(G,{matrix:family.frame.B,vector:family.w,envelope:family.P,directions}),amplitudeJets=amplitudeAudit.jets.map(j=>j.roots);
    if(!sameArray(amplitudeAudit.body,family.t))fail('INVALID_SOURCE_CONSTRUCTION','The source amplitude must retain its original P*B*w body.');
    const basisNorms=basisJet.matrices.map(A=>retainedThirdMatrixFTCNorm(G,A,{variable:v,length:source.geometry.Ls,parameters:system.parameters}));
    const finite=G.pulseThirdJetPartialSum(p.system,{terms:request.terms}),variables=[family.P,basisJet.matrices,wJets].flat(Infinity),jets=[];
    for(const[at,alpha]of indices.entries()){
      const subindices=thirdJetSubindices(alpha,indices),combine=values=>[0,1,2].map(row=>G.mul(family.P,G.add(...subindices.flatMap(beta=>{
        const b=lookup.get(key(beta)),rest=lookup.get(key(alpha.map((x,j)=>x-beta[j]))),c=G.q(thirdJetBinomial(alpha,beta));
        return [0,1].map(j=>G.mul(c,basisJet.matrices[b][row][j],values[rest][j]));
      }))));
      const expanded=amplitudeAudit.jets[at].expanded,finiteAmplitude=combine(indices.map((_,i)=>finite.values.slice(2*i,2*i+2))),checks=amplitudeAudit.jets[at].checks;
      const absoluteTail=G.mul(family.P,G.add(...subindices.map(beta=>G.mul(G.q(thirdJetBinomial(alpha,beta)),basisNorms[lookup.get(key(beta))].upper))),finite.tail);
      if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The actual third amplitude product lost a moving-basis derivative.');
      jets.push({orders:alpha,degree:degree(alpha),amplitude:amplitudeJets[at],expanded,finiteAmplitude,absoluteTail,checks});
    }
    Object.assign(p,{matrix:system.matrix,matrixJet:system.matrixJet,bounds:system.bounds,initial:system.initial,initialJets:system.initialJets,augmentedInitial:system.augmentedInitial,
      w:family.w,wJets,basisJet,basisNorms,referenceEnvelope:family.P,referenceEnvelopeFirst:directions.map(x=>G.derivative(family.P,x)),amplitude:family.t,amplitudeJets,amplitudeBodyBindings:amplitudeAudit.bodyBindings,jets,finite});
    progress(context,'third-amplitude-and-basis-FTC-'+family.sign,G);
  }
  const matrix=source.target.H,target=source.target.components,covarianceChecks=[];
  for(const[p,family]of pulses.map((p,j)=>[p,source.families[j]]))for(const component of[1,2]){
    const body=G.mul(G.pow(source.cutoffs.psi,2),family.t[0],family.t[component]),product=scalarThirdProductAudit(G,{factors:[G.pow(source.cutoffs.psi,2),family.t[0],family.t[component]],directions});
    const original=component===1?family.covariance.theta:family.covariance.z,Hjets=differentiatedThirdScalarJet(G,original,directions);
    for(const[at,alpha]of indices.entries()){
      const expected=G.mul(source.geometry.haarFactor,G.integral(product.roots[at],v,G.zero,source.geometry.Ls));
      covarianceChecks.push({sign:family.sign,component,orders:alpha,integrand:product.roots[at],integrandProductCheck:product.checks[at],root:Hjets.roots[at],
        expected,pass:Hjets.roots[at]===expected,endpointDerivativesAreZero:true});
    }
  }
  if(covarianceChecks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The actual covariance derivative must retain the complete fixed-boundary integral.');
  progress(context,'third-covariance-integrals',G);
  const inverse=covarianceThirdInverseAudit(G,{matrix,target,directions});
  if(!sameArray(inverse.weights,source.target.weights)||inverse.determinant!==source.target.determinant)fail('INVALID_SOURCE_CONSTRUCTION','The new derivatives must use the exact original source inverse and target.');
  progress(context,'third-source-inverse',G);
  const squareRoots=inverse.weights.map(value=>positiveSqrtThirdAudit(G,{value,directions}));
  if(!sameArray(squareRoots.map(r=>r.sigma),source.target.squareRootWeights))fail('INVALID_SOURCE_CONSTRUCTION','The original positive square-root weights must be retained.');
  progress(context,'third-source-square-roots',G);
  const slowCutoff=sourceSlowCutoff(G,source,directions),potentials=[],q=(n,d=1)=>G.q(n,d);
  for(const[j,family]of source.families.entries()){
    const sigma=squareRoots[j].sigma,scale=G.div(G.mul(G.sqrt(source.geometry.epsilon),source.cutoffs.chi,source.cutoffs.psi),G.mul(source.geometry.k,family.frame.nSquared)),normalCrossAmplitude=cross(G,family.frame.n,family.t);
    const raw=normalCrossAmplitude.map(x=>G.mul(sigma,scale,x));
    const originalAmplitude=family.t.map(x=>G.mul(G.sqrt(source.geometry.epsilon),sigma,source.cutoffs.chi,source.cutoffs.psi,x)),originalPotential=cross(G,family.frame.n,originalAmplitude).map(x=>G.div(x,G.mul(source.geometry.k,family.frame.nSquared)));
    const valueChecks=raw.map((x,k)=>same(G,x,originalPotential[k],[sigma,source.geometry.k,family.frame.nSquared,source.geometry.epsilon,source.cutoffs.chi,source.cutoffs.psi,...family.frame.n,...family.t]));
    const products=normalCrossAmplitude.map(x=>scalarThirdProductAudit(G,{factors:[slowCutoff.body,sigma,scale,x],directions}));
    const body=products.map(p=>p.body),bodyChecks=body.map((x,k)=>same(G,x,G.mul(slowCutoff.body,raw[k]),[slowCutoff.body,sigma,scale,normalCrossAmplitude[k]]));
    const jets=indices.map((orders,at)=>({orders,degree:degree(orders),roots:products.map(p=>p.roots[at]),
      productRoots:products.map(p=>p.roots[at]),expanded:products.map(p=>p.expanded[at]),checks:products.map((p,k)=>({bodyEquality:bodyChecks[k],product:p.checks[at]}))}));
    const phaseGradient=[G.derivative(family.phase,coordinates.R),G.div(G.derivative(family.phase,coordinates.theta),coordinates.R),G.mul(source.geometry.epsilon,G.derivative(family.phase,coordinates.Z))];
    const phaseChecks=phaseGradient.map((x,k)=>same(G,x,family.frame.n[k]));
    if(![...valueChecks,...phaseChecks].every(c=>c.pass)||jets.some(jet=>jet.checks.some(c=>!c.bodyEquality.pass||!c.product.pass))){
      const failed={sign:family.sign,valueChecks:valueChecks.map(c=>c.pass),phaseChecks:phaseChecks.map(c=>c.pass),bodyChecks:bodyChecks.map(c=>c.pass),failedJetOrders:jets.filter(jet=>jet.checks.some(c=>!c.product.pass)).map(j=>j.orders)};
      progress(context,'third-potential-binding-failed',G,failed);fail('INTERNAL_VALIDATION','The source potential or its full third Leibniz/phase chain did not bind: '+JSON.stringify(failed));
    }
    potentials.push({sign:family.sign,weight:inverse.weights[j],sigma,phase:family.phase,phaseGradient,phaseChecks,normal:family.frame.n,normalSquared:family.frame.nSquared,
      originalAmplitude,originalPotential,raw,slowCutoff:slowCutoff.body,body,scale,normalCrossAmplitude,valueChecks,jets,
      physicalPotentialScale:G.exp(G.mul(G.sub(q(1,2),source.constants.A),G.log(source.geometry.Q))),realVectorMeaning:'Real coefficient C of i*C*exp(i*k*Phi).',thirdSlowRootsPerSign:60});
    progress(context,'third-full-potential-'+family.sign,G);
  }
  const frozenRoots=[source.geometry.ell,source.geometry.Q,source.geometry.epsilon,source.geometry.k,source.geometry.Ls,...slowCutoff.meshLabels,
    ...source.families.flatMap(f=>[f.carrier.p,f.carrier.pz,f.carrier.x0,f.P])];
  const checks=[
    {id:'private-actual-small-q-terminal-member',pass:source.decision.selectedSourceCovarianceDomainMember&&source.decision.actualPositiveWeightsOnDeclaredTerminalDomain},
    {id:'original-source-prefix-preserved',pass:sameArray(G.nodes.slice(0,sourceCount),source.G.nodes.slice(0,sourceCount))},
    {id:'two-actual-forty-component-systems',pass:pulses.every(p=>G.pulseThirdJetSystems[p.system].dimension===40&&sameArray(p.matrix,source.families.find(f=>f.sign===p.sign).frame.wMatrix))},
    {id:'original-full-w-roots-and-all-third-aliases',pass:pulses.every(p=>p.wJets.every((row,i)=>row.every((x,j)=>x===G.pulseThirdJetValue(p.system,2*i+j,v,G.pulseThirdJetSystems[p.system].parameters))))},
    {id:'original-fixed-left-and-constant-datum',pass:pulses.every(p=>sameArray(p.initial,[G.one,G.zero])&&p.augmentedInitial.slice(2).every(x=>x===G.zero))},
    {id:'frozen-label-endpoint-and-reference-envelope-slow-derivatives',pass:frozenRoots.every(root=>directions.every(axis=>!G.freeCoordinates(root).has(axis)&&G.derivative(root,axis)===G.zero))},
    {id:'genuine-M-alpha-and-time-FTC-integrands',pass:pulses.every(p=>p.bounds.matrixNorms.every((norm,i)=>norm.entries.every((row,r)=>row.every((e,c)=>e.originalExpression===p.matrixJet.matrices[i][r][c]&&e.originalTimeDerivative===G.derivative(e.originalExpression,v)&&e.actualBodyBinding&&e.actualTimeDerivativeBinding&&!G.freeCoordinates(e.upper).has(v)))))},
    {id:'all-moving-basis-and-amplitude-third-products',pass:pulses.every(p=>p.jets.length===20&&p.jets.every(j=>j.checks.every(c=>c.pass)))},
    {id:'all-complete-covariance-third-integrals',pass:covarianceChecks.length===80&&covarianceChecks.every(c=>c.pass&&c.integrandProductCheck.pass)},
    {id:'actual-target-inverse-and-positive-sqrt-third-chain',pass:inverse.checks.length===40&&inverse.pass&&squareRoots.every(p=>p.checks.length===19&&p.pass)},
    {id:'all-sixty-full-potential-roots-per-sign',pass:potentials.every(p=>p.jets.length===20&&p.jets.filter(r=>r.degree===3).length===10&&p.jets.every(r=>r.roots.length===3))},
    {id:'original-mesh-and-band-partition-third-jets',pass:slowCutoff.jet.roots.length===20&&slowCutoff.meshLabels.length===3&&slowCutoff.globalLabelSumConstructed===false},
    {id:'full-volterra-limits-and-nonzero-functional-tails',pass:pulses.every(p=>p.finite.tail!==G.zero&&p.finite.terms===request.terms&&p.finite.tailTendsToZero&&!p.finite.finiteSumIsExactSolution)}
  ];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual third-potential source check failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const roots={sourceEll:source.geometry.ell,sourceQ:source.geometry.Q,sourceH:matrix,sourceTarget:target,sourceWeights:source.target.weights,sourceSquareRoots:source.target.squareRootWeights,
    slowCutoff:slowCutoff.body,slowCutoffJets:slowCutoff.jet.roots,pulseSystems:pulses.map(p=>p.system),
    amplitudeJets:pulses.map(p=>p.amplitudeJets),HJets:inverse.matrixJet.matrices,targetJets:inverse.targetJets,weightJets:inverse.weightJets,squareRootJets:squareRoots.map(p=>p.roots),
    potentialJets:potentials.map(p=>p.jets.map(j=>j.roots)),phase:source.families.map(f=>f.phase),factorialTails:pulses.map(p=>p.finite.tail)};
  const domain={sourceDomain:source.quantitative.positivityDomain,restriction:'Open terminal chart with Xplus<X,Xrep<Xb, 1/2<s,srep<2, |eta|,|etaRep|<1, frozen representative and the same source slow box.',
    positiveWeights:'Consumed from the private actual selected small-q terminal certificate; no caller positivity assumption is substituted.',
    boundary:'At eta=+/-1 use inward finite jets only; no T<0 heat extension. This third-jet certificate is restricted to the open chart. Flat endpoints and cross-label gluing are separate.',
    norms:'Exact parameter-dependent FTC integral envelopes of actual M_alpha and B_alpha and their generated v derivatives. Initial and dummy-time substitutions use fully specified shares whose value and v derivative materialize to the original body. They are locally bounded on compact interior slow neighborhoods; no common all-band C4/Gaussian or numerical bound is inferred.',
    initial:'The original w(0)=(1,0), fixed left0, fixed Ls and frozen carrier/P are actually checked for slow independence.',
    originalSource:'The historical canonical c_n background is used. A separately strengthened a_n background is not silently identified with it.'};
  const scope={actualSelectedSmallQTerminalSource:true,actualFortyComponentPulseThirdJets:true,actualFullCovarianceTargetInverseThirdJets:true,actualPositiveSqrtThirdJets:true,
    actualSixtyPotentialRootsPerSign:true,originalMovingPressureAndFrameTermsRetained:true,originalSqrtEpsilonAndSlowCutoffRetained:true,actualFixedLeftAndLabelChecks:true,
    parameterDependentFTCAndLocalUniformConvergence:true,wholePotentialPhysicalSpaceTimeJetClaim:false,actualPhysicalSecondVelocityDerivativesConstructed:false,
    wholeGNUMComplete:false,commonGlobalHigherJetBound:false,allLabelSeriesControlled:false,globalPhysicalResidual:false,flatErrorPackageComplete:false,fullSameProfileN5:false,
    differentStrengthenedBackgroundSubstituted:false,newLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false};
  const sourceBinding={sourceProfile:source.sourceBinding.sourceProfile,parameterExpressionSHA256:source.sourceBinding.parameterExpressionSHA256,
    producer:'Private actual-admissible-terminal-covariance.mjs; new pulse jets alias those exact full solution roots.',
    sourceMember:'The original ellMinimum+8 terminal member, with its positive weight domain; no ell1 pulse is relabeled.',
    originalHAndTargetUnchanged:true,originalPositiveHParameterUnchanged:true,callerDerivativeBodiesAccepted:false,finiteSumUsedAsExactSolution:false};
  const result={G,source,request,coordinates,pulses,inverse,squareRoots,slowCutoff,potentials,roots,checks,domain,scope,sourceBinding,covarianceChecks};
  const packed=G.pack(roots,{schema:'MathScope.ActualTerminalPotentialThirdJetsProgram/1',compiler:'actual-terminal-potential-third-jets.mjs:prepareActualTerminalPotentialThirdJets',compilerInput:request,
    sourceBinding,checks,domain,scope,coordinates,pulses,inverse,squareRoots,slowCutoff,potentials,covarianceChecks}),{nodes,...rest}=packed,program={...structuredClone(rest),nodes:nodes.slice()};result.program=program;
  seals.set(result,{G,source,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covarianceCount:G.covarianceSystems.length,covariance:JSON.stringify(G.covarianceSystems),
    thirdCount:G.pulseThirdJetSystems.length,third:JSON.stringify(G.pulseThirdJetSystems),aliases:JSON.stringify([...G.pulseThirdJetAliases]),program,programNodes:program.nodes,metadata:metadata(program),serialized:canonicalStringify(program),data:publicData(result)});
  progress(context,'third-potential-program-sealed',G);return result;
}

export function assertActualTerminalPotentialThirdJets(p){
  const saved=seals.get(p);
  if(!saved||p.G!==saved.G||p.source!==saved.source||publicData(p)!==saved.data||p.program!==saved.program||p.program.nodes!==saved.programNodes||metadata(p.program)!==saved.metadata||
    JSON.stringify(p.program.nodes)!==saved.nodes||JSON.stringify(saved.G.nodes.slice(0,saved.count))!==saved.nodes||!saved.G.functionDefinitionsUnchanged(saved.definitions)||
    JSON.stringify(saved.G.covarianceSystems.slice(0,saved.covarianceCount))!==saved.covariance||JSON.stringify(saved.G.pulseThirdJetSystems.slice(0,saved.thirdCount))!==saved.third||
    JSON.stringify([...saved.G.pulseThirdJetAliases])!==saved.aliases)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private actual third-potential program; copies and edited roots, functions or systems have no source authority.');
  assertActualAdmissibleTerminalCovariance(saved.source);return true;
}
export async function actualTerminalPotentialThirdJetsCertificateFromProgram(p,context={}){
  assertActualTerminalPotentialThirdJets(p);const s=seals.get(p),graphSHA256=await sha256(s.serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualTerminalPotentialThirdJetsCertificate/1',status:'COMPLETED',pass:true,request:p.request,sourceBinding:p.sourceBinding,domain:p.domain,scope:p.scope,checks:p.checks,
    graph:{sha256:graphSHA256,nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:p.program.compiler,roots:p.roots,graphIncluded:false,fixedCompilerPrefix:true,laterAppendsExcluded:true},
    pulseRows:p.pulses.map(p=>({sign:p.sign,originalCovarianceSystem:p.originalCovarianceSystem,system:p.system,dimension:40,derivativeMultiIndexCount:20,
      matrixNorm:p.bounds.augmentedMatrixNorm,initialNorm:p.bounds.augmentedInitialNorm,tail:p.finite.tail,finiteTerms:p.finite.terms,sourceNormNumericallyEnclosed:false})),
    inverseChecks:p.inverse.checks,squareRootChecks:p.squareRoots.map(p=>p.checks),covarianceChecks:p.covarianceChecks,
    potentialRows:p.potentials.map(p=>({sign:p.sign,phase:p.phase,originalPotential:p.originalPotential,body:p.body,jets:p.jets,phaseChecks:p.phaseChecks,physicalPotentialScale:p.physicalPotentialScale}))};
}
