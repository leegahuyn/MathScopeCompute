"""Trace the seven support guards of the actual repaired first forcing."""
from argparse import ArgumentParser
from fractions import Fraction as F
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryFile

from bind_corrected_flat import (BASE, FIRST_SCOPE, REPAIR, STREAM, ReplayGraph, verify_manifest,
                                LS, PSI, FORMAL_V, PARTS, git_blob, read)
from bind_forced_cutoffs import check_cutoff
from check_fixed_path import slow_cutoffs, Nodes
from check_palette import Source, add, atom, inv, mul, num, pow_nat, sub

PRIMARY_CLASS = ('research-ide/mathscope-m3/navier/evidence/global-source-class-composition-20261012/'
                 'attempt382972107731/actual-primary-class.json')
PRIMARY_CLASS_SHA = 'a9fc1d0c1f95cf3629827b1f0be9d7bf14be2dcbe43634c8c9fb2185c5ca409a'
PROFILE = 'research-ide/mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/one-profile-0002/receipt.json'
PROFILE_SHA = '184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd'
LEDGER_SHA = '1626a44766f1ba0058f62889a95fdef0a32b8f0af5589d966f242ac13f4e1021'
XI, R0, CHI = 623035, 300171, 623043
SHELL = [622824,3617,28826]


def normalize_transverse(graph,algebra):
    absolute,lo,hi,left,middle,right = graph.op(CHI,'smooth_piecewise')
    assert [left,right]==[1,0] and [algebra.number(lo),algebra.number(hi)]==[F(1,4),F(3,4)]
    squared, = graph.op(absolute,'sqrt_positive')
    assert algebra.number(R0)==F(1,2**34)
    xi = atom('coordinate',XI)
    algebra.exact(squared,pow_nat(mul(xi,inv(num(F(1,2**34)))),2))
    arg,order = graph.op(middle,'source_step_derivative')
    assert order==0
    aval = atom('transverseAbsolute')
    algebra.exact(arg,sub(num(F(3,2)),mul(num(2),aval)),aliases={absolute:aval})
    return {'formalCoordinate':XI,'radius':R0,'cutoff':CHI,'outerGuardRadius':'r0',
            'zeroCollar':'|xi| >= 3r0/4','strictGap':'r0/4'}


def support_ideal(graph,defs,raw):
    allowed = {row['id']:row['name'] for row in defs if row['name'].startswith((
        'InitializedOriginalWave_','InitializedOriginalPrimaryPressure_','OriginalPrimaryPrincipalFlat_'))}
    assert len(allowed)==100
    results = []
    controls = []
    for row in raw['rows']:
        delta,sign = row['key'].split(':')
        suffix = f'{delta}_{sign}_'
        own = {key for key,name in allowed.items()
               if name.startswith(tuple(p+suffix for p in ('InitializedOriginalWave_',
                        'InitializedOriginalPrimaryPressure_','OriginalPrimaryPrincipalFlat_')))}
        assert len(own)==10
        leaves = {}
        inert = set()

        @cache
        def vanish(i):
            op,args = graph.node(i)
            if i==0:
                return True
            if op=='m3_coupled_expression_partial' and args[0] in own:
                system,actual,orders = args
                leaves[i] = (system,tuple(orders))
                return True
            if op=='add':
                return all([vanish(x) for x in args])
            if op=='multiply':
                return any([vanish(x) for x in args])
            if op=='integer_power' and args[1]>0:
                return vanish(args[0])
            if op=='smooth_piecewise':
                return all([vanish(x) for x in args[3:]])
            # Retain all independent mean, coefficient, and domain operands.
            inert.add(i)
            return False

        for c in row['components']:
            assert vanish(c['raw']), (row['key'],row['m'],c['j'],c['part'],'raw')
            assert vanish(c['supported']), (row['key'],row['m'],c['j'],c['part'],'supported')
            assert vanish(c['primary']), (row['key'],row['m'],c['j'],c['part'],'primary')
        assert leaves and not any(vanish(i) for i in inert)
        distinct = sorted(set(leaves.values()))
        results.append({'key':row['key'],'mode':row['m'],'actualWaveNativeApplications':len(leaves),
                        'distinctSystemOrders':[[s,list(o)] for s,o in distinct],
                        'independentOperandsRetained':len(inert),'checkedPositiveComplexComponents':6})
        if not controls:
            first = row['components'][0]
            own = {s for s in own if not allowed[s].startswith('OriginalPrimaryPrincipalFlat_')}
            vanish.cache_clear()
            assert vanish(first['raw']) and not vanish(first['supported'])
            controls.append('ignoring the subtracted primary-tail native factor')
        vanish.cache_clear()
    assert len(results)==20
    names = {'velocity':'InitializedOriginalWave_','pressure':'InitializedOriginalPrimaryPressure_',
             'primaryFlat':'OriginalPrimaryPrincipalFlat_'}
    maximum = {k:max(sum(o) for r in results for s,o in r['distinctSystemOrders'] if allowed[s].startswith(p))
               for k,p in names.items()}
    assert maximum=={'velocity':2,'pressure':1,'primaryFlat':0}
    return results,maximum,controls


