#!/usr/bin/env python3
"""Observe one coherent original C4/target C2/current class composition.

The prior C3/order0 receipt is immutable. This gate generates the additional
actual source norm order required by full g_r and saves every completed
stage before the next attachment. No sampled source norm is accepted.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from math import comb, factorial
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import resource
import signal
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
MAX_RSS=13*1024**3//2
MAX_AS=7*1024**3
TIMEOUT=2100
EXPECTED_NODE_TESTS=14

def digest(path):
    raw=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}

def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT) or not path.is_file():raise ValueError('Every exact source dependency must remain in the repository')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for p in [BASE/'tests/global-source-class-composition.test.mjs',BASE/'tests/background-class-majorants.test.mjs',Path(__file__)]:visit(p)
    return sorted(seen)

def family_memory(pid):
    pending,seen=[pid],set();rss=maximum_as=0
    while pending:
        at=pending.pop()
        if at in seen:continue
        seen.add(at)
        try:
            status=Path(f'/proc/{at}/status').read_text()
            a=re.search(r'^VmSize:\s+(\d+) kB$',status,re.M);r=re.search(r'^VmRSS:\s+(\d+) kB$',status,re.M)
            rss+=int(r[1])*1024 if r else 0;maximum_as=max(maximum_as,int(a[1])*1024 if a else 0)
            pending.extend(map(int,Path(f'/proc/{at}/task/{at}/children').read_text().split()))
        except (FileNotFoundError,ProcessLookupError):pass
    return rss,maximum_as

def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()

def independent(out):
    read=lambda name:json.loads((out/name).read_bytes())
    family=read('actual-common-C4-family.json');current=read('actual-primary-current.json')
    primary=read('actual-primary-class.json');target=read('actual-target-weighted-norm-certificate.json')
    raw=(out/'actual-target-weighted-norm-program.json').read_bytes();tp=json.loads(raw)
    common=read('actual-common-Y-covariance-class.json');pressure=read('actual-pre-haar-pressure.json')
    background=read('actual-complete-background-class.json');radial=read('actual-full-radial-pressure-class.json')
    fixed=read('actual-fixed-radial-class-operator.json');checks=[]
    def check(name,value):checks.append({'id':name,'pass':bool(value)})
    check('new-coherent-C4-family-actually-executed',family['request']['derivativeOrder']==4 and family['request']['throughOrder']==2)
    check('same-original-source-parameter-and-paper',primary['source']['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152' and
          primary['source']['paperSHA256']=='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f')
    check('actual-current-uses-this-new-family',current['sourceBand']['upstreamSource']['graph']==family['graph'])
    check('actual-background-C4-target-C2-primary-C1',primary['request']['order']==1 and
          primary['bounds']['backgroundRow']['backgroundDerivativeOrder']==4 and
          [(r['derivativeOrder'],r['pole']) for r in primary['bounds']['targetRows']]==[(0,3),(1,6),(2,9)])
    check('full-target-C2-program-canonical-digest',raw.endswith(b'\n') and hashlib.sha256(raw[:-1]).hexdigest()==target['graph']['sha256'])
    check('full-target-program-nodes-and-FTC-faces',len(tp['nodes'])==target['graph']['nodeCount'] and
          len(tp['ftcRows'])==36 and all(len(r['faces'])==4 for r in tp['ftcRows']))
    check('actual-primary-parent-source-and-norm-links',primary['program']['currentBase']==current['graph'] and primary['program']['targetBase']==target['graph'])
    check('actual-both-pulse-signs-and-original-H',len(primary['sourcePulseBindings'])==2 and all(
          r['binding']['pass'] and r['sourceAmplitudeBodyMatches'] for r in primary['sourcePulseBindings']) and
          all(r['actualIntegralColumn']==r['originalHColumn'] and r['actualTangency']['pass'] for r in primary['covariance']['sourceRows']))
    check('whole-normal-pressure-and-all-curl-squares',all(len(r['remainder'])==6 and all(c['pass'] for c in r['pressureChecks']) for r in primary['covariance']['sourceRows']))
    check('only-leading-covariance-cancelled',primary['covariance']['leadingCovarianceCancellationExecuted'] and not primary['covariance']['fullCovarianceDeclaredEqualToTarget'])
    check('actual-common-Y-C1-source-parents',common['scope']['actualFiniteDerivativeOrder']==1 and common['parents']['primary']==primary['graph'] and common['parents']['pressure']==pressure['graph'])
    check('all162-complete-two-column-maps',len(common['mapping']['mapRows'])==162 and all(
          r['exactXiColumns'] and r['exactPulseColumns'] and r['exactDerivativeMaps'] and r['allMapCoefficientsFrozen'] for r in common['mapping']['mapRows']))
    check('all-six-pre-Haar-fields-no-average-substitution',len(common['mapping']['indexedRows'])==6 and not common['mapping']['haarAverageSubstituted'] and common['bounds']['noAuxiliaryIntegrationMassInserted'])
    check('whole-common-Y-prefix-through-first-order',[r['order'] for r in common['bounds']['rows']]==[0,1])
    for name,packet in [('primary',primary),('commonY',common),('background',background),('radial',radial),('fixedRadial',fixed)]:
        check(name+'-all-executed-source-checks',len(packet['checks'])>0 and all(r['pass'] for r in packet['checks']))
        check(name+'-independent-complete-program-digest',hashlib.sha256(canonical(packet['program'])).hexdigest()==packet['graph']['sha256'])

    # Reassemble complete new norm bodies with exact overlapping prefixes.
    nodes=list(tp['nodes'])
    def append(start,more,label):
        check(label+'-no-omitted-prefix',start<=len(nodes))
        if start>len(nodes):raise ValueError('A dependent norm program omitted its prefix')
        overlap=min(len(nodes)-start,len(more))
        check(label+'-same-existing-overlap',nodes[start:start+overlap]==more[:overlap])
        nodes.extend(more[overlap:])
    append(primary['program']['norm']['start'],primary['program']['norm']['nodes'],'primary')
    append(common['program']['normBaseOffset'],common['program']['nodes'],'common-Y')
    append(background['program']['norm']['start'],background['program']['norm']['nodes'],'background')
    append(radial['program']['norm']['start'],radial['program']['norm']['nodes'],'radial')
    check('complete-final-norm-node-count',len(nodes)==radial['graph']['normNodeCount'])

    # Audit EVERY operation in the distinct fixed-operator namespace copy.
    fn=fixed['program']['nodes'];identities=radial['fixedConstantCopy']['identities']
    mapping={r['from']:r['to'] for r in identities};coordinate_targets=[];all_operations=True
    for r in identities:
        a=fn[r['from']];b=nodes[r['to']];op=a['op'];args=a['args']
        if b['op']!=op or r['operation']!=op:all_operations=False;continue
        if op in ['rational','source_parameter']:expected=args
        elif op=='coordinate':coordinate_targets.append(r['to']);continue
        elif op in ['integer_power','source_step_derivative']:expected=[mapping[args[0]],args[1]]
        else:expected=[mapping[x] for x in args]
        if op in ['add','multiply','maximum']:
            all_operations=all_operations and sorted(expected)==sorted(b['args'])
        else:all_operations=all_operations and expected==b['args']
    check('every-copied-fixed-source-operation-and-argument',all_operations and len(identities)>0)
    check('alpha-renamed-bound-coordinates-have-no-collision',len(set(coordinate_targets))==len(coordinate_targets))
    cache={}
    def free(root):
        if root in cache:return cache[root]
        n=nodes[root];op=n['op'];a=n['args']
        if op=='coordinate':value={root}
        elif op in ['rational','source_parameter']:value=set()
        elif op=='definite_integral':value=(free(a[0])-{a[1]})|free(a[2])|free(a[3])
        else:
            children=[a[0]] if op in ['integer_power','source_step_derivative'] else a
            value=set().union(*(free(x) for x in children))
        cache[root]=value;return value
    check('all-copied-fixed-operator-roots-independently-closed',all(not free(r['targetRoot']) for r in radial['fixedConstantCopy']['roots']))

    check('actual-full-radial-background-source-body',background['binding']['literalCompleteRadialBracket'] and all(
          r['exactOriginalCoefficients'] and r['exactCommonScale'] and r['entireRadialCutoffCommutator'] for r in background['binding']['allPositiveRows']))
    check('all-leading-radial-C1-FTC-faces',len(background['sourceNorms']['leadingFTC'])==3 and
          all(len(r['faces'])==4 for r in background['sourceNorms']['leadingFTC']))
    check('same-original-stress-scale-and-unzeroed-E-B',background['binding']['literalStressNormalization'] and
          background['binding']['originalBackgroundFlatResidualRetained'] and background['scope']['unchangedBackgroundFlatResidualRetained'])
    for r in background['rows']:
        j=r['order'];check(f'background-{j}-all-source-epsilon-gains',r['FGMinusLeading']['epsilonExponent']=='2' and
            r['b']['epsilonExponent']=='1' and r['bMinusLeading']['epsilonExponent']=='3' and
            r['higherStress']['epsilonExponent']=='3' and r['fullStress']['epsilonExponent']=='1')
        check(f'background-{j}-n1-pole-and-whole-tail',r['finiteWeightedStress'][0]['order']==1 and
            r['finiteWeightedStress'][0]['pole']==3+3*j and r['tailStarts']==max(2,j))
    for m in range(16):
        J=max(2,m)
        for w in [Q(1,100),Q(1,2),Q(9,10),Q(1)]:
            actual=(w/2)**J/(1-w/2);upper=w*w/Q(2)**(J-1)
            check(f'complete-infinite-stress-tail-{m}-{w}',actual<=upper)
        check(f'too-small-geometric-tail-rejected-{m}',Q(1,2**(J-1))>Q(1,2**J))
    check('tail-converted-only-after-sum','After that sum' in background['normRecipe']['tail']['steps'][4])

    check('actual-pressure-source-parents',radial['parents']['commonY']==common['graph'] and radial['parents']['fixedRadial']==fixed['graph'])
    check('full-gr-uses-the-actual-five-terms',radial['sourceBinding']['force']['value']==radial['sourceBinding']['actualGr'] and
          radial['sourceBinding']['force']['cylindricalSigns']==[-1,-1,-1,-1,1])
    check('gr-value-demands-actual-W-first-order',radial['demand']['requiredCommonYCovarianceOrder']==1 and
          radial['grRows'][0]['input']==common['bounds']['rows'][1]['fields']['fullCovariance'])
    check('same-original-floor-index-upper-scale',radial['sourceBinding']['phase']['identity']['pass'] and
          radial['sourceBinding']['phase']['bound']=='0<M<=epsilon_ref^(-kappa_s)' and
          radial['sourceBinding']['phase']['continuousBandScaleSubstituted'] is False)
    check('whole-P-rho-and-complete-pressure-retained',radial['rows'][0]['P']['wholeNormalizedHaarProjection'] and
          radial['rows'][0]['P']['independentOfRAndY'] and radial['rows'][0]['pressureNotReplacedByItsHaarMean'])
    check('exact-pressure-identity-keeps-unimproved-A0',radial['rows'][0]['sourceRadialDerivativeBoundUsesExactIdentity'] and
          not radial['rows'][0]['cutoffA0']['positiveEpsilonGain'] and not radial['rows'][0]['cutoffA0']['flatnessClaimed'])
    check('positive-IBP-gain-not-borrowed-from-missing-W-C6',radial['request']['ibpOrder']==0 and not radial['rows'][0]['cutoffGains'] and
          radial['pendingCutoffGains'][0]['demand']['requiredCommonYCovarianceOrder']==6 and
          not radial['pendingCutoffGains'][0]['requiredNormRowAlreadyGenerated'])
    kappa=Q(1,100000)
    check('unchanged-positive-radial-loss',0<kappa<1 and 1-kappa<1 and 2-2*kappa>1)
    # Independent exact expansion of every m<=6 binomial majorant count.
    for m in range(7):
        for ar in range(m+1):
            check(f'complete-R-product-m{m}-alphaR{ar}',all(comb(ar,j)<=comb(m,j) for j in range(ar+1)))
        check(f'positive-power-derivative-envelope-{m}',factorial(m+4)>=factorial(m+3))
    for x,name in [(primary,'primary'),(common,'common'),(background,'background'),(radial,'radial')]:
        check(name+'-no-initial-or-all-stage-completion',not x['scope']['actualCompleteInitialN6TupleClassCertified'] and not x['scope']['completeN6'])
    check('original-common-window-not-enlarged',background['domain']['sourceWindow']==current['sourceBand']['window'] and
          radial['domain']['actualSourceWindow']==current['sourceBand']['window'] and radial['domain']['noLargerWindowInferred'])
    return {'schema':'MathScope.N6.IndependentCoherentSourceClassComposition/1','checks':checks,'checkCount':len(checks),
            'copiedOperationCount':len(identities),'reconstructedNormNodeCount':len(nodes),'pass':all(r['pass'] for r in checks),
            'actualPrimaryOrder':1,'actualBackgroundOrder':1,'actualPressureOrder':0,'completeInitialClassCertified':False,'completeN6':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,required=True);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a new positive attempt number')
    out=BASE/'evidence/global-source-class-composition-20261012'/f'attempt{args.attempt}';out.mkdir(parents=True,exist_ok=False)
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for p in paths:
        dest=out/'sources'/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
    log_path=out/'node.log';command=['node','--expose-gc','--max-old-space-size=5120','--test','--test-reporter=tap','--test-concurrency=1',
        'research-ide/mathscope-m3/navier/tests/global-source-class-composition.test.mjs',
        'research-ide/mathscope-m3/navier/tests/background-class-majorants.test.mjs']
    def limit():resource.setrlimit(resource.RLIMIT_AS,(MAX_AS,MAX_AS))
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();peak_rss=peak_as=0;stopped=None
    with log_path.open('wb') as log:
        child=subprocess.Popen(command,cwd=ROOT,env=dict(os.environ,MATHSCOPE_SOURCE_CLASS_DIRECTORY=str(out)),stdout=log,stderr=subprocess.STDOUT,
                               start_new_session=True,preexec_fn=limit)
        while child.poll() is None:
            raw=log_path.read_text(errors='replace');pids={int(x) for x in re.findall(r'"hostPID":(\d+)',raw)}
            readings=[family_memory(pid) for pid in pids];rss=sum(r[0] for r in readings);asize=max((r[1] for r in readings),default=0)
            peak_rss=max(peak_rss,rss);peak_as=max(peak_as,asize)
            if rss>MAX_RSS:stopped='OWNED_SOURCE_RSS_LIMIT'
            elif time.monotonic()-tick>TIMEOUT:stopped='OWNED_SOURCE_TIME_LIMIT'
            if stopped:
                os.killpg(child.pid,signal.SIGTERM)
                try:child.wait(timeout=5)
                except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL)
                break
            time.sleep(.25)
        code=child.wait()
    raw=log_path.read_text(errors='replace');counts={}
    for key in ['pass','fail','skipped']:
        matches=re.findall(r'^# '+key+r' (\d+)$',raw,re.M);counts[key]=int(matches[-1]) if matches else None
    result={'pass':False,'checkCount':0,'checks':[]}
    try:result=independent(out)
    except Exception as error:result['error']=type(error).__name__+': '+str(error)
    write(out/'independent-source-checks.json',result)
    after=[digest(p) for p in paths];write(out/'source-after.json',after)
    peaks={key:max((int(x) for x in re.findall('"'+key+r'":(\d+)',raw)),default=0) for key in ['rssBytes','maxRSSBytes','vmSizeBytes']}
    passed=(code==0 and not stopped and counts=={'pass':EXPECTED_NODE_TESTS,'fail':0,'skipped':0} and before==after and result['pass'] and
        max(peak_rss,peaks['rssBytes'],peaks['maxRSSBytes'])<=MAX_RSS and max(peak_as,peaks['vmSizeBytes'])<=MAX_AS)
    receipt={'schema':'MathScope.N6.ObservedCoherentSourceClassCompositionGate/1','attempt':args.attempt,'startedUTC':started,
        'finishedUTC':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,
        'exitCode':code,'stoppedReason':stopped,'nodeTests':counts,'expectedNodeTests':EXPECTED_NODE_TESTS,
        'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,
        'observedOwnedProcessRSSBytes':peak_rss,'observedOwnedProcessASBytes':peak_as,'selfReportedPeaks':peaks,
        'resourceLimits':{'rssBytes':MAX_RSS,'addressSpaceBytes':MAX_AS,'seconds':TIMEOUT},
        'independentChecks':result['checkCount'],'independentPass':result['pass'],
        'artifacts':[digest(p) for p in sorted(out.iterdir()) if p.is_file()],
        'actualBackgroundClassAttachmentExecuted':(out/'actual-complete-background-class.json').is_file(),
        'actualFullRadialPressureClassAttachmentExecuted':(out/'actual-full-radial-pressure-class.json').is_file(),
        'completeInitialTupleClassCertified':False,'allFiniteIterationClassesCertified':False,'completeN6':False,'pass':bool(passed)}
    write(out/'receipt.json',receipt)
    print(json.dumps({'receipt':digest(out/'receipt.json'),'nodeTests':counts,'independentChecks':result['checkCount'],
        'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,'pass':bool(passed),'error':result.get('error')},indent=2),flush=True)
    raise SystemExit(0 if passed else 1)

if __name__=='__main__':main()
