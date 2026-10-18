#!/usr/bin/env python3
"""Independent read-only byte/closure audit. Does not open any SQLite cache.

No recovered worker/helper module is imported or executed. Native edge rules
are independently stated from the pinned original extractor's source contract.
"""
from pathlib import Path
import collections
import gzip
import hashlib
import json
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'recovered/base'
WORK = ROOT / 'work/prune_recovery/scalar'
OUT = Path(__file__).resolve().parents[1]
GIT = ROOT / 'work/recovery_git/recovered'
SOURCE = GIT / 'runtime/source/original-parent.ndjson.gz'
PREFIX = 'analysis/base/PR30-primary67-continuation/'
HEADER = PREFIX + 'pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
ANGULAR = PREFIX + 'MathScopeCompute/research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/initialized-angular-construction.json'
EXPECTED = {
 'compressed': '42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3',
 'raw': '9be5187506edbd2e7ccdad81392b0c29cc84350f374e331b7b5845a435c7fdf0',
 'nodes': '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f',
 'header': 'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1',
}
EXPR = {'actual_expression_partial', 'm3_aux_expression_partial', 'm3_coupled_expression_partial', 'm3_forced_expression_partial'}
CALLS = EXPR | {'m3_aux_indexed_partial', 'm3_aux_inverse_partial', 'm3_global_indexed_partial', 'm3_coupled_indexed_partial', 'm3_coupled_inverse_partial'}
OTHER_NATIVE = {'actual_natural_series', 'actual_quadratic_root', 'actual_monotone_root', 'actual_background_even_profile', 'actual_background_picard', 'actual_covariance_volterra', 'm3_global_pulse_jet', 'm3_forced_pulse_partial'}
NATIVE = CALLS | OTHER_NATIVE
LEAF = {'coordinate', 'rational', 'source_parameter'}
UNARY = {'inverse', 'sqrt_positive', 'log_positive', 'exp', 'sine', 'cosine', 'ceiling', 'integer_power', 'source_step_derivative'}

def sha_bytes(data): return hashlib.sha256(data).hexdigest()
def sha_file(path): return sha_bytes(path.read_bytes())
def obj_hash(value): return sha_bytes(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode())
def load(path): return json.loads(path.read_bytes())
def check(value, message):
    if not value: raise AssertionError(message)

def edges(node):
    op, a = node['op'], node['args']
    if op in LEAF: return []
    if op in UNARY: return a[:1]
    if op in {'add','multiply','maximum','smooth_piecewise','definite_integral'}: return a
    if op in CALLS: return a[1]
    if op == 'actual_natural_series': return a[1:3]
    if op == 'actual_quadratic_root': return a[2:3]
    if op == 'actual_monotone_root': return a[1:]
    if op in {'actual_background_even_profile','actual_background_picard'}: return a[2:4]
    if op in {'actual_covariance_volterra','m3_global_pulse_jet'}: return [a[2], *a[3]]
    if op == 'm3_forced_pulse_partial': return [a[3], *a[4]]
    raise AssertionError('Unreviewed operation '+op)

def registry_map(header):
    result = {}
    def visit(value):
        for key, item in value.items():
            if key == 'base': visit(item)
            elif isinstance(item,str):
                try: decoded = json.loads(item)
                except ValueError: continue
                check(key not in result, 'Duplicate registry '+key)
                result[key] = decoded
    visit(header['definitions'])
    return result

