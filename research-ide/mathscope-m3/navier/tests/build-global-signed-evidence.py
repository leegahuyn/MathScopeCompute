"""Package the actual all-cover signed operator without enlarging its scope."""
from pathlib import Path
import argparse,gzip,hashlib,importlib.util,json,re

ROOT=Path(__file__).resolve().parents[4]
BASE=Path('research-ide/mathscope-m3/navier')
ATTEMPT=BASE/'evidence/global-signed-20261012/attempt1'
TARGET=BASE/'source-global-signed-evidence-data.mjs'
RECEIPT_SHA='0db5178978e2587d142032b606b7c1e59e2c6d66dc078c884d26618745ed4232'
ARTIFACT_SHA='7876762c6e1b134a16bdf36a25afe7fcb33ca8ef1cfd4b94488c675a91ffea6c'
SPEC=importlib.util.spec_from_file_location('signed_archive_bytes',ROOT/BASE/'tests/build-near-terminal-evidence.py')
SHARED=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(SHARED)
sha=lambda raw:hashlib.sha256(raw).hexdigest()

def archive(root=ROOT):
 root=Path(root);receipt_raw=(root/ATTEMPT/'receipt.json').read_bytes()
 if sha(receipt_raw)!=RECEIPT_SHA:raise ValueError('The immutable signed source receipt changed')
 receipt=json.loads(receipt_raw)
 if not(receipt['pass'] is True and receipt['exitCode']==0 and receipt['stoppedReason'] is None
        and receipt['nodeTests']=={'passed':13,'failed':0} and receipt['sourceFilesUnchanged']
        and receipt['sourceFileCount']==230 and receipt['actualAllCoverSignedExpressionClosureExecuted']
        and all(receipt[k] is False for k in ['originalN604Complete','allOrderSourceClassBoundCertified','newLeanExecuted','wholeM3Complete'])):
  raise ValueError('The observed signed operator gate or its recorded scope changed')
 refs={Path(r['path']).name:r for r in receipt['artifacts']}
 if set(refs)!={'node.log','source-bytes.json','global-signed.json'}:raise ValueError('Missing signed artifacts')
 capture=json.loads(SHARED.verified_file(root,refs['source-bytes.json']))
 if not(capture['unchanged'] and capture['before']==capture['after'] and len(capture['after'])==230):
  raise ValueError('The original signed source dependency capture changed')
 for row in capture['after']:SHARED.verified_file(root,row)
 log=SHARED.verified_file(root,refs['node.log']).decode()
 if len(re.findall(r'^ok \d+ - ',log,re.M))!=13 or re.search(r'^not ok ',log,re.M):raise ValueError('Signed raw log is not13 passing tests')
 packing_path=BASE/'evidence/packed-evidence.json';packing=json.loads((root/packing_path).read_bytes())
 items=[r for r in packing['artifacts'] if r['original']==refs['global-signed.json']]
 if len(items)!=1:raise ValueError('Lossless original signed artifact is not bound')
 packed=items[0]
 if packed['receipt']!={'path':str(ATTEMPT/'receipt.json'),'sha256':RECEIPT_SHA}:raise ValueError('Packing receipt is not the original source gate')
 encoded=SHARED.verified_file(root,packed['packed']);raw=gzip.decompress(encoded)
 if sha(raw)!=ARTIFACT_SHA or len(raw)!=refs['global-signed.json']['bytes']:raise ValueError('Packed artifact no longer reproduces exact observed bytes')
 audit=json.loads(raw);source=audit['source'];identity=source['assembly']['identity']
 if not(audit['actualSourceBodiesExecuted'] and all(c['pass'] for c in audit['checks']+source['checks'])
        and len(source['checks'])==32 and audit['graph']['nodeCount']==1992631
        and identity['exactGlobalBilinearIdentityOnDeclaredAtlas'] and len(identity['completePrimaryRows'])==81
        and len({r['key'] for r in identity['completePrimaryRows']})==81
        and source['source']['newTargetOrWeightsAccepted'] is False
        and source['scope']['actualGlobalBilinearIdentity'] and source['scope']['allThreeActualGlobalCovarianceRemaindersConstructed']
        and audit['uniformAllOrderClassBoundCertified'] is False and audit['originalN604Complete'] is False):
  raise ValueError('Actual complete-cover signed identity or historical limitations changed')
 for row in source['rows']:
  if not(row['fixedOriginalH']==source['source']['originalH'] and row['fixedOriginalA'] in source['source']['fixedOriginalA']
         and row['noFreshSquareRootOfSignedTarget'] and row['expansion']['allThreeRemaindersRetained']
         and all(c['pass'] for c in row['expansion']['checks']+row['checks'])):
   raise ValueError('Original signed amplitudes or one of the three actual remainders changed')
 summary={k:v for k,v in source.items() if k not in ['sourceCurrent','assembly']}
 summary['recordedCertificateSchema']=summary.pop('schema')
 summary['schema']='MathScope.N6.GlobalSignedOperatorSummary/1'
 summary['identity']=identity
 return {'schema':'MathScope.N6.GlobalSignedArchive/1','recordedOnly':True,
  'receipt':{'path':str(ATTEMPT/'receipt.json'),'sha256':RECEIPT_SHA,'bytes':len(receipt_raw)},
  'artifact':refs['global-signed.json'],'packedArtifact':packed['packed'],
  'fullArtifactURL':'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-resume-20261012/'+packed['packed']['path'],
  'packingInstructionsURL':'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-resume-20261012/'+str(BASE/'evidence/PACKED_EVIDENCE.md'),
  'gate':receipt,'sourceCapture':refs['source-bytes.json'],'sourceFileCount':230,
  'summary':summary,'derivativeAudit':{k:v for k,v in audit.items() if k not in ['source','closure','kernel']},
  'fullArtifactEmbedded':False,'sourceSummaryOnly':True,
  'sourceValidation':{'allCapturedSourceBytesMatch':True,'allRecordedArtifactBytesMatch':True,'losslessRawArtifactVerified':True},
  'scope':{'actualAllCoverSignedOperatorRecorded':True,'historicalCriterionFlagPreserved':False,
   'historicalFlagIsNotCurrentAssessment':True,'currentAssessmentPath':'research-ide/mathscope-m3/N6_PROGRESS.json',
   'allOrderSourceClassesCertified':False,'initializedJ0':False,'fullAuxiliaryPressureConstructed':False,
   'numericalFieldEnclosureComputed':False,'completeN6':False,'wholeM3Complete':False,'newLeanExecuted':False}}

