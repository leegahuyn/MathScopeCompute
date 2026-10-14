"""Reuse byte-pinned prior cloud evidence; a cache receipt is not a proof."""
from __future__ import annotations
import argparse, hashlib, json, platform, subprocess, zipfile
from pathlib import Path

BASE = '5422e232219a5de4722ac4e38ba79eb83b9e95cd'
RUN = 38495642925
FOLDER = 'research-ide/mathscope-m3/evidence/n6-certification-20261014'
PINS = {
 'mean':'5b37eefcbb9aa2a2a87339985d0e017be6b8d3da11f18825bdfed7a8c51b1363',
 'dag':'28041ff889a61632a7a819206154f56afc9a6559f56b147c61b2582f26070e69',
 'series_quadratic':'2bd2757cda3270cff735a5ee8dc2799f864aab5f8a8c99fc3d3874f04d8c8214',
 'full_residual_compare':'293c59755099fd5f40178b05200473b83980a51683a68485ad526c12dc0f0089',
 'initial_residual':'6084bfdd79f8b6a7ecba698ed9f74411d3df668e7abb944e26e688ae25d0e223',
 'radius_monotone':'d0aecbb9abd0234f0e8e1c7728f69a579fd819b2c9aa42be62618e274c7d937e',
 'pressure_mass':'cb8f4b75e099caa04cee1c8e370c3183daf8c74d37305293c7eec726dc7c287e',
}
HEADER_SHA = '010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c'
PDFS = {
 'research-ide/reference-documents/ns-primary-20261013/navier-stokes.pdf':'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
 'research-ide/reference-documents/n6-audit-20261014/blueprint.pdf':'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac',
}
def sha(raw): return hashlib.sha256(raw).hexdigest()
def checked(raw, expected):
    if sha(raw) != expected: raise ValueError('Changed pinned input bytes')
    return raw
def materialize(repo: Path, out: Path):
    out.mkdir(parents=True, exist_ok=True); receipt=[]
    for kind, expected in PINS.items():
        path=repo/FOLDER/f'n6-certification-{kind}-{RUN}.zip'
        raw=checked(path.read_bytes(), expected)
        with zipfile.ZipFile(path) as archive:
            if archive.testzip() is not None: raise ValueError('Corrupt prior artifact')
            names=archive.namelist()
            if len(names)!=len(set(names)): raise ValueError('Ambiguous ZIP member')
            for name in names:
                if not name.endswith('.json') and not (kind=='dag' and name=='source-dag-checkpoint.sqlite'): continue
                target=out/kind/name
                if not target.resolve().is_relative_to((out/kind).resolve()): raise ValueError('Unsafe ZIP member')
                data=archive.read(name)
                if kind=='dag' and name=='header.json': checked(data,HEADER_SHA)
                if name.endswith('.json'): json.loads(data) # Validate data only; do not execute document text.
                target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
                receipt.append({'path':str(target.relative_to(out)).replace('\\','/'),'bytes':len(data),'sha256':sha(data),'archiveSHA256':expected,'priorRun':RUN})
    for path, expected in PDFS.items():
        # Cloud checkout contains the original documents. A sparse local read
        # may retrieve the identical immutable blob without a second PDF copy.
        file=repo/path
        raw=file.read_bytes() if file.exists() else subprocess.check_output(['git','show',BASE+':'+path],cwd=repo)
        checked(raw,expected);receipt.append({'path':path,'bytes':len(raw),'sha256':expected,'kind':'original-reference-document'})
    result={'schema':'MathScope.MeanEquivalence.PinnedCacheReceipt/1','baselineCommit':BASE,'priorRun':RUN,'members':receipt,'python':platform.python_version(),'cacheAuthenticityVerified':True,'cacheAuthenticityImpliesMathematicalProof':False,'originalN601Complete':False,'originalN602Complete':False}
    (out/'input-receipt.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return result
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
    result=materialize(Path(__file__).resolve().parents[3],Path(args.output))
    print(json.dumps({'memberCount':len(result['members']),'cacheAuthenticityVerified':True,'mathematicalProof':False}))
