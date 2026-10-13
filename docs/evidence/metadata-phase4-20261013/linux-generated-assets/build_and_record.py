"""Run the original builders on Linux; record attempts without rewriting sources."""
from pathlib import Path
import datetime, hashlib, json, os, platform, subprocess, sys, time

own = Path(__file__).resolve().parent
repo = own.parents[3]
assert platform.system() == 'Linux'
assert subprocess.check_output(['node','--version'],text=True).strip() == 'v24.18.0'
sha = lambda raw:hashlib.sha256(raw).hexdigest()
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
out = own/('attempt-'+''.join(c for c in started if c.isdigit()))
out.mkdir()
navier = repo/'research-ide/mathscope-m3/navier'
web = navier.parent/'web'
outputs = [web/'extended-engine.bundle.js',web/'extended-build-data.json']
def inventory():
    return [{'path':p.relative_to(repo).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(navier.glob('*.mjs'))]
before = inventory()
before_outputs = [{'path':p.relative_to(repo).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in outputs]
commands = [
    ['node',str(repo/'docs/evidence/metadata-ci-repair-20261013/check-current-pin.mjs')],
    [sys.executable,'-B',str(web/'build_extended.py')],
    [sys.executable,'-B',str(web/'build_extended.py'),'--check'],
]
results = []
passed = True
for i, command in enumerate(commands):
    begin = datetime.datetime.now(datetime.timezone.utc).isoformat()
    clock = time.monotonic()
    timeout = False
    try:
        completed = subprocess.run(command,cwd=repo,capture_output=True,timeout=180)
        stdout,stderr,exit_code = completed.stdout,completed.stderr,completed.returncode
    except subprocess.TimeoutExpired as error:
        stdout,stderr,exit_code = error.stdout or b'',error.stderr or b'',None
        timeout = True
    (out/f'{i}-stdout.log').write_bytes(stdout)
    (out/f'{i}-stderr.log').write_bytes(stderr)
    results.append({'command':command,'startedAt':begin,'elapsedSeconds':time.monotonic()-clock,'exitCode':exit_code,'timeout':timeout,'stdoutSHA256':sha(stdout),'stderrSHA256':sha(stderr)})
    if exit_code != 0:
        passed = False
        break
after = inventory()
source_stable = before == after
assert source_stable
after_outputs = [{'path':p.relative_to(repo).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in outputs]
metadata = json.loads(outputs[1].read_bytes())
if passed:
    assert metadata['sourceBinding']['branch'] == 'mathscope-m3-resume-20261013'
    for row in metadata['sourceBinding']['files']:
        raw = (repo/'research-ide'/row['path']).read_bytes()
        assert len(raw) == row['bytes'] and sha(raw) == row['sha256'], row['path']
record = {'schema':'MathScope.M3.LinuxGeneratedAssetAttempt/1','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'checkpointCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),
    'platform':platform.platform(),'pythonVersion':platform.python_version(),'nodeVersion':'24.18.0',
    'nodeRuntimeArchive':json.loads(Path('/tmp/mathscope-runtime-20261013/receipt.json').read_bytes()),
    'commands':results,'sourceStable':source_stable,'modulesBefore':before,'modulesAfter':after,
    'outputsBefore':before_outputs,'outputsAfter':after_outputs,'passed':passed,
    'sourceManifestSHA256':metadata['sourceBinding']['manifestSHA256'],'published':False,
    'publicV103WorkerReplaced':False,'mathematicalCriteriaPromoted':False}
(out/'receipt.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'out':out.relative_to(repo).as_posix(),'passed':passed,'sourceStable':source_stable,'outputsAfter':after_outputs}))
sys.exit(0 if passed else 1)
