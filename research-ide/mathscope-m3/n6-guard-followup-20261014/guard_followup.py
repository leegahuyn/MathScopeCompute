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
from guard_solve import complete_source_store,audit_all_chart_rows,SourceIntegrityError
from guard_worker import PARENT,read,write,find,sha,file_sha

LATEST_MATRIX='research-ide/mathscope-m3/evidence/n6-finish-20261014/run-38523108728/OBLIGATION_MATRIX.json'
LATEST_SHA='22468ce11fef4384b12eeb640dd0ca43c23a6e6be3c96795642546f20f2a1480'


class IterativeSourceCalculus(SourceCalculus):
    """Same conservative rules and complete capture audits, explicit DAG stack."""
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs);self.maximum_explicit_stack=0

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
                        binding=self.defs.get(definition_key(n))
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
        'sourceExistenceProved':False,'wholeGlobalImageProved':False,'allNativeSystemCaptureAudits':list(calc.system_capture_cache.values())}


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
    return results


def run(context,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True);started=time.monotonic()
    path=Path(context.get('finish_matrix_path',context.get('guard_matrix_path',str(Path(context['repo'])/LATEST_MATRIX))))
    if file_sha(path)!=LATEST_SHA:raise SourceIntegrityError('latest original guard result source changed')
    current=read(path);g=current['dedicatedGuardResult']
    if current['originalParentNodesSHA256']!=PARENT or g['remainingGlobalGuards']!=42 or g['globallyClosedNewGuards']!=17:raise SourceIntegrityError('latest original guard frontier changed')
    target=[r for r in g['rows'] if r['proofStatus']=='ATTEMPT_STOP_RETAINED']
    if {r['originalGuard']['root'] for r in target}!={107,247} or len(target)!=2:raise SourceIntegrityError('exact two original recursion stops changed')
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
            row={'id':prior['id'],'originalGuard':prior['originalGuard'],'priorFailure':prior['failure'],'globallyProved':False,'proofStatus':'OPEN',
                'proofMethod':'iterative exact source DAG support, complete registry/native capture and conservative complete-argument domain support'}
            try:
                row['evidence']=attempt(program,row['originalGuard'],calc)
                if row['evidence']['globallyProved']:row.update(globallyProved=True,proofStatus='PROVED_EXACT_CAPTURE_AND_DOMAIN_SAFE_SUBSTITUTION')
            except (RuntimeError,RecursionError,ValueError,KeyError,MemoryError) as error:
                row.update(proofStatus='ATTEMPT_STOP_RETAINED',failure={'type':type(error).__name__,'message':str(error)})
            rows.append(row);write(out/'guard-followup-progress.json',{'rows':rows});print(json.dumps(row),flush=True)
        result={'schema':'MathScope.N6.IterativeGuardRecursionFollowup/1','stage':'guard-followup','originalParentNodesSHA256':PARENT,
            'latestGuardMatrixSHA256':LATEST_SHA,'attemptedPriorRecursionStops':len(rows),'newGloballyClosedGuards':sum(r['globallyProved'] for r in rows),
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
        except (RuntimeError,RecursionError,ValueError,KeyError,MemoryError) as error:
            summary={'executionStatus':'ATTEMPT_STOP_RETAINED','failure':{'type':type(error).__name__,'message':str(error)},'globalSourceImageProved':False}
        write(out/'actual-structural-obstructions.json',summary);result['actualStructuralAudit']=summary
        write(out/'additional-original-source-witnesses.json',source.evidence());result['elapsedSeconds']=time.monotonic()-started
        write(out/'guard-followup-result.json',result);return result
    finally:source.close()
