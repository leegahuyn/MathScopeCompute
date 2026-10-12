/** Absolute first slow-jet bounds for the genuine source moving matrix.
 * This computes an ordinary Leibniz/chain-rule bound over its actual AST.
 * Only identified source C2 primitives and proved nonzero denominators are
 * leaves; an unrecognized function or denominator is an explicit failure.
 */
import {assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function actualPulseSensitivityMatrixBounds(G,operator,family,coordinate){
  assertActualCovarianceOperator(operator);
  if(!['R','Z','T'].includes(coordinate)||!operator.families.includes(family))fail('INVALID_INPUT','Use one genuine source family and a fixed-label slow coordinate R, Z or T.');
  const q=(n,d=1)=>G.q(n,d),B=operator.constants.Bnorm,k=operator.geometry.k,Ls=operator.geometry.Ls,variable=operator.coordinates[coordinate],frame=family.frame;
  const primitive=new Map(),lower=new Map(),cache=new Map(),rows=[];
  const put=(root,value,derivative,reason)=>{const entry={root,value,derivative,reason,rule:'authenticated source primitive'};primitive.set(root,entry);return entry;};
  const Bpower=n=>G.pow(B,n),invB=G.inv(B),normalFloor=G.div(invB,k);
  put(operator.coordinates.R,B,coordinate==='R'?G.one:G.zero,'Actual enlarged source chart has R and R^-1 <= B.');
  put(operator.coordinates.v,Ls,G.zero,'Hold pulse time v fixed in a slow partial derivative, 0<=v<=Ls.');
  for(const field of [operator.fields.F,operator.fields.G])for(const root of [field,...['R','Z','T'].map(c=>G.derivative(field,operator.coordinates[c]))])put(root,B,B,'Actual completed enlarged C2 norm, including mixed R/Z/T second derivatives, is a summand of B.');
  for(const root of [family.phaseDerivatives.R,family.phaseDerivatives.Z])put(root,Bpower(8),Bpower(8),'p and pz are fixed labels with magnitude <=B^5; all first and second slow F/G derivatives are <=B, so two products are <=B^8.');
  for(const root of [family.carrier.p,family.carrier.pz])put(root,Bpower(5),G.zero,'Original frozen carrier bound; nearest nonzero integer and representative stay fixed during differentiation.');
  put(family.carrier.x0,Bpower(8),G.zero,'x0=sign*Bs*u/2 is fixed; Bs,u<=B and B>=2^128.');
  for(const root of [operator.constants.u,operator.frozen.c0,operator.frozen.lambda0])put(root,B,G.zero,'Original frozen source upper bound; frozen representatives are not differentiated.');
  put(operator.geometry.epsilon,G.one,G.zero,'Q and the positive original h are fixed within a band; 0<epsilon<=1.');
  put(k,k,G.zero,'The original exact ceiling carrier is frozen.');
  put(Ls,Ls,G.zero,'The selected band length is fixed in slow derivatives.');
  lower.set(operator.coordinates.R,invB);lower.set(Ls,invB);lower.set(k,G.one);lower.set(operator.frozen.c0,invB);
  lower.set(frame.nt,normalFloor);lower.set(frame.nSquared,G.pow(normalFloor,2));
  lower.set(G.nodes[frame.nt].args[0],G.pow(normalFloor,2));
  lower.set(frame.J[1][0],invB);
  const rootReference=G.sqrt(G.add(G.one,G.pow(frame.s,2))),rootU=G.sqrt(G.add(G.one,G.pow(operator.constants.u,2)));
  lower.set(rootReference,G.one);lower.set(G.nodes[rootReference].args[0],G.one);lower.set(rootU,G.one);lower.set(G.nodes[rootU].args[0],G.one);
  const absRational=id=>{const [n,d]=G.fraction(id);return q(n<0n?-n:n,d);};
  const floor=id=>{
    if(lower.has(id))return lower.get(id);const n=G.nodes[id];let result;
    if(n.op==='rational'){if(G.fraction(id)[0]===0n)fail('INVALID_SOURCE_CONSTRUCTION','Zero cannot have a positive denominator bound.');result=absRational(id);}
    else if(n.op==='multiply')result=G.mul(...n.args.map(floor));
    else if(n.op==='integer_power'&&n.args[1]>0)result=G.pow(floor(n.args[0]),n.args[1]);
    else if(n.op==='sqrt_positive')result=G.sqrt(floor(n.args[0]));
    else fail('UNSUPPORTED','No proved source denominator lower bound for '+n.op+' root '+id+'.');
    lower.set(id,result);return result;
  };
  const visit=id=>{
    if(cache.has(id))return cache.get(id);
    if(primitive.has(id)){const row=primitive.get(id);cache.set(id,row);rows.push(row);return row;}
    const n=G.nodes[id],at=n.args;let value,derivative,inputs=[],rule;
    if(n.op==='rational'){value=absRational(id);derivative=G.zero;rule='absolute rational constant';}
    else if(n.op==='add'){
      const a=visit(at[0]),b=visit(at[1]);value=G.add(a.value,b.value);derivative=G.add(a.derivative,b.derivative);inputs=[a.root,b.root];rule='triangle inequality, both derivative summands';
    }else if(n.op==='multiply'){
      const a=visit(at[0]),b=visit(at[1]);value=G.mul(a.value,b.value);derivative=G.add(G.mul(a.derivative,b.value),G.mul(a.value,b.derivative));inputs=[a.root,b.root];rule='ordinary two-term Leibniz rule';
    }else if(n.op==='inverse'){
      const a=visit(at[0]),l=floor(at[0]);value=G.inv(l);derivative=G.div(a.derivative,G.pow(l,2));inputs=[a.root];rule='inverse derivative with proved absolute denominator lower bound';
    }else if(n.op==='integer_power'&&at[1]>=0){
      const a=visit(at[0]);value=G.pow(a.value,at[1]);derivative=at[1]===0?G.zero:G.mul(q(at[1]),G.pow(a.value,at[1]-1),a.derivative);inputs=[a.root];rule='ordinary integer power derivative';
    }else if(n.op==='sqrt_positive'){
      const a=visit(at[0]);value=G.sqrt(a.value);derivative=a.derivative===G.zero?G.zero:G.div(a.derivative,G.mul(q(2),floor(id)));inputs=[a.root];rule='positive square-root derivative with proved lower bound';
    }else if(n.op==='smooth_piecewise'){
      // Differentiating a fixed integer-carrier branch in the old graph
      // retains choose(selector,0,0,0). Its exact zero is not a field
      // approximation. A moving branch with unequal jets is not accepted.
      const branches=at.slice(3).map(visit);
      if(at.slice(0,3).some(x=>G.dependsOn(x,variable))&&!branches.every(x=>x.value===G.zero&&x.derivative===G.zero))fail('UNSUPPORTED','A moving piecewise boundary needs its own matched-jet source bound.');
      value=G.maximum(...branches.map(x=>x.value));derivative=G.maximum(...branches.map(x=>x.derivative));inputs=branches.map(x=>x.root);rule='uniform bound over fixed-label branches; exact zero branches preserved';
    }else fail('UNSUPPORTED','No authenticated first slow-jet primitive for '+n.op+' root '+id+'.');
    const row={root:id,value,derivative,inputs,rule};cache.set(id,row);rows.push(row);return row;
  };
  const entries=frame.wMatrix.map(r=>r.map(visit)),basisEntries=frame.B.map(r=>r.map(visit));
  const rowNorms=entries.map(row=>({value:G.add(...row.map(x=>x.value)),derivative:G.add(...row.map(x=>x.derivative))}));
  const matrixNorm=G.maximum(operator.constants.matrixNorm,...rowNorms.map(x=>x.value)),matrixDerivativeNorm=G.maximum(...rowNorms.map(x=>x.derivative));
  if([matrixNorm,matrixDerivativeNorm].some(id=>G.freeCoordinates(id).size))fail('INVALID_SOURCE_CONSTRUCTION','The uniform first-jet bound must depend only on the fixed source and band, not on a sample or pulse time.');
  const basisNorm=G.maximum(...basisEntries.map(r=>G.add(...r.map(x=>x.value)))),basisDerivativeNorm=G.maximum(...basisEntries.map(r=>G.add(...r.map(x=>x.derivative))));
  return {schema:'MathScope.ActualPulseSensitivityMatrixBounds/1',coordinate,variable,matrixNorm,matrixDerivativeNorm,basisNorm,basisDerivativeNorm,rows,rowNorms,entryBounds:entries,basisEntryBounds:basisEntries,
    sourcePremises:{B,sourceParameterExpressionSHA256:operator.parameterExpressionSHA256,actualCompletedC2Roots:structuredClone(operator.background.roots),BLower:'2^128',
      normalFloor,normalFloorProof:'|n_tan|>=|p|/R>=1/(k B): k*p is a nonzero integer and R<=B. This does not require the displayed band to satisfy q<qStar.',
      scalarLowerProof:'|c0|>=Renv^-6>=1/B; sqrt(1+sref^2)>=1; Ls>=2*r0*S>=2^-33>=1/B.',
      frozenParameters:'Q, ell, ceiling/rounding carrier, representative X/eta/s, u,c0,lambda0,Ls are held fixed.'},
    domain:{sourceProfile:operator.sourceProfile,slowPoint:structuredClone(operator.chart.domain),v:'0<=v<=Ls',chart:'BAND_CHART_Q_FIXED',derivative:'ordinary first slow '+coordinate+' derivative at fixed v and fixed labels',bound:'continuous entire declared enlarged source chart; endpoint derivatives are one-sided'},
    sourceDerived:true,finiteSampleInference:false,suppliedConstant:false,secondSlowDerivativeBound:false};
}
