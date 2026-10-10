// Dense standard-tilt Laurent polynomials and rigorously bounded untilt observations.
// The completed ring is specified separately; no finite array is an inverse limit.
import {bigint,small,fail,mod,valuation,canonical,hash} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';

const key=e=>e.join(','),exponents=k=>k.split(',').map(Number);
export function sparseTorusRing({p=3,depth=0,dimensions=1,coefficientModulus=null,untilt=false,digits=3}={},tracker=null){
  p=primeBase(p);if(p>7n)fail('UNSUPPORTED','Standard tower arithmetic supports p=2,3,5,7.');
  depth=small(depth,'root depth',0,14);dimensions=small(dimensions,'torus dimensions',0,3);digits=small(digits,'valuation digits',1,16);
  const denominator=Number(p**BigInt(depth)),modulus=coefficientModulus===null?(untilt?p**BigInt(digits):p):bigint(coefficientModulus);
  const normalize=(e,c)=>{
    if(e.length!==dimensions+1||e.some(x=>!Number.isSafeInteger(x)||Math.abs(x)>10000000)||e[0]<0)fail('INVALID_TORUS_MONOMIAL','Use one nonnegative uniformizer exponent followed by bounded integral Laurent exponents.');
    e=e.slice();c=bigint(c);
    if(untilt&&e[0]>=denominator){const power=Math.floor(e[0]/denominator);if(power>=digits)return null;c*=p**BigInt(power);e[0]%=denominator;}
    c=mod(c,modulus);return c===0n?null:[key(e),c];
  };
  const zero=()=>new Map(),constant=c=>{const n=normalize(Array(dimensions+1).fill(0),c);return new Map(n?[n]:[]);};
  const add=(a,b)=>{const c=new Map(a);for(const[k,x]of b){const v=mod((c.get(k)??0n)+x,modulus);if(v)c.set(k,v);else c.delete(k);}return c;};
  const neg=a=>new Map([...a].map(([k,c])=>[k,mod(-c,modulus)])),sub=(a,b)=>add(a,neg(b));
  const element=terms=>{
    if(!Array.isArray(terms))return constant(terms);
    if(terms.length>4096)fail('RESOURCE_LIMIT','A dense torus input has at most 4096 monomials.');
    let a=zero();for(const term of terms){if(!term||typeof term!=='object'||Array.isArray(term)||!Array.isArray(term.exponents))fail('INVALID_TORUS_MONOMIAL','Each monomial needs {coefficient,exponents:[pi,T1,...]}.');const entry=normalize(term.exponents.map(x=>small(x,'monomial exponent',-10000000,10000000)),term.coefficient);if(entry)a=add(a,new Map([entry]));}return a;
  };
  const mul=(a,b)=>{
    if(a.size*b.size>4000000)fail('RESOURCE_LIMIT','A torus product exceeds four million monomial pairs.');let c=zero();
    for(const[ka,x]of a){const ea=exponents(ka);for(const[kb,y]of b){tracker?.tick();const eb=exponents(kb),entry=normalize(ea.map((v,i)=>v+eb[i]),x*y);if(entry){const[k,z]=entry,v=mod((c.get(k)??0n)+z,modulus);if(v)c.set(k,v);else c.delete(k);}}}
    if(c.size>4096)fail('RESOURCE_LIMIT','A torus result exceeds 4096 monomials.');return c;
  };
  const pow=(a,n)=>{n=bigint(n);if(n<0n)fail('UNSUPPORTED','Negative powers of a general polynomial are not replaced by monomial inverses.');let b=constant(1n);while(n){if(n&1n)b=mul(b,a);n>>=1n;if(n)a=mul(a,a);}return b;};
  const scale=(a,c)=>new Map([...a].map(([k,x])=>[k,mod(x*bigint(c),modulus)]).filter(([,x])=>x!==0n));
  const encode=a=>[...a].sort(([a],[b])=>{const ea=exponents(a),eb=exponents(b);for(let i=0;i<ea.length;i++)if(ea[i]!==eb[i])return ea[i]-eb[i];return 0;}).map(([k,c])=>({coefficient:String(c),exponents:exponents(k)}));
  const equal=(a,b)=>sub(a,b).size===0;
  return{p,depth,dimensions,denominator,modulus,digits,untilt,zero,constant,element,add,neg,sub,mul,pow,scale,encode,equal,descriptor:{p:String(p),depth,exponentDenominator:String(denominator),dimensions,coefficientModulus:String(modulus),relation:untilt?`pi^${denominator}=p`:'pi and torus roots are independent characteristic-p monomials',untilt}};
}

