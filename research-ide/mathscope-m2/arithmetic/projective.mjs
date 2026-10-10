import {bigint,small,fail,mod,isqrt,valuation} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';
import {integerModel,classifyReduction} from '../../mathscope-m1/arithmetic/local-factors.mjs';
import {finiteField,ellipticPointCount} from './finite-fields.mjs';
import {mwFrobenius} from './mw-frobenius.mjs';
import {semilinearReconstruct} from './unramified-frobenius.mjs';
import {projectiveComparison,eulerTailCertificate,ellipticGlobalIdentity} from './geometric-comparisons.mjs';

export const polynomialProduct=(a,b)=>{const c=Array(a.length+b.length-1).fill(0n);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)c[i+j]+=a[i]*b[j];return c;};
const checkedPrime=p=>{const q=primeBase(p);if(q>257n)fail('UNSUPPORTED','The interactive arithmetic extension supports primes <= 257.');return q;};
const axis=(label,type)=>({label,type,unit:'dimensionless'});
const check=(name,pass,details={})=>({name,pass,...details});

export function projective(input={},tracker=null){
  const p=checkedPrime(input.p??3),n=small(input.n??2,'geometric dimension n',0,8),m=small(input.m??1,'field extension degree m',1,8),N=small(input.N??4,'p-adic digits N',1,64),q=p**BigInt(m);
  if(input.certifyEInfinity||input.nativePrismatic)fail('UNSUPPORTED','Cup products, E-infinity structure and a native prismatic-site computation require separate comparison certificates.');
  const cohomology=Array.from({length:2*n+1},(_,degree)=>({degree,rank:degree%2?0:1,generator:degree%2?null:`hyperplane^${degree/2}`,frobeniusEigenvalue:degree%2?null:String(p**BigInt(degree/2)),coefficientRing:`Z_${p}`,finiteResidue:degree%2?null:String(mod(p**BigInt(degree/2),p**BigInt(N)))}));
  const pointCount=Array.from({length:n+1},(_,i)=>q**BigInt(i)).reduce((a,b)=>a+b,0n);
  const determinants=Array.from({length:n+1},(_,i)=>({degree:2*i,coefficients:['1',String(-(p**BigInt(i)))],variable:'T'}));
  const denominator=determinants.reduce((a,f)=>polynomialProduct(a,f.coefficients.map(BigInt)),[1n]);
  // Affine-cell enumeration is separate from summing Frobenius eigenvalues.
  const cells=Array.from({length:n+1},(_,i)=>({firstNonzeroCoordinate:n-i,freeCoordinates:i,cardinality:String(q**BigInt(i)),normalization:'First nonzero projective coordinate equals 1.'}));
  const primes=(input.primes??[3,5,7]).map(checkedPrime);if(primes.length<1||primes.length>16||new Set(primes.map(String)).size!==primes.length)fail('INVALID_PRIME_LIST','Provide 1 to 16 distinct primes.');
  const localProducts=primes.map(prime=>({prime:String(prime),denominator:Array.from({length:n+1},(_,i)=>[1n,-(prime**BigInt(i))]).reduce(polynomialProduct,[1n]).map(String)}));
  const lhs=localProducts.reduce((a,f)=>polynomialProduct(a,f.denominator.map(BigInt)),[1n]);
  const rhs=Array.from({length:n+1},(_,i)=>primes.reduce((a,prime)=>polynomialProduct(a,[1n,-(prime**BigInt(i))]),[1n])).reduce(polynomialProduct,[1n]);
  const byPrime=primes.flatMap(prime=>Array.from({length:n+1},(_,i)=>({prime:String(prime),cohomologicalDegree:2*i,localVariable:`T_${prime}`,factor:['1',String(-(prime**BigInt(i)))]})));
  const byDegree=Array.from({length:n+1},(_,i)=>primes.map(prime=>({prime:String(prime),cohomologicalDegree:2*i,localVariable:`T_${prime}`,factor:['1',String(-(prime**BigInt(i)))]}))).flat();
  const factorKey=f=>`${f.prime}:${f.cohomologicalDegree}:${f.factor.join(',')}`;
  const symbolicFiniteIdentity=byPrime.map(factorKey).sort().join('|')===byDegree.map(factorKey).sort().join('|');
  tracker?.tick(cohomology.length+lhs.length*primes.length);
  return{
    object:{kind:'PROJECTIVE_COHOMOLOGY_COMPARISON_MODEL',family:'P^n',n,p:String(p),base:`F_${p}`,lift:`P^${n}/Z_${p}`},
    scope:{finite:true,n,m,N,symbolicSpecification:'All n in Nat; displayed fixture is n in [0,8].',comparison:'External projective-space/crystalline comparison theorem; no new kernel execution.',eInfinityCertified:false,nativePrismaticComplexComputed:false},
    finitePerfectComparison:projectiveComparison(p,n,N),
    cohomology,pointCount:String(pointCount),cells,localZeta:{numerator:['1'],denominator:denominator.map(String),determinants,variable:'T',coefficientOrder:'ascending'},
    globalIdentity:{finitePrimes:primes.map(String),formalVariable:'T in the common-variable polynomial regression; T_p for the actual place-indexed symbolic factor identity.',finiteProduct:{left:lhs.map(String),right:rhs.map(String),scope:'Common-variable regression only.'},placeIndexedIdentity:{byPrime,byDegree,identicalFactorMultisets:symbolicFiniteIdentity},arithmeticIdentity:'zeta(P^n_Z,s) = product(i=0..n) zeta(s-i)',eulerSubstitution:'For each prime p, substitute T_p=p^(-s) in its own local factor before forming the arithmetic Euler product.',convergenceDomain:`Re(s) > ${n+1}`,infiniteProductStatus:'PROVED_ABSOLUTE_CONVERGENCE_BOUND',convergenceCertificate:eulerTailCertificate({family:'projective',n,...input.convergence}),reference:{id:'C01/S07',locator:'Projective-space cohomology and trace/determinant formulas; blueprint pp.7,28,72'},isCompleteNumericalGlobalFunction:false},
    checks:[check('cohomological degrees are exactly 0 through 2n',cohomology.length===2*n+1),check('odd cohomology vanishes in the comparison model',cohomology.filter(x=>x.degree%2).every(x=>x.rank===0)),check('affine-cell count equals Frobenius trace at extension degree m',cells.reduce((s,c)=>s+BigInt(c.cardinality),0n)===pointCount),check('finite local-factor multiplication commutes with regrouping by cohomological degree',lhs.length===rhs.length&&lhs.every((x,i)=>x===rhs[i])),check('place-indexed symbolic factor identity retains a separate T_p for each prime',symbolicFiniteIdentity)],
    tables:[{title:'Cohomology and Frobenius',columns:['degree','rank','generator','frobeniusEigenvalue','finiteResidue'],rows:cohomology},{title:'Normalized projective cells',columns:['firstNonzeroCoordinate','freeCoordinates','cardinality'],rows:cells}],
    visualization:{points:cohomology.filter(x=>x.rank).map(x=>({pos:[x.degree,0,x.degree/2],label:`H^${x.degree}: F=${x.frobeniusEigenvalue}`,value:x})),lines:cohomology.filter(x=>x.rank&&x.degree<2*n).map(x=>({points:[[x.degree,0,x.degree/2],[x.degree+2,0,x.degree/2+1]],label:'Adjacent even cohomological degrees; layout only'})),axes:[axis('Cohomological degree','COHOMOLOGICAL_DEGREE'),axis('Tate generator index','CATEGORICAL'),axis('v_p of the Frobenius eigenvalue','PADIC_VALUATION')],description:`P^${n} over F_${p}: exact finite cohomology observation`,coordinateMeaning:'Degree, basis layout and valuation are typed arithmetic attributes. This is not an embedding of projective space into Euclidean 3-space.',lostInformation:['The displayed generator model does not include a computed cup-product or E-infinity certificate.','Screen distance is not p-adic or geometric distance.'],sourceFields:['cohomology.degree','cohomology.generator','cohomology.frobeniusEigenvalue']}
  };
}

