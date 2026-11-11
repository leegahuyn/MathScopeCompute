"""Read original selector comparisons from the archived source and actual prefixes."""

from argparse import ArgumentParser
from array import array
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import gzip
import json
import subprocess


F8 = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
PREP = ('research-ide/mathscope-m2/navier/research/evidence/physical-full-jets-20261011/'
        'actual-physical-center-full-jet-source-attempt4')
ORIGINAL_FAMILY = 'research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs'
ARCHIVE_SCALE_SHA = '0c7285a274b3442eca8cf2127c3d279f8a09ec0db48f5d444006f23d324b3cd8'
ARCHIVE_FINAL_SHA = '88f7cf6fe5af934d6b3bcacc8ad975e86bd0b37fee2110b9db8c73e72acb129e'
N0_SHA = '635d24c20d71fa94fa51aafce813f10a9059c7d3f985c8c210c33b4ffff85ca3'
N1_SHA = '1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3'
N2_SHA = '75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987'
N2_REG = '6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f'
PROFILE = 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
PREFIX = 617521


def blob(repo, path):
    return subprocess.check_output(['git','-c','core.longpaths=true','-C',str(repo),'show',F8+':'+path])


def exact_tower(value):
    count = 0
    while list(value) == ['exp']:
        count += 1
        value = value['exp']
    assert list(value) == ['rational']
    return count, Fraction(value['rational'])


def archive_proof(repo):
    final_raw = blob(repo,PREP+'.json')
    final = json.loads(final_raw)
    assert sha256(final_raw).hexdigest() == ARCHIVE_FINAL_SHA
    assert final['pass'] and final['complete'] and final['exitCode']==0
    stage_raw = blob(repo,PREP+'-closed-selector-and-physical-scales.json')
    upper_zip = blob(repo,PREP+'-first-selector-ftc-upper-bounds.json.gz')
    upper_raw = gzip.decompress(upper_zip)
    trace_raw = blob(repo,PREP+'-selection-trace.json')
    assert sha256(stage_raw).hexdigest()==ARCHIVE_SCALE_SHA
    for key,raw in (('closed-selector-and-physical-scales',stage_raw),('first-selector-ftc-upper-bounds',upper_raw)):
        assert final['partialAttachments'][key]['sha256']==sha256(raw).hexdigest()
    assert final['selectionTrace']['sha256']==sha256(trace_raw).hexdigest()
    stage_outer,upper_outer = map(json.loads,(stage_raw,upper_raw))
    for packet in (stage_outer,upper_outer):
        assert packet['originalSameProcess'] and packet['finalSourcePassRequired'] and not packet['standaloneCompletionClaim']
        assert packet['data']['pass'] and packet['data']['sourceAuthenticated']
    stage,upper=stage_outer['data'],upper_outer['data']
    trace=json.loads(trace_raw)
    diagnostics=stage['diagnostics']
    assert diagnostics['sourceArithmeticEvaluationComplete'] and diagnostics['allArithmeticBoundariesAccountedFor']
    assert stage['sourceBinding']['firstOriginalLogScale']==617465
    assert stage['sourceBinding']['originalParameterExpressionSHA256']==PROFILE
    assert stage['sourceBinding']['sameOriginalFirstSelector'] and stage['sourceBinding']['positiveSourceHRetained']
    assert all(c['pass'] is True for c in stage['checks']) and all(c['pass'] is True for c in upper['checks'])
    order_one=trace['selectorRows']
    intervals=diagnostics['upperRequiredLogIntervals']
    upper_rows=upper['upperRows']
    for j,(original,u,interval,comparison) in enumerate(zip(order_one,upper_rows,intervals,
                                                             stage['sourceBinding']['firstFTCUpperComparisons'],strict=True)):
        assert j==original['traceIndex']==u['index']==interval['index']==comparison['index']
        assert (u['originalBound'],u['originalRequiredLog'])==(original['bound'],original['requiredLog'])
        assert (comparison['original'],comparison['upper'])==(u['originalRequiredLog'],u['upperRequiredLog'])
        assert interval['sourceRoot']==u['upperRequiredLog']
    [c]=[x for x in stage['rows'] if x['name']=='ellMinimum']
    assert c['sourceRoot']==617432
    ell_count,ell_leaf=exact_tower(c['interval']['lower'])
    assert ell_count==6 and ell_leaf>1048592
    assert diagnostics['historicalLogScale']['sourceRoot']==137420
    competing=[diagnostics['historicalLogScale'],*intervals]
    for interval in competing:
        depth,leaf=exact_tower(interval['interval']['upper'])
        assert depth==4 and 1048592<leaf<1048593
    # e^x>1+x and e^x>2x for x>0 (the quadratic Taylor bound suffices).
    # Thus E^4(L+1)<E^5(L)<E^6(L)/2, while log(2)>1/2.
    assert 1048593==1048592+1
    summary={'ellLowerExpHeight':ell_count,'allCompetingUpperExpHeights':[4]*len(competing),
             'rationalSeparator':[1048592,1048593], 'historicalLogScale':137420,
             'originalClauseLogs':[r['requiredLog'] for r in order_one],
             'verifiedUpperClauseLogs':[r['sourceRoot'] for r in intervals],
             'strictBound':'all other max operands < ellMinimum/2 < (ellMinimum+10)*log(2)',
             'archiveSHA256':{'final':ARCHIVE_FINAL_SHA,'closedScales':ARCHIVE_SCALE_SHA,
                              'upperBounds':sha256(upper_raw).hexdigest(),'trace':sha256(trace_raw).hexdigest()}}
    a13={row['root']:row['numericalInterval'] for row in diagnostics['integralBounds']}
    assert set(a13)=={239,257,275}
    return summary,trace,a13


