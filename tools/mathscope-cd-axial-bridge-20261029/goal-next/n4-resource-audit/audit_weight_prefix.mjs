import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const [repository,output]=process.argv.slice(2);assert.ok(repository&&output,'usage: node audit_weight_prefix.mjs REPO OUT');
const repo=resolve(repository),name='research-ide/mathscope-m2/navier/actual-residual-order-induction-kernels.mjs',expected='4c05e4d071378771c9818b5a6dbbafcaa2ab36b1',commit='f8cb4034e86d7b669d52a6f2248aebba156b51b5';
const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();assert.equal(git('rev-parse',`${commit}:${name}`),expected);assert.equal(git('hash-object',name),expected);
const {sourceNormalizedCutoffWeights:weights}=await import(pathToFileURL(resolve(repo,name)));
const rows=[];for(let n=1;n<=5;n++){
 const diagonal=weights({order:n,derivativeOrder:n}),uniform=weights({order:n,derivativeOrder:5});
 assert.deepEqual(diagonal.weights,uniform.weights.slice(0,n+1));
 const fake=structuredClone(diagonal.weights);fake[n].polynomialInSourceH[0]='0';assert.notDeepEqual(fake,uniform.weights.slice(0,n+1));
 rows.push({order:n,comparedRows:n+1,ordinaryAndExtra:true});
}
const out={sourceCommit:commit,kernelBlob:expected,rows,naiveUniformJetBudget:2520,diagonalJetBudget:1125,scope:'Exact equality of source cutoff weight prefixes only. Other physical/FTC norm bodies, common selector values and full private seals remain OPEN.'};
writeFileSync(output,JSON.stringify(out,null,2)+'\n');console.log('PASS 20 source cutoff-weight rows, 5 mutations rejected; no full norm equivalence claim');
