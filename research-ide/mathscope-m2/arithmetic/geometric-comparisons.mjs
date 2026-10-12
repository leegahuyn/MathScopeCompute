import {bigint,small,fail,mod,gcd,canonical} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase,crystallinePrism,validatePrismBase} from '../../mathscope-m1/arithmetic/padic.mjs';
import {rat,radd,rmul,rsub,rdiv,rjson} from './rational.mjs';
import {finiteField,ellipticPointCount} from './finite-fields.mjs';

export function projectiveComparison(p,n,N=4){
  p=primeBase(p);n=small(n,'projective display dimension',0,8);N=small(N,'p-adic digits',1,64);
  const base=crystallinePrism(p);if(!validatePrismBase(base).pass)fail('INVALID_PRISM','Crystalline base admission failed.');
  const terms=Array.from({length:2*n+1},(_,degree)=>({degree,rank:degree%2?0:1,basis:degree%2?[]:[`e_${degree/2}`],differentialToNext:'zero',frobenius:degree%2?[]:[[String(p**BigInt(degree/2))]]}));
  return{schema:'MathScope.ProjectiveFinitePerfectComparison/1',base,geometry:{family:'P^n',n,baseRing:'Z_p',specialFiber:`P^${n}/F_${p}`,lift:`P^${n}/Z_${p}`,cover:Array.from({length:n+1},(_,i)=>`U_${i}=D_+(X_${i}) ~= A^${n}`),smooth:true,proper:true},
    specification:{dimension:'every n in Nat',displayDimension:[0,8],nZero:'The point with identity comparison',allNTheorem:'Stacks tags 0FMJ, 0FUN; rank of the trivial projective bundle is n+1'},
    finitePerfectComplex:{coefficientRing:'Z_p',terms,formula:'direct sum(i=0..n) Z_p[-2i]',KFlatReason:'Bounded complex of finite free modules',derivedReduction:{N,coefficientRing:`Z/${p}^${N}`,modulus:String(p**BigInt(N)),terms:terms.map(t=>({...t,frobenius:t.frobenius.map(row=>row.map(x=>String(mod(BigInt(x),p**BigInt(N)))))}))}},
    comparisonMap:{from:'direct sum(i=0..n) Z_p[-2i]',to:'R Gamma_dR(P^n_Z_p/Z_p)',generatorImages:terms.filter(t=>t.rank).map(t=>({generator:t.basis[0],degree:t.degree,image:`c1_dR(O(1))^${t.degree/2}`})),quasiIsomorphismSource:{url:'https://stacks.math.columbia.edu/tag/0FUN',locator:'Remark 50.14.2; Lemma 50.11.4 (0FMJ)',grade:'APPLIED_EXTERNAL_THEOREM',localKernelCheck:false},frobeniusCompatibility:{geometricLift:'[X_0:...:X_n] -> [X_0^p:...:X_n^p]',lineBundlePullback:'F^* O(1) = O(p)',chernClass:'c1(O(p)) = p c1(O(1))',therefore:'F(e_i)=p^i e_i',coefficientFrobenius:'identity on Z_p'}},
    arrows:[{from:'completed de Rham hypercohomology of the proper smooth lift',to:'crystalline cohomology of P^n/F_p over Z_p',source:'S02 Theorem 3.6 and Corollary 3.8',url:'https://arxiv.org/abs/1110.5001',grade:'APPLIED_EXTERNAL_THEOREM'},{from:'crystalline cohomology',to:'prismatic cohomology completed-base-changed along phi_Z_p=id',source:'S01 Theorem 1.8(1)',url:'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf',grade:'APPLIED_EXTERNAL_THEOREM'}],
    moduleComparison:true,multiplicativeEInfinityCertificate:false,nativePrismaticSiteComputed:false,formalComplete:false,localKernelCheck:false};
}

