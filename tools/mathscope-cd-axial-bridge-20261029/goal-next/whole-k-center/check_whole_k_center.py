"""Check a strictly nonzero core slice of the original whole-K field."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha1, sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import subprocess
import sys

import fitz
from sympy import Rational, diff, simplify, symbols

HERE = Path(__file__).resolve().parent
NEXT = HERE.parent
sys.path[:0] = [str(NEXT/'whole-k-exterior/amplitude'), str(NEXT/'whole-k-angular')]
from check_whole_k_exterior_amplitude import exact_parameters, pinned_json
from check_whole_k_angular import Graph, GRAPH, REGISTRY, read, need, q

COMMIT = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
PAPER = '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
AMPLITUDE = '647a71162df52b9bfb489479c14dbf6b916086d7f64a36c5c61cee9820a6c7cf'
M2 = 'research-ide/mathscope-m2/navier/'
M3 = 'research-ide/mathscope-m3/navier/'
CORE = M2+'actual-continuation-exact-core.mjs'
EVAL = M2+'actual-core-evaluator.mjs'
NORMS = M2+'actual-residual-order-induction-norms.mjs'
CUTOFFS = M2+'actual-residual-order-induction-cutoffs.mjs'
COMMON = M2+'actual-common-admissible-family.mjs'
KERNEL = M2+'actual-residual-order-induction-kernels.mjs'
INNER = M3+'source-inner-growth.mjs'
BLOBS = {
    CORE: 'b877d5962a6051cf4fe48eef575c8ad31fb5de1a',
    EVAL: 'dab0c27835f2fab1576df54392765719e3828401',
    NORMS: '0a67015df8828294d0431d43cc48e34cadc20156',
    CUTOFFS: 'fb948ead98a7dabfeec25a9e23274dc07d5add9f',
    COMMON: '614c59419ec1a6d7e37a52084d10b6a3b4e5d30b',
    KERNEL: '4c05e4d071378771c9818b5a6dbbafcaa2ab36b1',
    INNER: 'f4a1d40a91c8468c20f8ce4fe5841ca624d47ab8',
}
RUNTIME = {
    EVAL: BLOBS[EVAL],
    M2+'actual-background-data.mjs': '67a720b6f7998673581597d176f9c5bd2fd4c29d',
    M2+'source-profile-data.mjs': 'f1559221145b5d4ce051bbdb9cb84254045c8696',
    M2+'source-profile.mjs': '84cbf606cab6510ab61f0446f0a6fdc7a89ec006',
    'research-ide/mathscope-m1/navier/numerics.mjs': 'f58ac2b0ceb55cc5d7b154f5ee692bf7b1c7197f',
}


def git_blob(raw):
    return sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()


def source_pins(repo, manuscript):
    need(sha256(manuscript.read_bytes()).hexdigest() == PAPER, 'same original public manuscript')
    page_anchors = {
        77: ('support in the closed active shell', 'smooth zero'),
        88: ('extend smoothly by zero outside the active shell',),
        90: ('vanishes for X', 'smooth zero'),
        96: ('preserves slow and radial support',),
        104: ('smooth zero extension outside the active shell',),
        106: ('Definition 9.4', 'supported wave potentials'),
        107: ('same base, primary amplitudes, supports',),
        115: ('(9.21)', 'finite initialization and its pressure'),
        116: ('Step 5: The inner velocity growth', 'All annular corrections vanish there.'),
        117: ('(10.1)', 'all the annular corrections vanish near the axis'),
        118: ('(10.4)', '(10.5)'),
    }
    with fitz.open(manuscript) as doc:
        need(len(doc) == 166, 'same original page count')
        for page, terms in page_anchors.items():
            text = ' '.join(doc[page-1].get_text().split())
            need(all(term in text for term in terms), f'original support or operator anchor p.{page}')
    anchors = {
        CORE: (
            b'Us=G.add(G.mul(G.q(4),eta),j)',
            b'Hs=G.add(G.mul(D,eta),G.mul(d,Us))',
            b'den=G.add(G.pow(Hs,2),G.pow(sigma,2)),chi=G.div(G.pow(Hs,2),den),zeta=G.neg(G.div(G.mul(L,Hs),den))',
            b'psi=G.integral(G.substitute(zeta,eta,z),z,G.zero,eta),g=G.div(G.exp(G.mul(Lambda,psi)),C)',
            b'physicalFPartial:G.mul(g,phiPartial)',
        ),
        EVAL: (
            b'coefficients.push(J.scale(J.mul(coefficients[n],chi),A.point(q(-1,2*(n+1)*(n+2)))))',
            b'29n*fac(m+k),(1n<<BigInt(260*(53-m)))*BigInt((m+1)**2)*20n**BigInt(k)',
            b'qp(base,m+k+1)',
        ),
        NORMS: (
            b'Xlo=G.div(Xa,q(2)),Xhi=G.mul(q(2),Xb)',
            b'const profiles={E:mul(sqrtEnlarged,F),U,Pi',
            b"domain:{X:[Xlo,Xhi],eta:['-1','1']}",
        ),
        CUTOFFS: (
            b"for(const name of ['E','U','Pi','StreamOverR'])terms.push",
            b'bound=G.maximum(G.one,...terms.map(t=>t.upper)),requiredLog=G.div(G.add(G.mul(q(n),log2),G.log(bound)),G.mul(q(n),h))',
            b'logScale=G.maximum(doubling,...coefficientBounds.map(r=>r.requiredLog))',
            b'attachActualInductionNorms(prepared,{throughOrder:n,derivativeOrder:n},context)',
        ),
        COMMON: (
            b'logScale=G.maximum(old.logScale,growth,smallBand,...constraints.map(c=>c.requiredLog))',
            b"growth=G.add(previous,G.log(q(n===2?16:2)))",
            b'B_nm*b_n^(-n*h)<=2^-n',
        ),
        KERNEL: (
            b'binomial(r,power)*(2n*BigInt(n))**BigInt(power)*C[r-power]',
            b'q^(2*n*h)*sum_k binom',
        ),
        INNER: (
            b'naturalBody=G.mul(G.core.g,G.natural(\'Phi\',G.mul(Lambda,X)))',
            b"branch.args[0]===X&&branch.args[1]===Xa&&branch.args[3]===naturalBody",
            b'Every annular wave/mean representative in the original (9.21) vanishes on X<Xa',
            b'tail.finite.length===2&&tail.finite[0].order===1&&tail.finite[1].order===2',
        ),
    }
    for path, oid in BLOBS.items():
        raw = subprocess.check_output(['git','-C',str(repo),'show',f'{COMMIT}:{path}'])
        need(git_blob(raw) == oid and all(anchor in raw for anchor in anchors[path]),
             f'original source clauses {path}')
    return {'paperSHA256': PAPER, 'paperPages': sorted(page_anchors), 'sourceCommit': COMMIT,
            'gitBlobs': BLOBS, 'exteriorSupportIsManuscriptPremise': True}


def point_samples(runtime):
    for path, oid in RUNTIME.items():
        need(git_blob((runtime/path).read_bytes()) == oid, f'executed original core source {path}')
    js = """
