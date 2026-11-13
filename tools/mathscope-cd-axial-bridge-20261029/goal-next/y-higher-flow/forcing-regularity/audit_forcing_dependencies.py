#!/usr/bin/env python3
"""Replay the original N4-export N1..5 forcing operand dependencies."""
import argparse,collections,hashlib,json,sys
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--reached',type=Path,required=True)
p.add_argument('--registry',type=Path,required=True)
p.add_argument('--helper',type=Path,default=Path(__file__).resolve().parents[2]/'y/native_reference_scopes.py')
p.add_argument('--out',type=Path)
p.add_argument('--negative-unbind-first',action='store_true',help='negative control: remove a required lexical average binder')
a=p.parse_args()
pins={a.reached:'1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc',a.registry:'049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad',a.helper:'37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758'}
for f,h in pins.items():assert hashlib.sha256(f.read_bytes()).hexdigest()==h,f
sys.path.insert(0,str(a.helper.parent));from native_reference_scopes import actual_children
with a.reached.open(encoding='utf8') as f:graph=json.load(f)
with a.registry.open(encoding='utf8') as f:reg=json.load(f)
nodes=dict(graph['nodes']); systems=json.loads(reg['base']['picard'])
assert graph['graphSHA256']=='ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd'
rows=[]
for sid,order in [(0,1),(3,2),(5,3),(7,4),(9,5)]:
    system=systems[sid];assert system['order']==order
    if order>1:assert system['kind']=='actual' and system['actualFinalizedLowerCutoffs'] and not system['callerSuppliedForcing']
    seen=set(system['forcing']); queue=list(seen)
    for i in queue:
        for child in actual_children(nodes[i]):
            if child not in seen:seen.add(child);queue.append(child)
    native=collections.Counter(); picard=collections.Counter(); radial=collections.Counter()
    for i in seen:
        node=nodes[i];op=node['op']
        if op.startswith(('actual_','m3_')):native[op]+=1
        if op in ('actual_background_even_profile','actual_background_picard'):
            target=node['args'][0];picard[(target,systems[target]['order'])]+=1
            radial[node['args'][2]]+=1
            assert systems[target]['order']<order, (order,target)
    # Verify lexical [0,1] binders at every explicit forcing-to-Picard
    # operand path. The arguments must be xi^2 or t*xi^2, not merely
    # a syntactic occurrence of a matching integral elsewhere in the DAG.
    context=set(); stack=[(root,frozenset()) for root in system['forcing']]; checked_calls=set()
    while stack:
        nid,bound=stack.pop(); state=(nid,bound)
        if state in context:continue
        context.add(state);node=nodes[nid];op=node['op'];arg=node['args']
        if op in ('actual_background_even_profile','actual_background_picard'):
            rid=arg[2];rnode=nodes[rid]
            xi=system['xi']
            def is_xi_sq(k):return nodes[k]['op']=='integer_power' and nodes[k]['args']==[xi,2]
            if not is_xi_sq(rid):
                assert rnode['op']=='multiply' and len(rnode['args'])==2
                factor,other=rnode['args'];assert is_xi_sq(other)
                if a.negative_unbind_first:bound=bound-{factor}
                assert factor in bound,(order,nid,factor)
            assert arg[3]==system['eta']
            checked_calls.add(nid)
        if op=='definite_integral':
            body,var,lo,hi=arg
            good=(nodes[lo]=={'op':'rational','args':['0','1']} and nodes[hi]=={'op':'rational','args':['1','1']})
            stack.extend([(lo,bound),(hi,bound),(body,bound|{var} if good else bound-{var})])
        else:
            stack.extend((c,bound) for c in actual_children(node))
    assert len(checked_calls)==sum(picard.values())
    rows.append({'system':sid,'order':order,'forcingRoots':system['forcing'],'operandNodes':len(seen),
                 'nativeOps':dict(sorted(native.items())),'lowerPicardSystems':{'%s:order%s'%k:v for k,v in sorted(picard.items())},
                 'lexicalRadialGuardedPicardCalls':len(checked_calls),
                 'radialArguments':[{'node':i,'count':count,'expression':nodes[i]} for i,count in sorted(radial.items())]})
out={'status':'PASS','graphSHA256':graph['graphSHA256'],'rows':rows,
     'scope':'explicit forcing operand DAG to native boundaries, with xi^2 or t*xi^2 and exact lexical t in [0,1] on each path; assumes outer xi in the source radial domain and does not unfold Picard systems or establish analytic norms',
     'pins':{f.name:h for f,h in pins.items()},'release':'HOLD'}
text=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(text,encoding='utf8',newline='\n')
print(text,end='')
