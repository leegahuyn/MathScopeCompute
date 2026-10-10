import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {sourceSquaredProductPartition,covarianceGlobalAssemblyRecipe} from '../actual-covariance-global-assembly.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),sha=b=>createHash('sha256').update(b).digest('hex');
const test=spawnSync(process.execPath,['--test','--test-reporter=tap',resolve(root,'tests/actual-covariance-global-assembly.test.mjs')],{encoding:'utf8'});
if(test.status!==0)throw Error(test.stdout+test.stderr);
const passed=Number(test.stdout.match(/^# pass (\d+)$/m)?.[1]);if(passed!==8)throw Error('Expected all eight assembly tests.');
const G=new ActualSourceExpressions(),coordinates=Array.from({length:10},(_,i)=>G.var('partition_offset_'+i)),h=G.parameter('h'),q=G.var('q'),ell=G.var('ell');
const bandQ=G.exp(G.neg(G.mul(ell,G.log(G.q(2))))),target=[G.var('T0theta'),G.var('T0z')];
const partition=sourceSquaredProductPartition(G,{bandOffset:coordinates[0],meshOffsets:[coordinates.slice(1,4),coordinates.slice(4,7),coordinates.slice(7,10)]});
const assembly=covarianceGlobalAssemblyRecipe(G,{h,q,Q:bandQ,target,partition});
const program=G.pack({partition:partition.expandedSquaredSum,...assembly.roots});
const receipt={schema:'MathScope.ExactCovarianceGlobalAssemblyLemma/1',program,partition,assembly};
const paths=['actual-covariance-global-assembly.mjs','tests/actual-covariance-global-assembly.test.mjs','tests/seal-actual-covariance-global-assembly.mjs','research/ACTUAL_COVARIANCE_GLOBAL_ASSEMBLY_KO.md'];
const files=[];for(const path of paths){const bytes=await readFile(resolve(root,path));files.push({path,bytes:bytes.length,sha256:sha(bytes)});}
const evidence={schema:'MathScope.ExactCovarianceGlobalAssemblyEvidence/1',files,nodeTests:{tests:8,pass:passed,fail:0,command:'node --test --test-reporter=tap tests/actual-covariance-global-assembly.test.mjs'},
  independentPythonChecksClaimed:0,peerReview:'Blueprint independently read original Sections 6.2 and 7.30 and reran all eight tests; nearest-index relabeling and active-shell selection checked.',
  receiptSHA256:sha(canonicalStringify(receipt)),receipt};
const destination=resolve(root,'evidence/actual-covariance-global-assembly.json');await writeFile(destination,JSON.stringify(evidence,null,2)+'\n');
const output=await readFile(destination);console.log(JSON.stringify({file:destination,bytes:output.length,sha256:sha(output),receiptSHA256:evidence.receiptSHA256,tests:passed,nodes:G.nodes.length,actualSourceCertified:false}));
