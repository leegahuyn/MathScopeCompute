import {bigint,small,fail,mod} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';
import {polynomialProduct} from './projective.mjs';

const trim=a=>{const b=a.slice();while(b.length>1&&b.at(-1)===0n)b.pop();return b;};
const add=(a,b,sign=1n)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]??0n)+sign*(b[i]??0n)));
function pow(a,n){let r=[1n];for(let i=0;i<n;i++)r=polynomialProduct(r,a);return r;}
export function binomial(n,k){if(k<0||k>n)return 0n;let v=1n;for(let j=1;j<=k;j++)v=v*BigInt(n-j+1)/BigInt(j);return v;}
export const qIntegerInH=m=>{m=small(m,'q-integer index',0,64);return m===0?[0n]:Array.from({length:m},(_,i)=>binomial(m,i+1));};
const encode=a=>a.map(String);
function remainderMonic(a,b){a=trim(a);b=trim(b);if(b.at(-1)!==1n)fail('INVALID_POLYNOMIAL','A monic polynomial is required.');while(a.length>=b.length&&!(a.length===1&&a[0]===0n)){const shift=a.length-b.length,c=a.at(-1);for(let i=0;i<b.length;i++)a[i+shift]-=c*b[i];a=trim(a);}return a;}
const axis=(label,type)=>({label,type,unit:'dimensionless'});
const check=(name,pass,details={})=>({name,pass,...details});