function integerRoot(n,r){if(n<2n)return n;let lo=0n,hi=1n;while(hi**BigInt(r)<=n)hi*=2n;while(hi-lo>1n){const mid=(hi+lo)/2n;if(mid**BigInt(r)<=n)lo=mid;else hi=mid;}return lo;}
function inversePowerUpper(x,numerator,denominator){
  const scale=10n**12n,power=BigInt(numerator),degree=Number(denominator),a=scale**BigInt(degree),b=BigInt(x)**power,q=integerRoot(a/b,degree),ceiling=q**BigInt(degree)*b===a?q:q+1n;
  return rat(ceiling,scale);
}
export function eulerTailCertificate({family='projective',n=1,realPartNumerator=null,realPartDenominator=1,cutoff=100}={}){
  n=small(n,'projective dimension',0,8);const boundary=family==='projective'?n+1:2;
  const den=small(realPartDenominator,'half-plane denominator',1,16),num=small(realPartNumerator??(boundary+1)*den,'half-plane numerator',1,512),L=small(cutoff,'Euler tail cutoff',2,1000000);
  const deltaNum=num-boundary*den;if(deltaNum<=0)fail('DIVERGENT_EULER_DOMAIN',`Absolute Euler-product convergence requires Re(s) > ${boundary}.`);
  const d=gcd(BigInt(deltaNum),BigInt(den)),deltaN=BigInt(deltaNum)/d,deltaD=BigInt(den)/d,alphaN=deltaN+deltaD;
  const rhoUpper=inversePowerUpper(2,alphaN,deltaD),powerUpper=inversePowerUpper(L,deltaN,deltaD),count=family==='projective'?n+1:4;
  const bound=rdiv(rmul(BigInt(count),powerUpper),rmul(rsub(1n,rhoUpper),rat(deltaN,deltaD)));
  return{schema:'MathScope.AbsoluteEulerTailBound/1',family,domain:`Re(s)>${boundary}`,uniformHalfPlane:{numerator:String(num),denominator:String(den)},cutoff:L,
    logTailAbsoluteUpperBound:rjson(bound),delta:rjson(rat(deltaN,deltaD)),rhoUpper:rjson(rhoUpper),cutoffPowerUpper:rjson(powerUpper),coefficientCount:count,
    argument:['For |z|<1, the power series for -log(1-z) is bounded in absolute value by |z|/(1-|z|).',`Each local factor is bounded by ${count} times p^(-1-delta)/(1-2^(-1-delta)).`,'Primes greater than L form a subset of the integers greater than L.','The decreasing-function integral bounds sum_(m>L) m^(-1-delta) by L^(-delta)/delta.','The bound tends to zero as L tends to infinity, uniformly on the declared closed right half-plane.'],
    numericalMethod:'EXACT_RATIONAL_UPPER_BOUNDS_USING_INTEGER_ROOTS',sourceDependencies:family==='projective'?['Exact projective Tate local factors','Elementary absolutely convergent logarithm series and integral test']:['S07 Weil bounds for H1 of a good elliptic curve','Elementary absolutely convergent logarithm series and integral test'],
    analyticallyConvergent:true,meromorphicContinuationComputed:false,fullInfiniteProductNumericallyEvaluated:false,RHOrBSDClaim:false,formalComplete:false};
}

