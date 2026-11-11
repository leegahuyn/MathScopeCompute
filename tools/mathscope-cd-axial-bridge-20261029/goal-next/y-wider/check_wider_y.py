"""Exact wider source N1 range for the four last guarded natural-series Y calls."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json
import sys

BASE=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(BASE/'y'))
from check_reference_source import (
    GRAPH, REGISTRY, PROFILE, REACHED, WITH_BRACKET, WITHOUT_BRACKET, REQUIRED_PATHS,
    LAST_FOUR, RADIAL_TRANSPORTS, PHYSICAL_ROOTS, node_checks, transport_checks, producer_checks,
)
from native_reference_scopes import guarded_row_checks, native_scope_checks, actual_children

H=Q(1,1<<4096)
HALF=Q(1,2)


def need(ok,why):
    if not ok:
        raise ValueError(why)


def read(path,digest):
    b=path.read_bytes()
    need(sha256(b).hexdigest()==digest,f'exact original {path.name}')
    return json.loads(b)


def active_labels(t):
    near=(t+HALF).__floor__()
    return [l for l in (near-1,near,near+1) if abs(t-l)<Q(3,4)]


def validate_windows():
    # Finite controls only. The interval criterion itself is proved analytically in README.md.
    cases=0
    for lower in range(3,8):
        for upper in range(lower+3,lower+9):
            for quarter in range(4*lower-9,4*upper+10):
                for perturbation in (Q(-1,64),Q(0),Q(1,64)):
                    t=Q(quarter,4)+perturbation
                    active=active_labels(t)
                    need(active and
                         all(lower<=label<=upper for label in active)==
                         (lower-Q(1,4)<=t<=upper+Q(1,4)),
                         'exact open-guard endpoint control')
                    cases+=1
    # For any integer L>=3 the mesh inequality follows from monotonicity in L^6.
    need(10*3**6>1728 and Q(64,3**6)<Q(1,4),'exact adaptive margin and proper extension')
    return {'finiteExactGuardControls':cases,
            'openBandGuard':'|t-label|<3/4',
            'allActiveLabelsInOriginalWindowIff':'L-1/4<=t<=U+1/4',
            'sourceSafeLowerWhenLAtLeastEll0Plus5':'L-1/4',
            'sourceSafeLowerWhenLIsEll0Plus4':'L+64/L^6',
            'sourceSafeUpper':'U+1/4',
            'representativeMeanValueBound':'|s_rep-s_own|<=27/L^6 when active label is L',
            'meshGapNumerator':'64 L^6-27(2 L^6+64)=10 L^6-1728>0 for L>=3',
            'referenceAndRepresentativeTailBounds':'q<qGlobalStar, b2*q>=2^(3/4)>1; q_rep<qGlobalStar and b2*q_rep>=1',
            'physicalReferenceLabel':'integer ell in [L,U], s=q/Q_ell in [1/2,2]'}


def square_interval(z):
    lo,hi=z
    return ((Q(0) if lo<=0<=hi else min(lo*lo,hi*hi)),max(lo*lo,hi*hi))


def endpoint_box(z,t,a,b):
    # For all actual h in (0,H), and all u in [1/2,2],
    # 1-2H <= u^(2h) <= 1/(1-2H).
    zlo,zhi=square_interval(z)
    tlo,thi=t
    hlo,hhi=1-2*H,1/(1-2*H)
    low_upper=a-zlo*hlo-tlo
    high_lower=b-zhi*hhi-thi
    need(HALF<=a<=b<=2 and tlo>=0 and low_upper<=0<=high_lower,
         'both original actual-h endpoint signs hold uniformly on the free-coordinate box')
    return {'Z':[str(x) for x in z],'T':[str(x) for x in t],
            'sBracket':[str(a),str(b)],'lowEndpointSignUpper':str(low_upper),
            'highEndpointSignLower':str(high_lower)}


def new_free_boxes():
    z=(Q(-1,8),Q(1,8))
    a=endpoint_box(z,(Q(15,16),Q(17,16)),Q(15,16),Q(35,32))
    b=endpoint_box(z,(Q(7,8),Q(15,16)),Q(7,8),Q(1))
    need(Q(35,32)**4<2 and Q(16,15)**4<2 and Q(8,7)**4<2,
         'both independently bounded free boxes lie in the stated wider safe interval')
    a.update({'ell':'L+1','tStrict':['L+3/4','L+5/4'],'containsNewQ':'Z=0,T=17/16 gives t<L+1'})
    b.update({'ell':'L+3','tRange':['L+3','strictly below L+13/4'],
              'containsNewQ':'Z=0,T=7/8 gives t>L+3'})
    return [a,b]


def controls(nodes,paths):
    # The full pressure requires the reference inverse before any indexed-arm domain check.
    full=next(x for x in paths['paths'] if x['role']=='full_pressure')
    chain=[x['nodeId'] for x in full['path']]
    need(chain[0]==4419702 and chain[-1]==622820 and 633733 in chain,'actual unconditional pressure path')
    for i,j in zip(chain,chain[1:]):
        need(nodes[i]['op'] in ('add','multiply','inverse','sqrt_positive','source_step_derivative') and
             j in actual_children(nodes[i]),'actual required-operand edge before lazy indexed arms')
    # Same actual physical point represented by the wrong selected original band.
    t=Q(7,16)
    need(HALF-t==Q(1,16) and 4*t==Q(7,4) and HALF<2*t<1 and Q(8,7)**4<2,
         'positive-time physical point requires reselecting reference band')
    # Exact physical q can satisfy the reference bracket and tail while an outer label is active.
    need(2<Q(4,3)**4<8 and 2*Q(3,4)>1,'exact U+1 active-row counterexample to wider same-window claim')
    return {
        'positiveTimeWrongReference':{'ell':'L+2','Z':'0','T':'7/16',
             'FAtHalf':'1/16','b2qLower':'7/4','actualRequiredFullPressurePath':chain,
             'samePhysicalValidReference':'ell=L+3, Z=0, T=s=7/8, R_new=sqrt(2)*R',
             'scope':'Counterexample to unguarded reference-coordinate root definedness, even with physical positive time.'},
        'outerActiveLabel':{'ell':'U','s':'3/4','eta':'0','t':'U+log2(4/3)',
             'activeOutsideLabel':'U+1','b2qLower':'3/2',
             'scope':'Counterexample to deriving same-window active labels merely from a valid reference bracket.'},
    }


def main():
    p=ArgumentParser(description=__doc__)
    for key in ('repo','graph','profile','y-replay','out'):
        p.add_argument('--'+key,required=True,type=Path)
    a=p.parse_args()
    profile_bytes=a.profile.read_bytes()
    need(sha256(profile_bytes).hexdigest()==PROFILE,'actual source profile')
    profile=json.loads(profile_bytes.decode().split('export const PINNED_N3 = ',1)[1].strip().removesuffix(';'))
    params=profile['parametersExactExpressions']
    need(params['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}} and
         params['T']=={'sum':[{'exp':{'ref':'Md'}},{'integer':10}]} and
         params['Md']=={'integer':1048576} and
         params['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]} and
         params['Lambda']=={'power':[{'ref':'Q'},64]} and
         params['Q']['quotient'][0]['product'][1]=={'ref':'K'} and
         int(params['Q']['quotient'][0]['product'][0]['integer'])>0 and
         params['Q']['quotient'][1]=={'power':[{'ref':'sigmaStar'},2]} and
         params['K']=={'power':[{'ref':'Pstar'},2]} and
         params['Pstar']=={'exp':{'ref':'logP'}} and
         params['sigmaStar']=={'quotient':[{'ref':'j0'},{'integer':2000}]} and
         params['j0']=={'power':[{'ref':'h'},4]} and 8002*10>4096,
         'exact positive original h and Lambda/Xa geometry')
    registry=read(a.graph/'original-source-functions.json',REGISTRY)
    system=json.loads(registry['base']['base']['monotone'])[2]
    need(system['name']=='ActualCommonBandSlowInverse' and
         [system[k] for k in ('variable','body','left','right','derivativeLower','derivativeUpper')]==
         [622810,622819,19,24,19,1] and system['parameters']==[622803,622804],
         'actual native monotone system 2 equation, parameters and quantitative bracket')
    r=read(a.y_replay/'reached.json',REACHED)
    old=read(a.y_replay/'range-flow-no-bracket.json',WITHOUT_BRACKET)
    new=read(a.y_replay/'range-flow-transport.json',WITH_BRACKET)
    paths=read(a.y_replay/'reference-inverse-paths.json',REQUIRED_PATHS)
    need(r['roots']==list(PHYSICAL_ROOTS),'same original 11 physical source roots')
    nodes=dict(r['nodes'])
    anchors,count=node_checks(a.graph/'original-source-nodes.jsonl.gz',nodes)
    blobs=producer_checks(a.repo)
    calls={i:nodes[i] for i in sorted(LAST_FOUR)}
    need(nodes[3454]=={'op':'source_parameter','args':['Lambda']} and
         nodes[4757]=={'op':'multiply','args':[3454,4756]} and
         all(n['op']=='actual_natural_series' and n['args'][1:4]==[4757,2,0] for n in calls.values()) and
         [n['args'][4] for n in calls.values()]==[0,0,0,1],
         'same four actual native argument and derivative tuples')
    sites=transport_checks(r,registry,new,old)
    scope=native_scope_checks(r,registry,RADIAL_TRANSPORTS|{622820,623935},
                              {3675253,622807,622808,622809,623855,623856,623857})
    rows=guarded_row_checks(r,registry,scope,LAST_FOUR,RADIAL_TRANSPORTS)
    need(rows['guardedRelativeRowRecords']==29484 and
         rows['nativeFrameScopeFailures']==[],'actual band/mesh guards dominate all transformed root calls')
    result={
        'schema':'MathScope.M3.OriginalN1WiderPhysicalYIngress/1',
        'graphSHA256':GRAPH,'registrySHA256':REGISTRY,'profileSHA256':PROFILE,
        'sourceNodes':count,'exactSourceAnchorCount':len(anchors),'producerBlobs':blobs,
        'fourNativeCalls':calls,'actualMonotoneSystem':system,'nativeActualTransports':sites,'actualGuardReplay':rows,
        'exactWiderSourceDomain':validate_windows(),
        'directFreeCoordinateCriterion':{
            'lo':'max(1/2,2^(ell-U-1/4))','hi':'min(2,2^(ell-t_min))',
            'conditions':'ell integer in [L,U], R>=0, T>=0, lo<=hi, F(lo)<=0<=F(hi)',
            'F':'u-Z^2*u^(2h)-T','sourceHAbsoluteUpper':'2^-4096',
        },
        'twoIndependentFreeCoordinateBoxes':new_free_boxes(),
        'counterexamples':controls(nodes,paths),
        'unboundSyntaxRangeCount':519,'widerActualN1IngressScopedRangeCount':523,
        'allNativeDefinednessCertified':False,'finalJetsAdded':0,'release':'HOLD',
    }
    a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('PASS original 4 native Y ranges on wider source-safe N1 window; '
          '29,484 actual guarded rows, two independent free-coordinate boxes and positive-time wrong-label control; 519/523 unbound')


if __name__=='__main__':
    main()

