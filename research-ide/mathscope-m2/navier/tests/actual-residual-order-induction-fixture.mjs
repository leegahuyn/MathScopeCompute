/** Export the EXECUTED universal matrix, not a separately typed fixture.
 * The finite rational substitutions in the Python consumer test an
 * operator identity. They are never substituted for actual source fields
 * in the coefficient producer or its norm certificate.
 */
import {prepareActualCompletedBackgroundC2,actualBackgroundSymbolicPrefix} from '../actual-residual-order-induction-background.mjs';
import {sourceAllOrderCutoffJets,sourceNormalizedCutoffWeights,sourceAllOrderNaturalJetBound,positiveOrderInductionRecipe} from '../actual-residual-order-induction-kernels.mjs';
import {createHash} from 'node:crypto';

const r=prepareActualCompletedBackgroundC2({order:4}),G=r.G,p=r.parametricPDE,nodes=[],memo=new Map(),atomic=new Map();
for(const[name,id]of Object.entries(p.verificationSlots)){
  if(Array.isArray(id))id.forEach((v,j)=>atomic.set(v,name+j));else atomic.set(id,name);
}
function copy(id){
  if(memo.has(id))return memo.get(id);
  let node;if(atomic.has(id))node={op:'verification_slot',args:[atomic.get(id)]};
  else{
    const n=G.nodes[id];
    if(n.op==='rational')node=n;
    else if(n.op==='add'||n.op==='multiply')node={op:n.op,args:n.args.map(copy)};
    else if(n.op==='inverse')node={op:n.op,args:[copy(n.args[0])]};
    else if(n.op==='integer_power')node={op:n.op,args:[copy(n.args[0]),n.args[1]]};
    else throw Error('The universal matrix exposed an unexpected unbound source operation: '+n.op);
  }
  const out=nodes.length;nodes.push(node);memo.set(id,out);return out;
}
const actualKernel={nodes,matrix0:p.actualKernelExpressions.matrix0.map(row=>row.map(copy)),matrix1:p.actualKernelExpressions.matrix1.map(row=>row.map(copy)),forcing:p.actualKernelExpressions.forcing.map(copy),
  scope:'Universal algebra verification slots only; actual coefficient/source norm construction retains its separately bound actual functions.'};
const dyadic=actualBackgroundSymbolicPrefix(r,{anchorOrder:1,dyadicBand:true}),weights=[];
for(const n of [1,2,5,23])for(const m of [0,1,2,7,16])weights.push(sourceNormalizedCutoffWeights({order:n,derivativeOrder:m}));
const natural=[];for(const r of [0,1,5,16])for(const m of [0,2,7,20])natural.push(sourceAllOrderNaturalJetBound({radialLogOrder:r,etaOrder:m}));
const output={schema:'MathScope.ActualResidualOrderInductionIndependentFixture/1',actualKernel,
  sourceCertificate:{profileId:r.program.profileId,parameterExpressionSHA256:r.program.parameterExpressionSHA256,checks:r.checks,
    generatedOrders:r.prepared.order,actualSystems:r.systems.map(s=>({order:s.order,kind:s.kind,checks:s.checks,bindings:s.bindings,pass:s.pass})),
    actualMomentChecks:r.moments,allOrders:r.induction,scope:r.program.scope,
    canonicalNormRequests:r.cutoffs.rows.map(row=>row.canonicalNormRequest),normalizedFiniteBlock:{orders:r.chart.finiteBlock.finite.map(x=>x.order),tailStarts:r.chart.finiteBlock.tailStarts},
    actualSlowOperatorRows:r.chart.operatorRows.map(row=>({name:row.name,exact:row.exact})),
    dyadic:{kind:dyadic.bandSelection.kind,possibleOrders:dyadic.rows.map(row=>row.order),offFrom:dyadic.exactInactiveTail.from,plateauThrough:dyadic.exactPlateau.through,
      ellOperation:G.nodes[dyadic.ell].op,QOperation:G.nodes[dyadic.Q].op,qDerivativePreserved:dyadic.qDerivativePreserved,thisFiniteBandEqualsAllBands:dyadic.thisFiniteBandEqualsAllBands}},
  cutoff:sourceAllOrderCutoffJets({order:25}),weights,natural,recipes:[1,2,3,4,17,45].map(positiveOrderInductionRecipe)};
output.actualKernelSHA256=createHash('sha256').update(JSON.stringify(actualKernel)).digest('hex');
process.stdout.write(JSON.stringify(output));
