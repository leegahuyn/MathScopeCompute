#!/usr/bin/env python3
"""Collect completed execution evidence without changing the frozen M1 ledger."""
from pathlib import Path
import datetime, hashlib, json, re, subprocess

B=Path(__file__).resolve().parent
R=B/'repo'
def read(name,default=None):
    path=B/name
    return json.loads(path.read_text()) if path.exists() else default
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

cache=read('cache-context-result.json',{})
builds=read('full-pinned-command-results.json',[])
initial=read('environment-before.json')
if cache.get('status')!='FINISHED':raise RuntimeError('Cache still running; do not seal an unfinished audit.')
full=next((x for x in builds if x['stage']=='lake-build-full-pinned'),None)
nsBuild=next((x for x in reversed(builds) if x['stage']=='lake-build-ns-priority-pinned'),None)
declarations=next((x for x in builds if x['stage']=='ns-pinned-declarations'),None)
if full is None or full.get('status')!='FINISHED':
    raise RuntimeError('Full build attempt has not reached a recorded terminal state.')
if full.get('terminationReason') is None and (declarations is None or declarations.get('status')!='FINISHED'):
    raise RuntimeError('The submitted-declaration audit is still pending; do not seal an unfinished pipeline.')
if (B/'priority-transition.json').exists() and (nsBuild is None or declarations is None or declarations.get('status')!='FINISHED'):
    raise RuntimeError('The explicitly prioritized NS submission/declaration pipeline has not finished.')
repos=[]
for p in [R,*sorted((R/'.lake/packages').iterdir())]:
    if not (p/'.git').exists():continue
    repos.append({'name':p.name,
                  'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=p,text=True).strip(),
                  'trackedSourceStatus':subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=p,text=True)})
hashes={name:digest(R/name) for name in initial['filesBefore']}
after={'checkedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
       'filesAfter':hashes,'filesMatchBefore':hashes==initial['filesBefore'],
       'repositories':repos,'allTrackedSourcesUnchanged':all(not x['trackedSourceStatus'] for x in repos)}
(B/'environment-after.json').write_text(json.dumps(after,indent=2)+'\n')

text=(B/'cache-context-explicit.log').read_text(errors='replace')
counts=re.findall(r'Downloaded:\s*(\d+) file\(s\) \[attempted (\d+)/(\d+)',text)
last=counts[-1] if counts else None
declText=(B/'ns-pinned-declarations.log').read_text(errors='replace') if (B/'ns-pinned-declarations.log').exists() else ''
axiomReports=re.findall(r"'([^']+)' (?:depends on axioms:\s*(\[[^\]]*\])|does not depend on any axioms)",declText)
expectedNames=['NavierStokes.Comparator.navier_stokes_breakdown_R3','NavierStokes.Comparator.navier_stokes_breakdown_periodic']
permitted={'propext','Quot.sound','Classical.choice'}
parsedAxioms={name:[x.strip() for x in report.strip('[]').split(',') if x.strip()] for name,report in axiomReports}
axiomClosureRecorded=all(name in parsedAxioms for name in expectedNames)
unpermitted=sorted({a for name in expectedNames for a in parsedAxioms.get(name,[]) if a not in permitted})
declarationAuditPassed=bool(declarations and declarations['exitCode']==0 and axiomClosureRecorded and not unpermitted)
driver=read('driver-build.json')
comparator=read('comparator-pinned-guarded.json')
independentEnvironment=read('comparator-environment-independent.json')
remaining=read('remaining-build-scope.json')
if independentEnvironment is None or remaining is None:
    raise RuntimeError('Independent environment evidence and final remaining-scope inventory must be recorded first.')
if not after['filesMatchBefore'] or not after['allTrackedSourcesUnchanged']:
    raise RuntimeError('Original source/input integrity gate failed; do not seal a success receipt.')
def commandReceipt(record):
    return {k:record.get(k) for k in ['stage','command','cwd','environment','executionProfile','startedUTC','completedUTC','exitCode','terminationReason','logFile','logSHA256']}
