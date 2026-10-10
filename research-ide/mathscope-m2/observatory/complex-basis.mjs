import {matrix,identity,zero,multiply,equalMatrix} from '../../mathscope-m1/arithmetic/exact.mjs';
import {p1Model,p1Retraction,checkComplex,checkRetraction,checkChainMap} from '../../mathscope-m1/arithmetic/complex.mjs';

/** Integral unimodular coordinate changes, including a non-permutation shear. */
export function basisChange(n,mode){
  if(mode==='ORIGINAL')return {B:identity(n),inverse:identity(n)};
  if(mode==='REVERSE'){
    const B=matrix(n,n,Array.from({length:n},(_,i)=>[n-1-i,i,1]));return {B,inverse:B};
  }
  if(mode!=='SHEAR')throw Error('Unknown basis change');
  return {B:matrix(n,n,[...identity(n).entries,...(n>1?[[0,1,1]]:[])]),inverse:matrix(n,n,[...identity(n).entries,...(n>1?[[0,1,-1]]:[])])};
}
export function transportComplex(C,mode){
  const changes=C.dims.map(n=>basisChange(n,mode));
  const B=changes.map(x=>x.B),inverse=changes.map(x=>x.inverse);
  if(B.some((b,k)=>!equalMatrix(multiply(inverse[k],b),identity(C.dims[k]))))throw Error('Noninvertible basis map');
  return {complex:{...C,basis:C.basis.map((xs,k)=>xs.map((_,i)=>({id:`${mode}:C${k}:b${i}`,inOriginal:B[k].entries.filter(([,j])=>j===i).map(([row,,coefficient])=>({basis:xs[row],coefficient}))}))),differentials:C.differentials.map((d,k)=>multiply(multiply(inverse[k+1],d),B[k]))},B,inverse};
}
export async function complexBasis(input){
  const source=await p1Model({p:input.p,N:input.N,D:input.D,filtrationKind:'hodge',filtrationIndex:1});
  const a=transportComplex(source.complex,input.basis),t=transportComplex(source.frobenius.target,input.basis),C=a.complex,R=source.retraction;
  const retraction={...R,i:R.i.map((m,k)=>multiply(a.inverse[k],m)),r:R.r.map((m,k)=>multiply(m,a.B[k])),h:R.h.map((m,k)=>k?multiply(multiply(a.inverse[k-1],m),a.B[k]):zero(0,C.dims[0]))};
  const maps=source.frobenius.maps.map((m,k)=>multiply(multiply(t.inverse[k],m),a.B[k]));
  const filtration={...source.filtration,inclusion:source.filtration.inclusion.map((m,k)=>multiply(a.inverse[k],m))};
  const checks=[{name:'integral transformed d²',...checkComplex(C)},{name:'integral transformed deformation retract',...checkRetraction(C,retraction)},{name:'Frobenius with transformed source and target',...checkChainMap(C,t.complex,maps)},{name:'Hodge inclusion after basis change',...checkChainMap(filtration,C,filtration.inclusion)}];
  // Cohomology action is also computed from a separately transported target retract.
  const targetR=transportRetraction(source.frobenius.target,t);
  const action=maps.map((F,k)=>multiply(multiply(targetR.r[k],F),retraction.i[k]));
  checks.push({name:'cohomology Frobenius unchanged',pass:action.every((m,k)=>equalMatrix(m,source.frobenius.transported[k]))});
  const moduleLedger=C.dims.map((n,k)=>({degree:k,chainRank:n,imageGenerators:k?C.differentials[k-1]:zero(n,0),kernelGenerators:{boundaries:k?C.differentials[k-1]:zero(n,0),cohomology:retraction.i[k]},kernelCompleteness:'For d x=0, x=i r x + d h x follows from the verified integral homotopy identity; valid over Z and after any coefficient base change.',cohomology:source.smith.cohomology['H'+k]}));
  return {status:'COMPLETED',source,complex:C,retraction,frobenius:{maps,target:t.complex,transported:action},filtration,comparison:source.comparison,cohomology:source.smith.cohomology,change:{mode:input.basis,B:a.B,inverse:a.inverse,targetB:t.B,targetInverse:t.inverse},moduleLedger,checks,scope:'Exact integral basis transport of the source P1 complex, its kernel/image presentations, Frobenius and Hodge inclusion. External geometric comparisons retain their existing theorem-reference grade.',formalComplete:false};
}
function transportRetraction(C,a){const R=p1Retraction(C);return {...R,i:R.i.map((m,k)=>multiply(a.inverse[k],m)),r:R.r.map((m,k)=>multiply(m,a.B[k]))};}
