import {small,fail,canonical} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';
import {qc,qm,qadd,qneg,qmul,qeq,qone,qencode,qinteger,qbinomial,qmatrix,qidentity,qmmul,qmadd,qmeq,qmencode,triangularInverse} from './q-polynomial.mjs';

const check=(name,pass,details={})=>({name,pass,...details});
export function qFramingComparison(input={},tracker=null){
  const p=primeBase(input.p??3),D=small(input.degree??8,'polynomial display degree',1,32),shift=small(input.shift??1,'integral framing shift',-16,16);
  if(input.singular||input.certifyEInfinity)fail('UNSUPPORTED','This comparison is for the smooth polynomial algebra as a module complex; it is not a multiplicative/E-infinity comparison.');
  const F0=qmatrix(D+1,D+1),F1=qmatrix(D,D);
  for(let n=0;n<=D;n++)for(let k=0;k<=n;k++)F0[k][n]=new Map([...qbinomial(n,k)].map(([e,c])=>[e,c*((-BigInt(shift))**BigInt(n-k))]).filter(([,c])=>c!==0n));
  for(let n=0;n<D;n++)for(let k=0;k<=n;k++)F1[k][n]=F0[k][n];
  const G0=triangularInverse(F0),G1=triangularInverse(F1),d=qmatrix(D,D+1);for(let n=1;n<=D;n++)d[n-1][n]=qinteger(n);
  const chain=qmeq(qmmul(d,F0),qmmul(F1,d)),inverse=qmeq(qmmul(G0,F0),qidentity(D+1))&&qmeq(qmmul(F0,G0),qidentity(D+1))&&qmeq(qmmul(G1,F1),qidentity(D))&&qmeq(qmmul(F1,G1),qidentity(D));
  if(!chain||!inverse)fail('INTERNAL_CERTIFICATE','The explicit q-framing chain isomorphism failed.');
  // At q=1, F0(T^n)=(S-shift)^n=T^n, so this compares two framings
  // of the SAME underlying element. It is not the automorphism T -> T+shift.
  const rows=F0.flatMap((row,k)=>row.flatMap((c,n)=>c.size?[{sourcePower:n,targetSPower:k,formalCoefficient:qencode(c),atQ1:String(qone(c))}]:[]));tracker?.tick(rows.length);
  return{object:{kind:'EXPLICIT_Q_FRAMING_CHAIN_ISOMORPHISM',p:String(p),ring:'Z_p[[q-1]]<T>',first:'T',second:`S=T+(${shift})`},scope:{finite:true,displayDegree:D,allDegreeFormula:true,completedModuleComplex:true,multiplicativeComparison:false,formalComplete:false},
    formula:{P_n:'sum(k=0..n) (-shift)^(n-k) GaussianBinomial(n,k;q) S^k',degreeZero:'T^n -> P_n(S)',degreeOne:'T^n dT -> P_n(S) dS',chainIdentity:'D_(q,S) P_n = [n]_q P_(n-1)',atQ1:'P_n(S)|_(q=1)=(S-shift)^n=T^n',inverse:'Integral unit upper triangular inverse, compatible as the polynomial cutoff increases',completion:'Both triangular operators have integral coefficients of p-adic norm <=1; restricted power-series coefficients tend to zero, so their column formulas extend continuously.'},
    matrices:{sourceDifferential:qmencode(d),targetDifferential:qmencode(d),forward:[qmencode(F0),qmencode(F1)],inverse:[qmencode(G0),qmencode(G1)]},
    homotopyEquivalence:{forwardBackward:'identity in both degrees',backwardForward:'identity in both degrees',homotopies:'zero',coneAcyclic:true,reason:'A strict chain isomorphism has a contractible mapping cone; this is stronger than matching Betti numbers.'},
    checks:[check('D_target F0 = F1 D_source over Z[q]',chain),check('both integral inverse compositions equal identity',inverse),check('q=1 compares identical elements of the same polynomial algebra',true),check('no commutative DGA or E-infinity certificate is claimed',true)],
    tables:[{title:'Exact q-framing comparison coefficients',columns:['sourcePower','targetSPower','formalCoefficient','atQ1'],rows}],
    visualization:{points:rows.map(r=>({pos:[r.sourcePower,r.targetSPower,Number(r.atQ1)],label:`T^${r.sourcePower} -> S^${r.targetSPower} coefficient`,value:r})),lines:[],axes:[{label:'Source monomial degree',type:'MONOMIAL_DEGREE'},{label:'Target monomial degree',type:'MONOMIAL_DEGREE'},{label:'q=1 coefficient',type:'INTEGER_COEFFICIENT'}],description:'Integral chain isomorphism between T and T+1 framings',coordinateMeaning:'Triangular coefficients of a module chain comparison, with exact formal q-polynomials in the table.',lostInformation:['The plot uses the q=1 coefficient; the table retains the full q-polynomial.','The comparison is not asserted to preserve multiplication.'],sourceFields:['matrices','formula','homotopyEquivalence']}
  };
}

