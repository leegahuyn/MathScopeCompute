/** Explicit finite pure-Wilson vacuum applicability, and honest periodic-time semantics.
 * The positivity-improving proof below is an analytic derivation for this pure-gauge
 * kernel. It is not attributed to the fermion theorem and is not a new Lean receipt. */
import {check,sha256} from './contracts.mjs';
import {reflectionAudit,REFLECTION_SOURCE} from '../../mathscope-m2/gauge/reflection.mjs';

const SU2={family:'SU',parameter:2,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'};
export async function finiteWilsonVacuumAudit(model){
 const {beta,Ns,Nt}=model,checks=[
  {id:'PURE_SU2_WILSON',ok:model.group==='SU2'&&model.action==='WILSON'&&Number.isFinite(beta)&&beta>0&&(!model.extraTerms||model.extraTerms.length===0)},
  {id:'FULL_HAAR_CONFIGURATION_SPACE',ok:model.measure==='PRODUCT_NORMALIZED_HAAR'&&(!model.sectorRestrictions||model.sectorRestrictions.length===0)},
  {id:'FINITE_PERIODIC_ISOTROPIC_GRAPH',ok:Number.isInteger(Ns)&&Ns>=2&&Number.isInteger(Nt)&&Nt>=4&&model.spatialBoundary==='PERIODIC'&&model.temporalBoundary==='PERIODIC'&&model.anisotropy===1},
  {id:'NO_FERMION_OR_CUTOFF_REPLACEMENT',ok:model.fermions===false&&model.representationCutoff===null}
 ],applies=checks.every(c=>c.ok),modelHash=await sha256(model);
 if(!applies)return {status:'NOT_APPLICABLE',checks,modelHash,uniqueVacuumEstablished:false,fullVacuumProjector:null,newLeanKernelRun:false};
 const spatialLinks=3*Ns**3,spatialPlaquettes=3*Ns**3,logKernelLower=-2*beta*(spatialLinks+spatialPlaquettes),epsilon=Math.exp(logKernelLower),logRatioUpper=epsilon>0?Math.log1p(-epsilon):null,logThermalWeightUpper=-2*logKernelLower+(Nt-2)*(logRatioUpper??0),thermalWeightUpper=logThermalWeightUpper<700?Math.exp(logThermalWeightUpper):null;
 const reflected=reflectionAudit({group:SU2,beta,lattice:{Ns,Nt,as:1,at:1,spatialBoundary:'PERIODIC',temporalBoundary:'PERIODIC',lengthUnit:'a',origin:[0,0,0,0]}});
 return {
  status:'ANALYTIC_FINITE_PURE_GAUGE_VACUUM_APPLICABLE',checks,modelHash,newLeanKernelRun:false,uniqueVacuumEstablished:true,vacuumDimension:1,
  source:{...REFLECTION_SOURCE,use:'Pure-gauge transfer kernel and positive character coefficients in equations (17), (20)–(23). The separate positivity-improving argument below proves uniqueness for this pure-gauge finite compact kernel.',notQuotedAsSourceTheorem:'The source with fermions explicitly leaves general vacuum degeneracy undecided near equation (27); that statement is not relabeled as a pure-gauge uniqueness theorem.'},
  reflectionPositivity:reflected,
  kernel:{space:'H_phys=P_G L²(SU(2)^(3 Ns³), normalized Haar)',formula:'K(U,V)=exp[-S_s(U)/2-S_s(V)/2] integral_Omega exp[-beta sum_spatial_links(1-Re Tr(U_e (Omega.V)_e^dagger)/2)] dOmega',normalization:'An overall positive temporal-link normalization is omitted; eigenvalue ratios, eigenvectors and vacuum projectors are unchanged.',spatialLinks,spatialPlaquettes,lower:'m=exp[-2 beta(E_s+P_s)]',upper:1,logLower:logKernelLower,lowerFloat64:epsilon>0?epsilon:null,underflowDoesNotMeanZero:epsilon===0},
  proof:[
   {step:'COMPACT_SELFADJOINT_POSITIVE',argument:'K is continuous on a finite compact product, symmetric, bounded and strictly positive pointwise. Thus its integral operator is compact Hilbert-Schmidt and selfadjoint. The separate positive character expansion gives nonnegative spectrum, injective on H_phys for beta>0.'},
   {step:'GROUND_EXISTS_AND_IS_POSITIVE',argument:'The positive top eigenvalue lambda0 exists by the compact selfadjoint spectral theorem. Replacing a real top eigenfunction f by |f| cannot lower its Rayleigh quotient because K>0. The maximum quotient is lambda0, so |f| is also an eigenfunction. Its integral equation makes it continuous and strictly positive.'},
   {step:'COMPLETE_GROUND_SPACE_HAS_RANK_ONE',argument:'If there were an orthogonal real eigenfunction at lambda0 it would have positive and negative sets of positive measure. The double integral K(x,y)(|f(x)||f(y)|-f(x)f(y)) is then strictly positive. This contradicts maximality of lambda0. Real and imaginary parts give the same conclusion over C; the positive ground state is gauge invariant by uniqueness.'},
   {step:'FULL_VACUUM_PROJECTOR',argument:'Normalize psi0 in L². P0 f=psi0 integral conjugate(psi0) f. For every bounded gauge-invariant O, (I-P0)O psi0=(O-<psi0,O psi0>)psi0. This is the exact unique-vacuum mean subtraction; a finite-T Monte Carlo mean is a separate estimator.'},
   {step:'FINITE_RATIO_BOUND',argument:'The ground Doob kernel P(x,dy)=K(x,y)psi0(y)/(lambda0 psi0(x))dy minorizes epsilon q(dy), where q(dy)=psi0(y)dy/integral psi0 and epsilon=m/M=m. Its oscillation contraction is at most 1-epsilon. Every nonconstant transformed eigenfunction is continuous and bounded, hence every nonvacuum ratio satisfies 0<=lambda_n/lambda0<=1-epsilon.'},
   {step:'FINITE_THERMAL_BOUND',argument:'The Hilbert-Schmidt bound sum lambda_n²<=M² and lambda0>=m give sum r_n²<=m^-2. Therefore R_Nt=sum_n>0 r_n^Nt<=m^-2(1-m)^(Nt-2). The excited-state thermal probability is R_Nt/(1+R_Nt). These volume-dependent bounds are usually numerically vacuous.'}
  ],
  fullVacuumProjector:{formula:'P0=|psi0><psi0|, the entire ground eigenspace',computedWavefunction:false,exactObservableVector:'v_i=(O_i-<psi0,O_i psi0>)psi0=(I-P0)O_i psi0',sampleMeanIsExactVacuumMean:false},
  finiteGap:{status:'ANALYTIC_MODEL_SPECIFIC_VERY_WEAK_BOUND',dimensionlessFormula:'a gap >= -log(1-exp[-2 beta(E_s+P_s)]) > 0',logEpsilon:logKernelLower,epsilonFloat64:epsilon>0?epsilon:null,dimensionlessLowerFloat64:epsilon>0?-Math.log1p(-epsilon):null,numericArithmetic:'FLOAT64_DISPLAY_ONLY; not an outward-rounded numeric enclosure. Formal authority belongs only to the displayed symbolic analytic implication.',uniformInVolume:false,uniformInContinuum:false,continuumGap:'OPEN_CONTINUUM'},
  thermal:{kind:'FINITE_PERIODIC_TRACE',formula:'C_ij^T(t)=Tr[T^(Nt-t) O_i T^t O_j]/Tr(T^Nt)-<O_i>_T<O_j>_T',sampleMeanTarget:'THERMAL_EXPECTATION, not exact vacuum expectation',excitedWeightBound:{formula:'R_Nt <= exp(-2 log m) (1-m)^(Nt-2)',logUpperFormulaEstimate:logThermalWeightUpper,value:thermalWeightUpper,numericArithmetic:'FLOAT64_DISPLAY_ONLY; the symbolic formula is an analytic bound, these rounded evaluations are not certified outward bounds.',underflowTreatment:'When m underflows, log(1-m) is replaced by 0 only to weaken the symbolic thermal upper-bound formula; positivity is retained symbolically.',probabilityUpperFormulaEstimate:thermalWeightUpper===null?1:thermalWeightUpper/(1+thermalWeightUpper),status:logThermalWeightUpper>=0?'VACUOUS_FOR_VACUUM_ISOLATION':'FINITE_ANALYTIC_UPPER_BOUND'},meanBiasForNormOneObservable:'|<O>_T-<O>_0| <= 2 p_excited; finite Monte Carlo sampling error is additional',finiteTSpectrum:'General thermal terms involve E_n-E_m, including transitions between excited states. A single ground-to-channel cosh fit is a disclosed approximation, not the exact whole thermal spectrum.'},
  massInequality:{formula:'gap_global <= E_channel <= m_eff',appliesOnly:'Zero-temperature, full-vacuum-orthogonal, time-local observable with positive spectral measure; E_channel is the smallest energy with nonzero overlap.',periodicCosh:'For a positive mixture of ground-to-excited periodic coshes, acosh((C(t-1)+C(t+1))/(2C(t)))/a >= E_channel. This conditional model does not remove excited-to-excited thermal transitions.',unconditionalThermalInequality:false},
  continuumBoundary:'The explicit lower bound decays with spatial volume and does not prove any uniform positive continuum mass gap.'
 };
}

/** The time-difference is reflection odd. The minus sign is part of the observable
 * reflection, not abs/clip of an observed value. All zero-energy spectral blocks vanish. */
export function vacuumDifferenceCorrelators(raw){
 check(Array.isArray(raw)&&raw.length>=4&&raw.every(m=>Array.isArray(m)&&m.length===raw[0].length),'CORRELATOR_SHAPE','A complete periodic matrix-valued correlator is required.');const Nt=raw.length,n=raw[0].length,rows=[];
 for(let t=1;t<Nt;t++)rows.push({lag:t,matrix:raw[t].map((row,i)=>row.map((v,j)=>raw[(t+1)%Nt][i][j]+raw[t-1][i][j]-2*v))});
 return {status:'EXACT_ZERO_ENERGY_BLOCK_CANCELLATION_IN_SPECTRAL_IDENTITY',rows,operator:'D_i(t)=O_i(t+1)-O_i(t), a two-adjacent-slice gauge-invariant difference',correlator:'C_D,ij(t)=-<D_i(t) D_j(0)>=C_ij(t+1)+C_ij(t-1)-2 C_ij(t)',reflectionSign:'A Euclidean time derivative is reflection odd; this fixed sign is set before seeing the data. Observed negative C_D remains negative.',spectralMultiplier:'2(cosh(a(E_n-E_m))-1); exactly zero whenever E_n=E_m, including every vacuum-to-vacuum matrix element even for a degenerate vacuum.',zeroTemperatureVector:'For the full normalized transfer operator 0 <= Tbar=T/lambda0 <= I, set w_i=(I-Tbar) O_i psi0. Then P0 w_i=0 for the entire vacuum projector and C_D,ij(t)=<w_i,Tbar^(t-1) w_j> for t>=1. I-Tbar is bounded; no unbounded sinh(H/2) domain assumption is introduced. The equivalent scalar multiplier relative to the original C(t) is 4 sinh²(a E/2).',finiteT:'Vacuum-vacuum and all other zero-energy blocks cancel exactly. Excited-to-excited thermal transitions with unequal energies remain and are not identified with a global gap.',contactDomain:'Only interior time separations with disjoint operator supports enter fits; t=0 and touching endpoints are excluded.',numberOfOperators:n,absorbedInvalidData:false};
}

export function vacuumNegativeControls(){
 const Nt=8,r=[1,1,.5],diagonal=[1,-1,0],Z=r.reduce((s,x)=>s+x**Nt,0),mean=diagonal.reduce((s,x,i)=>s+x*r[i]**Nt,0)/Z,c=diagonal.reduce((s,x,i)=>s+x*x*r[i]**Nt,0)/Z-mean*mean;
 const r2=[1,.5],diag2=[1,0],Z2=1+.5**Nt,thermalMean=1/Z2,vacuumMean=1,thermalVariance=1/Z2-thermalMean**2;
 return [
  {id:'DEGENERATE_VACUUM_MEAN_IS_INSUFFICIENT',transferDiagonal:r,vacuumIndices:[0,1],observableDiagonal:diagonal,Nt,thermalMean:mean,connectedConstant:c,ordinaryMeanRemovedWholeVacuum:false,differenceCorrelator:c+c-2*c,passed:mean===0&&c>0&&c+c-2*c===0},
  {id:'FINITE_T_MEAN_IS_NOT_VACUUM_MEAN',transferDiagonal:r2,observableDiagonal:diag2,Nt,thermalMean,vacuumMean,thermalVariance,finiteTExactlyProjected:false,passed:thermalMean!==vacuumMean&&thermalVariance>0}
 ];
}