export function refineTorus(value,fromDepth,toRing){
  if(toRing.depth<fromDepth)fail('PRECISION_REQUIRED','Refinement cannot forget roots while pretending every element descends.');
  const scale=Number(toRing.p**BigInt(toRing.depth-fromDepth));return toRing.element([...value].map(([k,c])=>({coefficient:String(c),exponents:exponents(k).map(x=>x*scale)})));
}

export function standardTiltOperation(input={},tracker=null){
  const ring=sparseTorusRing({p:input.p??3,depth:input.M??1,dimensions:input.dimensions??1},tracker),a=ring.element(input.a??[{coefficient:'1',exponents:[1,...Array(ring.dimensions).fill(0)]},{coefficient:'1',exponents:Array(ring.dimensions+1).fill(0)}]),b=ring.element(input.b??[{coefficient:'1',exponents:[0,...Array(ring.dimensions).fill(1)]}]);
  const sum=ring.add(a,b),product=ring.mul(a,b),frobenius=ring.pow(a,ring.p),finer=sparseTorusRing({p:ring.p,depth:ring.depth+1,dimensions:ring.dimensions},tracker),root=finer.element(ring.encode(a)),rootPower=finer.pow(root,ring.p),refined=refineTorus(a,ring.depth,finer);
  const compatible=finer.equal(rootPower,refined);if(!compatible)fail('INTERNAL_CERTIFICATE','Tilt Frobenius inverse failed to refine compatibly.');
  const modPSequence=Array.from({length:3},(_,i)=>{const R=sparseTorusRing({p:ring.p,depth:ring.depth+i,dimensions:ring.dimensions,untilt:true,digits:1},tracker);return{R,value:R.element(ring.encode(a))};});
  const compatibleModPSequence=modPSequence.map(({R,value},i)=>({level:i,ring:R.descriptor,terms:R.encode(value),previousPowerRelation:i===0?null:R.equal(R.pow(value,ring.p),refineTorus(modPSequence[i-1].value,modPSequence[i-1].R.depth,R))}));
  if(compatibleModPSequence.some(x=>x.previousPowerRelation===false))fail('INTERNAL_CERTIFICATE','The actual untilt-mod-p components are not Frobenius compatible.');
  const rows=[['a',a],['b',b],['a+b',sum],['a*b',product],['phi(a)',frobenius]].map(([operation,value])=>({operation,terms:ring.encode(value)}));
  return{object:{kind:'STANDARD_TILT_LAURENT_ARITHMETIC',base:'completion of F_p((t^(1/p^infinity))) with completed torus roots',ring:ring.descriptor},scope:{finite:true,exactDenseElements:true,rootDepth:ring.depth,dimensions:ring.dimensions,completedElementsRequireCauchyPresentation:true,untiltAdditionIsDifferent:true},rows,
    compatibleModPSequence,
    frobeniusInverse:{source:ring.descriptor,target:finer.descriptor,terms:finer.encode(root),refinedSource:finer.encode(refined),power:finer.encode(rootPower),compatible},
    checks:[{name:'actual untilt-mod-p components satisfy x_(m+1)^p=x_m after root refinement',pass:compatibleModPSequence.every(x=>x.previousPowerRelation!==false)},{name:'Frobenius is additive in the characteristic-p tilt',pass:ring.equal(ring.pow(sum,ring.p),ring.add(ring.pow(a,ring.p),ring.pow(b,ring.p)))},{name:'the next root level is a true Frobenius inverse after refinement',pass:compatible}],
    tables:[{title:'Exact standard-tilt polynomials',columns:['operation','terms'],rows}],visualization:torusView(rows,ring,'Characteristic-p tilt addition and multiplication on actual Laurent coefficients')};
}

function torusView(rows,ring,description){
  const points=rows.flatMap((row,operation)=>row.terms.map(term=>({pos:[operation,term.exponents[0]/ring.denominator,Number(BigInt(term.coefficient)%ring.p)],label:`${row.operation}: ${term.coefficient} at exponent ${term.exponents.join(',')}/${ring.denominator}`,value:{operation:row.operation,...term,exponentDenominator:String(ring.denominator)}})));
  return{points,lines:[],axes:[{label:'Operation',type:'CATEGORICAL'},{label:'Uniformizer valuation',type:'PADIC_VALUATION'},{label:'Residue coefficient',type:'FINITE_FIELD_RESIDUE'}],description,coordinateMeaning:'Finite monomial coefficients with exact rational exponent data; screen distances are not a convergence proof.',lostInformation:['The displayed coordinates omit torus exponents; all exponents remain in the exact table.'],sourceFields:['rows.terms']};
}

