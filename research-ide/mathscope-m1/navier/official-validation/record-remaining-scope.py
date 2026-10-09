#!/usr/bin/env python3
"""Inventory remaining original module artifacts after the terminal C/D build.

This reads tracked sources and .olean existence; it is not an additional build
or an independent proof certificate. Exact successful target exit is separate.
"""
from pathlib import Path
import datetime, hashlib, json, re, statistics

B=Path(__file__).resolve().parent
R=B/'repo'
records=json.loads((B/'full-pinned-command-results.json').read_text())
target=next((r for r in records if r['stage']=='lake-build-ns-priority-pinned'),None)
if target is None or target.get('status')!='FINISHED':
    raise RuntimeError('Wait for the requested C/D target to reach a terminal state.')
inventory=json.loads((B/'pinned-source-inventory.json').read_text())
modules={f['path'][:-5].replace('/','.'):f for f in inventory['files']}
def exists(module):return (R/'.lake/build/lib/lean'/Path(*module.split('.'))).with_suffix('.olean').exists()
def scope(names):
    names=sorted(names)
    present=[n for n in names if exists(n)]
    missing=[n for n in names if not exists(n)]
    return {'sourceModules':len(names),'oleanArtifactsPresent':len(present),
            'oleanArtifactsMissing':len(missing),'missingModules':missing}
submitted=json.loads((B/'submitted-source-import-map.json').read_text())
nsRoot=json.loads((B.parent/'formal-import-map.json').read_text())
durations=[]
for logname in ['lake-build-full-pinned.log','lake-build-ns-priority-pinned.log']:
    for match in re.finditer(r'Built (NavierStokes\.[\w.]+) \(([0-9.]+)(m?s)\)',(B/logname).read_text(errors='replace')):
        value=float(match[2])/(1000 if match[3]=='ms' else 1)
        durations.append(value)
data={
    'recordedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'repositoryCommit':inventory['commit'],
    'grade':'POST_BUILD_ARTIFACT_INVENTORY_ONLY',
    'notAnIndependentProofCertificate':True,
    'completedSelectedTarget':{'target':'NavierStokes.ComparatorSolution','exitCode':target['exitCode'],
                               'logSHA256':target['logSHA256']},
    'submittedLocalDependencyClosure':scope(submitted['imports']),
    'navierStokesRootSourceClosure':scope(nsRoot['imports']),
    'navierStokesWholeLibrary':scope(n for n in modules if n=='NavierStokes' or n.startswith('NavierStokes.')),
    'eulerWholeLibrary':scope(n for n in modules if n=='Euler' or n.startswith('Euler.')),
    'comparatorChallenges':scope(n for n in modules if n.startswith('ComparatorChallenges.')),
    'timingEvidence':{'observedNSModuleReports':len(durations),
                      'medianReportedModuleSeconds':statistics.median(durations) if durations else None,
                      'maxReportedModuleSeconds':max(durations) if durations else None,
                      'selectedTargetWallSeconds':target['elapsedSeconds'],
                      'limitation':'Median module time and missing artifact counts do not bound a dependency chain or a fresh full-default build.'},
    'additionalBuildsRequested':False,
    'decision':'Parent requested final C/D evidence and remaining counts only. No further NS aggregate or Euler/default build is launched.',
}
(B/'remaining-build-scope.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:{a:b for a,b in v.items() if a!='missingModules'} for k,v in data.items() if isinstance(v,dict)},ensure_ascii=False,indent=2))
