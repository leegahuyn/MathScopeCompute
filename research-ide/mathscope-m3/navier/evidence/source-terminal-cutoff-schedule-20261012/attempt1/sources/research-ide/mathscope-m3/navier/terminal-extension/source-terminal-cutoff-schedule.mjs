/** Source-valued differentiated cutoffs and a complete positive-window force sum.
 *
 * The source norm constants are retained as exact scalar programs. Their
 * provenance and all future terminal jets remain explicit premises until
 * the localized-current adapter supplies them. No velocity is continued.
 */
import {getPinnedSourceProfile} from '../../../mathscope-m2/navier/source-profile.mjs';
import {differentiatedTerminalCutoffConstant,terminalExtensionJoiningIdentity,
  differentiatedTerminalExtensionTail} from '../terminal-extension-kernel.mjs';
import {originalFinalCutoffRoot} from '../final-summation/source-final-summation.mjs';

const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const copy=x=>structuredClone(x),schedules=new WeakMap(),windows=new WeakMap(),extensions=new WeakMap();
const only=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))fail('INVALID_INPUT','Use only the specified inputs; caller-supplied authority is not accepted.');};
const natural=(x,label,max=64)=>{if(!Number.isSafeInteger(x)||x<0||x>max)fail('RESOURCE_LIMIT',label+' exceeds its finite integer budget.');return x;};
const root=(G,id)=>{if(!Number.isSafeInteger(id)||id<0||!G.nodes[id])fail('INVALID_SOURCE_ROOT','An existing root in the same source graph is required.');return id;};
const scalar=(G,id)=>{root(G,id);if(G.freeCoordinates(id).size)fail('COORDINATE_DEPENDENT_NORM','A terminal norm and cutoff scale must be independent of evaluation coordinates.');return id;};
const rational=(G,s)=>{const[n,d='1']=s.split('/');return G.q(BigInt(n),BigInt(d));};
const factorial=n=>{let x=1n;for(let j=2;j<=n;j++)x*=BigInt(j);return x;};

function graphSeal(G){
  const count=G.nodes.length,chunks=[];
  for(let k=0;k<count;k+=4096)chunks.push(canonical(G.nodes.slice(k,Math.min(count,k+4096))));
  const definitions=G.captureFunctionDefinitions?.()??null;
  if(definitions!==null&&typeof G.functionDefinitionsUnchanged!=='function')fail('UNSEALED_SOURCE_DEFINITIONS','Retained function definitions need an exact integrity check.');
  return {G,count,chunks,source:canonical(G.source),definitions};
}
function intact(s){
  if(s.G.nodes.length<s.count||canonical(s.G.source)!==s.source)return false;
  for(let k=0;k<s.count;k+=4096)if(canonical(s.G.nodes.slice(k,Math.min(s.count,k+4096)))!==s.chunks[k/4096])return false;
  return s.definitions===null||s.G.functionDefinitionsUnchanged(s.definitions);
}
function seal(map,G,record,extra={}){map.set(record,{metadata:canonical(record),graph:graphSeal(G),...extra});return record;}
function checked(map,record,code){const s=map.get(record);if(!s||s.metadata!==canonical(record)||!intact(s.graph))fail(code,'Use the unchanged internally constructed record and its complete source program.');return s;}

/** b_j is the least integer satisfying the differentiated constraints for
 * the retained positive norm majorants, not a floating-point root search.
 * The identity 1+N^2-N=(N-1/2)^2+3/4 proves the chosen norm enlargement.
 */
