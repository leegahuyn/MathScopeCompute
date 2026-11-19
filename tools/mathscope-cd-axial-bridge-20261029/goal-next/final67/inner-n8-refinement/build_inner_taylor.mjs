/** Actual signed Taylor coefficients for original positive inner profiles; leading field stays exact. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goal,runtime,output]=process.argv.slice(2);
assert.equal(process.argv.length,5);
const sha=x=>createHash('sha256').update(x).digest('hex');
const load=async(relative,pin)=>{const b=await readFile(resolve(goal,relative));assert.equal(sha(b),pin);return JSON.parse(b);};
const nativePin='19ac2bfde61e1a9808a2a9f4aa324a2d634fed376fcc2084d886500a164255d3';
const boundsPin='4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638';
const native=await load('whole-k-inner-axis/inner-axis-native.json',nativePin);
const bounds=await load('whole-k-inner-axis/inner-axis-jet-bounds.json',boundsPin);
for(const [name,pin] of Object.entries(bounds.originalRuntime.runtimeGitBlobs)){
 const bytes=await readFile(resolve(runtime,name));
 const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(blob,pin,name);
}
const {prepareActualOrderInduction,assertActualOrderInduction}=await import(pathToFileURL(resolve(runtime,
 'research-ide/mathscope-m2/navier/actual-residual-order-induction-source.mjs')).href);
const prepared=prepareActualOrderInduction({order:3,maxNodes:2200000});
assert.equal(assertActualOrderInduction(prepared),true);
const {G,records,bootstrap}=prepared,baseCount=G.nodes.length;
assert.equal(baseCount,native.originalNodeCount);
const baseHash=sha(JSON.stringify(G.nodes));assert.equal(baseHash,native.originalNodes);
const Lambda=G.parameter('Lambda'),eta=bootstrap.constants.eta;
const Y=G.fresh('inner_signed_taylor_Y'),anchor=G.div(G.q(2),Lambda),shift=G.sub(Y,G.q(2));
const factorial=k=>{let v=1n;for(let j=2;j<=k;j++)v*=BigInt(j);return v;};
const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const coefficients=[],polynomials=[],allRoots=[];
for(let n=1;n<=3;n++){
 const raw=records[n].raw;assert.equal(raw.system,native.rows[n-1].actualSystem);
 for(const [field,component] of [['F',0],['U',1],['Pi',3]])for(let t=0;t<=3;t++){
  const coeff=[];
  for(let k=0;k<=8;k++){
   const derivativeRoot=G.picardEven(raw.system,component,anchor,eta,k,t);
   assert.deepEqual(G.nodes[derivativeRoot],{op:'actual_background_even_profile',args:[raw.system,component,anchor,eta,k,t]});
   const coefficientRoot=G.mul(derivativeRoot,G.pow(Lambda,-k),G.q(1n,factorial(k)));
   coeff.push(coefficientRoot);coefficients.push({n,field,component,t,k,derivativeRoot,coefficientRoot});
  }
  for(const degree of [4,8]){
   const root=G.add(...coeff.slice(0,degree+1).map((c,k)=>G.mul(c,G.pow(shift,k))));
   const axisValueRoot=G.substitute(root,Y,G.zero);
   const axisCorrectedRoot=G.sub(root,axisValueRoot);
   const row={n,field,t,degree,root,axisValueRoot,axisCorrectedRoot};
   allRoots.push(axisCorrectedRoot);
   if(field==='U'){
    const moments=Array.from({length:degree+1},(_,k)=>G.add(...Array.from({length:k+1},(_,l)=>
     G.mul(G.q(choose(k,l)*((-2n)**BigInt(k-l)),BigInt(l+1)),G.pow(Y,l)))));
    row.stokesAverageRoot=G.add(...coeff.slice(0,degree+1).map((c,k)=>G.mul(c,moments[k])));
    row.stokesAverageAxisCorrectedRoot=G.sub(row.stokesAverageRoot,axisValueRoot);
    allRoots.push(row.stokesAverageRoot,row.stokesAverageAxisCorrectedRoot);
   }
   polynomials.push(row);allRoots.push(root);
  }
 }
}
const coefficientClosure=new Map();
function visit(id){
 if(coefficientClosure.has(id))return;
 const row=G.nodes[id];coefficientClosure.set(id,row);
 if(['rational','source_parameter','coordinate','actual_background_even_profile'].includes(row.op))return;
 const children=row.op==='integer_power'?row.args.slice(0,1):row.args;
 assert.ok(['add','multiply','inverse','integer_power'].includes(row.op),row.op);
 children.forEach(visit);
}
allRoots.forEach(visit);visit(anchor);visit(Lambda);visit(Y);
assert.equal(sha(JSON.stringify(G.nodes.slice(0,baseCount))),baseHash);
const result={status:'VERIFIED_ORIGINAL_INNER_SIGNED_TAYLOR_POLYNOMIAL_SOURCE',
 sourcePins:{native:nativePin,innerBounds:boundsPin,originalNodePrefix:baseHash},
 runtimeGitBlobs:bounds.originalRuntime.runtimeGitBlobs,
 originalNodeCount:baseCount,extendedNodeCount:G.nodes.length,Y,Lambda,eta,anchorX:anchor,
 coefficientFormula:'D_X^k D_eta^t actual_f_n(2/Lambda,eta)/(Lambda^k*k!)',
 coefficients,polynomials,records:Object.fromEntries([...coefficientClosure].sort((a,b)=>a[0]-b[0])),
 domain:'0<=Y=Lambda*X<=4; original whole-K eta/time/angle domain, including axis and inner-side smooth face',
 reconstruction:'Keep original leading n0 exact. Replace n1..3 F,U,Pi by axis-corrected signed polynomials P_N(Y)-P_N(0), preserving actual zero axis data; U Stokes average uses their exact integral. Retain original chi(b_n*q) q^(2*n*h). All n>=4 vanish by the existing actual selector receipt.',
 sourceAnalyticNorms:native.rows.map(row=>({n:row.n,...row.analytic})),
 scope:'Native coefficient operands and signed finite polynomials executed. Coefficient numerical values, full nonlinear force-energy integrals, annular refinements and global N8 acceptance are not asserted.',
 N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,coefficients:coefficients.length,polynomialFamilies:polynomials.length,
 originalNodeCount:baseCount,extendedNodeCount:G.nodes.length,retainedRecords:coefficientClosure.size}));
