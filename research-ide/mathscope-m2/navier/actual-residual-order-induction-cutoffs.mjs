/** The normalized (5.46) selector consumes actual coefficient norm bodies.
 * Enormous cutoff scales are exact positive expressions. No logarithm or
 * source exponent is evaluated with a floating-point underflow to zero.
 */
import {assertActualInductionNorms,attachActualInductionNorms} from './actual-residual-order-induction-norms.mjs';
import {assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {sourceNormalizedCutoffWeights} from './actual-residual-order-induction-kernels.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const sealed=new WeakMap();
export function attachActualNormalizedCutoffs(norms,context={}){
  assertActualInductionNorms(norms);
  if(norms.derivativeOrder<norms.order)fail('INVALID_INPUT','An order-n diagonal cutoff must consume every actual mixed profile norm through n.');
  const G=norms.G,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),log2=G.log(q(2)),rows=[];let previous=G.zero;
  for(let n=1;n<=norms.order;n++){
    context.checkCancelled?.();const normalized=norms.normalized[n-1],weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder:n},context);
    const polynomial=c=>G.add(...c.map((s,k)=>G.mul(q(BigInt(s)),G.pow(h,k))));
    const W=weights.weights.map(r=>polynomial(r.polynomialInSourceH)),Wp=weights.weights.map(r=>polynomial(r.extraPotentialCutoffPolynomialInSourceH));
    const jet=(name,r,m)=>{const j=normalized.jets[name].find(j=>j.radialOrder===r&&j.etaOrder===m);if(!j)fail('INVALID_SOURCE_CONSTRUCTION','The actual normalized coefficient jet is missing.');return j.upper;};
    const coefficientBounds=[];
    for(let m=0;m<=n;m++){
      const terms=[];
      for(let e=0;e<=m;e++)for(let r=0;r+e<=m;r++)for(let s=0;s+r+e<=m;s++){
        for(const name of ['E','U','Pi','StreamOverR'])terms.push({field:name,eulerOrder:e,radialOrder:r,etaOrder:s,upper:G.mul(W[e],jet(name,r,s))});
        terms.push({field:'complete radial cutoff bracket / R',eulerOrder:e,radialOrder:r,etaOrder:s,
          upper:G.add(G.mul(W[e],jet('VOverR',r,s)),G.mul(Wp[e],jet('ExtraStream',r,s)))});
      }
      const bound=G.maximum(G.one,...terms.map(t=>t.upper)),requiredLog=G.div(G.add(G.mul(q(n),log2),G.log(bound)),G.mul(q(n),h));
      coefficientBounds.push({derivativeOrder:m,bound,requiredLog,terms});
    }
    const doubling=G.add(previous,log2),logScale=G.maximum(doubling,...coefficientBounds.map(r=>r.requiredLog)),scale=G.exp(logScale);
    rows.push({order:n,previousLogScale:previous,doubling,logScale,scale,coefficientBounds,
      sourceCoefficientRoots:normalized.actualSourceRoots,sourceNormRows:norms.normalized[n-1],
      originalPositiveExponent:G.mul(q(n),h),logProof:'log c_n >= (n log2+log B_nm)/(n h), hence B_nm q^(n h)<=2^-n for 0<q<=1/c_n. All cutoff derivatives vanish for q>=1/c_n.',
      originalSourceHRetained:true,extraStokesStreamDerivativeIncluded:true});previous=logScale;
  }
  const roots={};for(const r of rows){roots['log_c_'+r.order]=r.logScale;roots['c_'+r.order]=r.scale;for(const b of r.coefficientBounds)roots['B_'+r.order+'_'+b.derivativeOrder]=b.bound;}
  const result={G,norms,rows,roots,order:norms.order};
  result.program=G.pack(roots,{schema:'MathScope.ActualNormalizedCutoffPrefix/1',order:norms.order,rows,
    originalSelector:'The profile-normalized velocity/pressure clauses of (5.40),(5.45),(5.46). The physical residual and weighted-stress clauses are distinct obligations until their norm bodies are also attached.',
    localFiniteness:{exactGeometricLower:'c_n>=2^n',forAnyPositiveQ:'If n>=ceil(log2(1/q))+1 then c_n*q>1, so every corresponding cutoff derivative is zero.',
      finitePrefixDoesNotMeanAllActiveTermsShown:true,resourceLimitCannotBeReportedAsCompleteActivePrefix:true},
    scope:{actualProfileNormalizedSelectorComputed:true,callerSuppliedCoefficientBound:false,actualFinitePrefix:norms.order,
      weightedStressSelectorComputed:false,physicalResidualSelectorComputed:false,completeOriginalBackgroundCutoffSequence:false,
      wholeAnnulusCompletedBackgroundCertified:false,originalN506Complete:false,formalKernelProof:false}});
  sealed.set(result,{G,norms,nodeCount:G.nodes.length,prefix:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),rows:JSON.stringify(rows),order:result.order,canonical:false});return result;
}

