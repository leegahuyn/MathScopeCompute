from pathlib import Path
import hashlib, json, re, subprocess, sys

repo = Path(sys.argv[1]).resolve()
out = Path(sys.argv[2]).resolve()
pin = sys.argv[3]
def git(*args):
    return subprocess.check_output(['git','-c','core.longpaths=true','-C',str(repo),*args])
def select(name):
    if name.startswith("research-ide/mathscope-m0/"):
        return (name.endswith((".mjs",".json",".lean",".log")) and not re.search(r"(?:\.bundle\.js|/(?:tests|web)/)",name)) or name.endswith("tests/proof.test.mjs")
    if name.startswith("research-ide/mathscope-m1/"):
        return name.endswith(".mjs") and "/tests/" not in name or name.endswith("/workspace.bundle.js")
    if name.startswith("research-ide/mathscope-m2/"):
        return name.endswith(".mjs") and "/tests/" not in name or name.endswith("/workspace.bundle.js")
    if name.startswith("research-ide/mathscope-m3/p8/"):
        return name.endswith(".mjs")
    if name.startswith("research-ide/mathscope-m4/"):
        return name in ("research-ide/mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json",) or "/evidence/" not in name and name.endswith((".mjs",".json",".lean",".js",".html",".py",".css"))
    return name=="docs/evidence/m4-evidence-panel-v103-20261013/public-v103.html.gz" or name=="research-ide/mathscope-m3/tests/p8-contracts.test.mjs"

paths = ['docs/evidence/m4-evidence-panel-v103-20261013/public-v103.html.gz','research-ide/mathscope-m0','research-ide/mathscope-m1','research-ide/mathscope-m2','research-ide/mathscope-m3/p8','research-ide/mathscope-m3/tests/p8-contracts.test.mjs','research-ide/mathscope-m4']
names = git('ls-tree','-r','--name-only',pin,*paths).decode().splitlines()
names = [n for n in names if select(n)]
extra = "research-ide/mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json"
names.append(extra)
names.extend(row["path"] for row in json.loads((Path(__file__).parent / "inherited-artifacts.json").read_bytes()))
names = sorted(set(names))
process = subprocess.Popen(['git','-c','core.longpaths=true','-C',str(repo),'cat-file','--batch'],
                           stdin=subprocess.PIPE,stdout=subprocess.PIPE)
files={}
for name in names:
    process.stdin.write(f'{pin}:{name}\n'.encode()); process.stdin.flush()
    _, kind, size = process.stdout.readline().decode().split()
    assert kind=='blob', name
    data=process.stdout.read(int(size)); assert process.stdout.read(1)==b'\n'
    dest=out/'source'/name; dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(data)
    files[name]=hashlib.sha256(data).hexdigest()
process.stdin.close()
assert process.wait()==0
(out/'source-pin.json').write_text(json.dumps({'commit':pin,'files':files},indent=2)+'\n',encoding='utf-8')
print(f"Materialized {len(files)} exact Git blobs")

