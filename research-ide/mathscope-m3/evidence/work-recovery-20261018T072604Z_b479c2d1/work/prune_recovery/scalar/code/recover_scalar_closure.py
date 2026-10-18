#!/usr/bin/env python3
"""New recovery implementation: authenticate bytes, then export an exact raw closure.

This file is not a recovered copy of the lost implementation. It never produces
or reconstructs the private source. Registry body traversal is a conservative raw
capture, not native semantic evaluation or a proof that the initialized field is
the final field.
"""
from __future__ import annotations
import argparse, collections, gzip, hashlib, importlib.util, json, pathlib, sys, time

BASE = 'analysis/base/PR30-primary67-continuation/'
PACKET = BASE+'pressure-proof/angular-pde/ANGULAR_PDE_SOURCE_V3.json'
HEADER = BASE+'pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
ANGULAR = BASE+'MathScopeCompute/research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/initialized-angular-construction.json'
OLD_CODE = 'work/actual_evaluator/code/actual_angular_energy.py'
OLD_RESULT = 'work/actual_evaluator/evidence/ACTUAL_ANGULAR_ENERGY_FRONTEND.json'
MANIFEST = 'work/actual_evaluator/evidence/INPUT_MANIFEST.json'
SUPPLEMENTS = 'work/actual_evaluator/evidence/SAME_HEADER_SCALAR_SUPPLEMENTS.json'
NATIVE = 'analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015/native_domain_extract.py'
PINS = {
    OLD_CODE:'7961e7ef2ff75ae45389d579a5d25be9262992ad9c4f154b26c3c048b7cf1688',
    OLD_RESULT:'15126cd331b43904066c63768585d6b99d8f719fab140bffb37d238d3a6739c2',
    MANIFEST:'a54eb4cb466ba347adefd93304f8f6a628cfc1abc2ac5ff43c306e87262187de',
    SUPPLEMENTS:'a56d606166a6a622baef231e9f1bc62432f1ea813e5dee6591039f5f2fdc926f',
    NATIVE:'566e1a18b5417cafecf9fe7a4cd2e38d1e270c0cc29c1d984448a579a2a92f9d',
    HEADER:'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1',
}
STAGE3_PIN = '388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f'
SOURCE_PIN = {'compressed_bytes':32688149,'compressed_sha256':'42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3',
 'raw_bytes':209857208,'raw_sha256':'9be5187506edbd2e7ccdad81392b0c29cc84350f374e331b7b5845a435c7fdf0',
 'nodes':3892594,'node_sha256':'7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'}

def require(x, message):
    if not x: raise ValueError(message)
def canonical(x): return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def digest(x): return hashlib.sha256(canonical(x)).hexdigest()
def file_sha(path):
    h=hashlib.sha256()
    with pathlib.Path(path).open('rb') as f:
        for block in iter(lambda:f.read(1024*1024), b''): h.update(block)
    return h.hexdigest()
def write(path,x): pathlib.Path(path).write_bytes(canonical(x)+b'\n')
def load(path): return json.loads(pathlib.Path(path).read_bytes())
def module(path,name,pin=None):
    if pin: require(file_sha(path)==pin,'Changed pinned helper '+str(path))
    spec=importlib.util.spec_from_file_location(name,path); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def merge(records, value, seen):
    if isinstance(value,dict):
        for key,v in value.items():
            if key.isdigit() and isinstance(v,dict) and set(v)=={'op','args'}:
                require(key not in records or records[key]==v,'Conflicting same-source scalar record '+key)
                records[key]=v; seen.add(key)
            else: merge(records,v,seen)
    elif isinstance(value,list):
        for v in value: merge(records,v,seen)