def primary_class(repo):
    raw = git_blob(repo,BASE,PRIMARY_CLASS)
    assert sha256(raw).hexdigest()==PRIMARY_CLASS_SHA
    x = json.loads(raw)
    assert x['request']['order']==x['scope']['actualFiniteDerivativeOrder']==1
    for k in ('actualOriginalPrimaryWOneHalfClassCertified','actualOriginalPrimaryPressureWOneClassCertified',
              'actualFullCurlRemainderWOneMinusKappaClassCertified'):
        assert x['scope'][k]
    assert not x['scope']['actualForcedInputWClassCertified']
    assert not x['scope']['actualPostTemporalFiveMapClassCertified']
    assert x['sourceTarget']['scope']['actualGeneratedDerivativeOrder']==2
    profile = git_blob(repo,BASE,PROFILE)
    assert sha256(profile).hexdigest()==PROFILE_SHA
    profile = json.loads(profile)
    assert profile['parameterExpressionSHA256']==x['source']['parameterExpressionSHA256']
    params = profile['parametersExactExpressions']
    assert params['t1']=={'power':[{'ref':'CSelected'},-120]}
    assert params['CSelected']=={'exp':{'ref':'logCSelected'}}
    rows = []
    for row in x['bounds']['rows']:
        fields = {}
        for k in ('primary','potential','curlRemainder','homogeneousPressure'):
            f = row['fields'][k]
            assert f['weight']=='sqrt(zeta)' and f['gaussian']=='P(v)'
            fields[k] = {'pole':f['pole'],'power':f['power']}
        rows.append({'order':row['order'],'fields':fields})
    assert [r['order'] for r in rows]==[0,1]
    bound = x['bounds']['boundary']
    assert bound['pass'] and bound['pole']==18 and 'zeta=exp(-a/y^2-b/z^2)' in bound['definition']
    path = 'research-ide/mathscope-m2/navier/actual-background-physical-seminorms.mjs'
    source = git_blob(repo,BASE,path)
    assert b"const a=G.log(G.div(X,G.parameter('Xa'))),b=G.log(G.div(Xb,X));" in source
    assert b"G.div(G.pow(G.parameter('t1'),2),G.pow(a,2)),G.div(q(4),G.pow(b,2))" in source
    return {'receiptSHA256':PRIMARY_CLASS_SHA,'zetaSourceSHA256':sha256(source).hexdigest(),
            'originalProfileReceiptSHA256':PROFILE_SHA,'t1PositiveByExactProfile':'t1=exp(logCSelected)^(-120)',
            'sourceWindowPrefixOrder':x['domain']['prefixOrder'],'primaryLocalRows':rows,
            'primaryOwnSourceGraphNamespace':x['sourceCurrent']['graph']['sha256'],
            'weightedTargetDerivativeOrder':2,'actualFinitePrimaryDerivativeOrder':1,
            'actualFirstForcedInputNormSuppliedByReceipt':False}


