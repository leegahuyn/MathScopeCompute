#!/usr/bin/env python3
"""Verify saved bytes and recorded outcomes; this does not close N1-06."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile
import argparse
import datetime
import hashlib
import json

HERE=Path(__file__).resolve().parent
def digest(data):return hashlib.sha256(data).hexdigest()
def read(path):return json.loads(path.read_text())
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
if args.output.exists():raise ValueError('Preservation receipts are not overwritten')
mapping=read(HERE/'source-mapping.json');checks=[]
def check(name,passed):checks.append({'name':name,'pass':bool(passed)})
paths=[]
for item in mapping['copiedFiles']:
 rel=PurePosixPath(item['destinationRelativePath'])
 valid=not rel.is_absolute() and '..' not in rel.parts and rel.parts[0]=='raw'
 check('canonical copied path '+str(rel),valid)
 if not valid:continue
 p=HERE/rel
 check('exact preserved bytes '+str(rel),p.is_file() and not p.is_symlink() and p.stat().st_size==item['bytes'] and digest(p.read_bytes())==item['sha256'])
 paths.append(str(rel))
actual=sorted(str(p.relative_to(HERE)) for p in (HERE/'raw').rglob('*') if p.is_file())
check('complete recorded copied file set',sorted(paths)==actual and len(paths)==len(set(paths))==mapping['copiedFileCount'])
check('complete copied byte total',sum(x['bytes'] for x in mapping['copiedFiles'])==mapping['copiedBytes'])
run=HERE/'raw/protected-run-0001'
obs=read(run/'observation-034.json')
responses=[r.get('value',r).get('structuredContent',{}) for r in obs['results']]
jobs=[x for r in responses for x in r.get('jobs',[])]
artifacts=[x for r in responses for x in r.get('artifacts',[])]
job=next(x for x in jobs if x['id']==114101981614)
artifact=next(x for x in artifacts if x['id']==11657065866)
check('actual successful job remains successful',job['run_id']==38014602021 and job['status']=='completed' and job['conclusion']=='success')
zip_path=run/'final-artifact-0001/original-comparator-terminal-38014602021-1.zip'
archive=zip_path.read_bytes()
check('actual original artifact bytes and API digest',len(archive)==artifact['size_in_bytes']==313326 and artifact['digest']=='sha256:'+digest(archive) and digest(archive)=='1bc9b8134308ee9d8205c3273b96558ccb4efc456d0054da3ea033879c70d9b8')
with ZipFile(zip_path) as zipped:
 check('original artifact CRC',zipped.testzip() is None)
 result=json.loads(zipped.read('result.json'))
 check('actual controller and 35 stage successes remain recorded',result['status']=='PASS' and type(result['exitCode']) is int and result['exitCode']==0 and len(result['steps'])==35 and all(type(s['exitCode']) is int and s['exitCode']==0 for s in result['steps']))
 for info in zipped.infolist():
  if info.is_dir():continue
  p=run/'final-artifact-0001/extracted'/info.filename
  check('exact original extracted member '+info.filename,p.is_file() and p.read_bytes()==zipped.read(info.filename))
primary=read(HERE/'raw/terminal-actual-audit-0001/comparator-terminal-audit.json')
secondary=read(HERE/'raw/independent-terminal-actual-0001/independent-review.json')
check('actual primary failure is not relabelled',primary['status']=='FAIL_OR_INCOMPLETE' and primary['N106Completed'] is False and primary['passed']==233 and primary['total']==234 and [c['name'] for c in primary['checks'] if c['pass'] is not True]==['both submitted theorem types actually printed'])
check('actual independent failure is not relabelled',secondary['status']=='FAIL_OR_INCOMPLETE' and secondary['N106Completed'] is False and secondary['passed']==347 and secondary['total']==350)
check('same actual artifact in both reviews',primary['archiveSHA256']==secondary['archiveSHA256']==digest(archive))
check('original 69/1 assessment remains the current frozen count',mapping['currentDatedAssessmentCounts']=={'PASS':69,'PARTIAL':1,'BLOCKED':0} and mapping['N106Completed'] is False)
passed=sum(c['pass'] for c in checks)
receipt={'schema':'MathScope.ActualTerminalHandoffPreservationAudit/1','verifiedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PRESERVATION_PASS' if passed==len(checks) else 'PRESERVATION_FAIL','passed':passed,'total':len(checks),'checks':checks,'mappingSHA256':digest((HERE/'source-mapping.json').read_bytes()),'verifierSHA256':digest(Path(__file__).read_bytes()),'copiedFileCount':mapping['copiedFileCount'],'copiedBytes':mapping['copiedBytes'],'actualProductionJobConclusion':'success','primaryAuditCounts':[233,234],'independentAuditCounts':[347,350],'N106Completed':False,'newComparatorRunPerformed':False,'newMathematicalCertificationPerformed':False,'scope':'Byte preservation and faithful retention of successful execution and unsuccessful auditor outcomes.'}
with args.output.open('x',encoding='utf-8') as f:json.dump(receipt,f,indent=2);f.write('\n')
print(json.dumps({k:receipt[k] for k in ['status','passed','total','copiedFileCount','copiedBytes','N106Completed']}))
raise SystemExit(0 if passed==len(checks) else 1)