export function ellipticGlobalIdentity(input={},tracker=null){
  const a=bigint(input.a??-1),b=bigint(input.b??0),disc=-16n*(4n*a*a*a+27n*b*b);
  if(disc===0n)fail('SINGULAR_CURVE','The global good model must be nonsingular.');
  const S=(input.excludedPrimes??[2]).map(primeBase),primes=(input.primes??[3,5,7]).map(primeBase);
  if(S.length>32||primes.length<1||primes.length>16||new Set(S.map(String)).size!==S.length||new Set(primes.map(String)).size!==primes.length)fail('INVALID_PRIME_LIST','Use finite distinct place lists.');
  let leftover=disc<0n?-disc:disc;for(const p of S)while(leftover%p===0n)leftover/=p;
  if(leftover!==1n)fail('UNVERIFIED_GOOD_MODEL','The excluded-prime set must contain every divisor of this integral model discriminant.',{remainingDiscriminantFactor:String(leftover)});
  const localFactors=primes.map(p=>{if(S.includes(p))fail('BAD_PRIME_IN_GOOD_PRODUCT','An excluded prime cannot enter the good-place Euler product.');const oracle=ellipticPointCount(finiteField(p),a,b,{fullPairs:true,tracker}),ap=p+1n-BigInt(oracle.count);if(ap*ap>4n*p)fail('INTERNAL_CERTIFICATE','The good elliptic point oracle violated the Hasse bound.');return{p:String(p),variable:`T_${p}`,pointCount:oracle.count,aP:String(ap),zetaNumerator:['1',String(-ap),String(p)],zetaDenominatorFactors:[['1','-1'],['1',String(-p)]],ellipticLDenominator:['1',String(-ap),String(p)],finiteIdentityVerified:true};});
  const model={a:String(a),b:String(b),discriminant:String(disc),base:`Z[1/${S.join('*')||1}]`,excludedPrimes:S.map(String),smoothProperOutsideS:true};
  const rows=localFactors.map(f=>({prime:f.p,pointCount:f.pointCount,aP:f.aP,numerator:f.zetaNumerator.join(','),localVariable:f.variable}));
  return{object:{kind:'ELLIPTIC_GOOD_GLOBAL_EULER_IDENTITY',model},scope:{finite:true,finitePrimes:primes.map(String),wholeEulerIdentityProvedByLocalFactorsAndAbsoluteConvergence:true,fullInfiniteProductNumericallyEvaluated:false},checks:localFactors.map(f=>({name:`p=${f.p}: exact local zeta/L quotient identity`,pass:f.finiteIdentityVerified})),tables:[{title:'Good-place local factors',columns:['prime','pointCount','aP','numerator','localVariable'],rows}],visualization:{points:rows.map(r=>({pos:[Number(r.prime),Number(r.aP),Number(r.pointCount)],label:`p=${r.prime}: #E=${r.pointCount}`,value:r})),lines:[],axes:[{label:'Prime',type:'PRIME_INDEX'},{label:'Frobenius trace',type:'INTEGER_COEFFICIENT'},{label:'Point count',type:'CARDINALITY'}],description:'Exact good-place Euler factors and a proved absolute-convergence tail bound',coordinateMeaning:'Prime-local exact data; an infinite Euler product is justified by its analytic bound, not by screen interpolation.',lostInformation:['The screen does not numerically evaluate the full infinite product.'],sourceFields:['localFactors','convergence']},family:'ELLIPTIC_GOOD_MODEL',model:{a:String(a),b:String(b),discriminant:String(disc),base:`Z[1/${S.join('*')||1}]`,excludedPrimes:S.map(String),smoothProperOutsideS:true},localFactors,
    finiteIdentity:'product_(p in P) Z(E/F_p,T_p) = product_(p in P) (1-T_p)^-1 (1-p*T_p)^-1 / product_(p in P) L_p(E,T_p)',placeVariablesRemainDistinct:true,
    infiniteIdentity:'zeta(E over Z[1/S],s)=zeta^S(s) zeta^S(s-1) / L^S(E,s)',convergence:eulerTailCertificate({...input,family:'elliptic'}),grade:'EXACT_FINITE_IDENTITY_WITH_EXPLICIT_ABSOLUTE_CONVERGENCE_BOUND',formalComplete:false};
}

export function verifyProjectiveComparison(data){try{const expected=projectiveComparison(data.geometry.baseRing==='Z_p'?data.base.p:0,data.geometry.n,data.finitePerfectComplex.derivedReduction.terms?data.finitePerfectComplex.derivedReduction.N:4);return{pass:canonical(expected)===canonical(data),formalComplete:false};}catch(e){return{pass:false,reason:e.message};}}
