"""Independent ingestion and source graph audits for hosted active-N3 spatial roots."""
from argparse import ArgumentParser
from itertools import product
from pathlib import Path
import hashlib
import json

from source_stream import MANIFEST, REGISTRY, STREAM, Native, SourceStream, need, node_id, read


RUN = 44553053960
COMMIT = '6adb862667b0ce0e627843b253d6d94673a35164'
PR30 = 'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60'
REF = '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529'
GUARD = 'b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36'
SOURCE_SCOPE = 'ACTIVE_N3_FIRST_CORRECTION_SPATIAL_INGRESS_NOT_NUMERICAL'
ARCHIVE = {'executing_commit':'132a7804c5b7b8f579b816cf12de0e2a686ab8b0',
           'node_count':4456994,'node_stream_sha256':'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf',
           'definitions_sha256':'657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333'}
GROUPS = {'U':'Q^(-A)', 'G_U':'Q^(-A-1/2)', 'A':'Q^(1/2-A)', 'G_A':'Q^(-A)'}
INGRESS = 'first-correction-spatial-ingress.json'
EXPORT = 'first-correction-spatial-export.json'
SOURCE = 'first-correction-spatial-source'
FAILURE = 'first-correction-spatial-failure.json'
COMPACT = 'direct-split-arithmetic-closure.json'
COMPACT_MANIFEST = 'direct-split-arithmetic-manifest.json'
SPLIT = 'independent-direct-split.json'
PRIOR_COMPACT_SHA = '51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a'
ORDER = ['U','G_U','A','G_A']
JETS = {
    f'A{component}@{a},{b},{c},0': f'Q^(1/2-A-{a+b+c}/2)'
    for component in range(3) for a,b,c in product(range(3),repeat=3) if a+b+c <= 2
}
JETS.update({'b@0,0,0':'Q^(-A-1/2)', 'b@1,0,0':'Q^(-A-3/2)', 'b@0,1,0':'Q^(-A-1)'})


def canonical_cycle(value):
    return {**value,'stages':[{k:v for k,v in row.items() if k!='rssBytes'} for row in value['stages']]}


def limit_status():
    return {'gaugeEquivalence':'OPEN','uniformWeightedEndpoints':'OPEN','N706':'OPEN',
            'N805':'OPEN','finalJets':0,'release':'HOLD'}


def roots_vector(values, count, size, detail):
    need(type(values) is list and len(values)==size and all(node_id(i,count) for i in values), detail)
    return values


