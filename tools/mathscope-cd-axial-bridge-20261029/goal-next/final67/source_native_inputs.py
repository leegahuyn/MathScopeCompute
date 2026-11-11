"""Replay actual native inverse inputs for one original admitted N=1 chart."""
import argparse
from fractions import Fraction as Q
import gzip
import hashlib
import itertools
import json
from pathlib import Path
import sys

CLOSURE = 'source/research-ide/mathscope-m3/closure-evidence-20261023'
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT/CLOSURE))
from original_monotone2_interval_jets import H, authenticate_source, inverse_jets
from certify_original_two_root2_image_endpoints import ImageConditionNotProved
from rigorous_rational_intervals import Interval as I

Y_SHA = '9d77464dd47ce7335c122a2c1e06fb47a8acc7bdf10e70be69012e50dd1ebe9e'


def interval(low, high):
    return I(Q(low), Q(high))


def exact_anchors(folder):
    indices = {127,120836,617465,617517,*range(622781,622792),
               *range(623855,623871),623921,623934}
    nodes = {}
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rt',encoding='utf8') as stream:
        next(stream)
        for i,row in enumerate(itertools.islice(stream,max(indices)+1)):
            if i in indices:
                nodes[i] = json.loads(row)
    # The log-b1 maximum contains log(2), hence the lower window bound L>=1.
    assert nodes[127] == {'op':'log_positive','args':[24]}
    assert nodes[617465]['op'] == 'maximum' and 127 in nodes[617465]['args']
    expected = {
        617517:('inverse',[127]),622781:('multiply',[617465,617517]),
        622782:('multiply',[20,622781]),622783:('ceiling',[622782]),
        622784:('multiply',[20,622783]),622785:('maximum',[617433,622784]),
        120836:('rational',['3','4']),623858:('integer_power',[622791,6]),
        623859:('inverse',[623858]),623860:('multiply',[120836,623859]),
        623862:('multiply',[623856,623859]),623863:('multiply',[623857,623859]),
        623864:('multiply',[20,623860]),623867:('add',[623862,623864]),
        623868:('add',[623860,623862]),623869:('add',[623863,623864]),
        623870:('add',[623860,623863]),
    }
    for i,(op,args) in expected.items():
        assert nodes[i]=={'op':op,'args':args},i
    assert nodes[623921]['op'] == 'smooth_piecewise'
    assert nodes[623934]['op'] == 'multiply' and nodes[623934]['args'][0] == 19
    return {str(k):v for k,v in sorted(nodes.items())}


def contains(output, guaranteed):
    got=I.parse(output)
    assert got.lo<=guaranteed.lo<=guaranteed.hi<=got.hi, (got, guaranteed)


