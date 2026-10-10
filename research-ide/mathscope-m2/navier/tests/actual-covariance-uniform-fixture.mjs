import {actualCovarianceUniformSourceCertificate,covarianceConePolynomialAudit,certifyCovariancePerturbationBox,exactFrozenPulsePrincipalOperator} from '../actual-covariance-uniform.mjs';

const boxCases=[1,4,16,256,65536].map(d=>{
  const request={kappa:'1/'+d,targetSlope:['-'+(16*d-1)+'/'+(16*d),(16*d-1)+'/'+(16*d)],columnErrors:Array.from({length:2},()=>Array.from({length:2},()=>['-1/'+(128*d),'1/'+(128*d)]))};
  return{request,result:certifyCovariancePerturbationBox(request)};
});
const operatorCases=Array.from({length:24},(_,i)=>{
  const request={R:(i+3)+'/2',F:(i+2)+'/3',FR:'-'+(i+5)+'/7',FZ:(i-11)+'/13',G:(i-5)+'/17',GR:(i+7)+'/19',GZ:(i-9)+'/23',p:(i%2?'-':'')+(i+1)+'/2',pz:(i-13)+'/29',epsilon:'1/4',k:2,x0:(i+9)+'/31',v:(i+1)+'/37',forcing:[(i-5)+'/7',(i+6)+'/11',(i-8)+'/13']};
  return{request,result:exactFrozenPulsePrincipalOperator(request)};
});
const base=operatorCases[5].request;
const negativeControls={columnBudget:covarianceConePolynomialAudit({columnErrorDivisor:4}),freezeBudget:covarianceConePolynomialAudit({freezeErrorDivisor:4}),movingNormal:exactFrozenPulsePrincipalOperator(base,{omitMovingNormal:true}),connections:exactFrozenPulsePrincipalOperator(base,{omitCylindricalConnections:true}),incompatibleDatum:exactFrozenPulsePrincipalOperator({...base,amplitude:[1,0,0]})};
process.stdout.write(JSON.stringify({schema:'MathScope.ActualCovarianceUniformIndependentFixture/1',source:actualCovarianceUniformSourceCertificate(),boxCases,operatorCases,negativeControls}));
