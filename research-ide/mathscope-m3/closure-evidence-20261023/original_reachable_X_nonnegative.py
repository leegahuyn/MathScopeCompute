"""Real-domain nonnegativity at the 317 reached direct-114 native calls.

The all-source census has 5545 such calls. Only 317 are in the independently
replayed eleven-root closure. This verifier checks their exact original
formal/actual mappings and carries integration-variable scope to native
entry roots. It does not prove existence of implicit native operations or
the outer physical domain, nor does it certify any series norm or tail.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from array import array
from collections import Counter
from fractions import Fraction
from original_omega_binder_domains import GRAPH,REG,IDS_HASH,ENTRIES_HASH,digest_ids,require
from audit_original_114_first_AST_piecewise_guards import original_children
from audit_original_114_native_expression_argument_bindings import load_expression_registry,validate_binding
from pinned_n3_parameter_intervals import pinned_profile,EXPECTED_DECODED_EXPRESSIONS_SHA256
from prove_original_n3_Q_rho_signs import structural_real_sign,MissingSourceAnalyticPremise

MAPPINGS_SHA='2b553a872541bcb38fedeb0d5e8db5be149cf2c9150ef7d7bcad1fc975d863e3'
EXPRESSION_IDS_SHA='7ade24a64f965572081301ad052661b742ca6f8c7c3fef1632e7fa297d209a98'
NEG,ZERO,POS=1,2,4
UNKNOWN=NEG|ZERO|POS
NONNEG=ZERO|POS

def nonnegative(mask):return bool(mask) and not(mask&NEG)

def signs(mask):return [v for v,b in [(-1,NEG),(0,ZERO),(1,POS)] if mask&b]
def encode(values):
    out=0
    for n in values:out|=NEG if n<0 else POS if n>0 else ZERO
    return out

def sign_node(op,a,previous,parameter_signs):
    if op=='rational':return encode([Fraction(int(a[0]),int(a[1]))])
    if op=='coordinate':return UNKNOWN
    if op=='source_parameter':return parameter_signs.get(a[0],UNKNOWN)
    if op=='exp':return POS                 # on the defined real source domain
    if op=='sqrt_positive':return NONNEG    # same explicit real-domain premise
    if op=='actual_monotone_root' and a[0]==2:return POS # original [1/2,2] bracket, if it exists
    if op=='integer_power':
        return encode(v**a[1] for v in signs(previous[a[0]]) if not(v==0 and a[1]<0)) or UNKNOWN
    if op=='inverse':return previous[a[0]]&~ZERO or UNKNOWN
    if op=='multiply':return encode(x*y for x in signs(previous[a[0]]) for y in signs(previous[a[1]]))
    if op=='add':
        left,right=previous[a[0]],previous[a[1]]
        if nonnegative(left) and nonnegative(right):return POS if left==POS or right==POS else NONNEG
        if left==ZERO:return right
        if right==ZERO:return left
        if not(left&POS) and not(right&POS):return NEG if left==NEG or right==NEG else NEG|ZERO
        return UNKNOWN
    if op=='maximum':
        if any(previous[x]==POS for x in a):return POS
        if any(nonnegative(previous[x]) for x in a):return NONNEG
    return UNKNOWN


class CoordinateScope:
    def __init__(self):
        self.free=[];self.sealed=[];self.masks={};self.count=0;self.integrals=[]
    def add(self,op,a,signs_,required_coordinate=None):
        i=len(self.free);debt=0;sealed=0
        if required_coordinate is not None:
            debt=1<<self.count;self.count+=1
            self.masks[required_coordinate]=self.masks.get(required_coordinate,0)|debt
        for c in original_children(op,a):
            require(type(c)is int and 0<=c<i,'invalid source edge')
            sealed|=self.sealed[c]
        if op=='smooth_piecewise':
            x,left,right=a[:3]
            for c in a[:3]:debt|=self.free[c]
            for arm in (3,4,5):
                d=self.free[a[arm]]
                if (arm==4 and nonnegative(signs_[left])) or (arm==5 and nonnegative(signs_[right])):
                    d&=~self.masks.get(x,0)
                debt|=d
        elif op=='definite_integral':
            body,var,lo,hi=a;body_debt=self.free[body];bound=self.masks.get(var,0)
            if nonnegative(signs_[lo]) and nonnegative(signs_[hi]):
                discharged=body_debt&bound
                if discharged:self.integrals.append({'node_id':i,'variable':var,'lower':lo,'upper':hi,'call_uses':discharged.bit_count()})
                body_debt&=~bound
            sealed|=body_debt&bound
            debt|=(body_debt&~bound)|self.free[lo]|self.free[hi]
        else:
            for c in original_children(op,a):debt|=self.free[c]
        self.free.append(debt);self.sealed.append(sealed)
    def unresolved(self,i):return (self.free[i]|self.sealed[i]).bit_count()


def prove(folder,reach_file,binding_file):
    folder=Path(folder)
    reach=json.loads(Path(reach_file).read_text(encoding='utf-8'))
    require(digest_ids(reach.get('original_reachable_natural_series_node_ids',[]))==IDS_HASH,'original natural reach set')
    require(digest_ids(reach.get('original_reachable_native_body_entry_roots',[]))==ENTRIES_HASH,'native entry roots')
    require(digest_ids(reach.get('original_reachable_expression_call_node_ids',[]))==EXPRESSION_IDS_SHA,'2997 reached expression calls')
    rows=json.loads(Path(binding_file).read_text(encoding='utf-8'))['actual_argument_records']
    rawrows=json.dumps(rows,sort_keys=True,separators=(',',':')).encode()
    require(hashlib.sha256(rawrows).hexdigest()==MAPPINGS_SHA and len(rows)==317,'317 original exact mappings')
    want={r['original_native_call_node_id']:r for r in rows}
    require(len(want)==317,'duplicate mapped calls')
    registry=load_expression_registry(folder)
    raw=(folder/'original-source-functions.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()==REG,'original native registry SHA')
    p=pinned_profile();parameter_signs={}
    for name in p['parametersExactExpressions']:
        try:
            s=structural_real_sign({'ref':name},p['parametersExactExpressions'])
            parameter_signs[name]=UNKNOWN if s is None else encode([s])
        except MissingSourceAnalyticPremise:pass
    node_signs=array('B');flow=CoordinateScope();sha=hashlib.sha256();seen=set()
    argument_shapes={};argument_ids={r['actual_X_source_node_id'] for r in rows}
    counts=Counter();coordinate_rows=[]
    for r in rows:require(r['original_native_call_node_id'] in reach['original_reachable_expression_call_node_ids'],'call outside real root closure')
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            sha.update(line)
            if j==0:
                require(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},'original header');continue
            i=j-1;n=json.loads(line);op=n['op'];a=n['args']
            s=NONNEG if i==4756 else sign_node(op,a,node_signs,parameter_signs)
            if i in argument_ids:argument_shapes[i]=n
            required=None
            if i in want:
                row=want[i];definition,sid,params,values,orders=validate_binding(n,registry)
                require(str(sid)==row['system_id'] and params==row['formal_parameter_source_ids']
                        and values==row['actual_argument_source_ids'] and orders==row['partial_derivative_orders'],
                        'original formal/actual call mismatch '+str(i))
                require(4756 in params,'original formal radial X slot absent')
                actual=values[params.index(4756)]
                require(actual==row['actual_X_source_node_id'],'actual X reference mismatch')
                shape=argument_shapes[actual]
                if shape['op']=='coordinate' and actual!=4756:
                    required=actual;counts['bound_coordinate']+=1
                    coordinate_rows.append({'call':i,'argument':actual,'name':shape['args'][0]})
                else:
                    require(nonnegative(node_signs[actual]),'actual constructor nonnegativity unproved '+str(actual))
                    counts['identity_formal_X' if actual==4756 else shape['op']]+=1
                seen.add(i)
            flow.add(op,a,node_signs,required)
            node_signs.append(s)
    require(len(node_signs)==4420257 and sha.hexdigest()==GRAPH and seen==set(want),'full source hash or original call count')
    frontier=[{'node_id':i,'unresolved_nonnegative_calls':flow.unresolved(i)}
              for i in reach['original_reachable_native_body_entry_roots'] if flow.free[i] or flow.sealed[i]]
    return {'schema':'MathScope.M3.Original317Direct114XNonnegativeScope/1',
        'graph_sha256':GRAPH,'registry_sha256':REG,'exact_mapping_sha256':MAPPINGS_SHA,
        'decoded_N3_expression_sha256':EXPECTED_DECODED_EXPRESSIONS_SHA256,
        'all_source_direct114_expression_calls':5545,'root_reachable_direct114_expression_calls':317,
        'source_call_partition':dict(counts),'bound_coordinate_calls':coordinate_rows,
        'integral_binding_witnesses':flow.integrals,'unresolved_native_entry_frontier':frontier,
        'scoped_nonnegativity_closed':not frontier,
        'premises':['referenced operations have defined real values',
                    'formal radial X entry coordinates are nonnegative',
                    'original native substitution/differentiation semantics'],
        'does_not_prove_native_inverse_existence_or_outer_caller_domain':True,
        'all_nested_native_argument_families_covered':False,
        'global_Y_calls_newly_certified':0,'final_67_jets':0,'release':'HOLD'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True);p.add_argument('--reach',required=True);p.add_argument('--bindings',required=True);p.add_argument('--output',required=True)
    a=p.parse_args();r=prove(a.graph_dir,a.reach,a.bindings)
    Path(a.output).write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:r[k] for k in ('root_reachable_direct114_expression_calls','source_call_partition','scoped_nonnegativity_closed','release')}))