def assemble(root):
    root=pathlib.Path(root)
    for path,pin in PINS.items(): require(file_sha(root/path)==pin,'Changed baseline pin '+path)
    manifest=load(root/MANIFEST)
    for row in manifest['files']:
        p=root/row['path'];require(p.stat().st_size==row['bytes'] and file_sha(p)==row['sha256'],'Changed input '+row['path'])
    p=load(root/PACKET);h=load(root/HEADER);a=load(root/ANGULAR);r={}
    def registries(d):
        for k,v in d.items():
            if k=='base':registries(v)
            elif isinstance(v,str):
                try:r[k]=json.loads(v)
                except ValueError:pass
    registries(h['definitions'])
    require(p['sourceHeaderSHA256']==PINS[HEADER] and p['constructionSHA256']==file_sha(root/ANGULAR),'Packet source join failed')
    require(a['global']['velocity']==[3825006,3825007,3825008] and a['global']['pressure']==3825009,'Initialized tuple changed')
    records=p['records'];supplements=load(root/SUPPLEMENTS);logs=[]
    require(supplements['sourceHeaderSHA256']==PINS[HEADER],'Supplement header mismatch')
    for row in supplements['supplements']:
        f=root/row['path'];require(file_sha(f)==row['sha256'],'Changed supplement '+row['path'])
        data=load(f);require(data['sourceHeaderSHA256']==PINS[HEADER],'Foreign supplement header')
        seen=set();before=len(records);merge(records,data,seen)
        require(len(records)-before==row['new_scalar_records'],'Supplement record delta changed')
        logs.append({'path':row['path'],'sha256':row['sha256'],'checked':len(seen),'new':len(records)-before})
    require(len(records)==92722,'Combined packet count changed')
    roots=sorted({v[part] for t in a['templates'] for row in t['waveRows'] for v in row['velocity'] for part in ('real','imaginary')}|set(a['reference']['normalizedMeanVelocity']))
    helper=module(root/NATIVE,'pinned_native',PINS[NATIVE]);frontend=module(root/OLD_CODE,'pinned_frontend',PINS[OLD_CODE])
    old=load(root/OLD_RESULT)
    compiler=frontend.Compile(records,r,helper.argument_children,helper.NATIVE,helper.native_definition)
    replay=compiler.closure(roots)
    require(replay==old['numeric_coefficient_closure_attempt'],'Baseline closure replay differs')
    return records,r,a,roots,helper,frontend,old,logs

def raw_closure(get_node, registries, roots, helper):
    records={};native={};bodyless={};parents={};stack=[(r,None) for r in roots]
    while stack:
        ident,parent=stack.pop()
        require(type(ident) is int and 0<=ident<SOURCE_PIN['nodes'],'Invalid source node reference')
        if str(ident) in records:continue
        node=get_node(ident);require(set(node)=={'op','args'},'Unexpected source node shape')
        records[str(ident)]=node;parents[ident]=parent
        stack.extend((j,{'node':ident,'edge':'argument'}) for j in helper.argument_children(node))
        if node['op'] in helper.NATIVE:
            key,d=helper.native_definition(node,registries)
            native[str(ident)]={'operation':node['op'],'registry':key,'definition_sha256':digest(d),'definition_keys':sorted(d)}
            if 'body' in d and type(d['body']) is int:
                stack.append((d['body'],{'node':ident,'edge':'actual_native_body','registry':key}))
            else:bodyless[str(ident)]=native[str(ident)]
    return dict(sorted(records.items(),key=lambda x:int(x[0]))),native,bodyless,parents

def compare_records(get_node, records):
    for ident,node in records.items():require(get_node(int(ident))==node,'Packet disagrees with authenticated full stream at '+ident)

