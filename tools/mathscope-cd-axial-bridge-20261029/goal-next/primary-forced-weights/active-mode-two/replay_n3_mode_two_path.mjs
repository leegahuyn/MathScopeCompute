import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {createGunzip} from 'node:zlib';

assert.equal(process.argv.length,6,'Use GOAL_NEXT N3_ARCHIVE ORIGINAL_RESEARCH_IDE OUT_JSON');
const [, ,goal,n3,runtime,out]=process.argv;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function pinned(path,expected,parse=true){
  assert.notEqual(resolve(path),resolve(out));
  const bytes=await readFile(path);
  assert.equal(sha(bytes),expected,path);
  return parse?JSON.parse(bytes):bytes.toString('utf8');
}
const graphSHA='f59857c4616e90727e64d9aa77b8ee8a51082274c16cff53098ea7f5db5f511c';
const registrySHA='75c53ba678b7db51dc53527d6b753d76e1fc013d515ff253b7b581513b0b53a0';
const manifestSHA='45a457d4701ddb327603e596137a190a7e56e77036e3da3174fcbdb4983e2ac5';
const prefixSHA='ec36d9c4fda80ae2f431cc27b4ab8c2d635c1e2a874bec2d1a4d3426f01341a5';
const graphDir=resolve(n3,'original-whole-k-current-pressure-graph');
const modules={
  initialized:['mathscope-m3/navier/source-initialized-angular.mjs','3e4f32a554e8e2ceccd3e003aa220c2f191c23b98cceb3b07f1f2d81e4bf2f1d'],
  pressure:['mathscope-m3/navier/source-global-pressure.mjs','fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d'],
  angular:['mathscope-m3/navier/source-global-angular.mjs','4e9c3ea67b124a953856f83d0aca0dcfec4b01a245043424de2bb035b8d902ca'],
  harmonic:['mathscope-m3/navier/source-harmonic-assembly.mjs','339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20'],
  representative:['mathscope-m3/navier/source-global-representative.mjs','f3fbcf74b42c59cbfdd563e0fddcba9fab5cad782a96695930e3445c50373541'],
  current:['mathscope-m3/navier/source-global-current.mjs','93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760'],
  band:['mathscope-m3/navier/source-global-band.mjs','babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'],
  partition:['mathscope-m2/navier/actual-covariance-source-certificate.mjs','c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681'],
  expression:['mathscope-m2/navier/actual-continuation-exact-functions.mjs','326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311'],
  quadratic:['mathscope-m3/navier/source-quadratic-identity.mjs','696ff2202a9fb58e4de791a264fa23321fd81774f1f1a4f8336803d6a10b5bcd'],
  orderOne:['mathscope-m2/navier/actual-continuation-exact-order-one.mjs','bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72']
};
const priors={
  compare:['whole-k-atlas/n3-n4-live-band.json','f02566f58e5364cba32a8c077a1fa2eb9c2a686b512f8b4242b0461e18d2d15f'],
  scales:['whole-k-selector-scales/fourth/fourth-selector-maxima.json','5a6ecee45d797d582e3218c36f980d5eb131619c860cec1bfb4d57aea89cdf56'],
  leading:['whole-k-annular-wrz-norm/numerical/leading-outer-c10/leading-outer-c10.json','a2937d2c2066946f3dbe0a1be2a883766266a0b984914b67780ab81e55eadcbb']
};
const load=async (dir,rows,parse)=>Object.fromEntries(await Promise.all(Object.entries(rows).map(async ([key,[path,hash]])=>
  [key,await pinned(resolve(dir,path),hash,parse)])));
