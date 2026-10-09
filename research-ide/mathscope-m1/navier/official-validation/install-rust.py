import concurrent.futures, datetime, hashlib, json, pathlib, subprocess, tarfile, tomllib, urllib.request

B = pathlib.Path(__file__).resolve().parent
manifestPath=B/'rust-stable-manifest.toml'
manifest=tomllib.loads(manifestPath.read_text())
prefix=B/'rust-toolchain'
archiveRoot=B/'rust-downloads'
archiveRoot.mkdir(exist_ok=True)
def prepare(name):
    meta=manifest['pkg'][name]['target']['x86_64-unknown-linux-gnu']
    url=meta['xz_url']; expected=meta['xz_hash']
    archive=archiveRoot/url.rsplit('/',1)[-1]
    if not archive.exists():
        with urllib.request.urlopen(url,timeout=120) as r,archive.open('wb') as out:
            while data:=r.read(1048576):out.write(data)
    actual=hashlib.sha256(archive.read_bytes()).hexdigest()
    if actual!=expected:raise RuntimeError(f'{name} checksum mismatch')
    with tarfile.open(archive,'r:xz') as t:
        entries=t.getmembers()
        top=entries[0].name.split('/')[0]
    command=['tar','--no-same-owner','-xJf',str(archive),'-C',str(archiveRoot)]
    p=subprocess.run(command,capture_output=True,text=True)
    if p.returncode:raise RuntimeError(p.stderr)
    return {'name':name,'url':url,'expectedSHA256':expected,'actualSHA256':actual,
            'sizeBytes':archive.stat().st_size,'root':str(archiveRoot/top),
            'extractCommand':command,'extractExitCode':p.returncode}
result={'manifestDate':manifest['date'],'manifestSHA256':hashlib.sha256(manifestPath.read_bytes()).hexdigest(),
        'source':'https://static.rust-lang.org/dist/channel-rust-stable.toml',
        'prefix':str(prefix),'startedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    components=list(executor.map(prepare,['rustc','cargo','rust-std']))
result['components']=components
(B/'rust-prepared.json').write_text(json.dumps(result,indent=2)+'\n')
print('verified and extracted',[(x['name'],x['sizeBytes']) for x in components],flush=True)
