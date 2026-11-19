"""Genuine old-source operand replay plus strict negative controls for new intake."""
from argparse import ArgumentParser
from copy import deepcopy
from pathlib import Path
from tempfile import TemporaryDirectory
import json

from source_stream import MANIFEST, Native, SourceStream, need, read
from verify_spatial_artifact import (ARCHIVE, COMMIT, GROUPS, GUARD, INGRESS, JETS, REF, RUN,
                                     check_ingress, readback)
from verify_spatial_structure import source_geometry, verify_means


class JoinedArchive:
    def __init__(self, base, delta):
        self.base=base
        self.delta=delta
        self.prefix=base.count
        self.count=self.prefix+len(delta)

    def record(self,index):
        return self.base.record(index) if index < self.prefix else self.delta[index-self.prefix]

    def args(self,index,operation):
        row=self.record(index)
        need(row['op']==operation,f'archived joined node {index} expected {operation}')
        return row['args']

    def rational(self,index):
        from fractions import Fraction
        n,d=self.args(index,'rational')
        return Fraction(int(n),int(d))


def archive_operands(archive, evidence, scratch):
    guide,_=read(evidence/'first-gauge/corrected-gauge-replay.json',
      'c61446ae5c0928c9c5b4a342dffc9403d7aa5b9138209d1edf8bc21623816a6a')
    m,_=read(archive/MANIFEST)
    need(all(m[k]==v for k,v in ARCHIVE.items()),'old genuine archive pins')
    native=Native(archive,m)
    delta,_=read(evidence/'first-gauge/first-gauge-native-delta.json',
      '039e655f25d7992bfb56702dcb0b072be05f93bf56661af7ed5a7580ed8c69f8')
    temporal,five=guide['temporal'],guide['FiveMap']
    with SourceStream(archive,m,m['node_count'],scratch) as graph:
        inverse_roots=temporal['exactInverses']
        bodies=[native.application(graph,i)[0]['body'] for i in inverse_roots]
        synthetic_ref={'stages':[None,None,None,{'inverses':inverse_roots}]}
        inputs={'input':{'meanPotentials':[temporal['actualPsi'],five['usedPsi']],
                         'azimuthalSwirls':[temporal['directDeltaV'],five['directDeltaV']],
                         'temporalRawCenteredSources':bodies,'temporalDesiredAxial':4454011,
                         'fiveWhole':five['whole'],'fiveCompactCandidate':five['compactCandidatePsi']}}
        checked=verify_means(graph,native,inputs,synthetic_ref,622802)
        need(checked['fiveOriginalPrimitive']==five['partial'],'genuine FiveMap primitive')
        need(checked['temporalLeftAndWhole']==[temporal['T1']['left'],temporal['T1']['whole']],
             'genuine shifted T1 operands')
        require_reject(lambda: changed_means(graph,native,inputs,synthetic_ref,'temporalRawCenteredSources',
                       list(reversed(bodies))), 'wrong Temporal raw binder body')
        require_reject(lambda: changed_means(graph,native,inputs,synthetic_ref,'fiveWhole',
                       five['partial']), 'FiveMap left integral substituted for whole')
        joined=JoinedArchive(graph,delta['nodeDelta'])
        record={'wave':{'Q':622794,'A':23,'potentialScale':4456996,
                'referenceArguments':guide['exactNativeOwnReferenceScaling'][0]['actualOwnArguments']}}
        archived_field=delta['nativeRegistryDelta'][1][0]
        geometry=source_geometry(joined,record,archived_field)
        need(geometry['rho']==3675262 and geometry['R']==622802,'known genuine source geometry')
        bad=deepcopy(record)
        bad['wave']['referenceArguments'][1]=bad['wave']['referenceArguments'][0]
        require_reject(lambda: source_geometry(joined,bad,archived_field),'axial and radial scale substitution')
        checked['genuineMixedReferenceScale']=geometry
    return checked


def changed_means(graph,native,data,ref,key,value):
    altered=deepcopy(data)
    altered['input'][key]=value
    verify_means(graph,native,altered,ref,622802)


def require_reject(action, description):
    try:
        action()
    except (TypeError,KeyError,ValueError):
        return
    raise ValueError('negative control did not fail: '+description)


