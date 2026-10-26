"""The original #623935 selector is frozen per label, not a moving point.

Discontinuity in a selector as its PARAMETERS vary does not imply a
spacetime discontinuity when those parameters and each mesh label are fixed.
This checks the exact original call-argument dependency graph. Existence of
the selected inverse on all active boxes and smooth field gluing remain
separate obligations.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from audit_original_114_first_AST_piecewise_guards import original_children
from original_omega_binder_domains import GRAPH,REG,require

FROZEN={622791:'N6_global_frozen_integer_band_N1$30434',
        623855:'m3_global_fixed_mesh_r$30477',623856:'m3_global_fixed_mesh_z$30478',
        623857:'m3_global_fixed_mesh_t$30479'}
PHYSICAL={622802:'m3_global_band_slow_R$30435',622803:'m3_global_band_slow_Z$30436',622804:'m3_global_band_slow_T$30437'}

def propagate_masks(nodes,frozen,physical):
    """Generic helper for tests; native body formal parameters are not free
    call-site inputs. Unsupported native closures are reported separately.
    """
    labels=list(frozen)+list(physical);bits={c:1<<i for i,c in enumerate(labels)}
    other=1<<len(labels);masks=[];unknown=[];free=[]
    for i,n in enumerate(nodes):
        op=n['op'];a=n['args']
        if op=='coordinate':f={i}
        elif op=='definite_integral':f=(free[a[0]]-{a[1]})|free[a[2]]|free[a[3]]
        else:
            f=set()
            for c in original_children(op,a):f|=free[c]
        m=0
        for c in f:m|=bits.get(c,other)
        unsupported=int((op.startswith('actual_') or op.startswith('m3_')) and not(op=='actual_monotone_root' and a[0]==2))
        for c in original_children(op,a):
            require(type(c)is int and 0<=c<i,'source dependency is not topological')
            unsupported|=unknown[c]
        masks.append(m);unknown.append(unsupported);free.append(f)
    return masks,unknown

def prove(folder):
    folder=Path(folder);raw=(folder/'original-source-functions.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()==REG,'native registry SHA')
    system=json.loads(json.loads(raw)['base']['base']['monotone'])[2]
    require(system['parameters']==[622803,622804] and system['body']==622819
            and system['left']==19 and system['right']==24,'original native root-2 contract')
    labels=list(FROZEN)+list(PHYSICAL);bits={c:1<<i for i,c in enumerate(labels)}
    other=1<<len(labels);lines=[];sha=hashlib.sha256()
    selected={};pin_calls={622820:[2,622803,622804],623935:[2,623921,623934]};seen=set();count=0
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            sha.update(line)
            if j==0:
                require(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},'original header');continue
            count+=1;i=j-1
            if i>623935:continue
            lines.append(line)
            n=json.loads(line);op=n['op'];a=n['args']
            if i in FROZEN or i in PHYSICAL:
                require(n=={'op':'coordinate','args':[(FROZEN|PHYSICAL)[i]]},'coordinate pin '+str(i));seen.add(i)
            for c in original_children(op,a):
                require(type(c)is int and 0<=c<i,'non-topological source operand')
            if i in pin_calls:
                require(n=={'op':'actual_monotone_root','args':pin_calls[i]},'original slow inverse call '+str(i))
                selected[i]={'actual_argument_nodes':a[1:]}
    require(count==4420257 and sha.hexdigest()==GRAPH and seen==set(labels),'full source SHA or coordinate pins')
    # Only 205 or so source nodes are needed here, rather than constructing
    # free-variable sets for the entire 4.42M-node graph. Scope must still be
    # exact: original N3 constants contain nested definite integrals.
    needed={};todo=[622820,623935,system['body']]
    while todo:
        i=todo.pop()
        if i in needed:continue
        n=json.loads(lines[i]);needed[i]=n;todo.extend(original_children(n['op'],n['args']))
    free={};unsupported={}
    for i,n in sorted(needed.items()):
        op=n['op'];a=n['args']
        if op=='coordinate':f={i}
        elif op=='definite_integral':f=(free[a[0]]-{a[1]})|free[a[2]]|free[a[3]]
        else:
            f=set()
            for c in original_children(op,a):f|=free[c]
        bad=int((op.startswith('actual_') or op.startswith('m3_')) and not(op=='actual_monotone_root' and a[0]==2))
        for c in original_children(op,a):bad|=unsupported[c]
        free[i]=f;unsupported[i]=bad
    require(free[system['body']]=={system['variable'],*system['parameters']},'inverse body has undeclared free coordinate')
    require(free[623935]==set(FROZEN) and not unsupported[623935],'representative has a non-label dependency')
    require(free[622820]=={622803,622804} and not unsupported[622820],'direct inverse arguments changed')
    for i in selected:
        m=0
        for c in free[i]:m|=bits.get(c,other)
        selected[i].update(actual_coordinate_mask=m,actual_free_coordinate_ids=sorted(free[i]),unsupported_native_ancestor=False)
    return {'schema':'MathScope.M3.Original623935FrozenCallCoordinates/1',
        'graph_sha256':GRAPH,'registry_sha256':REG,'original_calls':selected,
        'exact_argument_and_native_body_closure_nodes':len(needed),
        'representative_input_coordinates':{str(k):v for k,v in FROZEN.items()},
        'current_point_coordinates':{str(k):v for k,v in PHYSICAL.items()},
        'representative_depends_on_current_spacetime_point':False,
        'representative_positive_order_spacetime_derivatives_under_fixed_labels':'exactly zero wherever the selected value is defined',
        'parameter_selector_C0_counterexample_is_not_a_spacetime_counterexample':True,
        'premises':['original source parameters fixed','each band and mesh label fixed','selected inverse value exists and is real'],
        'actual_active_mesh_support_image_membership_proved':False,
        'global_sum_flat_gluing_proved':False,'final_67_jets':0,'release':'HOLD'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True);p.add_argument('--output',required=True)
    a=p.parse_args();r=prove(a.graph_dir);Path(a.output).write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'frozen_representative_coordinates':len(r['representative_input_coordinates']),
                      'depends_on_current_spacetime_point':r['representative_depends_on_current_spacetime_point'],'release':'HOLD'}))
