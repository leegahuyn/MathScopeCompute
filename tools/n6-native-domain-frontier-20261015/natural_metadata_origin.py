"""Classify one conservative numeric-token overcapture from actual source.

The original extractor intentionally scans all integer tokens as potential IDs.
This probe accepts only the two exact CSelected^100000 exponent occurrences,
and rejects a real ordinary/native operand or a defining-body use of that ID.
"""
from __future__ import annotations
import argparse,hashlib,importlib.util,json
from pathlib import Path
from native_domain_extract import (argument_children,conservative_capture,NATIVE,
                                  STAGE3_PIN,G_ROOT,require,sha)
from natural_domain_proof import RAW_DIAGNOSTIC_PIN,FIXED_PIN,CALL_INVENTORY_PIN,TARGET_PIN

ID=100000
EXPECTED={('fixed',('source','parametersExactExpressions','sourceEnvelopeS','power',1)),
          ('fixed',('outer','parametersExactExpressions','sourceEnvelopeS','power',1))}

def occurrences(value,path=()):
    if type(value) is int:
        if value==ID:yield path
    elif isinstance(value,dict):
        for key,child in value.items():yield from occurrences(child,path+(key,))
    elif isinstance(value,(tuple,list)):
        for i,child in enumerate(value):yield from occurrences(child,path+(i,))
    elif isinstance(value,str) and value.lstrip().startswith(('{','[')):
        try:decoded=json.loads(value)
        except ValueError:return
        yield from occurrences(decoded,path+('<decodedJSON>',))

def classify(origins,native_args,parents,bodies,root=G_ROOT):
    actual={(row['definitionKey'],tuple(row['path'])) for row in origins}
    require(len(origins)==2 and actual==EXPECTED,'Numeric100000 has an unreviewed definition occurrence')
    require(not native_args,'Numeric100000 occurs in a native operation tuple')
    require(not parents,'Source100000 has an actual ordinary/native argument parent')
    require(not bodies,'Source100000 is a native defining-body root')
    require(root!=ID,'Source100000 is the actual requested root')
    return True

