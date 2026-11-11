"""Replay the source moving-frame and uniform propagator operands."""
import argparse
from functools import cache
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE.parent / n) for n in ('flat','flat-palette','f1-regularity')]
from bind_forced_cutoffs import (Archive, CHECKPOINT_SHA, GRAPH_SHA, PRODUCER_COMMIT,
                                 REGISTRY_SHA, checkpoint_record, digest, git_blob, pinned_json)
from check_palette import Source, add, atom, inv, mul, num, pow_nat, sqrt, sub
from check_fixed_path import FORCED_SHA, Nodes

REV = '89c8235f277725cf0fd8400be6661c3d72cf1167'
BAND = 'research-ide/mathscope-m3/navier/evidence/global-source-20261012/attempt2/global-band.json'
BAND_SHA = '8d3ebef2bd36d96fed3857ef25477ca7e0f976a25f01f6eaa96b31d04f6be002'
CURRENT = 'research-ide/mathscope-m3/navier/evidence/global-current-20261012/attempt1/global-current.json'
CURRENT_SHA = '8d64f045a4fc87167c8444b11c4e6cb2b8ea89a5eb53f846d31c90c15e8a7f1e'
COMMON = ('research-ide/mathscope-m3/navier/evidence/global-source-class-composition-20261012/'
          'attempt382972107731/actual-common-C4-family.json')
COMMON_SHA = 'c7a04cc4b3dee16031e04d1dbbccfe71f5eeb715832fc2deeb5d668dd0120d05'
STABLE = ('research-ide/mathscope-m3/navier/evidence/source-stable-class-majorants-20261012/'
          'attempt1/receipt.json')
PAPER_SHA = '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'


def dot(left,right):
    return add(*(mul(a,b) for a,b in zip(left,right)))


def matmul(a,b):
    return [[dot(row,col) for col in zip(*b)] for row in a]


def aliases(roots):
    return {i:atom('source',i) for i in roots if i not in (0,1)}


def entry(roots,i,alias):
    root = roots[i]
    return num(root) if root in (0,1) else alias[root]


def read(repo,path,expected=None,rev=REV):
    raw = git_blob(repo,rev,path)
    if expected:
        assert digest(raw) == expected,path
    return raw


def pins(repo):
    m2 = 'research-ide/mathscope-m2/navier/'
    m3 = 'research-ide/mathscope-m3/navier/'
    checks = {
        m2+'actual-covariance-matrix.mjs': [b'projected=mul(Bleft,sub(mul(Aphi,B),BPrime))',
                                          b'd=G.mul(epsilon,G.pow(k,2),n2)'],
        m2+'actual-common-admissible-family.mjs': [b'E=G.pow(Bnorm,256)', b'universalAnalyticRecipeSourceBound:true'],
        m2+'actual-pulse-gaussian-power-kernel.mjs': [b'coefficientBoundsDerivedHere:false', b'original-envelope-FTC'],
        m3+'source-global-band.mjs': [b'matrix:frame.wMatrix', b'v,t0),t0,G.div(Ls,q(2)),v)'],
        m3+'source-forced-pulse.mjs': [b'G.mul(epsilon,G.pow(k,2),nSquared)',b'G.mul(G.q(m*m),damping)'],
        m3+'source-forced-class-majorants.mjs': [b'q(3),E,c.Lmax', b'actualInverses.length===20',
                                              b'actualInputForcingWClassCertified:false'],
    }
    out = {}
    for path, markers in checks.items():
        raw = read(repo,path)
        assert raw == read(repo,path,rev=PRODUCER_COMMIT),path
        assert all(marker in raw for marker in markers),path
        out[path] = digest(raw)
    return out


