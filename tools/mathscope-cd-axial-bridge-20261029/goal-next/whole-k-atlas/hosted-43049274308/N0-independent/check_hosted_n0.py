"""Verify the exact GitHub Actions 43049274308 N0 current/pressure export."""

from argparse import ArgumentParser
from array import array
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
from zipfile import ZipFile
import gzip
import json
import subprocess


ORIGINAL = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
EXECUTING = 'fbad12e9331c63b45da8292601a2b0fb6f54731e'
PR30 = 'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60'
RECEIPT_SHA = 'b225762c17ce0ca4e08952051b64197860fb198d67a87474eb187d09f5f05fe3'
MANIFEST_SHA = '0ca408b2030913a204707e4bfc2bcdb6f95e85d518459d84f6b7cfc8965b180b'
STREAM_SHA = '635d24c20d71fa94fa51aafce813f10a9059c7d3f985c8c210c33b4ffff85ca3'
REGISTRY_SHA = '132edc7a71fe43ea25fe79f914ffd2cf3d3c40bd510149d9bf197e52e9470b13'
COMPRESSED_SHA = '4b742952975e3fd21031c01899e8b49b62fd8d5504a66ca9b1e5c7eb8d89724d'
ZIP_SHA = '83f02c00e2f6dec890a725c740910d5bb48b3c4b9cc153c4f20595e58ed8a4f5'
NODES = 983154
ROOTS = {'pressure': 642822, 'radialPressureGradient': 642836, 'axialPressureGradient': 642842,
         'radialResidual': 642878, 'angularResidual': 642861, 'axialResidual': 642876,
         'axialStress': 633743, 'referenceTime': 622825, 'omittedScaleTimesTime': 634036,
         'selectorScales': [617466, 617515]}
BASE_COUNTS = {'quadratic': 3, 'monotone': 3, 'picard': 6, 'expression': 788,
               'm3GlobalPulses': 2, 'm3GlobalCoefficients': 16, 'm3GlobalBlocks': 16, 'm3GlobalFields': 6}
PARTS = ('rr', 'rtheta', 'rz', 'thetatheta', 'thetaz', 'zz')