export function prepareSourceTerminalCutoffSchedule(G,input={}){
  only(input,['norms','maxAddedNodes']);
  const sequence=input.norms,maxAdded=natural(input.maxAddedNodes??100000,'Additional node count',1000000),before=G.nodes.length;
  if(!Array.isArray(sequence)||sequence.length<1||sequence.length>65)fail('INVALID_JET_SEQUENCE','Supply 1..65 consecutive terminal jet norm records.');
  if(typeof G.ceiling!=='function'||typeof G.maximum!=='function'||typeof G.freeCoordinates!=='function')fail('UNSUPPORTED_SOURCE_GRAPH','Exact source ceiling, maximum and coordinate analysis are required.');
  if(canonical(G.source?.parametersExactExpressions)!==canonical(getPinnedSourceProfile().parametersExactExpressions))fail('CHANGED_ORIGINAL_SOURCE','Retain every original source parameter definition.');
  const rows=[];
  for(let j=0;j<sequence.length;j++){
    const supplied=sequence[j];only(supplied,['j','norms']);
    if(supplied.j!==j||!Array.isArray(supplied.norms))fail('INVALID_JET_SEQUENCE','Terminal orders must be consecutive from zero.');
    const normMap=new Map();
    for(const row of supplied.norms){
      only(row,['a','boundRoot']);natural(row.a,'Spatial derivative order');
      if(normMap.has(row.a))fail('DUPLICATE_NORM','Each spatial norm order must occur once.');
      scalar(G,row.boundRoot);
      if(G.isq(row.boundRoot)&&G.fraction(row.boundRoot)[0]<0n)fail('NEGATIVE_NORM','A terminal norm upper bound cannot be negative.');
      normMap.set(row.a,{a:row.a,boundRoot:row.boundRoot,positiveMajorantRoot:G.add(G.one,G.pow(row.boundRoot,2))});
    }
    const largest=Math.floor(j/2);
    if(normMap.size!==largest+1||Array.from({length:largest+1},(_,a)=>a).some(a=>!normMap.has(a)))fail('JET_NORM_MISSING','Every C^a bound through floor(j/2), including a=0, is required.');
    const previousRoot=j?rows[j-1].bRoot:null,strictLowerRoot=j?G.add(previousRoot,G.one):G.one,clauses=[],constants=new Map();
    if(j)for(let a=0;a<=largest;a++)for(let m=0;m<=largest-a;m++){
      if(!constants.has(m))constants.set(m,differentiatedTerminalCutoffConstant(j,m));
      const constant=constants.get(m),norm=normMap.get(a),
        coefficientRoot=G.mul(rational(G,constant.value),norm.positiveMajorantRoot),
        thresholdRoot=G.mul(G.q(1n<<BigInt(j)),coefficientRoot),
        positiveRoot=G.exp(G.div(G.log(thresholdRoot),G.q(j-m)));
      clauses.push({a,m,power:j-m,constant,sourceNormRoot:norm.boundRoot,positiveMajorantRoot:norm.positiveMajorantRoot,
        coefficientRoot,thresholdRoot,positiveRoot,requiredUpper:'1/'+(1n<<BigInt(j))});
    }
    const maximumRoot=j?G.maximum(strictLowerRoot,...clauses.map(c=>c.positiveRoot)):G.one,
      bRoot=j?G.ceiling(maximumRoot):G.one;
    if(G.nodes.length-before>maxAdded)fail('RESOURCE_LIMIT','The complete terminal cutoff prefix exceeded its additional-node budget.');
    rows.push({j,bRoot,previousRoot,strictLowerRoot,maximumRoot,norms:[...normMap.values()].sort((a,b)=>a.a-b.a),clauses,
      requiredPairCount:clauses.length,positiveIntegerByConstruction:true,strictIncreaseByConstruction:j>0});
  }
  const record={schema:'MathScope.N7.SourceTerminalCutoffSchedule/1',reference:'(10.11)-(10.12)',rows,finiteJetOrder:rows.length-1,
    normMajorant:'Nbar=1+N^2>=|N|, because 1+N^2-|N|=(|N|-1/2)^2+3/4>0',
    integerChoice:'b0=1; bj=ceil(max(b_(j-1)+1, max_(a+m<=floor(j/2)) exp(log(2^j*C_(j,m)*Nbar_(j,a))/(j-m))))',
    proof:[
      'Every retained norm majorant is at least one; every cutoff constant and threshold is positive. All logarithms and real roots have their full positive domains.',
      'The power j-m is positive for every required pair. Thus b^(j-m)>=threshold is equivalent to b>=exp(log(threshold)/(j-m)).',
      'The ceiling of the maximum is the least integer satisfying every retained inequality and b>b_previous. No logarithm or source parameter is rounded.',
      'For every required pair, C_(j,m)*Nbar_(j,a)*b_j^(m-j)<=2^-j. The complete Leibniz constant and every separate C^a norm remain in the program.'
    ],
    minimalForRetainedNormMajorants:true,minimalForUnknownTrueSupremumClaimed:false,
    numericSourceParametersUsed:false,integerValuesMaterialized:false,
    suppliedNormsAreExplicitPremises:true,sourceNormsAuthenticated:false,globalTerminalJetsAuthenticated:false,
    allOrderSourceNormGeneratorRequired:true,allOrderCompletion:false,originalN705Complete:false,wholeM3Complete:false};
  return seal(schedules,G,record);
}

