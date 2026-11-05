// A small synthetic Picard system with the original six-coordinate shape.
// This is a negative/control fixture, never the original physical system.
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const repo=process.env.MATHSCOPE_REPO ?? 'C:/Users/사용자/Documents/Codex/2026-10-24/referenced-chatgpt-conversation-this-is-an/work/MathScopeCompute';
const refrepo=process.env.MATHSCOPE_REFERENCE_REPO ?? 'C:/Users/사용자/Documents/Codex/2026-10-15/task/MathScopeCompute';
const branch='origin/mathscope-cd-lean-three-gates-20261027';
const files=['research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs','research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs'];
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
const blobs={};
for(const f of files){const current=git(repo,'hash-object',f);const expected=git(refrepo,'rev-parse',`${branch}:${f}`);assert.equal(current,expected,`source byte mismatch: ${f}`);blobs[f]=current;}
const {ActualConvergentExpressions}=await import(pathToFileURL(path.join(repo,files[0])).href);
const {evaluateSourceProgramDiagnostic}=await import(pathToFileURL(path.join(repo,files[1])).href);
const H=new ActualConvergentExpressions(), xi=H.var('fixture_xi'), eta=H.core.eta,z=H.zero;
const A0=Array.from({length:6},()=>Array(6).fill(z)),A1=A0.map(row=>[...row]);
A0[0][0]=H.one;
const sys=H.definePicardSystem({name:'SyntheticExpFixture',xi,eta,diagonal:[0,0,2,0,3,1],A0,A1,forcing:[H.one,z,z,z,z,z],zeroAxisDatum:[0,0,0,0,0,0],tail:{fixture:true}});
const root=H.picardRoot(sys,0,xi,eta), derivative=H.derivative(root,xi);
const partials=Array.from({length:9},(_,i)=>H.picardPartialSum(sys,i));
const partial=partials[3];
const rootFields={ideal:root,derivative};
partials.forEach((p,i)=>{rootFields[`partial${i}`]=p.sum[0];});
const program=H.pack(rootFields);
assert.equal(program.nodes[root].op,'actual_background_picard');
assert.equal(partial.finitePartialSumIsExactSolution,false);
assert.equal(partial.errorBoundForTheseDisplayedTerms,null);
let failure;
try { evaluateSourceProgramDiagnostic(program,'ideal',{coordinates:{fixture_xi:1,eta:0}}); throw Error('unexpectedly evaluated opaque root'); }
catch(e){if(e.message==='unexpectedly evaluated opaque root')throw e;failure={code:e.code??null,message:e.message};}
// For y'=1+y, y(0)=0 the three displayed terms give x+x²/2+x³/6.
// Their exact ODE defect at x=1 is -1/6.  No floating approximation is involved.
const result={fixture:'six-coordinate diagonal [0,0,2,0,3,1], A0[0,0]=1, A1=0, forcing[0]=1',
 sourceBlobs:blobs,opaqueRootNode:program.nodes[root],radialDerivativeNode:program.nodes[derivative],
 count:partial.count,finitePartialSumIsExactSolution:partial.finitePartialSumIsExactSolution,
 diagnosticIdealRoot:failure,
 scope:'Synthetic control only; actual physical Picard system and its analytic hypotheses are not evaluated.',
 exactThreeTermODEDefectAtOne:'-1/6'};
const outDir=path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(outDir,'runtime-fixture.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'fixture-nodes.json'),JSON.stringify({nodes:program.nodes,roots:program.roots})+'\n');
console.log(JSON.stringify(result,null,2));