nsBuildText=(B/nsBuild['logFile']).read_text(errors='replace') if nsBuild else ''
jobMatch=re.search(r'Build completed successfully \((\d+) jobs\)',nsBuildText)
submissionSource=R/'NavierStokes/ComparatorSolution.lean'
submissionOlean=R/'.lake/build/lib/lean/NavierStokes/ComparatorSolution.olean'
(B/'OfficialComparatorSolution.lean').write_bytes(submissionSource.read_bytes())
summary={
 'auditVersion':'1.0.0',
 'recordedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'sourceRepository':'https://github.com/openai/NavierStokesAndEuler',
 'sourceCommit':initial['commit'],
 'toolchain':'leanprover/lean4:v4.34.0-rc2',
 'kernelCommit':'6a10ac8c22beadecabdbb0919c2b50214762f91d',
 'toolchainArchiveSHA256':'3d011041203acacf300d343a39673f7d233743397993797c941346ae9e5df1a8',
 'originalInputHashesMatch':after['filesMatchBefore'],
 'originalTrackedSourcesUnchanged':after['allTrackedSourcesUnchanged'],
 'executionProfile':{
     'kind':'PINNED_OFFICIAL_KERNEL_EXPLICIT_PATH_ENTRY',
     'vanillaCLIOutcome':'Environment path detection failed; exact vanilla commands and exits are separately logged.',
     'entrySourceUnchangedFromPreviouslyApprovedDriver':driver['unchangedDriverSource'],
     'driverSHA256':driver['driverSha256'],
     'officialSharedLibrarySHA256':driver['sharedLibrarySha256'],
     'taskManagerWorkers':1,
     'logicalOptionsReplaced':False,
     'proofSourcesChanged':False,
     'manifestChanged':False,
     'originalReleaseBytesChanged':False,
 },
 'cache':{'status':cache['status'],'exitCode':cache['exitCode'],
          'entry':'Original Cache.Main CLI body with explicit pinned CacheM context only',
          'cacheAlgorithmsChanged':False,'unsafeFlagsUsed':False,
          'endpoint':'https://lakecache.blob.core.windows.net/mathlib4-master',
          'lastProgress':{'downloaded':int(last[0]),'attempted':int(last[1]),'requested':int(last[2])} if last else None,
          'log':cache['logFile'],'logSHA256':cache['logSha256']},
 'wholeDefaultBuild':{
     'targets':['NavierStokes','Euler','ComparatorChallenges'],
     'exitCode':full['exitCode'],'terminationReason':full['terminationReason'],
     'passed':full['exitCode']==0,'log':full['logFile'],'logSHA256':full['logSHA256'],
     'attempted':True,'commandReceipt':commandReceipt(full),
     'priorityTransition':read('priority-transition.json'),
 },
 'nsSubmissionBuild':{
     'target':'NavierStokes.ComparatorSolution',
     'exitCode':nsBuild['exitCode'] if nsBuild else None,
     'passed':bool(nsBuild and nsBuild['exitCode']==0),
     'log':nsBuild['logFile'] if nsBuild else None,
     'logSHA256':nsBuild['logSHA256'] if nsBuild else None,
     'commandReceipt':commandReceipt(nsBuild) if nsBuild else None,
     'staticLocalSourceDependencyCount':remaining['submittedLocalDependencyClosure']['sourceModules'],
     'reportedLakeJobs':int(jobMatch[1]) if jobMatch else None,
     'scope':'This target is not the full NavierStokes aggregate or the original default including Euler.',
 },
 'submittedDeclarations':{
     'names':expectedNames,
     'entrySourceSHA256':digest(B/'PinnedDeclarations.lean'),
     'entrySourceFile':'PinnedDeclarations.lean',
     'commandReceipt':commandReceipt(declarations) if declarations else None,
     'exitCode':declarations['exitCode'] if declarations else None,
     'kernelCommandAccepted':bool(declarations and declarations['exitCode']==0),
     'passed':declarationAuditPassed,
     'axiomClosureRecordedForBothTargets':axiomClosureRecorded,
     'permittedAxioms':sorted(permitted),
     'unpermittedAxioms':unpermitted,
     'axioms':[{'declaration':n,'report':a or '[]','axioms':parsedAxioms[n]} for n,a in axiomReports],
     'typesAndAxiomsOutput':declText,
     'originalSourceFile':'NavierStokes/ComparatorSolution.lean',
     'sourceURL':'https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/ComparatorSolution.lean',
     'sourceSHA256':digest(submissionSource),
     'unchangedSourceCopy':'OfficialComparatorSolution.lean',
     'oleanSHA256':digest(submissionOlean) if submissionOlean.exists() else None,
     'oleanSizeBytes':submissionOlean.stat().st_size if submissionOlean.exists() else None,
     'log':'ns-pinned-declarations.log' if declarations else None,
     'logSHA256':declarations['logSHA256'] if declarations else None,
 },
 'comparator':{
     'status':'BLOCKED','passed':False,'exitCode':comparator['exitCode'],
     'reachedComparatorProcess':False,
     'blocker':comparator['reason'],
     'configSHA256':comparator['configurationSHA256'],
     'log':'comparator-pinned-guarded.log','logSHA256':comparator['logSHA256'],
     'guardBypassUsed':False,'alternateWeakerPathCountedAsSuccess':False,
     'commandReceipt':comparator,
     'independentEnvironment':{
         'status':independentEnvironment['status'],
         'file':'comparator-environment-independent.json',
         'sha256':digest(B/'comparator-environment-independent.json'),
         'report':'comparator-environment-independent.md',
         'reportSHA256':digest(B/'comparator-environment-independent.md'),
         'scope':'Read-only independent observations of the current container and tool execution profile; no Comparator rerun or guard change.',
     },
 },
 'remainingBuildScope':remaining,
 'pinnedEntryKernelControls':{
     'file':'pinned-entry-kernel-controls.json',
     'sha256':digest(B/'pinned-entry-kernel-controls.json'),
     'scope':'The actual rc2 entry accepted a true Nat equality and rejected a false Nat equality; source/log/command hashes are in the separate receipt.',
 },
 'scopeBoundaries':[
     'Original pinned C/D declaration kernel acceptance, full default build, and independent Comparator equivalence are separate claims.',
     'Official mathlib cache use retains the normal upstream cache trust assumption; no independent replay of every cached proof is asserted.',
     'The numeric N3 candidate does not become a certified whole leading profile by compiling the source existence theorem.',
     'Frozen M1 JavaScript and local 4.34.1 evidence were not altered by this additional audit. N1-05/06 checklist evidence is updated to the actual recorded execution without altering original acceptance/detail.',
 ],
 'frozenM1RuntimeSourcesModified':False,
}
progress=B/'build-progress.jsonl'
if progress.exists():
    (B/'build-progress.json').write_text(json.dumps(
        [json.loads(line) for line in progress.read_text().splitlines() if line],
        ensure_ascii=False,indent=2)+'\n')
(B/'official-audit-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
files=[]
for p in sorted(B.iterdir()):
    if p.is_file() and p.suffix in ['.json','.log','.md','.lean','.diff','.py','.c'] and p.name!='audit-files.json':
        files.append({'file':p.name,'bytes':p.stat().st_size,'sha256':digest(p)})
(B/'audit-files.json').write_text(json.dumps({'files':files,'excluded':'Toolchains, archives, source checkouts, .lake, and build/cache directories are intentionally outside the delivery set.'},indent=2)+'\n')
print(json.dumps({'wholeBuildPassed':summary['wholeDefaultBuild']['passed'],
                  'declarationAuditPassed':summary['submittedDeclarations']['passed'],
                  'comparatorStatus':summary['comparator']['status'],
                  'originalSourcesUnchanged':after['allTrackedSourcesUnchanged'],
                  'deliveryFileCount':len(files)},indent=2))
