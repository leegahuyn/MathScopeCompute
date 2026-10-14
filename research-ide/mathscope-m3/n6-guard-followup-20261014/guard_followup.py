"""Iterative source/capture audit of the two actual recursion-limited guards.

The proof concerns exact substitution and its unchanged definedness domain.
It grants no existence, regularity, global image, support or class bound.
"""
from __future__ import annotations
from collections import Counter
import copy
import json
from pathlib import Path
import sys
import time

BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'n6-cloud-20261014'))
sys.path.insert(0,str(BASE/'n6-finish-20261014'))
from jet_worker import SourceCalculus,REGISTERED_OPS,EXPRESSION_OPS,UNARY,definition_key
from guard_solve import complete_source_store,audit_all_chart_rows,SourceIntegrityError,ChartAlgebra
from guard_worker import PARENT,read,write,find,sha,file_sha

LATEST_MATRIX='research-ide/mathscope-m3/evidence/n6-finish-20261014/run-38523108728/OBLIGATION_MATRIX.json'
LATEST_SHA='22468ce11fef4384b12eeb640dd0ca43c23a6e6be3c96795642546f20f2a1480'


class IterativeSourceCalculus(SourceCalculus):
    """Same conservative rules and complete capture audits, explicit DAG stack."""
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs);self.maximum_explicit_stack=0
        self.indexed_local_capture_cache={};self.indexed_local_capture_active=set();self.header_bindings_loaded=False

    def original_binding(self,key):
        if key in self.defs:return self.defs[key]
        if not self.header_bindings_loaded and hasattr(self.source,'all_registries'):
            registries=self.source.all_registries()
            for name,value in registries.items():
                entries=[]
                if name=='definitions' and isinstance(value,list):
                    for group,items in enumerate(value):
                        if isinstance(items,list):entries.extend((f'definitions:{group}:{i}',d) for i,d in enumerate(items) if isinstance(d,dict))
                elif isinstance(value,list):entries.extend((f'{name}:{i}',d) for i,d in enumerate(value) if isinstance(d,dict))
                elif name=='fixed' and isinstance(value,dict):entries=[('fixed:null',value)]
                for ident,d in entries:
                    digest=sha(d)
                    if ident in self.defs:
                        if self.defs[ident]['definitionSHA256']!=digest:raise SourceIntegrityError('checkpoint/header original definition mismatch: '+ident)
                    else:self.defs[ident]={'key':ident,'definition':d,'definitionSHA256':digest}
            self.header_bindings_loaded=True
        return self.defs.get(key)

    def _capture_audit(self,ident):
        n=self.source[ident];key=definition_key(n);binding=self.original_binding(key)
        if binding is not None and n['op'] in EXPRESSION_OPS:
            fields=[k for k in binding['definition'] if any(w in k.lower() for w in ['domain','premise','hypothes','guard'])]
            if fields:return {'pass':False,'key':key,'reason':'explicit expression domain metadata not independently pulled back','domainFields':fields}
        base=super()._capture_audit(ident)
        if not base['pass'] or binding is None or 'rows' not in binding['definition']:return base
        if key in self.indexed_local_capture_cache:
            extra=self.indexed_local_capture_cache[key]
        elif key in self.indexed_local_capture_active:
            return {**base,'pass':False,'reason':'recursive indexed local-body capture closure remains unproved'}
        else:
            self.indexed_local_capture_active.add(key);records=[];seen=set()
            try:
                for index,row in enumerate(binding['definition']['rows']):
                    body=row.get('localBody');parameters=row.get('localParameters');system=row.get('localSystem')
                    if type(body) is not int or not isinstance(parameters,list) or len(parameters)!=len(set(parameters)) or len(parameters)!=len(row.get('values',[])):
                        records.append({'row':index,'pass':False,'reason':'complete original local body/parameter/application tuple missing'});continue
                    if type(system) is int:local_key=f'expression:{system}' if system>=0 else f'expressionDefinitions:{-1-system}'
                    elif isinstance(system,str) and system.startswith('coupled-expression:'):local_key='definitions:0:'+system.split(':',1)[1]
                    elif isinstance(system,str) and system.startswith('forced-expression:'):local_key='definitions:4:'+system.split(':',1)[1]
                    else:
                        records.append({'row':index,'pass':False,'reason':'unreviewed actual local-system registry key','localSystem':system});continue
                    local_binding=self.original_binding(local_key)
                    if local_binding is None:
                        records.append({'row':index,'pass':False,'reason':'complete original local expression registry absent','localRegistryKey':local_key});continue
                    d=local_binding['definition']
                    if d.get('body')!=body or d.get('parameters')!=parameters or sha(d)!=local_binding['definitionSHA256']:
                        raise SourceIntegrityError('actual indexed row changed its defining local body or complete formal parameter tuple')
                    domain_fields=[k for k in d if any(w in k.lower() for w in ['domain','premise','hypothes','guard'])]
                    if domain_fields:
                        records.append({'row':index,'pass':False,'reason':'local expression has unreviewed explicit domain metadata','domainFields':domain_fields});continue
                    identity=(body,tuple(parameters))
                    if identity in seen:continue
                    seen.add(identity);coords,unknown=self.source_support(body);escapes=coords-set(parameters)
                    records.append({'firstActualRow':index,'localRegistryKey':local_key,'localDefinitionSHA256':local_binding['definitionSHA256'],
                        'actualLocalBody':body,'actualLocalBodyNodeSHA256':sha(self.source[body]),'completeLocalParameters':parameters,
                        'fullLocalBodyFreeCoordinates':sorted(coords),'hiddenCapturedCoordinates':sorted(escapes),'unreviewedSupport':sorted(unknown),
                        'allNestedNativeBodiesIndependentlyReopened':True,'pass':not escapes and not unknown})
                extra={'pass':bool(records) and all(r['pass'] for r in records),'actualDeclaredRows':len(binding['definition']['rows']),
                    'uniqueLocalBodiesIndependentlyAudited':records,'allActualLocalBodiesChecked':True}
                self.indexed_local_capture_cache[key]=extra
            finally:self.indexed_local_capture_active.discard(key)
        return {**base,'pass':bool(extra['pass']),'independentCompleteIndexedLocalBodyCapture':extra}

    def source_support(self,ident):
        if ident in self.support_cache:return self.support_cache[ident]
        if ident in self.support_active:return frozenset(),frozenset({f'cycle:{ident}'})
        stack=[(ident,None)];entered=set()
        try:
            while stack:
                self.maximum_explicit_stack=max(self.maximum_explicit_stack,len(stack))
                current,frame=stack.pop();self.tick()
                if frame is not None:
                    children,binder,unknown=frame;coords=set()
                    for index,child in enumerate(children):
                        c,u=self.support_cache.get(child,(frozenset(),frozenset({f'cycle:{child}'})))
                        coords.update(c-{binder} if binder is not None and index==0 else c);unknown.update(u)
                    self.support_cache[current]=(frozenset(coords),frozenset(unknown))
                    self.support_active.discard(current);entered.discard(current);continue
                if current in self.support_cache:continue
                if current in self.support_active:continue
                n=self.source.get(current)
                if n is None:
                    self.support_cache[current]=(frozenset(),frozenset({f'missing-source-node:{current}'}));continue
                self.support_active.add(current);entered.add(current);op=n['op'];a=n['args']
                if op=='coordinate':self.support_cache[current]=(frozenset({current}),frozenset())
                elif op in ['rational','source_parameter']:self.support_cache[current]=(frozenset(),frozenset())
                else:
                    unknown=set();binder=None
                    if op in ['add','multiply','maximum','smooth_piecewise']:children=a
                    elif op in UNARY:children=[a[0]]
                    elif op=='definite_integral':children=[a[0],a[2],a[3]];binder=a[1]
                    elif op in REGISTERED_OPS:
                        binding=self.original_binding(definition_key(n))
                        if not binding or len(a[1])!=len(binding['definition'].get('parameters',[])):
                            children=[];unknown.add(f'incomplete-registry-application:{current}')
                        else:
                            children=a[1];audit=self.capture_audit(current)
                            if not audit['pass']:unknown.add(f'unproved-capture-closure:{current}:{definition_key(n)}')
                            elif op in EXPRESSION_OPS:
                                formals=set(audit['formalBodyFreeCoordinates'])
                                children=[v for p,v in zip(binding['definition']['parameters'],a[1]) if p in formals]
                    elif op in ['actual_monotone_root','actual_quadratic_root','actual_natural_series',
                                'actual_background_picard','actual_background_even_profile',
                                'actual_covariance_volterra','m3_global_pulse_jet','m3_forced_pulse_partial']:
                        if op=='actual_monotone_root':children=a[1:]
                        elif op=='actual_quadratic_root':children=a[2:3]
                        elif op=='actual_natural_series':children=a[1:3]
                        elif op in ['actual_background_picard','actual_background_even_profile']:children=a[2:4]
                        elif op=='m3_forced_pulse_partial':children=[a[3],*a[4]]
                        else:children=[a[2],*a[3]]
                        audit=self.system_capture_audit(op,None if op=='actual_natural_series' else a[0])
                        if not audit['pass']:unknown.add(f"unproved-actual-system-capture:{current}:{audit['key']}")
                    else:children=[];unknown.add(f'unreviewed-source-operation:{current}:{op}')
                    stack.append((current,(children,binder,unknown)))
                    for child in reversed(children):
                        if child not in self.support_cache and child not in self.support_active:stack.append((child,None))
                    continue
                self.support_active.discard(current);entered.discard(current)
            return self.support_cache[ident]
        finally:self.support_active.difference_update(entered)