export function sharpApproximation(input={},tracker=null){
  const p=primeBase(input.p??3),depth=small(input.M??0,'tilt root depth',0,6),dimensions=small(input.dimensions??0,'torus dimensions',0,3),V=small(input.V??3,'requested sharp precision',1,8),steps=small(input.sharpSteps??V-1,'sharp inverse-Frobenius steps',0,7),available=Math.min(V,steps+1);
  const tilt=sparseTorusRing({p,depth,dimensions},tracker),a=tilt.element(input.a??[{coefficient:'1',exponents:Array(dimensions+1).fill(0)},{coefficient:'1',exponents:[1,...Array(dimensions).fill(0)]}]);
  const target=sparseTorusRing({p,depth:depth+steps,dimensions,untilt:true,digits:available},tracker);
  let lift=target.element(tilt.encode(a));
  if(input.liftPerturbation!==undefined)lift=target.add(lift,target.scale(target.element(input.liftPerturbation),p));
  const value=target.pow(lift,p**BigInt(steps));
  return{p,depth,dimensions,V,steps,available,tilt,target,input:a,value,certificate:{method:'lim_r lift(a^(1/p^r))^(p^r)',inputRepresentation:'EXACT_DENSE_STANDARD_TILT_POLYNOMIAL',requestedValuationDigits:V,certifiedValuationDigits:available,rootDepth:depth+steps,liftIndependence:'If integral lifts differ by p, their p^r powers differ by valuation >=r+1.',successiveApproximationBound:'Compatible mod-p roots make consecutive approximants differ by valuation >=r+1.',proofRecurrence:'v(x^p-y^p)>=v(x-y)+1 for integral x,y with v(x-y)>=1, by the binomial coefficients.',complexOrEuclideanDistanceUsed:false,completedLimitComputed:false}};
}

export function sharpOperation(input={},tracker=null){
  const s=sharpApproximation(input,tracker),rows=[{operation:'sharp(a)',terms:s.target.encode(s.value)}];
  return{status:s.available===s.V?'COMPLETED':'PRECISION_REQUIRED',object:{kind:'STANDARD_TILT_SHARP_OBSERVATION',source:s.tilt.descriptor,target:s.target.descriptor},scope:{finite:true,exactDenseInput:true,rootDepth:s.depth,sharpSteps:s.steps,requestedValuationDigits:s.V,certifiedValuationDigits:s.available,sharpIsAdditive:false},inputTerms:s.tilt.encode(s.input),rows,precisionCertificate:s.certificate,
    checks:[{name:'sharp has enough inverse-Frobenius depth for the requested precision',pass:s.available===s.V}],blockers:s.available===s.V?[]:[`Increase sharpSteps to at least ${s.V-1}; finite picture proximity is not a sharp precision certificate.`],tables:[{title:'Certified untilt sharp residue',columns:['operation','terms'],rows}],visualization:torusView(rows,s.target,'Sharp limit evaluated with a lift-independent p-adic error bound')};
}

export function universalWittBinary(a,b,operation,ring,N,tracker=null){
  N=small(N,'universal Witt length',1,4);if(!['add','multiply','subtract'].includes(operation))fail('INVALID_WITT_OPERATION','Unknown universal Witt operation.');
  if(a.length!==N||b.length!==N)fail('INVALID_WITT','Universal Witt inputs must have exactly N coordinates.');
  const output=[],ghostChecks=[];
  for(let n=0;n<N;n++){
    const lift=sparseTorusRing({p:ring.p,depth:ring.depth,dimensions:ring.dimensions,coefficientModulus:ring.p**BigInt(n+1)},tracker),importValue=x=>lift.element(ring.encode(x));
    const ghost=coordinates=>coordinates.slice(0,n+1).reduce((s,x,i)=>lift.add(s,lift.scale(lift.pow(importValue(x),ring.p**BigInt(n-i)),ring.p**BigInt(i))),lift.zero());
    let numerator=operation==='multiply'?lift.mul(ghost(a),ghost(b)):operation==='subtract'?lift.sub(ghost(a),ghost(b)):lift.add(ghost(a),ghost(b));
    for(let i=0;i<n;i++)numerator=lift.sub(numerator,lift.scale(lift.pow(importValue(output[i]),ring.p**BigInt(n-i)),ring.p**BigInt(i)));
    const divisor=ring.p**BigInt(n),exact=[...numerator.values()].every(c=>c%divisor===0n);
    if(!exact)fail('INTERNAL_CERTIFICATE','The universal Witt ghost numerator is not divisible by p^n.');
    output.push(ring.element(lift.encode(numerator).map(t=>({...t,coefficient:String(BigInt(t.coefficient)/divisor)}))));
    ghostChecks.push({index:n,modulus:String(lift.modulus),divisor:String(divisor),exactCoefficientDivision:exact});
  }
  return{coordinates:output,ghostChecks};
}

