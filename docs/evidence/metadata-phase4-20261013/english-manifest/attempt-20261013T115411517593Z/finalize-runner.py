import datetime, hashlib, json, pathlib, re, subprocess, time
repo=pathlib.Path(__file__).resolve().parent/'MathScopeCompute'
out=repo/'docs/evidence/metadata-phase4-20261013/english-manifest/attempt-20261013T115411517593Z'
target=repo/'research-ide/SOURCE_TRANSLATION_MANIFEST.json'
before=(out/'manifest-before.json').read_bytes()
assert target.read_bytes()==before
review=json.loads((out/'review-before.json').read_text(encoding='utf-8'))
expected=(out/'expected-manifest-before-write.json').read_bytes()
allowed_changed={
 'mathscope-m3/navier/implementation-pin.mjs','mathscope-m3/navier/source-saved-whole-mean-direct-audit.mjs','mathscope-m3/navier/tests/saved-whole-mean-direct-audit.test.mjs',
 'mathscope-m3/web/build_extended.py','mathscope-m3/web/extended-build-data.json','mathscope-m3/web/extended-engine.bundle.js',
 'mathscope-m4/README_KO.md','mathscope-m4/tools/pinned-kernel-replay.mjs','mathscope-m4/web/README_KO.md','mathscope-m4/web/verify-live-panel.mjs',
}
assert {x['after']['path'] for x in review['changed']}==allowed_changed
assert review['previous9835MembersPreserved'] and review['addonMembershipAndBytesUnchanged']
assert len(review['added'])==182 and review['expectedArtifactCount']==10017
lf_paths=[]
for row in review['added']+[x['after'] for x in review['changed']]:
    path=pathlib.PurePosixPath(row['path'])
    if path.suffix in {'.mjs','.py','.lean'} and 'evidence' not in path.parts:
        raw=(repo/'research-ide'/path).read_bytes()
        assert b'\r\n' not in raw, 'New/current authored source must be LF: '+str(path)
        lf_paths.append(str(path))
(out/'finalize-runner.py').write_bytes(pathlib.Path(__file__).read_bytes())
commands=[
 ['python','-X','utf8','-B','research-ide/tools/verify_english_release.py','--write-manifest'],
 ['python','-X','utf8','-B','research-ide/tools/verify_english_release.py'],
 ['python','-X','utf8','-B','research-ide/tools/test_edition_visibility.py'],
 ['python','-X','utf8','-B','research-ide/tools/test_addon_boundaries.py'],
 ['node','docs/evidence/metadata-ci-repair-20261013/check-current-pin.mjs'],
 ['node','docs/evidence/metadata-phase4-20261013/check-generated-assets.mjs'],
 ['git','diff','--check','--','research-ide/SOURCE_TRANSLATION_MANIFEST.json','research-ide/mathscope-m3/navier/implementation-pin.mjs','research-ide/mathscope-m3/web/build_extended.py','research-ide/mathscope-m3/web/extended-build-data.json','research-ide/mathscope-m3/web/extended-engine.bundle.js'],
]
rows=[];started=datetime.datetime.now(datetime.timezone.utc).isoformat()
for i,argv in enumerate(commands):
    t=time.monotonic(); timed_out=False
    try:
        p=subprocess.run(argv,cwd=repo,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=120)
        stdout,stderr,code=p.stdout,p.stderr,p.returncode
    except subprocess.TimeoutExpired as ex:
        stdout,stderr,code=ex.stdout or b'',ex.stderr or b'',None; timed_out=True
    (out/f'{i}-stdout.log').write_bytes(stdout)
    (out/f'{i}-stderr.log').write_bytes(stderr)
    rows.append({'command':argv,'elapsedSeconds':time.monotonic()-t,'exitCode':code,'timeout':timed_out,'stdoutSHA256':hashlib.sha256(stdout).hexdigest(),'stderrSHA256':hashlib.sha256(stderr).hexdigest()})
    print(json.dumps({'commandIndex':i,'exitCode':code,'elapsedSeconds':rows[-1]['elapsedSeconds']},ensure_ascii=False),flush=True)
    if code!=0: break
after=target.read_bytes()
(out/'manifest-after.json').write_bytes(after)
passed=len(rows)==7 and all(r['exitCode']==0 and not r['timeout'] for r in rows) and after==expected
unit_counts={}
if len(rows)>=4:
    for i,n in [(2,6),(3,4)]:
        text=(out/f'{i}-stderr.log').read_text(encoding='utf-8')
        m=re.search(r'Ran (\d+) tests',text)
        unit_counts[str(i)]=int(m.group(1)) if m else None
        passed=passed and unit_counts[str(i)]==n and re.search(r'\nOK\s*$',text) is not None
write_result=json.loads((out/'0-stdout.log').read_text(encoding='utf-8')) if rows and rows[0]['exitCode']==0 else None
readonly_result=json.loads((out/'1-stdout.log').read_text(encoding='utf-8')) if len(rows)>=2 and rows[1]['exitCode']==0 else None
passed=passed and write_result==readonly_result
receipt={'schema':'MathScope.Phase4.EnglishManifestFinalization/1','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checkpointCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo).decode().strip(),'commands':rows,'budgetSecondsPerCommand':120,'beforeSHA256':hashlib.sha256(before).hexdigest(),'afterSHA256':hashlib.sha256(after).hexdigest(),'beforeArtifactCount':9835,'afterArtifactCount':10017,'allPreviousMembersPreserved':review['previous9835MembersPreserved'],'unchangedAddonRows':1528,'membershipAttackTests':unit_counts.get('2'),'addonBoundaryTests':unit_counts.get('3'),'authoredCodeLFChecked':lf_paths,'expectedPrewriteBytesEqualGeneratedManifest':after==expected,'readOnlyReplayMatchesWrite':write_result==readonly_result,'verifierResult':readonly_result,'passed':passed,'published':False,'formalPass':False,'mathematicalCriteriaPromoted':False}
(out/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'evidence':str(out),'passed':passed,'afterSHA256':receipt['afterSHA256'],'afterArtifactCount':10017,'checks':unit_counts},ensure_ascii=False),flush=True)
raise SystemExit(0 if passed else 1)