def classify_missing(get_node, old):
    rows=[];counts=collections.Counter()
    for row in old['numeric_coefficient_closure_attempt']['missing_scalar_bodies']:
        ident=row['root'];node=get_node(ident);parent=row['requested_by'];pn=get_node(parent['node'])
        is_binder=parent['edge']=='argument' and pn['op']=='definite_integral' and pn['args'][1]==ident
        role='integral_binding_coordinate' if is_binder else 'operand'
        if is_binder:require(node['op']=='coordinate','Integral binder not coordinate')
        counts[role]+=1;rows.append({**row,'record':node,'record_sha256':digest(node),'recovered_role':role})
    require(len(rows)==700,'Baseline missing set changed')
    require(dict(counts)=={'integral_binding_coordinate':134,'operand':566},'Recovered missing-role inventory changed')
    return rows,dict(counts)

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--root',type=pathlib.Path,required=True);ap.add_argument('--source',type=pathlib.Path,required=True);ap.add_argument('--stage3',type=pathlib.Path,required=True);ap.add_argument('--out',type=pathlib.Path,required=True);args=ap.parse_args()
    start=time.monotonic();args.out.mkdir(parents=True,exist_ok=True)
    records,registries,angular,roots,helper,frontend,old,supplements=assemble(args.root)
    require(args.source.stat().st_size==SOURCE_PIN['compressed_bytes'] and file_sha(args.source)==SOURCE_PIN['compressed_sha256'],'Changed full gzip source')
    with gzip.open(args.source,'rb') as stream: header_line=stream.readline()
    require(header_line==(args.root/HEADER).read_bytes(),'Stream header line differs byte-for-byte from pinned standalone header')
    require(hashlib.sha256(header_line).hexdigest()==PINS[HEADER],'Changed exact stream header bytes')
    stage3=module(args.stage3,'pinned_stage3',STAGE3_PIN)
    cache=args.out/'fresh-source-cache.sqlite';require(not cache.exists(),'Fresh authentication refuses to reuse cache')
    header,authentication=stage3.prepare_source(args.source,cache)
    # The standalone header is byte-pinned, and its object must equal the stream header.
    require(header==load(args.root/HEADER),'Standalone header differs from authenticated stream header')
    require(stage3.registries(header)==registries,'Registry join differs')
    get_node=stage3.Source(cache)
    compare_records(get_node,records)
    closure,native,bodyless,parents=raw_closure(get_node,registries,roots,helper)
    recovered,roles=classify_missing(get_node,old)
    require(len(closure)==128555,'Raw closure count differs from prior recovery observation')
    require(len(bodyless)==572,'Raw bodyless frontier count changed')
    old_present=set(str(i) for i in parents)&set(records)
    newly_required=set(closure)-set(records)
    require(len(newly_required)==67851,'New raw closure records differ')
    source={'expected_full_source':SOURCE_PIN,'authentication':authentication,'source_header_sha256':PINS[HEADER],
            'header_binding_method':'New implementation: exact first gzip line byte equality to pinned standalone header, followed by pinned full-stream authentication; no historical header_binding.py substituted.',
            'stage3_sha256':STAGE3_PIN,'source_file':str(args.source),'baseline_pins':PINS,
            'recovery_code_sha256':file_sha(__file__),'original_source_producer_executed':False,
            'original_lost_recovery_implementation_restored':False,'implementation_kind':'new independently replayed recovery implementation'}
    export={'schema':'MathScope.RawInitializedScalarClosureRecovery/1',**source,'roots':roots,
            'frozen_initialized_velocity':[3825006,3825007,3825008],'frozen_initialized_pressure':3825009,
            'records':closure,'native_calls':dict(sorted(native.items(),key=lambda x:int(x[0]))),
            'raw_bodyless_frontiers':dict(sorted(bodyless.items(),key=lambda x:int(x[0]))),
            'scope':'Raw syntactic arguments plus every integer registry body; includes binders and implicit defining equations. It is not an executable semantic dependency closure.',
            'scalar_numeric_evaluation_complete':False,'final_field_evaluator_complete':False,'N706_closed':False,'N805_closed':False}
    write(args.out/'RAW_INITIALIZED_SCALAR_CLOSURE.json',export)
    write(args.out/'RECOVERED_MISSING_700.json',{'schema':'MathScope.MissingScalarRecovery/1','source_header_sha256':PINS[HEADER],'rows':recovered,'role_counts':roles,'filled_with_zero':False})
    operation_counts=dict(sorted(collections.Counter(n['op'] for n in closure.values()).items()))
    summary={'schema':'MathScope.ScalarRecoveryReceipt/1',**source,'old_packet_records_checked_exactly':len(records),
       'previous_closure_present':old['numeric_coefficient_closure_attempt']['present_nodes'],
       'previous_closure_missing':700,'missing_recovered':700,'missing_remaining':0,'missing_role_counts':roles,
       'raw_closure_records':len(closure),'raw_closure_source_ids_sha256':digest([int(i) for i in closure]),
       'raw_closure_operations':operation_counts,'raw_native_calls':len(native),'raw_bodyless_frontiers':len(bodyless),
       'raw_closure_old_packet_overlap':len(old_present),'raw_new_records_not_in_old_packet':len(newly_required),
       'raw_new_records_definition':'Set difference: full raw closure IDs minus all 92,722 old combined packet IDs; do not add this number to 92,722 to claim closure size.',
       'raw_new_records_includes_first_700':len(set(str(r['root']) for r in recovered)&newly_required),
       'raw_new_records_beyond_first_700':len(newly_required)-700,'same_header_supplements':supplements,
       'scalar_numeric_evaluation_complete':False,'final_field_evaluator_complete':False,'N706_closed':False,'N805_closed':False,
       'elapsed_seconds':round(time.monotonic()-start,3)}
    write(args.out/'SCALAR_RECOVERY_RECEIPT.json',summary)
    print(json.dumps({k:v for k,v in summary.items() if k not in {'authentication','same_header_supplements','baseline_pins','raw_closure_operations'}}))
if __name__=='__main__': main()