def graph_file(directory):
    [path]=directory.rglob('original-source-nodes.jsonl.gz')
    return path


def stream(path, expected, keep=None, spool=None):
    digest,prefix=sha256(),sha256()
    selected={}
    offsets=array('Q')
    with gzip.open(path,'rb') as handle:
        header=handle.readline()
        count=json.loads(header)['node_count']
        digest.update(header)
        for i,line in enumerate(handle):
            digest.update(line)
            if i<PREFIX:
                prefix.update(line)
            if keep is not None and i in keep:
                selected[i]=json.loads(line)
            if spool is not None:
                offsets.append(spool.tell())
                spool.write(line)
    assert i+1==count and digest.hexdigest()==expected
    return selected,prefix.hexdigest(),offsets


def n0_n1_proof(args, trace, archive):
    n0=json.loads((args.n0/'original-whole-k-prefix.json').read_bytes())
    select={r['id']:r['node'] for r in trace['trace']['nodes'] if r['id']<PREFIX}
    extra={617464,617465,617466,617432,617433,127,24,617463,634035,634034,634033,634032,474}
    keep=select.keys()|extra
    actual,n0_prefix,_=stream(graph_file(args.n0),N0_SHA,keep)
    _,n1_prefix,_=stream(graph_file(args.n1),N1_SHA)
    assert n0_prefix==n1_prefix
    assert all(actual[i]==expected for i,expected in select.items())
    row=n0['selector']['rows'][0]
    assert n0['selector']['sourceFamilySHA256']==PROFILE and row['logScale']==617465 and row['scale']==617466
    assert [c['requiredLog'] for c in row['constraints']]==archive['originalClauseLogs']
    assert actual[617465]=={'op':'maximum','args':[137420,127,617464,*archive['originalClauseLogs']]}
    assert actual[617466]=={'op':'exp','args':[617465]}
    assert actual[617464]=={'op':'multiply','args':[127,617463]}
    assert actual[617463]['args'][1]==617432 and actual[617433]['args'][1]==617432
    assert actual[634035]=={'op':'exp','args':[634034]}
    assert actual[634034]=={'op':'multiply','args':[20,634033]}
    assert actual[634033]=={'op':'multiply','args':[127,634032]}
    assert actual[634032]=={'op':'add','args':[474,617433]}
    return {'matchingArchivedTraceNodes':len(select),'identicalN0N1InitialRecords':PREFIX,
            'initialRecordSHA256':n0_prefix,'uniqueWinningMaxOperand':617464,
            'result':'b1*qBig=1 exactly on the byte-matched N0 and N1 prefixes'}


def arithmetic_children(node):
    op,a=node['op'],node['args']
    if op in ('add','multiply','maximum','inverse','exp','log_positive','sqrt_positive','ceiling','floor'):
        return a
    if op=='integer_power':
        return a[:1]
    if op in ('rational','source_parameter'):
        return []
    return None


def trace_roots(lookup, roots):
    seen,stack,boundaries,params={},list(roots.values()),{},set()
    while stack:
        i=stack.pop()
        if i in seen:
            continue
        node=seen[i]=lookup(i)
        children=arithmetic_children(node)
        if children is None:
            boundaries[i]=node['op']
        else:
            stack.extend(children)
        if node['op']=='source_parameter':
            params.add(node['args'][0])
    return seen,boundaries,params


