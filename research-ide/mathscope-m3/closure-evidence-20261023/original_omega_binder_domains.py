"""Scope-aware radius proof for the 70 ORIGINAL Omega-named call sites.

Those coordinates are dummy integration variables, NOT integral values.
All real physical/formal radial X values must be nonnegative. This premise
is retained explicitly; this module does not certify physical native images.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from fractions import Fraction as Q
from collections import Counter
from audit_original_114_first_AST_piecewise_guards import original_children
from pinned_n3_parameter_intervals import pinned_profile,EXPECTED_DECODED_EXPRESSIONS_SHA256
from prove_original_n3_t1_natural_domain import source_t1_strict_upper_bound
from prove_original_n3_Q_rho_signs import original_n3_Q_rho_strict_positivity

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
IDS_HASH='962a016d25ad21fe54cf285ecd8192d2a7a47d9a6451a957c6bc9fac5b3d2b00'
ENTRIES_HASH='d688ed77238936fe0fd7e83214b7db0337b1395c2189ef4362b729216de56e44'
Y_GROUPS={29443:(29442,29442,False),29723:(29442,29722,True),
          30318:(30317,30317,False),30469:(30317,30468,True),
          31194:(31193,31193,False),31474:(31193,31473,True)}
COORDINATES={29442:'actual_n1_Omega_prefix0$201',30317:'actual_n1_Omega_prefix1$202',31193:'actual_n1_Omega_prefix2$203'}

def digest_ids(ids):
    return hashlib.sha256(json.dumps(ids,separators=(',',':')).encode()).hexdigest()

def require(ok,message):
    if not ok:raise ValueError('OMEGA_BINDER_DOMAIN_UNPROVED: '+message)


class ScopeFlow:
    """Monotone bitset dataflow. OR retains every syntactic use path.

    A guard clears only the before/inside/after arm it actually constrains.
    Integral binding applies ONLY to the integrand, never to its endpoints.
    Keeping separate upper, lower and log debts prevents an upper guard from
    incorrectly discharging positivity or an eager out-of-domain logarithm.
    """
    def __init__(self):
        self.all=[];self.upper=[];self.lower=[];self.logs=[]
        self.sealed_upper=[];self.sealed_lower=[];self.sealed_logs=[]
        self.calls=[];self.variable_masks={};self.x_masks={};self.alias_mask=0
        self.integrals=[]

    def add(self,op,args,target=None):
        index=len(self.all);bit=0
        if target is not None:
            bit=1<<len(self.calls);self.calls.append(target)
            var=target['variable'];x=target['actual_X_node']
            self.variable_masks[var]=self.variable_masks.get(var,0)|bit
            self.x_masks[x]=self.x_masks.get(x,0)|bit
            if target['positive_exp_alias']:self.alias_mask|=bit
        allbits=bit;upper=bit;lower=bit&~self.alias_mask;logs=bit&self.alias_mask
        children=original_children(op,args)
        require(all(type(c)is int and 0<=c<index for c in children),'forward source edge')
        sealed_upper=sealed_lower=sealed_logs=0
        for c in children:
            sealed_upper|=self.sealed_upper[c]
            sealed_lower|=self.sealed_lower[c]
            sealed_logs|=self.sealed_logs[c]
        for c in children:allbits|=self.all[c]
        if op=='smooth_piecewise':
            require(len(args)==6,'piecewise arity')
            x,left,right=args[:3]
            for c in args[:3]:
                upper|=self.upper[c];lower|=self.lower[c];logs|=self.logs[c]
            for arm in (3,4,5):
                u=self.upper[args[arm]];l=self.lower[args[arm]];g=self.logs[args[arm]]
                if arm==3 and left in (3617,3624):
                    u&=~self.x_masks.get(x,0)
                # In these arms the ORIGINAL radial variable >=Xa>0.
                # This closes exp(log(t/Xa))'s source logarithm at its uses.
                if arm in (4,5) and x in self.variable_masks and left==3617:
                    l&=~self.variable_masks[x];g&=~self.variable_masks[x]
                upper|=u;lower|=l;logs|=g
        elif op=='definite_integral':
            body,var,lo,hi=args
            upper=self.upper[body]|self.upper[lo]|self.upper[hi]
            # Bind only the body's occurrences. Bound-variable text in an
            # endpoint denotes a free occurrence and must remain unresolved.
            body_lower=self.lower[body]
            if var in self.variable_masks and lo==0 and hi in (4756,3293):
                body_lower&=~self.variable_masks[var]
                self.integrals.append({'node_id':index,'variable':var,'lower':lo,'upper':hi,
                    'natural_calls_in_body':(self.all[body]&self.variable_masks[var]).bit_count(),
                    'upper_debt_in_body':((self.upper[body]|self.sealed_upper[body])&self.variable_masks[var]).bit_count(),
                    'log_debt_in_body':((self.logs[body]|self.sealed_logs[body])&self.variable_masks[var]).bit_count()})
            lower=body_lower|self.lower[lo]|self.lower[hi]
            logs=self.logs[body]|self.logs[lo]|self.logs[hi]
            # A binder shadows same-ID variables in its body. Unresolved
            # obligations inside it cannot later be discharged by an OUTER
            # guard/binder mentioning that coordinate ID. Endpoints remain
            # outside its scope. This conservative sealing avoids capture.
            bound=self.variable_masks.get(var,0)
            sealed_upper|=self.upper[body]&bound
            sealed_lower|=body_lower&bound
            sealed_logs|=self.logs[body]&bound
            upper=(self.upper[body]&~bound)|self.upper[lo]|self.upper[hi]
            lower=(body_lower&~bound)|self.lower[lo]|self.lower[hi]
            logs=(self.logs[body]&~bound)|self.logs[lo]|self.logs[hi]
        else:
            for c in children:
                upper|=self.upper[c];lower|=self.lower[c];logs|=self.logs[c]
        self.all.append(allbits);self.upper.append(upper);self.lower.append(lower);self.logs.append(logs)
        self.sealed_upper.append(sealed_upper);self.sealed_lower.append(sealed_lower);self.sealed_logs.append(sealed_logs)

    def debts(self,index):
        return {'upper':(self.upper[index]|self.sealed_upper[index]).bit_count(),
                'lower':(self.lower[index]|self.sealed_lower[index]).bit_count(),
                'log':(self.logs[index]|self.sealed_logs[index]).bit_count()}


def prove(folder,reach_file):
    folder=Path(folder);reach=json.loads(Path(reach_file).read_text(encoding='utf-8'))
    ids=reach.get('original_reachable_natural_series_node_ids',[])
    entries=reach.get('original_reachable_native_body_entry_roots',[])
    require(reach.get('original_source_graph_sha256')==GRAPH and reach.get('original_source_native_registry_sha256')==REG,
            'independent native semantic census SHA')
    require(len(ids)==523 and len(set(ids))==523 and digest_ids(ids)==IDS_HASH,'original 523 reached natural IDs')
    require(len(entries)==1745 and len(set(entries))==1745 and digest_ids(entries)==ENTRIES_HASH,'1745 native entry roots')
    raw=(folder/'original-source-functions.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()==REG,'full native registry bytes')
    profile=pinned_profile();sign=original_n3_Q_rho_strict_positivity();small=source_t1_strict_upper_bound()
    require(sign['Lambda_is_strictly_positive'] and small['original_t1_positive']
            and small['original_t1_strict_upper_bound']=='1/8','N3 positive radial scales')
    require(profile['parametersExactExpressions']['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]},'Lambda Xa=4')
    # 4 exp(t1) < 4/(1-1/8)=32/7<5. Paper B.2's smaller
    # 4.1 radius also follows from the independent t1<CSelected^-120<2^-120.
    require(small['source_CSelected_strict_gt_2_proved_from_formulas'],'strong t1 bound')
    paper_upper=Q(4)/(1-Q(1,2**120))
    require(paper_upper<Q(41,10),'Appendix B.2 radius')
    targets=set(ids);flow=ScopeFlow();early=[];sha=hashlib.sha256()
    pins={0:('rational',['0','1']),3454:('source_parameter',['Lambda']),3617:('source_parameter',['Xa']),
          3612:('source_parameter',['t1']),3623:('exp',[3612]),3624:('multiply',[3617,3623]),
          3293:('multiply',[613,3292]),613:('multiply',[12,612]),12:('source_parameter',['XR'])}
    for c,label in COORDINATES.items():pins[c]=('coordinate',[label])
    seen=set()
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            sha.update(line)
            if j==0:
                require(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},'graph header')
                continue
            index=j-1;node=json.loads(line);op=node['op'];args=node['args']
            if index<40000:early.append(node)
            if index in pins:
                name,expected=pins[index]
                require(node=={'op':name,'args':expected},'pinned source node '+str(index));seen.add(index)
            target=None
            if index in targets and op=='actual_natural_series' and args[1] in Y_GROUPS:
                var,x,alias=Y_GROUPS[args[1]]
                require(early[args[1]]=={'op':'multiply','args':[3454,x]},'literal original Lambda*X argument')
                if alias:
                    # Authenticate the exact Xa*exp(log(t/Xa)) subtree.
                    require(early[x]['op']=='multiply' and early[x]['args'][0]==3617,'Xa exponential alias')
                    e=early[early[x]['args'][1]];require(e['op']=='exp','positive exponential alias')
                    l=early[e['args'][0]];require(l['op']=='log_positive','source log alias')
                    r=early[l['args'][0]];require(r=={'op':'multiply','args':[3679,var]},'same bound coordinate in log')
                    require(early[3679]=={'op':'inverse','args':[3617]},'source inverse Xa')
                target={'node_id':index,'Y_node_id':args[1],'variable':var,'actual_X_node':x,'positive_exp_alias':alias}
            flow.add(op,args,target)
    require(len(flow.all)==4420257 and sha.hexdigest()==GRAPH and seen==set(pins),'full original graph SHA')
    require(Counter(x['variable'] for x in flow.calls)=={29442:26,30317:26,31193:18},'original 70 call partition')
    require(early[612]['op']=='exp' and early[3292]['op']=='exp','positive fixed radial upper endpoint')
    # XR is strictly positive in the authenticated N3 source; the two exp
    # operands are positive on the original real source domain.
    from prove_original_n3_Q_rho_signs import structural_real_sign
    require(structural_real_sign({'ref':'XR'},profile['parametersExactExpressions'])==1,'XR positive')
    frontier=[{'node_id':i,**flow.debts(i)} for i in entries if flow.all[i]]
    return {'schema':'MathScope.M3.Original70BoundIntegrationVariableDomains/1',
        'original_graph_sha256':GRAPH,'original_registry_sha256':REG,
        'pinned_N3_expression_sha256':profile['parameterExpressionSHA256'],
        'pinned_N3_decoded_expression_sha256':EXPECTED_DECODED_EXPRESSIONS_SHA256,
        'calls':flow.calls,'call_count':len(flow.calls),
        'coordinate_roles':{str(c):{'name':n,'role':'BOUND_RADIAL_INTEGRATION_VARIABLE_NOT_INTEGRAL_VALUE'} for c,n in COORDINATES.items()},
        'integral_contexts':flow.integrals,'native_entry_frontier':frontier,
        'native_entries_with_unresolved_radius_or_log_debt':sum(any(r[k] for k in ('upper','lower','log')) for r in frontier),
        'scoped_radius_proof_closed_under_declared_hypotheses':bool(frontier) and all(not any(r[k] for k in ('upper','lower','log')) for r in frontier),
        'hypotheses':['all actual/formal radial X values passed to these entries are real and nonnegative',
                      'original native substitution and differentiation semantics',
                      'original N3 real source parameter hypotheses'],
        'direct_before_branch_Y_upper':'4','alias_before_branch_Y_strict_upper':str(paper_upper),
        'profile_integral_value_supnorm_is_not_a_Y_input_requirement':True,
        'physical_native_image_membership_proved_here':False,
        'global_native_Y_calls_newly_certified':0,
        'original_global_Y_certified':33,'original_global_Y_OPEN':490,
        'common_Brho_or_final_field_proved':False,'final_67_jets':0,'release':'HOLD'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True);p.add_argument('--reach',required=True);p.add_argument('--output',required=True)
    a=p.parse_args();result=prove(a.graph_dir,a.reach)
    Path(a.output).write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:result[k] for k in ('call_count','native_entries_with_unresolved_radius_or_log_debt','global_native_Y_calls_newly_certified','release')}))