const [prefix,manifest,registry,code,{compare,scales}]=await Promise.all([
  pinned(resolve(n3,'original-whole-k-prefix.json'),prefixSHA),
  pinned(resolve(graphDir,'original-source-export-manifest.json'),manifestSHA),
  pinned(resolve(graphDir,'original-source-functions.json'),registrySHA),
  load(runtime,modules,false),load(goal,priors,true)
]);
assert.equal(prefix.requestedPrefix,3);
assert.equal(prefix.scope.originalCurrentPressurePrivateSeals,true);
assert.equal(prefix.scope.exactPrefixDomain.prefixOrder,3);
assert.equal(prefix.scope.exactPrefixDomain.nextScale,2081695);
assert.deepEqual(compare.originalGraphPins['3'],[graphSHA,registrySHA]);
assert.equal(compare.scaleReceiptSHA256,priors.scales[1]);
assert.deepEqual(scales.exactRatios,{'b1*qBig':1,'b2*qBig':16,'b3*qBig':32,'b4*qBig':64});
assert.equal(manifest.node_count,3914395);
assert.equal(manifest.node_stream_sha256,graphSHA);
assert.equal(manifest.definitions_sha256,registrySHA);
assert.equal(manifest.extended_coupled_registry_included,false);
const fragments={
  angular:['C.scale(G.q(1,2),x)',"name:'OriginalAll81InitialAngular_'+name"],
  initialized:['localMap=body=>G.simultaneousSubstitute(atRepresentative(body)',
    'nonzeroAngularForcing=subtractVectorRows(G,waveResidual,primaryFlatResidual).filter(row=>row.m!==0)'],
  pressure:['center:label.centers[signIndex]','matrix:b.matrix.value','representative.roots.X,representative.roots.eta,representative.roots.s'],
  partition:['nearestBand=floor(G.add(bandCoordinate,q(1,2)))','nearestMesh=meshCoordinates.map(x=>floor(G.add(x,q(1,2))))'],
  representative:['negativeWidth','scale=G.pow(ell,6),width=G.div(q(3,4),scale)','s=G.monotoneRoot(band.chart.system,[reduction.Z,reduction.T])'],
  band:['G.mul(selected.scale,q0)','F0=atRep(leadingFields.F)'],
  orderOne:['const Xb=G.mul(XR,G.exp(G.outer.stages.at(-1).end));']
};
for(const [name,lines] of Object.entries(fragments))for(const line of lines)
  assert.ok(code[name].includes(line),name+' '+line);

const decode=x=>typeof x==='string'?JSON.parse(x):x;
const base=decode(registry.base),defs=decode(base.expression),top=decode(registry.expressionDefinitions),fields=decode(registry.fieldDefinitions);
const localParameters=[2086981,2086982,2086983,2086970,2088089,2088090,2088091,2087270,2086984];
assert.deepEqual(fields.map(f=>f.name),['rr','rtheta','rz','thetatheta','thetaz','zz'].map(s=>'GlobalCompleteCommonTorus_'+s));
const row=fields[0].rows.find(row=>row.label.key==='0:0:0:0'&&row.label.sign===1);
assert.deepEqual(row.localParameters,localParameters);
assert.deepEqual(row.values,[2096457,2096461,2096462,2096413,2096470,2096474,2096478,2105453,2105458]);
assert.deepEqual(row.guards,[[2087003,3617,28826],[2096480,2089425,120836],[2096482,2089425,120836],
  [2096484,2089425,120836],[2096415,2089425,120836]]);