def check_ingress(record, reference):
    prefix = reference['split']['nodeCount']
    total = record['materializedNodes']
    need(record['schema']=='MathScope.N7.ActiveN3FirstCorrectionSpatialIngressCandidate/1', 'ingress schema')
    need(record['sourceReferenceReceiptSHA256']==REF and record['guardOverlaySHA256']==GUARD, 'ingress original source pins')
    need(record['originalPrefix']==prefix and type(total) is int and prefix < total <= 35_000_000, 'original and appended node counts')
    need(record['sameLiveOriginalSourceAsserted'] is True, 'original authority claim absent')
    need(record['physicalMultipliers']==GROUPS, 'original physical U/A multipliers')
    need(record['mode'] in ('operands','full-source') and record['completeNativeExport'] is None, 'ingress mode')
    need(record['sameRunDirectSplitOutcome'] in ('VERIFIED','FAILED'), 'split outcome')
    expected_scope = {'allLabelNormsCertified':False,'candidateCurlEquivalenceVerified':False,
                      'nativeDependencyGraphExternallyExported':False,'finalJets':0,
                      'N706':'OPEN','N805':'OPEN','release':'HOLD'}
    need(record['scope']==expected_scope, 'ingress promotes open scope')
    groups = record['normalizedRoots']
    need(set(groups)==set(GROUPS), 'four energy root groups')
    operands = []
    for group in ORDER:
        values = groups[group]
        if group.startswith('G_'):
            need(type(values) is list and len(values)==3, f'{group} rows')
            for row in values:
                operands += roots_vector(row,total,3,f'{group} columns')
        else:
            operands += roots_vector(values,total,3,group)
    need(len(operands)==24, 'energy component count')
    need(all(id >= prefix for id in groups['U']+groups['A']), 'new increment and gauge roots must be in append')
    candidate = roots_vector(record['gaugeDifferenceRootsForIndependentCheck'],total,3,'gauge difference roots')
    need(len(set(candidate))==3 and all(id>=prefix for id in candidate), 'three distinct appended gauge defects')
    jets = record['spatialJetAtoms']
    if record['mode']=='full-source':
        need(type(jets) is list and len(jets)==33, 'full spatial jet inventory')
        need({row['label']:row['multiplier'] for row in jets}==JETS, 'jet label or power mismatch')
        jet_ids=[row['root'] for row in jets]
        roots_vector(jet_ids,total,33,'jet IDs')
    else:
        need(jets is None, 'operands mode unexpectedly has spatial jet assertions')
        jet_ids=[]
    inputs=record['input']
    need(inputs['latest']==reference['stages'][5]['velocity'],'same original latest physical velocity')
    for name in ('latest','initialized','meanPotentials','azimuthalSwirls','temporalRawCenteredSources'):
        roots_vector(inputs[name],prefix,3 if name in ('latest','initialized') else 2,name)
    for name in ('temporalDesiredAxial','fiveWhole','fiveCompactCandidate'):
        need(node_id(inputs[name],prefix),name)
    need(node_id(inputs['directSwirl'],total) and inputs['fiveWhole']!=inputs['fiveCompactCandidate'], 'direct swirl and FiveMap distinction')
    wave=record['wave']
    need(wave['sameExistingForceAndSignedRowMaps']==162, 'retained 162 modes and labels')
    roots_vector([wave['Q'],wave['A']],prefix,2,'physical chart inputs')
    need(node_id(wave['potentialScale'],total) and
         len(wave['referenceArguments'])==16 and
         all(node_id(i,total) for i in wave['referenceArguments']), 'complete fixed-reference substitution')
    need(len(wave['indexed'])==3 and [row['root'] for row in wave['indexed']]==[groups['A'][0],
         wave['indexed'][1]['root'],groups['A'][2]],'gauge component index roots')
    need(all(prefix <= row['root'] < total for row in wave['indexed']),'new gauge indexed roots')
    expected_keys={f'{d}:{s}' for d in range(5) for s in (1,-1)}
    templates=wave['perTemplate']
    need(len(templates)==10 and {row['key'] for row in templates}==expected_keys,'ten original templates')
    for row in templates:
        need(row['sign']==int(row['key'].split(':')[1]), 'template sign')
        roots_vector([row[k] for k in ('phase','k','transverse','pulse')],prefix,4,'frozen template roots')
        need([k['m'] for k in row['potential']]==[1,2,1], 'two Forced and one Signed positive modes')
        for term in row['potential']:
            roots_vector(term['real'],total,3,'three real potential components')
            roots_vector(term['imaginary'],total,3,'three imaginary potential components')
        need(row['potential'][-1]['real']==[0,0,0], 'Signed mode pure imaginary before pairing')
    direct = [inputs['temporalDesiredAxial'],*inputs['temporalRawCenteredSources'],inputs['fiveWhole'],inputs['fiveCompactCandidate']]
    return list(dict.fromkeys([*operands,*candidate,*jet_ids,*direct]))


def manifest_shape(manifest, commit, count, roots=None, scope=None):
    need(manifest['schema']=='MathScope.M3.SourceGraphReplayManifest/1', 'official export manifest schema')
    need(manifest['executing_commit']==commit and manifest['original_pr30_commit']==PR30, 'source commit pins')
    need(manifest['node_count']==count, 'source graph node count in manifest')
    need(manifest['exact_source_node_stream_preserved'] is True, 'exact stream preservation claim absent')
    need(manifest['release']=='HOLD' and manifest['actual_final_67_jets_certified']==0
         and manifest['final_all_cycle_A_b_p'] is False and manifest['all_order_math_proved'] is False,
         'source exporter promotes open scope')
    if roots is not None:
        need(manifest['original_root_ids']==roots, 'typed source roots disagree with ingress')
    if scope is not None:
        need(manifest['scope']==scope, 'source exporter scope mismatch')


