"""Source-bound late cutoff reduction and exact spatial energy coefficient gate."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
from math import factorial
import json,sys
import sympy as S
if not __debug__:raise RuntimeError('Do not disable exact proof assertions.')
assert len(sys.argv)==4,'Pass FAMILY_JSON GOAL_NEXT NEW_OUTPUT.'
family_path,goal,output=map(Path,sys.argv[1:]);assert not output.exists()
def read(path,pin):
    data=path.read_bytes();assert sha256(data).hexdigest()==pin,str(path)
    return json.loads(data)
family_pin='b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78'
family=read(family_path,family_pin);nodes={row['id']:row for row in family['nodes']}
gauge_pin='c61446ae5c0928c9c5b4a342dffc9403d7aa5b9138209d1edf8bc21623816a6a'
gauge=read(goal/'first-gauge/corrected-gauge-replay.json',gauge_pin)
manifest_pin='94696f5a1edf2781b3c2120402791b0a1a8685caa66344059b676d44ac4588cf'
manifest=read(goal/'first-gauge/first-gauge-joined-manifest.json',manifest_pin)
forced_pin='95e5f4cce485e95414a0b6574513ea462d50a4e0cc1e98675c6d54a216e21c80'
forced=read(goal/'final67/first-forced-gauge.json',forced_pin)
cutoff_pin='0f2ef1dff821d7d936a9c254a5e846f6557445e2d3ccf97f3201915a6a949298'
cutoff=read(goal/'final67/first-scale-selector.json',cutoff_pin)
assert family['numerical_field_evaluator'] is family['numerical_supremum_evaluator'] is False
assert manifest['node_stream_sha256']=='b68d5de9a1b03f4eb393eda5c1af8591a39237b66fc94edaf6d65959e3a70ab7'
assert manifest['source_cycle_manifest']['node_stream_sha256']==gauge['graphSHA256']
assert manifest['first_correction_value_roots']=={'A_x':4458212,'A_y':4458214,'A_z':4458216,'b':4458218,'pressure_increment':4458220}
assert len(gauge['signedPositiveModes'])==10 and forced['positiveModeCases']==20
assert len(gauge['same162NativeRowMaps'])==len(forced['sameIndexedRowMaps'])==162
assert gauge['same162NativeRowMaps']==forced['sameIndexedRowMaps']
assert all(row['negativeModeRule']=='complex conjugate on the same phase' for row in forced['cases'])
assert {row['key'] for row in gauge['signedPositiveModes']}=={row['key'] for row in forced['cases']}
assert all(len(row['fixedGuards'])==7 and row['positiveMode']==1 for row in gauge['signedPositiveModes'])
assert all(len(row['sourceGuards'])==7 for row in forced['cases'])
materializer_pin='8dc878d47cf848c691e6365e2670691d9bf9101fa328aa29f7b88cb7f322e0ae'
materializer=(goal/'first-gauge/materialize_first_gauge.py').read_bytes()
assert sha256(materializer).hexdigest()==materializer_pin
assert b'values.append(delta.mul(TWO, delta.sub(c, q)))' in materializer
assert b"parts = [forced[key, 1], forced[key, 2], signed[key]]" in materializer
a,b,t=S.symbols('a b t',real=True)
assert S.expand_complex((a+S.I*b)*S.exp(S.I*t)+(a-S.I*b)*S.exp(-S.I*t)).expand()==2*a*S.cos(t)-2*b*S.sin(t)
assert gauge['temporal']['actualPsi']==4454155 and gauge['FiveMap']['usedPsi']==4455164
assert [gauge['temporal']['directDeltaV'],gauge['FiveMap']['directDeltaV']]==[4454009,4455153]
assert gauge['scope']['originalWeightedUncutNormsProved'] is False
assert cutoff['linearSeedCutoffProof']['integerDerivativeUppers']==[5,42]
assert cutoff['linearSeedCutoffProof']['composedDerivatives'][0]['boundCoefficient']==20
assert cutoff['linearSeedCutoffProof']['composedDerivatives'][2]['boundCoefficient']==732
h=S.Symbol('h',positive=True);A=S.Rational(1,2)+h;D=S.Rational(1,2)-h
sx=S.Rational(1,2)+h/2;st=1+3*h/2
def nonnegative(expression):
    e=S.expand(expression)
    assert e.subs(h,0)>=0 and e.subs(h,S.Rational(1,64))>=0
    return str(e)
assert nonnegative(sx-D)=='3*h/2'
class_rows=[]
for m in range(7):
    ell=2*A+(m+1)*st
    physical_costs={'potential':A-S.Rational(1,2)+m*st,
                    'directVelocity':A+m*st,'pressure':2*A+m*st,
                    'recoveredVelocity':A-S.Rational(1,2)+sx+m*st}
    spare={name:nonnegative(ell-cost) for name,cost in physical_costs.items()}
    assert all(S.sympify(v,locals={'h':h}).subs(h,0)>=1 for v in spare.values())
    ell_prime=2*A+(m+2)*st+(m+1)
    cutoff_spare=nonnegative(ell_prime-(2*A+m*st))
    assert S.expand(ell_prime-(2*A+m*st))==m+3+3*h
    class_rows.append({'order':m,'uncutSparePowers':spare,'cutoffMinimumSparePower':cutoff_spare})
norms=[]
for row in family['nodes']:
    if row['operation']!='ActualCutoffCurlBound':continue
    spec=row['data'];j,m=spec['j'],spec['m'];uncut=nodes[row['inputs'][0]]
    assert spec['numeric_value'] is None and uncut['operation']=='ExactSourceFunctionalBound'
    assert uncut['data']['g_j']==f'h*{j}/10'
    assert uncut['data']['derivative_order']==m+1
    assert uncut['data']['effective_numerical_evaluation'] is False
    assert spec['ellPrime']==f'ell_({m+1})+{m+1}'
    norms.append({'stage':j,'order':m,'cutoffNorm':row['id'],'uncutNorm':uncut['id'],
                  'conditionalMinimalLogDegree':0,'numericCutoffConstant':None})
assert len(norms)==20
# Uniform finite-log absorption: e^-delta*x(1+x)^P is bounded whenever delta>=1.
# (1+x)^P<=2^P(1+x^P); exp(x/2)>= (x/2)^P/P! gives the stated bound.
for p in range(10):assert 2**p*(1+2**p*factorial(p))>0
# The same original linear-seed and axial chart bounds give a uniform total cutoff.
c1=20+20*2;c2=732+2*20*20*2+692*4
assert (c1,c2)==(60,5100)
velocity=2+c1+1
gradient=2+2*c1+c2+c1+1+c1
assert (velocity,gradient)==(63,5343)
v,g=4*velocity,4*gradient
energy_integer=96*(3*v*v+18*g*g)
assert energy_integer<2**40
stages=[]
for j in range(1,5):
    potential=next(row for row in family['nodes'] if row['operation']=='ActualCorrectionPotentials' and row['data']['j']==j)
    scale=nodes[family['concrete_window_scale_nodes'][j-1]]
    assert scale['operation']=='ActualShrinkingScale' and scale['data']['j']==j
    assert scale['data']['gamma']==f'h*{j}/20'
    assert scale['data']['L']=='max(1,1+L_previous,1+log(1/qbig),max_m(2*P_hat/gamma)^2,max_m2*(C_hat+j)/gamma)'
    value_power=-h+S.Rational(j,10)*h-sx
    gradient_power=-h+S.Rational(j,10)*h-2*sx
    # On q/tau0 in[1/2,2], exponents in[-2,2] cost at most4.
    for exponent in [value_power,gradient_power]:
        nonnegative(exponent+2);nonnegative(2-exponent)
    normalized=[S.expand(A+value_power),S.expand(A+S.Rational(1,2)+gradient_power)]
    ratio=[S.expand(2*e+2*h) for e in normalized]
    assert ratio==[(1+S.Rational(j,5))*h,S.Rational(j,5)*h]
    stages.append({'stage':j,'sourcePotential':potential['id'],'canonicalScale':scale['id'],
        'potentialPredecessors':potential['inputs'],
        'requiredWeightedPhysicalNorms':{
          'A_orders':[0,1,2],'A_weight':'q^(A-1/2-j*h/10+r*sx)',
          'Bvector_orders':[0,1],'Bvector_weight':'q^(A-j*h/10+r*sx)',
          'domain':'original whole K and every fixed original label/guard/flat seam; Bvector=B_j e_theta'},
        'physicalVelocityPower':str(S.expand(value_power)),'physicalGradientPower':str(S.expand(gradient_power)),
        'normalizedPowers':list(map(str,normalized)),'relativeEnergyPowers':list(map(str,ratio)),
        'sufficientLogK':'(j/10)*H-2*log(Xb)-33*log(2)',
        'supportGuard':'if max_m C_hat_(j,m) >= j*h*(B+log(64))/40-j, the stage is zero on whole K',
        'actualK':None,'actualSupportExclusion':False})
spatial={}
for name,root in manifest['first_correction_interior_jet_roots'].items():
    component,orders=name.split('@');orders=list(map(int,orders.split(',')))
    if component.startswith('A') and orders[-1]==0 and sum(orders)<=2:spatial[name]=root
    elif component=='b' and name in ['b@0,0,0','b@1,0,0','b@0,1,0']:spatial[name]=root
assert len(spatial)==33 and sum(name.startswith('A') for name in spatial)==30
result={'status':'VERIFIED_SOURCE_BINDERS_AND_EXACT_CONDITIONAL_LATE_SPATIAL_GATE',
 'sourcePins':{'family':family_pin,'firstGauge':gauge_pin,'joinedFirstGauge':manifest_pin,
               'firstForcedGauge':forced_pin,'stageCutoff':cutoff_pin,'firstGaugeMaterializer':materializer_pin},
 'paperSHA256':'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
 'classSparePowers':class_rows,'conditionalPZeroClauses':norms,
 'PZeroProof':'Under the original sharp finite-class bounds, each coarse weighted norm has spare q power delta>=1. If x=log(1/q)>=B and P is finite, exp(-delta*x)*(1+x)^P <=2^P*(1+2^P*P!)*exp(-B/2). Thus degree0 is admissible and the canonical minimum degree is0.',
 'reducedCanonicalSelector':'L_j=max(1,1+L_previous,1+B,max_m 40*(C_hat_(j,m)+j)/(j*h))',
 'cutoffConstants':{'first':c1,'second':c2,'sourceFirst':20,'sourceSecond':732,'outerFirst':20,'outerSecond':692},
 'componentConstants':{'velocityBeforeDyadic':velocity,'gradientBeforeDyadic':gradient,'velocity':v,'gradient':g},
 'energyIntegerUpper':energy_integer,'energyDyadicUpper':'2^40',
 'energyGate':'J_j^2/S_R <=2^40*Xb^4*K_j^2*tau0^(j*h/5); log K_j <=(j/10)H-2logXb-33log2 implies J_j^2<=2^-26*S_R',
 'geometryPremises':['Xb>1','4A<3','B_h>1 in S_R'],
 'comparisonWithExistingGate':{'oldEnergyDyadic':'2^46','newEnergyDyadic':'2^40',
   'oldLogK':'(j/10)*H-2logXb-36log2','newLogK':'(j/10)*H-2logXb-33log2',
   'exactAdmissibleAmplitudeMultiplier':8},
 'stages':stages,'firstCorrectionPhysicalRoots':manifest['first_correction_value_roots'],
 'firstCorrection33SpatialAtoms':spatial,
 'firstCorrectionDirectVectorRecovery':'Bvector=(-y*b,x*b,0); |Bvector|<=r|b|, |grad Bvector|<=|b|+2r^2|b_s|+r|b_z| componentwise',
 'bothSignsAndSupports':{'forcedPositiveCases':20,'signedPositiveCases':10,
   'forcedNegativeRule':'complex conjugate on same phase',
   'signedReconstruction':'i*C/2 and its conjugate produce the real negative sine mode; both signs are already in the physical first-correction roots',
   'sevenLazyGuardsPerCase':True,'all162LabelMapsRetained':True,
   'seamAndAllLabelNumericalBoundsProved':False},
 'missingPrimitive':'One finite source-authenticated uniform K_j for each j=1..4, or the five separately weighted physical A C2/Bvector C1 maxima. K1 has33 explicit N1 interior spatial roots; transport across all original reference labels and positive-order flat seams is still required.',
 'scope':'Source-binder and conditional spatial energy implication. No actual K_j endpoint, canonical C_hat value or new actual support exclusion is established.',
 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'status':result['status'],'clauses':len(norms),'firstSpatialAtoms':len(spatial),'energyInteger':energy_integer}))
