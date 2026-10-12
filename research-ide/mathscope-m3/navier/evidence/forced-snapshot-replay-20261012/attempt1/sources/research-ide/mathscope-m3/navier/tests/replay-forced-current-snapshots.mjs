/** Recheck observed exact graph bytes without restoring a private current.
 * The original 35-minute source run remains failed. This separate replay
 * uses every saved inverse and all ten complete coefficient comparisons.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyExactStageSnapshot} from './exact-stage-snapshot.mjs';
import {createQuadraticSourceVerifier} from '../source-quadratic-identity.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {verifyCompleteAngularResidualUpdate} from '../source-angular-update-verification.mjs';
import {rational as Q} from '../../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';

const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SAVED_SOURCE_REPLAY'});},
  same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),sha=raw=>createHash('sha256').update(raw).digest('hex'),
  check=(name,value)=>{if(!value)fail(name);return {id:name,pass:true};},
  parts=['real','imaginary'],modes=[-2,-1,1,2],generated=[-4,-3,-2,-1,0,1,2,3,4],
  repo=resolve(dirname(new URL(import.meta.url).pathname),'../../../..'),
  input=resolve(process.argv[2]??''),output=resolve(process.argv[3]??'');
if(process.argv.length!==4||input===output)fail('Supply the fixed saved input directory and a distinct new output JSON.');
const index=JSON.parse(await readFile(join(input,'checkpoint-index.json'),'utf8')),
  partial=JSON.parse(await readFile(join(input,'forced-inverses-pressure-construction.json'),'utf8')),
  initialized=JSON.parse(await readFile(join(input,'initialized-angular-construction.json'),'utf8')),
  checks=[],snapshots=[],headers=[],nodes=[],rationalNodes=new Map(),sqrtNodes=new Map(),partialNodes=new Map(),
  cumulative=createHash('sha256');let cumulativeNodeBytes=0;
check('all11-recorded-exact-checkpoints',index.checkpoints.length===11&&index.actualSourceBytesRetained&&
  index.privateSourceAuthorityHydrated===false&&index.completeForcedCurrentAutomaticallyCertified===false);
for(const row of index.checkpoints){
  const path=resolve(repo,row.path),manifest=JSON.parse(await readFile(path,'utf8'));
  check('checkpoint-index-manifest-'+(row.key??'base'),sha(await readFile(path))===row.sha256&&
    row.nodeCount===manifest.nodeCount&&row.firstNode===nodes.length&&row.allSourceBytesUnchanged);
  const result=await verifyExactStageSnapshot(path,{onHeader:h=>headers.push(h),onNode:(id,node)=>{
    if(id!==nodes.length||id>5000000)fail('The complete saved scalar node prefix must be ordered and bounded.');
    nodes.push(node);const line=JSON.stringify([id,node])+'\n';cumulative.update(line);cumulativeNodeBytes+=Buffer.byteLength(line);
    if(node.op==='rational')rationalNodes.set(node.args.join('/'),id);
    if(node.op==='sqrt_positive')sqrtNodes.set(node.args[0],id);
    if(node.op==='m3_coupled_expression_partial')partialNodes.set(JSON.stringify(node.args),id);
  }});
  check('whole-cumulative-node-hash-'+(row.key??'base'),cumulative.copy().digest('hex')===manifest.nodesSHA256&&cumulativeNodeBytes===manifest.nodeBytes);
  snapshots.push({kind:row.kind,key:row.key,manifestPath:row.path,manifestSHA256:result.manifestSHA256,
    nodeCount:result.nodeCount,rows:result.rows,rawBytes:result.rawBytes,compressedBytes:result.compressedBytes,
    fullCumulativeNodeSHA256:manifest.nodesSHA256,pass:true,privateSourceAuthorityHydrated:false});
  process.stdout.write(JSON.stringify({stage:'saved-source-snapshot-reverified',key:row.key,nodeCount:nodes.length,rssBytes:process.memoryUsage().rss})+'\n');
}
const sourceCount=nodes.length,synthetic=new Map(),append=(op,args)=>{
  const key=op+JSON.stringify(args);if(synthetic.has(key))return synthetic.get(key);
  const id=nodes.length;if(id-sourceCount>100000)fail('The explicit replay arithmetic append budget was exceeded.');
  nodes.push({op,args});synthetic.set(key,id);return id;
},G={nodes,q:(n,d=1)=>{
  const values=Q(n,d).map(String),key=values.join('/');if(rationalNodes.has(key))return rationalNodes.get(key);
  const id=append('rational',values);rationalNodes.set(key,id);return id;
},sqrt:x=>sqrtNodes.has(x)?sqrtNodes.get(x):append('sqrt_positive',[x]),
  add:(...xs)=>xs.length===0?G.zero:xs.length===1?xs[0]:append('add',xs),
  mul:(...xs)=>xs.length===0?G.one:xs.length===1?xs[0]:append('multiply',xs),
  pow:(x,n)=>n===0?G.one:n===1?x:append('integer_power',[x,n]),
  inv:x=>append('inverse',[x]),
  neg:x=>x===G.zero?G.zero:G.mul(G.q(-1),x),
  sub:(a,b)=>a===b?G.zero:G.add(a,G.neg(b)),div:(a,b)=>G.mul(a,G.inv(b))};
G.choose=(x,a,b,l,m,r)=>l===m&&m===r?l:append('smooth_piecewise',[x,a,b,l,m,r]);
G.zero=G.q(0);G.one=G.q(1);
// There are intentionally no private source, derivative, function-owner,
// source-field-constructor or serialization-authority methods on G.
const definitions=JSON.parse(headers.at(-1).definitions.definitions),
  functions=new Map(definitions[0].map(d=>[d.id,d])),base=headers[0].record,
  getNode=id=>{if(!Number.isSafeInteger(id)||id<0||id>=sourceCount||!nodes[id])fail('An observed source root is missing.');return nodes[id];},
  bodyBinding=b=>{
    const n=getNode(b.root);getNode(b.body);
    if(b.literalZero)return b.body===G.zero&&b.root===G.zero;
    const d=functions.get(b.system);
    return !!d&&d.body===b.body&&same(d.parameters,b.parameters)&&same(d.derivativeLimits,b.derivativeLimits)&&
      n.op==='m3_coupled_expression_partial'&&n.args[0]===b.system&&same(n.args[1],b.parameters)&&
      n.args[2].every(x=>x===0)&&n.args[2].length===b.parameters.length&&b.completeFreeCoordinateTuple&&b.wholeDefiningBodyRetained;
  },sharedDerivative=(id,coordinate)=>{
    if(id===G.zero)return G.zero;
    const n=getNode(id),d=functions.get(n.args[0]);
    if(n.op!=='m3_coupled_expression_partial'||!d||!same(n.args[1],d.parameters))
      fail('A replayed potential derivative needs its complete original defining function argument tuple.');
    const position=d.parameters.indexOf(coordinate);if(position<0)return G.zero;
    const orders=[...n.args[2]];orders[position]++;
    const key=JSON.stringify([n.args[0],n.args[1],orders]),found=partialNodes.get(key);
    if(found===undefined)fail('An actual required cutoff-potential derivative body is absent from the saved source graph.');
    return found;
  };
const savedPartialRecord=Object.fromEntries(Object.entries(partial).filter(([k])=>
  !['exactGraphSnapshot','inheritedInitializedSourceArtifact','fullCurrentStillRequiresPostForcedResidualComparisons'].includes(k)));
checks.push(check('partial-record-exact-saved-header',same(base,savedPartialRecord)));
checks.push(check('actual-initialized-source-ten-lifts',base.templates.length===10&&initialized.templates.length===10&&
  same(base.templates.map(t=>t.key),initialized.templates.map(t=>t.key))&&same(base.templates.map(t=>t.levelDifference),[0,0,1,1,2,2,3,3,4,4])));
const inverseChecks=[],curlChecks=[],conjugateChecks=[],boundChecks=[],supportChecks=[],remainderChecks=[];
const replayChecks=(rows,tag,target)=>{
  const grouped=new Map();
  for(const row of rows){
    if(row.pass!==true)fail('The observed constructor recorded a failed identity: '+tag+'/'+row.id);
    if(row.expression===undefined)continue;
    const options={atomicNodes:row.sourceAtomicNodes??[],maxTerms:row.maxTerms??120000,maxProducts:row.maxProducts??3000000},
      kind=row.schema==='MathScope.N6.FactoredSourceRationalIdentity/1'?'rational':'quadratic',key=kind+JSON.stringify(options);
    if(!grouped.has(key))grouped.set(key,kind==='rational'?createFactoredRationalVerifier(G,options):createQuadraticSourceVerifier(G,options));
    const actual=grouped.get(key)(row.expression);
    if(!actual.pass)fail('The saved full-body expression no longer proves zero: '+tag+'/'+row.id);
    target.push({id:tag+'/'+row.id,expression:row.expression,pass:true,productsUsed:actual.productsUsed,
      maxProducts:options.maxProducts,maxTerms:options.maxTerms,sourceAtomicNodes:options.atomicNodes,
      numeratorMonomials:actual.numeratorMonomials,arithmetic:actual.arithmetic});
  }
};
for(const t of base.templates){
  const original=initialized.templates.find(x=>x.key===t.key);
  checks.push(check('same-all-current-original-sources-'+t.key,same(t.originalSourceRows,original.nonzeroAngularForcing)&&
    same(t.originalSourceRows.map(r=>r.m),modes)&&same(t.oldFlatResidual,original.oldFlatResidual)&&t.forced.length===2&&
    same(t.sourceFiniteInventory.solved,modes)&&same(t.sourceFiniteInventory.updatedVelocity,modes)&&
    same(t.sourceFiniteInventory.nextResidual,generated)&&t.sourceFiniteInventory.discarded.length===0));
  replayChecks(t.conjugacy,'actual-source-conjugacy-'+t.key,conjugateChecks);
  const waveSystems=new Set(t.support.waveSystems),cache=new Map(),seenJets=new Set(),
    visitSupport=id=>{
      if(cache.has(id))return cache.get(id);const {op,args}=getNode(id);let value=id;
      if(op==='m3_coupled_expression_partial'&&waveSystems.has(args[0])){
        if(!functions.has(args[0]))fail('An actual wave source defining body is missing.');
        seenJets.add(args[0]+':'+args[2].join(','));value=G.zero;
      }else if(op==='add')value=G.add(...args.map(visitSupport));
      else if(op==='multiply'){const a=visitSupport(args[0]);value=a===G.zero?G.zero:G.mul(a,visitSupport(args[1]));}
      else if(op==='integer_power')value=G.pow(visitSupport(args[0]),args[1]);
      else if(op==='inverse')value=G.inv(visitSupport(args[0]));
      else if(op==='smooth_piecewise')value=G.choose(args[0],args[1],args[2],...args.slice(3).map(visitSupport));
      cache.set(id,value);return value;
    },supportVerifier=createQuadraticSourceVerifier(G,{maxTerms:120000,maxProducts:3000000});
  for(const row of t.originalSourceRows)for(let j=0;j<3;j++)for(const part of parts){
    const source=row.value[j][part],reduced=visitSupport(source),v=supportVerifier(reduced);
    if(!v.pass)fail('An actual nonzero source coefficient lost its whole-wave support ideal.');
    supportChecks.push({id:'replayed-source-support-'+t.key+'-'+row.m+'-'+j+'-'+part,source,reduced,pass:true,
      productsUsed:v.productsUsed,wholeMeanKeptAsCoefficient:true});
  }
  checks.push(check('actual-whole-wave-jets-in-support-'+t.key,seenJets.size>0&&
    t.support.wholeMeanCoefficientKept&&t.support.sourcePressureWaveJetsKept));
  for(const f of t.forced){
    const inv=f.inverse,m=f.m;
    checks.push(check('complete-forced-system-source-and-tails-'+t.key+'-'+m,m===inv.input.m&&[1,2].includes(m)&&
      same(f.inputRoots,t.originalSourceRows.find(r=>r.m===m).value)&&same(f.signedSolutions.map(x=>x.m),[m,-m])&&
      f.bound.everyOriginalSourceBodyRetained&&inv.scope.completeComplexSourceUsed&&inv.scope.exactZeroDataForcedSolutionDefined&&
      inv.scope.algebraicPressureConstructed&&inv.scope.actualOrderedIntegralAndTailProducers&&!inv.scope.matrixCommutationAssumed&&
      inv.limit.allActualMatrixSourceAndTimeDerivativeBodiesGenerated&&inv.limit.coefficients.every(c=>
        c.allActualCoefficientBodiesGenerated&&c.allActualTimeDerivativeBodiesGenerated)&&!inv.limit.numericalIntegralEvaluated));
    replayChecks(inv.identities.checks,'inverse-'+t.key+'-'+m,inverseChecks);
    replayChecks(f.signedSolutions[1].checks,'negative-principal-'+t.key+'-'+m,conjugateChecks);
    replayChecks(f.mapped.identities.checks,'mapped-curl-'+t.key+'-'+m,curlChecks);
    replayChecks(f.mapped.cutoff.path.checks,'full-cutoff-'+t.key+'-'+m,curlChecks);
    replayChecks(f.path.checks,'whole-path-'+t.key+'-'+m,boundChecks);
    const mapped=f.mapped,denominator=G.mul(G.q(m),inv.k,mapped.normal.squared),N=mapped.normal.value,V=mapped.cutoff.mapped.velocity,
      verify=createQuadraticSourceVerifier(G,{maxTerms:120000,maxProducts:3000000}),
      cross=(a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
    for(const part of parts){const expected=cross(N,V.map(z=>z[part])).map(x=>G.div(x,denominator));
      for(let j=0;j<3;j++){
        const p=mapped.potential.bodies.find(x=>x.part===part&&x.component===j),n=getNode(p.id),d=functions.get(p.function);
        checks.push(check('whole-cutoff-potential-definition-'+t.key+'-'+m+'-'+part+'-'+j,
          d?.body===p.body&&p.body===mapped.potential.raw[part][j]&&n.op==='m3_coupled_expression_partial'&&
          n.args[0]===p.function&&same(n.args[1],d.parameters)&&n.args[2].every(x=>x===0)));
        const identity=verify(G.sub(p.body,expected[j]));
        if(!identity.pass)fail('The entire actual cutoff was not retained before the potential curl.');
        curlChecks.push({id:'recomputed-cutoff-potential-'+t.key+'-'+m+'-'+part+'-'+j,pass:true,productsUsed:identity.productsUsed,
          maxProducts:3000000,maxTerms:120000,numeratorMonomials:0});
      }
    }
    const geometry=mapped.geometry,km=G.mul(G.q(m),inv.k),
      Dr=id=>G.add(sharedDerivative(id,geometry.R),G.mul(geometry.radialFast,
        G.add(...geometry.Y.map((y,j)=>G.mul(geometry.vr[j],sharedDerivative(id,y)))))),
      Dz=id=>G.mul(geometry.epsilon,sharedDerivative(id,geometry.Z)),
      recomputed=Object.fromEntries(parts.map(part=>{const X=mapped.potential.shared[part];return [part,{
        leading:cross(N,X).map(x=>G.neg(G.mul(km,x))),
        remainder:[G.neg(Dz(X[1])),G.sub(Dz(X[0]),Dr(X[2])),G.add(Dr(X[1]),G.div(X[1],geometry.R))]
      }];}));
    for(let j=0;j<3;j++)for(const part of parts){
      const rem=part==='real'?G.neg(recomputed.imaginary.remainder[j]):recomputed.real.remainder[j],
        vel=G.add(recomputed[part].leading[j],rem),
        comparisons=[['leading',mapped.leading[j][part],recomputed[part].leading[j]],
          ['full-curl-remainder',mapped.curlRemainder[j][part],rem],['full-velocity',mapped.velocity[j][part],vel]];
      for(const [name,left,right]of comparisons){const equality=verify(G.sub(left,right));
        if(!equality.pass)fail('The actual full mapped curl differs from the differentiated source cutoff potential.');
        curlChecks.push({id:'recomputed-'+name+'-'+t.key+'-'+m+'-'+j+'-'+part,pass:true,productsUsed:equality.productsUsed,
          numeratorMonomials:0,maxProducts:3000000,maxTerms:120000});
      }
    }
    checks.push(check('full-complex-curl-and-domain-'+t.key+'-'+m,mapped.mapping.pathValueSubstitutedBeforeSpatialDerivative&&
      mapped.identities.fullComplexPotentialCurled&&mapped.identities.allCylindricalConnectionsRetained&&
      mapped.identities.everyCommonYChainTermRetained&&!mapped.identities.finitePartialSumSubstituted&&
      mapped.scope.fullCurlRemainderRetained&&f.originalSupport.originalPsiRestoresLongitudinalSupport&&
      f.sourcePathInvariance.independentParameterDerivativeNotDropped&&f.path.preimagesIdentified===false));
  }
  process.stdout.write(JSON.stringify({stage:'actual-saved-inverses-and-full-cutoff-curls-replayed',key:t.key,rssBytes:process.memoryUsage().rss})+'\n');
}
for(const h of headers.slice(1)){
  const r=h.record,t=base.templates.find(t=>t.key===r.key);
  checks.push(check('whole-saved-operands-'+r.key,r.scope.actualWholeBodiesAndOriginalArgumentsRetained&&
    r.operands.bindings.every(bodyBinding)&&r.assemblyOperands.bindings.every(bodyBinding)&&
    r.update.oldFlatResidualRetained&&r.update.newQuadraticRemainderRetained&&r.update.discardedModes.length===0&&
    same(r.finiteInventory,t.sourceFiniteInventory)&&same(r.waveResidual.map(row=>row.m),generated)));
  const result=verifyCompleteAngularResidualUpdate(G,r.update,{prefix:'replayed-actual-full-update-'+r.key,...r.proofLimits});
  if(!result.pass||result.checks.length!==54)fail('A complete actual source coefficient comparison failed.');
  remainderChecks.push({key:r.key,...result});
  replayChecks(r.stateTransition.verification.checks,'fresh-full-pressure-transition-'+r.key,boundChecks);
  process.stdout.write(JSON.stringify({stage:'actual-saved-all54-coefficients-replayed',key:r.key,checks:result.checks.length,
    productsUsed:Math.max(...result.checks.map(c=>c.productsUsed)),rssBytes:process.memoryUsage().rss})+'\n');
}
const first=headers[1].record,negativeControls=[],throws=fn=>{try{fn();return false;}catch{return true;}},
  missing=structuredClone(first.update);missing.decomposed=missing.decomposed.filter(r=>r.m!==4);
negativeControls.push(check('missing-generated-fourth-mode-rejected',throws(()=>verifyCompleteAngularResidualUpdate(G,missing,first.proofLimits))));
const changed=structuredClone(first.update);changed.decomposed.find(r=>r.m===4).value[0].real=G.add(changed.decomposed.find(r=>r.m===4).value[0].real,G.one);
const wrong=createQuadraticSourceVerifier(G,first.proofLimits)(G.sub(changed.direct.find(r=>r.m===4).value[0].real,changed.decomposed.find(r=>r.m===4).value[0].real));
negativeControls.push(check('nonzero-changed-actual-quadratic-coefficient-rejected',wrong.pass===false));
const binding=structuredClone(first.operands.bindings.find(x=>!x.literalZero));binding.body=G.zero;
negativeControls.push(check('changed-whole-source-body-rejected',bodyBinding(binding)===false));
const tuple=structuredClone(first.operands.bindings.find(x=>!x.literalZero));tuple.parameters=tuple.parameters.slice(1);
negativeControls.push(check('omitted-original-source-argument-rejected',bodyBinding(tuple)===false));
const summary={schema:'MathScope.N6.ObservedSavedForcedCurrentReplay/1',inputSourceDirectory:input,
  observedSourceGraphNodeCount:sourceCount,observedSourceGraphSHA256:cumulative.digest('hex'),
  snapshots,checks,inverseChecks,curlChecks,conjugateChecks,boundChecks,supportChecks,remainderChecks,negativeControls,
  actualCoefficientComparisons:remainderChecks.reduce((n,r)=>n+r.checks.length,0),
  scalarIdentityCount:[inverseChecks,curlChecks,conjugateChecks,boundChecks,supportChecks].reduce((n,a)=>n+a.length,0),
  originalCombinedSourceRunPass:false,originalCombinedSourceRunStoppedReason:'OBSERVED_EXECUTION_TIME_LIMIT',
  wholeCurrentCertificateRecovered:false,privateSourceAuthorityHydrated:false,
  everyActualNonzeroModeAndMappedCutoffPotentialRetained:true,everyGeneratedFiniteResidualModeRetained:true,
  actualSourceClassBoundsEstablished:false,initializedJ0:false,originalN602Complete:false,completeN6:false,wholeM3Complete:false,
  numericalWholeFieldEnclosure:false,analyticSourceBodiesReplacedBySamples:false,pass:true};
await writeFile(output,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify({pass:true,actualCoefficientComparisons:summary.actualCoefficientComparisons,
  scalarIdentityCount:summary.scalarIdentityCount,structuralChecks:checks.length,negativeControls:negativeControls.length,
  nodeCount:sourceCount,rssBytes:process.memoryUsage().rss})+'\n');
