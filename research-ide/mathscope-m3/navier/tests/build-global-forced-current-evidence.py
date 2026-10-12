"""Archive the exact replay of genuinely saved forced angular stages.

The combined58-test run remains failed at35minutes. Its155source files
and11full graph checkpoints are preserved. A separate replay proves the
saved inverses/curls and all540local coefficient identities. A missing
final global current certificate is never synthesized or declared saved.
"""
from pathlib import Path
import argparse,gzip,hashlib,importlib.util,io,json,re
ROOT=Path(__file__).resolve().parents[4]
BASE=Path('research-ide/mathscope-m3/navier')
ATTEMPT=BASE/'evidence/global-forced-current-20261012/attempt382884203291'
REPLAY=BASE/'evidence/forced-snapshot-replay-20261012/attempt1'
TARGET=BASE/'source-global-forced-current-evidence-data.mjs'
ORIGINAL_RECEIPT='d17bc42fcfaf8000d014977d4725f325dbdb73849a43c71c36d20ea63ef14684'
PASS_PINS={'receiptSHA256':'76cb0c616b6485bff14037bd3fd8c67e59f3f2edbd476e5d37ef15e456f3c736',
           'replaySHA256':'d66646cda670daa8a3d4ecc45db205995fb7d685c897c912655fb0e0f0e5dd6d',
           'scalarIdentities':2320,'independentChecks':213}
FAILURES={1:'f344ad08c682f6c5b71cb3a776ee259680928b1dfa13e622a8dc2e121fa15059',
          2:'64dee28e59f5c1c74360c232d0a0235b263fac412f316a026100a7e777ea62ea',
          3:'fdee0ff24de8e0126b1d17a3fb9922ad5fb99dfabb90efa21bff3a32d9a74cef'}
SPEC=importlib.util.spec_from_file_location('archive_bytes',ROOT/BASE/'tests/build-near-terminal-evidence.py')
SHARED=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(SHARED)
URL='https://github.com/leegahuyn/MathScopeCompute/blob/ed47ff6aa2b109dc32be78908d09e4885c484036/'
def digest(raw):return hashlib.sha256(raw).hexdigest()
def require(value,message):
    if not value:raise ValueError(message)
def row(root,path):
    raw=(root/path).read_bytes();return {'path':str(path),'bytes':len(raw),'sha256':digest(raw)}
def pinned(root,path,pin):
    raw=(root/path).read_bytes();require(digest(raw)==pin,'Changed fixed artifact '+str(path));return json.loads(raw),row(root,path)
def verified(root,ref):
    require(row(root,ref['path'])==ref,'Changed exact artifact '+ref['path']);return (root/ref['path']).read_bytes()
def compact_checks(rows):
    return [{k:r[k] for k in ['id','pass','expression','productsUsed','maxProducts','maxTerms','declaredDefectMatches'] if k in r} for r in rows]
def header(root,ref):
    m=json.loads(verified(root,ref));folder=Path(ref['path']).parent
    encoded=b''.join(verified(root,{k:v for k,v in {**p,'path':str(folder/p['path'])}.items() if k!='index'}) for p in m['parts'])
    require(len(encoded)==m['gzipBytes'] and digest(encoded)==m['gzipSHA256'],'Changed compressed exact stage')
    with gzip.GzipFile(fileobj=io.BytesIO(encoded)) as stream:h=json.loads(stream.readline())
    require(h['firstNode']==m['firstNode'] and h['nodeCount']==m['nodeCount'] and h['kind']==m['kind'] and h['key']==m['key'],'Changed stage header')
    return h
