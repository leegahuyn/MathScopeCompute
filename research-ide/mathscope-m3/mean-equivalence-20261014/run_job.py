"""Bounded cloud commands with environment, input hashes and failure receipts."""
from __future__ import annotations
import argparse, hashlib, json, os, platform, shutil, subprocess, sys, time
from pathlib import Path
REPO=Path(__file__).resolve().parents[3]
SRC=Path(__file__).resolve().parent
LEDGERS=['ORIGINAL_M3_M4_CRITERIA','N6_PROGRESS','N7_PROGRESS','N8_PROGRESS']
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def ledger():return {k:sha(REPO/'research-ide/mathscope-m3'/f'{k}.json') for k in LEDGERS}
def execute(command,out,name):
    with (out/name).open('w',encoding='utf8') as log:
        try:
            result=subprocess.run(command,cwd=REPO,stdout=log,stderr=subprocess.STDOUT,timeout=2200)
        except subprocess.TimeoutExpired:raise RuntimeError('RESOURCE_LIMIT: 2200 second command deadline')
    # Logs remain complete in artifacts; user-facing summaries are emitted by
    # each bounded job without duplicating whole diagnostics on stdout.
    if result.returncode:raise RuntimeError(f'Command failed with exit code {result.returncode}; see {name}')
def main():
    p=argparse.ArgumentParser();p.add_argument('--kind',required=True,choices=['prepare','controls','mean','natural','residual','initial']);p.add_argument('--inputs');p.add_argument('--mean-out');p.add_argument('--output',required=True);a=p.parse_args()
    out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
    start=time.monotonic();before=ledger()
    env={'schema':'MathScope.MeanEquivalence.CloudExecution/1','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip(),'kind':a.kind,'python':platform.python_version(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'platform':platform.platform(),'cpuCount':os.cpu_count(),'diskFreeBytes':shutil.disk_usage(REPO).free,'memory':Path('/proc/meminfo').read_text() if Path('/proc/meminfo').exists() else None,'nodeHeapMiB':8192,'commandTimeoutSeconds':2200,'runner':'ubuntu-24.04','paidLargerRunnerUsed':False,'startedAtUTC':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'ledgerBefore':before,'implementationInputs':[{'path':str(x.relative_to(REPO)).replace('\\','/'),'bytes':x.stat().st_size,'sha256':sha(x)} for x in sorted(SRC.iterdir()) if x.is_file()]}
    (out/'runner.json').write_text(json.dumps(env,indent=2)+'\n',encoding='utf8')
    code=0
    try:
        if a.kind=='prepare':execute([sys.executable,'-B',str(SRC/'verified_inputs.py'),'--output',str(out)],out,'prepare.log')
        elif a.kind=='controls':
            execute([sys.executable,'-B','-m','unittest','discover','-s',str(SRC),'-p','test_*.py'],out,'python-controls.log')
            execute([sys.executable,'-B',str(SRC/'natural_tests.py')],out,'natural-controls.log')
            tests=sorted(str(x) for x in SRC.glob('*.test.mjs'))
            if not tests:raise ValueError('No independent browser-free Node controls')
            execute(['node','--test','--test-reporter=tap',*tests],out,'node-controls.tap')
        elif a.kind=='mean':execute(['node',str(SRC/'mean-equivalence-run.mjs'),'--output',str(out)],out,'mean.log')
        elif a.kind=='residual':execute(['node',str(SRC/'residual-audit.mjs'),'--output',str(out)],out,'residual.log')
        elif a.kind=='natural':execute([sys.executable,'-B',str(SRC/'natural_actual.py'),'--inputs',a.inputs,'--output',str(out)],out,'natural.log')
        elif a.kind=='initial':
            if not a.mean_out:raise ValueError('Actual new source witness required')
            receipt=json.loads((Path(a.mean_out)/'receipt.json').read_text(encoding='utf8'))
            witness=Path(a.mean_out)/'initial-finite-witness.json'
            members=[x for x in receipt['members'] if x['path']=='initial-finite-witness.json']
            if receipt['sourceCommit']!=env['sourceCommit'] or receipt['executionStatus']!='SUCCESS' or len(members)!=1 or sha(witness)!=members[0]['sha256'] or witness.stat().st_size!=members[0]['bytes']:raise ValueError('Actual five-row witness differs from same-run successful private source audit receipt')
            (out/'mean-source-provenance.json').write_text(json.dumps({'sourceCommit':env['sourceCommit'],'meanReceiptSHA256':sha(Path(a.mean_out)/'receipt.json'),'witnessSHA256':sha(witness),'verifiedSameRunPrivateSourceAuditReceipt':True,'receiptIsNotAnalyticClassProof':True},indent=2)+'\n',encoding='utf8')
            execute([sys.executable,'-B',str(SRC/'initial_finite.py'),'--witness',str(Path(a.mean_out)/'initial-finite-witness.json'),'--output',str(out)],out,'five-row.log')
            execute([sys.executable,'-B',str(SRC/'class_acceptance.py'),'--inputs',a.inputs,'--output',str(out)],out,'class-acceptance.log')
        env['executionStatus']='SUCCESS'
    except Exception as error:
        code=1;env['executionStatus']='RESOURCE_LIMIT' if 'RESOURCE_LIMIT' in str(error) else 'IMPLEMENTATION_FAILURE';env['failure']=str(error)
    finally:
        after=ledger();env['ledgerAfter']=after;env['originalLedgerUnchanged']=before==after;env['elapsedSeconds']=time.monotonic()-start
        if before!=after:code=1;env['executionStatus']='IMMUTABLE_LEDGER_FAILURE'
        env['mathN601CertifiedByExecutionSuccess']=False;env['mathN602CertifiedByExecutionSuccess']=False
        (out/'execution.json').write_text(json.dumps(env,indent=2)+'\n',encoding='utf8')
        files=[{'path':str(x.relative_to(out)).replace('\\','/'),'bytes':x.stat().st_size,'sha256':sha(x)} for x in sorted(out.rglob('*')) if x.is_file() and x.name!='receipt.json']
        (out/'receipt.json').write_text(json.dumps({'sourceCommit':env['sourceCommit'],'members':files,'executionStatus':env['executionStatus']},indent=2)+'\n',encoding='utf8')
    print(json.dumps({'kind':a.kind,'executionStatus':env['executionStatus'],'elapsedSeconds':env['elapsedSeconds'],'ledgerUnchanged':before==after}))
    return code
if __name__=='__main__':sys.exit(main())