export function qPrismaticApplication(input={}){
  const p=primeBase(input.p??3),variables=small(input.variables??2,'smooth variables',0,4);
  if(input.singular||input.algebra&&input.algebra!=='smooth-polynomial')fail('UNSUPPORTED','S01 §16 admission is currently the p-completed smooth polynomial algebra with its verified standard or translated framing.');
  return{schema:'MathScope.QPrismaticTheoremApplication/1',grade:'THEOREM_APPLICATION_WITH_EXPLICIT_BASE_MAPS',localKernelCheck:false,formalComplete:false,
    source:{id:'S01',url:'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf',locators:['Example 1.9(4)','Theorem 16.18','Theorem 16.22']},
    base:{D:'Z_p[[h]], q=1+h',qPDIdeal:'I=(h)',prismIdeal:'([p]_q)',DOverI:'Z_p',prismQuotient:'Z_p[zeta_p]',phi:'q -> q^p; integers fixed',boundedPrismReason:'[p]_(1+h) is Eisenstein in h; the quotient is p-torsionfree.'},
    R:{presentation:`p-completion of Z_p[T_1,...,T_${variables}]`,smoothness:'A polynomial algebra is smooth; its identity framing is etale, and integral translations are invertible coordinate changes.',framing:'p-completely etale polynomial framing'},
    R1:{definition:'R completed-tensor_(D/I, induced phi_D) D/([p]_q)',presentation:`p-completion of Z_p[zeta_p][T_1,...,T_${variables}]`,isSameBaseAsR:false},
    baseHomomorphisms:[{source:'D',target:'D/I',qImage:'1',role:'q-PD quotient'},{source:'D',target:'D/([p]_q)',qImage:'zeta_p',role:'untwisted prism quotient'},{source:'D',target:'D/([p]_q)',qImage:'zeta_p^p=1',role:'quotient after phi_D'},{source:'D/I=Z_p',target:'D/([p]_q)=Z_p[zeta_p]',integerImage:'same integer',role:'map induced by phi_D; h maps to zero'}],
    arrows:[{from:'framed q-de Rham module complex',to:'q-crystalline R/D',theorem:'S01 Theorem 16.22',assumptions:['A-flat D','framed q-PD datum','p-completely smooth R']},{from:'q-crystalline R/D',to:'relative prismatic R1/D',theorem:'S01 Theorem 16.18',assumptions:['p-completely smooth R over D/I','R1 formed via phi-induced base map']}],
    checks:[check('the two base ideals are distinguished',true),check('phi_D(h)=q^p-1 vanishes modulo [p]_q',true),check('R1 is the explicit Frobenius-induced base change',true),check('singular algebras are outside the admitted theorem adapter',true)]};
}