def source_paths(root=ROOT):
 root=Path(root);value=archive(root);capture=json.loads((root/value['sourceCapture']['path']).read_bytes())
 return [root/ATTEMPT/'receipt.json',root/ATTEMPT/'node.log',root/value['sourceCapture']['path'],
         root/value['packedArtifact']['path'],root/BASE/'evidence/packed-evidence.json',
         root/BASE/'tests/verify-packed-evidence.py',root/BASE/'evidence/PACKED_EVIDENCE.md']+[root/r['path'] for r in capture['after']]

def build(root=ROOT,check=False):
 value=archive(root);digest=SHARED.javascript_digest(value)
 output=('// Generated from the exact observed signed source gate; historical scope flags are preserved.\n'
  +'export const GLOBAL_SIGNED_ARCHIVE_SHA256 = '+json.dumps(digest)+';\n'
  +'export const GLOBAL_SIGNED_ARCHIVE = '+json.dumps(value,ensure_ascii=False,separators=(',',':'))+';\n')
 target=Path(root)/TARGET
 if check:
  if not target.exists() or target.read_text()!=output:raise ValueError('Stale generated all-cover signed archive')
 else:target.write_text(output,encoding='utf-8',newline='\n')
 return {'archiveSHA256':digest,'generatedBytes':len(output.encode()),'sourceFiles':230,'sourceTests':13,
         'sourceGraphNodes':1992631,'fullArtifactEmbedded':False,'checkOnly':check}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
 print(json.dumps(build(check=args.check)))