import {evaluateActualCorePoint} from MODULE;
const pts = ['2','9/4','5/2'];
const ans = pts.map(Y => {
  const z = evaluateActualCorePoint({Y,eta:{kind:'DIRECT_RATIONAL',value:'0'},
                                    radialOrder:1,etaOrder:0,bits:192,degree:48});
  return {Y,scope:z.scope,position:z.domain.sourcePosition,arithmetic:z.arithmetic,
          phi:z.phi.rows.map(r => ({order:r.YDerivativeOrder,lo:r.actualNonlinearInterval.lower,
                   hi:r.actualNonlinearInterval.upper,nonlinearError:r.positiveNonlinearErrorUpper}))};
});
process.stdout.write(JSON.stringify(ans));
""".replace('MODULE', json.dumps((runtime/EVAL).resolve().as_uri()))
    raw = subprocess.check_output(['node','--input-type=module','-e',js])
    points = json.loads(raw)
    need(len(points)==3 and all(row['position']=='ACTUAL_UNMODIFIED_CORE' and
         row['scope']['positiveBanachErrorRetained'] and not row['arithmetic']['binary64UsedForDecisions'] and
         Q(row['phi'][0]['lo']) > Q(1,3) and Q(row['phi'][1]['hi']) < -Q(1,16) and
         all(Q(term['nonlinearError'])>0 for term in row['phi']) for row in points),
         'actual original core computations with retained errors at three anchors')
    return {'runtimeBlobs': RUNTIME, 'points': points, 'uniformCellProofUsesAnalyticBound': True}


def source_graph(joined, outer, chart):
    manifest = read(joined/'original-source-export-manifest.json')
    need((manifest['node_count'],manifest['node_stream_sha256'],manifest['definitions_sha256']) ==
         (4459637,GRAPH,REGISTRY), 'same corrected graph and original common prefix')
    registry = (joined/'original-source-functions.json').read_bytes()
    need(sha256(registry).hexdigest() == REGISTRY, 'same exact original native registry')
    background = outer.archive['fieldInputs']['actualBackgroundSource']
    need(background['prefix'] == [
        {'order':1,'b':617466,'coefficientF':117670,'coefficientU':117671,'coefficientM':117673},
        {'order':2,'b':617515,'coefficientF':120457,'coefficientU':120455,'coefficientM':120486},
    ] and chart['background']['selector_lower_bounds_b_n_times_qBig']==['1','16','32','64'],
         'same source finite prefix and inactive-tail selector rule')
    with TemporaryFile('w+b') as backing:
        g=Graph(joined/'original-source-nodes.jsonl.gz',backing,manifest)
        need(g.args(617466,'exp')==[617465] and g.args(617515,'exp')==[617514] and
             {137420,617464}<=set(g.args(617465,'maximum')) and
             {163613,617513}<=set(g.args(617514,'maximum')) and
             g.node(137420)[0]==g.node(163613)[0]=='maximum' and
             g.args(617464,'multiply')==[127,617463] and g.args(617463,'add')==[669,617432] and
             q(g,669)==10 and g.args(617513,'add')==[617465,617512] and
             g.args(617512,'log_positive')==[591] and q(g,591)==16,
             'literal actual b1,b2 scales and lower selector bounds')
        for i in (background['leadingF'],117670,120457):
            actual = g.args(i,'actual_expression_partial')
            need(actual[1:]==[g.args(background['leadingF'],'actual_expression_partial')[1],[0,0]],
                 'actual leading and positive coefficient source uses same F formal chart')
        need(g.args(622820,'actual_monotone_root')==[2,622803,622804],
             'actual native root in the correction chart uses the physical slow slots')
    return {'graph': GRAPH,'registry': REGISTRY,'nodeCount':4459637,'actualPrefix':background['prefix'],
            'sameCoreLeadingF':background['leadingF'],'actualInverseRoot':622820,
            'historicalLogCutoffRoots':[137420,163613]}


def analytic_core(outer, amplitude):
    exact_parameters(outer)
    params=outer.archive['formulaProgram']['parametersExactExpressions']
    need(params['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]} and
         params['Lambda']=={'power':[{'ref':'Q'},64]}, 'actual core X_a and Lambda')
    need(amplitude['bounds']['logCSelectedLower']=='Lc>=Q^200>=exp(800*T)>123000*T',
         'same exact Lc lower bound and h upper bound')
    y0,y1=Q(2),Q(5,2)
    need(y0==Q(4,2) and y1<Q(4) and 1-y1/4==Q(3,8), 'strict natural core and normalized norm domain')
    base=1-y1/20
    banach0=Q(29,2**(260*53))/base
    banach1=Q(29,20*2**(260*53))/base**2
    need(banach0<Q(1,24) and banach1<Q(1,64) and
         y1/6==Q(5,12) and Q(3,4)/4*(1-y1/6)-banach1>Q(1,16),
         'uniform nonlinear value and radial derivative comparison with retained errors')
    need(Q(15,16)-Q(5,2000)>Q(1,2) and
         (Q(1,2)**2)/(Q(1,2)**2+Q(1,2000)**2)>Q(3,4),
         'actual chi_core positivity on the narrow axial interval')
    need(25600000-128-Q(8002,123000)>0 and 512*128==65536 and
         1+Q(32,200)<2 and 2**9==512,
         'normalized source diagonal cutoff error is smaller than the retained leading field')
    need(Q(2)*Q(1,2)*Q(1,3)==Q(1,3) and Q(3)*2*Q(9,8)<7 and
         Q(1,3)-Q(1,512)>Q(1,4) and 7+Q(1,512)<8,
         'strict actual positive swirl after retaining all active background terms')
    need(-Q(1,3)-Q(1,1024)>-Q(1,2) and
         -Q(1,64)+Q(1,1024)<-Q(1,128), 'strict actual b_s after derivative errors')
    return {
        'Y':['2','5/2'], 'etaStar':'sigmaStar/Lambda', 'Xa':'4/Lambda',
        'gTimesCSelected':['1/2','2'],'phi':['1/3','9/8'],'phiY':['-1/3','-1/16'],
        'nonlinearErrorRetained':True,
        'uniformity':'original uniform nonlinear error and continuity in Y,eta; samples are separate',
        'leadingE0TimesCSelectedSqrtLambda':['1/3','7'],
        'activeNormalizedSwirlError':'|Delta E|, |partial_X Delta E| < q^h < 1/(512*CSelected*sqrt(Lambda))',
        'errorProof':['for n active: B_(n,m)*q^(2*n*h)<=2^-n*q^(n*h), m=0,1',
                      'for n inactive: chi(b_n*q) and its positive derivatives vanish, including seam',
                      'log(CSelected*sqrt(Lambda))<2*Lc',
                      'h*B>512*h*log(Rstar)>65536*Lc'],
        'actualETimesCSelectedSqrtLambda':['1/4','8'],
        'localAtomScope':'near-start cell only; endpoint b_s would additionally require actual n=3 m=1',
        'localFieldAtomIntervals': {
            'b@0,0,0':{'interval':['1/48','16'], 'positiveFactor':'tau0^(-(1+h))/CSelected'},
            'b@1,0,0':{'interval':['-4','-1/1024'], 'positiveFactor':'tau0^(-(2+h))*Lambda/CSelected'},
        },
    }


def geometry_and_energy():
    rho, eta, h = symbols('rho eta h', positive=True)
    D = Rational(1,2)-h
    A = Rational(1,2)+h
    Qchart = rho/(1-eta**2)
    zet = eta*Qchart**D
    determinant = Qchart**D*(1-2*h*eta**2)/(1-eta**2)
    need(simplify(diff(zet,eta)-determinant)==0 and simplify(D+1-2*A-(Rational(1,2)-3*h))==0,
         'exact whole-K axial map and energy power')
    need(Q(1,16)<Q(1,8)<Q(1,4) and Q(16,15)<2 and
         Q(1,2)-3*Q(1,64)>0 and Q(5,16)*Q(1,2)<Q(1,4),
         'strict cutoff and Q bounds including near-start n>=3 flat zero')
    # E_theta = (2*pi*tau0/Lambda) c^2 * int Q^(1/2-3h) L/(1-eta^2) E^2.
    need(2*Q(1,2)*Q(1,16)==Q(1,16) and
         2*Q(1,4)*Q(1,2)*Q(1,16)==Q(1,64) and
         Q(1,64)*Q(1,2)==Q(1,128), 'exact radial/axial measures and positive time-work factor')
    return {
        'chart': {'Q':'rho/(1-eta^2)','zeta':'eta*Q^D','rSquared':'2*tau0*Q*Y/Lambda',
                  'spatialMeasureWithoutZ0':'(tau0/Lambda)*Q^(D+1)*(1-2*h*eta^2)/(1-eta^2) dY deta dtheta',
                  'normalizedEnergyExponent':'D+1-2*A=1/2-3*h',
                  'exactOriginalChartEquation':'Q-zeta^2*Q^(2*h)=rho'},
        'cutoffAndGauge': {
            'radialAndAxial':'strictly in original plateaux, grad(C)=0',
            'allAnnularCorrections':'zero on strict X<Xa by original support theorems',
            'baseGauge':'azimuthal Stokes potential, curl has no theta component',
            'fullSwirl':'u_theta=chi(rho)*q^(-A)*(E0+DeltaE)',
        },
        'actualNearStartCell': {
            'rho':['1-etaStar^2/8','1-etaStar^2/16'],
            'eta':['etaStar/2','etaStar'],'Y':['2','5/2'],
            'allAngles':True,'QStrictlyGreaterThanOne':True,
            'onlyPossiblePositiveBackgroundOrders':[1,2],
            'activeN3SourceNeeded':False,
            'swirlEnergyNormalizedLower':'pi*tau0*etaStar*chi(rho)^2/(64*CSelected^2*Lambda^2)',
            'uniformPositiveLower':'pi*tau0*etaStar*exp(-16/etaStar^2)/(256*CSelected^2*Lambda^2)',
            'positiveTimeCutoffSwirlWorkLower':
                'pi*tau0*etaStar*(chi(rhoLo)^2-chi(rhoHi)^2)/(128*CSelected^2*Lambda^2)',
            'fullForceWorkClaimed':False,
        },
        'conditionalEndCell': {
            'rho':'1/2','eta':['-etaStar','etaStar'],'Y':['2','5/2'],
            'onlyPossiblePositiveBackgroundOrders':[1,2,3],
            'requiredPremise':'actual original n=3 normalized diagonal m=0 bound; no n=3 numerical graph replay here',
            'swirlEnergyNormalizedLower':'pi*tau0*etaStar/(16*CSelected^2*Lambda^2)',
        },
    }


def main():
    parser=ArgumentParser()
    parser.add_argument('--repo',type=Path,required=True)
    parser.add_argument('--paper',type=Path,required=True)
    parser.add_argument('--localization-source',type=Path,required=True)
    parser.add_argument('--runtime',type=Path,required=True)
    parser.add_argument('--joined',type=Path,required=True)
    parser.add_argument('--whole-k',type=Path,default=NEXT.parent/'goal-20261111/m3/whole-k-chart.json')
    parser.add_argument('--amplitude',type=Path,default=NEXT/'whole-k-exterior/amplitude/whole-k-exterior-amplitude.json')
    parser.add_argument('--out',type=Path,default=HERE/'whole-k-center.json')
    args=parser.parse_args()
    manuscript_and_code=source_pins(args.repo,args.paper)
    sys.path.insert(0, str(args.localization_source / 'research-ide/mathscope-m3/recovery-20261019'))
    from outer_cutoff import ActualOuterCutoff
    outer=ActualOuterCutoff(args.localization_source)
    chart=read(args.whole_k,'wholeK')
    result={'schema':'MathScope.N7.ActualWholeKCoreSwirl/1','source':manuscript_and_code,
            'actualCoreSamples':point_samples(args.runtime),
            'sourceGraph':source_graph(args.joined,outer,chart),
            'analyticCore':analytic_core(outer,pinned_json(args.amplitude,AMPLITUDE)),
            'center':geometry_and_energy(),
            'scope':{'originalAnnularSupportUsedAsManuscriptTheorem':True,
                     'actualNearStartPositiveSwirlCell':True,'endCellThirdOrderIndependentReplay':False,
                     'actualFullCenterForce':None,'wholeKFinalEnergy':None,'N7-06':'OPEN',
                     'N8-05':'OPEN','wholeKFinalJets':'0/67','release':'HOLD'}}
    args.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('PASS actual center near-start swirl, two local atoms and positive time-cutoff work contribution.')
    print('Endpoint energy lower conditional on n=3 diagonal. N7-06/N8-05 OPEN.')
    print('Receipt SHA256',sha256(args.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
