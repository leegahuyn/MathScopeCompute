"""Bind the Gaussian primitive transfer to the original Signed shell and amplitudes."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from math import comb
from pathlib import Path
import json
import sys


GAUGE = 'primary-forced-join/active-n3-c5-binding'
SHELL = GAUGE+'/first-wave-guard-traces/signed-shell/signed-shell.json'
PINS = {
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'shell':'5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308',
    'target':'75b0bb821dc1a486ced5d88176faffe63645d73534366f11bd1708d39377e25f',
    'weightSource':'d3713e0a3f1cd17404e2afb23da20c4b32e9e840445eed53ce2849ecd200d240',
    'targetSource':'6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a',
    'familySource':'7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75',
}
SOURCE_SHA = 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
PARAMETERS = 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'


def read(path,key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],(key,path)
    return raw


class Graph:
    def __init__(self,stream):
        self.stream = stream
        self.constants = set()

    def node(self,i):
        if i in self.constants:
            return 'frozen_polynomial_atom',[]
        record = self.stream.record(i)
        return record['op'],record['args']

    def args(self,i,op):
        return self.stream.args(i,op)


def check_target(graph, native, exact):
    base = json.loads(native.base_snapshot['base']['expression'])
    assert graph.args(17732766,'actual_monotone_root')==[2,17732749,17732750]
    monotone = json.loads(native.base_snapshot['base']['monotone'])[2]
    assert monotone['parameters']==[17732749,17732750]
    assert exact.of(monotone['left'])==exact.scalar(Q(1,2))
    assert exact.of(monotone['right'])==exact.scalar(2)
    R,s,X,eta = 17732748,17732766,17732770,17732775
    assert exact.of(X)==exact.mul(exact.pow(exact.of(R),2),exact.inv(exact.mul(exact.scalar(2),exact.of(s))))
    assert graph.args(17732771,'log_positive')==[s]
    [exponent] = graph.args(17732886,'exp')
    assert exact.of(exponent)==exact.mul(exact.neg(exact.add(exact.of(23),exact.scalar(Q(1,2)))),exact.of(17732771))
    assert exact.of(23)==exact.add(exact.scalar(Q(1,2)),exact.of(9))
    assert graph.args(9,'source_parameter')==['h']
    assert exact.of(eta)==exact.mul(exact.of(17732749),exact.inv(exact.of(17732773)))
    phi, = graph.args(17732773,'exp')
    assert exact.of(phi)==exact.mul(exact.sub(exact.scalar(Q(1,2)),exact.of(9)),exact.of(17732771))

    raw,normalized = (17733782,17733789),(17733783,17733790)
    targets = []
    for j,(core,scaled) in enumerate(zip(raw,normalized,strict=True)):
        idx,params,order = graph.args(core,'actual_expression_partial')
        assert idx==32017+j and params==[X,eta] and order==[0,0]
        definition = base[idx]
        assert definition['name']==f'ActualCovarianceSensitivityFullLeadingTarget_{j}'
        assert definition['parameters']==[4756,2] and definition['historicalBodyPreserved']
        assert definition['unspecifiedOracle'] is False
        assert exact.of(scaled)==exact.mul(exact.of(17732886),exact.of(core))
        targets.append({'component':['theta','z'][j],'baseNativeSlot':idx,'baseBody':definition['body'],
                        'formalArguments':definition['parameters'],'actualArguments':params,
                        'T0':core,'Tbar':scaled})

    H = [[17733407,17733739],[17733410,17733742]]
    y = [17733801,17733805]
    for a,b in zip([17733826,17733827],y,strict=True):
        assert graph.args(a,'sqrt_positive')==[b]
    entries = []
    for out,inputs in zip(sum(H,[]),[17733406,17733738,17733409,17733741],strict=True):
        assert exact.of(out)==exact.mul(exact.of(17733060),exact.of(inputs))
        integral,binder,left,right = graph.args(inputs,'definite_integral')
        assert (binder,left,right)==(17732751,0,17733029)
        entries.append({'root':out,'integral':inputs,'integrand':integral,'binder':binder,'limits':[left,right]})
    assert graph.args(17733800,'inverse')==[17733794]

    # Keep the four integrated entries and the two targets as independent
    # formal values to check Cramer's rule without replacing an actual integral.
    graph.constants = set(sum(H,[])) | set(normalized)
    E = type(exact)(graph)
    a,b,c,d = map(E.of,sum(H,[]))
    determinant=E.sub(E.mul(a,d),E.mul(b,c))
    assert E.of(17733794)==determinant
    for row,root in zip(H,normalized,strict=True):
        diff=E.sub(E.dot(list(map(E.of,row)),list(map(E.of,y))),E.of(root))
        assert not E.clear_compound_denominators(diff)
    graph.constants.clear()
    return {'H':H,'HIntegrals':entries,'determinant':17733794,'targetScale':17732886,'Tbar':targets,
            'radiiAndTargetArguments':{'R':R,'s':s,'X':X,'eta':eta,'sBracket':['1/2','2']},
            'actualRadicands':y,'actualSquareRoots':[17733826,17733827],
            'cramerIdentity':'H*y=Tbar (both checked with all matrix denominators on admitted domain)'}


def controls():
    # Exact rational tests for an explicit collar selection, and for
    # the logarithmic radial Jacobian after the native lower/upper limit.
    rational = []
    for a,b,p,width in [(Q(1,65),Q(4),Q(18),Q(3)),(Q(4),Q(1,65),Q(18),Q(3)),
                        (Q(1,81),Q(4),Q(0),Q(9,5))]:
        d = min(Q(1),width/2,a/(p+1),width*a/(16*(b+a)))
        assert 0<d<width
        lhs=p*d*d+2*b*(d/(width-d))**3
        assert lhs<=2*a
        rational.append({'a':str(a),'b':str(b),'p':str(p),'width':str(width),
                         'safeDistance':str(d),'collarInequalityLeft':str(lhs)})
    jacobian=[]
    for w in (0,1,2):
        # At R=3, e^(d/2)=5/4. Exact radial integral of (r/R)^w
        # matches the logarithmic primitive (including the r/2 Jacobian).
        radius=Q(3)
        factor=Q(5,4)
        inner=(radius**(w+1)-(radius/factor)**(w+1))/((w+1)*radius**w)
        outer=((radius*factor)**(w+1)-radius**(w+1))/((w+1)*radius**w)
        assert inner==radius/(w+1)*(1-factor**(-(w+1)))
        assert outer==radius/(w+1)*(factor**(w+1)-1)
        jacobian.append({'w':w,'innerMass':str(inner),'outerMass':str(outer)})
    # Nonzero out-of-shell interval would spoil the zero boundary even
    # with M identically zero on the admitted side. Do not silently move
    # a fixed integral bound to the moving shell.
    ghost={w:str((Q(2)**(w+1)-1)/((w+1)*Q(2)**w)) for w in (1,2)}
    assert ghost=={1:'3/4',2:'7/12'}
    return {'weightedCollarArithmetic':rational,'exactCylindricalRadialMass':jacobian,
            'outOfShellNegativeControlAtMovingRadius2WithFixedLower1':ghost}


def main():
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    cli = ArgumentParser(description=__doc__)
    for name in ('goal','artifact','cache','runtime','out'):
        cli.add_argument('--'+name,type=Path,required=True)
    a = cli.parse_args()
    goal = a.goal
    shell=json.loads(read(goal/SHELL,'shell'))
    target=json.loads(read(goal/'final67/n7-n8-target-directed/weighted-target-high.json','target'))
    assert shell['exactOriginalShell']['sourceParameterSHA256']==PARAMETERS
    assert shell['sourceStream']['sha256']==SOURCE_SHA
    src = a.runtime/'research-ide/mathscope-m2/navier'
    weights=read(src/'actual-background-physical-seminorms.mjs','weightSource')
    issuer=read(src/'actual-common-target-weighted-norms.mjs','targetSource')
    family=read(src/'actual-common-admissible-family.mjs','familySource')
    assert b"const a=G.log(G.div(X,G.parameter('Xa'))),b=G.log(G.div(Xb,X));" in weights
    assert b"G.div(G.pow(G.parameter('t1'),2),G.pow(a,2)),G.div(q(4),G.pow(b,2))" in weights
    assert b"aInner=G.pow(c.t1,2)" in issuer and b"weightedGaussianDerivativeRules(G,{a:q(4)" in issuer
    assert b'H*y=T' in family and b'abs(det H)>=determinantScaleLower/S' in family
    assert b'bound' in target['statement'].encode() or 'obeys' in target['statement']
    assert 'Tbar=s^(-A-1/2)*T0(X,eta)' in target['statement']
    base = goal/GAUGE
    sys.path[:0]=[str(base/'spatial-readback'),str(base/'live-wave-gauge/signed'),str(goal/'first-force-repair')]
    import source_stream
    import source_cache
    from verify_repaired_first_force import Exact
    folder=a.artifact/'first-correction-spatial-source'
    manifest=json.loads(read(folder/source_stream.MANIFEST,'manifest'))
    native=source_stream.Native(folder,manifest)
    assert native.pin==PINS['registry']
    stream=source_cache.load(source_stream,folder,manifest,22153782,a.cache)
    try:
        assert stream.verify['sha256']==SOURCE_SHA and stream.count==22155584
        G=Graph(stream)
        assert G.args(3612,'source_parameter')==['t1']
        scope=check_target(G,native,Exact(G))
        alpha,beta = shell['exactOriginalShell']['inner'],shell['exactOriginalShell']['outer']
        xa,xb = shell['exactOriginalShell']['Xa'],shell['exactOriginalShell']['Xb']
        assert G.args(alpha,'sqrt_positive')==[xa]
        [u,v] = G.args(beta,'multiply')
        assert stream.rational(u)==2 and G.args(v,'sqrt_positive')==[xb]
        assert [r['weight'] for r in shell['actualSigmaRows']]==[2,1]
        assert all(r['fixedLimits']==[alpha,beta] for r in shell['actualSigmaRows'])
    finally:
        stream.__exit__()
    result = {
        'status':'VERIFIED_SOURCE_CRAMER_AND_LOGARITHMIC_SHELL_TRANSFER_CONDITIONAL_HAAR_WEIGHT',
        'inputsSHA256':PINS,'registeredSourceSHA256':SOURCE_SHA,'parameterExpressionSHA256':PARAMETERS,
        'targetBindings':scope,
        'derivativeInventory':[{'pureNormalOrder':j,'TbarOrders':list(range(j+1)),
                                'LeibnizCoefficients':[comb(j,m) for m in range(j+1)]} for j in range(4)],
        'envelope':{'original':'zeta=exp(-t1^2/log(X/Xa)^2-4/log(Xb/X)^2)',
                    'inner':'x=log(X/Xa), a=t1^2, b=4', 't1OriginalParameter':3612,
                    'outer':'x=log(Xb/X), a=4, b=t1^2',
                    'width':'width=log(Xb/Xa), opposite distance width-x',
                    'collar':'p*d^2+2*b*(d/(width-d))^3<=2*a; sufficient d<=min(1,width/2,a/(p+1),width*a/(16*(a+b)))',
                    'movingPhysicalLimits':'R_a=sqrt(2*s*Xa), R_b=sqrt(2*s*Xb); fixed alpha=sqrt(Xa), beta=2*sqrt(Xb)',
                    'physicalDistanceMaps':'inner R_x=R_a exp(x/2); outer R_x=R_b exp(-x/2); absolute derivative R_x/2',
                    'radialJacobian':'original (R_x/R_d)^w*(R_x/2); w=2 or 1 for the respective actual primitive',
                    'innerComparison':'C*zeta(d)*d^(-p) * R_d/(w+1) * (1-exp(-(w+1)*d/2))',
                    'outerComparison':'C*zeta(d)*d^(-p) * R_d/(w+1) * (exp((w+1)*d/2)-1)',
                    'condition':'Need admitted weighted Haar residual and zero exterior on original envelope, ordinary change of variable and integrability. Both Gaussian factors are retained.'},
        'exactRationalControls':controls(),
        'remaining':['The actual Haar E values do not receive an estimate from this transform alone.',
                     'Weight transport to y requires the same admitted H inverse derivatives and directed Tbar estimates. Exact Cramer identity attaches the operands.',
                     'Mixed moving-endpoint traces and actual total energy or final jets.'],
        'finalJets':0,'release':'HOLD'}
    with a.out.open('x',encoding='utf-8',newline='\n') as f:
        f.write(json.dumps(result,indent=2)+'\n')
    print(result['status'],flush=True)


if __name__=='__main__':
    main()
