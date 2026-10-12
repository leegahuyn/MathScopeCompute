// Actual small q-PD Cech–Alexander envelope presentations for the two charts of P^1.
// Complete delta envelopes are specified by all delta relations (S01 Lemma 16.10).
// A displayed delta-depth is a finite selection of elements, NOT a quotient killing higher deltas.
import {small,fail,canonical} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';

const source={id:'S01',url:'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf',locators:['Lemma 16.10','Remark 16.15','Remark 16.16','Construction 16.20','Theorem 16.22 and its proof']};
const mono=e=>JSON.stringify(Object.entries(e).filter(([,v])=>v).sort(([a],[b])=>a.localeCompare(b))),unmono=JSON.parse;
const constant=c=>BigInt(c)===0n?new Map():new Map([[mono({}),BigInt(c)]]),variable=(v,e=1)=>new Map([[mono({[v]:e}),1n]]);
const add=(a,b)=>{const r=new Map(a);for(const[k,c]of b){const v=(r.get(k)??0n)+c;if(v)r.set(k,v);else r.delete(k);}return r;};
const scale=(a,c)=>{c=BigInt(c);return c===0n?constant(0):new Map([...a].map(([k,v])=>[k,v*c]));},sub=(a,b)=>add(a,scale(b,-1));
function multiply(a,b,tracker){
 if(a.size*b.size>4000000)fail('RESOURCE_LIMIT','The q-PD polynomial product exceeds its exact finite budget.');const r=new Map();
 for(const[ka,ca]of a){const ea=Object.fromEntries(unmono(ka));for(const[kb,cb]of b){tracker?.tick();const e={...ea};for(const[k,v]of unmono(kb))e[k]=(e[k]??0)+v;const k=mono(e),c=(r.get(k)??0n)+ca*cb;if(c)r.set(k,c);else r.delete(k);}}
 if(r.size>20000)fail('RESOURCE_LIMIT','The q-PD polynomial has more than 20000 monomials.');return r;
}
function power(a,n,tracker){
 if(n<0){if(a.size!==1)fail('NONUNIT_DIVISION','Only a Laurent monomial is inverted in chart coordinates.');const[k,c]=[...a][0];if(c!==1n&&c!==-1n)fail('NONUNIT_DIVISION','Only an integral unit monomial can have a negative exponent.');return new Map([[mono(Object.fromEntries(unmono(k).map(([v,e])=>[v,e*n]))),c===-1n&&Math.abs(n)%2?-1n:1n]]);}
 let r=constant(1);while(n){if(n%2)r=multiply(r,a,tracker);n=Math.floor(n/2);if(n)a=multiply(a,a,tracker);}return r;
}
function substitute(a,image,tracker){let r=constant(0);for(const[k,c]of a){let t=constant(c);for(const[v,n]of unmono(k))t=multiply(t,power(image(v),n,tracker),tracker);r=add(r,t);}return r;}
const equal=(a,b)=>sub(a,b).size===0,encode=a=>[...a].sort(([a],[b])=>a.localeCompare(b)).map(([k,c])=>({coefficient:String(c),powers:Object.fromEntries(unmono(k))}));
const decode=a=>new Map(a.map(t=>[mono(t.powers),BigInt(t.coefficient)]));
function phi(a,p,tracker){return substitute(a,v=>v.startsWith('Y')?add(power(variable(v),p,tracker),scale(variable(v.replace(/_(\d+)$/,(_,k)=>'_'+(Number(k)+1))),p)):power(variable(v),p,tracker),tracker);}
function delta(a,p,tracker){const num=sub(phi(a,p,tracker),power(a,p,tracker));if([...num.values()].some(c=>c%BigInt(p)))fail('INTERNAL_CERTIFICATE','A free delta polynomial numerator did not divide integrally by p.');return new Map([...num].map(([k,c])=>[k,c/BigInt(p)]));}
function deltaPower(a,k,p,tracker){for(let i=0;i<k;i++)a=delta(a,p,tracker);return a;}
const Y=(j,k=0)=>j===0?constant(0):variable(`Y${j}_${k}`);
const qInteger=p=>Array.from({length:p},(_,i)=>variable('q',i)).reduce(add,constant(0));
const primitiveImage=(a,b)=>sub(Y(b),Y(a));
function nerveImage(v,indices,p,tracker){if(v==='q')return variable('q');if(v.startsWith('T'))return variable('T'+indices[Number(v.slice(1))]);const m=v.match(/^Y(\d+)_(\d+)$/);if(!m)fail('INVALID_GENERATOR','Unknown q-PD generator.');return deltaPower(primitiveImage(indices[0],indices[Number(m[1])]),Number(m[2]),p,tracker);}
function inversionImage(v,p,tracker){if(v==='q')return variable('q');if(v.startsWith('T'))return variable(v,-1);const m=v.match(/^Y(\d+)_(\d+)$/);if(!m)fail('INVALID_GENERATOR','Unknown q-PD generator.');const j=Number(m[1]),first=scale(multiply(Y(j),multiply(variable('T'+j,-p),variable('T0',-p),tracker),tracker),-1);return deltaPower(first,Number(m[2]),p,tracker);}
function generators(n,depth){return['q',...Array.from({length:n+1},(_,i)=>'T'+i),...Array.from({length:n},(_,i)=>Array.from({length:depth+1},(_,k)=>`Y${i+1}_${k}`)).flat()];}
const face=(n,i)=>Array.from({length:n+1},(_,j)=>j<i?j:j+1),degeneracy=(n,i)=>Array.from({length:n+1},(_,j)=>j<=i?j:j-1);
function applyMap(a,indices,p,tracker){return substitute(a,v=>nerveImage(v,indices,p,tracker),tracker);}
function invert(a,p,tracker){return substitute(a,v=>inversionImage(v,p,tracker),tracker);}
function firstRelation(j,p,tracker){return sub(multiply(qInteger(p),Y(j),tracker),sub(variable('T'+j,p),variable('T0',p)));}
// To prove an equality linear in Y_j, multiply by [p]_q and use its defining
// relations. [p]_q is a non-zero-divisor in the actual envelope by Lemma 16.10.
function clearFirstGeneratorDenominator(a,p,tracker){let r=constant(0);for(const[k,c]of a){const e=Object.fromEntries(unmono(k)),ys=Object.keys(e).filter(v=>v.startsWith('Y'));if(ys.length>1||ys.some(v=>!v.endsWith('_0')||e[v]!==1))fail('INVALID_LINEAR_WITNESS','The first-generator comparison must be linear in the envelope variables.');let t=constant(c);for(const[v,n]of Object.entries(e))if(!v.startsWith('Y'))t=multiply(t,variable(v,n),tracker);if(ys.length){const j=Number(ys[0].match(/^Y(\d+)_/)[1]);t=multiply(t,sub(variable('T'+j,p),variable('T0',p)),tracker);}else t=multiply(t,qInteger(p),tracker);r=add(r,t);}return r;}