def domain_support(calc,root,max_nodes=500000):
    """Actual-tuple definedness dependencies, without dropping unused formals."""
    memo={};active=set();stack=[(root,None)];maximum_stack=0
    while stack:
        maximum_stack=max(maximum_stack,len(stack));i,frame=stack.pop();calc.tick()
        if frame is not None:
            children,binder=frame;value=set()
            for index,child in enumerate(children):
                if child not in memo:raise ValueError('cyclic exact definedness dependency')
                value.update(memo[child]-{binder} if binder is not None and index==0 else memo[child])
            memo[i]=value;active.discard(i);continue
        if i in memo:continue
        if i in active:raise ValueError('cyclic exact definedness dependency')
        if len(memo)+len(active)>max_nodes:raise RuntimeError('iterative actual domain dependency budget')
        active.add(i);n=calc.source[i];op=n['op'];a=n['args'];binder=None
        binding=calc.defs.get(definition_key(n))
        if binding is not None:
            fields=[k for k in binding['definition'] if any(w in k.lower() for w in ['domain','premise','hypothes','guard'])]
            if fields:raise ValueError('explicit source domain/premises need independent pullback: '+','.join(fields))
        if op=='coordinate':memo[i]={i}
        elif op in ['rational','source_parameter']:memo[i]=set()
        else:
            if op in REGISTERED_OPS:children=a[1]
            elif op in ['add','multiply','maximum','smooth_piecewise']:children=a
            elif op in UNARY:children=[a[0]]
            elif op=='definite_integral':children=[a[0],a[2],a[3]];binder=a[1]
            elif op=='actual_monotone_root':children=a[1:]
            elif op=='actual_quadratic_root':children=a[2:3]
            elif op=='actual_natural_series':children=a[1:3]
            elif op in ['actual_background_picard','actual_background_even_profile']:children=a[2:4]
            elif op=='m3_forced_pulse_partial':children=[a[3],*a[4]]
            elif op in ['actual_covariance_volterra','m3_global_pulse_jet']:children=[a[2],*a[3]]
            else:raise ValueError('unreviewed original domain operation '+op)
            stack.append((i,(children,binder)))
            for child in reversed(children):
                if child not in memo:stack.append((child,None))
            continue
        active.discard(i)
    return memo[root],{'actualNodesVisited':len(memo),'maximumExplicitStack':maximum_stack}


