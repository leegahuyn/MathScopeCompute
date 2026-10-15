#!/usr/bin/env python3
"""Compact READ-ONLY extraction from the authenticated original cloud replay.

No source is constructed or modified; no obligation is discharged here.
Source-cache.sqlite must be the cache freshly authenticated by Stage 3.
The graph excerpt is explicitly bounded and is not a regularity certificate.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict, deque
import hashlib
import importlib.util
import json
from pathlib import Path

def read(p): return json.loads(Path(p).read_text(encoding='utf-8'))
def canonical(o): return json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()
def sha(o): return hashlib.sha256(canonical(o)).hexdigest()
def load(p,name):
    spec=importlib.util.spec_from_file_location(name,p)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def registry_key(n):
    op=n['op'];a=n['args']
    if op=='actual_expression_partial': return 'expression:'+str(a[0])
    if op=='m3_aux_expression_partial': return 'expressionDefinitions:'+str(-1-a[0])
    if op=='m3_aux_indexed_partial': return 'fieldDefinitions:'+str(a[0])
    if op=='m3_aux_inverse_partial': return 'inverseDefinitions:'+str(a[0])
    if op=='m3_global_indexed_partial': return 'm3GlobalFields:'+str(a[0])
    if op=='actual_monotone_root': return 'monotone:'+str(a[0])
    if op=='actual_quadratic_root': return 'quadratic:'+str(a[0])
    if op=='actual_natural_series': return 'fixed'
    if op in ('actual_background_even_profile','actual_background_picard'): return 'picard:'+str(a[0])
    if op=='m3_global_pulse_jet': return 'm3GlobalPulses:'+str(a[0])
    groups={'m3_coupled_expression_partial':0,'m3_coupled_indexed_partial':1,'m3_coupled_inverse_partial':2,'m3_forced_expression_partial':4}
    if op in groups: return f'definitions:{groups[op]}:'+str(int(a[0].split(':')[-1]))
    if op=='m3_forced_pulse_partial':return 'definitions:3:'+str(a[0])
    return None

def definition(reg,key):
    if key=='fixed':return reg['fixed']
    bits=key.split(':')
    if bits[0]=='definitions': return reg['definitions'][int(bits[1])][int(bits[2])]
    if bits[0]=='covariance':
        values=[d for d in reg['m3GlobalPulses'] if d['covariance']==int(bits[1])]
        assert len(values)==1
        return values[0]
    return reg[bits[0]][int(bits[1])]

def children(n):
    op=n['op'];a=n['args']
    if op in ('rational','coordinate','source_parameter'):return []
    if op in ('inverse','sqrt_positive','log_positive','exp','sine','cosine','integer_power','source_step_derivative','ceiling'):return a[:1]
    if op in ('add','multiply','maximum','smooth_piecewise','definite_integral'):return a
    # Native call graph arguments only. Native defining bodies are listed
    # independently in the registry inventory, never declared differentiated.
    if op in ('actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial','m3_global_indexed_partial',
              'm3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial','m3_forced_expression_partial'):
        return a[1]
    return []

def compact_definition(d):
    """Keep all small definitions and every indexed row's actual operands."""
    if len(canonical(d))<=120000:return {'fullDefinition':d}
    row_keys=('localSystem','localBody','localParameters','values','coefficient','derivativeMaps','guards','label')
    result={'keys':list(d),'fullDefinitionBytes':len(canonical(d)),
            'summaryIsNotFullDefinition':True}
    for k in ('id','name','body','parameters','directions','directionParameterIndices','derivativeLimits','variable','initial','domain',
              'operator','zeroMode','definition','requiredSourcePremises','sourceRecipe','derivativeRule','sourceAuthenticated'):
        if k in d:result[k]=d[k]
    if isinstance(d.get('rows'),list):
        result['rows']=[{k:r[k] for k in row_keys if k in r} for r in d['rows']]
    return result

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--source-db',type=Path,required=True);p.add_argument('--header',type=Path,required=True)
    p.add_argument('--stage3',type=Path,required=True);p.add_argument('--continuation-module',type=Path,required=True)
    p.add_argument('--jets',type=Path,required=True);p.add_argument('--pde',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True);p.add_argument('--max-graph-nodes',type=int,default=4500)
    a=p.parse_args();v3=load(a.stage3,'original_stage3_extract');continuation=load(a.continuation_module,'original_continuation_extract')
    from header_binding import bind_header_to_gzip
    head,binding=bind_header_to_gzip(a.header.parent/'original-parent.ndjson.gz',a.header)
    g=v3.Source(a.source_db);reg=v3.registries(head);jets=read(a.jets);pde=read(a.pde)
    assert len(jets['rows'])==230 and len(pde['components'])==3
    selected=set();calls={};families=defaultdict(list)
    for row in jets['rows']:
        ident=row['sourceNode'];n=g(ident);assert sha(n)==row['sourceCallSHA256']
        key=registry_key(n);assert key;d=definition(reg,key);assert sha(d)==row['definitionSHA256']
        selected.add(key);calls[str(ident)]={'node':n,'definitionKey':key,'definitionName':d.get('name'),'sha256':sha(n)}
        families[key].append({'id':row['id'],'sourceNode':ident,'orderedSourceCoordinates':row['orderedSourceCoordinates'],
                              'classification':row['classification'],'conditionalTarget':row['conditionalTarget']})
    pde_summary=[]
    for component in pde['components']:
        for key in component['sourceRegistryOccurrences']:selected.add(key)
        for operand in component['coupledResidualOperands']:
            ident=operand['source'];n=g(ident);key=registry_key(n);selected.add(key)
            d=definition(reg,key);calls[str(ident)]={'node':n,'definitionKey':key,'definitionName':d.get('name'),'sha256':sha(n)}
        pde_summary.append({k:v for k,v in component.items() if k!='rows'})
    # Read the actual complete_gr root conservatively through every source
    # defining registry. integer_superset deliberately overreads metadata;
    # its output is an overapproximation, not a minimal dependency graph.
    complete_gr=definition(reg,'expressionDefinitions:21')
    capture=continuation.CaptureAudit(g,reg).run(complete_gr['body'],set())
    selected.update(x['key'] for x in capture['registryDefinitions'])
    definitions={key:{'sha256':sha(definition(reg,key)),**compact_definition(definition(reg,key))} for key in sorted(selected)}
    roots=set(int(x) for x in calls)
    # Prioritize every selected body and local body before breadth expansion.
    for key in sorted(selected):
        d=definition(reg,key)
        if isinstance(d.get('body'),int):roots.add(d['body'])
        for row in d.get('rows',[]):
            if isinstance(row.get('localBody'),int):roots.add(row['localBody'])
    todo=deque((x,0) for x in sorted(roots));nodes={};frontier=set();ops=Counter();native=defaultdict(set)
    while todo and len(nodes)<a.max_graph_nodes:
        ident,depth=todo.popleft()
        if str(ident) in nodes:continue
        n=g(ident);nodes[str(ident)]=n;ops[n['op']]+=1
        key=registry_key(n)
        if key:native[key].add(ident)
        for child in children(n):
            if type(child) is int and child>=0 and str(child) not in nodes:
                if depth<12:todo.append((child,depth+1))
                else:frontier.add(child)
    frontier.update(ident for ident,_ in todo if str(ident) not in nodes)
    result={'schema':'MathScope.N6.CompactJetPDEOriginalDefinitionExtract/1','newDischarged':0,
       'readOnly':True,'headerBinding':binding,'stage3ModuleSHA256':hashlib.sha256(a.stage3.read_bytes()).hexdigest(),
       'sourceHeaderSHA256':hashlib.sha256(a.header.read_bytes()).hexdigest(),
       'jetCounts':jets['counts'],'families':dict(families),'sourceCalls':calls,'definitions':definitions,
       'completeGr':{'key':'expressionDefinitions:21','definition':complete_gr,'captureAudit':capture},
       'pdeComponents':pde_summary,'sourceGraphExcerpt':nodes,'sourceGraphExcerptOperationCounts':dict(ops),
       'sourceGraphExcerptNativeCalls':{k:sorted(v) for k,v in native.items()},
       'excerptFrontier':sorted(frontier),'excerptComplete':False,
       'excerptScope':'BREADTH-BOUNDED diagnostic only; omitted graph nodes, scalar domains, regularity and every actual derivative still require proof.',
       'sourceAuthScope':'Read from the fresh Stage3 authenticated cache; this script does not independently reauthenticate the full gzip stream.'}
    a.out.parent.mkdir(parents=True,exist_ok=True)
    raw=json.dumps(result,ensure_ascii=False,indent=2)+'\n';a.out.write_text(raw,encoding='utf-8')
    print(json.dumps({'output':str(a.out),'bytes':len(raw.encode()),'selectedDefinitions':len(definitions),
                      'sourceNodes':len(nodes),'completeGrClosureNodes':capture['sourceNodes'],'newDischarged':0}))
if __name__=='__main__':main()