def check_ambient(src, nroots, nprime_roots, K, k, eps, squared, A, damping, matrix, m):
    alias = aliases([*nroots,*nprime_roots,*sum(K,[]),k,eps])
    n = [entry(nroots,i,alias) for i in range(3)]
    nprime = [entry(nprime_roots,i,alias) for i in range(3)]
    Kp = [[entry(r,i,alias) for i in range(3)] for r in K]
    n2 = dot(n,n)
    src.exact(squared,n2,aliases=alias)
    d = mul(alias[eps],pow_nat(alias[k],2),n2)
    src.exact(damping,d,aliases=alias)
    normal = [sub(dot(n,r),nprime[j]) for j,r in enumerate(zip(*Kp))]
    for i in range(3):
        for j in range(3):
            p = sub(mul(n[i],normal[j],inv(n2)),Kp[i][j])
            src.exact(A[i][j],p,aliases=alias)
            src.exact(matrix[i][j],sub(p,mul(num(m*m),d)) if i==j else p,aliases=alias)


def check_frame(graph,src,b,fam,system):
    f = fam['frame']
    g, co = b['geometry'], b['coordinates']
    assert system['matrix'] == f['wMatrix'] and system['initial'] == [1,0]
    assert system['variable'] == co['v'] and system['length'] == g['Ls']
    assert system['parameters'] == [co[k] for k in ('R','Z','T','Xrep','etaRep','sRep','ell')]
    assert fam['carrier']['nonzeroAngularInteger'] and fam['system'] == system['covariance']
    # Original undamped ambient operator and the actual damping.
    check_ambient(src,f['n'],f['nPrime'],f['principalK'],g['k'],g['epsilon'],f['nSquared'],
                  f['Aphi'],f['actualDamping'],f['Aphi'],0)
    # Retain every entry of the two-dimensional frame and its left inverse.
    ns = f['n']
    roots = aliases([*ns,*f['nPrime'],f['s'],f['sPrime'],b['frozen']['c0']])
    nr, nth, nz = [roots[i] for i in ns]
    nt = sqrt(add(pow_nat(nth,2),pow_nat(nz,2)))
    sa, ka0, ka1 = (mul(i,inv(nt)) for i in (nr,nth,nz))
    c = mul(roots[b['frozen']['c0']],sqrt(add(num(1),pow_nat(roots[f['s']],2))))
    U = [[num(1),num(0)],[mul(num(-1),sa,ka0),ka1],[mul(num(-1),sa,ka1),mul(num(-1),ka0)]]
    J = [[num(1),num(1)],[c,mul(num(-1),c)]]
    left = matmul([[num('1/2'),mul(num('1/2'),inv(c))],[num('1/2'),mul(num('-1/2'),inv(c))]],
                  [[num(1),num(0),num(0)],[num(0),ka1,mul(num(-1),ka0)]])
    for observed, expected in ((f['B'],matmul(U,J)),(f['Bleft'],left)):
        for i,row in enumerate(observed):
            for j,root in enumerate(row):
                src.exact(root,expected[i][j],aliases=roots)
    nrp,nthp,nzp = [entry(f['nPrime'],i,roots) for i in range(3)]
    ntp = mul(add(mul(nth,nthp),mul(nz,nzp)),inv(nt))
    div_prime = lambda x,xp: sub(mul(xp,inv(nt)),mul(x,ntp,pow_nat(inv(nt),2)))
    sap,ka0p,ka1p = [div_prime(x,xp) for x,xp in ((nr,nrp),(nth,nthp),(nz,nzp))]
    cp = mul(roots[b['frozen']['c0']],roots[f['s']],roots[f['sPrime']],
             inv(sqrt(add(num(1),pow_nat(roots[f['s']],2)))))
    Uprime = [[num(0),num(0)],
              [mul(num(-1),add(mul(sap,ka0),mul(sa,ka0p))),ka1p],
              [mul(num(-1),add(mul(sap,ka1),mul(sa,ka1p))),mul(num(-1),ka0p)]]
    Jprime = [[num(0),num(0)],[cp,mul(num(-1),cp)]]
    Bprime = [[add(x,y) for x,y in zip(a,b)] for a,b in zip(matmul(Uprime,J),matmul(U,Jprime))]
    for i,row in enumerate(f['BPrime']):
        for j,root in enumerate(row):
            src.exact(root,Bprime[i][j],aliases=roots)
    # Derivatives of the retained B need not be expanded into source
    # primitives for this check of the exact Bleft*(Aphi*B-Bprime) operation.
    roots = aliases([i for name in ('Aphi','B','BPrime','Bleft') for row in f[name] for i in row])
    a,bmat,bprime,bleft = [[[entry(row,i,roots) for i in range(len(row))] for row in f[key]]
                          for key in ('Aphi','B','BPrime','Bleft')]
    ab = matmul(a,bmat)
    projected = matmul(bleft,[[sub(x,y) for x,y in zip(u,v)] for u,v in zip(ab,bprime)])
    for i,row in enumerate(f['projected']):
        for j,r in enumerate(row):
            src.exact(r,projected[i][j],aliases=roots)
    lam,dref,d = f['reference']['lambda'],f['reference']['dref'],f['actualDamping']
    L, v, u, s, lam0 = [atom('source',i) for i in (g['Ls'],co['v'],b['constants']['u'],f['s'],b['frozen']['lambda0'])]
    sign = num(fam['sign'])
    common = dict(zip((g['Ls'],co['v'],b['constants']['u'],b['frozen']['lambda0']),(L,v,u,lam0)))
    src.exact(f['s'],mul(sign,u,add(num('1/2'),mul(v,inv(L)))),aliases=common)
    src.exact(f['sPrime'],mul(sign,u,inv(L)),aliases=common)
    common[f['s']] = s
    src.exact(lam,mul(lam0,inv(sqrt(add(num(1),pow_nat(s,2))))),aliases=common)
    src.exact(dref,mul(lam0,add(num(1),pow_nat(s,2)),
                       inv(pow_nat(sqrt(add(num(1),pow_nat(u,2))),3))),aliases=common)
    roots = aliases([*sum(f['projected'],[]),lam,dref,d])
    for i in range(2):
        for j in range(2):
            p = roots[f['projected'][i][j]]
            diag = mul(num(1-2*i),roots[lam]) if i==j else num(0)
            src.exact(f['projectedError'][i][j],sub(p,diag),aliases=roots)
            src.exact(f['wMatrix'][i][j],sub(p,add(roots[lam],sub(roots[d],roots[dref]))) if i==j else p,aliases=roots)
    assert graph.op(fam['P'],'exp') == [fam['logP']]
    integral,time,left,right = graph.op(fam['logP'],'definite_integral')
    assert right == co['v']
    src.exact(left,mul(num('1/2'),atom('Ls')),aliases={g['Ls']:atom('Ls')})
    return {'sign':fam['sign'],'normal':ns,'ambient':f['Aphi'],'damping':d,'B':f['B'],
            'BPrime':f['BPrime'],'Bleft':f['Bleft'],'projected':f['projected'],'normalized':f['wMatrix'],
            'lambda':lam,'dref':dref,'P':fam['P'],'envelopeIntegral':integral,'envelopeTime':time}


