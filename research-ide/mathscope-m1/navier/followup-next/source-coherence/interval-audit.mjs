import {writeFileSync,readFileSync} from 'node:fs';
import {createDyadic} from './dyadic.mjs';
import {createLogIntervals} from './log-interval.mjs';
import {evaluateSourceProfileLog} from './source-log-evaluator.mjs';
const D=createDyadic(1024),T=createLogIntervals(1024),cases=[];
let seed=713n;
const rand=()=>{seed=(1664525n*seed+1013904223n)&0xffffffffn;return seed;};
for(let k=0;k<160;k++){
  const a=`${rand()%2001n-1000n}/${rand()%1000n+1n}`,b=`${rand()%2001n-1000n}/${rand()%1000n+1n}`;
  const A=D.q(a),B=D.q(b);
  for(const op of ['add','sub','mul'])cases.push({kind:'arithmetic',operation:op,a,b,result:D.pack(D[op](A,B))});
  if(!(B[0]<=0n&&B[1]>=0n))cases.push({kind:'arithmetic',operation:'div',a,b,result:D.pack(D.div(A,B))});
}
for(const value of ['1','2','3','1/2','7/3','110','1/'+10n**2000n,10n**2000n+'',...(Array.from({length:24},()=>`${rand()%100000n+1n}/${rand()%100000n+1n}`))]){
  cases.push({kind:'log',value,result:D.pack(T.logQ(value))});
}
for(const value of ['0','1/128','1/3','1','7','14','-7','-14','100','-100'])cases.push({kind:'exp',value,result:D.pack(T.expQ(value))});
for(const value of ['-1','0','1/1000','1/16','1/4','1/2','3/4','15/16','999/1000','1','2'])cases.push({kind:'step',value,result:D.pack(T.step(value))});
const rejectionInputs=[{norm:1},{profile:'caller'},{phase:'axis',coordinate:4},{phase:'axis',coordinate:'3'},{phase:'axis',coordinate:'4',eta:'1/2'},{phase:'joining',coordinate:'-4'},{phase:'joining',eta:'2'},{phase:'activation-factor',coordinate:'-1'},{phase:'shape-transition',coordinate:'2'},{phase:'caller'},{phase:'axis',coordinate:'1/0'}];
const rejections=rejectionInputs.map(input=>{try{evaluateSourceProfileLog(input);return {input,rejected:false};}catch(e){return {input,rejected:true,message:e.message};}});
let zeroDivisionRejected=false;try{D.div(D.one,[-1n,1n]);}catch{zeroDivisionRejected=true;}
const out={schema:'MathScope.Navier.IntervalAuditFixtures/1',cases,rejections,zeroDivisionRejected,allRejectionsPassed:rejections.every(x=>x.rejected)&&zeroDivisionRejected,arithmeticBits:1024};
writeFileSync(new URL('interval-audit-fixtures.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log({cases:cases.length,rejections:rejections.length+1,allRejected:out.allRejectionsPassed});
