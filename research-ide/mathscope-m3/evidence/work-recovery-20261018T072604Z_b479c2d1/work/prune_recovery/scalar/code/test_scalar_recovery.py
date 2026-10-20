#!/usr/bin/env python3
"""Targeted negative controls against the recovered original source, not numeric tests."""
from __future__ import annotations
import argparse, copy, json, pathlib, shutil, subprocess, sys, tempfile
import recover_scalar_closure as r

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=pathlib.Path,required=True);ap.add_argument('--source',type=pathlib.Path,required=True);ap.add_argument('--stage3',type=pathlib.Path,required=True);ap.add_argument('--evidence',type=pathlib.Path,required=True);args=ap.parse_args()
    helper=r.module(args.root/r.NATIVE,'tested_native',r.PINS[r.NATIVE])
    stage3=r.module(args.stage3,'tested_stage3',r.STAGE3_PIN)
    reg=stage3.registries(r.load(args.root/r.HEADER));old=r.load(args.root/r.OLD_RESULT)
    missing=r.load(args.evidence/'RECOVERED_MISSING_700.json');export=r.load(args.evidence/'RAW_INITIALIZED_SCALAR_CLOSURE.json')
    # No persisted disposable database receives authority. The complete exported
    # records are independently compared to the authenticated gzip by the reviewer.
    def source(i):
        if str(i) not in export['records']:raise ValueError('Missing original source node '+str(i))
        return export['records'][str(i)]
    controls=[]
    def rejects(name,fn,fragment):
        try:fn()
        except (ValueError,KeyError) as e:
            r.require(fragment in str(e),'Unexpected negative-control rejection '+name+': '+str(e))
            controls.append({'name':name,'rejected':True,'error':str(e)})
        else:raise AssertionError('Mutation accepted: '+name)
    ident=missing['rows'][0]['root'];mutated=copy.deepcopy(source(ident));mutated['op']='rational';mutated['args']=['0','1']
    rejects('recovered_source_record_changed_to_zero',lambda:r.compare_records(source,{str(ident):mutated}),'Packet disagrees')
    rejects('conflicting_same_header_record',lambda:r.merge({str(ident):source(ident)},{str(ident):mutated},set()),'Conflicting same-source')
    rejects('out_of_range_closure_root',lambda:r.raw_closure(source,reg,[r.SOURCE_PIN['nodes']],helper),'Invalid source node')
    binder=next(x['root'] for x in missing['rows'] if x['recovered_role']=='integral_binding_coordinate')
    rejects('binder_coordinate_changed_to_scalar',lambda:r.classify_missing(lambda i: {'op':'rational','args':['0','1']} if i==binder else source(i),old),'Integral binder not coordinate')
    native_id=int(next(iter(export['native_calls'])))
    rejects('unknown_native_opcode',lambda:r.raw_closure(lambda i: {'op':'unreviewed_native','args':[]} if i==native_id else source(i),reg,[native_id],helper),'Unknown source operation')
    rejects('missing_native_definition',lambda:r.raw_closure(source,{},[native_id],helper),'Missing native registry')
    root=export['roots'][0]
    def unavailable(i):
        if i==root:raise ValueError('Missing original source node '+str(i))
        return source(i)
    rejects('missing_source_node_is_not_zero',lambda:r.raw_closure(unavailable,reg,[root],helper),'Missing original source node')
    script=pathlib.Path(r.__file__).resolve()
    def cli(source_path,out):
        return subprocess.run([sys.executable,str(script),'--root',str(args.root),'--source',str(source_path),'--stage3',str(args.stage3),'--out',str(out)],capture_output=True,text=True)
    with tempfile.TemporaryDirectory(prefix='scalar-negative-') as temp:
        temp=pathlib.Path(temp);bad=temp/'changed.ndjson.gz';shutil.copyfile(args.source,bad)
        with bad.open('r+b') as f:f.seek(-1,2);x=f.read(1);f.seek(-1,2);f.write(bytes([x[0]^1]))
        result=cli(bad,temp/'bad-source-out')
        r.require(result.returncode!=0 and 'Changed full gzip source' in result.stderr,'Corrupted gzip accepted')
        r.require(not (temp/'bad-source-out'/'fresh-source-cache.sqlite').exists(),'Corrupt source created trusted cache')
        controls.append({'name':'one_byte_compressed_source_mutation','rejected':True,'exit_code':result.returncode,'cache_created':False})
        existing=temp/'preexisting-output';existing.mkdir();marker=existing/'fresh-source-cache.sqlite'
        marker.write_bytes(b'Untrusted existing cache must never gain authority.\n')
        before=marker.read_bytes();result=cli(args.source,existing)
        r.require(result.returncode!=0 and 'Fresh authentication refuses to reuse cache' in result.stderr,'Existing cache gained source authority')
        r.require(marker.read_bytes()==before,'Existing cache was modified')
        controls.append({'name':'preexisting_cache_cannot_bypass_authentication','rejected':True,'exit_code':result.returncode})
    report={'schema':'MathScope.ScalarRecoveryNegativeControls/1','passed':len(controls),'failed':0,'controls':controls,
            'source_header_sha256':r.PINS[r.HEADER],'full_source_compressed_sha256':r.SOURCE_PIN['compressed_sha256'],
            'recovery_code_sha256':r.file_sha(r.__file__),'test_code_sha256':r.file_sha(__file__),
            'fixture':'Exact raw closure export; persisted disposable SQLite is not used.',
            'test_scope':'Byte provenance, literal source equality, binder roles, native availability, fail-closed missing nodes, and disposable cache authority. No numeric native evaluator or theorem is certified.',
            'N706_closed':False,'N805_closed':False}
    r.write(args.evidence/'SCALAR_RECOVERY_NEGATIVE_CONTROLS.json',report);print(json.dumps(report))
if __name__=='__main__':main()