def shifted_src(graph,renames,anchors=()):
    """Arithmetic DAG fingerprints after simultaneous source substitution.

    A native record's system id and integer orders are retained verbatim.
    The relevant normal and cylindrical K operands have no bound integrals.
    """
    @cache
    def walk(i):
        if i in renames:
            return actual(renames[i])
        if i < 622791 or i in anchors:
            return f'original-node-{i}'
        op,args = graph.node(i)
        if op in ('rational','coordinate','source_parameter'):
            kids = args
        elif op in ('add','multiply','maximum'):
            kids = sorted(walk(x) for x in args)
        elif op == 'actual_expression_partial':
            system,values,orders = args
            kids = [system,[walk(x) for x in values],orders]
        elif op == 'actual_monotone_root':
            index,*values = args
            kids = [index,*[walk(x) for x in values]]
        elif op in ('integer_power','source_step_derivative'):
            kids = [walk(args[0]),args[1]]
        elif op == 'definite_integral':
            body,time,left,right = args
            assert time not in renames
            kids = [walk(body),actual(time),walk(left),walk(right)]
        elif op in ('exp','inverse','sqrt_positive','log_positive','ceiling','sine','cosine','smooth_piecewise'):
            kids = [walk(x) for x in args]
        else:
            raise ValueError((i,op,args))
        return digest(json.dumps([op,kids],separators=(',',':')).encode())

    actual = shifted_src(graph,{},anchors) if renames else walk
    return walk


