import {fileURLToPath} from 'node:url';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualCovarianceExpressions} from '../actual-covariance-volterra.mjs';
import {actualMovingPulseFrame} from '../actual-covariance-matrix.mjs';
import {actualOperatorPowerAudit} from '../actual-covariance-operator-bounds.mjs';
import {covarianceConcentrationScalarAudit} from '../actual-covariance-concentration.mjs';
import {covarianceConePolynomialAudit} from '../actual-covariance-uniform.mjs';
import {uniformSupportPalette} from '../source-support.mjs';

export function covarianceKernelFixture(){
  const G=new ActualCovarianceExpressions(new ActualConvergentExpressions()),node=x=>{const [n,d='1']=String(x).split('/');return G.q(n,d);},matrixCases=[];
  for(let i=0;i<12;i++){
    const request={F:(i+2)+'/3',FR:'-'+(i+5)+'/7',GR:(i+7)+'/19',R:(i+3)+'/2',epsilon:'1/4',k:'2',p:(i%2?'-':'')+(i+1)+'/2',pz:(i-13)+'/29',x0:(i+9)+'/31',Ls:(i+5)+'/2',u:'3',c0:'-2/3',lambda0:'7/11',HR:(i-5)+'/13',HZ:(i+1)+'/17'};
    const v=G.fresh('independent_moving_time'),input=Object.fromEntries(Object.entries(request).map(([k,x])=>[k,node(x)])),frame=actualMovingPulseFrame(G,{...input,v,sign:i%2?1:-1});
    matrixCases.push({request,sign:i%2?1:-1,vValue:(i+1)+'/37',vNode:v,frame});
  }
  const volterraCases=[];
  for(const matrixPolynomials of [[[['1/3'],['1/2']],[['-2/5'],['1/7']]],[[['0','1/3'],['1/2']],[['-1/5','1/7'],['-1/4']]]]){
    const v=G.fresh('independent_Volterra_time'),matrix=matrixPolynomials.map(row=>row.map(coefficients=>G.add(...coefficients.map((a,j)=>G.mul(node(a),G.pow(v,j)))))),length=node('3/4'),system=G.defineCovarianceVolterra({name:'IndependentActualKernel',variable:v,parameters:[],matrix,normUpper:G.q(2),length});
    const rows=Array.from({length:9},(_,terms)=>G.covariancePartialSum(system,{terms}));
    volterraCases.push({matrixPolynomials,vNode:v,vValue:'3/4',norm:'2',length:'3/4',system,rows});
  }
  const p=uniformSupportPalette();
  return {schema:'MathScope.ActualCovarianceSourceIndependentFixture/1',nodes:G.nodes,matrixCases,volterraCases,
    powerAudit:actualOperatorPowerAudit(),scalarAudit:covarianceConcentrationScalarAudit(),coneAudit:covarianceConePolynomialAudit(),
    palette:{matrixPowers:p.matrixPowers,paletteSize:p.paletteSize,modulus:p.modulus,r0Exact:p.r0Exact,allOrderedCenterConstraints:p.allOrderedCenterConstraints,enlargedRectangleSeparation:p.enlargedRectangleSeparation,pass:p.pass},
    sourceFieldCertificate:false,actualSourceReplacedByTheseNumbers:false};
}
if(process.argv[1]===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(covarianceKernelFixture()));
