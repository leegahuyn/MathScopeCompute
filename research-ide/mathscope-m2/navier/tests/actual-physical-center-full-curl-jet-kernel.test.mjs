import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {phaseZeroCompleteCurlJet,phaseZeroCylindricalAngularCurlJet,phaseZeroCompleteCurlJetAlgebraAudit,completeCylindricalCurlDifferentialAudit,
  physicalCenterCompleteCurlErrorPowerAudit,enclosePhysicalCompleteCurlJetCoefficients} from '../actual-physical-center-full-curl-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {rational as Q,readRational,qcompare} from '../actual-continuation-arithmetic.mjs';

test('full first and all six second curl derivatives retain the sine coefficient terms',()=>{
  const p=phaseZeroCompleteCurlJetAlgebraAudit(new ActualConvergentExpressions());
  assert.equal(p.pass,true);assert.equal(p.audit.first.length,3);assert.equal(p.audit.second.length,6);
  assert.ok(p.checks.every(x=>x.pass));assert.equal(p.audit.coefficientOrderNeededForNumericalValues,2);
  assert.equal(p.audit.phaseOrderNeededForNumericalValues,3);assert.equal(p.audit.totalPotentialOrderForSecondCurlJet,3);
  assert.equal(p.audit.coefficientCurlOrItsFirstDerivativesDiscarded,false);
});
test('phase zero does not permit differentiation of the value identity',()=>{
  const p=phaseZeroCompleteCurlJetAlgebraAudit(new ActualConvergentExpressions());
  assert.equal(p.negativeControls.missingSineDerivative.pass,false);assert.equal(p.negativeControls.missingRepeatedTerm.pass,false);
});
test('variable radial fast chain and the cylindrical connection give exact div curl zero',()=>{
  const p=completeCylindricalCurlDifferentialAudit(new ActualConvergentExpressions());
  assert.equal(p.pass,true);assert.equal(p.check.pass,true);assert.equal(p.negative.pass,false);
  assert.equal(p.geometricConnectionRetained,true);assert.equal(p.fastTransverseChainRetained,true);
});
function angularFixture(){
  const G=new ActualConvergentExpressions(),[R,Z,T,theta,xi,v]=['R','Z','T','theta','xi','v'].map(n=>G.fresh('angular_fixture_'+n)),
    parameters=[R,Z,T,theta,xi,v],epsilon=G.fresh('angular_fixture_frozen_epsilon'),frequency=G.fresh('angular_fixture_frozen_frequency'),
    share=(body,name)=>{const system=G.defineExpressionFunction({name,parameters,body,derivativeLimits:parameters.map(()=>3)});return G.expressionValue(system,parameters);},
    leading=[G.add(R,G.mul(Z,theta),G.mul(xi,v)),G.add(G.pow(R,2),G.mul(T,theta)),G.add(G.mul(Z,R),G.pow(theta,2))].map((x,j)=>share(x,'AngularLeading_'+j)),
    coefficientCurl=[G.add(G.mul(R,theta),Z),G.add(v,G.mul(theta,T)),G.add(G.mul(R,Z),G.mul(xi,theta))].map((x,j)=>share(x,'AngularCurlCoefficient_'+j)),
    phase=share(G.add(G.mul(R,theta),G.mul(Z,T),G.mul(xi,Z),G.pow(theta,2)),'AngularNonlinearPhase'),
    operators=[{name:'r',apply:x=>G.add(G.derivative(x,R),G.mul(G.q(2),R,G.derivative(x,xi)))},
      {name:'z',apply:x=>G.mul(epsilon,G.derivative(x,Z))},{name:'t',apply:x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.derivative(x,v))}],
    angular=x=>G.div(G.derivative(x,theta),R),
    result=phaseZeroCylindricalAngularCurlJet(G,{leading,coefficientCurl,phase,frequency,radius:R,operators,angular});
  return {G,R,leading,coefficientCurl,phase,frequency,operators,angular,result};
}
test('all twelve angular mixed and repeated vector Hessian rows retain the complete phase and basis terms',()=>{
  const {result:p}=angularFixture();assert.equal(p.pass,true);assert.equal(p.first.length,3);assert.equal(p.second.length,12);
  assert.ok(p.first.every(r=>r.pass&&r.includesCylindricalFrameConnection));assert.ok(p.second.every(r=>r.pass&&r.includesCylindricalFrameConnection));
  for(const key of ['rtheta','ztheta','ttheta','thetatheta'])assert.equal(p.second.filter(r=>r.directions.join('')===key).length,3);
  assert.equal(p.second.filter(r=>r.includesAngularDirectionConnection).length,3);assert.equal(p.sourceAuthenticated,false);
  assert.equal(p.coefficientOrderNeededForNumericalValues,2);assert.equal(p.phaseOrderNeededForNumericalValues,3);
});
test('dropping the direction connection the rotating vector basis or a repeated angular product is detected',()=>{
  const {G,R,leading,coefficientCurl,frequency,angular,result:p}=angularFixture(),row=p.second.find(r=>r.component===0&&r.directions.join('')==='thetatheta'),
    firstWithoutBasis=G.sub(angular(leading[0]),G.mul(frequency,coefficientCurl[0],p.phaseAngularFirst)),
    omittedRepeated=G.mul(frequency,row.coefficientCurlFirst[0],p.phaseAngularFirst);
  assert.equal(sourceGraphRationalIdentity(G,row.zeroPhaseDirectionConnection,{maxTerms:15000}).pass,false);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(p.first[0].expected,firstWithoutBasis),{maxTerms:15000}).pass,false);
  assert.equal(sourceGraphRationalIdentity(G,omittedRepeated,{maxTerms:15000}).pass,false);
  assert.notEqual(R,G.zero);
});
test('the Cartesian affine position vector has zero cylindrical spatial Hessian only with the direction connection',()=>{
  const G=new ActualConvergentExpressions(),[R,Z,T,theta]=['R','Z','T','theta'].map(n=>G.fresh('affine_position_'+n)),
    operators=[R,Z,T].map((c,i)=>({name:['r','z','t'][i],apply:x=>G.derivative(x,c)})),
    p=phaseZeroCylindricalAngularCurlJet(G,{leading:[R,G.zero,G.zero],coefficientCurl:[G.zero,G.zero,G.zero],phase:G.zero,
      frequency:G.one,radius:R,operators,angular:x=>G.div(G.derivative(x,theta),R)}),
    rr=p.second.find(r=>r.component===0&&r.directions.join('')==='thetatheta');
  assert.equal(sourceGraphRationalIdentity(G,G.sub(p.first[1].zeroPhaseDerivative,G.one),{maxTerms:1000}).pass,true);
  assert.ok(p.second.every(r=>sourceGraphRationalIdentity(G,r.zeroPhaseDerivative,{maxTerms:1000}).pass));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(rr.zeroPhaseDerivative,rr.zeroPhaseDirectionConnection),{maxTerms:1000}).pass,false);
});
test('the finite polynomial implication keeps its source hypotheses unauthenticated',()=>{
  const p=physicalCenterCompleteCurlErrorPowerAudit();assert.equal(p.pass,true);assert.ok(p.absorbedS<16384);
  assert.equal(p.frequency.hReplacedByZero,false);assert.equal(p.sourceAuthenticated,false);
  assert.equal(p.unprovedPremisesCannotAuthenticateSource,true);assert.equal(p.rows[1].id,'weighted_pulse_jets_through_two');
  assert.equal(p.rows.find(r=>r.id==='phase_first_and_second_normalized_jets').S,2);
});
const input={velocityCoefficients:[{lower:'49/100',upper:'49/100'},{lower:'1/2',upper:'1/2'},{lower:'51/100',upper:'51/100'}]};
test('forty-two first angular and full second numerical coefficients enclose the correct four-direction phase signs',()=>{
  const p=enclosePhysicalCompleteCurlJetCoefficients(input);assert.equal(p.rows.length,42);assert.equal(p.first.length,9);assert.equal(p.angular.length,3);assert.equal(p.second.length,30);
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.wholeGNUMComplete,false);assert.equal(p.arithmetic.binary64UsedForDecisions,false);
  for(const r of p.first){assert.ok(qcompare(readRational(r.coefficient.lower),Q(0))<0);assert.ok(qcompare(readRational(r.coefficient.upper),Q(0))>0);}
  const signs={r:1,z:-1,t:-1,theta:1};
  for(const r of p.second){assert.equal(r.principalSign,-signs[r.directions[0]]*signs[r.directions[1]]);}
  for(const key of ['rtheta','ztheta','ttheta','thetatheta'])assert.equal(p.second.filter(r=>r.directions.join('')===key).length,3);
  assert.equal(p.second.filter(r=>r.includesAngularDirectionConnection).length,3);
  assert.ok(p.rows.every(x=>x.toleranceMet));assert.ok(qcompare(readRational(p.positiveRemainder),Q(0))>0);
});
test('an overwide inherited value interval cannot pass a small requested derivative tolerance',()=>{
  assert.throws(()=>enclosePhysicalCompleteCurlJetCoefficients({velocityCoefficients:Array(3).fill({lower:'49/100',upper:'1/2'})}),{code:'PRECISION_REQUIRED'});
});
test('missing original inputs forged source flags and false zero accuracy are rejected',()=>{
  const G=new ActualConvergentExpressions();assert.throws(()=>phaseZeroCompleteCurlJet(G,{}),{code:'INVALID_INPUT'});
  assert.throws(()=>phaseZeroCylindricalAngularCurlJet(G,{}),{code:'INVALID_INPUT'});
  for(const x of [{...input,sourceAuthenticated:true},{...input,tolerance:'0'},{...input,velocityCoefficients:[{lower:'3',upper:'3'}]}])
    assert.throws(()=>enclosePhysicalCompleteCurlJetCoefficients(x),{code:'INVALID_INPUT'});
});
test('the requested precision remains an actual directed interval budget',()=>{
  assert.throws(()=>enclosePhysicalCompleteCurlJetCoefficients({...input,precisionBits:96,tolerance:'1/'+String(10n**90n)}),{code:'PRECISION_REQUIRED'});
});