def force_summary(f):
    inv,mapped=f['inverse'],f['mapped'];limit=inv['limit']
    require(inv['input']['m']==f['m'] and f['m'] in [1,2] and inv['scope']['completeComplexSourceUsed'] and
            inv['scope']['exactZeroDataForcedSolutionDefined'] and inv['scope']['algebraicPressureConstructed'] and
            inv['scope']['actualOrderedIntegralAndTailProducers'] and not inv['scope']['matrixCommutationAssumed'],'Missing complete source inverse')
    require([s['m'] for s in f['signedSolutions']]==[f['m'],-f['m']] and all(c['pass'] for c in f['signedSolutions'][1]['checks']) and
            all(c['pass'] for c in inv['identities']['checks']) and all(c['pass'] for c in mapped['identities']['checks']) and
            all(c['pass'] for c in f['checks']) and all(c['pass'] for c in f['path']['checks']),'A retained source identity failed')
    require(limit['allActualMatrixSourceAndTimeDerivativeBodiesGenerated'] and all(c['allActualCoefficientBodiesGenerated'] and
            c['allActualTimeDerivativeBodiesGenerated'] for c in limit['coefficients']) and
            not limit['commonAllBandClassBoundCertified'] and not limit['numericalIntegralEvaluated'],'Missing original ordered-limit bounds')
    return {'m':f['m'],'system':inv['system'],'wholePath':f['path'],'source':inv['source'],'projectedSource':inv['projectedSource'],
            'normal':inv['normal'],'K':inv['K'],'k':inv['k'],'epsilon':inv['epsilon'],'damping':inv['damping'],'matrix':inv['matrix'],
            'zeroDataVelocity':inv['velocity'],'fullPressure':inv['pressure'],'pressureNumerator':inv['pressureNumerator'],
            'signedSolutions':[{k:s[k] for k in ['m','originalSource','pathSource','velocity','pressure','exactConjugateOfSystem','principalResidual','equality'] if k in s} for s in f['signedSolutions']],
            'principalChecks':compact_checks(inv['identities']['checks']),'mappedPotential':mapped['potential'],'mappedVelocity':mapped['velocity'],
            'mappedPressure':mapped['pressure'],'fullCurlRemainder':mapped['curlRemainder'],
            'cutoff':{'pathPsi':mapped['cutoff']['path']['psi'],'mappedPsi':mapped['cutoff']['mapped']['psi'],
                      'remainingSource':mapped['cutoff']['mapped']['remainingSource'],'derivativeSource':mapped['cutoff']['mapped']['derivativeSource'],
                      'expected':mapped['cutoff']['mapped']['expected']},
            'mappedChecks':compact_checks(mapped['identities']['checks']),'sourceChecks':compact_checks(f['checks']),'limit':limit,
            'fullParameterLimitClosureExecuted':False,'pathInvariance':{k:v for k,v in f['sourcePathInvariance'].items() if k!='actualSourceNChecks'},
            'sourceSupport':{k:v for k,v in f['originalSupport'].items() if k not in ['differentialIdeal','originalPalette','originalTorus']}}
def historical(root):
    out=[]
    for n,pin in FAILURES.items():
        r,ref=pinned(root,BASE/f'evidence/global-forced-current-20261012/attempt{n}/receipt.json',pin)
        require(r['pass'] is False and r['sourceFilesUnchanged'],'Historical failure changed')
        out.append({'attempt':n,'receipt':ref,'pass':False,'nodeTests':r['nodeTests'],'sourceFileCount':r['sourceFileCount'],
                    'elapsedSeconds':r['elapsedSeconds'],'sourceSnapshotsPreserved':True,'completeForcedCurrentProduced':False})
    return out
