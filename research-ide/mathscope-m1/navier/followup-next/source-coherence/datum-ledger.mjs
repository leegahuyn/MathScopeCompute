import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {certifySourcePressureAnalytic} from '../../followup-construction/pressure-analytic.mjs';
import {makeBudget} from '../../numerics.mjs';
import {evaluateSourceProfileLog} from './source-log-evaluator.mjs';

const read=name=>{const raw=readFileSync(new URL(name,import.meta.url));return {data:JSON.parse(raw),sha256:createHash('sha256').update(raw).digest('hex')};};
const final=process.argv.includes('--final'),profile=final?'final':'initial-small-j';
const source=read(final?'source-axis-cone-refined.json':'source-axis-small-j-trial.json'),debt=read(final?'uniform-source-debt-final.json':'uniform-source-debt-small-j.json'),prefix=read(final?'axis-prefix-final.json':'axis-prefix-common-small-j.json');
const parameters=source.data.inputModel.pressure.sourceParameters;
const pressureKeys=['totalMassLower','totalMassUpper','innerThetaOneMassLower','innerThetaOneMassUpper','mass','mixedThetaSuffix','scheduleExistence','realBounds','complexBounds','coefficientNorm','observations','exponentialAudit'];
const projection=c=>Object.fromEntries(pressureKeys.map(k=>[k,c[k]]));
const cases=['0','20','100'].map(logXR=>{
  const c=certifySourcePressureAnalytic({parameters:{...parameters,logXR}},makeBudget({maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048}));
  if(c.status!=='VERIFIED_ANALYTIC_PRESSURE_BOUND_CERTIFICATE')throw new Error(`Pressure scale check failed for ${logXR}`);
  const p=projection(c);return {logXR,status:c.status,mathematicalProjectionSHA256:createHash('sha256').update(JSON.stringify(p)).digest('hex'),projection:p};
});
const common=cases[0].mathematicalProjectionSHA256;
if(!cases.every(x=>x.mathematicalProjectionSHA256===common))throw new Error('The pressure bound projection changed under a radial translation');
const probes=[evaluateSourceProfileLog({profile,phase:'axis',coordinate:'41/10'}),evaluateSourceProfileLog({profile,phase:'joining',coordinate:'-5',eta:'1'})];
const p=debt.data.singleSourceProfile;
const nodes=[
  {id:'outer-shape',selected:{Md:parameters.Md,logP:parameters.logP,lambda:parameters.lambda,h:parameters.h,Tf:parameters.Tf,co:parameters.co},dependsOn:[],status:'DEFINED_WITH_NECESSARY_SCALAR_INEQUALITIES',remaining:'The original sufficiently-small outer cone and amplitude-response constants are not all instantiated.'},
  {id:'pressure',selected:'The complete ideal schedule in y; A.21 integrates over both infinite ends',dependsOn:['outer-shape'],status:'POSITIVE_MIXTURE_ANALYTIC_BOUNDS',radialScaleDependency:false},
  {id:'joining-tolerance',selected:{j0:p.j0},dependsOn:['outer-shape'],status:'SMALL_J_BOUND_PASSES_CONTINUOUS_JOINING_RECTANGLE',evidence:'uniform-gluing/source-joining-rectangle-certificate.json',remaining:'The choice is sufficient for the audited restoration/moment rectangle; it does not instantiate all earlier cone constants.'},
  {id:'axis-shape',selected:{sigmaStar:p.sigmaStar,Lambda:p.Lambda},dependsOn:['pressure','joining-tolerance'],status:'ACTUAL_SOURCE_BOUND_PRODUCER_COMPLETED',evidence:'source-axis-small-j-trial.json'},
  {id:'continuation-bounds',selected:'C-independent mixed axis and reference derivative bounds',dependsOn:['axis-shape'],status:'ANALYTIC_DERIVATION_WITH_EXACT_SCALAR_CHECKS',evidence:'UNIFORM_SOURCE_DEBT.md'},
  {id:'debt-widths',selected:{t1:p.t1,kappa0:p.kappa0,axialWidth:p.axialWidth,shearWidth:p.shearWidth},dependsOn:['continuation-bounds'],status:'SUFFICIENT_FOR_THE_STATED_C1_DEBT_BOUNDS',remaining:'These widths have not been compared with the C-dependent Vmax and all activation-cone comparison constants in B.26--B.31.'},
  {id:'shape-length',selected:{Tsh:p.Tsh},dependsOn:['axis-shape','continuation-bounds','debt-widths'],status:'FINITE_EXACT_INTEGER_SELECTED_BEFORE_FINAL_AMPLITUDE'},
  {id:'final-amplitude',selected:{logC:p.logC,C:'exp(logC)'},dependsOn:['axis-shape','shape-length'],status:'EXACT_LOG_REPRESENTATION_ABOVE_AXIS_THRESHOLD',infiniteFixedPoint:'The fixed point for this final C is recomputed as an interval prefix; the old minimum-C fixed point is not reused.'},
  {id:'radial-scale',selected:{Xi:p.Xi,XR:'110*exp(10*(logC+14))',logXR:p.logXR},dependsOn:['final-amplitude'],status:'EXACT_SYMBOLIC_SCALE_WITH_INTERVAL_LOG_OBSERVATIONS'},
  {id:'continuous-root',selected:'Source-bound unique small root of the actual five moment map for every eta in [-1,1]',dependsOn:['debt-widths','shape-length','final-amplitude','radial-scale'],status:'CONTINUOUS_INTERVAL_INCLUSION_WITH_ANALYTIC_SOURCE_DEBT_BOUNDARY'},
  {id:'display-prefix',selected:{radialDegree:prefix.data.input.radialDegree,etaDegree:prefix.data.input.etaDegree,arithmeticBits:prefix.data.input.arithmeticBits},dependsOn:['final-amplitude'],status:'FINITE_ROUNDING_AND_INFINITE_RADIAL_TAIL_BOTH_INCLUDED',remaining:'The generated all-eta analytic premise bundle is not a Lean proof.'}
];
if(final){
  const widths=nodes.find(x=>x.id==='debt-widths');widths.selected=p.originalWidthEnvelopes;widths.status='RATIONAL_UPPER_ENVELOPES_FOR_THE_FAMILY';widths.remaining='The actual widths are selected after C below these envelopes.';
  const axisNode=nodes.find(x=>x.id==='axis-shape');axisNode.status='SOURCE_BOUND_PRODUCER_AND_LOW_CHI_REFINEMENT_COMPLETED';axisNode.evidence='source-axis-cone-refined.json';
  nodes.splice(nodes.findIndex(x=>x.id==='radial-scale'),0,{id:'final-cone-widths',selected:{t1:p.t1,kappa0:p.kappa0,axialWidth:p.axialWidth,shearWidth:p.shearWidth},dependsOn:['final-amplitude','continuation-bounds','debt-widths'],status:'EXPLICIT_POSITIVE_SCALED_EXPONENTIALS_AFTER_C',evidence:'continuation-refinement.json',scope:'Reference, activation, terminal shear changes, and B.34; analytic comparison proof remains separate from the Lean kernel.'});
  nodes.find(x=>x.id==='continuous-root').dependsOn.push('final-cone-widths');
  nodes.push({id:'reserved-inner-collar',selected:p.reservedInnerCollar,dependsOn:['final-cone-widths'],status:'EXPLICIT_POSITIVE_COLLAR_AND_NONZERO_EDGE_BOUND',evidence:'CONTINUATION_REFINEMENT.md'});
}
const seen=new Set();for(const n of nodes){for(const dep of n.dependsOn)if(!seen.has(dep))throw new Error(`Non-topological dependency ${n.id}->${dep}`);seen.add(n.id);}
const result={schema:'MathScope.Navier.SelectedDatumLedger/1',status:final?'SCALE_BINDING_AND_REFINED_CONTINUATION_ORDER_AUDITED':'SCALE_BINDING_AND_PARTIAL_ORDER_AUDITED',profile,sourceFiles:{axis:source.sha256,debt:debt.sha256,prefix:prefix.sha256},
  scaleNormalization:{legacyProducerParameter:{logXR:parameters.logXR,role:'An auxiliary physical coordinate in the frozen demonstration API; it does not occur in the actual A.21 pressure function or its bound derivation.'},
    finalPhysicalScale:{Xi:p.Xi,logXR:p.logXR,exactExpression:'XR=110*exp(10*(logC+14))'},conflictingPressureDatum:false},
  scaleProof:{source:'Pinned paper Lemma A.5, pages 133--134, equations A.21--A.23; B.38 on page 156.',
    statement:'For every R>0 define E_R(X,eta)=E_sched(log(X/R),eta). Then -1/2 integral_(0,infinity) E_R(X,eta)^2 dX/X = -1/2 integral_R E_sched(y,eta)^2 dy, independent of R.',
    justification:'X=R exp(y) is an orientation-preserving C1 bijection from the real line to (0,infinity), with dX/X=dy. Both infinite integrals converge absolutely under the existing positive-mixture envelope. The schedule amplitude, exponent, lengths and terminal waiting ODE depend only on the six outer-shape parameters, so their integrand is unchanged. This is the same pressure function, not merely the same scalar bound.',
    pressureAfterCorrection:'Equality with the final fully corrected pressure also requires every actual later edit to preserve the total pressure increment; only the audited B.8 correction has been connected here.',
    exactProducerChecks:cases.map(({projection,...x})=>x),allMathematicalProjectionHashesEqual:true,
    limitedRoleOfProducerChecks:'Three executable recalculations catch unintended scale dependence in code; the universal all-R statement comes from the displayed change of variables, not extrapolation from three values.'},
  dependencyNodes:nodes,acyclicForCompletedBoundChain:true,
  openRequiredEdges:[...(!final?[{from:'final-amplitude',to:'debt-widths',requirement:'The final activation parameters must additionally meet the B.6 C-dependent cone comparisons; no such conclusion follows from the C1 debt checks.'}]:[]),{from:'continuous-root',to:'entire-outer-profile',requirement:'A.4/A.7 outer moment and heat compensation, exact final pressure, and all later cone/support constraints.'},{from:'selected-functions',to:'Lean-realization',requirement:'Instantiate every generated analytic bound premise and identify this specific computed sequence with the imported infinite fixed point.'}],
  logDomainExecution:{module:'source-log-evaluator.mjs',observations:'source-log-observations.json',exactOffsetPlusDirectedRemainder:true,positiveQuantitiesNeverRoundedToMathematicalZero:true,probes:probes.map(x=>({phase:x.phase,coordinate:x.coordinate,eta:x.eta,status:x.status,sourceProfileHash:x.sourceProfileHash}))},
  gates:{sameA21FunctionAcrossRadialScales:true,sourceAxisPrefixAndDebtUseSameFinalC:true,allCurrentDependencyEdgesAcyclic:true,entireOriginalParameterHierarchyComplete:false,wholeProfileCertified:false,formalPass:false},
  proofBoundary:final?'The completed source/debt/continuation chain is acyclic, uses explicit positive widths chosen after C, and is executable in logarithmic coordinates. The separately listed outer, modulation and Lean realization requirements prevent declaring the original complete global hierarchy closed.':'The completed source/debt chain is acyclic and explicitly executable in logarithmic coordinates. The listed missing cone-dependent selection edges prevent declaring the original complete hierarchy closed.'};
writeFileSync(new URL(final?'datum-ledger-final.json':'datum-ledger.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,sourceScaleIndependent:true,pressureProjectionHash:common,nodes:nodes.length,originalHierarchyComplete:false}));
