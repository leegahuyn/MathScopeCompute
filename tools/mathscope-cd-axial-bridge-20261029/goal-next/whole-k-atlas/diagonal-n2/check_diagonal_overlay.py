"""Recompute all three hosted diagonal overlay bytes without writing source files."""

from argparse import ArgumentParser
from hashlib import sha1, sha256
from pathlib import Path
import json
import subprocess


SOURCE='f8cb4034e86d7b669d52a6f2248aebba156b51b5'
EVIDENCE='5c5fe160f964bd195b16ee231380550f73250927'
TOOL='tools/mathscope-cd-axial-bridge-20261029/goal-next/whole-k-atlas/prepare_diagonal_materialization.py'


def git_blob(repo, commit, path):
    return subprocess.check_output(['git','-c','core.longpaths=true','-C',str(repo),'show',f'{commit}:{path}'])


def main():
    parser=ArgumentParser(description=__doc__)
    for k in ('repo','artifact','out'):
        parser.add_argument('--'+k,type=Path,required=True)
    a=parser.parse_args()
    receipt=(a.artifact/'diagonal-overlay.json').read_bytes()
    metadata=json.loads(receipt)
    assert metadata['originalSourceCommit']==SOURCE
    generator=git_blob(a.repo,EVIDENCE,TOOL)
    functions={'__name__':'read_only_overlay_replay'}
    exec(compile(generator,TOOL,'exec'),functions)
    records={}
    for name,expected_blob in functions['SOURCES'].items():
        path='research-ide/mathscope-m2/navier/'+name
        original=git_blob(a.repo,SOURCE,path)
        assert sha1(f'blob {len(original)}\0'.encode()+original).hexdigest()==expected_blob
        if 'common-admissible-family' in name:
            patched=functions['change'](
                original,
                'maxJetRequests:request.maxJetRequests},\n    velocitySeminorms=attachActualVelocityPhysicalSeminorms',
                'maxJetRequests:request.maxJetRequests,...(context.selectorDiagonalOnly===true?{selectorDiagonalOnly:true}:{})},\n'
                '    velocitySeminorms=attachActualVelocityPhysicalSeminorms')
        else:
            patched=functions['narrow_rows'](original,'velocity' if 'velocity' in name else 'pressure')
        record={'originalGitBlob':expected_blob,'originalSHA256':sha256(original).hexdigest(),
                'patchedSHA256':sha256(patched).hexdigest()}
        assert metadata['files'][name]==record
        records[name]=record
    assert set(records)==set(metadata['files'])
    stage=json.loads((a.artifact/'original-whole-k-prefix.json').read_bytes())
    assert stage['currentStage']=='COMPLETE' and stage['executingCommit']==EVIDENCE
    assert stage['selectorDiagonalOnly'] and stage['requestedPrefix']==2
    rows=stage['normRowProgress']
    assert len(rows)==6
    for label in ('actual-all-order-velocity-seminorm','actual-all-order-pressure-stress-seminorm'):
        assert [(r['order'],r['derivativeOrder']) for r in rows if r['phase']==label]==[(1,1),(2,2),(3,3)]
    out={'schema':'MathScope.N7.ActualDiagonalOverlayReadback/1','sourceCommit':SOURCE,'evidenceCommit':EVIDENCE,
         'generatorSHA256':sha256(generator).hexdigest(),'hostedOverlaySHA256':sha256(receipt).hexdigest(),
         'files':records,'velocityAndPressureDerivativeOrders':[1,2,3],
         'scope':'In-memory recomputation of the original reversible producer patch and exact hosted progress rows.'}
    raw=(json.dumps(out,indent=2)+'\n').encode();a.out.write_bytes(raw)
    print('PASS exact three overlay patches and six actual norm rows')
    print(f'{sha256(raw).hexdigest()}  {a.out.name}')


if __name__=='__main__':
    main()
