"""Build a deterministic, bounded M3 gauge/fluid worker and its visible workspace."""
from pathlib import Path
import argparse, hashlib, importlib.util, json, re, subprocess
ROOT=Path(__file__).resolve().parents[1]
WEB=ROOT/'web'
RESEARCH=ROOT.parent
SPEC=importlib.util.spec_from_file_location('p8_static_bundler',ROOT/'p8/tools/build_browser.py')
BUNDLER=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(BUNDLER)
INNER_SPEC=importlib.util.spec_from_file_location('n7_inner_growth_archive',ROOT/'navier/tests/build-inner-growth-evidence.py')
INNER_ARCHIVE=importlib.util.module_from_spec(INNER_SPEC);INNER_SPEC.loader.exec_module(INNER_ARCHIVE)
def sha(x):return hashlib.sha256(x if isinstance(x,bytes) else x.encode()).hexdigest()
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)
def read(p):return p.read_text(encoding='utf-8')
PACKAGES=('Y5','Y6','Y7','N6','N7','N8')
PROGRESS_PACKAGES={**{p:(p,) for p in PACKAGES},'GAUGE':PACKAGES[:3],'NAVIER':PACKAGES[3:]}
COMPLETE_STATUSES={'PASS','COMPLETE_WITHIN_STATED_SCOPE'}

def normalized_original_text(value):
 if not isinstance(value,str) or not value.strip():raise ValueError('Original criterion text must be a nonempty string')
 return re.sub(r'\s+','',value)

def validate_extended_criteria(original,documents):
 """Bind complete assessment rows to the exact original blueprint identity.

 The attachment filename may change while its SHA256 stays the same. PDF
 extraction may change whitespace; neither permits changed mathematics,
 reordered or missing obligations, or a silently overwritten assessment.
 """
 if not isinstance(original,dict) or not re.fullmatch(r'[0-9a-f]{64}',str(original.get('sha256',''))):raise ValueError('Original blueprint SHA256 is missing or malformed')
 expected={}
 for package in PACKAGES:
  rows=[r for r in original.get('criteria',[]) if isinstance(r,dict) and str(r.get('id','')).startswith(package+'-')]
  if [r.get('id') for r in rows]!=[package+'-'+str(i).zfill(2) for i in range(1,9)]:raise ValueError('Original package must contain exactly eight ordered criteria: '+package)
  expected[package]=rows
 assessed={};seen_packages=set()
 for name,data in documents:
  if name not in PROGRESS_PACKAGES or not isinstance(data,dict):raise ValueError('Unsupported progress document '+str(name))
  packages=PROGRESS_PACKAGES[name]
  if seen_packages.intersection(packages):raise ValueError('Duplicate assessment package in '+name)
  binding=data.get('sourceBlueprint',data.get('source'))
  if not isinstance(binding,dict) or binding.get('sha256')!=original['sha256']:raise ValueError('Progress blueprint SHA256 differs from the original: '+name)
  filename=binding.get('source',binding.get('file'))
  if not isinstance(filename,str) or not filename.strip():raise ValueError('Progress blueprint filename is missing: '+name)
  if 'pageCount' in binding and binding['pageCount']!=original.get('page_count'):raise ValueError('Progress blueprint page count differs: '+name)
  wanted=[r for package in packages for r in expected[package]]
  rows=data.get('criteria')
  if not isinstance(rows,list) or any(not isinstance(r,dict) for r in rows) or [r.get('id') for r in rows]!=[r['id'] for r in wanted]:raise ValueError('Progress needs exactly eight original criteria in order per package: '+name)
  for row,criterion in zip(rows,wanted):
   identity=row['id']
   for key in ('title','text'):
    if normalized_original_text(row.get(key))!=normalized_original_text(criterion.get(key)):raise ValueError('Original criterion changed: '+identity+'/'+key)
   if type(row.get('page')) is not int or row['page']!=criterion['page']:raise ValueError('Original criterion page changed: '+identity)
   if row.get('source')!=filename:raise ValueError('Criterion is not bound to its progress blueprint: '+identity)
   if 'sourceSha256' in row and row['sourceSha256']!=original['sha256']:raise ValueError('Criterion blueprint SHA256 changed: '+identity)
   if 'checklistPage' in binding and binding['checklistPage']!=row['page']:raise ValueError('Progress checklist page differs: '+identity)
   complete=row.get('originalCriterionComplete');status=row.get('status');evidence=row.get('evidence')
   if type(complete) is not bool or not isinstance(status,str) or not status.strip():raise ValueError('Malformed criterion completion or status: '+identity)
   if complete!=(status in COMPLETE_STATUSES):raise ValueError('Criterion status contradicts original completion: '+identity)
   if evidence is not None and (not isinstance(evidence,list) or any(not isinstance(e,str) or not e.strip() for e in evidence)):raise ValueError('Evidence must be a list of concrete references: '+identity)
   if complete and not evidence:raise ValueError('Completed original criterion needs concrete evidence: '+identity)
   assessed[identity]=row
  count=sum(r['originalCriterionComplete'] for r in rows)
  for field,value in [('criterionCount',len(rows)),('originalCriterionCount',len(rows)),('originalCriteriaComplete',count),('completedOriginalCriteria',count),('originalCriteriaIncomplete',len(rows)-count)]:
   if field in data and (type(data[field]) is not int or data[field]!=value):raise ValueError('Progress count contradicts its original rows: '+name+'/'+field)
  if 'allOriginalCriteriaComplete' in data and (type(data['allOriginalCriteriaComplete']) is not bool or data['allOriginalCriteriaComplete']!=(count==len(rows))):raise ValueError('Progress completion contradicts its original rows: '+name)
  seen_packages.update(packages)
 if seen_packages!=set(PACKAGES):raise ValueError('Missing original package assessments: '+','.join(p for p in PACKAGES if p not in seen_packages))
 return [assessed[r['id']] for package in PACKAGES for r in expected[package]]