def attempt(program,guard,calc):
    # Complete pinned header is read only on the hosted runner; all native and
    # row-local bindings must be available before memoizing capture results.
    calc.original_binding('__load_complete_original_header__')
    root,bound,value=[guard[k] for k in ['root','bound','value']]
    node=program[root]
    if node['op']!='actual_opaque_value':raise ValueError('expected one exact original opaque source application')
    source_id=node['args'][0];original=calc.source[source_id]
    if original['op'] not in EXPRESSION_OPS:raise ValueError('followup handles only original expression applications')
    key=definition_key(original);binding=calc.defs.get(key)
    if binding is None or sha(binding['definition'])!=binding['definitionSHA256']:raise SourceIntegrityError('original source expression binding changed')
    coords,unknown=calc.source_support(source_id)
    if unknown:return {'globallyProved':False,'reason':'complete iterative capture closure remains unproved','unreviewed':sorted(unknown)}
    audit=calc.capture_audit(source_id)
    if not audit['pass']:return {'globallyProved':False,'reason':'exact registered application capture closure failed','captureAudit':audit}
    domains,domain_receipt=domain_support(calc,source_id)
    binder=program[bound];replacement=program[value]
    if binder['op']!='coordinate' or len(binder['args'])!=2 or type(binder['args'][1]) is not int:raise ValueError('original binder source-coordinate binding absent')
    if replacement['op']!='coordinate' or len(replacement['args'])!=2 or type(replacement['args'][1]) is not int:raise ValueError('original replacement source-coordinate binding absent')
    sid=binder['args'][1]
    if sid in coords or sid in domains:
        return {'globallyProved':False,'reason':'binder occurs in the actual expression or complete argument-domain support; nontrivial substitution needs reconstruction',
            'completeSourceCoordinateSupport':sorted(coords),'completeOriginalDomainSupport':sorted(domains)}
    return {'globallyProved':True,'originalSourceNode':source_id,'originalSourceNodeSHA256':sha(original),
        'registryKey':key,'definitionSHA256':binding['definitionSHA256'],'actualCompleteArgumentTupleUnchanged':original['args'][1],
        'storedDerivativeOrdersUnchanged':original['args'][2],'originalSourceBinder':sid,'replacementSourceCoordinate':replacement['args'][1],
        'completeSourceCoordinateSupport':sorted(coords),'completeOriginalDomainSupport':sorted(domains),
        'captureAudit':audit,'domainTraversalReceipt':domain_receipt,
        'rule':'The original actual function AND its complete definedness dependencies omit the original binder; substitution leaves the exact partial function and its domain unchanged.',
        'sourceExistenceProved':False,'wholeGlobalImageProved':False,'allNativeSystemCaptureAudits':list(calc.system_capture_cache.values()),
        'allIndexedLocalBodyCaptureAudits':calc.indexed_local_capture_cache}


