#!/usr/bin/env python3
"""Read existing authenticated records; never regenerate historical producers."""
from __future__ import annotations
from collections import Counter
from fractions import Fraction
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
RECOVERY = 'research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1/'
CONTINUATION = 'research-ide/mathscope-m3/evidence/work-continuation-20261018T081100Z_5f6a2d9c/'
EXPECTED_PAYLOAD_SHA256 = '620925294060e0c821492c5bbf2dcc20cfcab2c83e9a937fa3798498813dec06'
INPUTS = {
 'header': (RECOVERY+'recovered/base/analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json', 'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'),
 'closure': (RECOVERY+'work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json', '2cbb5c74eb58ef82f948a19bad00a299c38b802cb8e668e94da8e34a37f77e91'),
 'direct': (RECOVERY+'work/prune_recovery/native/evidence/DIRECT_INDEXED_OPERAND_SUPPLEMENTS.json', 'd79830272935fcacd6084594d19c3acbe56f608a5c6fbdaad57d5e6d7446eac4'),
 'transitive': (CONTINUATION+'work/resumed_continuation/indexed/evidence/TRANSITIVE_INDEXED_DEPENDENCIES.json', '81fc4a98953dd28683d7ae7f4e171eca92bcd258e9f7fbfb3160bebae8eaf43d'),
 'recipes': (RECOVERY+'work/prune_recovery/native/evidence/FINITE_INDEXED_RECIPES.json', '7723f92b99fa7579a7abc304d5b0b82cae4a7ae057ff7fe627b4e11cc4ef3118'),
 'derivative_connection': (CONTINUATION+'work/resumed_continuation/indexed/evidence/ACTUAL_INDEXED_DERIVATIVE_CONNECTION.json', '6827398d089869d9772077eb6d457ef30c81f7084c759c506c5171795d483b74'),
 'band_source': ('research-ide/mathscope-m3/navier/source-global-band.mjs', 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'),
 'representative_source': ('research-ide/mathscope-m3/navier/source-global-representative.mjs', 'f3fbcf74b42c59cbfdd563e0fddcba9fab5cad782a96695930e3445c50373541'),
 'current_source': ('research-ide/mathscope-m3/navier/source-global-current.mjs', '93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760'),
 'index_source': ('research-ide/mathscope-m3/navier/global-source-index.mjs', 'a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f'),
 'partition_source': ('research-ide/mathscope-m2/navier/actual-covariance-source-certificate.mjs', 'c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681'),
 'profile_source': (RECOVERY+'recovered/base/work/n602_continuation/source/research-ide/mathscope-m2/navier/source-profile-data.mjs', 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'),
 'native_implementation': ('research-ide/mathscope-m3/recovery-20261019/native/slow_inverse_native.py', 'efb7f304a98820b0da7450b4acfe88d52f10e5bf82b1bde0564121dab5391609'),
}

def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()

def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()

def children(node):
    op,a=node['op'],node['args']
    if op in {'rational','coordinate','source_parameter'}: return []
    if op in {'integer_power','source_step_derivative'}: return a[:1]
    if op=='actual_monotone_root': return a[1:]
    if op in {'add','multiply','inverse','exp','log_positive','sqrt_positive','maximum',
              'ceiling','smooth_piecewise','sine','cosine','definite_integral'}: return a
    raise ValueError('Unreviewed argument grammar: '+op)

def build():
    data,inputs={},{}
    for key,(relative,expected) in INPUTS.items():
        payload=(REPO/relative).read_bytes()
        if hashlib.sha256(payload).hexdigest()!=expected:
            raise ValueError('SOURCE_BYTES_CHANGED: '+relative)
        inputs[key]={'path':relative,'sha256':expected,'bytes':len(payload)}
        data[key]=json.loads(payload) if relative.endswith('.json') else payload.decode()
    nodes={}
    origins={}
    for key,member in [('closure','records'),('direct','records'),('transitive','newRecords')]:
        for text,node in data[key][member].items():
            i=int(text)
            if i in nodes and nodes[i]!=node: raise ValueError('COLLIDING_SOURCE_RECORD')
            nodes[i]=node;origins.setdefault(i,[]).append(key)
    if data['closure']['source_header_sha256']!=inputs['header']['sha256']:
        raise ValueError('CLOSURE_HEADER_MISMATCH')
    recipe=next(r for r in data['recipes']['recipes'] if r['node']==643019)
    if recipe['sourceDefinitionSHA256']!='20c5fdc7d167da29be94bbe4f1a2cc479a3f53b2837124b46c1b7d24d0e50fa3':
        raise ValueError('INDEXED_DEFINITION_CHANGED')
    expected={
        622803:('coordinate',['m3_global_band_slow_Z$30436']),
        622804:('coordinate',['m3_global_band_slow_T$30437']),
        622820:('actual_monotone_root',[2,622803,622804]),
        623935:('actual_monotone_root',[2,623921,623934]),
        127:('log_positive',[24]),22:('add',[19,21]),21:('multiply',[9,20]),
        622792:('multiply',[127,622791]),622793:('multiply',[20,622792]),
        622794:('exp',[622793]),622830:('multiply',[622794,622820]),
        617517:('inverse',[127]),625155:('log_positive',[622830]),
        625156:('multiply',[617517,625155]),625157:('multiply',[20,625156]),
        632176:('add',[19,625157]),632177:('multiply',[20,632176]),
        632178:('ceiling',[632177]),632179:('multiply',[20,632178]),
        632182:('add',[20,632179]),632251:('add',[1,632179]),
        632217:('multiply',[127,632179]),632218:('multiply',[20,632217]),
        632219:('exp',[632218]),632220:('inverse',[632219]),
        632221:('multiply',[622794,632220]),632222:('sqrt_positive',[632221]),
        632223:('multiply',[622802,632222]),632224:('log_positive',[632221]),
        632225:('multiply',[22,632224]),632226:('exp',[632225]),
        632227:('multiply',[622803,632226]),632228:('multiply',[622804,632221]),
        625191:('rational',['-3','4']),120836:('rational',['3','4']),
        28826:('multiply',[12,28825]),28825:('exp',[319]),137008:('multiply',[24,28826]),
    }
    for i,(op,args) in expected.items():
        if nodes.get(i)!={'op':op,'args':args}: raise ValueError(f'ACTUAL_AST_CHANGED:{i}')
    selected_rows=[r for r in recipe['rows'] if r['label']['key'] in {'-1:0:0:0','0:0:0:0','1:0:0:0'}]
    seeds={622803,622804,623921,623934,622819,622824,28826,*expected}
    for row in selected_rows:
        # xi/v pulse arguments are retained in the frame records, but are not
        # operands of either representative slow argument and are not re-expanded.
        seeds.update(row['argumentNodes'][:7])
        seeds.update(x for guard in row['guards'] for x in guard)
    def closure(root):
        reached=set();stack=[root]
        while stack:
            i=stack.pop()
            if i in reached:continue
            if i not in nodes:raise ValueError(f'MISSING_SOURCE_RECORD:{i}')
            reached.add(i);stack.extend(children(nodes[i]))
        return reached
    selected=set().union(*(closure(i) for i in seeds))
    free_memo={}
    def free(i):
        if i in free_memo:return free_memo[i]
        node=nodes[i];op,a=node['op'],node['args']
        if op=='coordinate': result={i}
        elif op=='definite_integral':result=(free(a[0])-{a[1]})|free(a[2])|free(a[3])
        else:result=set().union(*(free(k) for k in children(node)))
        free_memo[i]=result;return result
    argument_dossiers={}
    for root in [622803,622804,623921,623934,28826]:
        reached=closure(root)
        argument_dossiers[str(root)]={
            'root_record':nodes[root], 'reachable_records':len(reached),
            'operation_counts':dict(sorted(Counter(nodes[i]['op'] for i in reached).items())),
            'free_coordinates':[{'node':i,'record':nodes[i]} for i in sorted(free(root))],
            'source_parameters':[{'node':i,'name':nodes[i]['args'][0]} for i in sorted(reached) if nodes[i]['op']=='source_parameter'],
            'definite_integrals':[{'node':i,'record':nodes[i],'free_coordinates':sorted(free(i))} for i in sorted(reached) if nodes[i]['op']=='definite_integral'],
            'native_calls':[{'node':i,'record':nodes[i]} for i in sorted(reached) if nodes[i]['op']=='actual_monotone_root'],
            'reachable_node_ids':sorted(reached),'all_argument_records_present':True,
            'actual_numeric_outer_binding_computed':False,
        }
    profile=json.loads(data['profile_source'].split('export const PINNED_N3 = ',1)[1].strip().removesuffix(';'))
    parameter_names={nodes[i]['args'][0] for i in selected if nodes[i]['op']=='source_parameter'}
    parameters=profile['parametersExactExpressions']
    parameter_expressions={name:parameters[name] for name in sorted(parameter_names)}
    source_formulas={
        'reference_Q':'exp(-ell*log(2))',
        'actual_q':'Q_reference*s',
        'center_band':'-ceil(-(1/2 - log(q)/log(2)))',
        'center_relative_offset':'floor(1/2-log2(s)), using original integer ell',
        'candidate_relative_offset':'center_relative_offset + displacement, displacement in {-1,0,1}',
        'ratio':'Q_reference/Q_label = 2^(ell_label-ell)',
        'caller_transport':{'R':'sqrt(ratio)*R','Z':'ratio^(1/2-h)*Z','T':'ratio*T','s':'ratio*s'},
        'original_band_guard':'abs(-log2(q)-ell_label)<3/4',
        'equivalent_guard':'1/8 < (ratio*s)^4 < 8',
        'root_covariance':'F(r*s; r^(1/2-h)*Z,r*T) = r*F(s;Z,T)',
        'source_radial_guard':'Xa < R^2/(2*s) < Xb, Xb=XR*exp(node319)',
    }
    result={
        'schema':'MathScope.ActualSlowCallerSourceCapsule/1',
        'implementation_kind':'NEW source dossier and exact reduction; no historical producer rerun',
        'source_files':inputs,'source_node_count':len(selected),
        'source_nodes':{str(i):nodes[i] for i in sorted(selected)},
        'source_record_origins':{str(i):origins[i] for i in sorted(selected)},
        'native_call_nodes':[622820,623935],'source_formulas':source_formulas,
        'argument_dossiers':argument_dossiers,
        'indexed_call':{'node':643019,'outer_parameters':recipe['outerParameters'],
                        'outer_argument_nodes':recipe['outerArgumentNodes'],
                        'source_definition_sha256':recipe['sourceDefinitionSHA256'],
                        'all_original_row_count':recipe['rowCount'],'illustrative_exact_rows':selected_rows},
        'lexical_frames':[
            {'frame':'reference indexed frame','formal_nodes':[622802,622803,622804,622791,635044,635045],
             'interpretation':'R,Z,T,integer ell,Y0,Y1 remain externally bound source coordinates; the outer radial guard calls622820 in this reference frame.'},
            {'frame':'local frozen row frame','formal_nodes':selected_rows[2]['localParameters'],
             'interpretation':'Evaluate all row argumentNodes in the reference frame, then bind simultaneously. Both signs of center rows80/81 share ell and mesh but retain distinct pulse xi/v arguments.'},
            {'frame':'fixed representative argument frame','formal_nodes':[622791,623855,623856,623857],
             'interpretation':'623921/623934 use only frozen local ell and r/z/t mesh labels plus original constants; never reinterpret labels as current R/Z/T or differentiate the frozen nearest-cell map.'},
            {'frame':'monotone registry inner frame','formal_nodes':[622803,622804,622810],
             'interpretation':'Evaluate call arguments in their caller frame; bind registry Z,T simultaneously in a fresh frame; bind s only while evaluating residual622819. Memoizing by bare node ID across these frames is invalid.'},
        ],
        'original_domain':{
            'source_s':['1/2','2'],'source_eta':['-1','1'],'T_nonnegative':True,
            'D':'1/2-h','h':'exp(-8002*(exp(1048576)+10))','h_strictly_positive':True,
            'ell':'original integer in authenticated source coefficient window; no numeric ell supplied here',
            'slow_X':'[Xa/2,2*Xb]','active_X':'Xa<X<Xb','representative_X':'[Xa,Xb]',
            'same_box':'same ell and integer mesh; each fixed coordinate offset strictly between -3/4 and3/4',
            'source_membership_not_established':['ell>=ell0','membership in original coefficient window','actual external R/Z/T values','all source radial guard operands','nonempty active representative intersection'],
        },
        'original_constants':{
            'B0':'7/10','C0_star':'6/5',
            'paper':{'sha256':'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f','pdf_pages':[106,107],'location':'Proposition9.5; Definition9.4 and conditions9.8-9.10'},
            'blueprint':{'sha256':'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac','pdf_page':62,'criterion':'N6-01'},
            'source_parameter_expression_family_sha256':profile['parameterExpressionSHA256'],
            'direct_parameter_expressions':parameter_expressions,
            'radial_Xb':{'node':28826,'expression':'XR*exp(node319)','outer_integrals':[239,257,275],'nested_integrals':[229,249]},
            'constants_changed':False,
        },
        'concrete_remaining_obligations':[
            {'id':'external-frame','operands':[622802,622803,622804,622791],
             'blocker':'Source records declare formals, not numeric values. The actual global point and original prefix/ell membership must supply a validated outer frame; no missing AST record is being alleged.'},
            {'id':'fixed-mesh-integers','operands':[623855,623856,623857],
             'blocker':'Center rows bind these to632236/632240/632244, the exact ceilings of ell_label^6 times transported coordinates. The new relative band reduction avoids huge Q but does not evaluate ell_label^6 or decide a mesh ceiling at a crossing.'},
            {'id':'radial-shell','operands':[3617,28826,319,239,257,275,229,249],
             'blocker':'Xa is4/Lambda. Xb is XR*exp(node319); node319 retains three outer and two nested original definite integrals. Their records exist. No numeric endpoint value or positive denominator275 certificate is supplied by the caller transport.'},
            {'id':'representative-sign-choice','operands':[623914,623921,623934,623935],
             'blocker':'Need source-active nonempty same-box proof plus certified fixed inputs. A zero-crossing in negativeWidth623914 cannot be resolved by rounding or by substituting a current-point representative.'},
        ],
        'next_executable_unit':'The new original band-offset/guard/coordinate-scaling reduction implemented beside this dossier. After it, validate the actual external frame and original integer-window membership; then enclose fixed mesh ceilings and original radial endpoint integrals without changing constants.',
        'reused_existing_records_only':True,'historical_700_or_3407_producers_rerun':False,
        'actual_global_field_evaluated':False,'N7_06_closed':False,'N8_05_closed':False,
        'new_M3_closures':0,'actual_global_last_resolved_tau':None,
    }
    result['payload_sha256']=digest(result)
    if result['payload_sha256']!=EXPECTED_PAYLOAD_SHA256:
        raise ValueError('FULL_REVIEWED_CALLER_CAPSULE_CHANGED')
    return result

if __name__=='__main__':
    result=build()
    path=HERE/'evidence/CALLER_SOURCE_CAPSULE.json'
    path.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'path':str(path),'payload_sha256':result['payload_sha256'],
                     'source_nodes':result['source_node_count'],
                     'representative_free_coordinates':[x['node'] for x in result['argument_dossiers']['623934']['free_coordinates']],
                     'original_constants':{'B0':'7/10','C0_star':'6/5'},'new_M3_closures':0},indent=2))