def fixture(reference):
    prefix=reference['split']['nodeCount']
    modes=[]
    for d in range(5):
        for s in (1,-1):
            modes.append({'key':f'{d}:{s}','sign':s,'phase':100,'k':101,'transverse':102,'pulse':103,
                          'potential':[{'m':m,'real':[90,91,92],'imaginary':[93,94,95]} for m in (1,2)]+
                          [{'m':1,'real':[0,0,0],'imaginary':[97,98,99]}]})
    numbers=iter(range(prefix,prefix+150))
    vector=lambda:[next(numbers),next(numbers),next(numbers)]
    groups={'U':vector(),'G_U':[vector() for _ in range(3)],'A':vector(),'G_A':[vector() for _ in range(3)]}
    compact=next(numbers)
    return {'schema':'MathScope.N7.ActiveN3FirstCorrectionSpatialIngressCandidate/1',
            'originalPrefix':prefix,'materializedNodes':prefix+150,'sameLiveOriginalSourceAsserted':True,
            'sourceReferenceReceiptSHA256':REF,'guardOverlaySHA256':GUARD,'mode':'full-source',
            'sameRunDirectSplitOutcome':'FAILED','completeNativeExport':None,'normalizedRoots':groups,
            'gaugeDifferenceRootsForIndependentCheck':vector(),'physicalMultipliers':GROUPS,
            'spatialJetAtoms':[{'label':k,'multiplier':v,'root':next(numbers)} for k,v in JETS.items()],
            'scope':{'allLabelNormsCertified':False,'candidateCurlEquivalenceVerified':False,
                     'nativeDependencyGraphExternallyExported':False,'finalJets':0,'N706':'OPEN','N805':'OPEN','release':'HOLD'},
            'input':{'latest':reference['stages'][5]['velocity'],'initialized':[200,201,202],
                     'meanPotentials':[210,211],'azimuthalSwirls':[220,221],'directSwirl':next(numbers),
                     'temporalRawCenteredSources':[230,231],'temporalDesiredAxial':232,
                     'fiveWhole':240,'fiveCompactCandidate':241},
            'wave':{'Q':250,'A':251,'referenceArguments':list(range(260,276)),'potentialScale':280,
                    'sameExistingForceAndSignedRowMaps':162,
                    'indexed':[{'field':f'coupled-field:{i}','root':j} for i,j in
                               enumerate([groups['A'][0],compact,groups['A'][2]])],
                    'perTemplate':modes}}


def intake_controls(reference_path,scratch):
    reference,_=read(reference_path,REF)
    good=fixture(reference)
    check_ingress(good,reference)
    variants={
        'duplicate jet label': lambda x: x['spatialJetAtoms'][1].update(label=x['spatialJetAtoms'][0]['label']),
        'b_s wrong Q exponent': lambda x: next(row for row in x['spatialJetAtoms'] if row['label']=='b@1,0,0').update(multiplier='Q^(-A-1/2)'),
        'promoted gauge claim': lambda x: x['scope'].update(candidateCurlEquivalenceVerified=True),
        'wrong same-live current': lambda x: x['input'].update(latest=x['input']['initialized']),
        'deleted tensor cell': lambda x: x['normalizedRoots']['G_U'][0].pop(),
        'false row provenance': lambda x: x['wave'].update(sameExistingForceAndSignedRowMaps=161),
        'original prefix shifted': lambda x: x.update(originalPrefix=x['originalPrefix']-1),
        'candidate compact substituted': lambda x: x['input'].update(fiveCompactCandidate=x['input']['fiveWhole']),
    }
    for label,edit in variants.items():
        variant=deepcopy(good)
        edit(variant)
        require_reject(lambda: check_ingress(variant,reference),label)
    with TemporaryDirectory(dir=scratch) as part:
        d=Path(part)
        def write(name, data):
            (d/name).write_text(json.dumps(data)+'\n',encoding='utf8')
        # Artificial metadata mirrors the exact schema but is never emitted as evidence.
        write('run.json',{'databaseId':RUN,'headSha':COMMIT,'status':'completed','conclusion':'failure'})
        base=readback(d,reference_path,None,None,None,scratch)
        need(base['status']=='PARTIAL_NO_FIRST_CYCLE_SOURCE_RECEIPT','empty artifact variant')
        write('first-cycle.json',{**reference,'status':'STOPPED_DURING_FIRST_CYCLE',
                                  'stages':reference['stages'][:2],'currentStage':'synthetic',
                                  'error':{'name':'test','message':'synthetic fixture'}})
        part_result=readback(d,reference_path,None,None,None,scratch)
        need(part_result['status']=='PARTIAL_FIRST_CYCLE_SOURCE_CONSTRUCTION','partial first-cycle variant')
        write('first-cycle.json',reference)
        part_result=readback(d,reference_path,None,None,None,scratch)
        need(part_result['status']=='PARTIAL_ORIGINAL_CYCLE_WITHOUT_SPATIAL_INGRESS','construction only variant')
        write(INGRESS,good)
        part_result=readback(d,reference_path,None,None,None,scratch)
        need(part_result['status']=='PARTIAL_SPATIAL_INGRESS_METADATA_WITHOUT_COMPLETE_NATIVE_READBACK'
             and len(part_result['missingSourceFiles'])==4 and part_result['gaugeEquivalence']=='OPEN',
             'record only variant')
    return list(variants)


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for name in ('goal','archive','reference','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    a=parser.parse_args()
    controls=intake_controls(a.reference,a.out.parent)
    means=archive_operands(a.archive,a.goal,a.out.parent)
    result={'status':'VERIFIED_READBACK_SCHEMA_AND_AUTHENTIC_ARCHIVED_OPERAND_CONTROLS',
            'negativeIntakeCases':controls,'partialArtifactCases':4,
            'archivedN1Means':means,'archiveNegativeCases':3,'liveN3Replayed':False,'release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as file:
        json.dump(result,file,indent=2)
        file.write('\n')
    print('PASS genuine old-source Temporal/FiveMap and mixed-reference operands, 11 negative and 4 partial artifact controls')
