/** A small, explicit real-function program used by the actual outer source.
 *
 * Every integral contains its integrand, variable, and both endpoints. Every
 * derivative is expanded by the chain/product/Leibniz rules. There are no
 * source-function, root-oracle, derivative-oracle, or quadrature-value leaves.
 * Enormous pinned parameters are retained as exact expression graphs. The
 * finite numeric interpreter is an algorithm diagnostic, with explicit
 * overflow/underflow reporting; it never certifies the actual global field.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';

const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const rational=(n,d=1)=>{n=BigInt(n);d=BigInt(d);if(!d)throw Error('A nonzero denominator is required.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [String(n/g),String(d/g)];};
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};

export class ActualSourceExpressions {
  constructor(profileId=SOURCE_PROFILE_ID){
    this.source=assertSourceProfile(profileId);this.nodes=[];this.lookup=new Map();this.derivatives=new Map();this.substitutions=new Map();this.serial=0;
    this.zero=this.q(0);this.one=this.q(1);
  }
  node(op,args){const key=JSON.stringify([op,args]);if(this.lookup.has(key))return this.lookup.get(key);if(this.nodes.length>=350000)fail('RESOURCE_LIMIT','Source expression graph exceeded its explicit node budget.');const id=this.nodes.length;this.nodes.push({op,args});this.lookup.set(key,id);return id;}
  q(n,d=1){return this.node('rational',rational(n,d));}
  var(name){return this.node('coordinate',[name]);}
  fresh(prefix='s'){return this.var(prefix+'$'+(++this.serial));}
  parameter(name){if(!Object.hasOwn(this.source.parametersExactExpressions,name))fail('INVALID_INPUT','Unknown pinned source parameter '+name);return this.node('source_parameter',[name]);}
  isq(id){return this.nodes[id].op==='rational';}
  fraction(id){return this.nodes[id].args.map(BigInt);}
  add(...values){return values.reduce((a,b)=>{if(a===this.zero)return b;if(b===this.zero)return a;if(this.isq(a)&&this.isq(b)){const[n,d]=this.fraction(a),[m,e]=this.fraction(b);return this.q(n*e+m*d,d*e);}return this.node('add',[a,b].sort((x,y)=>x-y));},this.zero);}
  mul(...values){return values.reduce((a,b)=>{if(a===this.zero||b===this.zero)return this.zero;if(a===this.one)return b;if(b===this.one)return a;if(this.isq(a)&&this.isq(b)){const[n,d]=this.fraction(a),[m,e]=this.fraction(b);return this.q(n*m,d*e);}return this.node('multiply',[a,b].sort((x,y)=>x-y));},this.one);}
  neg(a){return this.mul(this.q(-1),a);}
  sub(a,b){if(a===b)return this.zero;return this.add(a,this.neg(b));}
  inv(a){if(this.isq(a)){const[n,d]=this.fraction(a);return this.q(d,n);}return this.node('inverse',[a]);}
  div(a,b){if(a===this.zero)return this.zero;return this.mul(a,this.inv(b));}
  pow(a,n){if(!Number.isSafeInteger(n))fail('INVALID_INPUT','Only integer powers are represented by this operation.');if(n===0)return this.one;if(n===1)return a;if(n<0)return this.pow(this.inv(a),-n);if(n===2&&this.isq(a)){const[p,q]=this.fraction(a);return this.q(p*p,q*q);}return this.node('integer_power',[a,n]);}
  exp(a){if(a===this.zero)return this.one;return this.node('exp',[a]);}
  log(a){if(a===this.one)return this.zero;return this.node('log_positive',[a]);}
  sqrt(a){return this.node('sqrt_positive',[a]);}
  step(a,order=0){if(!Number.isSafeInteger(order)||order<0||order>12)fail('RESOURCE_LIMIT','The source step interpreter supports derivatives through order twelve.');return this.node('source_step_derivative',[a,order]);}
  integral(body,variable,left,right){if(body===this.zero||left===right)return this.zero;if(this.nodes[variable]?.op!=='coordinate')fail('INVALID_INPUT','An integration variable must be a coordinate.');return this.node('definite_integral',[body,variable,left,right]);}
  choose(x,left,right,before,inside,after){return this.node('smooth_piecewise',[x,left,right,before,inside,after]);}
  substitute(id,variable,value){
    const key=id+':'+variable+':'+value;if(this.substitutions.has(key))return this.substitutions.get(key);
    if(id===variable)return value;const {op,args}=this.nodes[id];let out=id;
    if(['rational','coordinate','source_parameter'].includes(op))return id;
    const at=i=>this.substitute(args[i],variable,value);
    if(op==='add')out=this.add(at(0),at(1));else if(op==='multiply')out=this.mul(at(0),at(1));else if(op==='inverse')out=this.inv(at(0));else if(op==='integer_power')out=this.pow(at(0),args[1]);else if(op==='exp')out=this.exp(at(0));else if(op==='log_positive')out=this.log(at(0));else if(op==='sqrt_positive')out=this.sqrt(at(0));else if(op==='source_step_derivative')out=this.step(at(0),args[1]);
    else if(op==='definite_integral')out=this.integral(args[1]===variable?args[0]:at(0),args[1],at(2),at(3));
    else if(op==='smooth_piecewise')out=this.choose(...args.map(a=>this.substitute(a,variable,value)));
    else fail('UNSUPPORTED','Unexpanded source expression operation '+op);
    this.substitutions.set(key,out);return out;
  }
  derivative(id,variable){
    const key=id+':'+variable;if(this.derivatives.has(key))return this.derivatives.get(key);const {op,args}=this.nodes[id];let out=this.zero;const d=i=>this.derivative(args[i],variable);
    if(op==='coordinate')out=id===variable?this.one:this.zero;
    else if(op==='add')out=this.add(d(0),d(1));
    else if(op==='multiply')out=this.add(this.mul(d(0),args[1]),this.mul(args[0],d(1)));
    else if(op==='inverse')out=this.neg(this.mul(d(0),this.pow(id,2)));
    else if(op==='integer_power')out=this.mul(this.q(args[1]),this.pow(args[0],args[1]-1),d(0));
    else if(op==='exp')out=this.mul(id,d(0));
    else if(op==='log_positive')out=this.div(d(0),args[0]);
    else if(op==='sqrt_positive')out=this.div(d(0),this.mul(this.q(2),id));
    else if(op==='source_step_derivative')out=this.mul(this.step(args[0],args[1]+1),d(0));
    else if(op==='definite_integral'){
      const [f,t,a,b]=args;
      const interior=t===variable?this.zero:this.integral(this.derivative(f,variable),t,a,b);
      out=this.add(interior,this.mul(this.substitute(f,t,b),this.derivative(b,variable)),this.neg(this.mul(this.substitute(f,t,a),this.derivative(a,variable))));
    }else if(op==='smooth_piecewise'){
      // The compiler uses this only at source joins with matching derivatives.
      out=this.choose(args[0],args[1],args[2],d(3),d(4),d(5));
    }else if(!['rational','source_parameter'].includes(op))fail('UNSUPPORTED','Cannot differentiate unexpanded operation '+op);
    this.derivatives.set(key,out);return out;
  }
  pack(roots,extra={}){return {schema:'MathScope.ActualSourceFunctionProgram/1',profileId:this.source.id??SOURCE_PROFILE_ID,parameterExpressionSHA256:this.source.parameterExpressionSHA256,parametersExactExpressions:structuredClone(this.source.parametersExactExpressions),nodes:this.nodes,roots,operations:[...new Set(this.nodes.map(n=>n.op))].sort(),...extra};}
}

/** Audit interpreter. Finite quadrature error is reported as an estimate.
 * Passing substituted parameters always keeps sameProfileCertificate=false.
 * This interpreter deliberately fails on nonrepresentable exact source scales.
 */
