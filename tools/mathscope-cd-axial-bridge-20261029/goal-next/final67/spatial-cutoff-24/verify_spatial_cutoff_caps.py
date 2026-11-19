"""Exact source-interface and spatial cutoff algebra; no numerical source evaluation."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as F
from hashlib import sha256
from pathlib import Path
import json

if not __debug__:
    raise RuntimeError('Exact proof assertions must remain enabled.')

PINS = {
 'stage1Builder': ('primary-forced-join/active-n3-c5-binding/spatial-stage1/stage1_spatial_ingress.mjs', '559a294d83fa770bb268023f3eb61693b45ffca4fee8c92e53ab6db1a9aa8099'),
 'independentReader': ('primary-forced-join/active-n3-c5-binding/spatial-readback/verify_spatial_artifact.py', '7c5e89eb64133f8892002ae8c1b55ab5a190e4ed26b25c89218f7992161bb7fc'),
 'firstScale': ('final67/first-scale-selector.json', '0f2ef1dff821d7d936a9c254a5e846f6557445e2d3ccf97f3201915a6a949298'),
 'outerGeometry': ('whole-k-core-force/annular-slow-force-energy.json', 'c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37'),
 'stage4Support': ('final67/cut-correction-tail.json', '7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b'),
 'firstCycle': ('primary-forced-join/active-n3-c5-binding/hosted-44528954587/first-cycle.json', '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529'),
 'energyNormalization': ('final67/energy-1013-sharp/correction-budget/evaluate_initialized_budget.mjs', 'aca2d3a0345f318aa7206dc3dc9d94fa49551821183d394bb22df7171ad331b0'),
}
MULTIPLIERS = {'U':'Q^(-A)', 'G_U':'Q^(-A-1/2)', 'A':'Q^(1/2-A)', 'G_A':'Q^(-A)'}
GROUPS = ('U', 'G_U', 'A', 'G_A')
COMPONENTS = ('r', 'theta', 'z')

def plus(*polys):
    result = {}
    for p in polys:
        for k,v in p.items():
            result[k] = result.get(k,F(0))+v
    return {k:v for k,v in result.items() if v}

def scale(a,p):
    return {k:F(a)*v for k,v in p.items() if a*v}

def mul(*polys):
    result = {():F(1)}
    for p in polys:
        following = {}
        for x,a in result.items():
            for y,b in p.items():
                k=tuple(sorted(x+y));following[k]=following.get(k,F(0))+a*b
        result=following
    return {k:v for k,v in result.items() if v}

def var(name):
    return {(name,):F(1)}

def derivative(p, rule):
    answer=[]
    for monomial,coefficient in p.items():
        for i,name in enumerate(monomial):
            if name in rule:
                answer.append(scale(coefficient,mul({monomial[:i]+monomial[i+1:]:F(1)},rule[name])))
    return plus(*answer)

def evaluate(p, values):
    total=F(0)
    for monomial,c in p.items():
        term=c
        for name in monomial:term*=values[name]
        total+=term
    return total

def serial(p):
    return [{'coefficient':str(v),'powers':dict(sorted(Counter(k).items()))} for k,v in sorted(p.items())]

def cross_ez(vector):
    return [scale(-1,vector[1]),vector[0],{}]

def read_pin(goal,key):
    rel,pin=PINS[key];raw=(goal/rel).read_bytes()
    assert sha256(raw).hexdigest()==pin,(key,'source pin mismatch')
    return raw

def main():
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('goal_next',type=Path)
    parser.add_argument('output',type=Path)
    parser.add_argument('--ingress',type=Path)
    parser.add_argument('--readback',type=Path)
    a=parser.parse_args()
    assert not a.output.exists(),'Use a new output path.'
    assert bool(a.ingress)==bool(a.readback),'Ingress and successful independent readback travel together.'
    raw={k:read_pin(a.goal_next,k) for k in PINS}
    builder=raw['stage1Builder'].decode()
    for snippet in (
      'const U = latest.map((root, j) => G.sub(root, initialized[j]));',
      'const G_U = covariantGradient(G, op, U);',
      'const G_A = covariantGradient(G, op, A);',
      'const meanPotentials = [temporal.potential.psi, five.potential.psi];',
      'const azimuthalSwirls = [temporal.potential.velocity.v, five.increment.v];',
      'normalizedRoots: {U, G_U, A, G_A}',
      'const connection = [G.sub(r, G.div(vector[1], R)), G.add(theta, G.div(vector[0], R)), z];',
      "physicalMultipliers: {U: 'Q^(-A)', G_U: 'Q^(-A-1/2)', A: 'Q^(1/2-A)', G_A: 'Q^(-A)'}",
    ):assert snippet in builder,snippet
    seed=json.loads(raw['firstScale'])
    assert seed['linearSeedCutoffProof']['integerDerivativeUppers']==[5,42]
    assert seed['qDerivativeBounds'][1]['normalizedFormula']=='2*eta/(-2*eta**2*h + 1)'
    assert seed['qDerivativeBounds'][2]['normalizedFormula']=='-8*eta**4*h*(1 - 2*h)/(-2*eta**2*h + 1)**3 + 16*eta**2*h/(-2*eta**2*h + 1)**2 + 2/(-2*eta**2*h + 1)'
    geom=json.loads(raw['outerGeometry'])['geometry']
    assert geom['factors']['C_z']=='20/z0' and geom['factors']['C_zz']=='692/z0^2'
    tail=json.loads(raw['stage4Support'])['stageSupport']
    assert '|z/z0|<1/2' in tail['stage4PossibleSupport']
    assert 'r<1/2=r0/2' in tail['radialPlateauProof']
    assert 'No A4 commutator' in tail['wholeKStage4Transfer']
    energy_code=raw['energyNormalization'].decode()
    for snippet in ('const measureOverTau = N.mul(q(32), Xb);',
      'const velocity = polynomial.outputs.velocity.map((row,i) => evaluate(row, 1,',
      'const gradient = polynomial.outputs.velocity_gradient.flat().map((row,i) => evaluate(row, 2,',
      'N.add(sum(velocityBounds.map(x => N.pow(x, 2))), N.mul(q(2), sum(gradientBounds.map(x => N.pow(x, 2)))))'):
        assert snippet in energy_code,snippet

    L=1-2*F(1,64)*F(9,16)
    assert L==F(503,512)
    qz=F(3,2)/L
    qzz=8*F(9,16)**2*F(1,64)/L**3+16*F(9,16)*F(1,64)/L**2+2/L
    assert qz<2 and qzz<3
    # On the active derivative support of chi(a*q), a*q<=1. On flat branches its jets vanish.
    kappaz=5*2;kappazz=42*2**2+5*3
    assert (kappaz,kappazz)==(10,183)
    assert F(2)<F(3,2)**2
    c1=20+kappaz*F(3,2)
    c2=692+2*20*kappaz*F(3,2)+kappazz*2
    assert (c1,c2)==(35,1658)
    c14=kappaz*F(3,2);c24=kappazz*2
    assert (c14,c24)==(15,366)
    # Exact endpoint checks establish the monotone real-power comparisons used in the cap conversion.
    for h in (F(0),F(1,64)):
        AA=F(1,2)+h
        assert 0<AA<1 and 0<AA+F(1,2)<F(3,2) and 0<=h<F(1,2)
        assert 4*AA<3 and 1+4*AA<4

    U=[var('U_'+s) for s in COMPONENTS];A=[var('A_'+s) for s in COMPONENTS]
    GU=[[var('GU_'+s+'_'+k) for k in COMPONENTS] for s in COMPONENTS]
    GA=[[var('GA_'+s+'_'+k) for k in COMPONENTS] for s in COMPONENTS]
    T,Tz,Tzz,Rinv=map(var,('T','T_z','T_zz','inverse_r'))
    JA=cross_ez(A);JU=cross_ez(U)
    velocity=[plus(mul(T,U[i]),mul(Tz,JA[i])) for i in range(3)]
    gradient=[]
    for i in range(3):
        row=[]
        for k in range(3):
            rule={'T':Tz if k==2 else {},'T_z':Tzz if k==2 else {}}
            for j,s in enumerate(COMPONENTS):
                rule['U_'+s]=plus(GU[j][k],scale(-1,mul(Rinv,JU[j]))) if k==1 else GU[j][k]
                rule['A_'+s]=plus(GA[j][k],scale(-1,mul(Rinv,JA[j]))) if k==1 else GA[j][k]
            direct=derivative(velocity[i],rule)
            if k==1:direct=plus(direct,mul(Rinv,cross_ez(velocity)[i]))
            claimed=plus(mul(T,GU[i][k]),mul(Tz,cross_ez([GA[j][k] for j in range(3)])[i]),
              mul(Tz,U[i]) if k==2 else {},mul(Tzz,JA[i]) if k==2 else {})
            assert direct==claimed,(i,k,'product or connection identity failed')
            row.append(claimed)
        gradient.append(row)
    omegaU=[plus(GU[2][1],scale(-1,GU[1][2])),plus(GU[0][2],scale(-1,GU[2][0])),plus(GU[1][0],scale(-1,GU[0][1]))]
    omega=[plus(gradient[2][1],scale(-1,gradient[1][2])),plus(gradient[0][2],scale(-1,gradient[2][0])),plus(gradient[1][0],scale(-1,gradient[0][1]))]
    claimed_omega=[plus(mul(T,omegaU[0]),scale(-1,mul(Tz,U[1])),scale(-1,mul(Tzz,A[0])),scale(-1,mul(Tz,GA[0][2]))),
      plus(mul(T,omegaU[1]),mul(Tz,U[0]),scale(-1,mul(Tzz,A[1])),scale(-1,mul(Tz,GA[1][2]))),
      plus(mul(T,omegaU[2]),mul(Tz,plus(GA[0][0],GA[1][1])))]
    assert omega==claimed_omega

    slots={}
    for group in GROUPS:
        for i,s in enumerate(COMPONENTS):
            columns=range(3) if group.startswith('G_') else [None]
            for k in columns:
                name=(('GU' if group=='G_U' else 'GA')+'_'+s+'_'+COMPONENTS[k]) if k is not None else group+'_'+s
                indices=[i,k] if k is not None else [i]
                slots[name]={'group':group,'indices':indices,'rootSlot':'normalizedRoots.'+group+''.join('['+str(x)+']' for x in indices),'rootID':None,'physicalMultiplier':MULTIPLIERS[group]}
    assert len(slots)==24
    live=None
    if a.ingress:
        ingress_raw=a.ingress.read_bytes();ingress=json.loads(ingress_raw);rb=json.loads(a.readback.read_bytes())
        assert ingress['schema']=='MathScope.N7.ActiveN3FirstCorrectionSpatialIngressCandidate/1'
        assert ingress['sourceReferenceReceiptSHA256']==PINS['firstCycle'][1]
        assert ingress['guardOverlaySHA256']=='b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36'
        assert ingress['physicalMultipliers']==MULTIPLIERS and set(ingress['normalizedRoots'])==set(GROUPS)
        assert rb['status']=='VERIFIED_ACTIVE_N3_SPATIAL_SOURCE_STREAM_AND_OPERAND_BINDINGS'
        assert rb['ingressSHA256']==sha256(ingress_raw).hexdigest() and rb['energyIngressRoots']==24
        assert rb['gaugeDifferenceRoots']==ingress['gaugeDifferenceRootsForIndependentCheck']
        for entry in slots.values():
            value=ingress['normalizedRoots'][entry['group']]
            for index in entry['indices']:value=value[index]
            assert type(value) is int and 0<=value<ingress['materializedNodes']
            entry['rootID']=value
        live={'ingressSHA256':sha256(ingress_raw).hexdigest(),'readbackSHA256':sha256(a.readback.read_bytes()).hexdigest(),
          'gaugeDifferenceRoots':rb['gaugeDifferenceRoots'],'gaugeDifferencesProvedZeroByThisReplay':False,
          'hostedRun':rb.get('hostedRun'),'stage':1}

    # Attach physical tau exponents (constant,h-coefficient), then independently majorize every signed output.
    powers={'T':(F(0),0),'T_z':(F(-1,2),1),'T_zz':(F(-1),2)}
    for name,entry in slots.items():powers[name]={'U':(F(-1,2),-1),'G_U':(F(-1),-1),'A':(F(0),-1),'G_A':(F(-1,2),-1)}[entry['group']]
    cap={'U':'u0','G_U':'u1','A':'a0','G_A':'a1'}
    def majorant(poly,normalizer,first=c1,second=c2):
        result={}
        for term,coeff in poly.items():
            const,hpower=normalizer;factors=[];coeff=abs(coeff)
            for name in term:
                da,db=powers[name];const+=da;hpower+=db
                if name=='T':pass
                elif name=='T_z':coeff*=first
                elif name=='T_zz':coeff*=second
                else:factors.append(cap[slots[name]['group']])
            assert const==0 and hpower in (0,1,2)
            key=tuple(sorted(factors+['t']*hpower));result[key]=result.get(key,F(0))+coeff
        return result
    vmaj=[majorant(x,(F(1,2),1)) for x in velocity]
    gmaj=[[majorant(x,(F(1),1)) for x in row] for row in gradient]
    exact_energy=plus(*(mul(x,x) for x in vmaj),*(scale(2,mul(x,x)) for row in gmaj for x in row))
    u0,u1,a0,a1,t=map(var,('u0','u1','a0','a1','t'))
    V=plus(u0,scale(c1,mul(t,a0)))
    G=plus(u1,scale(c1,mul(t,plus(u0,a1))),scale(c2,mul(t,t,a0)))
    simple_energy=plus(scale(3,mul(V,V)),scale(18,mul(G,G)))
    assert all(c>=0 for c in plus(simple_energy,scale(-1,exact_energy)).values())
    # Controls detect the two product-rule terms independently; they are not estimates of the original field.
    control1={'T':F(2),'T_z':F(1),'T_zz':F(0),'U_r':F(-1),'A_theta':F(2),'GU_r_z':F(0),'GA_theta_z':F(1)}
    assert evaluate(gradient[0][2],control1)==-2
    missing_TzU=plus(gradient[0][2],scale(-1,mul(Tz,U[0])))
    assert evaluate(missing_TzU,control1)==-1
    control2={'T':F(0),'T_z':F(0),'T_zz':F(1),'U_r':F(0),'A_theta':F(1),'GU_r_z':F(0),'GA_theta_z':F(0)}
    assert evaluate(gradient[0][2],control2)==-1
    missing_TzzA=plus(gradient[0][2],mul(Tzz,A[1]))
    assert evaluate(missing_TzzA,control2)==0
    values={'u0':F(1),'u1':F(1),'a0':F(1),'a1':F(1),'t':F(1,16)}
    old_v=[majorant(x,(F(1,2),1),F(90),F(10200)) for x in velocity]
    old_g=[[majorant(x,(F(1),1),F(90),F(10200)) for x in row] for row in gradient]
    old_energy=plus(*(mul(x,x) for x in old_v),*(scale(2,mul(x,x)) for row in old_g for x in row))
    new_value=evaluate(exact_energy,values);simple_value=evaluate(simple_energy,values);old_value=evaluate(old_energy,values)
    assert 0<new_value<simple_value and new_value<old_value

    result={'schema':'MathScope.N7.SourceCoupled24OperandSpatialCutoffCaps/1',
      'status':'VERIFIED_EXACT_CONDITIONAL_SPATIAL_CUTOFF_STENCIL_AND_CAPS',
      'sourcePins':{k:{'relativePath':rel,'sha256':pin} for k,(rel,pin) in PINS.items()},
      'stage':1,'liveRootBinding':live,'sourceSlots':slots,
      'sourceSemantics':{'U':'post-Five full physical velocity minus same initialized velocity',
        'A':'mapped Forced+Signed wave potential, plus Temporal.psi and FiveMap.psi in theta component',
        'directSwirl':'Temporal.velocity.v + FiveMap.increment.v',
        'requiredGaugeIdentity':'U=curl(A)+directSwirl*e_theta; exported three gauge defects must vanish or be bounded separately',
        'directions':['r','theta','z'],'gradientConvention':'rows=components, columns=orthonormal cylindrical covariant directions; angular connection retained'},
      'cutoffBounds':{'premises':['0<h<1/64','|eta|<3/4','1/2<=q/tau0<=2','z0=tau0^D; D=1/2-h','radial cutoff plateau','0<=C,chi<=1','fixed a_j>=1 and original flat seed jets'],
        'L_lower':str(L),'qzNormalizedUpper':str(qz),'qzzNormalizedUpper':str(qzz),
        'stageFirst_q':kappaz,'stageSecond_q':kappazz,'outerFirst_tau0':20,'outerSecond_tau0':692,
        'totalFirst_tau0':str(c1),'totalSecond_tau0':str(c2),
        'stage4EffectiveOnCorrectionSupportOnly':{'first_tau0':str(c14),'second_tau0':str(c24),'requiresPinnedSupportAndFlatJetTransfer':True},
        'oldCoarseBoundInSameTau0Units':{'first':90,'second':10200}},
      'signedStencils':{'velocity':list(map(serial,velocity)),'covariantGradient':[[serial(x) for x in row] for row in gradient],'vorticity':list(map(serial,omega))},
      'physicalCaps':{'u0':'sup_i tau0^A |U_i|','u1':'sup_ik tau0^(A+1/2) |G_U_ik|','a0':'sup_i tau0^h |A_i|','a1':'sup_ik tau0^A |G_A_ik|','t':'tau0^h, 0<t<1'},
      'normalizedSourceCapConversion':{'premise':'same physical reference Q/tau0 in [1/4,4], same chart and all original labels/guards/seams',
        'groupUpperMultipliers':{'u0':4,'u1':8,'a0':2,'a1':4},'unprovedByThisReplay':True},
      'capPrograms':{'velocity':list(map(serial,vmaj)),'covariantGradient':[[serial(x) for x in row] for row in gmaj],
        'exactEntrywiseEnergyBracket':serial(exact_energy),'simpleVelocity':serial(V),'simpleGradient':serial(G),
        'simpleEnergyBracket':serial(simple_energy),'simpleMinusEntrywiseCoefficientwiseNonnegative':True},
      'energyTransfer':{'norm':'same affine J_j^2=2(E_j+D_j) normalization as correction-budget receipts',
        'direct':'J_j^2/tau0 <=32*Xb*entrywiseEnergyBracket',
        'simple':'J_j^2/tau0 <=32*Xb*(3*V^2+18*G^2)',
        'forceScale':'S_R/tau0=t^(-2)*B_h^4*Xb^(-4*A)/(4*A)',
        'sufficientRatio':'J_j^2/S_R <=96*Xb^4*t^2*entrywiseEnergyBracket',
        'additionalPremises':['same affine endpoint/slab measure <=32*tau0*Xb','0<tau0<1','A=1/2+h','Xb>1','B_h>1','4*A<3'],
        'perCorrectionAllocation':'2^-26*S_R; all four stages require separate actual caps; triangle inequality for sum, no asserted orthogonality'},
      'controls':{'missing_TzU':{'full':-2,'altered':-1},'missing_TzzA':{'full':-1,'altered':0},
        'rationalCapComparison':{'values':{k:str(v) for k,v in values.items()},'newEntrywise':str(new_value),'newSimple':str(simple_value),'oldEntrywise':str(old_value),'originalFieldNumericalEvidence':False}},
      'scope':{'proved':'pinned interface semantics, exact signed product/connection/curl algebra and conditional cap implications',
        'actualUniform24CapsEvaluated':False,'gaugeEquivalenceProved':False,'stage2Through4OperandsAvailableHere':False,
        'N8ForceOrHigherJetCap':False,'actualCorrectionBudgetsClosed':0,'finalJets':0,'N706':'OPEN','N805':'OPEN','release':'HOLD'}}
    a.output.write_bytes((json.dumps(result,indent=2)+'\n').encode('utf8'))
    print(json.dumps({'status':result['status'],'slots':len(slots),'signedOutputs':15,
      'totalCutoffConstants':[str(c1),str(c2)],'newRationalControl':str(new_value),'liveRootBinding':live is not None}))

if __name__=='__main__':main()