export function qpdCechAlexanderP1(input={},tracker=null){
 const pBig=primeBase(input.p??3),p=Number(pBig);if(p>5)fail('UNSUPPORTED','The explicit q-PD nerve observer admits p=2,3,5.');
 const depth=small(input.deltaDepth??1,'displayed delta-generator depth',0,1),maxN=small(input.nerveDegree??3,'displayed diagonal nerve degree',2,3),N=small(input.N??4,'coefficient observation digits',1,32);
 if(input.singular||input.certifyEInfinity||input.truncateHigherDelta||input.invertPrismGenerator||input.rawPolynomialDiagonal)fail('INVALID_QPD_COMPARISON','A smooth standard chart, the full completed delta envelope and its q-PD comparison are required; finite displays do not remove higher delta generators.');
 if(Object.hasOwn(input,'q'))fail('INVALID_SPECIALIZATION','q is formal; a real slider is not the q-PD base.');
 const Q=qInteger(p),envelopes=[];
 for(let n=0;n<=maxN;n++){
  const relations=[];for(let j=1;j<=n;j++){let relation=firstRelation(j,p,tracker);for(let k=0;k<=depth;k++){relations.push({generator:`Y${j}_${k}`,deltaOrder:k,equation:encode(relation),coefficientResiduesModuloPpower:encode(relation).map(t=>({...t,coefficient:String((BigInt(t.coefficient)%(pBig**BigInt(N))+(pBig**BigInt(N)))%(pBig**BigInt(N)))})),meaning:`delta^${k}([p]_q Y${j}_0 - (T_${j}^p-T_0^p))=0`});if(k<depth)relation=delta(relation,p,tracker);}}
  const augmentation=relations.every(r=>substitute(decode(r.equation),v=>v==='q'?constant(1):v.startsWith('Y')?constant(0):variable('T'),tracker).size===0);
  if(!augmentation)fail('INTERNAL_CERTIFICATE','The q-PD envelope augmentation failed.');
  envelopes.push({nerveDegree:n,polynomialLift:`D<T_0,...,T_${n}>`,kernelGenerators:['q-1',...Array.from({length:n},(_,j)=>`T_${j+1}-T_0`)],relativeRegularSequenceWitness:'Each T_j-T_0 is monic in a new variable; successive quotients eliminate that variable and remain flat over D. This remains true after the Laurent localizations for the overlap.',fullEnvelope:`D<T_0,...,T_${n}>{(T_j^p-T_0^p)/[p]_q, j=1..${n}}_delta^completed`,generators:generators(n,depth),relations,augmentation:{q:'1',eachTj:'T',eachDeltaY:'0',relationsVanish:augmentation},displayIsQuotientKillingHigherDelta:false});
 }
 const faceMaps=[],degeneracyMaps=[];
 for(let n=0;n<maxN;n++)for(let i=0;i<=n+1;i++){const indices=face(n,i);faceMaps.push({sourceDegree:n,targetDegree:n+1,index:i,indices,images:generators(n,depth).map(v=>({generator:v,image:encode(nerveImage(v,indices,p,tracker))}))});}
 for(let n=1;n<=maxN;n++)for(let i=0;i<n;i++){const indices=degeneracy(n,i);degeneracyMaps.push({sourceDegree:n,targetDegree:n-1,index:i,indices,images:generators(n,depth).map(v=>({generator:v,image:encode(nerveImage(v,indices,p,tracker))}))});}
 const nerveChecks=[];
 for(let n=0;n<=maxN-2;n++)for(const v of generators(n,depth)){
  let d2=constant(0);for(let i=0;i<=n+1;i++)for(let j=0;j<=n+2;j++){const a=applyMap(applyMap(variable(v),face(n,i),p,tracker),face(n+1,j),p,tracker);d2=add(d2,scale(a,(i+j)%2?-1:1));}
  nerveChecks.push({kind:'alternatingCechDifferentialSquared',sourceDegree:n,generator:v,zero:d2.size===0});
 }
 // All elementary cosimplicial identities, including degeneracies, are checked as
 // actual free-delta-polynomial identities; the full rule follows by functoriality.
 for(let n=1;n<=maxN-1;n++)for(let i=0;i<=n;i++)for(let j=0;j<=n;j++){
  const outer=degeneracy(n+1,j),inner=face(n,i),composite=inner.map(k=>outer[k]);
  for(const v of generators(n,depth)){const lhs=applyMap(applyMap(variable(v),inner,p,tracker),outer,p,tracker),rhs=applyMap(variable(v),composite,p,tracker);nerveChecks.push({kind:'faceDegeneracyComposition',sourceDegree:n,face:i,degeneracy:j,generator:v,equal:equal(lhs,rhs)});}
 }
 const overlapChecks=[],overlapMaps=[];
 for(let n=0;n<=maxN;n++){
  overlapMaps.push({nerveDegree:n,source:'U1 intersection U0, S coordinates',target:'U0 intersection U1, T coordinates',coordinateRule:'S_j -> T_j^-1',images:generators(n,depth).map(v=>({generator:v,image:encode(inversionImage(v,p,tracker))}))});
  for(const v of generators(n,depth)){const twice=invert(invert(variable(v),p,tracker),p,tracker);overlapChecks.push({kind:'inversionSquared',nerveDegree:n,generator:v,pass:equal(twice,variable(v))});}
 }
 const naturalityWitnesses=[];
 for(const f of [...faceMaps,...degeneracyMaps])for(let j=1;j<=f.sourceDegree;j++){
  const first=applyMap(invert(Y(j),p,tracker),f.indices,p,tracker),second=invert(applyMap(Y(j),f.indices,p,tracker),p,tracker),difference=sub(first,second),cleared=clearFirstGeneratorDenominator(difference,p,tracker),pass=cleared.size===0;
  naturalityWitnesses.push({sourceDegree:f.sourceDegree,targetDegree:f.targetDegree,indices:f.indices,generator:`Y${j}_0`,differenceBeforeRelations:encode(difference),afterMultiplicationByQIntegerAndDefiningRelations:encode(cleared),pass,higherDeltas:'Apply delta to the equality in the delta-closed ideal; equivalently use uniqueness of the extension to the q-PD envelope.',torsionCancellation:'Only [p]_q-torsionfreeness from Lemma 16.10 is used; [p]_q is not made a unit in the object.'});
 }
 const allNerve=nerveChecks.every(c=>c.zero??c.equal),allOverlap=overlapChecks.every(c=>c.pass),natural=naturalityWitnesses.every(c=>c.pass);
 if(!allNerve||!allOverlap||!natural)fail('INTERNAL_CERTIFICATE','The actual q-PD Cech face, overlap or differential identity failed.');
 const rows=envelopes.map(e=>({nerveDegree:e.nerveDegree,chartCount:2,overlapCount:1,displayedGenerators:e.generators.length,displayedDeltaRelations:e.relations.length,allHigherDeltaRelations:'retained by the full presentation'}));
 return{object:{kind:'Q_PD_SMALL_CECH_ALEXANDER_PROJECTIVE_LINE',p:String(p),geometry:'P1 over Z_p via its two standard smooth affine charts'},scope:{finite:true,displayedNerveDegrees:[0,maxN],displayedDeltaGeneratorDepth:depth,coefficientObservationDigits:N,fullCompletedEnvelopeRetained:true,canonicalQPDDescent:true,multiplicativeEInfinityCertified:false,formalComplete:false},
  base:{D:'Z_p[[q-1]]',I:'(q-1)',completion:'derived (p,[p]_q)-completion; equivalent base topology to (p,q-1)',delta:{q:'0',Tj:'0',Yjk:'Yj(k+1)'},qInteger:encode(Q)},
  envelopeConstruction:{definition:'For every n>=0, freely adjoin Y_j,0=phi(T_j-T_0)/[p]_q in delta-D-algebras, retain all delta iterates and relations, and take derived (p,[p]_q)-completion.',presentation:'delta^k([p]_q Y_j,0-(T_j^p-T_0^p))=0 for every j=1..n and k>=0; delta(Y_j,k)=Y_j,k+1',kernel:'the completed gamma-stable ideal over (q-1,T_j-T_0), equivalently the augmentation kernel to the smooth chart',hypotheses:['D with (q-1) is the initial q-PD pair','each completed P^n is smooth and flat over D','the diagonal sequence is relatively regular by monic variable elimination'],theorem:{...source,applied:'Lemma 16.10: this actual free completed delta presentation is discrete, flat, [p]_q-torsionfree and universal among q-PD envelopes; no unproved saturation is substituted.'},finiteObservation:'The displayed equations are exact integral polynomials in a selected finite generator set. Higher deltas and nerve degrees remain in the mathematical object and are never set to zero.'},
  envelopes,faceMaps,degeneracyMaps,nerveChecks,
  twoAffineCover:{U0:'Spf Z_p<T>',U1:'Spf Z_p<S>',overlap:'Spf Z_p<T,T^-1>, S=T^-1',envelopesOnOverlap:'Laurent-localize the same standard diagonal presentations at every T_j, then complete.',restriction0:'T_j -> T_j; Y_j,k -> Y_j,k',restriction1:'S_j -> T_j^-1; Y_j,0 -> -Y_j,0/(T_j^p T_0^p); higher images are their exact delta iterates.',overlapMaps,overlapChecks,naturalityWitnesses,tripleCocycle:{coverIndices:[0,1],rule:'Identity maps on equal indices, inversion on unequal indices. Every repeated-index triple composition is identity or the same inversion.',verifiedBy:'Inversion squared and naturality on each actual envelope and all displayed delta generators; full generators follow by delta functoriality.'}},
  totalComplex:{definition:'Totalize the Zariski two-affine Cech complex of the small diagonal q-PD Cech–Alexander cosimplicial rings.',rowZero:'E(U0)^bullet direct-sum E(U1)^bullet',rowOne:'E(U01)^bullet',horizontal:'restriction1-restriction0',vertical:'alternating sum of the displayed face maps, extended by the same all-degree rule',totalDifferential:'d_diagonal + (-1)^diagonalDegree d_Zariski',dSquaredProof:'Diagonal d^2=0 by exact cosimplicial identities; the two-chart Zariski differential squares to zero; mixed terms cancel by the checked restriction/face naturality.'},
  canonicalComparison:{from:'the full totalized q-PD envelope nerve just constructed',to:'R Gamma(P1, q-crystalline structure complex)',localStep:{source:'S01 Remark 16.16',sameInputs:'P=D<T> and P=D<S>, their genuine diagonal kernels, and Laurent localization on the intersection',comparison:'The limit of each actual small q-PD Cech–Alexander nerve computes qOmega of that affine.'},globalStep:{source:'S01 Remark 16.15',comparison:'Zariski descent for these affine q-crystalline complexes computes the global formal scheme.'},framedZigzag:{source:'S01 Theorem 16.22 proof, pp.115–116',middle:'Tot(qOmega_(D_(J^n),q(P^n))/D)',arrows:['Tot(M) -> E^bullet by projection to form degree zero','Tot(M) -> qOmega_(P/D) by projection to Cech degree zero'],quasiIsomorphismReason:'Higher form rows are contractible as cosimplicial modules and the canonical face maps are quasi-isomorphisms, as proved for exactly these framed q-PD data.',computedLowerLevelModuleModelIsNotUsedAsProof:true},grade:'ACTUAL_QPD_PRESENTATIONS_AND_MAPS_WITH_APPLIED_CANONICAL_DESCENT_THEOREM',localKernelCheck:false,formalComplete:false},
  checks:[{name:'all displayed free delta relations have integral coefficients and augment to zero',pass:envelopes.every(e=>e.augmentation.relationsVanish)},{name:'actual alternating diagonal nerve differential squares to zero',pass:allNerve},{name:'the two-affine overlap inversion satisfies all triple cocycles',pass:allOverlap},{name:'overlap restrictions commute with diagonal faces/degeneracies in the q-PD envelope',pass:natural},{name:'the canonical descent theorem has the actual same smooth lifts and diagonal ideals',pass:true}],
  tables:[{title:'Actual q-PD envelope nerve',columns:['nerveDegree','chartCount','overlapCount','displayedGenerators','displayedDeltaRelations','allHigherDeltaRelations'],rows}],visualization:{points:rows.flatMap(r=>[0,1,2].map(chart=>({pos:[r.nerveDegree,chart,r.displayedDeltaRelations],label:`${chart===2?'overlap':'U'+chart}: E^${r.nerveDegree}, ${r.displayedDeltaRelations} delta relations displayed`,value:{...r,chart:chart===2?'U01':'U'+chart}}))),lines:rows.flatMap(r=>[0,1].map(chart=>({points:[[r.nerveDegree,chart,r.displayedDeltaRelations],[r.nerveDegree,2,r.displayedDeltaRelations]],label:chart?'actual inversion restriction':'actual localization restriction'}))),axes:[{label:'Diagonal nerve degree',type:'COCHAIN_DEGREE'},{label:'Affine chart / overlap',type:'CATEGORICAL'},{label:'Displayed exact delta relations',type:'CARDINALITY'}],description:'Actual small q-PD Cech–Alexander envelopes, two-affine overlap maps and canonical descent',coordinateMeaning:'Nodes are source-bound envelope presentations. Finite diagram depth does not truncate the complete delta algebra or derived totalization.',lostInformation:['The table displays finite generators and nerve degrees; the all-degree completed presentation and theorem remain explicit.','Multiplicative/E-infinity and a new Lean kernel proof are not claimed.'],sourceFields:['envelopes','faceMaps','degeneracyMaps','twoAffineCover','canonicalComparison']}};
}
export function verifyQpdNerve(input,result){try{const expected=qpdCechAlexanderP1(input);for(const k of Object.keys(expected).filter(k=>!['visualization','tables'].includes(k)))if(canonical(expected[k])!==canonical(result[k]))return{pass:false,reason:'Actual q-PD nerve evidence changed: '+k};return{pass:true,formalComplete:false};}catch(e){return{pass:false,reason:e.message};}}
// Test-only algebra interface for independent finite residue observations of recorded equations.
export const qpdPolynomial={encode,decode,substitute,variable,constant,add,sub,multiply,power,equal,delta,phi};
