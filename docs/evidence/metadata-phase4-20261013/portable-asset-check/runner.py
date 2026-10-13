import datetime, hashlib, json, pathlib, subprocess, time
repo=pathlib.Path(__file__).resolve().parent/'MathScopeCompute'
out=repo/'docs/evidence/metadata-phase4-20261013/portable-asset-check'
out.mkdir(exist_ok=False)
checker=repo/'docs/evidence/metadata-phase4-20261013/check-generated-assets.mjs'
raw=checker.read_bytes();(out/'checker.mjs').write_bytes(raw)
(out/'runner.py').write_bytes(pathlib.Path(__file__).read_bytes())
argv=['node','docs/evidence/metadata-phase4-20261013/check-generated-assets.mjs']
started=datetime.datetime.now(datetime.timezone.utc).isoformat();t=time.monotonic()
p=subprocess.run(argv,cwd=repo,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=120)
(out/'stdout.log').write_bytes(p.stdout);(out/'stderr.log').write_bytes(p.stderr)
receipt={'schema':'MathScope.Phase4.PortableAssetCheck/1','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalCheckpoint':'486b6e19e0ad85142a31a84ffdfee0d02fc35cb3','command':argv,'elapsedSeconds':time.monotonic()-t,'exitCode':p.returncode,'checkerSHA256':hashlib.sha256(raw).hexdigest(),'checkerStable':checker.read_bytes()==raw,'stdoutSHA256':hashlib.sha256(p.stdout).hexdigest(),'stderrSHA256':hashlib.sha256(p.stderr).hexdigest(),'passed':p.returncode==0 and checker.read_bytes()==raw,'published':False,'formalPass':False}
(out/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(receipt,ensure_ascii=False))
raise SystemExit(p.returncode)
