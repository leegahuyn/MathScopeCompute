import {fileURLToPath} from 'node:url';
import {actualStressDirectionBounds,flatKernelAudit,directionCPowerAbsorption} from '../actual-stress-direction-bounds.mjs';
import {innerMomentDifferenceAlgebra,innerStressDifferenceAlgebra,outerStressFactorAlgebra} from '../actual-stress-direction-program.mjs';
import {rational as q,qadd,qsub,qmul,qdiv,qneg,qpow,qtext} from '../actual-continuation-arithmetic.mjs';

const G={q,one:q(1),zero:q(0),add:(...a)=>a.reduce(qadd,q(0)),mul:(...a)=>a.reduce(qmul,q(1)),sub:qsub,div:qdiv,neg:qneg,pow:qpow};
const encode=x=>Array.isArray(x)&&x.length===2&&typeof x[0]==='bigint'?qtext(x):Array.isArray(x)?x.map(encode):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,encode(v)])):x;

export function directionAlgebraFixtures(){
  const cases=[];
  for(let i=0;i<40;i++){
    const h=q(i+1,10007),eta=q(i%17-8,8),r=q(i+5,7),X=qdiv(qmul(r,r),q(2)),D=qsub(q(1,2),h),A=qadd(q(1,2),h),d=qsub(q(1),qmul(eta,eta)),L=qsub(q(1),G.mul(q(2),h,eta,eta));
    const names=['M','Meta','I','Ieta','J','Jeta','S','Seta','Cp','Cpeta'];
    const reference=Object.fromEntries(names.map((k,j)=>[k,q((i+5)*(j-4),37+j)])),momentDifference=Object.fromEntries(names.map((k,j)=>[k,q((i-9)*(j+2)+1,17+j)]));
    const F=q(i+11,17),U=q(i-15,19),a=q(1+i%7,13),FOver=q(i%13-6,23),uOver=q(i%11-5,29),p1=q(i+3,31),Uy=q(i-19,43);
    const W=qsub(q(1),qdiv(G.add(G.mul(q(2),D,eta,reference.M),G.mul(d,reference.Meta)),X));
    const state={X,r,F,U,E:G.mul(r,F),a,kappa:qsub(q(1),a),FOver,EOver:G.mul(r,FOver),uOver,p1,Uy,W};
    const constants={h,eta,D,A,d,L};
    cases.push(encode({id:i,state,constants,reference,momentDifference,density:innerMomentDifferenceAlgebra(G,state),stress:innerStressDifferenceAlgebra(G,state,momentDifference,constants)}));
  }
  const outer=[];
  for(let i=0;i<24;i++){
    const b={K:q(3+i,17),c:q(2+i,37),r:q(19+i,11),delta:q(i+1,50),L:q(99,100),viscous:q(13+i,29),inviscid:q(7+2*i,23),axialIntegral:q(i-11,53)};
    outer.push(encode({id:i,input:b,output:outerStressFactorAlgebra(G,b)}));
  }
  return {inner:cases,outer};
}

export function directionFixture(){
  return {receipt:actualStressDirectionBounds(),algebra:directionAlgebraFixtures(),negativeKernelBudgets:[flatKernelAudit({radialDerivativeCoefficient:'1'}),flatKernelAudit({outerDerivativeDivisor:'64'})],additionalAbsorptions:[0,1,131,65536,656266,1000000000].map(directionCPowerAbsorption)};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])process.stdout.write(JSON.stringify(directionFixture())+'\n');
