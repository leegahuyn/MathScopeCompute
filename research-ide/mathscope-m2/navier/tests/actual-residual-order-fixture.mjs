import {actualResidualOrderCertificate} from '../actual-residual-order.mjs';
const first=actualResidualOrderCertificate({bits:128,mesh:8});
const cases=[];
for(const bits of [96,128,192])for(const mesh of [4,8,16]){
  const c=actualResidualOrderCertificate({bits,mesh});
  cases.push({request:c.request,domain:c.domain,exactExpressions:c.exactExpressions,pointRows:c.pointRows,timeRows:c.timeRows,checks:c.checks,scope:c.scope});
}
process.stdout.write(JSON.stringify({schema:'MathScope.ActualResidualIndependentFixture/1',program:first.residualProgram,norms:first.sourceNorms,cases}));