def build(check=False):
 # A browser bundle may consume only the fixed archive with every captured
 # source/artifact byte still matching. This is not the heavy source gate.
 INNER_ARCHIVE.build(check=True)
 worker,closure=BUNDLER.bundle(WEB/'extended-worker.mjs')
 view_bundle,view_closure=BUNDLER.bundle(WEB/'extended-view-entry.mjs')
 example_code="""import {getExamples} from './gauge/index.mjs';import {NAVIER_M3_EXAMPLES} from './navier/index.mjs';console.log(JSON.stringify({gauge:getExamples().map(e=>({id:e.id,label:e.label,input:e.request,packages:e.id.startsWith('y7')?['Y7']:e.id.startsWith('y6')?['Y6']:['Y5',...(e.request.kind==='field-family'?['Y6']:[])]})),navier:NAVIER_M3_EXAMPLES.map(e=>({...e,packages:[e.input.package]}))}));"""
 examples=json.loads(subprocess.check_output(['node','--input-type=module','-e',example_code],cwd=ROOT,text=True))
 original=json.loads(read(ROOT/'ORIGINAL_M3_M4_CRITERIA.json'))
 progress_paths=[];documents=[]
 for name in list(PACKAGES)+['GAUGE','NAVIER']:
  path=ROOT/(name+'_PROGRESS.json')
  if path.exists():
   progress_paths.append(path);documents.append((name,json.loads(read(path))))
 criteria=validate_extended_criteria(original,documents)
 extras=[WEB/'extended-client.js',WEB/'extended-workspace.js',WEB/'extended-workspace.css',WEB/'extended-workspace.html',Path(__file__).resolve(),WEB/'tests/test_extended_build.py',ROOT/'ORIGINAL_M3_M4_CRITERIA.json']+progress_paths
 extras+=INNER_ARCHIVE.source_paths()+[ROOT/'navier/tests/build-inner-growth-evidence.py',ROOT/'navier/tests/inner-growth-archive.test.mjs',ROOT/'navier/tests/test_inner_growth_archive.py',WEB/'tests/navier-inner-growth-view.test.mjs']
 for folder in ['gauge','navier']:
  extras+=list((ROOT/folder/'lean').glob('*.lean'))
  extras+=[p for p in [ROOT/folder/'original-criteria.json',ROOT/folder/'evidence/lean-audit.json',ROOT/folder/'evidence/acceptance.json'] if p.exists()]
 files=[{'path':p.relative_to(RESEARCH).as_posix(),'bytes':len(p.read_bytes()),'sha256':sha(p.read_bytes())} for p in sorted(set(closure+view_closure+extras),key=str)]
 source={'schema':'MathScope.M3.ExtendedSourceBinding/1','manifestSHA256':sha(canonical(files)),'files':files,'repository':'https://github.com/leegahuyn/MathScopeCompute','branch':'mathscope-m3-except-p7-20261012','p7SourceChanged':False}
 metadata={'schema':'MathScope.M3.ExtendedBuild/1','version':'0.3.14-m3','sourceBinding':source,'environment':{'worker':'STATIC_LOCAL_ESM_CLOSURE','hash':'SHA-256_WEBCRYPTO','numericalArithmetic':'IEEE754_FLOAT64_FINITE_MODEL','exactArithmetic':'BIGINT_RATIONAL_WHERE_DECLARED','formalAuthority':'RECORDED_PINNED_KERNEL_AUDIT_ONLY','requestBudgetBytes':131072,'outputBudgetBytes':25165824},'examples':examples,'criteria':criteria,'wholeM3Complete':False}
 worker='globalThis.__MATHSCOPE_M3_EXTENDED_BUILD__='+canonical(metadata)+';\n'+worker
 template=read(WEB/'extended-client.js')
 for token in ['__M3_EXTENDED_STATIC_WORKER_SOURCE__','__M3_EXTENDED_BUILD_METADATA__']:
  if template.count(token)!=1:raise ValueError('Expected exactly one build token '+token)
 client=(view_bundle+'\n'+template.replace('__M3_EXTENDED_STATIC_WORKER_SOURCE__',BUNDLER.worker_source_expression(worker)).replace('__M3_EXTENDED_BUILD_METADATA__',canonical(metadata))).replace('</script','<\\/script')
 outputs={WEB/'extended-engine.bundle.js':client,WEB/'extended-build-data.json':json.dumps(metadata,ensure_ascii=False,indent=2)+'\n'}
 for p,s in outputs.items():
  if check:
   if not p.exists() or read(p)!=s:raise ValueError('Stale generated source '+str(p))
  else:p.write_text(s,encoding='utf-8',newline='\n')
 subprocess.run(['node','--check',str(WEB/'extended-engine.bundle.js')],check=True)
 subprocess.run(['node','--check',str(WEB/'extended-workspace.js')],check=True)
 return {'sourceFiles':len(files),'sourceManifestSHA256':source['manifestSHA256'],'workerBytes':len(worker.encode()),'viewBytes':len(view_bundle.encode()),'bundleBytes':len(client.encode()),'criteria':len(criteria),'assessed':len(criteria),'examples':{k:len(v) for k,v in examples.items()},'checkOnly':check}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args();print(json.dumps(build(args.check),ensure_ascii=False))