export function traceSequence(a,p,count=4){a=bigint(a);p=bigint(p);count=small(count,'trace count',1,8);const S=[2n,a];for(let m=2;m<=count;m++)S.push(a*S[m-1]-p*S[m-2]);return Array.from({length:count},(_,i)=>({extensionDegree:i+1,trace:String(S[i+1]),count:String(p**BigInt(i+1)+1n-S[i+1])}));}
const fraction=(n,d)=>{if(d<0){n=-n;d=-d;}let a=Math.abs(n),b=d;while(b)[a,b]=[b,a%b];return{numerator:n/(a||1),denominator:d/(a||1)};};
export function newtonPolygon(coefficients,p){
  p=primeBase(p);const values=coefficients.map(x=>bigint(x));if(values.length<2||values.at(-1)===0n||values[0]===0n)fail('UNSUPPORTED','Newton polygons here require nonzero constant and leading coefficients.');
  const points=values.flatMap((value,i)=>value===0n?[]:[{degree:i,valuation:valuation(value,p),coefficient:String(value)}]),hull=[];
  for(const point of points){while(hull.length>=2){const a=hull.at(-2),b=hull.at(-1);if((b.degree-a.degree)*(point.valuation-b.valuation)-(b.valuation-a.valuation)*(point.degree-b.degree)>0)break;hull.pop();}hull.push(point);}
  const slopes=[];for(let i=1;i<hull.length;i++){const a=hull[i-1],b=hull[i],v=fraction(a.valuation-b.valuation,b.degree-a.degree);for(let j=a.degree;j<b.degree;j++)slopes.push(v);}
  slopes.sort((a,b)=>a.numerator*b.denominator-b.numerator*a.denominator);
  return{points,hull,rootValuations:slopes,normalization:'v_p(p)=1; root valuations are negatives of lower Newton-polygon slopes.',zeroCoefficients:'Omitted from the finite hull because v_p(0)=+infinity.'};
}

