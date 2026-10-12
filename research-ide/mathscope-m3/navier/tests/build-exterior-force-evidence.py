#!/usr/bin/env python3
"""Package a compact browser record only after the complete source gate."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parents[4]
BASE=Path('research-ide/mathscope-m3/navier')
ATTEMPT=BASE/'evidence/source-exterior-force-jets-20261012/attempt2'
TARGET=BASE/'source-exterior-force-evidence-data.mjs'
EXPECTED_RECEIPT_SHA256='90300bc80176119ab93e1613aeb7071702f7724244f14eb21e8078c18129a0c7'
EXPECTED_DOMAIN_SHA256='1350acb65cae056f094e8d90dd557d0b44d1c5f51d55149b2aa1089f9ed2ae5c'
EXPECTED_EXTERIOR_SHA256='c02ef50a4dd56571b2c8a63cc8f18185386516970b529c6f4a07a0847ac980da'
def canonical(value):return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def pin(path,root=ROOT):return {'path':str(path.relative_to(root)),'sha256':sha(path),'bytes':path.stat().st_size}
def read(path):return json.loads(path.read_text())
def javascript_digest(value):
    code="""import {createHash} from 'node:crypto';let raw='';for await(const c of process.stdin)raw+=c;
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
process.stdout.write(createHash('sha256').update(canonical(JSON.parse(raw))).digest('hex'));"""
    return subprocess.check_output(['node','--input-type=module','-e',code],input=json.dumps(value,ensure_ascii=False),text=True).strip()

def verified_file(root,row):
    relative=Path(row['path']);path=(root/relative).resolve()
    if relative.is_absolute() or '..' in relative.parts or not path.is_relative_to(root.resolve()) or not str(relative).startswith('research-ide/'):
        raise ValueError('A recorded source path escaped the repository.')
    if pin(path,root.resolve())!=row:raise ValueError('Executed source or artifact bytes changed: '+str(relative))
    return path.read_bytes()

def archive(root=ROOT):
    root=Path(root).resolve();out=root/ATTEMPT
    receipt_path=out/'receipt.json';receipt=read(receipt_path)
    if not all([EXPECTED_RECEIPT_SHA256,EXPECTED_DOMAIN_SHA256,EXPECTED_EXTERIOR_SHA256]):raise ValueError('Successful observed artifact hashes have not been pinned yet.')
    if sha(receipt_path)!=EXPECTED_RECEIPT_SHA256:raise ValueError('The fixed successful source receipt changed.')
    if not receipt.get('pass') or receipt['exitCode']!=0 or receipt['nodeTests']!={'passed':11,'failed':0,'skipped':0} or receipt['independentStatus']!='PASS':
        raise ValueError('The source gate did not pass all required tests.')
    if receipt['attempt']!=2 or receipt['stoppedReason'] is not None:raise ValueError('The fixed successful source attempt was changed.')
    source_path=out/'source-bytes.json';capture=read(source_path)
    if not capture['unchanged'] or capture['before']!=capture['after']:raise ValueError('Source changed during its observed execution.')
    before=read(out/'source-bytes-before.json')
    if before['files']!=capture['before'] or before['fileCount']!=receipt['sourceFileCount'] or len(capture['after'])!=receipt['sourceFileCount']:
        raise ValueError('The complete dependency capture is inconsistent.')
    for row in capture['after']:
        verified_file(root,row)
    for row in receipt['artifacts']:verified_file(root,row)
    log=(out/'node.log').read_text();independent=read(out/'independent-fraction.json')
    if len(re.findall(r'^ok \d+ - ',log,re.M))!=11 or re.search(r'^not ok ',log,re.M):raise ValueError('The raw test log does not contain eleven passing tests.')
    if independent['status']!='PASS' or len(independent['checks'])!=receipt['independentCheckCount'] or not all(row['pass'] for row in independent['checks']):
        raise ValueError('The independent exact checks are incomplete.')
    exterior_path=out/'exterior-force-jets.json';domain_path=out/'source-domain.json'
    if sha(exterior_path)!=EXPECTED_EXTERIOR_SHA256 or sha(domain_path)!=EXPECTED_DOMAIN_SHA256:raise ValueError('The fixed full domain or exterior artifact changed.')
    exterior=read(exterior_path);domain=read(domain_path)
    if exterior['sourceDomainBridge']!=domain or not all(row['pass'] for row in exterior['checks']+domain['checks']):
        raise ValueError('Domain/exterior artifacts disagree or include a failed check.')
    if domain['scope']['fullN6FinalPotentialsConstructed'] or exterior['scope']['wholeKEnergyNearTerminalComputed'] or exterior['scope']['wholeM3Complete']:
        raise ValueError('The stored execution does not have the required limited scope.')
    compact={key:value for key,value in exterior.items() if key not in ['formulaProgram','sourceDomainBridge']}
    full_program={'path':str(exterior_path.relative_to(root)),'sha256':sha(exterior_path),'bytes':exterior_path.stat().st_size,
                  'scalarProgramSHA256':exterior['graph']['scalarProgramSHA256'],'scalarNodeCount':len(exterior['formulaProgram']['nodes']),
                  'completeFormulaProgramIncludedInThisRecord':False,'fullArtifactRetainedInRepository':True}
    record={'schema':'MathScope.N7.SourceExteriorDomainArchive/1','recordedOnly':True,'freshSourceConstructorExecuted':False,
            'receipt':pin(receipt_path,root),'gate':receipt,'sourceCapture':pin(source_path,root),'sourceFiles':capture['after'],
            'domainArtifact':pin(domain_path,root),'exteriorArtifact':pin(exterior_path,root),'fullScalarProgram':full_program,
            'domain':domain,'exterior':compact,'independentVerification':independent,'packagingVerification':{'allExecutedSourceBytesMatch':True,'everyReceiptArtifactHashMatches':True,
              'observedGatePass':True,'duplicateInheritedScalarGraphEmbedded':False,'independentExactChecksPass':True},
            'scope':{'recordedOnly':True,'freshSourceConstructorExecuted':False,'fullFinalN6FieldsConstructed':False,
              'wholeLocalizedForceConstructed':False,'wholeKEnergyNearTerminalComputed':False,'globalForceExtensionConstructed':False,
              'wholeN7Complete':False,'wholeM3Complete':False,'newLeanExecuted':False}}
    return record

def source_paths(root=ROOT):
    root=Path(root).resolve();record=archive(root)
    rows=[record['receipt']]+record['gate']['artifacts']+record['sourceFiles']
    return sorted({root/row['path'] for row in rows}|{Path(__file__).resolve()})

def build(root=ROOT,check=False):
    root=Path(root).resolve();record=archive(root);encoded=canonical(record);digest=javascript_digest(record)
    target=root/TARGET
    output=('// Generated from a byte-verified observed source run. Full scalar graphs remain in the pinned repository artifacts.\n'+
            'export const SOURCE_EXTERIOR_DOMAIN_ARCHIVE = '+encoded+';\n'+
            'export const SOURCE_EXTERIOR_DOMAIN_ARCHIVE_SHA256 = '+json.dumps(digest)+';\n')
    if check:
        if not target.is_file() or target.read_text()!=output:raise ValueError('The generated source domain/exterior archive is stale.')
    else:target.write_text(output,encoding='utf-8',newline='\n')
    manifest={'schema':'MathScope.N7.SourceExteriorDomainArchiveBuild/1','sourceAttempt':2,'archiveSHA256':digest,'archiveCanonicalSHA256':digest,
              'output':pin(target,root),'generatedBytes':len(output.encode()),'sourceReceipt':record['receipt'],
              'domainArtifact':record['domainArtifact'],'exteriorArtifact':record['exteriorArtifact'],
              'sourceFiles':len(record['sourceFiles']),'sourceFileCount':len(record['sourceFiles']),'sourceFilesUnchanged':True,
              'builder':pin(Path(__file__).resolve(),ROOT),'check':check}
    if not check:(root/BASE/'evidence/source-exterior-force-jets-20261012/archive-build.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    print(json.dumps(build(check=args.check),ensure_ascii=False,indent=2))
