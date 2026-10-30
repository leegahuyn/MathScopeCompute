"""Portable integer-only structural graph validation and axial provenance audit.

This validates graph structure, hashes and source binding. Analytic operator
evaluation, actual PDE identities and all-order induction remain separate.
"""
import argparse, collections, gzip, hashlib, json, math
from pathlib import Path

def canonical(x): return json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf8')
def sha_file(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1048576),b''):h.update(b)
    return h.hexdigest()

def operand_refs(nd):
    op,a=nd['op'],nd['args']
    if op in ('rational','coordinate','source_parameter'):return []
    if op in ('integer_power','source_step_derivative'):return [a[0]]
    if op=='actual_natural_series':return a[1:3]
    if op=='actual_quadratic_root':return a[2:]
    if op=='actual_monotone_root':return a[1:]
    if op in ('actual_background_picard','actual_background_even_profile'):return a[2:4]
    if op=='actual_covariance_volterra':return [a[2],*a[3]]
    if op in ('m3_global_pulse_jet',):return [a[2],*a[3]]
    if op=='m3_forced_pulse_partial':return [a[3],*a[4]]
    if op in ('actual_expression_partial','m3_global_indexed_partial','m3_aux_indexed_partial','m3_aux_expression_partial','m3_aux_inverse_partial','m3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial'):return a[1]
    if op in ('add','multiply','inverse','log_positive','exp','sqrt_positive','smooth_piecewise','definite_integral','sine','cosine','ceiling','maximum'):return a
    raise ValueError('Unspecified operator schema: '+op)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source',type=Path,default=Path(__file__).resolve().parents[1]/'inputs'/'graph')
    ap.add_argument('--out',type=Path,default=Path(__file__).resolve().parents[1]/'logs'/'source')
    args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    manifest=json.loads((args.source/'original-source-export-manifest.json').read_text(encoding='utf8'))
    reg=json.loads((args.source/'original-source-functions.json').read_text(encoding='utf8'))
    expressions=json.loads(reg['base']['base']['expression'])
    hist=collections.Counter();nodes={};calls=[];native_clips=[];errors=[];ref_count=0;rat_count=0
    array_hash=hashlib.sha256(b'[');original_hash=hashlib.sha256(b'[');array_bytes=1
    # Manifest hashes the exact uncompressed JSONL stream, including header and
    # newlines, not a reconstructed JSON array. Keep both for audit visibility.
    stream_hash=hashlib.sha256();stream_bytes=0
    with gzip.open(args.source/'original-source-nodes.jsonl.gz','rb') as f:
        header_line=next(f);header=json.loads(header_line)
        stream_hash.update(header_line);stream_bytes+=len(header_line)
        for i,line in enumerate(f):
            stream_hash.update(line);stream_bytes+=len(line)
            nd=json.loads(line);op,a=nd['op'],nd['args'];hist[op]+=1
            can=canonical(nd)
            if i:array_hash.update(b',');original_hash.update(b',');array_bytes+=1
            array_hash.update(can);original_hash.update(line.strip());array_bytes+=len(can)
            try:
                refs=operand_refs(nd);ref_count+=len(refs)
                for r in refs:
                    if type(r) is not int or not 0<=r<i:errors.append({'id':i,'kind':'operand_range','ref':r,'op':op})
                if op=='rational':
                    num,den=map(int,a);rat_count+=1
                    if den<=0 or math.gcd(num,den)!=1:errors.append({'id':i,'kind':'noncanonical_rational','args':a})
            except (TypeError,ValueError,IndexError) as e:errors.append({'id':i,'kind':'schema','detail':str(e)})
            if i<=624100:nodes[i]=nd
            if op=='actual_expression_partial' and a[0]==672:calls.append({'id':i,**nd})
            if op=='smooth_piecewise' and a[1:4]==[28814,28824,0] and a[5]==0 and i>622000:native_clips.append({'id':i,**nd})
    count=i+1;array_hash.update(b']');original_hash.update(b']');array_bytes+=1
    def closure(root,expand_functions=False):
        seen=set();todo=[root];missing=[]
        while todo:
            x=todo.pop()
            if x in seen:continue
            seen.add(x);nd=nodes.get(x)
            if nd is None:missing.append(x);continue
            todo.extend(operand_refs(nd))
            if expand_functions and nd['op']=='actual_expression_partial':todo.append(expressions[nd['args'][0]]['body'])
        h=hashlib.sha256()
        for x in sorted(seen):h.update(canonical([x,nodes.get(x)]));h.update(b'\n')
        return {'scope':'typed operand edges'+(' plus expression-function bodies (not Picard/root systems)' if expand_functions else ' only'),
                'count':len(seen),'missing':missing[:100],'sha256':h.hexdigest(),
                'coordinate_ids':[x for x in sorted(seen) if x in nodes and nodes[x]['op']=='coordinate']}
    selected_ids=[2,20,24,25,22,4756,28812,28813,28814,28824,28826,29289,29290,29440,50558,117045,117047,117055,117056,117057,117058,117059,117064,117065,117066,117067,117069,117073,117074,117075,*range(622791,622830),623935]
    checks={
        'all_nodes_count_matches_header':count==header['node_count'],
        'all_nodes_count_matches_manifest':count==manifest['node_count'],
        'all_operator_counts_match_manifest':dict(hist)==manifest['operation_histogram'],
        'original_jsonl_stream_sha256_matches_manifest':stream_hash.hexdigest()==manifest['node_stream_sha256'],
        'original_jsonl_stream_bytes_match_manifest':stream_bytes==manifest['node_stream_uncompressed_bytes'],
        'function_registry_sha256_matches_manifest':sha_file(args.source/'original-source-functions.json')==manifest['definitions_sha256'],
        'all_typed_operand_edges_topological':not errors,
        'function672_exact_name':expressions[672]['name']=='ActualAllFiniteOrderOneStress_z',
        'function672_exact_formals_and_body':expressions[672]['parameters']==[4756,2] and expressions[672]['body']==117069,
        'function1_exact_body':expressions[1]['body']==117047,
        'integrand117047_exact_cutoff':nodes[117047]=={'op':'smooth_piecewise','args':[4756,28814,28824,0,117045,0]},
        'stress117069_exact_cutoff':nodes[117069]=={'op':'smooth_piecewise','args':[4756,28814,28824,0,117059,0]},
        'forward_integral_exact_binding':nodes[117056]=={'op':'actual_expression_partial','args':[1,[117055,2],[0,0]]} and nodes[117057]=={'op':'definite_integral','args':[117056,117055,28814,4756]},
        'backward_integral_exact_binding':nodes[117065]=={'op':'actual_expression_partial','args':[1,[117064,2],[0,0]]} and nodes[117066]=={'op':'definite_integral','args':[117065,117064,4756,28824]},
        'total_integral_exact_binding':nodes[117074]=={'op':'actual_expression_partial','args':[1,[117073,2],[0,0]]} and nodes[117075]=={'op':'definite_integral','args':[117074,117073,28814,28824]},
    }
    for root in (28814,28824):checks[f'cutoff{root}_has_no_coordinate_dependence']=not closure(root)['coordinate_ids']
    result={'schema':'MathScope.AxialSourceAudit/2','verdict':'VERIFIED structural facts; actual analytic equality CONDITIONAL',
            'checks':checks,'node_count':count,'typed_operand_edge_count':ref_count,'exact_rationals_checked':rat_count,
            'original_jsonl_stream_sha256':stream_hash.hexdigest(),'original_jsonl_stream_bytes':stream_bytes,
            'canonical_reconstructed_array_sha256':array_hash.hexdigest(),'canonical_reconstructed_array_bytes':array_bytes,
            'insertion_order_node_stream_sha256':original_hash.hexdigest(),'compressed_gzip_sha256':sha_file(args.source/'original-source-nodes.jsonl.gz'),
            'functions_sha256':sha_file(args.source/'original-source-functions.json'),'histogram':dict(hist),
            'errors':errors[:100],'error_count':len(errors),'selected_nodes':{str(k):nodes.get(k) for k in selected_ids},
            'selected_functions':{str(k):expressions[k] for k in (1,5,6,7,10,671,672)},
            'closures':{str(k):closure(k,True) for k in (28814,28824,117045,117047,117069)},
            'all_calls_to_function672':calls,'native_cutoff_candidates':native_clips,
            'stored_maximum_order':reg['maximumOrder'],
            'limits':['Graph schema does not evaluate integrals, roots, or Picard functions.',
                      'Clipped residual=raw residual globally requires independent inner/exterior PDE proof.',
                      'Zero moment values stated in source metadata are not evaluated values.',
                      'Finite stored order and derivative limits do not prove all n or all smooth jets.',
                      'Native substitution range and chart membership are separate analytic obligations.']}
    (args.out/'source-graph-audit.json').write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf8')
    print(json.dumps({'checks':checks,'nodes':count,'typed_edges':ref_count,'error_count':len(errors),'canonical_sha256':array_hash.hexdigest(),'native_clip_count':len(native_clips),'calls672':len(calls)},indent=2))
    if not all(checks.values()):raise SystemExit(1)

if __name__=='__main__':main()