export function elliptic(input={},tracker=null){
  const p=checkedPrime(input.p??5),m=small(input.m??1,'extension degree m',1,4),a=bigint(input.a??-1,'a',256),b=bigint(input.b??0,'b',256),model=integerModel({model:'elliptic',a:String(a),b:String(b)}),reduction=classifyReduction(model,p);
  if(input.slopeMethod==='complexAngle')fail('INVALID_OBSERVATION','A complex eigenvalue angle does not determine a p-adic valuation.');
  if(input.backend==='mw'||input.backend==='kedlaya')return mwFrobenius(input,tracker);
  if(input.operation==='globalIdentity')return ellipticGlobalIdentity(input,tracker);
  if(reduction.status!=='GOOD')return{status:'UNSUPPORTED',object:{kind:'ELLIPTIC_REDUCTION_BOUNDARY',model,p:String(p)},reduction,scope:{finite:true},blockers:[reduction.status==='MINIMIZATION_REQUIRED'?'The displayed model requires a minimal-model computation before this smooth-crystalline route.':'This prime has bad reduction for the supported model; the smooth-crystalline path is closed.'],checks:[check('bad or nonminimal model is not admitted as a smooth crystalline fibre',true)],visualization:{points:[{pos:[Number(p),0,0],label:`p=${p}: ${reduction.status}`,value:reduction}],lines:[],axes:[axis('Prime place','PRIME_INDEX'),axis('Reduction status','CATEGORICAL')],description:'Reduction boundary',coordinateMeaning:'This is a finite arithmetic place and its model-admission status. No missing fibre is drawn as empty geometry.',lostInformation:[]}};
  const base=ellipticPointCount(finiteField(p,1,null,tracker),a,b,{fullPairs:true,tracker});
  const ap=p+1n-BigInt(base.count),N=small(input.N??4,'p-adic digits N',1,64),polynomial=[p,-ap,1n],polygon=newtonPolygon(polynomial,p),sequence=traceSequence(ap,p,small(input.maxExtension??Math.max(4,m),'maximum extension in recurrence',m,8));
  const field=finiteField(p,m,input.polynomial??null,tracker),oracle=m===1?base:ellipticPointCount(field,a,b,{fullPairs:input.fullPairs===true||field.q<=81,tracker});
  const expected=sequence[m-1].count;
  const checks=[...base.checks,...(m===1?[]:oracle.checks),check('Hasse bound a_p^2 <= 4p',ap*ap<=4n*p),check('extension-field enumeration agrees with the independent trace recurrence',oracle.count===expected),check('H1 retains dimension 2 for ordinary and supersingular cases',polygon.rootValuations.length===2)];
  const rootReal=Number(ap)/2,rootImag=Math.sqrt(Number(4n*p-ap*ap))/2;
  const H1Factor=['1',String(-ap),String(p)],denominator=['1',String(-1n-p),String(p)];
  const result={
    object:{kind:'ELLIPTIC_POINT_COUNT_AND_LOCAL_ZETA',model,p:String(p)},reduction,scope:{finite:true,p:String(p),extensionDegree:m,geometricDimension:1,N,computedIntegralPrismaticComplex:false,computedMWMatrix:false},
    primeField:base,extensionField:oracle,aP:String(ap),characteristicPolynomial:{coefficients:polynomial.map(String),coefficientOrder:'ascending in X',source:'Exact point count and the good-reduction trace/determinant theorem; not a computed p-adic matrix.'},newton:polygon,hodge:{H1Dimension:2,hodgeNumbers:{h10:1,h01:1},hodgeDegrees:[0,1]},complexRoots:{values:[[rootReal,rootImag],[rootReal,-rootImag]],modulus:Math.sqrt(Number(p)),status:'FLOAT64_DISPLAY_ONLY',meaning:'Complex Weil eigenvalues; not p-adic coordinates.'},traceSequence:sequence,
    localZeta:{scheme:{numerator:H1Factor,denominator,formula:'(1-a_p*T+p*T^2)/((1-T)*(1-p*T))'},ellipticL:{numerator:['1'],denominator:H1Factor,formula:'1/(1-a_p*T+p*T^2)'},variable:'T',substitution:'T=p^(-s)',completeGlobalLFunction:false},
    checks,tables:[{title:'Finite-field points',columns:['x','y','xCoefficients','yCoefficients'],rows:oracle.affinePoints},{title:'Extension trace recurrence',columns:['extensionDegree','trace','count'],rows:sequence},{title:'Newton slopes',columns:['numerator','denominator'],rows:polygon.rootValuations}],
    visualization:{points:oracle.affinePoints.map(point=>({pos:[Number(point.x),Number(point.y),m],label:`(${point.x},${point.y}) in F_${field.q}`,value:point})),lines:[],axes:[axis('x: field element code','FINITE_FIELD_RESIDUE_CODE'),axis('y: field element code','FINITE_FIELD_RESIDUE_CODE'),axis('Extension degree m','FIELD_EXTENSION_DEGREE')],description:`E(F_${field.q}), #E=${oracle.count}; one projective point at infinity is recorded separately`,coordinateMeaning:'Encoded finite-field elements are categorical arithmetic coordinates. Lines, Euclidean distances and an apparent curve shape carry no finite-field topology claim.',lostInformation:oracle.displaySampled?['Only a declared display sample is plotted; the exact full count is retained.']:[],sourceFields:['extensionField.affinePoints','extensionField.field'],panels:[{kind:'NEWTON_POLYGON',axes:['coefficient degree','p-adic valuation'],points:polygon.points,lines:polygon.hull},{kind:'HODGE_DEGREES',values:[0,1]},{kind:'COMPLEX_EIGENVALUES',values:[[rootReal,rootImag],[rootReal,-rootImag]],grade:'FLOAT64_DISPLAY_ONLY'}]}
  };
  return result;
}