def constant_four_minus_sqrt_two(program,guard):
    """Actual constant log argument: 1<sqrt(2)<2, hence 2<4-sqrt(2)<3."""
    if guard.get('kind')!='POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN' or guard.get('operation')!='log_positive':raise ValueError('expected original positive logarithm argument guard')
    root=guard['operand'];node=program[root]
    if node['op']!='add' or len(node['args'])!=2:raise ValueError('original 4-sqrt(2) sum changed')
    def rational(i,n):return program[i]=={'op':'rational','args':[str(n),'1']}
    minus,four=node['args']
    if not rational(four,4):raise ValueError('original positive constant4 changed')
    negative=program[minus]
    if negative['op']!='multiply' or len(negative['args'])!=2:raise ValueError('original negative square-root factor changed')
    sign,square=negative['args'];radical=program[square]
    if not rational(sign,-1) or radical['op']!='sqrt_positive' or len(radical['args'])!=1 or not rational(radical['args'][0],2):
        raise ValueError('original minus sqrt(2) term changed')
    if not 1*1<2<2*2:raise AssertionError('exact rational square enclosure failed')
    nodes=[root,minus,four,sign,square,radical['args'][0]]
    return {'globallyProved':True,'exactConstant4MinusSqrt2':True,'strictLowerBound':'2','strictUpperBound':'3',
        'squareRootPositiveDomainProved':'2>0','independentSquaredRationalBounds':['1^2<2','2<2^2'],
        'proof':'Positive square root is strictly increasing; 1<sqrt(2)<2 implies2<4-sqrt(2)<3.',
        'originalConstantSourceBindings':[{'originalScalarNode':i,'node':program[i],'nodeSHA256':sha(program[i])} for i in nodes],
        'freeCoordinateSupport':[],'globalSourceImageAssumed':False}


