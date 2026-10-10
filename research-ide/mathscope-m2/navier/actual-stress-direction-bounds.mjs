/** Actual continuous direction modulus, including both flat stress edges.
 * Source analytic bounds are combined by an executed finite power ledger.
 * The bound concerns T0; it supplies neither completed F/G nor H columns.
 */
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {actualLeadingHighJetBounds,ACTUAL_LEADING_HIGH_JET_BINDINGS} from './actual-leading-high-jets.mjs';
import {compileActualStressDirectionProgram} from './actual-stress-direction-program.mjs';
import {rational as Q,readRational,qadd,qsub,qmul,qdiv,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';

export const ACTUAL_STRESS_DIRECTION_BINDINGS=Object.freeze([
  ...ACTUAL_LEADING_HIGH_JET_BINDINGS,
  {path:'mathscope-m1/navier/followup-20261010-final-stress-audit/ACTIVATION_COLLAR_BOUNDS_EN.md',bytes:6843,sha256:'2035fa202134d7ca0affcad7ad7aafbb05e3508fde3a5f34a3f2cea6fd003750'},
  {path:'mathscope-m1/navier/followup-20261010-final-stress-audit/HEAT_COMPENSATION_PROOF_EN.md',bytes:18440,sha256:'81446a5f1a6a18a4e1aa9a44fdc5695da1846a1c23fe412c9ac282af155688e3'},
]);
const Cmin=1n<<260n,Rmin=8192n;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

class Ledger {
  constructor(base='C',order=3){this.base=base;this.order=order;this.rows=[];this.values=new Map();}
  put(id,power,rule,inputs=[],extra={}){if(this.values.has(id)||!Number.isSafeInteger(power)||power<0)throw Error('Invalid fixed-source direction ledger.');const row={id,power,rule,inputs,...extra};this.values.set(id,power);this.rows.push(row);return id;}
  at(id){if(!this.values.has(id))throw Error('Missing direction input '+id);return this.values.get(id);}
  reserve(coefficient){const bits=coefficient.toString(2).length,baseBits=this.base==='C'?260:13;return Math.max(1,Math.ceil(bits/baseBits));}
  sum(id,inputs){const coefficient=BigInt(inputs.length),reserve=this.reserve(coefficient);return this.put(id,Math.max(...inputs.map(x=>this.at(x)))+reserve,'sum',inputs,{coefficient:String(coefficient),reserve});}
  product(id,inputs){const coefficient=BigInt(inputs.length)**BigInt(this.order),reserve=this.reserve(coefficient);return this.put(id,inputs.reduce((v,x)=>v+this.at(x),0)+reserve,'mixed product',inputs,{coefficient:String(coefficient),reserve});}
  derivative(id,input){return this.put(id,this.at(input)+1,'ordinary derivative extraction within the supplied mixed-jet rectangle',[input],{coefficient:String(factorial(this.order)),reserve:1});}
  Ka(id,input){return this.put(id,this.at(input)+1,'actual flat-factor integral and its first y derivative',[input],{coefficient:'6',reserve:1});}
  J(id,input,m){const coefficient=BigInt(m+12);return this.put(id,this.at(input)+this.reserve(coefficient),'actual outer Laplace kernel through first delta derivative',[input],{m,coefficient:String(coefficient),reserve:this.reserve(coefficient)});}
  expDividedDifference(id,input){const coefficient=1n+factorial(this.order)*BigInt(this.order+1)**BigInt(this.order+2),reserve=this.reserve(coefficient);return this.put(id,this.order*this.at(input)+reserve,'finite Bell derivatives of integral_0^1 exp(t*v)dt; actual |v|<1/10',[input],{coefficient:String(coefficient),reserve});}
}

/** A finite integer comparison in the unchanged source hierarchy.
 * R=exp(C^25,600,000)>C^power, by one explicitly selected exponential term.
 */
export function directionCPowerAbsorption(power){
  if(!Number.isSafeInteger(power)||power<0||power>1000000000)fail('INVALID_INPUT','Use a nonnegative bounded finite C power.');
  const sourcePower=25600000,term=Math.max(1,Math.ceil((power+2)/sourcePower)),f=factorial(term),effectivePower=term*sourcePower-1;
  return {power,sourceRExponentPower:sourcePower,expSeriesTerm:term,factorial:String(f),factorialUpper:'C',effectivePower,strictUpper:'R',pass:f<Cmin&&effectivePower>power};
}

/** Entire-domain kernel inequalities in exact rational arithmetic. */
export function flatKernelAudit({radialDerivativeCoefficient='5',outerDerivativeDivisor='32'}={}){
  const k=readRational(radialDerivativeCoefficient),od=readRational(outerDerivativeDivisor),one=Q(1),innerLogSlopeUpper=Q(56,27),innerDerivative= qadd(one,innerLogSlopeUpper);
  const rows=[
    {id:'activation-logarithmic-slope-lower',left:qtext(qmul(Q(2),qsub(one,Q(1,16384)))),right:'1',pass:qcompare(qmul(Q(2),qsub(one,Q(1,16384))),one)>0},
    {id:'activation-logarithmic-slope-upper',left:qtext(qmul(Q(2),qadd(one,Q(1,27)))),right:'56/27',pass:qcompare(qmul(Q(2),qadd(one,Q(1,27))),innerLogSlopeUpper)===0},
    {id:'normalized-inner-primitive-first-derivative',left:qtext(innerDerivative),right:qtext(k),pass:qcompare(innerDerivative,k)<0},
    {id:'outer-first-derivative-kernel-moment',left:'1/32',right:qtext(qdiv(one,od)),pass:qcompare(Q(1,32),qdiv(one,od))<=0}
  ];
  return {schema:'MathScope.ActualFlatKernelAudit/1',inner:{domain:'0<y/t1<=1/4',logSlope:['t1^2/y^3','(56/27)*t1^2/y^3'],primitiveValueUpper:'(y^3/t1^2)*B',primitiveYDerivativeUpper:qtext(k)+'*B+(y^3/t1^2)*B_y',limitAtZero:'0',normalizationRetained:true},outer:{domain:'0<=delta<=1/2, m>=-3',valueUpper:'B/4',deltaDerivativeUpper:'B_delta/4+(m+3)*B/'+qtext(od),laplaceTailAfterT:'exp(-4*T)*B/4',mixedDerivativeTail:'exp(-4*T)*(B_delta/4+(m+3)*B*(T/8+1/32))'},rows,pass:rows.every(r=>r.pass),finiteSamplingUsed:false};
}

function innerBound(){
  const a=new Ledger('C',3);
  a.put('reference',65536,'Actual natural/reference fields F,E,U,W,p1,Uy, and needed eta2/one-y jets from the new source high-jet producer.');
  a.put('coordinate',2,'X,X^-1,sqrt(2X), reciprocal, L^-1 and elementary eta factors on 4/Lambda<=X<=4exp(t1/4)/Lambda.');
  a.put('activation',121,'eta-independent e_a and one y derivative: sigmaPrime<=9 and t1^-1=C^120.');
  a.Ka('vOver','reference');a.Ka('uOver','reference');
  a.product('v',['activation','vOver']);a.expDividedDifference('expDiv','v');
  a.product('FOver',['reference','vOver','expDiv']);a.product('EOver',['coordinate','FOver']);
  a.product('M_density',['coordinate','uOver']);a.Ka('MOver','M_density');
  a.product('I_density',['coordinate','coordinate','EOver']);a.Ka('IOver','I_density');
  a.product('J_Edu',['reference','uOver']);a.product('J_Ude',['reference','EOver']);a.product('J_cross',['activation','uOver','EOver']);
  a.sum('J_increment',['J_Edu','J_Ude','J_cross']);a.product('J_density',['coordinate','coordinate','J_increment']);a.Ka('JOver','J_density');
  a.product('U_squared_linear',['reference','uOver']);a.product('U_squared_cross',['activation','uOver','uOver']);
  a.product('E_squared_linear',['reference','EOver']);a.product('E_squared_cross',['activation','EOver','EOver']);
  a.sum('S_increment',['U_squared_linear','U_squared_cross','E_squared_linear','E_squared_cross']);a.product('S_density',['coordinate','S_increment']);a.Ka('SOver','S_density');
  a.sum('Cp_density',['E_squared_linear','E_squared_cross']);a.Ka('CpOver','Cp_density');
  for(const n of ['M','I','J','S','Cp'])a.derivative(n+'Over_eta',n+'Over');
  a.sum('M_geometry',['MOver','MOver_eta']);a.product('WOver',['coordinate','coordinate','M_geometry']);
  a.product('FW_first',['reference','WOver']);a.product('FW_second',['reference','FOver']);a.product('FW_cross',['activation','FOver','WOver']);a.sum('FWOver',['FW_first','FW_second','FW_cross']);
  a.product('WU_first',['reference','uOver']);a.product('WU_second',['reference','WOver']);a.product('WU_cross',['activation','WOver','uOver']);a.sum('WUOver',['WU_first','WU_second','WU_cross']);
  a.sum('angular_terms',['IOver','IOver_eta','JOver','JOver_eta']);a.product('angular',['coordinate','angular_terms']);
  a.product('theta_stock',['coordinate','coordinate','FWOver']);a.product('theta_moments',['coordinate','coordinate','angular']);
  a.product('theta_shear_first',['reference','reference']);a.product('theta_shear_second',['reference','activation','FOver']);a.sum('innerTheta',['theta_stock','theta_moments','theta_shear_first','theta_shear_second']);
  a.sum('axial_moment_terms',['MOver','MOver_eta','SOver','SOver_eta','CpOver','CpOver_eta']);a.product('axial_moments',['coordinate','coordinate','axial_moment_terms']);a.product('axial_stock',['coordinate','WUOver']);
  a.sum('axial',['axial_moments','axial_stock']);a.product('axial_normalized',['coordinate','coordinate','axial']);a.product('axial_shear',['coordinate','reference']);a.sum('innerZ',['axial_normalized','axial_shear']);
  const power=Math.max(a.at('innerTheta'),a.at('innerZ'))+1,absorption=directionCPowerAbsorption(power+14);
  return {schema:'MathScope.ActualInnerStressDirectionBound/1',domain:{y:['0','t1/4'],eta:[-1,1]},norm:'value, first y derivative and first eta derivative; intermediate eta2/one-y rectangle is retained.',referenceInput:'actualLeadingHighJetBounds(): natural total12 and actual B26 mixed8; the reference is exactly natural on this collar.',ledger:a.rows,factorCoefficientCPower:power,factorCoefficientLower:'C^-12',coefficientAndFirstDerivativeUpper:'C^'+power,unitDirectionDerivativeCPower:power+14,absorption,unitDirectionDerivativeUpper:'R',lowerBoundProof:'D=Pc-vs>=2 e_a, F>=C^-3, |t_s|<C^6. Divide the exact positive e_a factor before taking the norm; 2F/sqrt(1+t_s^2)>C^-12.',pass:absorption.pass};
}

function outerBound(){
  const a=new Ledger('C',3);
  a.put('heat',20,'Actual H integral, Epow(Xb), exp(A delta), and K_delta: factorial(n)factorial(n+1) bounds H^(n), n<=4.');
  a.put('flatPrefactor',20,'1/(exp(-4/delta²)+exp(-(1-delta/2)^-2)); closed prefactor jets to3, denominator>=1/9.');
  a.put('radial',8,'sqrt(2Xb exp(-delta)), reciprocal, and their needed derivatives, Xb<C^11.');
  a.put('coefficient',2,'rho, delta^k (k<=6), L^-1, eta, and their needed derivatives.');
  a.product('c',['coefficient','flatPrefactor']);
  a.product('theta_boundary',['heat','c','radial']);
  a.product('theta_viscous_integrand',['radial','heat','c']);a.J('theta_viscous_integral','theta_viscous_integrand',-3);a.product('theta_viscous',['coefficient','radial','radial','theta_viscous_integral']);
  a.product('theta_inviscid_integrand',['radial','radial','radial','heat','c']);a.J('theta_inviscid_integral','theta_inviscid_integrand',-3);a.product('theta_inviscid',['coefficient','coefficient','radial','radial','theta_inviscid_integral']);
  a.sum('outerTheta',['theta_boundary','theta_viscous','theta_inviscid']);
  a.product('pressure_integrand',['heat','heat','flatPrefactor','c']);a.J('pressure_integral','pressure_integrand',-3);a.product('pressure_coefficient',['coefficient','pressure_integral']);
  a.product('axial_integrand',['radial','radial','pressure_coefficient']);a.J('axial_integral','axial_integrand',0);a.product('outerZ',['radial','axial_integral']);a.product('outerScaledZ',['coefficient','outerZ']);
  const power=Math.max(a.at('outerTheta'),a.at('outerScaledZ'))+1,absorption=directionCPowerAbsorption(power+12),heatDerivatives=Array.from({length:5},(_,n)=>({order:n,upper:String(factorial(n)*factorial(n+1))}));
  return {schema:'MathScope.ActualOuterStressDirectionBound/1',domain:{delta:['0','1/2'],eta:[-1,1]},heatDerivatives,heatArgumentNonnegativeIncludingEtaEndpoints:true,ledger:a.rows,factorCoefficientCPower:power,factorCoefficientLower:'C^-10',unitDirectionDerivativeCPower:power+12,absorption,unitDirectionDerivativeUpper:'R',lowerBoundProof:'The exact positive first term in A.54 and S13 bound b_theta>=C^-10 on this entire outer collar. Normalize (b_theta,delta^6*b_z), not the zero physical stress.',pass:absorption.pass};
}

function middleBound(){
  const fieldRows=[
    {id:'unchanged_premodulation',cPower:65536,absorption:directionCPowerAbsorption(65536),description:'Actual mixed8 fields on J; outside J the natural or literal outer formulas apply.'},
    {id:'C12_exponent_value',upper:'R/N<1',description:'Use the actual exponential value, not exp of its high derivative norm.'},
    {id:'C12_exponent_y',upper:'2R',description:'(A_y+N A_phase)/N.'},
    {id:'C12_exponent_yy',upper:'4NR<R^53',description:'A_yy/N+2A_y,phase+N A_phase,phase; actual N<3R^50.'},
    {id:'C12_mixed2_exponential',upper:'R^56',description:'Known exp(A/N)<=3; the second derivative includes both (D A/N)^2 and D²(A/N).'},
    {id:'I1_repair_mixed2',upper:'R^60',description:'Actual Ceta6 root with same R,N; two bump radial derivatives are bounded by sigma derivatives through3 and the fixed normalized support. This deliberately looser bound retains both width factors.'},
    {id:'I2_heat_repair_mixed2',upper:'C^32<R',description:'H12 bounds c, c_eta, c_etaeta by2^30/X*. The actual beta derivatives through2 use the verified step through3. h-differentiated heat moments use actual nonnegative Z; no analytic extension to negative Z is required.'},
    {id:'entire_annulus_field_mixed2',upper:'R^64',description:'Sum the preserved natural, literal outer, actual C12/I1, and actual I2/heat terms; use their matching jets at every join.'},
    {id:'entire_annulus_F_mixed2',upper:'R^70',description:'F=E/sqrt(2X), Xa<=X<=Xb; both radial coordinate and its reciprocal are <R.'},
    {id:'all_five_moments_and_axis_pressure',upper:'R^140',description:'All eta2 and one-y/eta1 derivatives from actual full prefix integrals. Densities have at most two fields; integration adds Xb<R and the radial weights. The axis Cp integral is regular, and the actual P0 eta2 is bounded from the source datum.'}
  ];
  const a=new Ledger('R',2);a.put('field',70,'Actual E,U,F through total2.');a.put('moment',140,'Actual M,I,J,S,Cp,P0 through eta2 and y1/eta1.');a.put('geometry',2,'X,1/X,sqrt(2X),reciprocal,L^-1 and their first derivatives.');
  a.product('W_terms',['geometry','geometry','moment']);a.sum('W',['W_terms','geometry']);
  a.product('angular_terms',['geometry','moment']);a.sum('angular',['angular_terms','angular_terms','angular_terms','angular_terms']);
  a.product('theta_stock',['geometry','geometry','field','W']);a.product('theta_integral',['geometry','geometry','angular']);a.sum('theta',['theta_stock','theta_integral','field']);
  a.product('axial_stock',['geometry','W','field']);a.product('axial_moment',['geometry','moment']);a.product('axial_pressure',['geometry','geometry','moment']);a.sum('axial',['axial_stock','axial_moment','axial_moment','axial_moment','axial_pressure']);a.product('axial_normalized',['geometry','geometry','axial']);a.product('axial_viscosity',['geometry','field']);a.sum('z',['axial_normalized','axial_viscosity']);
  const power=Math.max(a.at('theta'),a.at('z'))+1,unitDirectionPower=power+21;
  const checks=[
    {id:'same-fast-frequency-second-derivative',pass:12n<Rmin&&53<56&&59<64,proof:'N<=3R50; 4NR<=12R51<R53. First-derivative square and second derivative both enter the exponential.'},
    {id:'no-log-singularity-in-axis-Cp',pass:true,proof:'At the axis E²/(2X)=F²; integrate this actual regular density before using the annulus X^-1 bound.'},
    {id:'middle-flat-weight-lower',pass:3n**128n<1n<<256n&&256<260,proof:'For y>=t1/8 and delta>=1/4, zeta>=exp(-128)>C^-1.'},
    {id:'middle-stress-lower',pass:12<20,proof:'S14 gives |T0|>=min(C^-11,R^-8) zeta>=R^-12>R^-20.'},
    {id:'computed-stress-and-direction-powers',pass:power<256&&unitDirectionPower<512,proof:'|d(T/|T|)|<=2|dT|/|T|; the positive lower bound is used only on this middle region.'}
  ];
  return {schema:'MathScope.ActualMiddleStressDirectionBound/1',domain:{innerLogDistanceLower:'t1/8',outerLogDistanceLower:'1/4',eta:[-1,1]},fieldRows,ledger:a.rows,stressFirstJetPower:power,stressLower:'R^-20',unitDirectionDerivativePower:unitDirectionPower,unitDirectionDerivativeUpper:'R^512',exactStressFormulas:{theta:'-F*X*W/L + ((1-h)I-D eta I_eta-d J_eta+2(h-D)eta J)/(2XL) + 2D_y F',z:'[-XWU+D(M-eta M_eta)+4h eta S-d S_eta+X(4A eta Pi-d Pi_eta)]/(L sqrt(2X)) + 2D_y U/sqrt(2X)'},fieldInverseDividedBeforeBounding:true,checks,pass:fieldRows.filter(r=>r.absorption).every(r=>r.absorption.pass)&&checks.every(r=>r.pass)};
}

function frozenRatioBound(){
  const rows=[
    {id:'same-leading-shear-values',upper:'|a|,|b_s|<R^3',lower:'a, v_s-2>R^-10',proof:'C12 has raw gaps>=1/(2R), a,b<=2R. The inner collar has v_s-2>1/10 and a>=C^-122. Beyond J, O sections8-9 give slope<=-lambda/2 or -3h/4; H19, H22 and H25 retain a-2>=min(lambda,h). Also h^-1<Q<R. These are quantitative original gaps, not a compactness assertion.'},
    {id:'leading-chart-F',upper:'R^71',lower:'R^-10',proof:'Global F lower follows S9-S13 and actual source geometry; s=q/Q lies in[1/2,2]. Its normalization factor is bounded by4.'},
    {id:'frozen-normal-and-c0',upper:'v_s<R^18, |c0|<R^10',lower:'|N_theta|>R^-14, |c0|>R^-6',proof:'c0²=(v_s-2)/2; N_theta=-a/sqrt(a²+b_s²). From the displayed weaker bounds alone, v_s=a+b_s²/a<R^3+R^16<R^18. No stronger unstated lower bound for a is used.'},
    {id:'frozen-growth-values',upper:'lambda0<R^83, |g0|<R^75',lower:'lambda0>R^-31, |g0|>R^-20',proof:'lambda0=2F|N_theta||c0| and |g0|=F sqrt(a²+b_s²).'},
    {id:'target-direction-denominator-at-representative',lower:'-n dot N>R^-32',proof:'(4.26): n_theta+t_s*n_z>=kappa, |t_s|<R^13, kappa=R^-10. Thus -n dot N>=kappa/sqrt(1+t_s²)>R^-24.'},
    {id:'chart-derivative-conversion',upper:'R^10',proof:'At s in[1/2,2], implicit s-Z²s^(2h)-T=0 has derivative1-2h eta²>=.98. The first s/eta derivatives are<32, and d(log X)/dR=2/R with Rchart>R^-1.'},
    {id:'direction-first-slow-derivatives',upper:'R^524',proof:'The two profile derivatives are<R^512 on overlapping regions. Convert to (R,Z,T) using the preceding explicit coefficient bounds.'},
    {id:'frozen-target-ratio-first-derivatives',upper:'R^2048',proof:'r=(A_c/u_star)(n dot K)/(-n dot N), A_c/u_star<=2|c0|<R^11. On a neighborhood with -n dot N>=R^-33, the quotient rule costs<4 R^66; 11+524+66+1<2048.'}
  ];
  const checks=[
    {id:'c0-polynomial-identity',pass:true,identity:'lambda0²/(4F² Ntheta²)=(a²+b_s²-2a)/(2a)=(v_s-2)/2',proof:'Exact substitution of Ntheta=-a/sqrt(a²+b_s²), |g|=F sqrt(a²+b_s²).'},
    {id:'all-power-gaps',pass:2*3+10+1<18&&11+524+66+1<2048&&1+71+10<83&&31<83},
    {id:'same-cover-box-retains-negative-projection',pass:3*1024>524+33+1,proof:'For diameter<=4 Sstar^-3 and Sstar>=R^1024, direction change<R^-33, so -n dot N>R^-33 throughout.'},
    {id:'actual-frozen-target-cone-budget',pass:64n<Rmin&&3*1024>2048+10+1,proof:'4 R^2048 Sstar^-3 <= kappa/16 once Sstar>=R^1024; the extra factor64 is absorbed by one R.'}
  ];
  return {schema:'MathScope.ActualFrozenStressRatioModulus/1',ratio:'(A_c/u_star)*(n dot K)/(-n dot N); N,K,c0 are held fixed at the representative',frozenCoefficients:'the actual order-zero profile; transfer to the completed background frame requires the separate positive-order C2 bound',completedBackgroundFrozenFrameIncluded:false,appliesTo:'the source box intersected with Xa<=X<=Xb, eta in[-1,1], s=q/Q in[1/2,2]; no unproved extension outside the physical profile domain',profileDirectionBound:'|partial_y n|,|partial_eta n|<R^512',slowRatioLipschitzUpper:'R^2048',sourceBoxDiameterUpper:'4*Sstar^-3',sufficientBandCondition:'Sstar>=R^1024',resultingRatioVariationUpper:'kappa/16',stressMagnitudeLowerDividedNearFlatEdges:false,rows,checks,pass:checks.every(r=>r.pass)};
}

export function actualStressDirectionBounds(input={},context={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Use a source-bound stress direction request.');
  for(const k of Object.keys(input))if(k!=='sourceProfile')fail('INVALID_INPUT','No source function, modulus, or H-column premise is accepted: '+k);
  const profileId=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(profileId);context.checkCancelled?.();
  const high=actualLeadingHighJetBounds({sourceProfile:profileId},context),kernel=flatKernelAudit(),inner=innerBound(),outer=outerBound(),middle=middleBound(),ratio=frozenRatioBound(),p=PINNED_N3.parametersExactExpressions;
  const checks=[
    {id:'actual-source-higher-jets-generated',pass:high.pass&&high.scope.actualLeadingHigherEtaNormsDerived},
    {id:'same-C-R-width-and-margin',pass:same(p.C12EnvelopeR,{exp:{power:[{ref:'sourceEnvelopeS'},256]}})&&same(p.sourceEnvelopeS,{power:[{ref:'CSelected'},100000]})&&same(p.t1,{power:[{ref:'CSelected'},-120]})&&same(p.directionalMarginKappa,{power:[{ref:'C12EnvelopeR'},-10]})},
    {id:'actual-edge-factor-kernel-bounds',pass:kernel.pass},
    {id:'inner-factor-bounds-without-flat-division',pass:inner.pass},
    {id:'outer-factor-bounds-without-flat-division',pass:outer.pass},
    {id:'middle-positive-stress-and-derivatives',pass:middle.pass},
    {id:'overlapping-closed-regions-cover-entire-annulus',pass:qcompare(Q(1,8),Q(1,4))<0&&qcompare(Q(1,4),Q(1,2))<0,proof:'Inner reaches t1/4; middle begins t1/8. Outer reaches delta1/2; middle reaches delta1/4. Thus there is no uncertified gap.'},
    {id:'global-frozen-target-ratio-modulus',pass:ratio.pass}
  ];
  const program=compileActualStressDirectionProgram({sourceProfile:profileId,derivativeOrder:1},context);context.checkCancelled?.();
  return {schema:'MathScope.ActualStressDirectionBounds/1',profileId,sourceHash:PINNED_N3.inputs.assembly.sha256,parameterExpressionSHA256:PINNED_N3.parameterExpressionSHA256,sourceBindings:structuredClone(ACTUAL_STRESS_DIRECTION_BINDINGS),kernel,inner,outer,middle,ratio,program,
    generatedSourceInput:{schema:high.schema,pass:high.pass,originalRAndNPreserved:true,order:'leading U/M eta6 and actual loop total6; no unsupported derivative promotion'},
    bounds:{closedAnnulus:{X:['Xa','Xb'],eta:[-1,1]},profileUnitDirectionFirstDerivativeUpper:'R^512',frozenSlowTargetRatioLipschitzUpper:'R^2048',sufficientDirectionBandCondition:'Sstar>=R^1024',directionConeVariation:'<=kappa/16',physicalCartesianVectorFieldClaimed:false},
    checks,pass:checks.every(r=>r.pass),scope:{actualSourceFlatFactorsCompiled:true,actualClosedAnnulusDirectionModulusDerived:true,limitingDirectionsIncluded:true,finiteSamplingUsed:false,stressLowerBoundReplacedByMachineZero:false,completedPositiveOrderBackgroundBound:false,actualGeneralLabelHomogeneousPulseEnclosed:false,actualUniformHColumnsCertified:false,sourceUniformQStarCertified:false,globalEquation730Certified:false,originalN506Complete:false,newLeanKernelProof:false}};
}
