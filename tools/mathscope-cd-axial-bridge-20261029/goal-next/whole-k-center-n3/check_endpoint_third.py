"""Independently read the original third-order cutoff DAG and close the center premise."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha1, sha256
from pathlib import Path
import gzip
import json
import re
import subprocess

HERE = Path(__file__).resolve().parent
NEXT = HERE.parent
COMMIT = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
M2 = 'research-ide/mathscope-m2/navier/'
SOURCE = M2+'actual-residual-order-induction-source.mjs'
CUTOFF = M2+'actual-residual-order-induction-cutoffs.mjs'
COMMON = M2+'actual-common-admissible-family.mjs'
NORM = M2+'actual-residual-order-induction-norms.mjs'
SOURCE_GRAPH = 'b68d5de9a1b03f4eb393eda5c1af8591a39237b66fc94edaf6d65959e3a70ab7'
CENTER = '6c931f7e084df630c9fa1a632f6f7b7c9c3deda8b20c283864224a2e81c7f728'
CHART = 'af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9'
ORDER3_STRESS = '26bbd0d14f0218dfe0a6be2494845e6de86bb8cb23f782bccb695ba2abfee2c7'
NATIVE_NODE_HASH = '9c1ccdd3a60ce37974a3d63d7436e178cd8b1214bc7c7c69418538849ae8b49c'
NATIVE_REGISTRY_HASH = '02c862a3328d1ec818c7e65854059cd664e4490473ab2645facd4ae6eff7e259'
IMPORT = re.compile(rb"""(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.\.?/[^'"]+)['"]""")


def need(ok, explanation):
    if not ok:
        raise ValueError(explanation)


def pinned(path, digest):
    data = path.read_bytes()
    need(sha256(data).hexdigest() == digest, f'pinned {path.name}')
    return json.loads(data)


def git_blob(raw):
    return sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()


def verify_runtime(root, repo):
    pending, found = [SOURCE, CUTOFF], {}
    while pending:
        name = pending.pop()
        if name in found:
            continue
        path = root / name
        raw = path.read_bytes()
        found[name] = raw
        for relative in IMPORT.findall(raw):
            child = (path.parent / relative.decode()).resolve().relative_to(root)
            pending.append(child.as_posix())
    names = sorted(found)
    listing = subprocess.check_output(['git','-C',str(repo),'ls-tree','-z',COMMIT,'--',*names])
    records = {}
    for item in listing.rstrip(b'\0').split(b'\0'):
        meta, name = item.split(b'\t',1)
        mode, kind, oid = meta.decode().split()
        need(mode=='100644' and kind=='blob', 'original regular runtime module')
        records[name.decode()] = oid
    need(records == {name:git_blob(raw) for name,raw in found.items()},
         'all local runtime import bytes equal original Git source')
    common = subprocess.check_output(['git','-C',str(repo),'show',f'{COMMIT}:{COMMON}'])
    need(git_blob(common)=='614c59419ec1a6d7e37a52084d10b6a3b4e5d30b' and
         b"growth=G.add(previous,G.log(q(n===2?16:2)))" in common and
         b'logScale=G.maximum(old.logScale,growth,smallBand,...constraints.map(c=>c.requiredLog))' in common,
         'actual common selector retains historical c_n and original growth')
    norm = found[NORM]
    need(b'const profiles={E:mul(sqrtEnlarged,F),U,Pi' in norm and
         b"domain:{X:[Xlo,Xhi],eta:['-1','1']}" in norm and
         b'Xlo=G.div(Xa,q(2)),Xhi=G.mul(q(2),Xb)' in norm,
         'normalization is actual E_n=sqrt(2X)F_n over original norm box')
    return {'sourceCommit':COMMIT, 'runtimeGitBlobs':records, 'commonSelectorGitBlob':git_blob(common),
            'b3Domination':'original log b3=max(log c3, growth, remaining original constraints)'}


def original_prefix(graph, native):
    manifest = json.loads((graph/'original-source-export-manifest.json').read_bytes())
    need(manifest['node_count']==4459637 and manifest['node_stream_sha256']==SOURCE_GRAPH,
         'same original joined graph previously authenticated by center replay')
    counts = [117100,native['graph']['orderTwoPrefixNodeCount']]
    need(counts[1]==120820, 'entire old constructed N2 prefix through the final stress root')
    sha = sha256(b'[')
    checks = {}
    selected = {}
    with gzip.open(graph/'original-source-nodes.jsonl.gz','rb') as src:
        header = json.loads(src.readline())
        need(header['node_count']==manifest['node_count'], 'same whole graph header')
        for i in range(counts[1]):
            line = src.readline().rstrip(b'\r\n')
            need(bool(line), f'old source prefix row {i}')
            if i:
                sha.update(b',')
            sha.update(line)
            if i in [117100,117670,120457]:
                selected[i] = json.loads(line)
            if i+1 in counts:
                digest = sha.copy()
                digest.update(b']')
                checks[i+1] = digest.hexdigest()
    need(checks=={117100:native['graph']['prefixSHA256'],120820:native['graph']['orderTwoPrefixSHA256']},
         'entire old N2 coefficient and stress AST equals fresh order-three prefix')
    roots = native['roots']
    for name in ('leadingF','lowerF1','lowerF2'):
        i=roots[name]
        need(native['sourceNodeRecords'][str(i)]==selected[i], f'same old root {name}')
    return {'graphSHA256':SOURCE_GRAPH, 'commonNodePrefixes':checks, 'F0F1F2Roots':list(selected)}


def exact_dag(d, stress):
    g,r=d['graph'],d['roots']
    need(g['constructedNodes']==123870 and g['canonicalNodes']==212870 and
         g['allNodeSHA256']==NATIVE_NODE_HASH and g['nativeDefinitionsSHA256']==NATIVE_REGISTRY_HASH,
         'pinned original canonical order-three replay')
    need(d['input']['order']==3 and d['scope']['actualCanonicalHistoricalCutoffBuilt'] and
         d['scope']['orderFourAllocated'] is False, 'no order four allocation')
    source=d['actualThirdSource']
    need(source['rawSystem']==5 and source['auxiliarySystem']==4 and
         source['actualLowerOrders']==[0,1,2] and source['actualFinalizedLowerCutoffs'] and
         source['actualZeroAxisDatum']==[0]*6 and source['actualCompletedFiveMoments']==[True]*5 and
         source['actualCutoffPreserved'], 'actual N3 native equation, distinct auxiliary and completed tuple')
    need(all(row['kind']=='actual' for row in source['actualLowerFormals']) and
         [row['order'] for row in source['actualLowerFormals']]==[0,1,2],
         'actual lower formal-to-radial Picard arguments')
    old = stress['certificate']
    old_third=[row for row in old['stressRows'] if row['order']==3]
    need(stress['prefixSHA256']==g['prefixSHA256'] and
         [row['component'] for row in old_third]==['theta','z'] and
         all(row['pass'] and row['actualConservativeTotalReduced']==0 for row in old_third) and
         [row['actualStress'] for row in old_third]==source['stressRoots'] and
         [row['actualRawResidual'] for row in old_third]==source['rawResidualRoots'],
         'same exact N3 stress and raw residual roots as independent conservative source replay')
    records={int(i):row for i,row in d['sourceNodeRecords'].items()}

    def args(i, op):
        row=records[i]
        need(row['op']==op, f'expected {op} at source #{i}')
        return row['args']

    def rational(i):
        return Q(*map(int,args(i,'rational')))

    need(args(r['h'],'source_parameter')==['h'] and rational(args(r['log2'],'log_positive')[0])==2,
         'same exact positive h and log 2')
    h_id, n_id=args(r['nh'],'multiply')
    need(h_id==r['h'] and rational(n_id)==3, 'literal 3*h')
    norm=d['normalized']
    need(norm['roots']['F']==r['F3'] and norm['roots']['U']==r['U3'] and
         norm['roots']['Pi']==r['Pi3'] and not norm['sourceCoefficientReplacedByBound'] and
         norm['domain']=={'X':[r['Xlo'],r['Xhi']],'eta':['-1','1']},
         'same original N3 normalized norm bodies')
    half, xa=args(r['Xlo'],'multiply')
    two, xb=args(r['Xhi'],'multiply')
    need(rational(half)==Q(1,2) and xa==3617 and rational(two)==2 and xb==28826,
         'exact original domain [Xa/2,2*Xb]')
    for name in ('F3','U3','Pi3'):
        _, formal, derivative=args(r[name],'actual_expression_partial')
        need(formal==[4756,2] and derivative==[0,0], f'actual third coefficient formal mapping {name}')
    need(args(r['rawF3'],'actual_background_even_profile')==[5,0,4756,2,0,0],
         'actual third angular raw Picard value')
    sqrt_factor, _=args(r['E30'],'multiply')
    [radicand]=args(sqrt_factor,'sqrt_positive')
    need(set(args(radicand,'multiply'))=={two,r['Xhi']},
         'actual C0 E norm includes sqrt(2*Xhi)')
    need(args(r['c3'],'exp')==[r['logc3']], 'historical c3 exact exponentiation')
    selector=args(r['logc3'],'maximum')
    for m, norm_key in [(0,'E30'),(1,'EX30')]:
        row=d['cutoff'][f'm{m}']
        bound=r[f'B3{m}']
        log_bound=r[f'logBound{m}']
        need(row['bound']==bound and row['requiredLog']==log_bound and log_bound in selector and
             r[norm_key] in args(bound,'maximum'), 'historical selector retains relevant actual norm')
        factors=args(log_bound,'multiply')
        inverse=[i for i in factors if records[i]['op']=='inverse']
        need(len(inverse)==1 and args(inverse[0],'inverse')==[r['nh']], 'exact 1/(3*h)')
        [sum_node]=[i for i in factors if i!=inverse[0]]
        terms=args(sum_node,'add')
        logs=[i for i in terms if records[i]['op']=='log_positive']
        need(len(logs)==1 and args(logs[0],'log_positive')==[bound], 'actual log B3m')
        [scaled_log]=[i for i in terms if i!=logs[0]]
        need(set(args(scaled_log,'multiply'))=={n_id,r['log2']}, 'exact 3*log(2)')
    return {'F3':r['F3'],'U3':r['U3'],'Pi3':r['Pi3'],'B30':r['B30'],'B31':r['B31'],
            'E30':r['E30'],'EX30':r['EX30'],'logc3':r['logc3'],'c3':r['c3'],
            'm0m1LogBounds':[r['logBound0'],r['logBound1']]}


def endpoint(center, chart):
    need(chart['background']['selector_lower_bounds_b_n_times_qBig']==['1','16','32','64'] and
         chart['background']['first_flat_zero_order']==4,
         'same actual higher background tail bound')
    prior=center['center']['conditionalEndCell']
    need(prior['rho']=='1/2' and prior['eta']==['-etaStar','etaStar'] and prior['Y']==['2','5/2'] and
         prior['onlyPossiblePositiveBackgroundOrders']==[1,2,3],
         'exact endpoint center cell from the earlier geometric proof')
    need(Q(64,64)==1 and Q(1,2)+Q(1,4)+Q(1,8)==Q(7,8)<1,
         'flat higher tail and positive normalized error')
    return {
        'rho':'1/2','eta':prior['eta'],'Y':prior['Y'],
        'sameFinalFieldIdentification':'original annular support theorem as in pinned center replay',
        'n3ActiveProof':['b3*q<=1 gives c3*q<=1',
                         'log(c3)>=(3*log(2)+log(B3m))/(3*h), m=0,1',
                         'B3m*q^(3*h)<=1/8, so B3m*q^(6*h)<=q^(3*h)/8'],
        'n3InactiveProof':'chi(b3*q)=0 on b3*q>=1 including flat seam',
        'allHigherOrders':'b_n*q>=1 for n>=4, hence all terms flat zero',
        'coefficientAndRadialErrorUpper':'sum_(n=1)^3 2^-n*q^(n*h)<q^h',
        'actualNormalizedSwirlEnergyLower':prior['swirlEnergyNormalizedLower'],
        'lowerBoundStrictPositive':True,
        'actualLocalFieldAtomIntervals':center['analyticCore']['localFieldAtomIntervals'],
        'thirdOrderPremiseDischarged':True,
    }


def main():
    p=ArgumentParser()
    p.add_argument('--repo',type=Path,required=True)
    p.add_argument('--source',type=Path,required=True)
    p.add_argument('--native',type=Path,default=HERE/'third-diagonal-native.json')
    p.add_argument('--joined',type=Path,required=True)
    p.add_argument('--center',type=Path,default=NEXT/'whole-k-center/whole-k-center.json')
    p.add_argument('--whole-k',type=Path,required=True)
    p.add_argument('--order3-stress',type=Path,default=NEXT/'axial-alln/order-three.json')
    p.add_argument('--out',type=Path,default=HERE/'endpoint-third-bound.json')
    a=p.parse_args()
    native=json.loads(a.native.read_bytes())
    center,chart,stress=pinned(a.center,CENTER),pinned(a.whole_k,CHART),pinned(a.order3_stress,ORDER3_STRESS)
    d={'schema':'MathScope.N7.ActualEndpointThirdDiagonal/1',
       'nativeReceiptSHA256':sha256(a.native.read_bytes()).hexdigest(),
       'runtime':verify_runtime(a.source.resolve(),a.repo),
       'originalN2Prefix':original_prefix(a.joined,native),
       'actualN3Graph':native['graph'],
       'earlierConservativeStressRoots':native['actualThirdSource']['stressRoots'],
       'boundRoots':exact_dag(native,stress),
       'endpoint':endpoint(center,chart),
       'scope':{'orderFourAllocated':False,'actualCommonB3NumericallyEvaluated':False,
                'centerEndpointSwirlEnergyLowerVerified':True,'N7-06':'OPEN','N8-05':'OPEN',
                'wholeKFinalJets':'0/67','release':'HOLD'}}
    a.out.write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8')
    print('PASS original n=3 m=0,1 diagonal and endpoint center swirl energy lower bound.')
    print('N7-06/N8-05 OPEN, global jets 0/67, RELEASE HOLD.')
    print('Receipt SHA256',sha256(a.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
