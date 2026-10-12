import {actualLeadingAllOrderJets} from '../actual-leading-all-order-jets.mjs';
import {implicitCatalanCoefficients,physicalXConversion,PositiveTaylorLedger} from '../actual-leading-all-order-jets-arithmetic.mjs';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {sourceAllOrderCutoffJets} from '../actual-residual-order-induction-kernels.mjs';
import {createHash} from 'node:crypto';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const receipt=actualLeadingAllOrderJets({radialOrder:3,etaOrder:14}),G=new ActualSourceExpressions(),L=new PositiveTaylorLedger(G),toy={};
for(const n of [0,1,2,5,9,14,19]){
  toy['inverse'+n]=L.inverse('inverse',n,G.q(5),G.one);
  toy['sqrt'+n]=L.squareRoot('sqrt',n,G.q(5),G.one);
  toy['exp'+n]=L.exponential('exp',n,G.q(2));
  toy['log'+n]=L.logarithm('log',n,G.q(5),G.one);
  toy['implicit'+n]=L.implicit('implicit',n,G.q(3),G.q(2),G.q(2));
}
const summaryRequests=[];
for(const [r,m]of [[0,0],[2,6],[13,0],[0,17],[6,17],[10,24]]){
  const a=actualLeadingAllOrderJets({radialOrder:r,etaOrder:m});
  summaryRequests.push({radialOrder:r,etaOrder:m,pass:a.pass,checks:a.checks,nodes:a.normProgram.nodes.length,
    rows:a.normProgram.ledger.length,sourceFunctionIdentity:a.sourceFunctionIdentity,
    receiptSHA256:createHash('sha256').update(canonicalStringify(a)).digest('hex'),scope:a.scope});
}
process.stdout.write(JSON.stringify({schema:'MathScope.ActualLeadingAllOrderIndependentFixture/1',receipt,
  receiptSHA256:createHash('sha256').update(canonicalStringify(receipt)).digest('hex'),summaryRequests,
  implicit:implicitCatalanCoefficients(28),conversions:Array.from({length:25},(_,r)=>physicalXConversion(r,7)),
  cutoff:sourceAllOrderCutoffJets({order:25}),toy:G.pack(toy,{universalArithmeticOnly:true})}));
