/** Independent rational comparison of the actual full three-component source
 * residual, cloud only. Source bytes and every root are pinned. Stored direct
 * derivatives are compared, never relabeled as independently computed jets.
 * Unknown analytic/function/limit nodes retain their exact original atomic IDs.
 */
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyExactStageSnapshot} from '../navier/tests/exact-stage-snapshot.mjs';
import {createFactoredRationalVerifier} from '../navier/forced-rational-identity.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const BASE='research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/';
const PINS=Object.freeze({index:'ba251f2f3401d2d81467a8ac3c5ceb0da7c6ddc3899aab6d9d580755ff0fd1f3',capture:'37960fe03a79493d12b6b9051b8a69a88ab71cc3505cc8cd62c6f2fc4bc0daeb',angular:'ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14',
  parentNodes:'7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f',verifier:'9ea6c0d39883fd0f584606a51b372752b8e64a6f2fb10ab943bd96172922dccc',snapshotReader:'9d874a93890ee0d410e2f94c3dfdb8fb888105525fb3b7bb968333edd9362b4a'});
const sha=x=>createHash('sha256').update(x).digest('hex'),hash=x=>sha(JSON.stringify(x));
const require=(ok,message)=>{if(!ok)throw new Error(message);};
const pathOf=path=>{const file=resolve(ROOT,path);require(file.startsWith(ROOT+sep),'Pinned source file leaves repository');return file;};
async function pinned(path,expected,bytes){const raw=await readFile(pathOf(path));require(sha(raw)===expected&&(bytes===undefined||raw.length===bytes),'Changed pinned source bytes: '+path);return raw;}
async function pinnedJSON(path,expected){return JSON.parse(await pinned(path,expected));}
async function verifyCapture(capture){require(capture.files.length===155,'Keep every original producer dependency');for(const row of capture.files){await pinned(row.path,row.sha256,row.bytes);await pinned(BASE+'sources/'+row.path,row.sha256,row.bytes);}}
const output=(process.argv.indexOf('--output')>=0&&process.argv[process.argv.indexOf('--output')+1]);
require(output&&process.argv.slice(2).length===2,'Use --output DIRECTORY only; roots, verifier budgets and proof flags cannot be overridden.');
const out=resolve(output),startedAt=new Date().toISOString();await mkdir(out,{recursive:true});
await writeFile(resolve(out,'started.json'),JSON.stringify({schema:'MathScope.N6.FullResidualCompareAttempt/1',startedAt,maxTerms:10000,maxProducts:2000000,sourceCommit:process.env.GITHUB_SHA??null,originalN601Complete:false,originalN602Complete:false},null,2)+'\n',{flag:'wx'});