def controls():
    good=[{'definitionKey':key,'path':list(path)} for key,path in EXPECTED]
    changed=[('actual native operand',good,[{'source':123,'path':[1,0]}],[],[]),
             ('actual ordinary parent',good,[],[{'parent':123}],[]),
             ('actual defining body',good,[],[],['expression:0']),
             ('unreviewed metadata occurrence',good+[{'definitionKey':'fixed','path':['core','g']}],[],[],[])]
    rows=[]
    for label,*args in changed:
        try:classify(*args)
        except ValueError:rows.append({'name':label,'rejected':True})
        else:raise AssertionError('Accepted changed numeric origin '+label)
    return rows

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ['source-db','stage3','header','diagnostics','outer-range','out']:
        p.add_argument('--'+key,type=Path,required=True)
    a=p.parse_args()
    require(hashlib.sha256(a.stage3.read_bytes()).hexdigest()==STAGE3_PIN,'Changed inherited Stage3')
    spec=importlib.util.spec_from_file_location('metadata_origin_stage3',a.stage3)
    v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
    from header_binding import bind_header_to_gzip
    header,binding=bind_header_to_gzip(a.header.parent/'original-parent.ndjson.gz',a.header)
    raw=a.diagnostics.read_bytes();require(hashlib.sha256(raw).hexdigest()==RAW_DIAGNOSTIC_PIN,'Changed all533 diagnostic')
    domains=json.loads(raw);require(domains['headerBinding']==binding,'Changed authenticated header')
    reg=v3.registries(header);require(sha(reg['fixed'])==FIXED_PIN and sha(reg['expressionDefinitions'][21])==TARGET_PIN,'Changed actual source definitions')
    get=v3.Source(a.source_db)
    seen,defs,_=conservative_capture(get,reg,G_ROOT)
    require(len(seen)==136186 and len(defs)==84 and sha(sorted(seen))=='5d9e85d4b92e19947dc68a0f17b994ee8f95664440c962fbd0cb01b6cf49419a','Changed source capture')
    calls=domains['naturalCalls']
    require(len(calls)==533 and sha([(c['id'],c['nodeSHA256']) for c in calls])==CALL_INVENTORY_PIN,'Changed all533 inventory')
    for c in calls:require(sha(get(c['id']))==c['nodeSHA256'],'Changed actual natural source node')
    origins=[{'definitionKey':key,'path':list(path)} for key,definition in defs.items() for path in occurrences(definition)]
    native_args=[];parents=[]
    for ident in sorted(seen):
        node=get(ident)
        if ID in argument_children(node):parents.append({'parent':ident,'node':node})
        if node['op'] in NATIVE:
            native_args.extend({'source':ident,'path':list(path)} for path in occurrences(node['args']))
    bodies=[key for key,d in defs.items() if d.get('body')==ID]
    classify(origins,native_args,parents,bodies)
    fixed=reg['fixed'];expected={'power':[{'ref':'CSelected'},100000]}
    require(fixed['source']['parametersExactExpressions']['sourceEnvelopeS']==expected and
            fixed['outer']['parametersExactExpressions']['sourceEnvelopeS']==expected,'Changed literal source S exponent')
    gap_raw=a.outer_range.read_bytes();outer=json.loads(gap_raw)
    require(outer['schema']=='MathScope.N6.NaturalOuterDownwardRangeContracts/1','Wrong formal-range proof')
    require(outer['inputBindings']['rawDiagnosticsSHA256']==RAW_DIAGNOSTIC_PIN and
            outer['inputBindings']['authenticatedHeaderBinding']==binding and outer['inputBindings']['all533SourceCallsCompared'],
            'Changed source range proof bindings')
    gaps=outer['unprovedOuterContexts']
    require(len(gaps)==1 and gaps[0]['firstIntegral']==99417 and gaps[0]['naturalCalls']==[3910],
            'Additional unresolved actual contexts must not be discarded')
    require(gaps[0]['unattachedSources']==[{'source':100000,'path':[99417,100000],
             'reason':'No ordinary parent or reviewed explicit defining-body use in the conservative g closure.'}],
             'Changed remaining source use')
    require(99417 in argument_children(get(ID)),'Unattached source path no longer matches actual DAG')
    controls_rows=controls()
    result={'schema':'MathScope.N6.NaturalNumericOvercaptureClassification/1',
      'sourceHeaderBinding':binding,'stage3ModuleSHA256':STAGE3_PIN,
      'inputSHA256':{'diagnostics':RAW_DIAGNOSTIC_PIN,'outerRange':hashlib.sha256(gap_raw).hexdigest()},
      'all533OriginalCallHashesCompared':True,'conservativeCaptureNodes':len(seen),'capturedRegistryDefinitions':len(defs),
      'classifiedSourceID':ID,'originalSourceNode':get(ID),'originalFirstIntegralNode':get(99417),
      'originalNaturalCall3910':get(3910),'allDefinitionIntegerOrigins':origins,
      'actualOperandParents':parents,'nativeTupleOrigins':native_args,'nativeDefiningBodyRoots':bodies,
      'literalNumericMeaning':'Exponent100000 in sourceEnvelopeS=CSelected^100000; it is not a graph node reference.',
      'semanticClassification':'The sole incoming conservative references are these exact numeric exponent leaves. There is no ordinary/native actual-argument parent, native body root, or requested-root use. Hence source node100000 is overcapture of a numeric exponent.',
      'originalRangeGapPreserved':gaps[0],
      'derivedFormalContractCoverage':{'allUnattachedUsesClassified':True,'allOuterFormalRangeContractsProvedModuloExplicitCallerPremises':True},
      'strictNegativeControls':controls_rows,
      'remainingActualApplication':outer['remainingActualApplication'],
      'all533ActualCallerDomainsProved':False,'newOriginalGuardsDischarged':0,
      'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'numericExponentOvercaptureClassified':True,'actualAll533CallerDomainsProved':False,'newDischarged':0}))

if __name__=='__main__':main()
