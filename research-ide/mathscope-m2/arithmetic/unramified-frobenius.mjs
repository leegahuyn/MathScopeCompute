// Unramified Z/p^N coefficient rings with a Hensel-lifted coefficient Frobenius.
// A plain pth-power map is not a ring endomorphism in mixed characteristic.
import {bigint,small,fail,mod,canonical} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';
import {finiteField} from './finite-fields.mjs';

export function unramifiedRing({p=3,N=4,degree=2,polynomial=null}={},tracker=null){
  p=primeBase(p);N=small(N,'coefficient digits',1,32);degree=small(degree,'unramified degree',1,4);
  const field=finiteField(p,degree,polynomial,tracker),modulus=p**BigInt(N);
  const f=degree===1?[0n,1n]:(polynomial??field.polynomial).map(x=>bigint(x));
  if(f.length!==degree+1||f.at(-1)!==1n)fail('INVALID_UNRAMIFIED_RING','Use the monic lift of the declared irreducible residue polynomial.');
  const zero=()=>Array(degree).fill(0n),one=()=>[1n,...Array(degree-1).fill(0n)];
  const element=value=>{
    if(!Array.isArray(value))return[mod(bigint(value),modulus),...Array(degree-1).fill(0n)];
    if(value.length>degree)fail('INVALID_COEFFICIENT','An unramified coefficient exceeds the declared power basis.');
    return Array.from({length:degree},(_,i)=>mod(bigint(value[i]??0),modulus));
  };
  const add=(a,b)=>a.map((x,i)=>mod(x+b[i],modulus)),neg=a=>a.map(x=>mod(-x,modulus)),sub=(a,b)=>add(a,neg(b));
  const mul=(a,b)=>{
    const c=Array(2*degree-1).fill(0n);
    for(let i=0;i<degree;i++)for(let j=0;j<degree;j++){tracker?.tick();c[i+j]+=a[i]*b[j];}
    for(let k=c.length-1;k>=degree;k--)for(let j=0;j<degree;j++)c[k-degree+j]-=c[k]*f[j];
    return c.slice(0,degree).map(x=>mod(x,modulus));
  };
  const pow=(a,n)=>{n=bigint(n);let result=one();while(n){if(n&1n)result=mul(result,a);n>>=1n;if(n)a=mul(a,a);}return result;};
  const equal=(a,b)=>a.every((x,i)=>x===b[i]),isZero=a=>a.every(x=>x===0n);
  const inv=a=>{
    if(a.every(x=>x%p===0n))fail('NONUNIT_DIVISION','Unramified inverse requires a nonzero residue-field image.');
    let b=pow(a,BigInt(field.q)-2n);
    for(let digits=1;digits<N;digits*=2)b=mul(b,sub(element(2n),mul(a,b)));
    if(!equal(mul(a,b),one()))fail('INTERNAL_CERTIFICATE','Unramified inverse Hensel lift failed.');
    return b;
  };
  const evaluate=(coefficients,x)=>{let y=zero();for(let i=coefficients.length-1;i>=0;i--)y=add(mul(y,x),element(coefficients[i]));return y;};
  const generator=degree===1?zero():element([0n,1n]);let sigmaGenerator=degree===1?zero():pow(generator,p);
  const derivative=f.slice(1).map((x,i)=>x*BigInt(i+1));
  if(degree>1)for(let digits=1;digits<N;digits*=2)sigmaGenerator=sub(sigmaGenerator,mul(evaluate(f,sigmaGenerator),inv(evaluate(derivative,sigmaGenerator))));
  const sigma=a=>{let y=zero();for(let i=degree-1;i>=0;i--)y=add(mul(y,sigmaGenerator),element(a[i]));return y;};
  let iterated=generator;for(let i=0;i<degree;i++)iterated=sigma(iterated);
  if(!isZero(evaluate(f,sigmaGenerator))||!equal(iterated,generator))fail('INTERNAL_CERTIFICATE','The lifted coefficient Frobenius has the wrong defining relation or order.');
  return{p,N,degree,modulus,field,f,zero,one,element,add,neg,sub,mul,pow,inv,equal,isZero,sigma,generator,sigmaGenerator,
    serialize:a=>a.map(String),descriptor:{kind:'UNRAMIFIED_FINITE_P_POWER_RING',p:String(p),N,degree,modulus:String(modulus),polynomial:f.map(String),basis:Array.from({length:degree},(_,i)=>`z^${i}`),sigmaGenerator:sigmaGenerator.map(String),sigmaMethod:'UNIQUE_HENSEL_ROOT_OF_F_CONGRUENT_TO_Z_POWER_P',sigmaOrder:degree}};
}