def axis_expected():
    # Solve s=T+a(T) Z^2+b(T) Z^4+... and compare coefficients:
    # a(T)=T^(2h), b(T)=2h T^(4h-1). Odd Z coefficients vanish.
    exact = {'0,0':'1','0,1':'1','2,0':'2','2,1':'4*h','2,2':'4*h*(2*h-1)','4,0':'48*h'}
    sign = {'2,1':'STRICT_POSITIVE','2,2':'STRICT_NEGATIVE','4,0':'STRICT_POSITIVE'}
    numeric = {'0,0':I(1,1),'0,1':I(1,1),'2,0':I(2,2),'2,1':I(0,4*H),
               '2,2':I(-4*H,0),'4,0':I(0,48*H)}
    labels=[f'{a},{n-a}' for n in range(5) for a in range(n+1)]
    return {key:{'exact':exact.get(key,'0'),'signWhenTiny':sign.get(key)}
            for key in labels}, {key:numeric.get(key,I(0,0)) for key in labels}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--graph-dir',type=Path,required=True)
    p.add_argument('--y-receipt',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    source=authenticate_source(args.graph_dir)
    anchored=exact_anchors(args.graph_dir)
    yraw=args.y_receipt.read_bytes()
    assert hashlib.sha256(yraw).hexdigest()==Y_SHA
    y=json.loads(yraw)
    assert y['graphSha256']==source['graph_sha256']
    assert y['registrySha256']==source['native_registry_sha256']
    assert y['actualSymbolicReferenceEll']=='#622785+2'
    assert y['activeMeshRepresentativeRootProof']=='STRICT_SOURCE_MIDPOINT_BRACKET'
    assert y['nativeRows']['frozenRepresentativeAndChangedFramesBehindGuardedRowCut']
    assert y['nativeRows']['nativeFrameScopeFailures']==[]

    # One attained original chart with s=1, eta=0, Z=0, T=1. For an open
    # neighbourhood of that point, the entire independent Z,T box is an
    # original image since s lies strictly inside its bracket and T>0.
    chart_z,chart_t=I(-Q(1,8),Q(1,8)),I(Q(15,16),Q(17,16))
    point=inverse_jets(interval(0,0),interval(1,1),order=4,bits=256)
    exact,numeric=axis_expected()
    assert len(point['derivatives'])==15
    for key,want in numeric.items():
        contains(point['derivatives'][key],want)
    native_box=inverse_jets(chart_z,chart_t,order=4,bits=256)
    chart_s=I.parse(native_box['root'])
    assert Q(1,2)<chart_s.lo<=chart_s.hi<2
    # D=1/2-h in (0,1/2) gives s^D>=1/sqrt(2)>1/2 on the
    # source root bracket. Thus |eta|<1/4 throughout this chart box.
    assert chart_z.hi*2==Q(1,4)

    # At the attained source witness the selected band is ell and the mesh
    # time/axial centres are 1 and 0. The active-box proof returns interior
    # midpoints. The original mesh half-width is 3/(4*ell^6), with ell>=3.
    radius=Q(3,4*3**6)
    assert radius==Q(1,972)
    z_rep,t_rep=I(-radius,radius),I(1-radius,1+radius)
    reps=inverse_jets(z_rep,t_rep,order=4,bits=256)
    rep_s=I.parse(reps['root'])
    assert Q(1,2)<rep_s.lo<=rep_s.hi<2
    assert I.parse(reps['implicit_J']).lo>Q(1,2)
    for vals in (native_box,reps):
        assert len(vals['derivatives'])==15
        assert not vals['final_A_D_field_certified']
    controls=[]
    for z,t,label in [(interval(0,0),interval(0,0),'raw_zero_Z_T'),
                      (I(Q(1,8),Q(1,8)),interval(2,2),'time_bracket_upper')]:
        try:
            inverse_jets(z,t,order=1,bits=128)
        except ImageConditionNotProved as error:
            controls.append({'label':label,'rejected':True,'reason':str(error)})
        else:
            raise AssertionError('Original native gate accepted out-of-image input')

    # Keep exact numerical results while omitting legacy progress counters
    # embedded in the historical primitive implementation.
    for vals in (point,native_box,reps):
        for key in ('natural_Y_certified','natural_Y_OPEN','release'):
            vals.pop(key)
    result = {
      'schema':'MathScope.M3.OriginalAttainedN1NativeInverseEnclosures/1',
      'baseKernelSourceAuthentication':source,'sourceWindowAndRepresentativeAnchors':anchored,
      'inputBinding':{'yReceiptSHA256':Y_SHA,'ell':'L+2 with L=#622785 and L>=1',
                      'attainedChart':'s=1, eta=0, X=(Xa+Xb)/2, Z=0, T=1, R=sqrt(2X)',
                      'physicalChart':'r=Q^(1/2)R, z=Q^D Z, tau=Q T, Q=2^(-ell)',
                      'coverLabel':'ell at q=Q and -log2(q)-ell=0',
                      'frozenMesh':'gT=ell^6, gZ=0, gR=floor(ell^6 R+1/2)',
                      'representativeHalfWidthUpper':str(radius),'witnessBindingVerified':True},
      'exactFormalInverseDerivativesAtAttainedPoint':exact,
      'formalInverseChartBox':native_box,'formalInverseAtAttainedFrozenRepresentative':reps,
      'pointIntervalCrosscheck':point,'controls':controls,
      'scope':{'native622820FormalZAndT':True,'native623935AttainedRepresentativeBox':True,
               'formalNativeDerivativesNotLiveFrozenDerivatives':True,
               'numericallyEvaluatedPhysicalScales':False,'wholeKFinalSource':False},
      'actualFinalJetsCertified':0,'release':'HOLD',
    }
    args.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n')
    print(json.dumps({'graphNodes':source['source_nodes'],'nativeDerivativeOrders':15,
                      'representativeRootEnclosure':reps['root'],'actualFinalJetsCertified':0}))

if __name__=='__main__':
    main()