export function assertSourceTerminalCutoffSchedule(schedule){checked(schedules,schedule,'INVALID_TERMINAL_SCHEDULE');return true;}

/** At this positive window all possible summands are known, conditional
 * only on using the same strictly increasing continuation of the schedule.
 * No claim about the infinite active set at sigma=0 is made.
 */
export function prepareSourceTerminalPositiveWindow(G,schedule,input={}){
  const s=checked(schedules,schedule,'INVALID_TERMINAL_SCHEDULE');
  if(s.graph.G!==G)fail('WRONG_SOURCE_GRAPH','The window and cutoff schedule must use one source graph.');
  only(input,['firstInactiveOrder','maxAddedNodes']);
  const J=natural(input.firstInactiveOrder,'First inactive order'),maxAdded=natural(input.maxAddedNodes??1000,'Additional node count',1000000),before=G.nodes.length;
  if(J<1||J>=schedule.rows.length)fail('INCOMPLETE_CUTOFF_PREFIX','The complete prefix through a positive first inactive order is required.');
  const b=schedule.rows[J].bRoot,previous=schedule.rows[J-1].bRoot,lower=G.inv(b),previousSupport=G.inv(previous),
    upper=G.div(G.add(lower,previousSupport),G.q(2)),width=G.sub(upper,lower);
  if(G.nodes.length-before>maxAdded)fail('RESOURCE_LIMIT','The exact positive window exceeded its additional-node budget.');
  const record={schema:'MathScope.N7.SourceTerminalPositiveWindow/1',firstInactiveOrder:J,
    roots:{firstInactiveScale:b,previousScale:previous,lower,upper,width,previousSupport},
    endpoints:'closed',possibleActiveOrders:Array.from({length:J},(_,j)=>j),inactiveOrdersStart:J,
    proof:[
      'b_J>b_(J-1)>=1 implies 0<1/b_J<(1/b_J+1/b_(J-1))/2<1/b_(J-1)<=1.',
      'For sigma in this window, j>=J gives b_j*sigma>=b_J/b_J=1, so its original cutoff is exactly zero, including the support seam.',
      'Every order j<J satisfies b_j*sigma<1 and is retained; it may lie on a plateau or inside the transition. No angular, spatial or jet operand is dropped.'
    ],completeForAnyStrictlyIncreasingContinuation:true,everyPossiblyActiveOrderListed:true,
    omittedForceOnWindow:'exactly zero for every j>=J under the same increasing continuation',
    allFutureSourceNormsAuthenticated:false,actualTerminalJetsAuthenticated:false,
    windowIncludesTerminalTime:false,originalN705Complete:false,wholeM3Complete:false};
  return seal(windows,G,record,{schedule});
}

export function assertSourceTerminalPositiveWindow(window){const s=checked(windows,window,'INVALID_TERMINAL_WINDOW');assertSourceTerminalCutoffSchedule(s.schedule);return true;}

/** The vector inputs are the supplied F_j themselves, not velocity jets.
 * This generic consumer keeps their provenance explicit. A later original
 * adapter must supply the whole localized-force jets on K and their norms.
 */
