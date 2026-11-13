// Source-small finite integer audit; no native graph materialization.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=resolve(process.argv[2]??'work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier');
const pins={'actual-residual-order-induction-kernels.mjs':'97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef','actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72','actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047'};
for(const [name,sha] of Object.entries(pins)){
 const bytes=readFileSync(resolve(dir,name));
 if(createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g,'\n')).digest('hex')!==sha)throw Error('PIN '+name);
}
const source=readFileSync(resolve(dir,'actual-residual-order-induction-source.mjs'),'utf8');
for(const str of ["G.div(G.parameter('t1'),q(64))","G.sub(G.one,G.step(G.div(G.sub(G.log(G.div(X,G.parameter('Xa'))),w),w)))","G.integral(G.substitute(U,X,G.mul(t,X)),t,G.zero,G.one)"])if(!source.includes(str))throw Error('SOURCE SHAPE '+str);
const one=readFileSync(resolve(dir,'actual-continuation-exact-order-one.mjs'),'utf8');
for(const str of ["Xkeep=G.mul(Xa,G.exp(G.div(t1,q(64))))","Xcut=G.mul(Xa,G.exp(G.div(t1,q(32))))"])if(!one.includes(str))throw Error('CUTOFF SHAPE '+str);
const {sourceAllOrderCutoffJets}=await import(pathToFileURL(resolve(dir,'actual-residual-order-induction-kernels.mjs')).href);
const j=sourceAllOrderCutoffJets({order:3});
if(!j.pass||JSON.stringify(j.activation.ordinaryDerivativeBounds)!==JSON.stringify(['1','66048','136356096','422521605120']))throw Error('CUTOFF BOUNDS');
const result={status:'PASS',sourceParameterExpressionSHA256:j.parameterExpressionSHA256,ordinaryStepDerivativeBounds:j.activation.ordinaryDerivativeBounds,checks:j.checks,pins,scope:'source step integer derivative bounds only; source cutoff composition requires X>=Xa and w=t1/64>0'};
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