assert.equal(top[-1-row.localSystem].body,row.localBody);
assert.equal(top[-1-row.localSystem].name,'GlobalCommonTorusOriginalFullCurl_1_rr');
assert(![...defs,...top,...fields].some(x=>/InitializedAngular|InitializedOriginalWave|ActualOriginalForced/.test(x.name)));
assert.equal(manifest.operation_histogram.m3_forced_pulse_partial,undefined);
const pulse=decode(base.m3GlobalPulses)[0];
assert.deepEqual([pulse.variable,pulse.length,pulse.parameters,pulse.matrix],[
  2086984,2087262,[2086981,2086982,2086983,2086986,2086987,2086988,2086970],
  [[2087586,2087563],[2087567,2087587]]
]);
const Gnodes=new Map(),streamHash=createHash('sha256');
const stream=createReadStream(resolve(graphDir,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
stream.on('data',bytes=>streamHash.update(bytes));
let count=-1;
for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
  if(count>=2086960&&count<=2105473||[19,20,24,25,28826,3617].includes(count))Gnodes.set(count,JSON.parse(line));
  count++;
}
assert.equal(count,manifest.node_count);
assert.equal(streamHash.digest('hex'),graphSHA);
const exact=(id,op,args)=>assert.deepEqual(Gnodes.get(id),{op,args},'archived #'+id);
const get=(id,op)=>{
  const n=Gnodes.get(id);
  assert.equal(n?.op,op,'archived #'+id);
  return n.args;
};
const coordinates=[2086981,2086982,2086983],rep=[2088184,2088189,2088169];
const formal=[...coordinates,2087270,2086984,2086986,2086987,2086988,2086970,2088089,2088090,2088091];
const frozen=formal.map((x,i)=>i>=5&&i<=7?rep[i-5]:x);
const systems=[1778,1779,1780],potential=[2089556,2089557,2089558];
const normal=[2087369,2087371,2087375],amp=[2089541,2089542,2089543],k=2086980,epsilon=2086977,aFast=2089388;
const kNormalInverse=2087589,call=[2089559,2089560,2089561];
const real=[2089593,2089595,2089597],imaginary=[2089598,2089600,2089602];
const cross=[[1,2],[2,0],[0,1]],delta=j=>Array.from({length:12},(_,i)=>Number(j===i));
const derivatives={R:[2089562,2089566,2089570],xi:[2089563,2089567,2089571],Z:[2089574,2089576,2089578]};
const Dr=[2089565,2089569,2089573],Dz=[2089575,2089577,2089579];
const unscaledCross=[2089547,2089551,2089555],leadingCross=[2089583,2089587,2089591];
function verifyCross(id,a,b,i,j){
  const [plus,minus]=get(id,'add');
  exact(plus,'multiply',[a[i],b[j]]);
  const [,other]=get(minus,'multiply');
  exact(minus,'multiply',[20,other]);
  exact(other,'multiply',[a[j],b[i]]);
}
for(const [j,id] of systems.entries()){
  assert.deepEqual([defs[id].name,defs[id].body,defs[id].parameters],['GlobalOriginalPotential_1_'+j,potential[j],formal]);
  const [i,l]=cross[j];
  verifyCross(unscaledCross[j],normal,amp,i,l);
  exact(potential[j],'multiply',[kNormalInverse,unscaledCross[j]]);
  exact(call[j],'actual_expression_partial',[id,formal,delta(-1)]);
  for(const [name,axis] of [['R',0],['Z',1],['xi',3]])exact(derivatives[name][j],'actual_expression_partial',[id,formal,delta(axis)]);
  exact(Dr[j]-1,'multiply',[aFast,derivatives.xi[j]]);
  exact(Dr[j],'add',[derivatives.R[j],Dr[j]-1]);
  exact(Dz[j],'multiply',[epsilon,derivatives.Z[j]]);
  verifyCross(leadingCross[j],normal,call,i,l);
  exact(real[j]-1,'multiply',[k,leadingCross[j]]);
  exact(real[j],'multiply',[20,real[j]-1]);
}
exact(imaginary[0],'multiply',[20,Dz[1]]);
exact(imaginary[1]-1,'multiply',[20,Dr[2]]);
exact(imaginary[1],'add',[Dz[0],imaginary[1]-1]);
exact(imaginary[2]-1,'multiply',[2087370,call[1]]);
exact(imaginary[2],'add',[Dr[1],imaginary[2]-1]);
exact(2088169,'actual_monotone_root',[2,2088155,2088168]);
exact(2088184,'multiply',[2088181,2088183]);
exact(2088189,'multiply',[2088155,2088188]);
exact(2090219,'actual_expression_partial',[1780,frozen,delta(-1)]);
exact(2090232,'actual_expression_partial',[1779,frozen,delta(-1)]);
exact(2090239,'actual_expression_partial',[1779,frozen,delta(1)]);
const liveS=2086999,Q=2086973,qLive=2087009;
exact(liveS,'actual_monotone_root',[2,2086982,2086983]);
exact(qLive,'multiply',[Q,liveS]);
for(const [j,r] of prefix.selector.activeBackgroundRows.entries()){
  assert.equal(r.order,j+1);
  exact(r.sigma,'multiply',[2081477,r.scale]);
  const [functionID,inputs,order]=get(r.chi,'actual_expression_partial');
  assert.deepEqual([inputs,order],[[r.sigma],[0]]);
  assert.equal(defs[functionID].name,'CommonOriginalTimeCutoff');
}
exact(2098732,'multiply',[2081695,qLive]);

// Check the exact interior fixed-label example with integer inequalities.
const ellMin=8n,ell=ellMin+15n,S=ell**6n;
assert(5n**4n<8n*4n**4n&&5n**2n<2n*4n**2n); // nearest band and strict 3/4 guard
assert(75n<S); // w=3/(4 ell^6)<1/100 at every original ell>=23
assert(200n<2n*S); // nearest time center within 1/100
assert(100n*(16n*S+9n)<32n*S*S); // 1/(2S)+w^2/2 < 1/100
const physical=['1/40','2/5','4/5','8/5'];
const frozenIntervals=[['79/3200','81/3200'],['79/200','81/200'],['79/100','81/100'],['79/50','81/50']];

const imp=name=>import(pathToFileURL(resolve(runtime,modules[name][0])).href);
const [{ActualConvergentExpressions},{exactOriginalAngularLift,originalFixedLiftPulsePath},
  {exactHarmonicComplexAlgebra,exactAngularResidualUpdate,originalCylindricalDifferentialOperators},
  {createQuadraticSourceVerifier}]=await Promise.all([imp('expression'),imp('initialized'),imp('harmonic'),imp('quadratic')]);
const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one;
const s2=G.sqrt(q(2)),Lambda=G.sub(q(4),s2),Tg=G.add(q(4),s2),Dgeom=G.sub(q(4),G.mul(q(2),s2));
const fresh=name=>G.fresh('active_n3_'+name);
const [R,Z,T,theta,Y0,Y1,c0,c1,i0,i1,ci,a,eps,w,carrier,p,pz,x0,H0,Hr,Hz,Ht]=
  ['R','Z','T','theta','Y0','Y1','c0','c1','i0','i1','ci','a','eps','w','carrier','p','pz','x0','H0','Hr','Hz','Ht'].map(fresh);
const C=exactHarmonicComplexAlgebra(G),half=q(1,2),I=C.value(z,o),checks=[];
const H=G.add(H0,G.mul(Hr,R),G.mul(Hz,Z),G.mul(Ht,T)),params=[R,Z,T];
for(let d=0;d<=4;d++){
  const lift=exactOriginalAngularLift(G,{R,Z,T,theta,Y:[Y0,Y1],center:[c0,c1],copy:[i0,i1],levelDifference:d,
    vr:[o,G.sub(o,s2)],vt:[G.sub(s2,o),o],Dgeom,ci,r0:q(1,1n<<34n),Tg,Lambda,radialFast:a,epsilon:eps});
  const path=originalFixedLiftPulsePath(G,{lift,w});
  const U=[0,1,2].map(j=>{
    const scalar=part=>G.add(fresh(part+j),...[...params,lift.xi,lift.v].map((x,l)=>G.mul(fresh(part+j+'d'+l),x)));
    return C.scale(half,C.value(scalar('L'),scalar('J')));
  });
  const phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),eps),G.mul(x0,R)),G.mul(lift.v,H));
  const D=originalCylindricalDifferentialOperators(G,lift.geometry),ir=G.inv(R),
    apply=(f,x)=>C.value(f(x.real),f(x.imaginary)),
    n=[D.Dr(phase),D.angular(phase),D.Dz(phase)],
    old={m:0,velocity:[0,1,2].map(j=>C.value(fresh('mean'+j))),pressure:C.value(fresh('meanP'))},
    wavePressure=C.value(z,fresh('waveP')),
    increment=[{m:1,velocity:U,pressure:wavePressure},
      {m:-1,velocity:U.map(C.conjugate),pressure:C.conjugate(wavePressure)}];
  const update=exactAngularResidualUpdate(G,{geometry:lift.geometry,phase,k:carrier,previous:[old],increment,oldFlatResidual:[]});
  const direct=update.direct.find(x=>x.m===2).value,rotation=[C.neg(U[1]),U[0],C.zero];
  const div0=C.add(apply(D.Dr,U[0]),apply(D.Dz,U[2]),C.scale(ir,U[0]));
  const divPhase=C.scale(carrier,C.mul(I,C.add(...U.map((x,j)=>C.scale(n[j],x)))));
  const reduced=U.map((x,j)=>C.add(C.mul(U[0],apply(D.Dr,x)),C.mul(U[2],apply(D.Dz,x)),
    C.neg(C.mul(x,div0)),C.scale(ir,C.mul(U[1],rotation[j]))));
  const compare=U.map((x,j)=>C.sub(direct[j],C.add(reduced[j],C.scale(q(2),C.mul(x,C.add(div0,divPhase))))));
  const verify=createQuadraticSourceVerifier(G,{maxTerms:200000});
  for(const c of compare)assert(verify(c.real).pass&&verify(c.imaginary).pass,'lift '+d);
  checks.push({levelDifference:d,lift:lift.checks.length,Hw:path.checks.length,modeTwo:6,nativePathFormula:path.originalOperatorFormula});
}
const receipt={
  schema:'MathScope.ActiveN3LocalModeTwoReplay/1',status:'VERIFIED_ACTIVE_N3_CURRENT_OPERANDS_AND_RECONSTRUCTED_LOCAL_MODE_TWO',
  archive:{graphSHA,registrySHA,manifestSHA,prefixSHA,nodeCount:count,hostedRun:43057719849},
  activeOriginalChart:{ell:'ellMinimum+15',Q:'qBig/32',q:'qBig/40',s:'4/5',R:'2',Z:'0',T:'4/5',X:'5/2',eta:'0',
    label:row.label.key,grid:['2 ell^6','0','floor(4 ell^6/5 + 1/2)'],physicalSelectorArguments:physical,
    frozenRepresentative:{sRoot:2088169,RRoot:2088180,ZRoot:2088155,TRoot:2088168,XRoot:2088184,etaRoot:2088189,
      R:'2',Z:'-3/(8 ell^6)',T:'floor(4 ell^6/5+1/2)/ell^6',sInterval:['79/100','81/100'],selectorArguments:frozenIntervals}},
  actualNative:{cover:row,sourcePulseMatrix:pulse.matrix,sourcePulseLength:pulse.length,sourcePulseFormals:pulse.parameters,
    liveS,Q,qLive,cutoffRows:prefix.selector.activeBackgroundRows,potential,formals:formal,frozenActual:frozen,normal,real,imaginary,
    nativeCurlDerivatives:{...derivatives,Dr,Dz},halfAmplitude:'Original positive complex wave is (real+i imaginary)/2.'},
  exactLocalReplay:{checks,interpretation:'Original lift/path and harmonic kernel replay with typed local wave and derivative slots. The six archived full-curl coefficient roots supply the slots; no numerical wave value or private initialized state was instantiated.'},
  firstAbsentSourceWitness:{stage:'attachGlobalInitializedAngular',reason:'The authenticated current/pressure registry contains no initialized-angular or Forced templates, and no m3_forced_pulse_partial node.',
    required:['actual native initialized positive wave wrappers after atRepresentative and the fixed lift',
      'the same template mode-two raw and supported vector roots','the ten active Forced systems or a narrow witness export including projected input, actual H_w argument vector and mapped outputs']},
  scope:'One admitted physical slow chart and matching frozen representative. Its auxiliary rectangle has an exact center lift, but membership of the actual physical torus evaluation at this slow point is not asserted. The local replay is not a private Initialized Angular or Forced C3 seal.',
  pins:{modules,priors},release:'HOLD'
};
await writeFile(out,JSON.stringify(receipt)+'\n');
console.log(JSON.stringify({status:receipt.status,archiveNodes:count,lifts:checks.length,SHA256:sha(await readFile(out))}));