def split_receipt(directory, ingress, reference):
    path=directory/SPLIT
    if not path.exists():
        return {'scope':'NO_COMPLETED_INDEPENDENT_DIRECT_SPLIT_RECORD',
                'producerReported':ingress['sameRunDirectSplitOutcome']}
    record, digest=read(path)
    needed=[*reference['split']['roots'],reference['split']['divergence']]
    roots=record['roots']
    need(record['firstCycleReceiptSHA256']==REF and record['zeroPolynomials']==4
         and roots['conservativeDifferences']+[roots['divergenceDifference']]==needed
         and record['actualConservativeResidualProvedZero'] is False,
         'independent direct split receipt changed')
    need(ingress['sameRunDirectSplitOutcome']=='VERIFIED', 'reported split mark contradicts complete artifact')
    return {'scope':'ACTUAL_DIRECT_SPLIT_FOUR_CHECKS_SEPARATE_FROM_GAUGE',
            'sha256':digest,'directControls':record['directResidualMonomials']}


def compact_prefix(graph,directory,reference,expected_closure=None):
    path,man=directory/COMPACT,directory/COMPACT_MANIFEST
    if not path.exists() or not man.exists():
        return {'scope':'NO_COMPLETE_SEPARATE_PREAPPEND_COMPACT_RECORD'}
    manifest,digest=read(man)
    need(manifest['schema']=='MathScope.PostFive.DirectSplitArithmeticClosureManifest/1'
         and manifest['firstCycleReceiptSHA256']==REF and manifest['sourceGraphNodes']==reference['split']['nodeCount']
         and manifest['originalPrivatePDESealRevalidated'] is True,'compact comparison manifest')
    need(canonical_cycle(manifest['currentReceipt'])==canonical_cycle(reference),'compact stable same-source first cycle')
    closure,closure_sha=read(path,manifest['closureSHA256'])
    need(expected_closure is None or closure_sha==expected_closure,'independent prior compact export pin')
    need(path.stat().st_size==manifest['closureBytes'] and len(closure['records'])==manifest['records'],'compact record inventory')
    need(closure['physicalVelocity']==reference['stages'][5]['velocity']
         and closure['physicalPressure']==reference['stages'][5]['pressure'],'compact physical source associations')
    previous=-1
    for row in closure['records']:
        index=row['originalId']
        need(node_id(index,graph.prefix) and index>previous,'compact original topological IDs')
        need(graph.record(index)==row['record'],f'preappend source record changed at {index}')
        previous=index
    return {'scope':'ALL_SAVED_PREAPPEND_COMPACT_RECORDS_MATCH','checkedRecords':len(closure['records']),
            'compactManifestSHA256':digest,'compactSHA256':closure_sha}


def optional_full_prefix(graph, native, previous_directory, scratch):
    if previous_directory is None:
        return {'scope':'NO_SEPARATE_COMPLETE_ORIGINAL_PREAPPEND_NODE_STREAM'}
    prev, pin=read(previous_directory/MANIFEST)
    need(prev['node_count']==graph.prefix,'complete previous export has unexpected prefix size')
    need(prev['original_pr30_commit']==PR30 and prev['exact_source_node_stream_preserved'] is True,
         'complete previous export provenance')
    with SourceStream(previous_directory,prev,graph.prefix,scratch,remember=False) as old:
        for field in ('originalPrefixRecordsSHA256','originalPrefixRecordBytes','originalPrefixRecords'):
            need(graph.verify[field]==old.verify[field], 'original complete preappend prefix changed')
    before_native=Native(previous_directory,prev)
    need(before_native.base_snapshot==native.base_snapshot,'nested original registry changed during append')
    added=[len(after)-len(old) for old,after in zip(before_native.coupled_groups,native.coupled_groups,strict=True)]
    need(added==[12,3,0,0,0],'actual added native registrations')
    need(all(before==after[:len(before)] for before,after in
             zip(before_native.coupled_groups,native.coupled_groups,strict=True)),
         'exact original coupled native registry prefix')
    return {'scope':'COMPLETE_ORIGINAL_PREAPPEND_NODE_RECORD_STREAM_IDENTICAL',
            'originalExportManifestSHA256':pin,'originalRecords':graph.prefix,
            'originalRegistrySHA256':before_native.pin,'newNativeRegistrations':added}