export function qDeRham(input={},tracker=null){
  const p=primeBase(input.p??3);if(p>17n)fail('UNSUPPORTED','The exact formal q view currently supports p <= 17.');
  if(Object.hasOwn(input,'q'))fail('INVALID_SPECIALIZATION','A real-valued q slider is not a formal p-adic specialization. Select the typed q=1 or cyclotomic map.');
  if(input.certifyOrdinaryLeibniz||input.specialization==='cyclotomic-as-ordinary-de-rham')fail('INVALID_COMPARISON','The framed q differential uses q-Leibniz, and the cyclotomic quotient is not the q=1 ordinary de Rham specialization.');
  if(input.singular===true)fail('UNSUPPORTED','The q/prismatic comparison requires the declared p-completely smooth framed algebra; singular input is not admitted.');
  if(input.certifyFramingIndependence||input.certifyDescent||input.certifyEInfinity)fail('UNSUPPORTED','A q-PD comparison, coherent descent or multiplicative certificate has not been constructed for this request.');
  const a=small(input.a??2,'T exponent',1,8),b=small(input.b??3,'S exponent',1,8),N=small(input.N??4,'p-adic digits N',1,64),U=small(input.U??Math.max(Number(p)-1,a,b),'h truncation degree U',1,64),modulus=p**BigInt(N),qa=qIntegerInH(a),qb=qIntegerInH(b),cross1=polynomialProduct(qa,qb),cross2=polynomialProduct(qb,qa),d2=add(cross1,cross2,-1n),qp=qIntegerInH(Number(p));
  const fullRows=Array.from({length:8},(_,i)=>{const m=i+1,c=qIntegerInH(m);return{m,coefficientsInH:encode(c),atQ1:String(c[0]),ordinaryDerivativeCoefficient:String(m),cyclotomicRemainder:encode(remainderMonic(c,qp)),finiteView:encode(c.slice(0,U+1).map(x=>mod(x,modulus)))};});
  const leibnizLeft=qIntegerInH(a+b),leibnizRight=add(qa,polynomialProduct(pow([1n,1n],a),qb)),ordinaryLeibniz=add(qa,qb);
  const ordinaryLeibnizWorks=leibnizLeft.length===ordinaryLeibniz.length&&leibnizLeft.every((x,i)=>x===ordinaryLeibniz[i]);
  const framing={first:'T',second:'S=T+1',polynomial:'T^2',inT:{coefficientOfT:['2','1'],constant:['0']},inSTransportedToT:{coefficientOfT:['2','1'],constant:['0','1']},difference:'h=q-1',comparisonStatus:'MODEL_DEVELOPMENT',reason:'The framed q-differentials differ. A chain comparison or common q-PD model is required; matching Betti numbers cannot certify coordinate independence.'};
  tracker?.tick(cross1.length+fullRows.reduce((s,x)=>s+x.coefficientsInH.length,0));
  const points=fullRows.flatMap(row=>row.coefficientsInH.map((coefficient,j)=>({pos:[row.m,j,Number(coefficient)],label:`[${row.m}]_(1+h), h^${j}: ${coefficient}`,value:{m:row.m,hDegree:j,coefficient}})));
  return{
    object:{kind:'FRAMED_FORMAL_Q_KOSZUL_COMPLEX',p:String(p),ring:'Z_p[[h]]',q:'1+h',geometry:'p-completion of Z_p[T,S] with its standard smooth framing'},
    scope:{finite:true,monomialExponents:[a,b],pAdicDigits:N,hDegree:U,fullPolynomialIdentities:true,globalDerivedDescent:false,prismaticComparisonStatus:'MODEL_DEVELOPMENT',eInfinityCertified:false},
    bases:{qPrism:{A:'Z_p[[q-1]]',I:'([p]_q)',idealGeneratorInH:encode(qp),phiQ:'q^p',deltaQ:'0'},qPDPair:{A:'Z_p[[q-1]]',ideal:'(q-1)',isSameIdealAsQPrism:false},finiteView:{ring:`(Z/${p}^${N})[h]/(h^${U+1})`,originalBaseIsFinite:false}},
    complex:{basis:[[`T^${a} S^${b}`],[`T^${a-1} S^${b} dT`,`T^${a} S^${b-1} dS`],[`T^${a-1} S^${b-1} dT wedge dS`]],ranks:[1,2,1],d0:[encode(qa),encode(qb)],d1:[encode(qb.map(x=>-x)),encode(qa)],dSquared:encode(d2),coefficientOrder:'ascending in h',meaning:'One explicitly invariant monomial-weight block of the two-variable framed q-Koszul complex.'},
    qIntegers:fullRows,leibniz:{rule:'D_q(fg)=D_q(f)g+sigma(f)D_q(g), sigma(T)=qT',left:encode(leibnizLeft),right:encode(leibnizRight),ordinaryLeibnizCertified:false,ordinaryLeibnizCounterexample:{a,b,left:encode(leibnizLeft),incorrectRight:encode(ordinaryLeibniz)}},framing,
    comparisonMaps:[{id:'q-one',source:'A=Z_p[[q-1]]',target:'Z_p',map:'q -> 1',operation:'ORDINARY_DE_RHAM_SPECIALIZATION',checked:'[m]_q -> m on all displayed monomials'},{id:'cyclotomic',source:'A',target:'A/([p]_q)=Z_p[zeta_p]',map:'q -> zeta_p',operation:'UNTWISTED_HODGE_TATE_BASE_REDUCTION',ordinaryDeRham:false},{id:'twisted-de-rham',source:'prismatic complex',target:'de Rham comparison target',map:'phi-twisted base change along A -> A/I',operation:'THEOREM_REFERENCE',localKernelCheck:false},{id:'framed-prismatic',source:'q-crystalline R with declared framing',target:'relative prismatic complex of X=Spf(R tensor Z_p[zeta_p])',baseChange:'R^(1) and Frobenius base homomorphism are required',operation:'MODEL_DEVELOPMENT',localKernelCheck:false}],
    checks:[check('formal [p]_(1+h) has constant p and leading coefficient 1',qp[0]===p&&qp.at(-1)===1n),check('two-variable q derivatives commute and d^2=0 over Z[h]',d2.every(x=>x===0n)),check('q-Leibniz identity on the requested monomial',leibnizLeft.length===leibnizRight.length&&leibnizLeft.every((x,i)=>x===leibnizRight[i])),check('ordinary Leibniz is rejected for this nontrivial q example',!ordinaryLeibnizWorks),check('q=1 specializes every displayed q-integer to m',fullRows.every(row=>row.atQ1===String(row.m))),check('[p]_q vanishes in the cyclotomic quotient',remainderMonic(qp,qp).every(x=>x===0n))],
    tables:[{title:'Exact q-integer polynomials',columns:['m','coefficientsInH','atQ1','cyclotomicRemainder'],rows:fullRows}],
    visualization:{points,lines:fullRows.map(row=>({points:row.coefficientsInH.map((c,j)=>[row.m,j,Number(c)]),label:`[${row.m}]_(1+h)`})),axes:[axis('Monomial exponent m','MONOMIAL_DEGREE'),axis('Formal h coefficient degree','FORMAL_POWER_SERIES_DEGREE'),axis('Exact integer coefficient','INTEGER_COEFFICIENT')],description:'Formal q-integer coefficients and a q-Koszul differential',coordinateMeaning:'The h axis indexes formal coefficients; it is not a real or p-adic numerical q slider. Exact polynomials and finite truncations are stored separately.',lostInformation:['Only the declared finite coefficient window is plotted.','A framed local complex does not certify coordinate-independent prismatic descent.'],sourceFields:['qIntegers.coefficientsInH','complex']}
  };
}