export function reconstruct(input={},tracker=null){
  if(input.matrix!==undefined||Number(input.extensionBaseDegree??1)>1)return semilinearReconstruct(input,tracker);
  const p=checkedPrime(input.p??5),N=small(input.N??4,'p-adic digits N',1,64),extensionBaseDegree=small(input.extensionBaseDegree??1,'base field extension degree',1,8);
  if(extensionBaseDegree!==1)fail('UNSUPPORTED','Semilinear Frobenius iteration over an extension coefficient ring requires a certified coefficient-Frobenius backend; a plain matrix power is not substituted.');
  const residues=input.residues??['5','2','1'],bounds=input.bounds??['5','4','1'];if(!Array.isArray(residues)||!Array.isArray(bounds)||residues.length!==bounds.length||residues.length<1||residues.length>17)fail('INVALID_RECONSTRUCTION','Provide matching coefficient-residue and certified-bound lists.');
  const modulus=p**BigInt(N),rows=residues.map((value,i)=>{const residue=mod(bigint(value),modulus),bound=bigint(bounds[i]);if(bound<0n)fail('INVALID_BOUND','Coefficient bounds must be nonnegative.');const unique=modulus>2n*bound,centered=residue>modulus/2n?residue-modulus:residue,inBound=centered>=-bound&&centered<=bound;return{coefficientDegree:i,residue:String(residue),bound:String(bound),modulus:String(modulus),uniqueByBound:unique,inBound,integer:unique&&inBound?String(centered):null,status:!unique?'AMBIGUOUS':inBound?'UNIQUE_WITH_DECLARED_BOUND':'INCONSISTENT_BOUND'};});
  const consistent=rows.every(x=>x.inBound||!x.uniqueByBound),unique=consistent&&rows.every(x=>x.uniqueByBound),checks=rows.map(row=>check(`coefficient ${row.coefficientDegree}: residue congruence and unique bound`,row.uniqueByBound&&row.inBound,{status:row.status}));
  return{status:!consistent?'FAILED':unique?'COMPLETED':'PRECISION_REQUIRED',object:{kind:'BOUNDED_INTEGER_RESIDUE_RECONSTRUCTION',p:String(p)},scope:{finite:true,N,boundProvenance:input.boundProvenance??'USER_DECLARED_BOUNDS',computedFrobeniusMatrix:false},rows,coefficients:unique?rows.map(x=>x.integer):null,checks,blockers:unique?[]:[consistent?'Increase N until p^N > 2*B for every coefficient.':'A residue has no representative within its declared bound.'],tables:[{title:'Coefficient reconstruction',columns:['coefficientDegree','residue','bound','modulus','integer','status'],rows}],visualization:{points:rows.map(row=>({pos:[row.coefficientDegree,Number(row.uniqueByBound),row.inBound?1:0],label:`coefficient ${row.coefficientDegree}: ${row.status}`,value:row})),lines:[],axes:[axis('Coefficient degree','POLYNOMIAL_DEGREE'),axis('Uniqueness condition satisfied','BOOLEAN'),axis('Centered lift satisfies bound','BOOLEAN')],description:'Exact residue reconstruction conditions',coordinateMeaning:'The scene shows coefficient admission states. Exact potentially large integers remain in the table; screen coordinates never replace them.',lostInformation:[]}};
}