def n2_proof(args, a13):
    n2=json.loads((args.n2/'original-n2-prefix.json').read_bytes())
    selector=n2['selector']
    assert n2['sourceCommit']==F8 and n2['currentStage']=='COMPLETE' and selector['sourceFamilySHA256']==PROFILE
    path=graph_file(args.n2)
    registry=(path.parent/'original-source-functions.json').read_bytes()
    assert sha256(registry).hexdigest()==N2_REG
    source=json.loads(json.loads(registry)['base']['fixed'])['source']
    assert source['parameterExpressionSHA256']==PROFILE
    def summarize(boundaries):
        return dict(Counter(boundaries.values()))
    with TemporaryFile() as spool:
        _,_,offsets=stream(path,N2_SHA,spool=spool)

        def lookup(i):
            spool.seek(offsets[i]);return json.loads(spool.readline())

        def max_leaves(i):
            n=lookup(i)
            return set().union(*(max_leaves(k) for k in n['args'])) if n['op']=='maximum' else {i}

        summary=[]
        for row in selector['rows']:
            n=row['order']
            assert lookup(row['logScale'])=={'op':'maximum','args':[row['historicalLogScale'],row['growth'],row['smallBand'],
                              *(c['requiredLog'] for c in row['constraints'])]}
            assert lookup(row['scale'])=={'op':'exp','args':[row['logScale']]}
            top=[]
            for c in row['constraints']:
                if c['derivativeOrder']!=n:
                    continue
                lower=[x['bound'] for x in row['constraints'] if x['kind']==c['kind'] and x['derivativeOrder']<n]
                assert all(max_leaves(i)<=max_leaves(c['bound']) for i in lower)
                _,opaque,_=trace_roots(lookup,{'top':c['requiredLog']})
                top.append({'kind':c['kind'],'bound':c['bound'],'requiredLog':c['requiredLog'],
                            'remainingArithmeticBoundaries':summarize(opaque)})
            summary.append({'order':n,'historicalLogScale':row['historicalLogScale'],
                            'topDerivativeComparators':top,'logScale':row['logScale']})
        hroots={f'historicalLogC{row["order"]}':row['historicalLogScale'] for row in selector['rows']}
        hnodes,boundaries,params=trace_roots(lookup,hroots)
        assert boundaries=={k:'definite_integral' for k in a13}
        assert params<=source['parametersExactExpressions'].keys()
        if args.arithmetic_input is not None:
            packet={'roots':hroots,'nodes':[{'id':k,'node':v} for k,v in sorted(hnodes.items())],
                    'nonArithmeticBoundaries':[{'id':k} for k in sorted(boundaries)],'parameters':sorted(params),
                    'definitions':source['parametersExactExpressions'],'boundaryIntervals':a13,
                    'graphSHA256':N2_SHA,'archiveNumericalSHA256':ARCHIVE_SCALE_SHA}
            args.arithmetic_input.write_text(json.dumps(packet,separators=(',',':'))+'\n',encoding='utf-8')
    return summary, {'nodes':len(hnodes),'arithmeticBoundaries':boundaries,'historicalRoots':hroots}


def main():
    parser=ArgumentParser(description=__doc__)
    for k in ('repo','n0','n1','n2','out'):
        parser.add_argument('--'+k,type=Path,required=True)
    parser.add_argument('--arithmetic-input',type=Path)
    args=parser.parse_args()
    family=blob(args.repo,ORIGINAL_FAMILY)
    assert all(x in family for x in (b'n===2?16:2',b'G.add(ellMinimum,q(10))',
                                      b'Each B_nm is the same source function/FTC expression for fixed n,m.'))
    archive,trace,a13=archive_proof(args.repo)
    cross=n0_n1_proof(args,trace,archive)
    n2,historical=n2_proof(args,a13)
    result={'schema':'MathScope.N7.OriginalCommonSelectorExactComparisons/1','originalCommit':F8,
            'originalFamilySHA256':sha256(family).hexdigest(),'archiveComparison':archive,
            'actualN0N1':cross,'actualN2ComparatorInventory':n2,'historicalArithmeticTrace':historical,
            'actualN2FirstRowEquivalence':'Uses the original source family prefix independence claim; remapped FTC formulas are not compared here.',
            'wholeK':{'N0Excluded':True,'firstCutoffPlateau':True,
                      'fourthAndLaterPhysicallyInactive':True,'canonicalInitialWindowThresholds':[32,64,128],
                      'n3RepresentativeSufficesAbove':'qMin*(1+27/(ellMinimum+16)^6)',
                      'sufficientFullRepresentativeFourthScale':'b4*qBig>=64/(1-27/(ellMinimum+16)^6)'},
            'b2b3b4ActualMaxBranchesOpen':True,'release':'HOLD'}
    raw=(json.dumps(result,indent=2)+'\n').encode()
    args.out.write_bytes(raw)
    print('PASS original first max has unique small-band winner; b1*qBig=1')
    print(f'{sha256(raw).hexdigest()}  {args.out.name}')


if __name__=='__main__':
    main()
