"""Rebind the actual stress orders and the pointwise angular residual at the shell."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import sys


ACTIVE='primary-forced-join/active-n3-c5-binding'
OLD=ACTIVE+'/first-wave-guard-traces/weighted-haar-shell/mean/mean-shell.json'
PINS={
    'previousMean':'168d59a2b935ca6b21da8e830c02a10f172231349d8d9a89cc6d38e73762a90f',
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'band':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
}
SOURCE='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
H=9
R,Z,T,S=17743710,17732749,17732750,17732766
X,ETA,QACT=17744284,17732775,17732776
XFORM,EF=4756,2
INNER,EARLY_RIGHT,OUTER=28814,28824,28826
EPS,SCALE=17732744,17732886


def pin(path,key):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==PINS[key],(key,path)
    return data


class Graph:
    def __init__(self,stream):
        self.stream=stream

    def node(self,i):
        record=self.stream.record(i)
        return record['op'],record['args']

    def args(self,i,op):
        return self.stream.args(i,op)

    def guarded(self,i,x,lo,hi):
        xx,a,b,left,middle,right=self.args(i,'smooth_piecewise')
        assert (xx,a,b,left,right)==(x,lo,hi,0,0),(i,x,lo,hi)
        return middle


def check_order(g,E,mean,base):
    assert g.args(17735156,'log_positive')==[QACT]
    assert g.args(H,'source_parameter')==['h']
    assert g.args(S,'actual_monotone_root')==[2,Z,T]
    assert E.of(X)==E.mul(E.pow(E.of(R),2),E.inv(E.mul(E.scalar(2),E.of(S))))
    hlogq=E.mul(E.of(H),E.of(17735156))
    assert E.of(QACT)==E.mul(E.of(17732740),E.of(S))
    assert E.of(ETA)==E.mul(E.of(Z),E.inv(E.of(17732773)))
    assert g.args(17732771,'log_positive')==[S]
    assert g.args(17732773,'exp')==[17732772]
    assert E.of(17732772)==E.mul(E.sub(E.scalar(Q(1,2)),E.of(H)),E.of(17732771))
    result=[]
    for slot,sharp,diagonal in zip((1,2,3),(17743838,17743844,17743850),
                                  (17743840,17743846,17743852),strict=True):
        [xp]=g.args(diagonal,'exp')
        [order]=[n for n in (1,2,3) if E.of(xp)==E.mul(E.scalar(2*n),hlogq)]
        assert order==4-slot
        fs,[actual],orders=g.args(sharp,'actual_expression_partial')
        assert fs==32019 and orders==[0]
        a,b=g.args(actual,'multiply')
        assert QACT in (a,b)
        other=b if a==QACT else a
        record={'savedPositionalSlot':slot,'physicalCoefficientOrder':order,'cutoff':sharp,
                'qPower':diagonal,'selectorScale':other,'originalCutoffSystem':fs,
                'originalCutoffBody':base[fs]['body'],'components':[]}
        for direction,row in zip(('theta','z'),mean['actualFullStressArms'],strict=True):
            prev=row['arms'][slot]
            assert prev['order']==slot
            hi=OUTER if direction=='theta' and order==1 else EARLY_RIGHT
            value,der=prev['value'],prev['derivativeRoot']
            g.guarded(value,X,INNER,hi)
            g.guarded(der,X,INNER,hi)
            assert prev['supportGuard']==[X,INNER,hi]
            record['components'].append({'component':direction,'value':value,'derivative':der,
                                         'originalLower':INNER,'originalUpper':hi})
        result.append(record)
    return result


def multiplicative_atoms(polys):
    return set().union(*(set(i for i,_ in m) for p in polys for m in p))


def check_n1(g,E,base):
    def a(i):
        return E.of(i)

    two=E.scalar(2)
    def integral(i,lo,hi,eta,core=0):
        app,var,x1,x2=g.args(i,'definite_integral')
        assert (x1,x2)==(lo,hi)
        assert g.node(var)[0]=='coordinate'
        assert g.args(app,'actual_expression_partial')==[core,[var,eta],[0,0]]
        return (app,var)

    decl=base[0]
    assert decl['historicalBodyPreserved'] and decl['unspecifiedOracle'] is False
    assert decl['name']=='actual_n1_Ttheta_forward_integrand'
    assert decl['parameters']==[XFORM,EF] and decl['body']==117048
    density_guard=117046
    originalRaw=g.guarded(density_guard,XFORM,INNER,OUTER)
    assert originalRaw==117038
    assert a(117048)==E.mul(two,a(XFORM),a(density_guard))
    assert g.guarded(117068,XFORM,INNER,OUTER)==117054
    assert base[32007]['body']==117068 and base[32008]['body']==117069
    assert g.guarded(117069,XFORM,INNER,EARLY_RIGHT)==117059
    integral(117051,INNER,XFORM,EF)
    integral(117062,XFORM,OUTER,EF)
    integral(117072,INNER,OUTER,EF)
    assert a(117054)==E.neg(E.mul(a(117051),E.inv(E.mul(two,a(XFORM)))))
    assert a(117063)==E.mul(a(117062),E.inv(E.mul(two,a(XFORM))))

    value,der=17744341,17744324
    interior=g.guarded(value,X,INNER,OUTER)
    interiorD=g.guarded(der,X,INNER,OUTER)
    actualInt=17744317
    app,binder=integral(actualInt,INNER,X,ETA)
    assert binder==117049
    assert a(interior)==E.neg(E.mul(a(actualInt),E.inv(E.mul(two,a(X)))))
    [endpoint]=[idx for idx in multiplicative_atoms([a(interiorD)]) if idx>=0 and
                g.node(idx)==('actual_expression_partial',[0,[X,ETA],[0,0]])]
    v=E.mul(a(R),E.inv(a(S)))
    rhs=E.mul(v,E.add(E.mul(a(actualInt),E.inv(E.mul(two,E.pow(a(X),2)))),
                       E.neg(E.mul(a(endpoint),E.inv(E.mul(two,a(X)))))))
    assert not E.clear_compound_denominators(E.sub(a(interiorD),rhs))
    d2E=E.add(a(interiorD),E.mul(two,a(interior),E.inv(a(R))))
    d2Expected=E.neg(E.mul(v,a(endpoint),E.inv(E.mul(two,a(X)))))
    assert not E.clear_compound_denominators(E.sub(d2E,d2Expected))

    # Match the actual stress arm from E_theta before switching its legal
    # open branch. Y does not enter the two core arguments or the multiplier.
    weight=E.mul(a(EPS),a(SCALE),a(17743850),a(17743852))
    part={m:c for m,c in a(21999622).items() if any(i in {value,der} for i,_ in m)}
    expected=E.neg(E.mul(weight,E.add(a(der),E.mul(two,a(value),E.inv(a(R))))))
    assert part==expected and len(part)==2
    return {'rawETheta':21999622,'liveStressValue':value,'liveRadialDerivative':der,
            'liveInteriorValue':interior,'liveInteriorDerivative':interiorD,
            'liveForwardIntegral':actualInt,'liveDensity':app,'liveEndpointDensity':endpoint,
            'sourceRegistry':{'index':0,'body':117048,'formals':[XFORM,EF],
                              'boundActuals':[binder,ETA],'endpointActuals':[X,ETA]},
            'sourceSupport':{'exactRawGuard':density_guard,'rawInnerBody':originalRaw,'ends':[INNER,OUTER]},
            'sourcePrimitives':{'stress':117068,'forward':117054,'backward':117063,
                                'forwardIntegral':117051,'backwardIntegral':117062,'wholeAngularMoment':117072},
            'factorRoots':[EPS,SCALE,17743850,17743852],
            'derivativeRemainderIntervalTerms':0,'directRemainder':'K*(R/s)*A_theta(X,eta)',
            'sameCaseZeroBranches':'Both stress leaves are literal zero outside the true n1 support. The source generated residual arm is zero there.',
            'weightedPressureMomentDistinction':'This local angular stress contribution uses no whole moment value. Actual forward potential value and ordinary joining at Xb require whole angular #117072=0 under the source integral meaning. This is a different source integral from axial #117047.'}


def derivative_slots():
    # Differentiate formal C*v*F(X), with v_R=1/s, X_R=v and
    # C,s frozen. Exponents encode the exact product contributions.
    def d(poly):
        out={}
        for (n,k,l),c in poly.items():
            if n:
                key=n-1,k,l+1
                out[key]=out.get(key,0)+n*c
            key=n+1,k+1,l
            out[key]=out.get(key,0)+c
        return out
    value={(1,0,0):1}
    first=d(value)
    second=d(first)
    assert first=={(0,0,1):1,(2,1,0):1}
    assert second=={(1,1,1):3,(3,2,0):1}
    return ['K*v*A','K*(A/s+v^2*A_X)','K*(3*v*A_X/s+v^3*A_XX)']


def main():
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    cli=ArgumentParser(description=__doc__)
    for field in ('goal','artifact','cache','runtime','out'):
        cli.add_argument('--'+field,type=Path,required=True)
    a=cli.parse_args()
    mean=json.loads(pin(a.goal/OLD,'previousMean'))
    source=pin(a.runtime/'research-ide/mathscope-m3/navier/source-global-band.mjs','band')
    assert b'powerQ=power(q0,G.mul(q(2*n),h))' in source
    assert b'TthetaTerms.push(G.mul(weight,sourceRoots.Ttheta));' in source
    assert b'TzTerms.push(G.mul(weight,sourceRoots.Tz));' in source
    p=a.goal/ACTIVE
    sys.path[:0]=[str(p/'spatial-readback'),str(p/'live-wave-gauge/signed'),str(a.goal/'first-force-repair')]
    import source_stream,source_cache
    from verify_repaired_first_force import Exact
    folder=a.artifact/'first-correction-spatial-source'
    manifest=json.loads(pin(folder/source_stream.MANIFEST,'manifest'))
    n=source_stream.Native(folder,manifest)
    assert n.pin==PINS['registry']
    base=json.loads(n.base_snapshot['base']['expression'])
    stream=source_cache.load(source_stream,folder,manifest,22153782,a.cache)
    try:
        assert stream.count==22155584 and stream.verify['sha256']==SOURCE
        g=Graph(stream)
        E=Exact(g)
        orders=check_order(g,E,mean,base)
        detail=check_n1(g,E,base)
    finally:
        stream.__exit__()
    result={'status':'VERIFIED_ACTUAL_THETA_STRESS_ORDER_AND_LOCAL_RADIAL_FLUX',
            'pins':PINS,'sourceStreamSHA256':SOURCE,
            'positiveStressOrderBindings':orders,'correctedExceptionalPhysicalOrder':1,
            'exactAngularFlux':detail,'conditionalFirstThreeRadialFormulas':derivative_slots(),
            'conditional':'Ordinary interior calculus under fixed Z,T,band and original admitted s bracket. To extend Signed stress piece by zero retain source derivative semantics. Complete physical stress joining and higher differentiation at a source seam require separate ordinary limits.',
            'stillOpen':['Actual full theta whole angular moment independent validation with original I2 and eta domains.',
                         'Full same-source Haar residual weighted estimates, coefficient derivatives for all retained waves and final jet values.'],
            'finalJets':0,'release':'HOLD'}
    with a.out.open('x',encoding='utf-8',newline='\n') as f:
        f.write(json.dumps(result,indent=2)+'\n')
    print(result['status'],[r['physicalCoefficientOrder'] for r in orders],flush=True)


if __name__=='__main__':
    main()