def branch_dominance(program,guard):
    """Meet path guarantees from EVERY typed DAG sink to every inverse use.

    Integer literals, source IDs and derivative orders are never child edges.
    Facts are discarded across binder/substitution/derivative environment
    changes. No caller root enumeration or unknown evaluation rule is assumed.
    """
    operand=guard['operand'];parents=[[] for _ in program];alg=ChartAlgebra(dict(enumerate(program)),max_work=100000)
    def rational(i,n):return program[i]=={'op':'rational','args':[str(n),'1']}
    for i,node in enumerate(program):
        op=node['op'];a=node['args'];edges=[]
        if op in ['coordinate','source_parameter','rational','actual_opaque_value']:pass
        elif op in ['add','multiply','maximum']:edges=[(j,None,False) for j in a]
        elif op in UNARY:edges=[(a[0],None,False)]
        elif op=='definite_integral':edges=[(a[0],None,True),(a[2],None,False),(a[3],None,False)]
        elif op=='smooth_piecewise':
            if len(a)!=6:raise ValueError('original piecewise source arity changed')
            fact=(a[0],a[1],a[2]) if rational(a[1],0) and rational(a[2],1) else None
            edges=[(j,fact if edge==4 else None,False) for edge,j in enumerate(a)]
        elif op=='unresolved_opaque_substitution':edges=[(a[0],None,True),(a[2],None,False)]
        elif op=='unresolved_total_source_jet':edges=[(a[0],None,True)]
        else:raise ValueError('unreviewed exact scalar evaluation edge grammar: '+op)
        for child,fact,drop in edges:
            if type(child) is not int or child<0 or child>=i:raise ValueError('original scalar DAG has a noncausal typed expression edge')
            parents[child].append((i,fact,drop))
    guarantees=[set() for _ in program];sinks=[]
    for i in range(len(program)-1,-1,-1):
        if not parents[i]:sinks.append(i);continue
        incoming=[]
        for parent,fact,drop in parents[i]:
            context=set() if drop else set(guarantees[parent])
            if fact is not None:context.add(fact)
            incoming.append(context)
        guarantees[i]=set.intersection(*incoming)
    uses=[i for i,n in enumerate(program) if (n['op']=='inverse' and n['args']==[operand]) or
        (n['op']=='integer_power' and n['args'][0]==operand and n['args'][1]<0)]
    if not uses:raise ValueError('original nonzero guard has no retained inverse/power use')
    common=set.intersection(*(guarantees[i] for i in uses));matched=None
    for fact in sorted(common):
        try:polynomial=alg.polynomial(operand,{fact[0]:'t'})
        except ValueError:continue
        if polynomial=={('t',):1,('t','t'):-1}:matched=fact;break
    evidence={'globallyProved':matched is not None,'strictActiveBranchNonzero':matched is not None,
        'allOriginalDAGSinksConsidered':True,'originalDAGSinkCount':len(sinks),'typedOriginalProgramNodes':len(program),
        'allInverseUseNodes':[{'originalScalarNode':i,'nodeSHA256':sha(program[i]),'guaranteedActiveBranches':[list(x) for x in sorted(guarantees[i])]} for i in uses],
        'commonDominatingActiveBranches':[list(x) for x in sorted(common)],'matchedOriginalActiveBranch':matched,
        'allRootToInversePathsGuarded':matched is not None,'selectorDefinednessProved':False,'flatJoinsProved':False,
        'globalSourceImageAssumed':False,'scope':'Every actual evaluation of this original inverse in the whole original scalar DAG; inactive branches remain unevaluated.'}
    if matched is not None:evidence['proof']='Every evaluation path imposes0<t<1 for this same exact selector; the actual original denominator equals t*(1-t)>0 by exact rational polynomial comparison.'
    else:evidence['reason']='at least one original inverse evaluation path lacks the same exact interior-branch constraint; original guard retained'
    return evidence