export function evaluateSourceProgramDiagnostic(program,root,{coordinates={},parameterOverrides=null,maxOperations=2000000,quadratureCells=64}={}){
  if(program?.schema!=='MathScope.ActualSourceFunctionProgram/1')fail('INVALID_INPUT','Expected a complete real-function program.');
  if(!Number.isSafeInteger(quadratureCells)||quadratureCells<4||quadratureCells>4096||quadratureCells%4)fail('INVALID_INPUT','Choose a Simpson cell count divisible by four, from four to 4096.');
  const rootId=typeof root==='string'?program.roots[root]:root;if(!Number.isInteger(rootId)||!program.nodes[rootId])fail('INVALID_INPUT','Unknown root.');
  let operations=0,underflowEvents=0,largestRefinementDifference=0;const memo=new Map(),freeMemo=new Map();
  const tick=()=>{if(++operations>maxOperations)fail('RESOURCE_LIMIT','The diagnostic interpreter exhausted its explicit operation budget.');};
  function dependencies(id){if(freeMemo.has(id))return freeMemo.get(id);const {op,args}=program.nodes[id];let s=new Set();if(op==='coordinate')s.add(args[0]);else if(!['source_parameter','rational'].includes(op)){const ids=op==='integer_power'||op==='source_step_derivative'?[args[0]]:args;for(const a of ids)for(const name of dependencies(a))s.add(name);if(op==='definite_integral')s.delete(program.nodes[args[1]].args[0]);}freeMemo.set(id,[...s].sort());return freeMemo.get(id);}
  const finite=x=>{if(!Number.isFinite(x))fail('EXACT_SOURCE_SCALE_NOT_REPRESENTABLE','This exact source expression is outside the finite diagnostic interpreter; no source value or certificate is returned.');return x;};
  function raw(v){if(v?.ref!==undefined)return parameter(v.ref);if(v?.integer!==undefined)return Number(v.integer);if(v?.rational!==undefined){const[n,d=1]=String(v.rational).split('/').map(Number);return n/d;}if(v?.sum)return v.sum.reduce((s,x)=>s+raw(x),0);if(v?.product)return v.product.reduce((s,x)=>s*raw(x),1);if(v?.quotient)return raw(v.quotient[0])/raw(v.quotient[1]);if(v?.power)return raw(v.power[0])**v.power[1];if(v?.log!==undefined)return Math.log(raw(v.log));if(v?.min)return Math.min(...v.min.map(raw));if(v?.max)return Math.max(...v.max.map(raw));if(v?.exp!==undefined){const a=raw(v.exp),y=Math.exp(a);if(y===0&&Number.isFinite(a))underflowEvents++;return finite(y);}if(v?.ceil)return Math.ceil(raw(v.ceil));fail('UNSUPPORTED','Pinned parameter operation is not supported by the diagnostic interpreter.');}
  function parameter(name){const key='p:'+name;if(memo.has(key))return memo.get(key);let x;if(parameterOverrides&&Object.hasOwn(parameterOverrides,name))x=parameterOverrides[name];else x=raw(program.parametersExactExpressions[name]);finite(x);memo.set(key,x);return x;}
  function stepDerivative(x,n){
    if(x<=0||x>=1)return n===0?(x>=1?1:0):0;
    const mul=(a,b)=>Array.from({length:n+1},(_,k)=>a.reduce((s,v,j)=>j<=k?s+v*(b[k-j]??0):s,0));
    const inv=a=>{const r=Array(n+1).fill(0);r[0]=1/a[0];for(let k=1;k<=n;k++)r[k]=-a.slice(1,k+1).reduce((s,v,j)=>s+v*r[k-1-j],0)/a[0];return r;};
    const exponential=a=>{const r=Array(n+1).fill(0);r[0]=Math.exp(a[0]);for(let k=1;k<=n;k++){for(let j=1;j<=k;j++)r[k]+=j*a[j]*r[k-j];r[k]/=k;}return r;};
    const a=Array(n+1).fill(0),b=Array(n+1).fill(0);a[0]=x;b[0]=1-x;if(n){a[1]=1;b[1]=-1;}const ia=inv(a),ib=inv(b),z=mul(ia,ia).map((v,k)=>-v+mul(ib,ib)[k]);
    const sign=z[0]>=0?1:-1,e=exponential(z.map(v=>-sign*v)),onePlus=e.map((v,k)=>v+(k===0?1:0)),r=sign>0?inv(onePlus):mul(e,inv(onePlus));let f=1;for(let k=2;k<=n;k++)f*=k;return r[n]*f;
  }
  function ev(id,env){tick();const {op,args}=program.nodes[id],key=id+'|'+dependencies(id).map(k=>k+'='+env[k]).join(';');if(memo.has(key))return memo.get(key);let v;
    if(op==='rational')v=Number(args[0])/Number(args[1]);else if(op==='coordinate'){if(!Object.hasOwn(env,args[0]))fail('INVALID_INPUT','Missing coordinate '+args[0]);v=env[args[0]];}else if(op==='source_parameter')v=parameter(args[0]);
    else if(op==='add')v=ev(args[0],env)+ev(args[1],env);else if(op==='multiply')v=ev(args[0],env)*ev(args[1],env);else if(op==='inverse')v=1/ev(args[0],env);else if(op==='integer_power')v=ev(args[0],env)**args[1];else if(op==='log_positive')v=Math.log(ev(args[0],env));else if(op==='sqrt_positive')v=Math.sqrt(ev(args[0],env));
    else if(op==='exp'){const a=ev(args[0],env);v=Math.exp(a);if(v===0&&Number.isFinite(a))underflowEvents++;}
    else if(op==='source_step_derivative')v=stepDerivative(ev(args[0],env),args[1]);
    else if(op==='smooth_piecewise'){const x=ev(args[0],env),a=ev(args[1],env),b=ev(args[2],env);v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env);}
    else if(op==='definite_integral'){
      const [f,t,a,b]=args,lo=ev(a,env),hi=ev(b,env),name=program.nodes[t].args[0];
      const calc=n=>{const h=(hi-lo)/n;let s=0;for(let k=0;k<=n;k++)s+=(k===0||k===n?1:k%2?4:2)*ev(f,{...env,[name]:lo+k*h});return s*h/3;};
      v=lo===hi?0:calc(quadratureCells);if(lo!==hi){const coarse=calc(quadratureCells/2);largestRefinementDifference=Math.max(largestRefinementDifference,Math.abs(v-coarse));}
    }else fail('UNSUPPORTED','Unknown source program operation '+op);
    finite(v);memo.set(key,v);return v;
  }
  const value=ev(rootId,coordinates);
  return {value,operations,underflowEvents,largestRefinementDifference,quadratureCells,intervalCertified:false,sameProfileCertificate:false,scope:parameterOverrides?'FINITE_PARAMETER_ORACLE_DIAGNOSTIC_ONLY':'FINITE_DIAGNOSTIC_OF_AN_EXACT_SOURCE_SUBEXPRESSION',actualGlobalSourceEvaluated:false};
}