def main():
    p = ArgumentParser(description=__doc__)
    for arg in ('repo','first-dir','ledger','out'):
        p.add_argument('--'+arg,type=Path,required=True)
    a = p.parse_args()
    meta,registry = verify_manifest(a.first_dir,FIRST_SCOPE,REPAIR)
    ledger_raw = a.ledger.read_bytes()
    assert sha256(ledger_raw).hexdigest()==LEDGER_SHA
    ledger = json.loads(ledger_raw)['correctedFirstForce']
    raw = read(a.first_dir/'corrected-first-force.json')
    assert ledger['graphSHA256']==meta['node_stream_sha256'] and raw['snapshot']==meta
    definitions = json.loads(registry['definitions'])[0]
    with TemporaryFile() as backing:
        graph = ReplayGraph(a.first_dir/STREAM,backing,meta)
        algebra = Source(Nodes(graph))
        axes,chart = slow_cutoffs(graph,algebra,json.loads(registry['base']['base']['monotone']))
        transverse = normalize_transverse(graph,algebra)
        radial,implicit_s = atom('coordinate',622802),atom('slowRoot')
        algebra.exact(SHELL[0],mul(pow_nat(radial,2),inv(mul(num(2),implicit_s))),aliases={622820:implicit_s})
        assert graph.op(SHELL[1],'source_parameter')==['Xa']
        xr,right_scale = graph.op(SHELL[2],'multiply')
        assert graph.op(xr,'source_parameter')==['XR'] and graph.node(right_scale)[0]=='exp'
        common_axes = [625159,625265,625230,625195]
        assert set(common_axes)=={r['offset'] for r in axes}
        cases = []
        for row in ledger['ledger']:
            guards = row['sourceGuards']
            assert len(guards)==7 and [g[0] for g in guards[:4]]==common_axes
            assert guards[4]==SHELL and guards[-1]==[row['pulse'],0,LS]
            assert [algebra.number(i) for i in guards[-2][1:]]==[-F(1,2**34),F(1,2**34)]
            if row['mode']==1:
                cases.append({'key':row['key'],'sourceGuards':guards})
        ideal,maximum,controls = support_ideal(graph,definitions,raw)
    out = {'schema':'MathScope.N6.RepairedFirstForceSevenGuardSupport/1',
           'graphSHA256':meta['node_stream_sha256'],'firstLedgerSHA256':LEDGER_SHA,
           'archivedFinitePrimaryClass':primary_class(a.repo),'slowAxes':axes,'slowChart':chart,
           'transverse':transverse,'longitudinal':{'formalCoordinate':FORMAL_V,'formalCutoff':PSI,
               'leftZeroCollar':'[0,Ls/5]','rightZeroCollar':'[4Ls/5,Ls]',
               'oneMinusPsiNeedsInputCollar':True},'shell':SHELL,'sourceCases':cases,
           'actualCorrectedFirstForceSupportIdeal':ideal,
           'maxActualPrimaryDerivativeOrdersInSupportedInput':maximum,
           'negativeControlsRejected':controls,
           'conditional':['The wave and primary-tail native jets must be defined and vanish at actual cutoff collars; all independent coefficient operands must be defined.',
                          'Zero-data path estimates require the source and its slow/transverse derivatives to vanish for every pulse time on the relevant face.',
                          'Shell regularity needs actual weighted derivative bounds on the fixed enlarged chart; the scalar ζ bound applies to each verified derivative.',
                          'The corrected Signed and final same-row field roots require their own completed hosted graph readback.'],
           'completeCorrectedCycleSupportClassProved':False}
    blob = (json.dumps(out,indent=2)+'\n').encode()
    a.out.write_bytes(blob)
    print('PASS four slow factors, actual shell and pulse guards, and 120 repaired input support-ideal coefficients')
    print(f'{sha256(blob).hexdigest()}  {a.out.name}')


if __name__=='__main__':
    main()