export function breuilKisin(input={},tracker=null){
  const p=primeBase(input.p??3);if(p>17n)fail('UNSUPPORTED','The BK point baseline uses residue field F_p with p <= 17.');
  if(input.residueExtension&&input.residueExtension!==1)fail('UNSUPPORTED','A nontrivial Witt coefficient Frobenius requires an extension-field Witt backend.');
  if(input.projectiveTateMultiplier!==undefined)fail('UNSUPPORTED','A BK Tate-twist Frobenius multiplier is not assigned from the crystalline value p.');
  if(input.uniformizerChange!==undefined)fail('UNSUPPORTED','Changing uniformizer requires a separately checked comparison certificate.');
  const supplied=input.E??[String(-p),'1'];if(!Array.isArray(supplied)||supplied.length<2||supplied.length>7)fail('INVALID_EISENSTEIN','Provide a monic Eisenstein polynomial of degree 1 through 6, coefficients ascending.');
  const E=trim(supplied.map(x=>bigint(x,'E coefficient',128))),degree=E.length-1;
  if(E.at(-1)!==1n||E[0]%p!==0n||E[0]%(p*p)===0n||E.slice(0,-1).some(x=>x%p!==0n))fail('INVALID_EISENSTEIN','E must be monic, all nonleading coefficients divisible by p, and its constant coefficient not divisible by p^2.');
  const phiE=Array(degree*Number(p)+1).fill(0n);E.forEach((x,i)=>{phiE[i*Number(p)]=x;});
  const Ep=pow(E,Number(p)),numerator=add(phiE,Ep,-1n);if(numerator.some(x=>x%p!==0n))fail('INTERNAL_CERTIFICATE','The delta numerator did not divide by p exactly.');
  const deltaE=trim(numerator.map(x=>x/p)),N=small(input.N??4,'p-adic digits N',1,64),U=small(input.U??Math.max(4,deltaE.length-1),'u degree U',1,128),pointAtRationalBase=degree===1&&E[0]===-p,phiUMapped=pointAtRationalBase?String(p**p):'pi^p';
  tracker?.tick(Ep.length*degree);
  const rows=deltaE.map((c,i)=>({uDegree:i,coefficient:String(c),residueModP:String(mod(c,p))}));
  return{
    object:{kind:'BREUIL_KISIN_POINT_COMPARISON_MODEL',p:String(p),residueField:`F_${p}`,A:'Z_p[[u]]',I:'(E(u))',E:encode(E)},
    scope:{finite:true,geometry:'X=Spf(A/(E))',pointComplex:'A[0]',pAdicDigits:N,uDegree:U,residueCoefficientFrobenius:'identity on W(F_p)=Z_p',arbitraryRamifiedGeometriesSupported:false,pointComparison:'THEOREM_REFERENCE'},
    eisenstein:{degree,coefficients:encode(E),pass:true},frobenius:{u:`u^${p}`,coefficients:'Witt Frobenius on W(F_p), which is identity'},delta:{formula:'delta(E)=(phi(E)-E^p)/p',phiE:encode(phiE),EPower:encode(Ep),coefficients:encode(deltaE),constantResidueModP:String(mod(deltaE[0],p)),unitInZpFormalSeries:mod(deltaE[0],p)!==0n},
    complex:{ranks:[1],degree:0,differentials:[],cohomology:'A in degree 0',finiteView:{ring:`(Z/${p}^${N})[u]/(u^${U+1})`,rank:1}},
    baseChangeMaps:[{id:'bk-crystalline',source:'A',target:'Z_p',uImage:'0',kind:'CRYSTALLINE_BASE_MAP'},{id:'bk-hodge-tate',source:'A',target:'A/(E)',uImage:pointAtRationalBase?String(p):'pi',kind:'UNTWISTED_QUOTIENT_BASE_MAP'},{id:'bk-twisted-de-rham',source:'A',target:'A/(E)',uImage:phiUMapped,kind:'FROBENIUS_TWISTED_BASE_MAP'}],
    checks:[check('E is Eisenstein',true),check('delta numerator is integrally divisible by p',numerator.every(x=>x%p===0n)),check('delta(E) is a formal-series unit',mod(deltaE[0],p)!==0n),check('untwisted and Frobenius-twisted quotient maps are distinct',!pointAtRationalBase||p!==p**p)],
    tables:[{title:'Exact delta(E) coefficients',columns:['uDegree','coefficient','residueModP'],rows}],
    visualization:{points:rows.map(row=>({pos:[row.uDegree,Number(row.residueModP),0],label:`u^${row.uDegree}: ${row.coefficient}`,value:row})),lines:rows.length>1?[{points:rows.map(row=>[row.uDegree,Number(row.residueModP),0]),label:'Coefficient residues modulo p'}]:[],axes:[axis('u coefficient degree','FORMAL_POWER_SERIES_DEGREE'),axis('Coefficient residue modulo p','FINITE_FIELD_RESIDUE'),axis('Point cohomology degree','COHOMOLOGICAL_DEGREE')],description:`BK point over F_${p}; delta(E) and three different base maps`,coordinateMeaning:'The scene plots formal coefficient data modulo p. It is not the ramified field itself, and no geometry beyond the declared point is certified.',lostInformation:['The residue plot omits higher p-adic digits; exact integer coefficients remain in the table.'],sourceFields:['delta.coefficients','baseChangeMaps']}
  };
}