def archive(root=ROOT):
    root=Path(root);require(PASS_PINS is not None,'The complete observed saved-source replay PASS must be pinned first.')
    original,original_ref=pinned(root,ATTEMPT/'receipt.json',ORIGINAL_RECEIPT)
    gate,receipt=pinned(root,REPLAY/'receipt.json',PASS_PINS['receiptSHA256'])
    require(original['pass'] is False and original['stoppedReason']=='OBSERVED_EXECUTION_TIME_LIMIT' and original['timeoutSeconds']==2100 and
            original['sourceFileCount']==155 and original['sourceFilesUnchanged'] and original['all11ExactSourceGraphCheckpointsSaved'],'Original failed run changed')
    require(gate['pass'] and gate['exitCode']==0 and gate['stoppedReason'] is None and gate['sourceFilesUnchanged'] and
            gate['actualCoefficientComparisons']==540 and gate['actualScalarIdentities']==PASS_PINS['scalarIdentities'] and
            gate['independentChecks']==PASS_PINS['independentChecks'] and gate['independentPass'] and gate['negativeControls']==4 and
            gate['all155OriginalSourceBytesAndArtifactsVerified'] and gate['actualSavedSourceStageBound'] and
            gate['originalConstructorPass'] is False and gate['originalConstructorOutcomeRewritten'] is False and
            gate['privateSourceAuthorityHydrated'] is False and gate['wholeCurrentCertificateRecovered'] is False,'Exact replay result or boundary changed')
    contents={Path(r['path']).name:verified(root,r) for r in gate['artifacts']}
    replay=json.loads(contents['replay.json']);require(digest(contents['replay.json'])==PASS_PINS['replaySHA256'],'Changed complete replay evidence')
    independent=json.loads(contents['independent.json']);capture=json.loads(contents['input-verification.json'])
    require(independent['pass'] and independent['actualSavedSourceStageBound'] and not independent['actualSourceCertificateBound'] and
            not independent['floatingPointUsed'] and len(independent['checks'])==PASS_PINS['independentChecks'] and
            all(c['pass'] for c in independent['checks']),'Independent source-bound polynomial result changed')
    for ref in capture['files']:verified(root,ref)
    before=json.loads(contents['source-before.json']);after=json.loads(contents['source-after.json']);require(before==after,'Changed replay source capture')
    for ref in before:verified(root,ref);verified(root,{**ref,'path':str(REPLAY/'sources'/ref['path'])})
    for ref in json.loads((root/ATTEMPT/'source-bytes-before.json').read_text())['files']:verified(root,ref)
    index=json.loads((root/ATTEMPT/'checkpoint-index.json').read_text());require(len(index['checkpoints'])==11,'Missing exact graph checkpoint')
    hs=[header(root,{'path':r['path'],'bytes':(root/r['path']).stat().st_size,'sha256':r['sha256']}) for r in index['checkpoints']]
    base=hs[0]['record'];stages={h['key']:h['record'] for h in hs[1:]}
    initialized=json.loads((root/ATTEMPT/'initialized-angular-construction.json').read_text())
    require(len(base['templates'])==10 and len(stages)==10 and replay['actualCoefficientComparisons']==540 and
            replay['observedSourceGraphNodeCount']==index['checkpoints'][-1]['nodeCount'],'Changed actual source inventory')
    templates=[]
    for t in base['templates']:
        p=next(r for r in replay['remainderChecks'] if r['key']==t['key']);s=stages[t['key']]
        require(p['pass'] and len(p['checks'])==54 and p['modes']==list(range(-4,5)) and all(c['pass'] for c in p['checks']) and
                p['actualDirectMinusDecomposedRecomputed'] and p['declaredZeroDefectNeverTrusted'] and not p['extraSourceRelationsAssumed'] and
                s['update']['newQuadraticRemainderRetained'] and s['update']['oldFlatResidualRetained'] and
                s['finiteInventory']['discarded']==[] and s['stateTransition']['completePressureAndVelocityExactEquality'],'Omitted actual residual or mode')
        templates.append({'key':t['key'],'sign':t['sign'],'levelDifference':t['levelDifference'],'lift':t['lift'],'phase':t['phase'],'k':t['k'],
            'originalSourceRows':t['originalSourceRows'],'oldFlatResidual':t['oldFlatResidual'],'forced':[force_summary(f) for f in t['forced']],
            'updatedWaveRows':t['waveRows'],'nextAngularSource':[r for r in s['waveResidual'] if r['m']!=0],
            'finiteInventory':{**s['finiteInventory'],'maximumInputAbsoluteMode':2,'maximumUpdatedVelocityAbsoluteMode':2,
                'maximumNextResidualAbsoluteMode':4,'discardedAngularTailBound':'0','boundScope':'This complete finite angular registry only.'},
            'coefficientVerification':{k:v for k,v in p.items() if k not in ['key','checks']},'coefficientChecks':compact_checks(p['checks']),
            'fullCovariance':{'modes':t['covariance']['modes'],'values':t['covariance']['values'],
                             'allFinitePairsRetained':t['covariance']['allFinitePairsRetained'],'checks':compact_checks(t['covariance']['checks'])},
            'support':{'waveSystems':t['support']['waveSystems'],'waveJetCount':len(t['support']['waveJets']),
                       'checks':compact_checks(t['support']['checks']),'wholeMeanCoefficientKept':t['support']['wholeMeanCoefficientKept'],
                       'conclusion':t['support']['conclusion']},'completeStateEquality':compact_checks(s['stateTransition']['verification']['checks'])})
    mean={'refreshedMeanPressure':base['latestMean']['pressure']['value'],'globalMeanIncrement':base['pressureDifference'],
          'oldNormalizedMeanPressure':base['templates'][0]['oldMeanRows'][0]['pressure']['real'],
          'newNormalizedMeanPressure':base['newLocalMeanPressure'],'normalizedMeanIncrement':base['localPressureDifference'],
          'fullCurrentCovariance':{k:f['root'] for k,f in base['covarianceFields'].items()},'checks':compact_checks(base['latestMean']['checks']),
          'reconstruction':base['latestMean']['pressure']['fullReconstructionEquation'],
          'completeGlobalCurrentCertificateAvailable':False,'totalGlobalPressureExpressionInSavedSnapshot':None}
    summary={'schema':'MathScope.N6.SavedForcedAngularSubstepArchiveSummary/1','source':base['source'],'coordinates':initialized['coordinates'],
             'referenceNormalization':initialized['reference'],'templates':templates,'mean':mean,
             'graph':{'sha256':replay['observedSourceGraphSHA256'],'nodeCount':replay['observedSourceGraphNodeCount'],
                      'hashDefinition':'SHA256 of every exact UTF8 [id,node] row in the chained snapshots.',
                      'completeCurrentCertificateGraphClaimed':False},
             'assembly':{'allOriginalSourceLabels':81,'signedSourceContributions':162,'exactPositiveSourceSystems':20,'exactNegativeConjugateSolutionRoutes':20,
                         'all162CovarianceContributionsVerified':all(f['contributions']==162 for f in base['covarianceFields'].values()),
                         'fullMeanWaveProductsRetained':True,'allOriginalCoverMapsRetained':True},
             'checks':compact_checks(replay['checks']),'integerExpressionRootsAreNotNumericalValues':True,'fullActualFormulaProgramEmbedded':False}
    refs={Path(r['path']).name:r for r in gate['artifacts']}
    scope={'actualCurrentForcedExecutionRecorded':True,'individualN603OperatorCriteriaSatisfied':True,'allCurrentFiniteAngularModesRetained':True,
           'freshFullMeanPressureConstructed':True,'all11ExactSourceGraphSnapshotsVerified':True,'actualSavedSourceCoefficientComparisonsReplayed':540,
           'finiteAngularDiscardedTail':'0','zeroTailAppliesOnlyToThisFiniteAngularInventory':True,'originalCombinedGatePass':False,
           'completeGlobalCurrentCertificateRecovered':False,'privateSourceAuthorityHydrated':False,'fullMixedDerivativeClosureAudited':False,
           'wholeIndependentPDEComparisonExecuted':False,'numericWholeFieldEnclosure':False,'inputForcingUniformClassNormsCertified':False,
           'completeFourStepCycle':False,'initializedJ0':False,'allCorrectionStagesConstructed':False,'completeN6':False,'wholeM3Complete':False}
    return {'schema':'MathScope.N6.GlobalForcedCurrentArchive/2','receipt':receipt,'artifact':refs['replay.json'],'artifacts':gate['artifacts'],
            'originalConstructionReceipt':original_ref,'originalConstructionArtifacts':original['artifacts'],
            'sourceSnapshotIndex':row(root,ATTEMPT/'checkpoint-index.json'),'sourceSnapshotIndexURL':URL+str(ATTEMPT/'checkpoint-index.json'),
            'fullArtifactURL':URL+str(REPLAY/'replay.json'),'fullArtifactEmbedded':False,'sourceSummaryOnly':True,'allRecordedArtifactBytesVerified':True,
            'sourceDependencyCapture':{**row(root,ATTEMPT/'source-bytes.json'),'fileCount':155},
            'gate':{**{k:v for k,v in gate.items() if k not in ['artifacts','schema']},
                    'resourceObservation':{'controllerRSSIsLauncherLowerBound':True,
                        'actualWorkerRSSSampleMaximumBytes':max(map(int,re.findall(r'"rssBytes":(\d+)',contents['node.log'].decode()))),
                        'actualWorkerPeakRSSCompletelyObserved':False,'hardV8OldSpaceMiB':3072,
                        'wholeWorkerAddressSpaceLimitIndependentlyObserved':False,
                        'explanation':'The local controller PID observes a launcher. Exact Node RSS samples are retained, but they are not a continuously observed peak.'}},
            'originalConstructionGate':{k:original[k] for k in ['pass','command','startedAt','finishedAt','elapsedSeconds','exitCode','stoppedReason',
                'nodeTests','sourceFileCount','sourceFilesUnchanged','timeoutSeconds','observedPeakSourceWorkerFamilyRSSBytes']},
            'independent':{'artifact':refs['independent.json'],'checkCount':independent['checkCount'],'arithmetic':independent['arithmetic'],
                          'actualSourceBound':True,'actualSavedStageBound':True,'actualWholeCurrentCertificateBound':False,
                          'floatingPointUsed':False,'allOrderSourceClassOrNumericalEnclosureProved':False},
            'priorFailedAttempts':historical(root),'summary':summary,'scope':scope,
            'literalAcceptance':{'row':'N6-03','criteriaSatisfied':True,'actualInput':'The actual temporal-before-five-moment current and its refreshed pressure.',
                'evidence':['Every current nonzero source mode on all ten original signed integer lifts is retained.',
                    'All20 zero-data (7.13) inverses retain their whole H_w source and complete normal pressure.',
                    'The original cutoff potential and full mapped curl are recomputed from saved derivative bodies.',
                    'All540 coefficient identities retain every mode from -4 through4, old flat terms and new quadratic terms.',
                    'All155 original source files and11complete exact graph snapshots remain unchanged.'],
                'packageCompletionInferred':False,'initializedJ0Inferred':False,'wholeIndependentPDEComparisonInferred':False,
                'uniformFourierOrVolterraTailSetToZero':False,'failedCombinedGatePromoted':False,'missingFinalCurrentCertificateFabricated':False}}