try{
  const capture=await pinnedJSON(BASE+'source-bytes-before.json',PINS.capture);await verifyCapture(capture);
  await pinned('research-ide/mathscope-m3/navier/forced-rational-identity.mjs',PINS.verifier);
  await pinned('research-ide/mathscope-m3/navier/tests/exact-stage-snapshot.mjs',PINS.snapshotReader);
  const index=await pinnedJSON(BASE+'checkpoint-index.json',PINS.index),first=index.checkpoints[0],angular=await pinnedJSON(BASE+'initialized-angular-construction.json',PINS.angular),full=angular.global;
  require(first.nodeCount===3892594&&first.firstNode===0&&first.nodesSHA256===PINS.parentNodes,'The complete actual parent source changed');
  require(JSON.stringify(full.direct.conservativeResidual)===JSON.stringify([3825257,3825259,3825261])&&JSON.stringify(full.assembledResidual)===JSON.stringify([3825348,3825349,3825350]),'Actual complete three-component source residual roots changed');
  require(JSON.stringify(full.velocity)===JSON.stringify([3825006,3825007,3825008])&&full.pressure===3825009&&full.oldFlatResidual.numericalZeroAssumed===false,'Keep actual whole field, latest full pressure and nonzero base flat tail');
  const nodes=[],prefixHash=createHash('sha256');let sourceBytes=0,header;
  const stream=await verifyExactStageSnapshot(pathOf(first.path),{onHeader:h=>{header=h;},onNode:(id,node)=>{require(id===nodes.length,'Source node order changed');const line=JSON.stringify([id,node])+'\n';prefixHash.update(line);sourceBytes+=Buffer.byteLength(line);nodes.push(node);}});
  require(nodes.length===3892594&&prefixHash.digest('hex')===PINS.parentNodes&&stream.manifestSHA256===first.sha256,'Actual full source node stream differs');
  const sourceCount=nodes.length,rows=[];
  const selectedRoots=[...full.velocity,full.pressure,...full.direct.conservativeResidual,...full.assembledResidual,full.direct.divergence];
  const sourceRoots=selectedRoots.map(sourceNode=>({sourceNode,node:structuredClone(nodes[sourceNode]),nodeSHA256:hash(nodes[sourceNode])}));
  const add=(op,args)=>{const id=nodes.length;nodes.push({op,args});return id;};
  const minusOne=add('rational',['-1','1']);
  for(let component=0;component<3;component++){
    const direct=full.direct.conservativeResidual[component],assembled=full.assembledResidual[component],expression=add('add',[direct,add('multiply',[minusOne,assembled])]);
    let lastVisitedNode=null,readCount=0;
    const readOnlyNodes=new Proxy(nodes,{get(target,key){if(typeof key==='string'&&/^\d+$/.test(key)){lastVisitedNode=Number(key);readCount++;}return Reflect.get(target,key);},set(){throw new TypeError('Independent comparison cannot alter source nodes');},deleteProperty(){throw new TypeError('Independent comparison cannot delete source nodes');}});
    const verify=createFactoredRationalVerifier({nodes:readOnlyNodes},{maxTerms:10000,maxProducts:2000000});
    const row={component,directRoot:direct,assembledRoot:assembled,derivedDifferenceRoot:expression,originalSourceRootsEqualByID:direct===assembled,derivativeBodiesIndependentlyRecomputed:false};
    try{
      const result=verify(expression);
      row.comparison=result;row.status=result.pass?'EXACT_SOURCE_RATIONAL_IDENTITY_MATCH_NONZERO_DIVISORS_REQUIRED':'SOURCE_RATIONAL_NONMATCH_WITH_EXACT_ANALYTIC_ATOMS';
      row.actualSourceResidualAlgebraMatched=result.pass;
      if(!result.pass)row.limitation='A rational numerator with independently atomic analytic/function/integral nodes is nonzero. This does not exclude equality after their defining equations or an independently proved alpha/cover/analytic relation.';
    }catch(error){
      if(!['RESOURCE_LIMIT','INVALID_SOURCE_CONSTRUCTION'].includes(error.code))throw error;
      row.status='UNRESOLVED_EXACT_SOURCE_COMPARISON';row.actualSourceResidualAlgebraMatched=false;
      row.stop={code:error.code,reason:error.message,lastVisitedNode,lastVisitedNodeIsOriginal:lastVisitedNode!==null&&lastVisitedNode<sourceCount,lastVisitedNodeBody:lastVisitedNode===null?null:structuredClone(nodes[lastVisitedNode]),lastVisitedNodeSHA256:lastVisitedNode===null?null:hash(nodes[lastVisitedNode]),readCount,resourceLimitIsNotPDECounterexample:error.code==='RESOURCE_LIMIT',allOperandsRetained:true};
    }
    row.readCount=readCount;rows.push(row);
    console.log(JSON.stringify({component,status:row.status,direct,assembled,readCount,stop:row.stop??null,numeratorMonomials:row.comparison?.numeratorMonomials??null,productsUsed:row.comparison?.productsUsed??null}));
  }
  await verifyCapture(capture);
  await pinned('research-ide/mathscope-m3/navier/forced-rational-identity.mjs',PINS.verifier);
  await pinned('research-ide/mathscope-m3/navier/tests/exact-stage-snapshot.mjs',PINS.snapshotReader);
  require(sourceRoots.every(row=>hash(nodes[row.sourceNode])===row.nodeSHA256),'An original comparison/field root changed');
  const allMatched=rows.length===3&&rows.every(row=>row.actualSourceResidualAlgebraMatched),result={schema:'MathScope.N6.FullSourceResidualRationalCompare/1',startedAt,finishedAt:new Date().toISOString(),
    source:{paperSHA256:angular.source.paperSHA256,parameterExpressionSHA256:angular.source.parameterExpressionSHA256,angularCertificateSHA256:PINS.angular,completeSourceNodeCount:sourceCount,completeSourceNodeSHA256:PINS.parentNodes,completeSourceBytes:sourceBytes,snapshotManifestSHA256:first.sha256,operatorDefinitionsSHA256:hash(header.definitions),originalProducerCount:155,originalAndCapturedProducerBytesVerifiedBeforeAndAfter:true,verifierSHA256:PINS.verifier,snapshotReaderSHA256:PINS.snapshotReader},
    sourceRoots,sourceGeometry:full.geometry,oldFlatResidual:full.oldFlatResidual,rows,
    status:allMatched?'ALL_THREE_FULL_SOURCE_RATIONAL_IDENTITIES_MATCH_DOMAIN_JET_CLASS_OPEN':'FULL_SOURCE_RATIONAL_COMPARISON_OPEN',actualSourceResidualAlgebraMatched:allMatched,
    scope:{wholeThreeComponentDirectAndAssembledSourceOperandsCompared:true,sourceMeanOnlyUsed:false,actualWholeVelocityPressureRootsBound:true,allPressureConnectionsAndNonzeroAngularSourceRootsRetained:true,originalSourceNodeReplacedByZero:false,originalSourceDerivativeHelperCalled:false,oldPassBitsUsedAsProof:false,
      unknownAnalyticOperatorsMerged:false,exactSameSourceAtomicIDsPreserved:true,sourceDerivativeJetsIndependentlyVerified:false,nonzeroDivisorHypothesesDischarged:false,sourceAllOrderClassesCertified:false,wholeCartesianPDEIndependentlyRecomputed:false,numericalWholeDomainResidualEnclosed:false,originalN601Complete:false,originalN602Complete:false,countsChanged:false},
    limitation:'Independent rational algebra on exact stored full cylindrical source derivatives, which represent all physical components with nonzero angular modes and frame connections. Analytic/function/limit/integral nodes retain their actual IDs as atoms. This does not independently differentiate the actual Cartesian field or certify its domains, divergence, all-order classes, numerical PDE/tails or original N6 completion.'};
  const raw=JSON.stringify(result,null,2)+'\n';require(Buffer.byteLength(raw)<=5*1024*1024,'Comparison evidence unexpectedly exceeds compact output budget');
  await writeFile(resolve(out,'full-residual-compare.json'),raw,{flag:'wx'});
  await writeFile(resolve(out,'execution.json'),JSON.stringify({schema:'MathScope.N6.FullResidualCompareExecution/1',startedAt,finishedAt:new Date().toISOString(),nodeVersion:process.version,implementationSHA256:sha(await readFile(fileURLToPath(import.meta.url))),artifact:'full-residual-compare.json',artifactSHA256:sha(raw),artifactBytes:Buffer.byteLength(raw),auditExecutionReturned:true,actualSourceResidualAlgebraMatched:allMatched,originalN601Complete:false,originalN602Complete:false,countsChanged:false},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:result.status,components:3,actualSourceResidualAlgebraMatched:allMatched,originalN601Complete:false,originalN602Complete:false}));
}catch(error){
  await writeFile(resolve(out,'implementation-failure.json'),JSON.stringify({schema:'MathScope.N6.FullResidualCompareFailure/1',code:error.code??null,message:error.message,stack:error.stack,status:'UNRESOLVED',originalN601Complete:false,originalN602Complete:false,countsChanged:false},null,2)+'\n',{flag:'wx'});throw error;
}