def negative_controls():
    from jet_worker import js_hash
    results=[]
    for name,hidden,domain,present in [('hidden captured binder',True,False,False),
            ('unused formal still in actual domain',False,False,True),('explicit hidden domain predicate',False,True,False)]:
        source={0:{'op':'coordinate','args':['x']},1:{'op':'coordinate','args':['y']},2:{'op':'coordinate','args':['binder']},
            3:{'op':'integer_power','args':[2 if hidden else 0,2]},4:{'op':'actual_expression_partial','args':[0,[0,1],[0,0]]}}
        d={'parameters':[0,1],'body':3,'derivativeLimits':[1,1]}
        if domain:d['domain']={'positive':2}
        defs={'expression:0':{'key':'expression:0','definition':d,'definitionSHA256':js_hash(d)}}
        program=[{'op':'coordinate','args':['binder',1 if present else 2]},{'op':'coordinate','args':['x',0]},
            {'op':'actual_opaque_value','args':[4,'actual_expression_partial']}]
        calc=IterativeSourceCalculus(source,defs,max_work=10000)
        try:rejected=not attempt(program,{'root':2,'bound':0,'value':1},calc)['globallyProved']
        except ValueError:rejected=True
        if not rejected:raise AssertionError('unsafe substitution negative mutation accepted: '+name)
        results.append({'mutation':name,'rejected':True})
    constant=[{'op':'rational','args':['-1','1']},{'op':'rational','args':['2','1']},
        {'op':'sqrt_positive','args':[1]},{'op':'multiply','args':[0,2]},
        {'op':'rational','args':['4','1']},{'op':'add','args':[3,4]}]
    guard={'kind':'POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN','operation':'log_positive','operand':5}
    for name,index,value in [('constant4 changed to1',4,1),('sqrt2 changed tosqrt16',1,16)]:
        changed=copy.deepcopy(constant);changed[index]={'op':'rational','args':[str(value),'1']}
        try:constant_four_minus_sqrt_two(changed,guard)
        except ValueError:results.append({'mutation':name,'rejected':True})
        else:raise AssertionError('unsafe constant guard mutation accepted: '+name)
    branch=[{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},
        {'op':'coordinate','args':['t',999]},{'op':'rational','args':['-1','1']},
        {'op':'multiply','args':[3,2]},{'op':'add','args':[1,4]},
        {'op':'multiply','args':[2,5]},{'op':'inverse','args':[6]},
        {'op':'multiply','args':[3,7]},{'op':'exp','args':[8]},
        {'op':'smooth_piecewise','args':[2,0,1,0,9,0]}]
    for name,mutated in [('unguarded inverse DAG sink',branch+[{'op':'inverse','args':[6]}]),
            ('inverse moved to exterior branch',branch[:-1]+[{'op':'smooth_piecewise','args':[2,0,1,9,0,0]}])]:
        if branch_dominance(mutated,{'operand':6})['globallyProved']:raise AssertionError('unsafe branch-dominance mutation accepted: '+name)
        results.append({'mutation':name,'rejected':True})
    for native in [False,True]:
        source={0:{'op':'coordinate','args':['x']},1:{'op':'coordinate','args':['y']},2:{'op':'coordinate','args':['hidden binder']},
            3:{'op':'rational','args':['1','1']},4:{'op':'rational','args':['0','1']},5:{'op':'coordinate','args':['s']}}
        defs={};body=2
        if native:
            source[6]={'op':'actual_monotone_root','args':[0,0,1]};body=6
            d={'variable':5,'parameters':[0,1],'body':2,'left':4,'right':3,'derivativeLower':3,'derivativeUpper':3}
            defs['monotone:0']={'key':'monotone:0','definition':d,'definitionSHA256':js_hash(d)}
        d={'parameters':[0,1],'body':body,'derivativeLimits':[1,1]}
        defs['expressionDefinitions:0']={'key':'expressionDefinitions:0','definition':d,'definitionSHA256':js_hash(d)}
        d={'parameters':[0,1],'directions':[0,1],'rows':[{'coefficient':3,'values':[0,1],'localSystem':-1,
            'localBody':body,'localParameters':[0,1],'guards':[],'derivativeMaps':[[{'parameter':0,'coefficient':3}],[{'parameter':1,'coefficient':3}]]}]}
        defs['fieldDefinitions:0']={'key':'fieldDefinitions:0','definition':d,'definitionSHA256':js_hash(d)}
        source[7]={'op':'m3_aux_indexed_partial','args':[0,[0,1],[0,0]]}
        calc=IterativeSourceCalculus(source,defs,max_work=10000);coords,unknown=calc.source_support(7)
        rejected=bool(unknown) and not calc.capture_audit(7)['pass']
        name='hidden native coefficient inside indexed localBody' if native else 'hidden indexed localBody capture'
        if not rejected:raise AssertionError('unsafe indexed capture mutation accepted: '+name)
        results.append({'mutation':name,'rejected':True})
    return results