export function standardTiltWitt(input={},tracker=null){
  const N=small(input.N??2,'universal Witt length',1,4),ring=sparseTorusRing({p:input.p??3,depth:input.M??0,dimensions:input.dimensions??0},tracker),one=ring.constant(1n),zero=ring.zero();
  const decode=list=>{if(!Array.isArray(list)||list.length!==N)fail('INVALID_WITT','Provide N standard-tilt polynomial coordinates.');return list.map(ring.element);};
  const a=input.a?decode(input.a):Array.from({length:N},(_,i)=>i?zero:one),b=input.b?decode(input.b):Array.from({length:N},(_,i)=>i?zero:one),sum=universalWittBinary(a,b,'add',ring,N,tracker),product=universalWittBinary(a,b,'multiply',ring,N,tracker),frobenius=a.map(x=>ring.pow(x,ring.p));
  let carry=Array.from({length:N},()=>zero);for(let i=0;i<Number(ring.p);i++)carry=universalWittBinary(carry,Array.from({length:N},(_,j)=>j?zero:one),'add',ring,N,tracker).coordinates;
  const rows=[{operation:'a',coordinates:a.map(ring.encode)},{operation:'b',coordinates:b.map(ring.encode)},{operation:'a+b',coordinates:sum.coordinates.map(ring.encode)},{operation:'a*b',coordinates:product.coordinates.map(ring.encode)},{operation:'phi(a)',coordinates:frobenius.map(ring.encode)},{operation:'p*1',coordinates:carry.map(ring.encode)}];
  const viewRows=rows.flatMap(r=>r.coordinates.map((terms,i)=>({operation:`${r.operation}[${i}]`,terms})));
  return{object:{kind:'UNIVERSAL_WITT_OVER_STANDARD_TILT',coefficientRing:ring.descriptor,length:N},scope:{finite:true,exactDenseCoefficients:true,universalPolynomialEvaluation:true,arbitraryPerfectoidPresentations:false,completedCoefficientOracleRequiredForNonDenseElements:true},
    arithmetic:{ghostPolynomials:'w_n(X)=sum(i=0..n) p^i X_i^(p^(n-i))',method:'Recursively solve universal ghost identities in the p-torsionfree monomial lift modulo p^(n+1), divide exactly by p^n, then reduce coefficients modulo p.',coefficientwiseAddition:false,universalFor:'Every commutative characteristic-p coefficient ring; this evaluator supplies the standard dense Laurent subring.'},rows,
    checks:[{name:'all addition ghost divisions are exact',pass:sum.ghostChecks.every(x=>x.exactCoefficientDivision)},{name:'all multiplication ghost divisions are exact',pass:product.ghostChecks.every(x=>x.exactCoefficientDivision)},{name:'Witt carry p*1 has nonzero coordinate 1 when N>1',pass:N===1||ring.equal(carry[1],one)}],ghostLedger:{addition:sum.ghostChecks,multiplication:product.ghostChecks},tables:[{title:'Universal Witt coordinates over the tilt',columns:['operation','coordinates'],rows}],visualization:torusView(viewRows,ring,'Universal Witt addition, multiplication and Frobenius over actual tilt coefficients')};
}