export function matrixMultiply(A,B,ring){
  if(!A.length||A[0].length!==B.length)fail('MATRIX_SHAPE','Frobenius matrix dimensions do not compose.');
  return A.map(row=>Array.from({length:B[0].length},(_,j)=>row.reduce((s,x,k)=>ring.add(s,ring.mul(x,B[k][j])),ring.zero())));
}
const identity=(n,ring)=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?ring.one():ring.zero()));
export function semilinearProduct(matrix,ring){
  let result=identity(matrix.length,ring),current=matrix;const factors=[];
  for(let i=0;i<ring.degree;i++){factors.push(current);result=matrixMultiply(result,current,ring);current=current.map(row=>row.map(ring.sigma));}
  return{matrix:result,factors};
}
export function characteristicPolynomial(matrix,ring){
  const n=matrix.length;
  if(n<1||n>4||matrix.some(row=>row.length!==n))fail('MATRIX_SHAPE','A square matrix of rank 1 through 4 is required.');
  const add=(a,b)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>ring.add(a[i]??ring.zero(),b[i]??ring.zero()));
  const mul=(a,b)=>{const c=Array.from({length:a.length+b.length-1},()=>ring.zero());for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)c[i+j]=ring.add(c[i+j],ring.mul(a[i],b[j]));return c;};
  let result=Array.from({length:n+1},()=>ring.zero());
  const visit=(permutation,used)=>{
    if(permutation.length<n){for(let j=0;j<n;j++)if(!used.has(j))visit([...permutation,j],new Set([...used,j]));return;}
    let inversions=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(permutation[i]>permutation[j])inversions++;
    let term=[inversions%2?ring.neg(ring.one()):ring.one()];
    for(let i=0;i<n;i++)term=mul(term,i===permutation[i]?[ring.neg(matrix[i][i]),ring.one()]:[ring.neg(matrix[i][permutation[i]])]);
    result=add(result,term);
  };visit([],new Set());return result;
}