export function constructSourceTerminalForceWindow(G,window,input={}){
  assertSourceTerminalPositiveWindow(window);const w=windows.get(window);
  if(w.graph.G!==G)fail('WRONG_SOURCE_GRAPH','All terminal force operands must share the cutoff program.');
  only(input,['coordinates','jets','maxAddedNodes']);
  const coordinates=input.coordinates,maxAdded=natural(input.maxAddedNodes??100000,'Additional node count',1000000),before=G.nodes.length;
  if(!Array.isArray(coordinates)||coordinates.length!==4||new Set(coordinates).size!==4||coordinates.some(id=>G.nodes[root(G,id)].op!=='coordinate'))fail('INVALID_CARTESIAN_COORDINATES','Use distinct x,y,z and sigma coordinates.');
  const xyz=new Set(coordinates.slice(0,3)),sigma=coordinates[3],active=window.possibleActiveOrders;
  if(!Array.isArray(input.jets)||input.jets.length!==active.length)fail('INCOMPLETE_ACTIVE_FORCE','Supply every possibly active terminal force jet exactly once.');
  const supplied=new Map();
  for(const jet of input.jets){
    only(jet,['j','forceRoots']);natural(jet.j,'Terminal force jet order');
    if(supplied.has(jet.j)||!active.includes(jet.j))fail('INCOMPLETE_ACTIVE_FORCE','Every active order must occur once, with no substituted order.');
    if(!Array.isArray(jet.forceRoots)||jet.forceRoots.length!==3)fail('INVALID_FORCE_VECTOR','Each force jet must retain all three Cartesian components.');
    for(const id of jet.forceRoots){root(G,id);if([...G.freeCoordinates(id)].some(c=>!xyz.has(c)))fail('TIME_DEPENDENT_TERMINAL_JET','A terminal jet may depend on x,y,z and source constants, never sigma or an unsubstituted source coordinate.');}
    supplied.set(jet.j,jet);
  }
  const rows=active.map(j=>{
    const forceRoots=supplied.get(j).forceRoots,bRoot=w.schedule.rows[j].bRoot,argumentRoot=G.mul(bRoot,sigma),
      cutoffRoot=G.mul(originalFinalCutoffRoot(G,argumentRoot),originalFinalCutoffRoot(G,G.neg(argumentRoot))),
      factorialExact=String(factorial(j)),timeFactorRoot=G.div(G.mul(cutoffRoot,G.pow(sigma,j)),G.q(BigInt(factorialExact))),
      termRoots=forceRoots.map(id=>G.mul(timeFactorRoot,id));
    return {j,bRoot,argumentRoot,cutoffRoot,factorial:factorialExact,timeFactorRoot,forceRoots:[...forceRoots],termRoots};
  });
  const forceRoots=[0,1,2].map(k=>G.add(...rows.map(row=>row.termRoots[k])));
  if(G.nodes.length-before>maxAdded)fail('RESOURCE_LIMIT','The complete force window exceeded its additional-node budget.');
  const record={schema:'MathScope.N7.ConstructedSourceTerminalForceWindow/1',reference:'(10.11)',coordinates:[...coordinates],window:copy(window),
    rows,forceRoots,extensionFormula:'sum_(j=0)^(J-1) chi(b_j*sigma)*chi(-b_j*sigma)*sigma^j*F_j(x)/j!',
    allPossibleActiveOrdersIncluded:true,retainedFullCartesianForceVectors:true,
    windowOmittedTail:copy(window.omittedForceOnWindow),
    compactTimeSupport:{from:1,to:2,reason:'Each original chi0 term is zero for sigma>=1/b_j<=1. Spatial support is inherited from every supplied F_j.'},
    conditionalJoining:active.map(j=>terminalExtensionJoiningIdentity(j)),
    differentiatedTailDependency:differentiatedTerminalExtensionTail({firstOmittedOrder:active.length}),
    suppliedTerminalJetsAreExplicitPremises:true,originalLocalizedForceJetsAuthenticated:false,sourceNormsAuthenticated:false,
    finiteWindowForceConstructed:true,velocityExtendedPastOne:false,allOrderJoiningEstablished:false,
    originalN704Complete:false,originalN705Complete:false,wholeM3Complete:false};
  return seal(extensions,G,record,{window});
}

export function assertSourceTerminalForceWindow(record){const s=checked(extensions,record,'INVALID_TERMINAL_FORCE_WINDOW');assertSourceTerminalPositiveWindow(s.window);return true;}
