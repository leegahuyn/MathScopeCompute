"""Small source-byte intake only; never reruns a historical producer."""
from pathlib import Path
import hashlib
import json
import subprocess

REPO = Path('/workspace/scratch/00fe7982b3e1/MathScopeCompute')
OUT = REPO / 'research-ide/mathscope-m3/logradius-recovery-20261019'
BASELINE = '333d6095d4a2d2d69ceec9b25c44e1d3381e36d2'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def row(path, original=False):
    data = (REPO / path).read_bytes()
    result = {'path': path, 'bytes': len(data), 'sha256': sha(data)}
    if original:
        result['baseline_git_blob'] = subprocess.check_output(
            ['git', 'rev-parse', BASELINE + ':' + path], cwd=REPO, text=True).strip()
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == result['baseline_git_blob']
    return result

radial = 'research-ide/mathscope-m3/radial-recovery-20261019/'
inputs = json.loads((REPO / radial / 'SOURCE_BOUND_INPUTS.json').read_text())
cap_row = inputs['caller_capsule']
cap_bytes = (REPO / cap_row['path']).read_bytes()
assert sha(cap_bytes) == cap_row['sha256']
cap = json.loads(cap_bytes)
source_nodes = cap['source_nodes']
raw_row = inputs['current_recovered_source_files']['closure']
raw = (REPO / raw_row['path']).read_bytes()
assert sha(raw) == raw_row['sha256']
actual = json.loads(raw)['records']
boundaries = {239, 257, 275}

def closure(roots):
    selected, pending = set(), list(roots)
    while pending:
        node_id = pending.pop()
        if node_id in selected:
            continue
        node = source_nodes[str(node_id)]
        assert actual[str(node_id)] == node
        assert cap['source_record_origins'][str(node_id)] == ['closure']
        selected.add(node_id)
        if node_id in boundaries or node['op'] in ['rational', 'source_parameter']:
            continue
        assert node['op'] in ['add', 'multiply', 'inverse', 'exp', 'log_positive']
        pending.extend(node['args'])
    return [{'id': i, 'node': source_nodes[str(i)], 'origins': ['closure']} for i in sorted(selected)]

trace = closure([259, 277, 278, 279, 280, 319])
link = [{'id': i, 'node': source_nodes[str(i)], 'origins': ['closure']} for i in [12, 28825, 28826]]
for r in link:
    assert actual[str(r['id'])] == r['node']
prior = json.loads((REPO / radial / 'evidence/validation-attempt3/BOUND_ORIGINAL_A13.json').read_text())
profile_text = (REPO / 'research-ide/mathscope-m2/navier/source-profile-data.mjs').read_text()
profile = json.loads(profile_text[profile_text.index('{'):].rstrip().rstrip(';'))
parameters = {k: profile['parametersExactExpressions'][k] for k in ['Md', 'T', 'BOuter', 'Tf', 'lambda', 'h', 'XR']}
new_ids = sorted(set(r['id'] for r in trace) - set(prior['sourceNodeIds']))
assert len(trace) == 57 and len(new_ids) == 21
code_files = inputs['original_code_files'] + [row('research-ide/mathscope-m2/navier/actual-selection-arithmetic-enclosure-kernel.mjs', True)]
manifest = {
    'schema': 'MathScope.SourceBoundLogRadiusInputs/1',
    'original_baseline_commit': BASELINE,
    'scope': 'Saved original closed scalar log-radius path only; original integral bounds and their recovered source binding are reused.',
    'radial_binding_files': [row(radial + 'bind_original_a13.mjs'), row(radial + 'SOURCE_BOUND_INPUTS.json')],
    'original_code_files': code_files,
    'caller_capsule': cap_row,
    'current_recovered_source_files': inputs['current_recovered_source_files'],
    'execution_trace': trace,
    'non_arithmetic_boundary_ids': [239, 257, 275],
    'output_roots': {'Qb': 259, 'ratio': 277, 'logRatio': 278, 'inverseOneMinusH': 279, 'terminalWait': 280, 'logRadiusOverXR': 319},
    'unevaluated_Xb_interpretation_link': link,
    'inherited_A13_record_count': 77,
    'new_arithmetic_record_ids': new_ids,
    'additional_interpretation_record_ids': [12, 28825, 28826],
    'requested_parameter_names': ['T', 'BOuter', 'lambda', 'h', 'Tf'],
    'original_parameter_definitions': parameters,
    'XR_not_requested_or_evaluated': True,
    'original_paper': inputs['original_paper'],
    'normalization': {'Qp': 'h*K', 'K_closed_bounds': ['1/256', '27/128'], 'factor': 54},
    'scope_exclusions': ['original integral relative tolerance', 'whole Xb relative accuracy', 'actual indexed caller or physical point', 'ell and mesh decisions', 'whole-K field', 'N7-06', 'N8-05'],
}
target = OUT / 'SOURCE_BOUND_INPUTS.json'
assert not target.exists(), 'Do not overwrite source intake'
target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'manifest': str(target), 'bytes': target.stat().st_size, 'sha256': sha(target.read_bytes()), 'trace_records': len(trace), 'new_arithmetic_records': len(new_ids)}, indent=2))
