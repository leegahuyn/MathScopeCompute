#!/usr/bin/env python3
"""Targeted exact-source and fail-closed controls for the new native recovery."""
import copy
from native_binding import *

def main():
    b=SourceBindings();checks=[]
    def check(name,condition):
        if not condition:raise AssertionError(name)
        checks.append({'id':name,'pass':True})
    def reject(name,fn):
        try:fn()
        except Unresolved:checks.append({'id':name,'pass':True});return
        raise AssertionError('did not fail closed: '+name)
    check('original_header_exact_byte_pin',pin(HEADER)['sha256']==EXPECTED_HEADER_SHA256)
    check('authenticated_closure_exact_byte_pin',pin(CLOSURE)['sha256']==EXPECTED_CLOSURE_SHA256)
    reject('floating_point_is_not_an_interval_enclosure',lambda:Interval(0.1,0.2))
    reject('reversed_interval',lambda:Interval(1,0))
    reject('duplicate_formal_rejected',lambda:bound_environment([2,2],[Interval.point(0)]*2))
    reject('wrong_formal_arity_rejected',lambda:bound_environment([2],[]))
    reject('uncertified_argument_rejected',lambda:bound_environment([2],[0]))
    reject('negative_native_namespace_index',lambda:b.definition({'op':'m3_coupled_expression_partial','args':['coupled-expression:-1']}))
    reject('wrong_native_namespace',lambda:b.definition({'op':'m3_coupled_expression_partial','args':['wrong-prefix:0']}))
    reject('negative_quadratic_registry_index',lambda:b.definition({'op':'actual_quadratic_root','args':[-1]}))
    reject('bool_registry_index',lambda:b.definition({'op':'actual_quadratic_root','args':[True]}))
    quad=[(i,n) for i,n in b.nodes.items() if n['op']=='actual_quadratic_root']
    for i,n in quad:
        _,beta,q,radius,_=b.quadratic_constants(n['args'][0]);iv=b.quadratic_enclosure(i,Interval(-1,1))
        check('actual_quadratic_'+str(i),iv.hi==beta/(1-q) and iv.lo==-iv.hi and iv.hi<radius)
    reject('quadratic_eta_domain',lambda:b.quadratic_enclosure(quad[0][0],Interval(-2,1)))
    natural=next(i for i,n in b.nodes.items() if n['op']=='actual_natural_series')
    reject('natural_Y_domain',lambda:b.natural_enclosure_plan(natural,Interval(0,6),Interval(-1,1)))
    reject('natural_eta_domain',lambda:b.natural_enclosure_plan(natural,Interval(0,5),Interval(-2,1)))
    picard=next(i for i,n in b.nodes.items() if n['op']=='actual_background_even_profile')
    reject('Picard_smooth_collar_is_not_core_holomorphic',lambda:b.picard_core_enclosure_plan(picard,Interval(4,F(41,10)),Interval(-1,1)))
    reject('Picard_eta_domain',lambda:b.picard_core_enclosure_plan(picard,Interval(0,4),Interval(-2,1)))
    reject('natural_tail_degree',lambda:natural_scaled_tail(0,5,1,0))
    reject('natural_tail_noncontractive_ratio',lambda:natural_scaled_tail(0,5,0,12))
    pairs=sorted(set((n['args'][3],n['args'][4]) for n in b.nodes.values() if n['op']=='actual_natural_series'))
    for k,m in pairs:
        norm=natural_norm_majorant(k,m);proof=norm['integerProof']
        check('natural_norm_integer_inequality_'+str(k)+'_'+str(m),proof['afterTLe2ExpMd']<proof['strictlyBelow'])
        check('natural_scaled_tail_decreases_'+str(k)+'_'+str(m),0<natural_scaled_tail(65,5,k,m)<natural_scaled_tail(64,5,k,m))
    # Synthetic interval controls exercise only guard mechanics. They are not
    # reported as actual source caller coordinate evaluations.
    guards=[[10,11,12]];values={10:Interval.point(0),11:Interval.point(1),12:Interval.point(2)}
    called=[]
    check('inactive_guard_precedes_singular_body',guarded_evaluate(guards,{},lambda n,e:values[n],lambda e:called.append(True))==Interval.point(0) and not called)
    values[10]=Interval(F(1,2),F(3,2))
    reject('crossing_guard_fails_closed',lambda:guard_status(guards,{},lambda n,e:values[n]))
    values[10]=Interval.point(F(3,2))
    check('interior_guard',guard_status(guards,{},lambda n,e:values[n])=='active')
    indexed=[(i,n) for i,n in b.nodes.items() if n['op'] in {'m3_global_indexed_partial','m3_aux_indexed_partial'}]
    total=0
    for i,n in indexed:
        recipe=b.indexed_recipe(i);_,s=b.definition(n);total+=recipe['rowCount']
        check('retains_all_actual_indexed_rows_'+str(i),recipe['rowCount']==len(s['rows']) and [r['label'] for r in recipe['rows']]==[r['label'] for r in s['rows']])
    check('actual_indexed_total_rows',total==5184 and len(indexed)==34)
    aux=next(i for i,n in indexed if n['op']=='m3_aux_indexed_partial');saved=b.nodes[aux]
    b.nodes[aux]=copy.deepcopy(saved);b.nodes[aux]['args'][2]=[16,1]+[0]*(len(saved['args'][2])-2)
    reject('auxiliary_total_order_budget',lambda:b.indexed_recipe(aux));b.nodes[aux]=saved
    glob=next(i for i,n in indexed if n['op']=='m3_global_indexed_partial');saved=b.nodes[glob]
    b.nodes[glob]=copy.deepcopy(saved);b.nodes[glob]['args'][2]=[2,1,0]
    reject('global_conservative_total_order_budget',lambda:b.indexed_recipe(glob));b.nodes[glob]=saved
    slow=next(i for i,n in b.nodes.items() if n['op']=='actual_monotone_root' and n['args'][0]==2)
    reject('slow_Z_domain',lambda:b.slow_enclosure(slow,[Interval.point(2),Interval.point(0)],lambda n,e:Interval.point(0)))
    reject('slow_missing_endpoint_signs',lambda:b.slow_enclosure(slow,[Interval.point(0),Interval.point(0)],lambda n,e:Interval(-1,1)))
    check('same_header_after_controls',pin(HEADER)['sha256']==EXPECTED_HEADER_SHA256)
    result={'schema':'MathScope.NewRecoveryNativeTargetedControls/1','checks':checks,'checkCount':len(checks),'allPass':True,
            'syntheticTestsAreNotActualCallerValues':True,'sourceHeader':pin(HEADER),'sourceClosure':pin(CLOSURE),'newM3Closures':0}
    write('NATIVE_TARGETED_CONTROLS.json',result)
    print(json.dumps({'pass':True,'checks':len(checks),'newM3Closures':0},sort_keys=True))

if __name__=='__main__':main()