def pinned(path, expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected, path
    return json.loads(data)


def nat(value):
    return type(value) is int and value >= 0


def roots(values, limit=NODES):
    assert all(nat(i) and i < limit for i in values), (values, limit)


def check_registry(raw):
    base = {k: json.loads(v) for k, v in raw['base'].items() if isinstance(v, str)}
    assert {k: len(base[k]) for k in BASE_COUNTS} == BASE_COUNTS
    count_keys = ('quadraticCount', 'monotoneCount', 'picardCount', 'expressionCount',
                  'm3GlobalPulseCount', 'm3GlobalCoefficientCount', 'm3GlobalBlockCount', 'm3GlobalFieldCount')
    assert list(map(raw['base'].get, count_keys)) == list(BASE_COUNTS.values())
    assert set(base['fixed']) == {'source', 'core', 'pressure', 'outer', 'naturalKernel'}
    source = base['fixed']['source']
    assert source['sourcePaperSHA256'] == '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
    assert source['parametersExactExpressions']['h'] == {'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
    aux_expr, aux_fields, inverse = (json.loads(raw[k]) for k in ('expressionDefinitions', 'fieldDefinitions', 'inverseDefinitions'))
    assert [raw[k] for k in ('expressions', 'fields', 'inverses', 'maximumOrder')] == [12, 6, 0, 16]
    assert [len(x) for x in (aux_expr, aux_fields, inverse)] == [12, 6, 0]
    for row in [*base['expression'], *aux_expr]:
        roots([row['body'], *row['parameters']])
        assert len(set(row['parameters'])) == len(row['parameters']) == len(row['derivativeLimits'])
        assert all(nat(x) for x in row['derivativeLimits'])
    for row in base['monotone']:
        roots([row[k] for k in ('body','variable','left','right','derivativeLower','derivativeUpper')] + row['parameters'])
    for kind, defs, count, prefix in (('global', base['m3GlobalFields'], 81, 'GlobalFullMean_'),
                                      ('aux', aux_fields, 162, 'GlobalCompleteCommonTorus_')):
        assert [x['name'] for x in defs] == [prefix+s for s in PARTS]
        for f in defs:
            assert len(f['rows']) == count
            roots([*f['parameters'], *f['directions']])
            assert [f['parameters'][j] for j in f['directionParameterIndices']] == f['directions']
            for row in f['rows']:
                j = row['localSystem']
                definitions = base['expression'] if j >= 0 else aux_expr
                index = j if j >= 0 else -j-1
                assert nat(index) and index < len(definitions)
                local = definitions[index]
                assert row['localBody'] == local['body'] and row['localParameters'] == local['parameters']
                assert len(row['values']) == len(local['parameters'])
                roots([row['coefficient'], *row['values'], *(i for g in row['guards'] for i in g)])
                if kind == 'aux':
                    assert len(row['derivativeMaps']) == len(f['directions'])
                    roots(term['coefficient'] for group in row['derivativeMaps'] for term in group)
                else:
                    roots(row['derivativeScales'])
    covariance = {}
    for p in base['m3GlobalPulses']:
        d = json.loads(p['originalDefinition'])
        assert all(d[key] == p[key] for key in ('variable','parameters','matrix','initial','length'))
        roots([d['variable'], d['length'], *d['parameters'], *d['initial'], *(i for row in d['matrix'] for i in row)])
        covariance[p['covariance']] = d
    assert len(covariance) == 2
    return base, aux_expr, aux_fields, covariance


class Graph:
    def __init__(self, file, backing, manifest, registry):
        self.backing = backing
        self.offsets = array('Q')
        self.coords = set()
        self.native = Counter()
        self.natural_names = Counter()
        self.time_cutoff_apps = 0
        base, aux_expr, aux_fields, self.covariance = registry
        self.base = base
        self.functions = {'actual_expression_partial': base['expression'], 'm3_aux_expression_partial': aux_expr,
                          'm3_aux_indexed_partial': aux_fields, 'm3_global_indexed_partial': base['m3GlobalFields']}
        self.histogram = Counter()
        digest, size = sha256(), 0
        with gzip.open(file, 'rb') as stream:
            header = stream.readline()
            assert json.loads(header) == {'schema': 'MathScope.M3.FullNodesJSONL/1', 'node_count': NODES}
            digest.update(header)
            size += len(header)
            for index, line in enumerate(stream):
                self.offsets.append(backing.tell())
                assert line.endswith(b'\n')
                backing.write(line)
                digest.update(line)
                size += len(line)
                record = json.loads(line)
                assert set(record) == {'op','args'}
                op, args = record['op'], record['args']
                assert isinstance(args, list)
                self.histogram[op] += 1
                self.validate_node(index, op, args)
        assert len(self.offsets) == NODES and size == manifest['node_stream_uncompressed_bytes'] == 44683005
        assert digest.hexdigest() == manifest['node_stream_sha256'] == STREAM_SHA
        assert self.histogram == manifest['operation_histogram']
        assert self.time_cutoff_apps == 0

    def validate_node(self, i, op, a):
        if op in ('coordinate','source_parameter'):
            assert len(a) == 1 and isinstance(a[0], str) and a[0]
            if op == 'coordinate':
                self.coords.add(i)
            return
        if op == 'rational':
            assert len(a) == 2 and all(isinstance(x,str) for x in a) and int(a[1]) > 0
            Fraction(int(a[0]), int(a[1]))
            return
        if op in ('add','multiply','maximum','smooth_piecewise'):
            assert (len(a) >= 1 if op != 'smooth_piecewise' else len(a) == 6), (i, op, a)
            refs = a
        elif op in ('inverse','exp','log_positive','sqrt_positive','sine','cosine','ceiling'):
            assert len(a) == 1
            refs = a
        elif op in ('integer_power','source_step_derivative'):
            assert len(a) == 2 and type(a[1]) is int and (op == 'integer_power' or a[1] >= 0)
            refs = a[:1]
        elif op == 'definite_integral':
            assert len(a) == 4 and a[1] in self.coords
            refs = a
        elif op in self.functions:
            key, refs, orders = a
            index = -key-1 if op == 'm3_aux_expression_partial' else key
            assert nat(index) and index < len(self.functions[op])
            d = self.functions[op][index]
            assert len(refs) == len(d['parameters'])
            assert len(orders) == len(d.get('directions',d['parameters'])) and all(nat(v) for v in orders)
            if 'derivativeLimits' in d:
                assert all(x <= y for x,y in zip(orders,d['derivativeLimits'],strict=True))
            if op == 'actual_expression_partial' and index == 680:
                self.time_cutoff_apps += 1
            self.native[op] += 1
        elif op in ('m3_global_pulse_jet','actual_covariance_volterra'):
            key, component, time, actual = a[:4]
            if op == 'm3_global_pulse_jet':
                assert len(a) == 5 and nat(key) and key < len(self.base['m3GlobalPulses'])
                d = self.base['m3GlobalPulses'][key]
                assert len(a[4]) == len(d['directions']) and all(nat(x) for x in a[4])
            else:
                assert len(a) == 4 and key in self.covariance
                d = self.covariance[key]
            assert nat(component) and component < len(d['initial']) and len(actual) == len(d['parameters'])
            refs = [time, *actual]
            self.native[op] += 1
        elif op == 'actual_monotone_root':
            key, *refs = a
            assert nat(key) and key < len(self.base['monotone']) and len(refs) == len(self.base['monotone'][key]['parameters'])
            self.native[op] += 1
        elif op == 'actual_quadratic_root':
            key, component, eta = a
            assert nat(key) and key < len(self.base['quadratic']) and nat(component) and component < len(self.base['quadratic'][key]['rhs'])
            refs = [eta]
            self.native[op] += 1
        elif op in ('actual_background_picard','actual_background_even_profile'):
            assert len(a) == (5 if op == 'actual_background_picard' else 6)
            assert nat(a[0]) and a[0] < len(self.base['picard']) and nat(a[1])
            assert all(nat(x) for x in a[4:])
            refs = a[2:4]
            self.native[op] += 1
        elif op == 'actual_natural_series':
            assert len(a) == 5 and isinstance(a[0],str) and all(nat(x) for x in a[3:])
            refs = a[1:3]
            self.natural_names[a[0]] += 1
        else:
            raise ValueError((i, op))
        roots(refs, i)

    def node(self, i):
        self.backing.seek(self.offsets[i])
        value = json.loads(self.backing.readline())
        return value['op'], value['args']

    def args(self, i, op):
        actual, args = self.node(i)
        assert op == actual, (i, op, actual, args)
        return args

    def number(self, i):
        return Fraction(*map(int, self.args(i,'rational')))


def check_selector(g, s):
    r1, r2 = s['rows']
    assert s['activeBackgroundRows'] == [] and s['originalPrefix'] == 3
    assert (s['familyRequest']['throughOrder'],s['familyRequest']['derivativeOrder']) == (2,3)
    assert len(s['sourceBandChecks']) == 16 and all(c['pass'] is True for c in s['sourceBandChecks'])
    assert (s['commonEllMinimum'],s['commonEll0']) == (617432,617433)
    assert g.args(617432,'ceiling') == [617431]
    six, minimum = g.args(617433,'add')
    assert minimum == 617432 and g.number(six) == 6
    assert g.args(127,'log_positive') == [24] and g.number(24) == 2 and g.number(20) == -1
    assert g.node(9) == ('source_parameter',['h'])
    assert g.args(r1['smallBand'],'multiply') == [127,617463]
    ten, ell_min = g.args(617463,'add')
    assert g.number(ten) == 10 and ell_min == 617432
    assert r1['growth'] == 127 and r2['smallBand'] == 0 and g.number(0) == 0
    predecessor, growth = g.args(r2['growth'],'add')
    [sixteen] = g.args(growth,'log_positive')
    assert predecessor == r1['logScale'] and g.number(sixteen) == 16
    kinds = ['velocity-potential-physical','pressure-stress-physical','normalized-pressure',
             'first-stress-direct-zeta-with-endpoint-pole']
    count = 0
    for n, (row, old) in enumerate(zip(s['rows'],s['historicalRows'],strict=True),1):
        assert row['order'] == old['order'] == n
        assert row['previousLogScale'] == (0 if n == 1 else r1['logScale'])
        assert (row['historicalScale'],row['historicalLogScale'],row['sourceCoefficientRoots']) == (old['scale'],old['logScale'],old['sourceCoefficientRoots'])
        roots(row['sourceCoefficientRoots'].values())
        assert g.args(old['scale'],'exp') == [old['logScale']]
        assert g.args(row['scale'],'exp') == [row['logScale']]
        constraints = row['constraints']
        assert len(constraints) == (8 if n == 1 else 15)
        assert Counter(c['derivativeOrder'] for c in constraints) == {m:len(constraints)//(n+1) for m in range(n+1)}
        if n == 1:
            assert [c['kind'] for c in constraints] == kinds*2
            assert [c['pole'] for c in constraints if 'pole' in c] == [3,6]
        else:
            expected = kinds[:3] + ['higher-stress-quotient-by-zeta','higher-stress-direct-zeta']
            assert [c['kind'] for c in constraints] == expected*3 and all('pole' not in c for c in constraints)
        assert g.args(row['logScale'],'maximum') == [row['historicalLogScale'],row['growth'],row['smallBand'],*(c['requiredLog'] for c in constraints)]
        for c in constraints:
            inv, numerator = g.args(c['requiredLog'],'multiply')
            [denominator] = g.args(inv,'inverse')
            linear, log_bound = g.args(numerator,'add')
            assert g.args(log_bound,'log_positive') == [c['bound']]
            if n == 1:
                assert (linear,denominator) == (127,9)
            else:
                assert sorted(g.args(linear,'multiply')) == [24,127] and sorted(g.args(denominator,'multiply')) == [9,24]
            count += 1
    w = s['window']
    assert w['coefficientOrder'] == 0 and w['coefficientRows'] == [] and w['exactTail']['firstOmitted'] == 1
    assert w['nextSourceScale'] == r1['scale'] and w['nextSourceLogScale'] == r1['logScale']
    assert w['domain'] == {'ell':'integer','bounds':[617433,622785],'qOverQ':['1/2','2'],'mayBeEmpty':True}
    assert w['membershipProofStillRequiredForAnInstance'] and not w['sourceAuthenticated']
    assert g.args(w['upper'],'add') == [20,622784] and g.args(622784,'multiply') == [20,622783]
    assert g.args(622783,'ceiling') == [622782] and g.args(622782,'multiply') == [20,622781]
    assert g.args(622781,'multiply') == [r1['logScale'],617517] and g.args(617517,'inverse') == [127]
    assert g.node(w['ell']) == ('coordinate',['N6_global_frozen_integer_band_N0$30434'])
    assert g.args(w['Q'],'exp') == [622788] and g.args(622788,'multiply') == [20,622787]
    assert g.args(622787,'multiply') == [127,w['ell']] and g.args(ROOTS['referenceTime'],'multiply') == [w['Q'],622815]
    assert g.node(622815) == ('actual_monotone_root',[2,622798,622799])
    assert g.base['monotone'][2]['name'] == 'ActualCommonBandSlowInverse'
    assert g.args(634035,'exp') == [634034] and g.args(634034,'multiply') == [20,634033]
    assert g.args(634033,'multiply') == [127,634032] and g.args(634032,'add') == [474,617433] and g.number(474) == 4
    assert g.args(ROOTS['omittedScaleTimesTime'],'multiply') == [r1['scale'],ROOTS['referenceTime']]
    time_cutoff=g.base['expression'][680]
    assert time_cutoff['name'] == 'CommonOriginalTimeCutoff' and time_cutoff['parameters'] == [622826]
    x, lo, hi, left, branch, right = g.args(time_cutoff['body'],'smooth_piecewise')
    assert x == 622826 and [g.number(k) for k in (lo,hi,left,right)] == [Fraction(1,2),1,1,0]
    return {'actualConstraintsReplayed': count, 'activeBackgroundOrders': [], 'firstOmittedOrder': 1,
            'b1':617466, 'b2':617515, 'ellMinimum':617432, 'ell0':617433,
            'windowUpper':622785, 'referenceScaleQ':622789, 'qGlobalStar':634035,
            'literalCutoffBody': time_cutoff['body'], 'N0ActualCommonCutoffApplications':0}


def check_pressure_roots(g):
    # Both retained shifted integrals use one binder and one integrand.
    assert g.args(642822,'add') == [642275,642821]
    assert g.args(642821,'multiply') == [20,642820] and g.args(642820,'multiply') == [633699,642276]
    assert g.args(642275,'definite_integral') == [642274,642103,633676,622797]
    assert g.args(642276,'definite_integral') == [642274,642103,633676,633678]
    assert g.args(642823,'multiply') == [633727,642276]
    assert g.args(642836,'add') == [642831,642835]
    assert g.args(642831,'add') == [642828,642830] and g.args(642830,'add') == [642826,642829]
    assert g.args(642829,'add') == [642081,642825] and g.args(642826,'multiply') == [20,642823]
    assert g.args(642825,'multiply') == [20,642824] and g.args(642824,'multiply') == [634053,642551]
    assert g.args(642828,'multiply') == [642552,642827] and g.args(642827,'multiply') == [633699,634053]
    assert g.args(642835,'multiply') == [634053,642834] and g.args(642834,'add') == [642551,642833]
    assert g.args(642833,'multiply') == [20,642832] and g.args(642832,'multiply') == [633699,642552]
    assert g.args(642878,'add') == [642836,642877] and g.args(642877,'multiply') == [20,642027]
    assert g.args(642081,'add') == [633715,642027]
    assert g.args(633715,'multiply') == [20,633714] and g.args(633714,'multiply') == [633692,633713]
    # The two radial shift pairs above cancel exactly by commutativity.
    assert g.args(642842,'add') == [642839,642841]
    assert g.args(642839,'add') == [642799,642838] and g.args(642838,'multiply') == [20,642837]
    assert g.args(642837,'multiply') == [633827,642276]
    assert g.args(642841,'multiply') == [20,642840] and g.args(642840,'multiply') == [633699,642800]
    assert g.args(642799,'definite_integral') == [642798,642588,633676,622797]
    assert g.args(642800,'definite_integral') == [642798,642588,633676,633678]
    assert g.args(642861,'add') == [633759,642860] and g.args(642876,'add') == [633842,642875]
    assert g.args(642875,'add') == [642873,642874] and g.args(642873,'multiply') == [622793,642842]
    assert g.args(633743,'multiply') == [623753,633729]
    return {'heldRadialBounds':[633676,633678], 'originalShiftedPressureIntegrals':[642275,642276],
            'actualRemainderA0':642823, 'actualRho':633692, 'actualP':633713, 'actualGr':642027,
            'directRadialIdentity':'D_r p=(g_r-rho*P)-A0',
            'directRadialResidual':'-rho*P-A0', 'actualAxialPressureMultiplier':622793,
            'rawResidualRoots':[642878,642861,642876]}


def git_hash(repo, revision, path):
    return sha256(subprocess.check_output(['git','-c','core.longpaths=true','-C',str(repo),'show',f'{revision}:{path}'])).hexdigest()


def check_github(folder, run_path, artifacts_path, zip_path):
    run_raw, artifacts_raw = run_path.read_bytes(), artifacts_path.read_bytes()
    run = json.loads(run_raw)
    assert (run['databaseId'],run['headSha'],run['status'],run['conclusion']) == (43049274308,EXECUTING,'completed','failure')
    jobs = {j['name'].split(' (')[-1][:-1]:j for j in run['jobs']}
    assert {n:(j['databaseId'],j['conclusion']) for n,j in jobs.items()} == {
        '0':(130621621202,'success'),'3':(130621620982,'failure'),'4':(130621620752,'failure')}
    [metadata] = [r for r in json.loads(artifacts_raw) if r['name'] == 'mathscope-whole-k-N0']
    assert (metadata['id'],metadata['digest'],metadata['size_in_bytes']) == (13869266481,'sha256:'+ZIP_SHA,5867233)
    assert zip_path.stat().st_size == metadata['size_in_bytes'] and sha256(zip_path.read_bytes()).hexdigest() == ZIP_SHA
    members = {'original-whole-k-prefix.json':RECEIPT_SHA}
    prefix = 'original-whole-k-current-pressure-graph/'
    members.update({prefix+'original-source-export-manifest.json':MANIFEST_SHA,
                    prefix+'original-source-functions.json':REGISTRY_SHA,
                    prefix+'original-source-nodes.jsonl.gz':COMPRESSED_SHA})
    with ZipFile(zip_path) as archive:
        assert len(archive.namelist()) == len(members) and set(archive.namelist()) == set(members)
        for member,digest in members.items():
            assert sha256(archive.read(member)).hexdigest() == sha256((folder/member).read_bytes()).hexdigest() == digest
    return {'workflowConclusion':run['conclusion'], 'n0Job':jobs['0'], 'n0Artifact':metadata,
            'runMetadataSHA256':sha256(run_raw).hexdigest(), 'artifactMetadataSHA256':sha256(artifacts_raw).hexdigest(),
            'allArchiveMembersMatchLocalExtraction':True}


def main():
    parser=ArgumentParser(description=__doc__)
    for key in ('repo','artifact','out'):
        parser.add_argument('--'+key,type=Path,required=True)
    here=Path(__file__).resolve().parent
    parser.add_argument('--github-run',type=Path,default=here/'hosted-n0-github-run.json')
    parser.add_argument('--github-artifacts',type=Path,default=here/'hosted-n0-github-artifacts.json')
    parser.add_argument('--github-zip',type=Path,default=here/'hosted-n0-artifact.zip')
    a=parser.parse_args()
    r=pinned(a.artifact/'original-whole-k-prefix.json',RECEIPT_SHA)
    folder=a.artifact/'original-whole-k-current-pressure-graph'
    m=pinned(folder/'original-source-export-manifest.json',MANIFEST_SHA)
    raw=pinned(folder/'original-source-functions.json',REGISTRY_SHA)
    assert r['snapshot']==m and r['schema']=='MathScope.M3.OriginalWholeKHigherPrefix/1'
    assert (r['sourceCommit'],r['executingCommit'],r['requestedPrefix'],r['currentStage'])==(ORIGINAL,EXECUTING,0,'COMPLETE')
    assert (m['executing_commit'],m['original_pr30_commit'],m['scope'])==(EXECUTING,PR30,'ORIGINAL_WHOLE_K_N0_CURRENT_PRESSURE_PREFIX')
    assert m['function_registry_capture_kind']=='RAW_BASE_ONLY' and not m['extended_coupled_registry_included']
    assert m['extended_coupled_function_counts'] is None and m['node_count']==NODES and m['definitions_sha256']==REGISTRY_SHA
    assert r['finalJets']==m['actual_final_67_jets_certified']==0 and r['release']==m['release']=='HOLD'
    assert not m['final_all_cycle_A_b_p'] and not m['all_order_math_proved'] and m['exact_source_node_stream_preserved']
    assert [(x['name'],x['nodes']) for x in r['stages']]==[('sealed-original-band',623824),('sealed-original-representative',623922),('sealed-original-current',634037),('sealed-original-pressure',NODES)]
    s=r['scope']
    assert s['roots']==ROOTS and m['original_root_ids']==[*list(ROOTS.values())[:-1],*ROOTS['selectorScales']]
    assert s['originalCurrentPressurePrivateSeals'] and s['candidateBoxes']==81
    assert all(s[k] is False for k in ('instantiatedAllPhysicalCells','nativeReachableNaturalSeriesRangeAudited','completeAllCycleFinalField'))
    d=s['exactPrefixDomain']
    assert d['prefixOrder']==0 and (d['q'],d['qGlobalStar'],d['nextScale'],d['nextScaleTimesQ'])==(622825,634035,617466,634036)
    assert d['conditions']==['0<q<qGlobalStar','b_(N+1)*q>=1']
    assert d['prefixSharedByAllCoverLabels'] and d['prefixSharedByWholeRadialIntegral']
    assert not d['commonSequenceReplaced'] and not d['oneFinitePrefixClaimedValidAtAllQ']
    github=check_github(a.artifact,a.github_run,a.github_artifacts,a.github_zip)
    registry=check_registry(raw)
    assert registry[0]['fixed']['source']['parameterExpressionSHA256']==r['selector']['sourceFamilySHA256']
    node_file=folder/'original-source-nodes.jsonl.gz'
    assert sha256(node_file.read_bytes()).hexdigest()==COMPRESSED_SHA
    with TemporaryFile() as backing:
        g=Graph(node_file,backing,m,registry)
        selector=check_selector(g,r['selector'])
        pressure=check_pressure_roots(g)
    files={'workflow':'.github/workflows/mathscope-original-whole-k-prefix.yml',
           'runner':'tools/mathscope-cd-axial-bridge-20261029/goal-next/whole-k-atlas/replay_original_whole_k_prefix.mjs'}
    file_hashes={k:git_hash(a.repo,EXECUTING,v) for k,v in files.items()}
    for v in ('global-source-index','source-global-band','source-global-current','source-global-pressure'):
        file_hashes[v]=git_hash(a.repo,ORIGINAL,'research-ide/mathscope-m3/navier/'+v+'.mjs')
    v='actual-common-admissible-family'
    file_hashes[v]=git_hash(a.repo,ORIGINAL,'research-ide/mathscope-m2/navier/'+v+'.mjs')
    out={'schema':'MathScope.N7.IndependentHostedWholeKN0/1','githubRun':43049274308,
         'githubReplay':github,
         'sourceCommit':ORIGINAL,'executingCommit':EXECUTING,'inputSHA256':{'runReceipt':RECEIPT_SHA,
         'manifest':MANIFEST_SHA,'nodeStream':STREAM_SHA,'nodeStreamGzip':COMPRESSED_SHA,'registry':REGISTRY_SHA},'pinnedSourceFileSHA256':file_hashes,
         'nodeCount':NODES,'uncompressedBytes':m['node_stream_uncompressed_bytes'],'operationHistogram':dict(g.histogram),
         'nativeApplicationsChecked':dict(g.native),'naturalSeriesOpcodeCountByKind':dict(g.natural_names),
         'registryCounts':{**BASE_COUNTS,'auxExpressions':12,'auxFields':6,'auxInverses':0},
         'registryRows':{'globalPerComponent':81,'auxiliaryPerComponent':162},
         'selector':selector,'roots':ROOTS,'pressureReplay':pressure,
         'scope':{'candidateBoxes':81,'activeBackgroundOrder':0,'actualAdmittedInstanceWitness':False,
                  'abstractIntegerWindowAtLeastFourLabels':True,
                  'admittedN0BandNeeds':'b1*qBig>=2',
                  'wholeKSlabN0MembershipNeeds':'b1*q>=1 at the actual q and b1*qBig>=32 for certified N0 band membership',
                  'allPhysicalCellsInstantiated':False,'naturalSeriesAnalyticRangesAudited':False,
                  'completeAllCycleFinalField':False,'finalJets':0,'release':'HOLD'}}
    encoded=(json.dumps(out,indent=2)+'\n').encode()
    a.out.write_bytes(encoded)
    print('PASS 983154 N0 nodes, registry, all 23 selector clauses, and 11 roots')
    print(f'{sha256(encoded).hexdigest()}  {a.out.name}')


if __name__=='__main__':
    main()