def resolve(node, reg):
    op,a = node['op'],node['args']
    if op == 'actual_natural_series': return 'fixed',reg['fixed']
    if op == 'actual_covariance_volterra':
        matches = [d for d in reg['m3GlobalPulses'] if d['covariance']==a[0]]
        check(len(matches)==1,'Ambiguous covariance')
        return 'covariance:'+str(a[0]),matches[0]
    groups = {'actual_expression_partial':'expression', 'm3_aux_expression_partial':'expressionDefinitions',
              'm3_aux_indexed_partial':'fieldDefinitions', 'm3_aux_inverse_partial':'inverseDefinitions',
              'm3_global_indexed_partial':'m3GlobalFields', 'actual_monotone_root':'monotone',
              'actual_quadratic_root':'quadratic', 'actual_background_even_profile':'picard',
              'actual_background_picard':'picard', 'm3_global_pulse_jet':'m3GlobalPulses'}
    if op in groups:
        index = -1-a[0] if op=='m3_aux_expression_partial' else a[0]
        check(type(index) is int and index>=0,'Bad native index')
        return groups[op]+':'+str(index),reg[groups[op]][index]
    group = {'m3_coupled_expression_partial':0,'m3_coupled_indexed_partial':1,'m3_coupled_inverse_partial':2,'m3_forced_pulse_partial':3,'m3_forced_expression_partial':4}[op]
    index = a[0] if op=='m3_forced_pulse_partial' else int(a[0].split(':')[-1])
    check(type(index) is int and index>=0,'Bad extended native index')
    return f'definitions:{group}:{index}',reg['definitions'][group][index]

def gather(records, value):
    if isinstance(value,dict):
        for key,item in value.items():
            if key.isdigit() and isinstance(item,dict) and set(item)=={'op','args'}:
                check(key not in records or records[key]==item,'Conflicting old packet node '+key)
                records[key]=item
            else: gather(records,item)
    elif isinstance(value,list):
        for item in value: gather(records,item)

