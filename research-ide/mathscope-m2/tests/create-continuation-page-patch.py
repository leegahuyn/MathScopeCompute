"""Prepare unique-anchor changes to the verified existing public M2 page.

The public HTML stays transient. The unchanged M1 Worker and all content outside
the M2 runtime and its scope note are preserved. This script does not publish.
"""
from pathlib import Path
import difflib
import hashlib
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
M2 = ROOT / 'research-ide/mathscope-m2'
BASE_COMMIT = '8a0046c547af4cccdbecae81fe647d414dd75d3f'
PUBLIC_SHA = '14c0cd8068fc27e5810df2cc82d988b8c1fc134bfbee5ee3aa6e075e939c6e75'
live_path, out = map(Path, sys.argv[1:3])
out.mkdir(parents=True, exist_ok=True)
original = live_path.read_text()
sha = lambda value: hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()
assert sha(original) == PUBLIC_SHA, 'This patch requires the independently verified v74 public bytes.'
candidate = original
patches = []


def base(path):
    return subprocess.check_output(['git', 'show', BASE_COMMIT + ':' + str(path)], cwd=ROOT).decode()


def add(find, replacement):
    global candidate
    if find == replacement:
        return
    assert find and candidate.count(find) == 1, ('Nonunique patch anchor', find[:120])
    candidate = candidate.replace(find, replacement, 1)
    patches.append({'operation': 'replace', 'find': find, 'replace': replacement})


def shrink(find, replacement):
    # The embedded static Worker occupies one long JSON-string line. Remove its
    # unchanged ends while retaining a unique exact context in the public page.
    left = 0
    size = min(len(find), len(replacement))
    while left < size and find[left] == replacement[left]:
        left += 1
    right = 0
    while right < size-left and find[-right-1] == replacement[-right-1]:
        right += 1
    for context in [240, 1000, 10000, 100000, max(len(find), len(replacement))]:
        start = max(0, left-context)
        tail = max(0, right-context)
        old = find[start:len(find)-tail]
        new = replacement[start:len(replacement)-tail]
        if old and candidate.count(old) == 1:
            return old, new
    raise AssertionError('Could not bind the embedded Worker change uniquely.')


script_audit = []
for tag, file in [('mathscope-m2-js', 'workspace.bundle.js'),
                  ('mathscope-m2-visualization-js', 'visualization.bundle.js')]:
    old = base(Path('research-ide/mathscope-m2') / file).replace('</script', '<\\/script')
    new = (M2 / file).read_text().replace('</script', '<\\/script')
    old_tag = '<script id="' + tag + '">\n' + old + '\n</script>'
    new_tag = '<script id="' + tag + '">\n' + new + '\n</script>'
    assert candidate.count(old_tag) == 1, ('Public runtime differs from the GitHub base', tag)
    before = len(patches)
    old_sha = sha(old)
    # Isolate the long Worker string before grouping nearby line edits. Otherwise
    # a changed module index next to it would prevent removing its common prefix.
    old_worker = re.findall(r'^const WORKER_SOURCE = .+$', old, re.M)
    new_worker = re.findall(r'^const WORKER_SOURCE = .+$', new, re.M)
    if old_worker or new_worker:
        assert len(old_worker) == len(new_worker) == 1
        if old_worker[0] != new_worker[0]:
            add(*shrink(old_worker[0], new_worker[0]))
            old = old.replace(old_worker[0], new_worker[0], 1)
    left, right = old.splitlines(keepends=True), new.splitlines(keepends=True)
    matcher = difflib.SequenceMatcher(None, left, right)
    offsets = [0]
    for line in left:
        offsets.append(offsets[-1]+len(line))
    body_start = candidate.index('<script id="'+tag+'">\n')+len('<script id="'+tag+'">\n')
    # Work backwards. Earlier offsets stay valid, and any adjacent context is
    # read from the current candidate, so previous replacements cannot stale it.
    for operation, a, b, c, d in reversed(matcher.get_opcodes()):
        if operation == 'equal':
            continue
        start, end = body_start+offsets[a], body_start+offsets[b]
        find, replacement = ''.join(left[a:b]), ''.join(right[c:d])
        assert candidate[start:end] == find, 'The next original hunk moved unexpectedly.'
        for width in [0, 64, 240, 1000, 10000]:
            lo, hi = max(body_start, start-width), min(len(candidate), end+width)
            anchor = candidate[lo:hi]
            if anchor and candidate.count(anchor) == 1:
                add(anchor, candidate[lo:start]+replacement+candidate[end:hi])
                break
        else:
            raise AssertionError('No unique bounded context for a changed runtime hunk.')
    assert candidate.count(new_tag) == 1, ('Patched runtime is not exactly the built source', tag)
    script_audit.append({'id': tag, 'source': file, 'oldSHA256': old_sha, 'newSHA256': sha(new),
                         'patches': len(patches)-before, 'exactBuiltTagVerified': True})

scope = re.compile(r'<details\b[^>]*\bid="m2-completion-gate"[\s\S]*?</details>')
old_note = scope.findall(base(Path('research-ide/mathscope-m2/workspace.html')))
new_note = scope.findall((M2/'workspace.html').read_text())
assert len(old_note) == len(new_note) == 1
add(old_note[0], new_note[0])

# Strip only the deliberately changed surfaces and compare everything else.
def preserved(html):
    html = scope.sub('[M2_SCOPE_NOTE]', html)
    for tag, _ in [('mathscope-m2-js', ''), ('mathscope-m2-visualization-js', '')]:
        html = re.sub(r'<script id="'+tag+r'">[\s\S]*?</script>', '['+tag+']', html)
    return html


assert preserved(original) == preserved(candidate)
payload = {'project_id': 29770, 'slug': 'v0.3.1.html', 'base_version_hash': 'b9e93d8d',
           'patch_summary': 'M2 0.3.9: actual directed cutoff integrals, source band-domain check, physical curl/norm evidence, and explicit ell=1 positivity obstruction; M3 remains pending.',
           'patches': patches}
patch_file = out/'v74-to-v75-patches.json'
patch_file.write_text(json.dumps(payload, ensure_ascii=False))
(out/'v75-candidate.html').write_text(candidate)
audit = {'schema': 'MathScope.M2.Continuation.TargetedPagePatch/1', 'baseCommit': BASE_COMMIT,
         'baseVersion': 74, 'baseVersionHash': 'b9e93d8d', 'publicBaseSHA256': sha(original),
         'candidateSHA256': sha(candidate), 'patchPayloadSHA256': sha(patch_file.read_bytes()),
         'patchCount': len(patches), 'patchPayloadBytes': patch_file.stat().st_size,
         'scripts': script_audit, 'everyAnchorUnique': True, 'builtRuntimeExact': True,
         'allOtherPageContentUnchanged': True, 'originalM1WorkerUnchanged': True,
         'publicPageStoredOnlyAsTransientInput': True, 'newAssets': 0, 'newPages': 0,
         'publicationExecutedByThisScript': False}
record = M2/'navier/research/evidence/m2-continuation-20261011/page-patch-audit.json'
record.write_text(json.dumps(audit, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(audit, ensure_ascii=False))