/** The canonical sequence is PREFIX INDEPENDENT. In particular c_1 is
 * not silently changed when a later request asks for n=4 or a larger jet.
 * The n-th diagonal norm recipe always uses (throughOrder,derivativeOrder)
 * =(n,n), and only these internally generated norms select c_n.
 */
export function attachActualCanonicalCutoffs(prepared,context={}){
  assertActualOrderInduction(prepared);const {G,order}=prepared,q=(n,d=1)=>G.q(n,d),rows=[],normPrefixes=[],log2=G.log(q(2));let previous=G.zero;
  for(let n=1;n<=order;n++){
    context.checkCancelled?.();
    const norms=attachActualInductionNorms(prepared,{throughOrder:n,derivativeOrder:n},context),temporary=attachActualNormalizedCutoffs(norms,context),source=temporary.rows[n-1],doubling=G.add(previous,log2),logScale=G.maximum(doubling,...source.coefficientBounds.map(b=>b.requiredLog)),scale=G.exp(logScale);
    const row={...source,previousLogScale:previous,doubling,logScale,scale,canonicalNormRequest:{throughOrder:n,derivativeOrder:n},selectedByLaterPrefix:false};
    rows.push(row);normPrefixes.push(norms);previous=logScale;
  }
  const roots={};for(const r of rows){roots['canonical_log_c_'+r.order]=r.logScale;roots['canonical_c_'+r.order]=r.scale;}
  const result={G,prepared,norms:normPrefixes.at(-1),normPrefixes,rows,roots,order,canonical:true};
  result.program=G.pack(roots,{schema:'MathScope.ActualCanonicalNormalizedCutoffs/1',order,rows,
    definition:{coefficientRecipe:'prepareActualOrderInduction through n',diagonalNormRecipe:'attachActualInductionNorms with throughOrder=n and derivativeOrder=n',
      logRecurrence:'log c_n=max(log c_(n-1)+log2, max_(0<=m<=n) (n log2+log B_nm)/(n h))',logC0:'0',prefixIndependent:true,
      laterAdditionalOriginalClauses:'Enlarging any c_n, while preserving the same monotone doubling recurrence, preserves every normalized estimate, potential identity, and tail below. Such an enlargement is not claimed to have been computed here.'},
    localFiniteness:{exactGeometricLower:'c_n>=2^n',missingTerms:'A prefix is a complete active family only after the exact query lower bound proves all later n inactive.',
      resourceLimitIsNotCompletion:true},
    scope:{canonicalActualNormalizedSequence:true,actualFinitePrefix:order,actualSourceCoefficients:true,
      allOrderNormAndCoefficientRecipeExecutable:true,wholeAnnulusC2BoundAttached:false,weightedStressSelectorComputed:false,physicalResidualSelectorComputed:false,
      fullOriginalProposition55Certified:false,originalN506Complete:false,formalKernelProof:false}});
  sealed.set(result,{G,norms:result.norms,normPrefixes,nodeCount:G.nodes.length,prefix:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),rows:JSON.stringify(rows),order,canonical:true});return result;
}