def run_metadata(path, artifact):
    candidate=path if path is not None else artifact/'run.json'
    result, pin=read(candidate)
    need(result['databaseId']==RUN and result['headSha']==COMMIT and result['status']=='completed'
         and result['conclusion'] in ('success','failure','cancelled','timed_out'),
         'wrong or unfinished independently retrieved hosted run')
    return {'id':RUN,'headSha':COMMIT,'conclusion':result['conclusion'],'metadataSHA256':pin}


def readback(directory, reference_path, metadata, prior, before, scratch):
    reference, _ = read(reference_path,REF)
    host=run_metadata(metadata,directory)
    receipt_path=directory/'first-cycle.json'
    result={'schema':'MathScope.N7.IndependentActiveN3SpatialReadback/1',
            'sourceReferenceReceiptSHA256':REF,'hostedRun':host,**limit_status()}
    if not receipt_path.exists():
        return {**result,'status':'PARTIAL_NO_FIRST_CYCLE_SOURCE_RECEIPT'}
    receipt, pin=read(receipt_path)
    result['firstCycleReadbackSHA256']=pin
    if receipt.get('status')!='VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION':
        need(receipt.get('status') in ('RUNNING','STOPPED_DURING_FIRST_CYCLE') and receipt.get('prefix')==3,
             'unexpected partial first-cycle receipt')
        need(receipt.get('sourceForcedNodeCount')==reference['sourceForcedNodeCount'],
             'partial current after a different original Forced source')
        rows=receipt['stages']
        expected=reference['stages'][:len(rows)]
        need(len(rows)<=len(reference['stages']) and
             canonical_cycle({'stages':rows})==canonical_cycle({'stages':expected}),
             'partial first-cycle source stage differs from original')
        return {**result,'status':'PARTIAL_FIRST_CYCLE_SOURCE_CONSTRUCTION',
                'reportedFirstCycleStatus':receipt['status'],'completedOriginalStages':len(rows),
                'currentStage':receipt['currentStage'],'error':receipt.get('error')}
    need(canonical_cycle(receipt)==canonical_cycle(reference),'successful first-cycle source receipts differ')
    ingress_path=directory/INGRESS
    if not ingress_path.exists():
        failure=read(directory/FAILURE)[0] if (directory/FAILURE).exists() else None
        return {**result,'status':'PARTIAL_ORIGINAL_CYCLE_WITHOUT_SPATIAL_INGRESS','spatialError':failure}
    ingress,ingress_pin=read(ingress_path)
    roots=check_ingress(ingress,reference)
    result.update(ingressSHA256=ingress_pin, mode=ingress['mode'], energyIngressRoots=24,
                  spatialJetLabels=len(ingress['spatialJetAtoms'] or []),
                  gaugeDifferenceRoots=ingress['gaugeDifferenceRootsForIndependentCheck'],
                  sameRunDirectSplit=split_receipt(directory,ingress,reference))
    src=directory/SOURCE
    required=[directory/EXPORT,src/MANIFEST,src/REGISTRY,src/STREAM]
    missing=[str(path.relative_to(directory)) for path in required if not path.exists()]
    if missing:
        return {**result,'status':'PARTIAL_SPATIAL_INGRESS_METADATA_WITHOUT_COMPLETE_NATIVE_READBACK',
                'missingSourceFiles':missing}
    need(ingress['mode']=='full-source','full export on operands-only run')
    exported,outer_pin=read(directory/EXPORT)
    manifest,manifest_pin=read(src/MANIFEST)
    need(exported['schema']=='MathScope.N7.ActiveN3SpatialExport/1'
         and exported['status']=='VERIFIED_SOURCE_RECORD_EXPORT_NUMERICAL_ENDPOINTS_OPEN'
         and exported['preferredExistingIngress']==INGRESS
         and exported['snapshot']==manifest and exported['roots']==roots,'source capture envelope and digest')
    manifest_shape(manifest,COMMIT,ingress['materializedNodes'],roots,SOURCE_SCOPE)
    native=Native(src,manifest)
    from verify_spatial_structure import check_spatial_structure
    with SourceStream(src,manifest,ingress['originalPrefix'],scratch) as graph:
        structural=check_spatial_structure(graph,native,ingress,reference)
        prefix_checks={'sameRunCompact':compact_prefix(graph,directory,reference),
                       'completePreappendExport':optional_full_prefix(graph,native,before,scratch)}
        if prior is not None:
            prefix_checks['priorCompact']=compact_prefix(graph,prior,reference,PRIOR_COMPACT_SHA)
        result.update(sourceStream=graph.verify,originalPrefixComparison=prefix_checks,typedSourceReadback=structural)
    return {**result,'status':'VERIFIED_ACTIVE_N3_SPATIAL_SOURCE_STREAM_AND_OPERAND_BINDINGS',
            'exportSHA256':outer_pin,'graphManifestSHA256':manifest_pin,'nativeSHA256':native.pin,
            'nativeGroupCounts':native.counts}