def main():
    start=time.monotonic()
    export=load(WORK/'evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json')
    receipt=load(WORK/'evidence/SCALAR_RECOVERY_RECEIPT.json')
    missing=load(WORK/'evidence/RECOVERED_MISSING_700.json')
    old=load(BASE/'work/actual_evaluator/evidence/ACTUAL_ANGULAR_ENERGY_FRONTEND.json')
    code=WORK/'code/recover_scalar_closure.py'
    before={str(BASE/p):sha_file(BASE/p) for p in receipt['baseline_pins']}
    for p,pin in receipt['baseline_pins'].items(): check(before[str(BASE/p)]==pin,'Changed baseline '+p)
    check(sha_file(code)==receipt['recovery_code_sha256']==export['recovery_code_sha256'],'Recovery code/result pin mismatch')
    stage3=GIT/'tools/n6-domain-transport-20261015/verify_domain_transport.py'
    check(sha_file(stage3)==receipt['stage3_sha256']=='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f','Changed Stage3')
    # Independently reconstruct the original combined packet, without importing
    # the worker or old evaluator and without rerunning either evaluator.
    manifest=load(BASE/'work/actual_evaluator/evidence/INPUT_MANIFEST.json')
    for row in manifest['files']:
        p=BASE/row['path'];check(p.stat().st_size==row['bytes'] and sha_file(p)==row['sha256'],'Input manifest pin mismatch')
    original=load(BASE/(PREFIX+'pressure-proof/angular-pde/ANGULAR_PDE_SOURCE_V3.json'))['records']
    supplements=load(BASE/'work/actual_evaluator/evidence/SAME_HEADER_SCALAR_SUPPLEMENTS.json')
    for row in supplements['supplements']:
        p=BASE/row['path'];check(sha_file(p)==row['sha256'],'Changed same-header supplement')
        value=load(p);check(value['sourceHeaderSHA256']==EXPECTED['header'],'Foreign supplement header')
        before_count=len(original);gather(original,value)
        check(len(original)-before_count==row['new_scalar_records'],'Supplement record delta')
    check(len(original)==92722,'Original combined packet size')
    selected=dict(original)
    for key,node in export['records'].items():
        check(key not in selected or selected[key]==node,'Old/export conflict')
        selected[key]=node
    # Single sequential original-gzip read: all four independent hashes, exact
    # contiguous IDs, exact exported and original packet node records, gzip CRC.
    compressed=sha_file(SOURCE);rh=hashlib.sha256();nh=hashlib.sha256()
    with gzip.open(SOURCE,'rb') as stream:
        header_line=stream.readline();rh.update(header_line);raw_bytes=len(header_line)
        check(header_line==(BASE/HEADER).read_bytes(),'Standalone/header first-line inequality')
        header=json.loads(header_line);count=0;matched=set()
        for line in stream:
            check(line.startswith(b'[') and line.endswith(b']\n'),'Malformed NDJSON framing')
            prefix,payload=line[1:].split(b',',1);ident=int(prefix)
            check(ident==count,'Noncontiguous original ID');count+=1
            rh.update(line);nh.update(line);raw_bytes+=len(line)
            key=str(ident)
            if key in selected:
                node=json.loads(payload[:-2])
                check(node==selected[key],'Export/original packet differs at '+key)
                matched.add(key)
    hashes={'compressed':compressed,'raw':rh.hexdigest(),'nodes':nh.hexdigest(),'header':sha_bytes(header_line)}
    check(hashes==EXPECTED,'Full-stream four-hash mismatch')
    check(count==3892594 and raw_bytes==209857208 and SOURCE.stat().st_size==32688149,'Full stream sizes mismatch')
    check(matched==set(selected),'Selected source ID absent')
    reg=registry_map(header);records=export['records']
    angular=load(BASE/ANGULAR)
    roots=sorted({v[k] for t in angular['templates'] for row in t['waveRows'] for v in row['velocity'] for k in ('real','imaginary')}|set(angular['reference']['normalizedMeanVelocity']))
    check(roots==export['roots'],'Initialized coefficient/mean roots differ')
    check(angular['global']['velocity']==export['frozen_initialized_velocity']==[3825006,3825007,3825008] and angular['global']['pressure']==export['frozen_initialized_pressure']==3825009,'Initialized tuple differs')
    seen=set();stack=list(roots);native={};bodyless={}
    while stack:
        ident=stack.pop()
        check(type(ident) is int and 0<=ident<count,'Invalid dependency ID')
        if ident in seen: continue
        seen.add(ident);node=records[str(ident)];stack.extend(edges(node))
        if node['op'] in NATIVE:
            key,d=resolve(node,reg)
            n={'operation':node['op'],'registry':key,'definition_sha256':obj_hash(d),'definition_keys':sorted(d)}
            native[str(ident)]=n
            if type(d.get('body')) is int: stack.append(d['body'])
            else: bodyless[str(ident)]=n
    check(seen=={int(i) for i in records},'Raw closure has extra or missing nodes')
    check(native==export['native_calls'] and bodyless==export['raw_bodyless_frontiers'],'Native metadata/registry resolution differs')
    old_missing=old['numeric_coefficient_closure_attempt']['missing_scalar_bodies']
    check(len(old_missing)==len(missing['rows'])==700,'Original missing set size')
    recovered_by_id={r['root']:r for r in missing['rows']};roles=collections.Counter()
    all_binders={n['args'][1] for n in records.values() if n['op']=='definite_integral'}
    for row in old_missing:
        ident=row['root'];rec=recovered_by_id[ident];parent=row['requested_by'];pn=records[str(parent['node'])]
        binder=parent['edge']=='argument' and pn['op']=='definite_integral' and pn['args'][1]==ident
        role='integral_binding_coordinate' if binder else 'operand';roles[role]+=1
        check(rec['requested_by']==parent and rec['recovered_role']==role and rec['record']==records[str(ident)] and rec['record_sha256']==obj_hash(rec['record']),'Missing-row recovery mismatch')
        check((records[str(ident)]['op']=='coordinate')==binder,'Unexpected role/node-kind split')
        check((ident in all_binders)==binder,'Binder incidence beyond recorded role differs')
    semantic={i:n for i,n in native.items() if n['operation'] not in EXPR}
    derivative={i:records[i] for i,n in native.items() if n['operation'] in EXPR and any(records[i]['args'][2])}
    zero_expression={i for i,n in native.items() if n['operation'] in EXPR and not any(records[i]['args'][2])}
    new=set(records)-set(original);overlap=set(records)&set(original)
    check(dict(roles)==receipt['missing_role_counts']=={'integral_binding_coordinate':134,'operand':566},'Role counts')
    check(len(records)==receipt['raw_closure_records']==128555 and len(native)==1602 and len(bodyless)==572,'Closure/native count mismatch')
    check(len(semantic)==589 and len(derivative)==811 and len(zero_expression)==202,'Semantic/derivative partition')
    check(len(overlap)==receipt['raw_closure_old_packet_overlap']==60704 and len(new)==receipt['raw_new_records_not_in_old_packet']==67851,'Set difference count mismatch')
    check({str(r['root']) for r in old_missing}<=new,'First missing700 not all new')
    check(obj_hash(sorted(seen))==receipt['raw_closure_source_ids_sha256'],'ID sequence hash')
    for field in ('scalar_numeric_evaluation_complete','final_field_evaluator_complete','N706_closed','N805_closed'):
        check(receipt[field] is False and export[field] is False,'Unsupported completion claim '+field)
    lf=GIT/'tools/n6-native-domain-frontier-20261015/header_binding.py'
    archived=GIT/'original-archive-byte-form/header_binding.py'
    check(lf.read_bytes().replace(b'\n',b'\r\n')==archived.read_bytes(),'Header helper not newline-only restoration')
    check(sha_file(archived)=='afec61dba5232fcecd8d35b4d46e4ee9707b971a395a7c493b7f93654fbc1895','Archived helper expected pin')
    for p,h in before.items(): check(sha_file(Path(p))==h,'Baseline changed during independent audit')
    result={'schema':'MathScope.ScalarRecoveryIndependentReview/1','status':'PASS',
      'review_code_sha256':sha_file(Path(__file__)),'recovery_code_sha256':sha_file(code),
      'reviewed_output_sha256':{p.name:sha_file(p) for p in (WORK/'evidence').glob('*.json')},
      'independent_stream_hashes':hashes,'source_nodes':count,'raw_bytes':raw_bytes,
      'unique_original_records_compared':len(original),'exported_records_compared':len(records),'unique_union_records_compared':len(matched),
      'raw_closure_independently_reconstructed':True,'raw_closure_records':len(seen),'raw_native_calls':len(native),
      'raw_bodyless_frontiers':len(bodyless),'semantic_native_kernels':len(semantic),'semantic_kernels_with_integer_body':len(set(semantic)-set(bodyless)),
      'expression_calls':len(native)-len(semantic),'nonzero_expression_derivative_calls':len(derivative),'zero_order_expression_calls':len(zero_expression),
      'semantic_kernel_operations':dict(collections.Counter(n['operation'] for n in semantic.values())),
      'nonzero_derivative_operations':dict(collections.Counter(n['op'] for n in derivative.values())),
      'missing_recovered':len(recovered_by_id),'missing_role_counts':dict(roles),'old_packet_overlap':len(overlap),'raw_new_records':len(new),
      'baseline_helpers_byte_unchanged_before_and_after':True,
      'header_helper_byte_forms':{'git_LF_sha256':sha_file(lf),'archived_CRLF_sha256':sha_file(archived),'only_line_endings_differ':True,'scalar_worker_substitutes_neither_helper':True},
      'limitations':['Raw closure is syntactic capture, not executable semantic dependency closure.','572 counts bodyless registries only; 589 additionally retains 17 non-expression native kernels with integer bodies.','811 are nonzero expression-call derivative obligations; they are not scalar values and are disjoint from the 589 non-expression native calls.','134/566 classifies the preserved missing-source entries: all 134 coordinate entries are integral binders. Body occurrences still require lexical scope.','Initialized coefficient closure does not identify the final corrected field. Initial1260 source obligations and final M3 two OPEN items are distinct inventories.'],
      'source_producers_executed':False,'old_evaluator_executed':False,'worker_modules_imported':False,'sqlite_opened':False,
      'elapsed_seconds':round(time.monotonic()-start,3)}
    (OUT/'INDEPENDENT_REVIEW.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k not in {'limitations','reviewed_output_sha256','semantic_kernel_operations'}},indent=2))

if __name__=='__main__': main()