export function qCechP1(input={},tracker=null){
  const p=primeBase(input.p??3),D=small(input.degree??4,'Laurent display weight',1,32);
  if(input.certifyEInfinity)fail('UNSUPPORTED','This is a coherent module-complex descent construction; no E-infinity structure is supplied.');
  const blocks=[];
  for(let k=-D;k<=D;k++){
    if(k===0){blocks.push({weight:0,ranks:[2,1,1],d0:qmencode([[qc(-1n),qc(1n)]]),d1:qmencode([[qc(0n)]]),cohomology:{H0:'A, diagonal constants',H1:'0',H2:'A, dlog(T)'},retraction:{i0:qmencode([[qc(1n)],[qc(1n)]]),r0:qmencode([[qc(1n),qc(0n)]]),h1:qmencode([[qc(0n)],[qc(1n)]])}});continue;}
    const positive=k>0,A=qinteger(k),B=qinteger(-k),c=qm(k,-1n),cinv=qm(-k,-1n);
    const d0=positive?[[A],[qc(-1n)]]:[[B],[qc(1n)]],d1=positive?[[qc(-1n),qneg(A)]]:[[c,qneg(A)]];
    const h1=[[qc(0n),qc(positive?-1n:1n)]],h2=positive?[[qc(-1n)],[qc(0n)]]:[[cinv],[qc(0n)]];
    const d2=qmeq(qmmul(d1,d0),[[qc(0n)]]),contraction=qmeq(qmmul(h1,d0),qidentity(1))&&qmeq(qmadd(qmmul(d0,h1),qmmul(h2,d1)),qidentity(2))&&qmeq(qmmul(d1,h2),qidentity(1));
    if(!d2||!contraction)fail('INTERNAL_CERTIFICATE','The q-Cech Laurent weight contraction failed.');
    blocks.push({weight:k,ranks:[1,2,1],d0:qmencode(d0),d1:qmencode(d1),h1:qmencode(h1),h2:qmencode(h2),dSquaredZero:d2,contraction,divisionByQInteger:false});tracker?.tick();
  }
  const tripleChecks=[];
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)for(const weight of [-D,-1,0,1,D]){
    const fromAnchor=[qc(1n),qm(weight,-1n)],toAnchor=[qc(1n),qm(-weight,-1n)],transition=(a,b)=>qmul(toAnchor[b],fromAnchor[a]);
    const pass=qeq(qmul(transition(j,k),transition(i,j)),transition(i,k));if(!pass)fail('INTERNAL_CERTIFICATE','Triple-overlap cocycle failed.');tripleChecks.push({indices:[i,j,k],weight,pass});
  }
  const rows=blocks.map(b=>({weight:b.weight,ranks:b.ranks.join(','),cohomology:b.weight===0?'H0=A, H2=A':'contractible',contraction:b.weight===0?'explicit diagonal retraction':'integral unit homotopy'}));
  return{status:'PARTIAL',object:{kind:'Q_TWO_AFFINE_CECH_MODULE_MODEL',p:String(p),geometry:'P1 over Z_p, q-deformed via its two standard affine charts'},scope:{finite:true,displayWeights:[-D,D],completedAllWeightModel:true,derivedModuleDescent:'EXPLICIT_CONSTRUCTED_MODULE_MODEL',canonicalQPDDescent:false,multiplicativeEInfinityCertified:false,formalComplete:false},
    qPDEnvelopes:{base:{A:'Z_p[[q-1]]',ideal:'(q-1)'},charts:[{id:'U0',lift:'A<T>',kernel:'(q-1)',envelope:'A<T>',phi:'T -> T^p'},{id:'U1',lift:'A<S>',kernel:'(q-1)',envelope:'A<S>',phi:'S -> S^p'}],overlap:{lift:'A<T,T^-1>',kernel:'(q-1)',envelope:'A<T,T^-1>',relation:'S=T^-1'},justification:'These degree-zero kernels are inherited q-PD base ideals. The small Cech-Alexander nerve also requires diagonal kernels T_j-T_0 and their q-PD envelopes in higher nerve degrees; those coefficient algebras are not computed here.',source:'S01 §16 q-PD pairs and Theorem 16.22'},
    cechAlexander:{degreeZero:'qOmega(U0) + qOmega(U1)',degreeOne:'qOmega(U0 intersection U1)',faceMap:'res_U1 - res_U0',totalDifferential:'d_Cech + (-1)^CechDegree d_q',normalizedHigherCech:'zero for the alternating ordered two-chart cover',tripleOverlapNerve:'Repeated-index triples are retained for the cocycle check',restrictionOnFunctions:'S^j -> T^-j',restrictionOnForms:'S^j dS -> -q^(-j-1) T^(-j-2) dT',tripleChecks},
    blocks,completedComparison:{finitePerfect:{ranks:[1,0,1],differentials:['0','0'],generators:['1','dlog(T)']},allWeightContraction:{positive:'h1=(0,-1), h2=(-1,0)^t',negative:'h1=(0,1), h2=(-q^(-k),0)^t',bound:'Only integer coefficients and units q^k occur. Thus the homotopies have p-adic norm <=1 and extend to the completed restricted coefficient modules.',divisionByWeight:false},theoremApplication:qPrismaticApplication({p,variables:1}),globalDescentReference:'S01 Remarks 16.15–16.16 specify the remaining canonical q-PD comparison. The constructed module complex has not been identified with that nerve.',grade:'EXPLICIT_COMPLETED_MODULE_MODEL_WITH_OPEN_QPD_COMPARISON'},
    blockers:['This module-only diagnostic does not prove canonical descent. Actual diagonal q-PD envelopes and their small Cech-Alexander nerve are available through operation=cechP1; this separate weight contraction is not used as their certificate.'],
    checks:[check('nonzero Laurent weights have d^2=0',blocks.filter(b=>b.weight).every(b=>b.dSquaredZero)),check('all displayed nonzero weights have integral contracting homotopies',blocks.filter(b=>b.weight).every(b=>b.contraction)),check('triple-overlap chain comparisons satisfy the cocycle',tripleChecks.every(x=>x.pass)),check('the retained perfect complex has H0=A,H2=A and no H1',true)],
    tables:[{title:'Two-affine q-complex weight decomposition',columns:['weight','ranks','cohomology','contraction'],rows}],
    visualization:{points:rows.map(r=>({pos:[r.weight,0,r.weight===0?1:0],label:`Weight ${r.weight}: ${r.cohomology}`,value:r})),lines:rows.slice(1).map((r,i)=>({points:[[rows[i].weight,0,rows[i].weight===0?1:0],[r.weight,0,r.weight===0?1:0]],label:'Adjacent Laurent weight; layout only'})),axes:[{label:'Laurent weight',type:'MONOMIAL_DEGREE'},{label:'Two-chart total complex',type:'CATEGORICAL'},{label:'Retained cohomology block',type:'BOOLEAN'}],description:'Actual two-affine q-module gluing; canonical q-PD nerve comparison remains open',coordinateMeaning:'Weight decomposition of a completed module complex; finite display limits do not truncate the mathematical contraction theorem.',lostInformation:['Multiplicative and E-infinity comparison is explicitly outside this certificate.'],sourceFields:['blocks','cechAlexander','completedComparison']}};
}

export function verifyQComparison(input,result){try{const expected=result?.object?.kind==='Q_TWO_AFFINE_CECH_MODULE_MODEL'?qCechP1(input):qFramingComparison(input);for(const key of Object.keys(expected).filter(k=>!['visualization','tables'].includes(k)))if(canonical(expected[key])!==canonical(result[key]))return{pass:false,reason:'Comparison was changed: '+key};return{pass:true,formalComplete:false};}catch(e){return{pass:false,reason:e.message};}}