def classify_row_audit(audit):
    """Preserve native sparse-block caches separately from actual chart rows."""
    rows=audit.get('rows',[])
    indexed=[r for r in rows if r['registryKey'].startswith(('m3GlobalFields:','fieldDefinitions:','definitions:1:'))]
    blocks=[r for r in rows if r['registryKey'].startswith('m3GlobalBlocks:')]
    other=[r for r in rows if r not in indexed and r not in blocks]
    return {'actualIndexedDefinitions':len({r['registryKey'] for r in indexed}),
        'actualIndexedFieldRows':len(indexed),'actualIndexedFieldRowsVerified':sum(r['verified'] for r in indexed),
        'allActualIndexedFieldRowsStructurallyVerified':bool(indexed) and all(r['verified'] for r in indexed) and not audit.get('resourceStop'),
        'nativePulseVariationalBlockDefinitions':len({r['registryKey'] for r in blocks}),'nativePulseVariationalBlockRows':len(blocks),
        'nativeBlocksAreNotIndexedChartRows':True,'nativePulseDomainCertificateInferred':False,
        'otherUnclassifiedRegistryRows':len(other),'wholeGlobalSourceImageProved':False,
        'classificationSource':'Pinned source-global-expressions.mjs: materializeGlobalPulseJet stores sparse variational rows in m3GlobalBlocks; actual indexed fields are m3GlobalFields/fieldDefinitions/definitions[1].'}