def archived_control(directory,scratch):
    manifest,pin=read(directory/MANIFEST)
    need(all(manifest[k]==v for k,v in ARCHIVE.items()),'genuine archive reference pin')
    manifest_shape(manifest,ARCHIVE['executing_commit'],ARCHIVE['node_count'],
                   scope='CORRECTED_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT')
    native=Native(directory,manifest)
    with SourceStream(directory,manifest,ARCHIVE['node_count'],scratch) as graph:
        pde=manifest['original_root_ids'][:4]
        for id in pde:
            graph.args(id,'add')
        verify=graph.verify
    return {'schema':'MathScope.N7.SpatialReadbackArchiveControl/1',
            'status':'VERIFIED_GENUINE_ARCHIVE_OFFICIAL_NODE_STREAM_AND_NATIVE_REGISTRY',
            'archiveManifestSHA256':pin,'sourceStream':verify,'nativeGroupCounts':native.counts,
            'nativeSHA256':native.pin,'originalVelocityAndPressureRoots':pde,
            'scope':'Old N1 exported-source control only, independent active-N3 evidence is separate.',
            **limit_status()}


def main():
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('--artifact',type=Path,required=True)
    parser.add_argument('--reference',type=Path)
    parser.add_argument('--run-json',type=Path)
    parser.add_argument('--prior-compact',type=Path)
    parser.add_argument('--preappend-export',type=Path)
    parser.add_argument('--scratch',type=Path)
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--archive-control',action='store_true')
    a=parser.parse_args()
    scratch=a.scratch or a.out.parent
    need(not a.out.exists(),'output already exists')
    if a.archive_control:
        result=archived_control(a.artifact,scratch)
    else:
        need(a.reference is not None,'main readback requires --reference')
        result=readback(a.artifact,a.reference,a.run_json,a.prior_compact,a.preappend_export,scratch)
    with a.out.open('x',encoding='utf8',newline='\n') as f:
        json.dump(result,f,indent=2)
        f.write('\n')
    print(json.dumps({'status':result['status'],'originalPrefixComparison':result.get('originalPrefixComparison')}))


if __name__=='__main__':
    main()