export function semilinearReconstruct(input={},tracker=null){
  const degree=small(input.extensionBaseDegree??1,'unramified degree',1,4),ring=unramifiedRing({p:input.p??3,N:input.N??4,degree,polynomial:input.coefficientPolynomial??null},tracker);
  const supplied=input.matrix;if(!Array.isArray(supplied)||supplied.length<1||supplied.length>4||supplied.some(row=>!Array.isArray(row)||row.length!==supplied.length))fail('INVALID_RECONSTRUCTION','Provide a square p-semilinear matrix of rank 1 through 4; residues alone do not define an extension-ring Frobenius.');
  const matrix=supplied.map(row=>row.map(ring.element)),product=semilinearProduct(matrix,ring),polynomial=characteristicPolynomial(product.matrix,ring),fixed=polynomial.every(c=>ring.equal(ring.sigma(c),c)),descends=polynomial.every(c=>c.slice(1).every(x=>x===0n));
  if(!fixed||!descends)fail('INTERNAL_CERTIFICATE','The characteristic polynomial did not descend from the coefficient Frobenius fixed subring.');
  const bounds=input.bounds;
  if(!Array.isArray(bounds)||bounds.length!==polynomial.length)fail('INVALID_BOUND','One explicit coefficient bound is required per characteristic coefficient.');
  const rows=polynomial.map((c,i)=>{
    const bound=bigint(bounds[i]);if(bound<0n)fail('INVALID_BOUND','Bounds must be nonnegative.');
    const residue=c[0],centered=residue>ring.modulus/2n?residue-ring.modulus:residue,unique=ring.modulus>2n*bound,inBound=centered>=-bound&&centered<=bound;
    return{coefficientDegree:i,residue:String(residue),bound:String(bound),modulus:String(ring.modulus),uniqueByBound:unique,inBound,integer:unique&&inBound?String(centered):null,status:!unique?'AMBIGUOUS':inBound?'UNIQUE_WITH_DECLARED_BOUND':'INCONSISTENT_BOUND'};
  });
  const consistent=rows.every(x=>!x.uniqueByBound||x.inBound),unique=consistent&&rows.every(x=>x.uniqueByBound),encode=A=>A.map(row=>row.map(ring.serialize));
  return{status:!consistent?'FAILED':unique?'COMPLETED':'PRECISION_REQUIRED',object:{kind:'SEMILINEAR_FROBENIUS_INTEGER_RECONSTRUCTION',p:String(ring.p),extensionBaseDegree:degree},scope:{finite:true,N:ring.N,rank:matrix.length,coefficientRing: ring.descriptor,boundProvenance:input.boundProvenance??'USER_DECLARED_COEFFICIENT_BOUNDS',computedFrobeniusMatrix:false,inputMatrixMustRepresentFrobenius:true},
    coefficientRing:ring.descriptor,pSemilinearMatrix:encode(matrix),qLinearMatrix:encode(product.matrix),semilinearFactors:product.factors.map(encode),formula:'M sigma(M) ... sigma^(a-1)(M), q=p^a, column convention',characteristicCoefficients:polynomial.map(ring.serialize),coefficients:unique?rows.map(x=>x.integer):null,rows,
    checks:[{name:'coefficient Frobenius respects the defining polynomial and has order a',pass:true},{name:'characteristic polynomial is coefficient-Frobenius fixed and descends to Z/p^N',pass:fixed&&descends},...rows.map(x=>({name:`coefficient ${x.coefficientDegree} has a unique bounded lift`,pass:x.uniqueByBound&&x.inBound,status:x.status}))],blockers:unique?[]:[consistent?'Increase N until p^N > 2*B_j for each coefficient.':'The declared bound is inconsistent with the computed residue.'],tables:[{title:'Semilinear reconstruction',columns:['coefficientDegree','residue','bound','integer','status'],rows}],
    visualization:{points:rows.map(x=>({pos:[x.coefficientDegree,Number(x.uniqueByBound),Number(x.inBound)],label:`Coefficient ${x.coefficientDegree}: ${x.status}`,value:x})),lines:[],axes:[{label:'Characteristic coefficient',type:'POLYNOMIAL_DEGREE'},{label:'Unique bounded lift',type:'BOOLEAN'},{label:'Within bound',type:'BOOLEAN'}],description:'Unramified semilinear Frobenius followed by exact integer reconstruction',coordinateMeaning:'These are coefficient admission states; the mixed-characteristic sigma is Hensel lifted, not coordinatewise pth power.',lostInformation:[],sourceFields:['qLinearMatrix','coefficientRing.sigmaGenerator','rows']}};
}

export function verifySemilinearResult(input,result,tracker=null){try{const expected=semilinearReconstruct(input,tracker);for(const key of ['coefficientRing','pSemilinearMatrix','qLinearMatrix','semilinearFactors','characteristicCoefficients','coefficients','rows'])if(canonical(expected[key])!==canonical(result[key]))return{pass:false,reason:'Semilinear evidence mismatch: '+key};return{pass:expected.status==='COMPLETED'};}catch(e){return{pass:false,reason:e.message};}}