export async function thetaOperation(input={},tracker=null){
  const p=primeBase(input.p??3),N=small(input.N??3,'theta residue digits / Witt length',1,4),depth=small(input.M??0,'theta coefficient root depth',0,5),dimensions=small(input.dimensions??0,'torus dimensions',0,3),ring=sparseTorusRing({p,depth,dimensions},tracker);
  const t=ring.element([{coefficient:'1',exponents:[Number(p**BigInt(depth)),...Array(dimensions).fill(0)]}]),zero=ring.zero(),one=ring.constant(1n),teich=Array.from({length:N},(_,i)=>i?zero:t),pVector=Array.from({length:N},(_,i)=>i===1?one:zero);
  const xi=universalWittBinary(teich,pVector,'subtract',ring,N,tracker).coordinates;
  const supplied=input.coordinates;if(supplied&&(!Array.isArray(supplied)||supplied.length!==N))fail('INVALID_WITT','Theta needs exactly N dense standard-tilt Witt coordinates.');
  const coordinates=supplied?supplied.map(ring.element):xi,target=sparseTorusRing({p,depth:depth+N-1,dimensions,untilt:true,digits:N},tracker);
  const theta=values=>{
    let total=target.zero();const terms=[];
    for(let i=0;i<N;i++){
      // a_i^(1/p^i), then r=N-i-1 sharp steps, yields the SAME total root depth.
      const s=sharpApproximation({p,M:depth+i,dimensions,V:N-i,sharpSteps:N-i-1,a:ring.encode(values[i])},tracker),lifted=target.element(s.target.encode(s.value)),term=target.scale(lifted,p**BigInt(i));
      total=target.add(total,term);terms.push({index:i,multiplier:String(p**BigInt(i)),sharpCertificate:s.certificate,terms:target.encode(term)});
    }return{value:total,terms};
  };
  const actual=theta(coordinates),xiImage=theta(xi),phiXi=theta(xi.map(x=>ring.pow(x,p))),base={id:'completed-standard-p-roots-with-torus',p:String(p),dimensions,valuation:'v(p)=1',completion:'valuation completion',pseudoUniformizer:'p^(1/p)',roots:'compatible p-power roots'},baseHash=await hash(base);
  const expectedPhi=target.constant(p**p-p),xiZero=target.equal(xiImage.value,target.zero()),distinguished=N<2?null:ring.equal(xi[1],ring.constant(-1n));
  if(!xiZero||!target.equal(phiXi.value,expectedPhi)||distinguished===false)fail('INTERNAL_CERTIFICATE','The standard theta/xi witness failed.');
  const rows=[{operation:'theta(input)',terms:target.encode(actual.value)},{operation:'theta(xi)',terms:target.encode(xiImage.value)},{operation:'theta(phi(xi))',terms:target.encode(phiXi.value)}];
  return{object:{kind:'STANDARD_AINF_THETA_KERNEL_OBSERVATION',baseHash,source:ring.descriptor,target:target.descriptor},scope:{finite:true,WittLength:N,thetaModuloPpower:N,exactDenseCoordinates:true,generalCompletedThetaRequiresCauchyPresentation:true,formalComplete:false},base,
    coordinates:coordinates.map(ring.encode),thetaTerms:actual.terms,rows,xi:{formula:'[t]-p, t=(p,p^(1/p),...) in the tilt',coordinates:xi.map(ring.encode),firstWittCarryCoordinate:N>1?ring.encode(xi[1]):null,distinguished:N>1?distinguished:'REQUIRES_WITT_LENGTH_2',thetaZero:xiZero},
    kernelComparison:{untiltBaseHash:baseHash,statement:'ker(theta)=(xi); A_inf/(xi) ~= the selected integral perfectoid torus',grade:'APPLIED_EXTERNAL_THEOREM_WITH_STANDARD_BASE_WITNESSES',sources:[{id:'S03',url:'https://people.mpim-bonn.mpg.de/scholze/integralpadicHodge.pdf',locator:'Lemma 3.10, Remark 3.11, Lemma 3.12'},{id:'S01',url:'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf',locator:'Theorem 3.10'}],hypotheses:['p-adic completeness of the selected untilt','Frobenius on the reduction is surjective via adjoining the next root of every monomial','xi_1=-1 is a unit','the integral standard tilt is a domain, and xi is a nonzero element of its p-torsionfree Witt ring'],localKernelCheck:false,formalComplete:false},
    checks:[{name:'theta(xi)=0 in the stated untilt residue',pass:xiZero},{name:'xi has unit Witt coordinate 1 when that digit is available',pass:N===1||distinguished},{name:'theta(phi(xi))=p^p-p, so no false commuting untilt Frobenius is assumed',pass:target.equal(phiXi.value,expectedPhi)}],tables:[{title:'Theta and the actual kernel generator',columns:['operation','terms'],rows}],visualization:torusView(rows,target,'Theta on dense Witt coordinates, tied to the selected untilt and kernel generator')};
}

export async function verifyThetaOperation(input,result){try{const expected=await thetaOperation(input);for(const key of ['object','scope','base','coordinates','thetaTerms','rows','xi','kernelComparison'])if(canonical(expected[key])!==canonical(result[key]))return{pass:false,reason:'Theta/base evidence changed: '+key};return{pass:true,formalComplete:false};}catch(e){return{pass:false,reason:e.message};}}