def source_paths(root=ROOT):
    """Return every byte-bound input for the extended release manifest.

    The archive verifier reads compressed bytes and their complete header,
    plus the already observed exact replay receipts. It never expands or
    replays the four-million-node formula graph during a site build.
    """
    root=Path(root);value=archive(root)
    capture=json.loads((root/REPLAY/'input-verification.json').read_text())
    original=json.loads((root/ATTEMPT/'source-bytes-before.json').read_text())['files']
    replay=json.loads((root/REPLAY/'source-before.json').read_text())
    refs=[value['receipt'],value['originalConstructionReceipt'],value['sourceDependencyCapture'],
          value['sourceSnapshotIndex'],*value['artifacts'],*capture['files'],*original,*replay,
          *[r['receipt'] for r in value['priorFailedAttempts']]]
    result={root/r['path'] for r in refs}
    result.update(root/REPLAY/'sources'/r['path'] for r in replay)
    result.update([root/ATTEMPT/'source-bytes-before.json',root/BASE/'tests/build-global-forced-current-evidence.py'])
    return sorted(result)

def build(root=ROOT,check=False):
    value=archive(root);sha=SHARED.javascript_digest(value)
    output=('// Generated from complete replay of immutable saved actual forced stages.\n'
            'export const GLOBAL_FORCED_CURRENT_ARCHIVE_SHA256 = '+json.dumps(sha)+';\n'
            'export const GLOBAL_FORCED_CURRENT_ARCHIVE = '+json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False)+';\n')
    target=Path(root)/TARGET
    if check:require(target.exists() and target.read_text()==output,'Stale saved-source archive')
    else:target.write_text(output,encoding='utf8',newline='\n')
    return {'archiveSHA256':sha,'generatedBytes':len(output.encode()),'sourceFiles':155,'replaySourceFiles':value['gate']['sourceFileCount'],
            'actualCoefficientComparisons':540,'actualScalarIdentities':value['gate']['actualScalarIdentities'],'independentChecks':value['independent']['checkCount'],
            'historicalFailedAttempts':3,'sourceGraphNodes':value['summary']['graph']['nodeCount'],'originalCombinedGatePass':False,
            'wholeCurrentCertificateRecovered':False,'literalN603Satisfied':True,'fullArtifactEmbedded':False,'completeN6':False,'checkOnly':check}
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args();print(json.dumps(build(check=args.check)))