export function assertActualNormalizedCutoffs(result){const r=sealed.get(result);if(!r||r.G!==result.G||r.norms!==result.norms||JSON.stringify(r.G.nodes.slice(0,r.nodeCount))!==r.prefix||!r.G.functionDefinitionsUnchanged(r.definitions)||JSON.stringify(result.rows)!==r.rows||r.order!==result.order||Boolean(result.canonical)!==r.canonical||r.canonical&&(result.normPrefixes!==r.normPrefixes||r.normPrefixes.length!==r.order))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally selected actual cutoffs.');for(const n of r.normPrefixes??[r.norms])assertActualInductionNorms(n);return true;}

/** Explicit finite-block constants needed by (5.42). The tail uses the
 * diagonal induction inequality; orders below the derivative order remain
 * finite actual source norms. In particular n=2 is never discarded while
 * improving a claimed power from q^(2h) to q^(3h).
 */
export function actualNormalizedFiniteBlock(cutoffs,{derivativeOrder=2}={},context={}){
  assertActualNormalizedCutoffs(cutoffs);const {G}=cutoffs,norms=cutoffs.canonical?cutoffs.normPrefixes[Math.max(2,derivativeOrder)-1]:cutoffs.norms,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),J=Math.max(3,derivativeOrder);
  if(!norms)fail('RESOURCE_LIMIT','The actual finite block requires its own canonical derivative prefix.');
  if(!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>norms.derivativeOrder||norms.order<J-1)fail('RESOURCE_LIMIT','Generate every finite-block coefficient and requested derivative before asserting a tail comparison.');
  const finite=[];
  for(let n=1;n<J;n++){
    const jets=norms.normalized[n-1].jets,weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder},context),W=weights.weights.map(r=>G.add(...r.polynomialInSourceH.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k))))),Wp=weights.weights.map(r=>G.add(...r.extraPotentialCutoffPolynomialInSourceH.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k))))),terms=[];
    for(let e=0;e<=derivativeOrder;e++)for(let r=0;r+e<=derivativeOrder;r++)for(let s=0;s+r+e<=derivativeOrder;s++){
      const get=name=>jets[name].find(j=>j.radialOrder===r&&j.etaOrder===s)?.upper;
      for(const name of ['E','U','Pi','StreamOverR'])terms.push(G.mul(W[e],get(name)));
      terms.push(G.add(G.mul(W[e],get('VOverR')),G.mul(Wp[e],get('ExtraStream'))));
    }
    finite.push({order:n,bound:G.maximum(G.one,...terms),originalPower:G.mul(q(2*n),h)});
  }
  const tailConstant=q(1,1n<<BigInt(J-1)),coefficient=G.add(...finite.map(r=>r.bound),tailConstant),radialEulerFactor=G.pow(G.add(G.one,h),derivativeOrder);
  return {schema:'MathScope.ActualNormalizedFiniteBlock/1',derivativeOrder,tailStarts:J,finite,tailConstant,coefficient,
    tangentialAxialBound:{coefficient,power:G.mul(q(2),h),statement:'All requested normalized E/U/profile radial-bracket derivatives are <=coefficient*q^(2h), for0<q<=1, once the all-order diagonal induction has been established.'},
    physicalRadialNormalizedBound:{coefficient:G.mul(radialEulerFactor,coefficient),power:G.mul(q(3),h),
      derivation:'The original q^A radial component equals q^h times the profile radial bracket/R. Leibniz adds at most(1+h)^m. The finite n=1 and n=2 terms retain their actual q^(2nh) powers.'},
    tailProof:'sum_(n>=J)2^-n*q^(nh)<=2^(1-J)*q^(Jh); J>=3 and0<q<=1. The finitely many n<J are evaluated with their actual B_nm, even when m>n.',
    scope:{actualFiniteBlockComputed:true,finiteN2Retained:true,conditionalOnlyOnActualUnboundedInduction:true,
      unboundedDiagonalInductionCertified:false,fullBackgroundC2Certificate:false,sourceUniformQStarCertified:false}};
}