def run(context,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True);started=time.monotonic()
    path=Path(context.get('finish_matrix_path',context.get('guard_matrix_path',str(Path(context['repo'])/LATEST_MATRIX))))
    if file_sha(path)!=LATEST_SHA:raise SourceIntegrityError('latest original guard result source changed')
    current=read(path);g=current['dedicatedGuardResult']
    if current['originalParentNodesSHA256']!=PARENT or g['remainingGlobalGuards']!=42 or g['globallyClosedNewGuards']!=17:raise SourceIntegrityError('latest original guard frontier changed')
    target=[r for r in g['rows'] if r['proofStatus']=='ATTEMPT_STOP_RETAINED']
    if {r['originalGuard']['root'] for r in target}!={107,247} or len(target)!=2:raise SourceIntegrityError('exact two original recursion stops changed')
    constant_rows=[r for r in g['rows'] if r['id']=='N6-C-006-f4d82cf551c0' and not r['globallyProved']]
    if len(constant_rows)!=1:raise SourceIntegrityError('actual original constant guard changed')
    target+=constant_rows
    branch_rows=[r for r in g['rows'] if r['id'] in ['N6-C-015-59d0a4d89927','N6-C-026-8b4025a368b1'] and not r['globallyProved']]
    if len(branch_rows)!=2:raise SourceIntegrityError('original two guarded bump denominator obligations changed')
    target+=branch_rows
    checkpoint=read(find(context['baseline'],'cartesian-source-checkpoint.json'));program=checkpoint['cartesian']['scalarProgram']
    if sha(program)!=g['sourceBinding']['originalProgramSHA256']:raise SourceIntegrityError('original source scalar program changed')
    witnesses={w['sourceNode']:w['node'] for w in checkpoint['sourceWitnesses']}
    for w in checkpoint['sourceWitnesses']:
        if sha(w['node'])!=w['nodeSHA256']:raise SourceIntegrityError('original source node witness changed')
    defs={d['key']:d for d in checkpoint['definitionBindings']}
    for d in defs.values():
        if sha(d['definition'])!=d['definitionSHA256']:raise SourceIntegrityError('original registry changed')
    source=complete_source_store(witnesses,context);calc=IterativeSourceCalculus(source,defs,max_work=2000000,max_nodes=10000)
    seconds=max(1,min(300,float(context.get('guard_followup_seconds',300))))
    calc.deadline=time.monotonic()+seconds;rows=[]
    try:
        for prior in target:
            row={'id':prior['id'],'originalGuard':prior['originalGuard'],'priorFailure':prior.get('failure'),'globallyProved':False,'proofStatus':'OPEN',
                'proofMethod':'iterative exact source DAG support, complete registry/native capture and conservative complete-argument domain support'}
            try:
                if row['originalGuard']['kind']=='ACTUAL_OPAQUE_SUBSTITUTION':
                    row['evidence']=attempt(program,row['originalGuard'],calc)
                    if row['evidence']['globallyProved']:row.update(globallyProved=True,proofStatus='PROVED_EXACT_CAPTURE_AND_DOMAIN_SAFE_SUBSTITUTION')
                elif row['originalGuard']['kind']=='POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN':
                    row['evidence']=constant_four_minus_sqrt_two(program,row['originalGuard'])
                    row.update(globallyProved=True,proofStatus='PROVED_GLOBAL_SOURCE_EXACT_CONSTANT_POSITIVITY',proofMethod='exact rational square enclosure1<sqrt(2)<2')
                else:
                    row['evidence']=branch_dominance(program,row['originalGuard'])
                    if row['evidence']['globallyProved']:row.update(globallyProved=True,proofStatus='PROVED_EVERY_ORIGINAL_EVALUATION_BRANCH_DENOMINATOR_POSITIVE',proofMethod='whole original typed-DAG sink dominance and exact t*(1-t)>0 on every active evaluation path')
            except (RuntimeError,RecursionError,ValueError,KeyError,MemoryError) as error:
                row.update(proofStatus='ATTEMPT_STOP_RETAINED',failure={'type':type(error).__name__,'message':str(error)})
            rows.append(row);write(out/'guard-followup-progress.json',{'rows':rows});print(json.dumps(row),flush=True)
        result={'schema':'MathScope.N6.IterativeGuardRecursionFollowup/1','stage':'guard-followup','originalParentNodesSHA256':PARENT,
            'latestGuardMatrixSHA256':LATEST_SHA,'attemptedPriorRecursionStops':2,'attemptedExactConstantGuards':1,'attemptedWholeDAGBranchGuards':2,
            'newGloballyClosedGuards':sum(r['globallyProved'] for r in rows),
            'rows':rows,'previouslyGloballyProvedGuards':52,'remainingGlobalGuards':42-sum(r['globallyProved'] for r in rows),
            'iterativeSourceWork':calc.work,'maximumExplicitSourceStack':calc.maximum_explicit_stack,
            'sourceCaptureBudgetSeconds':seconds,'sourceIndexBudgetSeconds':360,'supplementalRowAuditBudgetSeconds':120,
            'wholeGlobalSourceImageProved':False,'commonFullFieldSupportProved':False,'N601Promoted':False,'N602Promoted':False,
            'negativeControls':negative_controls(),
            'sourceBinding':{'originalParentNodesSHA256':PARENT,'originalProgramSHA256':sha(program),
                'latestGuardMatrixSHA256':LATEST_SHA,'latestGuardMatrixCommit':'fa15fa645e1918e16cd7d7663e111a3d2052a3ea',
                'originalTargetGuardsSHA256':sha([r['originalGuard'] for r in target])},
            'remaining42InventoryByKind':dict(Counter(r['originalGuard']['kind'] for r in g['rows'] if not r['globallyProved']))}
        write(out/'guard-followup-result.json',result)
        try:
            audit=audit_all_chart_rows(source,context)
            failed=[{k:r[k] for k in ['registryKey','definitionSHA256','row','sourceRowSHA256','obstruction']} for r in audit['rows'] if not r['verified']]
            summary={k:v for k,v in audit.items() if k!='rows'};summary['actualFailedRows']=failed
            summary['actualRegistryKindClassification']=classify_row_audit(audit)
        except (RuntimeError,RecursionError,ValueError,KeyError,MemoryError) as error:
            summary={'executionStatus':'ATTEMPT_STOP_RETAINED','failure':{'type':type(error).__name__,'message':str(error)},'globalSourceImageProved':False}
        write(out/'actual-structural-obstructions.json',summary);result['actualStructuralAudit']=summary
        write(out/'additional-original-source-witnesses.json',source.evidence());result['elapsedSeconds']=time.monotonic()-started
        write(out/'guard-followup-result.json',result);return result
    finally:source.close()
