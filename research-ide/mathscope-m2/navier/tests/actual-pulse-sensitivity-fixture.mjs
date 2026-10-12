// Exact algebra controls for independent Fraction/Decimal verification.
// These small coefficients are never marked as the actual N3 source.
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseSensitivityExpressions} from '../actual-pulse-sensitivity-kernel.mjs';
const G=new ActualPulseSensitivityExpressions(new ActualConvergentExpressions(),{maxNodes:3000000}),v=G.fresh('control_v'),a=G.fresh('control_a');
const common={name:'independent non-source control',variable:v,parameters:[a],parameter:a,left:G.zero,length:G.one,matrixNorm:G.q(8),matrixDerivativeNorm:G.q(4),initialNorm:G.q(2),initialDerivativeNorm:G.q(2),leftDerivativeNorm:G.zero};
const id=G.definePulseFirstVariation({...common,matrix:[[G.mul(a,v),G.add(G.one,a)],[v,G.neg(G.div(a,G.q(2)))]],initial:[G.add(G.one,a),G.pow(a,2)]});
const orders=[0,1,2,3,4,5].map(terms=>({terms,roots:G.pulseSensitivityPartialSum(id,{terms}).values}));
const movingId=G.definePulseFirstVariation({...common,matrix:[[G.zero,a],[G.zero,G.zero]],initial:[G.add(G.one,a),G.one],left:G.div(a,G.q(4)),leftDerivativeNorm:G.q(1,4)}),moving=G.pulseSensitivityPartialSum(movingId,{terms:2});
const end=G.add(G.q(1,2),G.div(a,G.q(2))),atEnd=G.add(G.substitute(moving.values[2],v,end),G.mul(a,G.q(1,2)));
const exponentialId=G.definePulseFirstVariation({...common,matrix:[[a,G.zero],[G.zero,G.zero]],initial:[G.add(G.one,a),G.zero],matrixNorm:G.one,matrixDerivativeNorm:G.one,initialDerivativeNorm:G.one});
const tails=[4,8,12].map(terms=>{const p=G.pulseSensitivityPartialSum(exponentialId,{terms});return {terms,value:p.values[2],tail:p.tail};});
console.log(JSON.stringify({schema:'MathScope.PulseSensitivityIndependentControls/1',actualSource:false,nodes:G.nodes,coordinates:{v,a},matrixDerivative:G.pulseSensitivitySystems[id].matrixDerivative,
  orders,moving:{values:moving.values,initial:G.pulseSensitivitySystems[movingId].variationInitial,totalEndpointDerivative:atEnd},tails}));