def actual_systems(graph,src,b,rep,templates,forced,bound):
    fs = {f['sign']:f for f in b['families']}
    co = b['coordinates']
    fixed = {co[field]:rep[name] for field,name in (('Xrep','X'),('etaRep','eta'),('sRep','s'))}
    results = []
    for row in bound:
        raw, = [f for f in templates[row['key']]['forced'] if f['m']==row['mode']]
        system = forced[row['system']]
        w,m = system['variable'],row['mode']
        delta = raw['inverse']['input']['variable']-w
        assert 0 <= delta <= 5000
        old = raw['inverse']
        # Only late inverse operands use the address translation. Every
        # translated root is independently checked by its actual arithmetic.
        mapped = lambda i: i-delta if i>=old['input']['variable'] else i
        matrix = [[mapped(i) for i in r] for r in old['matrix']]
        assert system['matrix'] == matrix and system['length'] == b['geometry']['Ls']
        K = old['K']
        n = [mapped(i) for i in old['normal']['value']]
        nprime = [mapped(i) for i in old['normal']['derivative']]
        a = [[mapped(i) for i in r] for r in old['Aphi']]
        d = mapped(old['damping'])
        n2 = mapped(old['normal']['squared'])
        check_ambient(src,n,nprime,K,old['k'],old['epsilon'],n2,a,d,matrix,m)
        source = fs[row['sign']]['frame']
        translated = shifted_src(graph,{**fixed,co['v']:w},tuple(fixed.values()))
        actual = shifted_src(graph,{},tuple(fixed.values()))
        assert all(translated(i)==actual(j) for i,j in zip(sum(source['principalK'],[]),sum(K,[])))
        assert all(translated(i)==actual(j) for i,j in zip(source['n'],n)),(row['key'],m)
        assert all(translated(i)==actual(j) for i,j in zip(source['nPrime'],nprime)),(row['key'],m)
        results.append({'key':row['key'],'mode':m,'system':row['system'],'w':w,'normal':n,'normalPrime':nprime,
                        'K':K,'damping':d,'ambientUndamped':a,'ambientMatrix':matrix})
    return results


def negative_controls(graph,src,b,instances,exploratory_rep):
    first = instances[0]
    f = b['families'][0]['frame']
    g, co = b['geometry'], b['coordinates']
    n = first['normal']
    mode = first['mode']
    changed = shifted_src(graph,{co['Xrep']:exploratory_rep['X'],co['etaRep']:exploratory_rep['eta'],
                                 co['sRep']:exploratory_rep['s'],co['v']:first['w']})
    actual = shifted_src(graph,{})
    assert any(changed(x)!=actual(y) for x,y in zip(f['n'],n))
    alias = aliases([first['damping'],first['ambientUndamped'][0][0]])
    norm = sub(alias[first['ambientUndamped'][0][0]],mul(num(mode*mode),alias[first['damping']]))
    src.exact(first['ambientMatrix'][0][0],norm,aliases=alias)
    wrong = sub(alias[first['ambientUndamped'][0][0]],mul(num((mode+1)**2),alias[first['damping']]))
    assert src.normalize(first['ambientMatrix'][0][0],aliases=alias) != wrong
    for m, multiplier in ((3,8),(4,15)):
        assert sub(mul(num(-m*m),alias[first['damping']]),mul(num(-1),alias[first['damping']])) == \
               mul(num(-multiplier),alias[first['damping']])
    return ['exploratory representative used for the actual Forced source',
            'wrong harmonic square in the actual matrix']


