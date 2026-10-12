/** A conditional arithmetic-shape regression ONLY. This is not a private
 * source certificate, and does not compute the actual selected ell. */
import fs from 'node:fs';
import {numericalExponentialArithmetic} from '../actual-numerical-exponential-arithmetic.mjs';
import {evaluateClosedArithmeticDefinitions} from '../actual-closed-parameter-arithmetic.mjs';
import {getPinnedSourceProfile} from '../source-profile.mjs';
import {positiveBandGeometricIntervals,finiteJetClosedNumericalScale} from '../actual-positive-geometric-scale-kernel.mjs';
const evidence=new URL('../research/evidence/',import.meta.url),read=x=>JSON.parse(fs.readFileSync(new URL(x,evidence),'utf8')),
  old=read('closed-selection-arithmetic-20261011/draft-Bnorm-rotating-memo.json'),target=read('physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt2-target-certificate.json'),
  bodies=read('physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt2-finite-bodies-certificate.json'),
  N=numericalExponentialArithmetic({maxOperations:3000000,maxMemoEntries:30000}),parameters=evaluateClosedArithmeticDefinitions(getPinnedSourceProfile().parametersExactExpressions,N),
  ell=N.add(N.fromClosed(old.rows.find(r=>r.name==='ellMinimum').interval),N.point(12)),t=Object.fromEntries(target.numerics.rows.map(r=>[r.name,N.fromClosed(r.interval)])),
  s=positiveBandGeometricIntervals(N,{ell,h:parameters.values.get('h'),u:N.div(N.point(2),parameters.values.get('directionalMarginKappa')),
    F:t.F,gamma:t.gamma,g:t.g,tau:t.tau,Ac:t.Ac,profileRadius:t.profileRadius,sigmaIntegral:N.point('1/3')}),reports=[],errors=[];
function run(name,thunk){try{const r=N.reportInterval(thunk());reports.push({name,coordinateDefinition:r.coordinateDefinition,width:r.coordinateWidth,pass:r.toleranceMet});}
  catch(e){errors.push({name,code:e.code??null,message:e.message});}}
for(const[k,v]of Object.entries(s))if(v?.lower&&v?.upper&&!['T','etaBeta'].includes(k))run(k,()=>v);
for(const[k,v]of Object.entries(s.Omega))run('Omega_'+k,()=>v);for(let j=0;j<3;j++)run('V_'+j,()=>s.V[j]);
const cache=new Map();for(const[j,row]of [...bodies.rows,...bodies.physical.rows].entries()){
  const key=JSON.stringify([row.quantity,row.component,row.derivative,row.order]);if(!cache.has(key)){cache.set(key,true);run('scale_'+j,()=>finiteJetClosedNumericalScale(N,s,row));}}
const result={schema:'MathScope.ConditionalScaleShapeSmoke/1',sourceAuthenticated:false,originalEllNumericallyEnclosedHere:false,
  assumption:'For arithmetic shape testing ONLY ell=ellMinimum+12 and sigmaIntegral=1/3 are assumed. This does not issue an enclosure of the original first-selector value.',
  originalBodyRowCount:bodies.rows.length+bodies.physical.rows.length,distinctScaleRecipeCount:cache.size,reports,errors,pass:errors.length===0,arithmetic:N.report()};
fs.writeFileSync(new URL('closed-selection-arithmetic-20261011/conditional-scale-shape-smoke.json',evidence),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:result.pass,reportCount:reports.length,errorCount:errors.length,errors}));if(errors.length)process.exitCode=1;
