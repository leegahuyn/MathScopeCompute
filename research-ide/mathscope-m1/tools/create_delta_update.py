#!/usr/bin/env python3
"""Prepare exact, reconstructable small page patches from preserved local builds.

The generated request never uses downloaded/redacted page content as replacement
source. The embedded Worker is diffed as decoded source and escaped back into
its existing JavaScript string. All replacements are verified sequentially.
"""
from pathlib import Path
import argparse
import difflib
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encoded_part(text):
    return json.dumps(text, ensure_ascii=False)[1:-1]


def split_worker(app):
    lines = app.splitlines(keepends=True)
    hits = [i for i, s in enumerate(lines) if s.startswith('const WORKER_SOURCE = ')]
    if len(hits) != 1:
        raise ValueError('Expected one embedded Worker source string')
    i = hits[0]
    literal = lines[i][len('const WORKER_SOURCE = '):].strip()
    if not literal.endswith(';'):
        raise ValueError('Expected a JSON Worker literal')
    return ''.join(lines[:i]), json.loads(literal[:-1]), ''.join(lines[i+1:])


def delta_patches(old, new, full, transform=lambda x: x):
    a, b = old.splitlines(keepends=True), new.splitlines(keepends=True)
    ao, bo = [0], [0]
    for line in a: ao.append(ao[-1]+len(line))
    for line in b: bo.append(bo[-1]+len(line))
    changes = [(ao[i],ao[j],bo[k],bo[l]) for tag,i,j,k,l in
      difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes() if tag != 'equal']
    # Character-sized context avoids copying a huge, unchanged audit-data line.
    for context in (80,160,320,640,1280):
        groups = []
        for change in changes:
            if groups and change[0]-groups[-1][1] <= 2*context:
                groups[-1] = (groups[-1][0],change[1],groups[-1][2],change[3])
            else: groups.append(change)
        patches, trial, ok = [], full, True
        for i,j,k,l in groups:
            left=min(context,i,k)
            right=min(context,len(old)-j,len(new)-l)
            find=transform(old[i-left:j+right])
            replace=transform(new[k-left:l+right])
            if not find or trial.count(find) != 1:
                ok=False
                break
            patches.append({'operation':'replace','find':find,'replace':replace})
            trial=trial.replace(find,replace,1)
        if ok: return patches,trial
    raise ValueError('Could not form unique bounded-context replacements')


def kind_clause(source):
    lines = [s for s in source.splitlines() if s.strip().startswith('const kinds={')]
    if len(lines) != 1:
        raise ValueError('Expected one domain-kind clause')
    return lines[0]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--baseline', type=Path, required=True)
    ap.add_argument('--base-version-hash', required=True)
    ap.add_argument('--summary', required=True)
    ap.add_argument('--output', type=Path, required=True)
    args = ap.parse_args()
    current = ROOT/'mathscope-m1'
    build = json.loads((current/'build-manifest.json').read_text())
    for name, expected in build['sourceFiles'].items():
        if sha((ROOT/name).read_bytes()) != expected:
            raise ValueError('Rebuild changed source before preparing a patch: '+name)
    old = (args.baseline/'workspace.bundle.js').read_text()
    new = (current/'workspace.bundle.js').read_text()
    if sha(new.encode()) != build['bundleSha256']:
        raise ValueError('Current app digest does not match its build')
    if '</script' in old or '</script' in new:
        raise ValueError('HTML closing-tag escaping needs explicit handling')
    op, ow, os = split_worker(old)
    np, nw, ns = split_worker(new)
    if ow != (args.baseline/'m1.worker.js').read_text() or nw != (current/'m1.worker.js').read_text():
        raise ValueError('Decoded embedded Worker differs from its preserved executable')
    all_patches, reconstructed = [], old
    for a, b, transform in [(op, np, lambda x:x), (ow, nw, encoded_part), (os, ns, lambda x:x)]:
        patches, reconstructed = delta_patches(a, b, reconstructed, transform)
        all_patches.extend(patches)
    if reconstructed != new:
        raise ValueError('Patch sequence failed exact full-application reconstruction')
    # The older M0 UI embeds the same contract. Anchor its copy in this app to
    # its generated module header; update the remaining M0 clause separately.
    for patch in all_patches:
        if 'const kinds={' in patch['find'] and '\n' in patch['find']:
            pos=old.index(patch['find'])
            start=old.rfind('const __m1_',0,pos)
            if start < 0: raise ValueError('Shared contract module anchor is absent')
            prefix=old[start:pos]
            patch['find']=prefix+patch['find']
            patch['replace']=prefix+patch['replace']
    check=old
    for patch in all_patches:
        if check.count(patch['find'])!=1: raise ValueError('Anchored patch is ambiguous')
        check=check.replace(patch['find'],patch['replace'],1)
    if check!=new: raise ValueError('Anchored patch failed reconstruction')
    old_clause = kind_clause((args.baseline/'contracts.mjs').read_text())
    new_clause = kind_clause((ROOT/'mathscope-m0/contracts.mjs').read_text())
    if old_clause != new_clause:
        all_patches.append({'operation':'replace','find':old_clause,'replace':new_clause})
    request = {'project_id':29770,'slug':'v0.3.1.html','base_version_hash':args.base_version_hash,
               'patch_summary':args.summary,'patches':all_patches}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    data = json.dumps(request,ensure_ascii=False).encode()
    args.output.write_bytes(data+b'\n')
    metadata = {'schema':'MathScope.SourceDeltaUpdate/1','baseVersionHash':args.base_version_hash,
      'requestFile':str(args.output),'patchCount':len(all_patches),'requestBytes':len(data)+1,
      'oldAppSha256':sha(old.encode()),'newAppSha256':sha(new.encode()),
      'oldWorkerSha256':sha(ow.encode()),'newWorkerSha256':sha(nw.encode()),
      'wholeAppReconstructedExactly':True,'decodedWorkersMatchExecutables':True,
      'currentSourcePinsVerified':True,'largestFindBytes':max(len(p['find'].encode()) for p in all_patches),
      'largestReplacementBytes':max(len(p['replace'].encode()) for p in all_patches),
      'externalM0ClauseUpdated':old_clause!=new_clause,'deployed':False,
      'sourcePolicy':'Exact preserved local source only; no fetched HTML replacement'}
    args.output.with_suffix('.metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(metadata,ensure_ascii=False))


if __name__ == '__main__':
    main()