export function etaFixture(input={}){
  const p=primeBase(input.p??3),d=bigint(input.d??p);if(d===0n)fail('UNSUPPORTED','This diagnostic uses a nonzero one-by-one differential.');
  const divisible=d%p===0n,etaDifferential=divisible?d/p:d;
  return{object:{kind:'EXACT_ETA_COMPLEX_DIAGNOSTIC',p:String(p)},scope:{finite:true,rawComplex:'[Z --d--> Z] in degrees 0,1',AomegaCertified:false},raw:{d:String(d),H0:'0',H1:`Z/${d<0n?-d:d}Z`},eta:{f:String(p),degreeZeroSubmodule:divisible?'Z':`${p}Z`,degreeOneSubmodule:`${p}Z`,dInChosenBases:String(etaDifferential),H0:'0',H1:`Z/${etaDifferential<0n?-etaDifferential:etaDifferential}Z`},checks:[check('d maps eta^0 into eta^1',true),check('the eta operation is recorded rather than omitted',true)],tables:[{title:'Raw and eta differential',columns:['model','d'],rows:[{model:'raw',d:String(d)},{model:'eta',d:String(etaDifferential)}]}],visualization:{points:[{pos:[0,0,0],label:`raw d=${d}`,value:{d:String(d)}},{pos:[1,0,0],label:`eta d=${etaDifferential}`,value:{d:String(etaDifferential)}}],lines:[{points:[[0,0,0],[1,0,0]],label:'Apply eta_p to a p-torsionfree representative'}],axes:[axis('Complex construction','CATEGORICAL')],description:'Why raw Koszul cohomology cannot automatically be labelled A-omega',coordinateMeaning:'Two exact finite complexes are compared. This diagnostic is not an A-omega construction for a perfectoid torus.',lostInformation:[]},remainingObligations:['The actual pro-etale/group model, completion, L eta, base extension to a complete algebraic closure and the comparison theorem are still required for A-omega.']};
}
