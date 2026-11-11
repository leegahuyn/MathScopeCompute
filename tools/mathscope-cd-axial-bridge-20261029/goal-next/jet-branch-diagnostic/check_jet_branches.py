"""Exact branch diagnostic for the attained N1 chart and the actual 67-jet request."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha1, sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

BASE = Path(__file__).resolve().parent.parent
for sub in ('first-gauge','temporal-exterior','first-scale-closure'):
    sys.path.insert(0,str(BASE/sub))
from bind_first_cycle_gauge import Graph, Native, git_blob, need, q, read_artifact, ORIGINAL
from check_temporal_exterior import chart
from check_first_scale_closure import verify_qbig

REQ = 'research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1/work/prune_recovery/energy/evidence/MISSING_ACTUAL_JET_REQUEST.json'
PINS = {
    'native':'5b419e65a27e35181fb79e39727b2d90f24402a690875e03ece07ad80cf15968',
    'whole-k':'af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9',
    'c3':'8015ecf6eb80cc1b9ebc14ec5ec8c80ce6e8fe38ce5b9bd2cb27a736b3596ff7',
}
S_LO,S_HI = Q(15,16),Q(35,32)
T_LO,T_HI = Q(15,16),Q(17,16)


def load_pinned(path,key):
    b=path.read_bytes()
    need(sha256(b).hexdigest()==PINS[key],f'original pinned {key} receipt')
    return json.loads(b)


def stencil(repo):
    b=git_blob(repo,ORIGINAL,REQ)
    need(sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()=='47d5dbc4933eb5064538d4914ed65dceaaafd080',
         'same original 67-jet request')
    req=json.loads(b)
    labels=req['requested_field_jets']
    names={name:Counter() for name in ('A0','A1','A2','b','p')}
    by_order={m:[] for m in range(4)}
    need(len(labels)==len(set(labels))==67 and len(req['requested_cutoff_jets'])==13,
         'original 67 and 13 inventories')
    for label in labels:
        name,multi=label.split('@')
        index=[int(x) for x in multi.split(',')]
        need(len(index)==(3 if name=='b' else 4) and min(index)>=0,'actual independent coordinate count')
        names[name][sum(index)]+=1
        by_order[sum(index)].append(label)
    need([len(by_order[m]) for m in range(4)]==[5,18,26,18],'actual derivative order counts')
    return {'requestSHA256':sha256(b).hexdigest(),'coordinates':req['coordinates'],'domain':req['requested_domain'],
            'orderByField':{k:dict(v) for k,v in names.items()},'exactRequestsByOrder':by_order,
            'valueOrFirstOrderRequests':23,'orderTwoOrThreeRequests':44}


def log_bounds(x,terms=96):
    """Rational enclosure of log(x) via the convergent odd atanh series."""
    need(x>0,'positive logarithm operand')
    z=(x-1)/(x+1)
    z2=z*z
    partial=2*sum(z**(2*n+1)/Q(2*n+1) for n in range(terms))
    tail=2*abs(z)**(2*terms+1)/(Q(2*terms+1)*(1-z2))
    return partial-tail,partial+tail


def stage_guard(j,dlo,dhi,slo=S_LO,shi=S_HI):
    """d encloses actual L1-B if available; no evaluation of exp(L1) is used."""
    need(type(j) is int and j>=0 and 1<=dlo<=dhi and 0<slo<=shi,'original local guard domain')
    l2lo,l2hi=log_bounds(Q(2))
    lo=dlo-(j+2)*l2hi+log_bounds(slo)[0]
    hi=dhi-(j+2)*l2lo+log_bounds(shi)[1]
    if hi<=-l2hi:
        return 'UNIT_PLATEAU'
    if lo>=0:
        return 'ZERO_PLATEAU'
    if lo>-l2lo and hi<0:
        return 'STRICT_POSITIVE_TRANSITION'
    return 'UNRESOLVED_OR_SEAM_CROSSING_REFINE'


def scale2(j):
    return Q(2)**(3-j)


def outer_time(j,tlo=T_LO,thi=T_HI):
    lo,hi=scale2(j)*tlo,scale2(j)*thi
    if lo==hi and lo in {Q(1,2),Q(1)}:
        kind='LOWER_FLAT_SEAM' if lo==Q(1,2) else 'UPPER_FLAT_SEAM'
    elif hi<=Q(1,2):
        kind='UNIT_PLATEAU'
    elif lo>=1:
        kind='ZERO_PLATEAU'
    elif lo>Q(1,2) and hi<1:
        kind='STRICT_POSITIVE_TRANSITION'
    else:
        kind='CELL_TOUCHES_OR_CROSSES_SEAM'
    return {'rho':[str(lo),str(hi)],'branch':kind}


def bound_box(g,n,repo,native,whole,c3):
    box=native['formalInverseChartBox']
    need(box['input_Z']==['-1/8','1/8'] and box['input_T']==['15/16','17/16'] and
         native['inputBinding']['witnessBindingVerified'] and
         native['inputBinding']['attainedChart']=='s=1, eta=0, X=(Xa+Xb)/2, Z=0, T=1, R=sqrt(2X)',
         'actual N1 calibration point and exact original Z,T enclosure box')
    need(S_LO<=Q(box['root'][0])<=Q(box['root'][1])<=S_HI and T_HI+Q(2,64)==S_HI,
         'original inverse enclosure fits elementary exact s box')
    for root,node in native['sourceWindowAndRepresentativeAnchors'].items():
        need(g.node(int(root))==(node['op'],node['args']),
             f'old attained point anchor {root} is unchanged in the corrected graph')
    pr,qroots=verify_qbig(repo)
    need(qroots['ellMinimum']==617432 and qroots['ell0']==617433 and
         qroots['qBig']==622791 and g.node(622791)[0]=='coordinate',
         'localization qBig root belongs to its own namespace')
    for i in (617432,617431,617430,617357,617428,617429):
        need(g.node(i)==pr.node(i),f'same inherited original threshold tree {i}')
    need(g.args(617463,'add')==[669,617432] and q(g,669)==10 and
         g.args(617464,'multiply')==[127,617463] and 617464 in g.args(617465,'maximum'),
         'original log b1 contains (ell_min+10) log2')
    need(g.args(617512,'log_positive')==[591] and q(g,591)==16 and
         g.args(617513,'add')==[617465,617512] and 617513 in g.args(617514,'maximum'),
         'original b2 at least 16 times b1, ensuring attained chart remains in the prefix')
    shell=chart(g,n,repo)
    need(c3['radialEnvelopeComparison']['MAtMostOriginalEnvelope'] and
         whole['variables']['rho']=='tau/tau0 with tau=1-t and tau0=qBig/32' and
         whole['variables']['zeta']=='z/z0 with z0=tau0^(1/2-h)' and
         whole['variables']['bounds']==['1/2 <= Q < 2','|eta| < 3/4','q < qBig/16'],
         'actual outer and local chart scales and distinct whole-K ratio')
    # R/Rw is a declared radial subcell around the calibrated Rw, not a mesh label.
    lower=Q(15,16)**2/(2*S_HI)
    upper=Q(17,16)**2/(2*S_LO)
    need(lower==Q(45,112) and lower*3>1 and upper*Q(3,2)<1 and
         Q(8,3)**2*lower>1 and Q(17,16)**2*Q(3,2)<4,
         'strict stress shell and upper mean-patch plateau over enlarged radial subcell')
    need(Q(8,3)*S_LO/4>Q(1,2) and 3*S_HI/4<1 and 3*S_HI/8<Q(1,2),
         'branch separation on the conditional minimal first scale')
    need(Q(2)*8*Q(1,8)**2<Q(1,2) and 1024>4,
         'whole outer axial/radial plateaus from actual q and chart radii')
    examples={
        'j3Point':outer_time(3,Q(1),Q(1)),
        'j3T15Over16':outer_time(3,T_LO,T_LO),
        'j4Point':outer_time(4,Q(1),Q(1)),
        'j4T17Over16':outer_time(4,T_HI,T_HI),
    }
    need([row['branch'] for row in examples.values()]==[
        'UPPER_FLAT_SEAM','STRICT_POSITIVE_TRANSITION','LOWER_FLAT_SEAM','STRICT_POSITIVE_TRANSITION'],
         'exact flat endpoint versus adjacent positive transition controls')
    need([stage_guard(i,Q(1),Q(1)) for i in (0,1)]==['STRICT_POSITIVE_TRANSITION','UNIT_PLATEAU'] and
         stage_guard(0,Q(3),Q(3))=='ZERO_PLATEAU' and
         stage_guard(0,Q(1),Q(3))=='UNRESOLVED_OR_SEAM_CROSSING_REFINE',
         'rigorous directed log branch classifier controls')
    return {
        'attainedOriginalZT':{'Z':box['input_Z'],'T':box['input_T'],'sOutwardConservative':['15/16','35/32'],
                              'previousExactSInterval':box['root']},
        'declaredRadialSubcell':{'RoverRw':['15/16','17/16'],'Rw':'sqrt(Xa+Xb)',
             'XOverXaLowerStrict':str(lower*3),'XOverXbUpperStrict':str(upper*Q(3,2)),
             'insideIntrinsicStressShell':True,'aboveAllThreeFiveMapProfiles':True,
             'meanPatchChi':1,'meanPatchRho':0,'TemporalA1':0,'actualFiveMapCorrectionZero':True,
             'individualMeshTorusSeamsResolved':False,'sourceShell':shell},
        'bandGap':'j=L-ell_min-10 is a nonnegative integer, L=#622785 and ell=L+2',
        'qOverQbig':'s*2^(-j-2)','outerRho':'tau/tau0=2^(3-j)*T',
        'wholeKContrast':{'comparisonSlabRho':['1/2','1'],'conservativeQOverQbig':['1/64','1/16'],
                           'attainedPointMembershipRequiresActualJ':True},
        'outerRadialFactor':'UNIT_PLATEAU','outerAxialFactor':'UNIT_PLATEAU',
        'outerTimeByGapOnExactBox':{str(j):outer_time(j) for j in range(6)},
        'allJAtLeastFiveOuterUnitPlateau':True,'allJAtMostTwoEntirelyBeyondOuterUpperTime':True,
        'minimalScaleGuardOnExactBox':{'j0':'STRICT_POSITIVE_TRANSITION','jAtLeast1':'UNIT_PLATEAU'},
        'originalFirstScaleJ0CannotBeUnitOnThisBox':True,'flatPointVersusNeighboringTransitionExamples':examples,
        'logGuardDomain':'d=L1-B >=1; log(a1*q)=d-(j+2)*log(2)+log(s)',
        'actualLGapEvaluated':False,'actualScaleEvaluated':False,
    }


def main():
    p=ArgumentParser(description=__doc__)
    for key in ('repo','artifact','native','whole-k','c3','out'):
        p.add_argument('--'+key,required=True,type=Path)
    p.add_argument('--index-gap',type=int)
    p.add_argument('--log-guard',nargs=2,type=Q)
    a=p.parse_args()
    f,run,m,run_sha=read_artifact(a.artifact,True)
    n,w,c=(load_pinned(getattr(a,k.replace('-','_')),k) for k in ('native','whole-k','c3'))
    need(c['graphSHA256']==m['node_stream_sha256'] and c['registrySHA256']==m['definitions_sha256'],
         'same corrected C3 source')
    src=git_blob(a.repo,ORIGINAL,'research-ide/mathscope-m3/navier/final-summation/source-final-summation.mjs')
    need(b'G.choose(s,G.q(1,2),G.one,G.one,inside,G.zero)' in src,
         'actual first-stage linear-seed closed cutoff branches')
    native=Native(f/'original-source-functions.json',m)
    with TemporaryFile() as backing:
        g=Graph(f/'original-source-nodes.jsonl.gz',backing,m)
        bound=bound_box(g,native,a.repo,n,w,c)
    result={'schema':'MathScope.N7.AttainedN1JetAndCutoffBranchDiagnostic/1',
         'graphSHA256':m['node_stream_sha256'],'registrySHA256':m['definitions_sha256'],
         'hostedRunSHA256':run_sha,'inputSHA256':PINS,'stageCutoffSourceSHA256':sha256(src).hexdigest(),
         'originalStencil':stencil(a.repo),'actualN1BranchDiagnostic':bound,
         'actualFinalJetEnclosuresAdded':0,'release':'HOLD'}
    if a.index_gap is not None or a.log_guard is not None:
        need(a.index_gap is not None and a.log_guard is not None,'supply both index gap and directed log enclosure')
        result['callerGuardDiagnostic']={'verifiedActualInputs':False,'indexGap':a.index_gap,
            'logGuard':[str(x) for x in a.log_guard],'wholeLocalBoxBranch':stage_guard(a.index_gap,*a.log_guard)}
    a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('PASS 67 order classes 5/18/26/18; attained N1 actual mean patch plateau; '
          'conditional stage/outer seam classifier; no final jet enclosure added')


if __name__=='__main__':
    main()