def main(args):
    source_pins = pins(args.repo)
    band_archive = json.loads(read(args.repo,BAND,BAND_SHA))
    current = json.loads(read(args.repo,CURRENT,CURRENT_SHA))['source']
    common = json.loads(read(args.repo,COMMON,COMMON_SHA))
    stable = json.loads(read(args.repo,STABLE))
    assert stable['independentChecks']==426 and not stable['actualPrivateForcedClassAttachmentExecuted']
    b = current['sourceBand']
    assert b['bounds']['primitive'] == common['uniformCovariance']['primitiveProof']
    assert all(row['frozenRepresentativeRoots']==current['sourceRepresentative']['roots']
               for row in current['local']['rows'])
    assert [f['frame']['wMatrix'] for f in b['families']] == [
        f['frame']['wMatrix'] for f in band_archive['band']['families']]
    assert common['uniformCovariance']['universalAnalyticRecipeSourceBound']
    assert common['scope']['actualUniformAllBandC2AndFiniteCm']
    assert not common['scope']['literalAllBandsExecuted']
    c,g = b['constants'],b['geometry']
    original = pinned_json(args.graph_dir/'original-source-functions.json',REGISTRY_SHA)
    _,_,_,forced,_ = json.loads(original['definitions'])
    primary = json.loads(original['base']['base']['m3GlobalPulses'])
    templates = {r['key']:r for r in checkpoint_record(args.repo)['templates']}
    bound = pinned_json(HERE.parent/'flat'/'forced-principal-cutoffs.json',FORCED_SHA)['bindings']
    with TemporaryFile() as backing:
        graph = Archive(args.graph_dir/'original-source-nodes.jsonl.gz',backing)
        src = Source(Nodes(graph))
        assert graph.op(c['E'],'integer_power') == [c['Bnorm'],256]
        assert set(graph.op(c['Lmax'],'multiply')) == {g['Tg'],c['Lmin']}
        assert g['lengthRatioBounds'] == [c['Lmin'],c['Lmax']]
        frames = [check_frame(graph,src,b,f,primary[f['system']]) for f in b['families']]
        v = b['coordinates']['v']
        for f in frames:
            orig_lam = shifted_src(graph,{v:f['envelopeTime']})(f['lambda'])
            orig_dref = shifted_src(graph,{v:f['envelopeTime']})(f['dref'])
            actual = shifted_src(graph,{})
            terms = graph.op(f['envelopeIntegral'],'add')
            pos, neg = next((p,n) for p,n in (terms,terms[::-1]) if actual(p)==orig_lam)
            minus = graph.op(neg,'multiply')
            assert any(actual(i)==orig_dref and src.number(j)==-1 for i,j in (minus,minus[::-1]))
        instances = actual_systems(graph,src,b,current['sourceRepresentative']['roots'],templates,forced,bound)
        controls = negative_controls(graph,src,b,instances,band_archive['representative']['roots'])
    assert len(instances) == 20
    receipt = {'schema':'MathScope.ActualTangentFrameForwardPropagator/1','sourceCommit':PRODUCER_COMMIT,
               'sourcePins':source_pins,'paperCandidateSHA256':PAPER_SHA,'paperCandidateExactUploadedBytes':'OPEN',
               'sourceGraphSHA256':GRAPH_SHA,'registrySHA256':REGISTRY_SHA,'forcedCheckpointSHA256':CHECKPOINT_SHA,
               'originalBandReceiptSHA256':BAND_SHA,'actualCurrentReceiptSHA256':CURRENT_SHA,
               'commonFamilyC4ReceiptSHA256':COMMON_SHA,
               'verified':{'modes':[3,4],'additionalDampingMultipliers':[8,15],
                           'modeOneConstants':{k:c[k] for k in ('Bnorm','E','Lmax','qStar','ell0')},
                           'length':g['Ls'],'frameReceipts':frames,'archivedModeOneTwoInstances':instances,
                           'bound':'||V_m(v,u)||_infinity <= exp(3*Bnorm^256*Lmax)*P(v)/P(u)',
                           'scope':'Forward 2x2 moving tangent frame, original source inequalities and fixed representative. All nonzero integer modes obey the value bound.'},
               'negativeControlsRejected':controls,
               'conditional':'For actual m=3,4 use the same n,K,k,epsilon, pulse length, representative, and complete W_alpha input hypotheses; parameter differentiation retains m^2 factors in coefficient bounds.',
               'open':['New registered mode-3/4 instances, corresponding exact rebuilt input sources, W_alpha seminorms, and whole second-stage closure.']}
    args.output.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    print(f"PASS {len(frames)} actual stable frame systems, {len(instances)} archived ambient inverse bindings, {len(controls)} negative controls")
    print(f'{digest(args.output.read_bytes())}  {args.output.name}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for flag in ('repo','graph-dir','output'):
        parser.add_argument('--'+flag,type=Path,required=True)
    main(parser.parse_args())
