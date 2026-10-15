"""Explicit native-body dependency paths from original N6 rows to Picard0.

This is a syntactic source-binding extractor, NOT an analytic domain proof.
Only reviewed AST fields are edges. Metadata integer scanning is forbidden.
All lazy branches are retained and labelled; their activity is not inferred.
"""
from __future__ import annotations
import argparse, hashlib, importlib.util, json
from collections import Counter, defaultdict, deque
from pathlib import Path
from native_domain_extract import (NATIVE, argument_children, native_definition, require, sha, STAGE3_PIN, G_ROOT,
                                  nearest_contexts, argument_graph)
from shared_structure_frontier import INPUT_PINS, exact_row_inventory

PICARD_PIN='c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60'
FIXED_PIN='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'

def semantic_roots(key,d):
    """Return exact reviewed value and contract AST roots, never metadata IDs.

    contract roots (brackets, norms, guards) are distinguished from value
    roots, so a norm bound is not mistaken for a value-dependency proof.
    Fixed natural recurrences are a terminal separately proved native kernel.
    """
    out=[]
    def emit(path,value,role='value'):
        require(type(value) is int and value>=0,'Non-node at '+key+'.'+path)
        out.append((path,value,role))
    def matrix(path,value,role='value'):
        require(isinstance(value,list),'Missing matrix '+path)
        for i,row in enumerate(value):
            require(isinstance(row,list),'Missing matrix row '+path)
            for j,v in enumerate(row):emit(f'{path}[{i}][{j}]',v,role)
    def keys(allowed):
        require(set(d)<=set(allowed),'Unreviewed registry fields '+key+': '+str(sorted(set(d)-set(allowed))))
    if key=='fixed':
        require(sha(d)==FIXED_PIN,'Changed terminal original natural kernel')
        return out
    if key.startswith(('expression:','expressionDefinitions:','definitions:0:','definitions:4:')):
        keys(['name','id','parameters','body','derivativeLimits','sourceAuthenticated','actualDefiningBodyRetained',
              'sourceRecipe','requiredSourcePremises','directions','directionParameterIndices','derivativeRule',
              'implementation','unspecifiedOracle','historicalBodyPreserved'])
        require(d.get('unspecifiedOracle') is not True,'Unspecified expression oracle')
        emit('body',d['body'])
    elif key.startswith(('fieldDefinitions:','m3GlobalFields:','definitions:1:')):
        keys(['name','id','parameters','directions','directionParameterIndices','rows','sourceAuthenticated',
              'sourceRecipe','requiredSourcePremises','analyticPremises','derivativeRule','constantChartFactorsChecked',
              'paperClassBoundVerified'])
        require(isinstance(d['rows'],list) and d['rows'],'Missing indexed source rows')
        for i,r in enumerate(d['rows']):
            allowed={'localBody','localParameters','localSystem','values','coefficient','guards','label',
                     'derivativeMaps','derivativeScales','localDirectionIndices'}
            require(set(r)<=allowed,'Unreviewed indexed row field '+key)
            emit(f'rows[{i}].localBody',r['localBody'])
            emit(f'rows[{i}].coefficient',r['coefficient'])
            for j,v in enumerate(r['values']):emit(f'rows[{i}].values[{j}]',v)
            for j,g in enumerate(r['guards']):
                require(len(g)==3,'Changed original guard triple')
                for k,v in enumerate(g):emit(f'rows[{i}].guards[{j}][{k}]',v,'lazy-domain')
            for j,v in enumerate(r.get('derivativeScales',[])):emit(f'rows[{i}].derivativeScales[{j}]',v,'derivative-contract')
            for j,mm in enumerate(r.get('derivativeMaps',[])):
                for k,m in enumerate(mm):
                    require(set(m)=={'coefficient','parameter'} and type(m['parameter']) is int,'Changed derivative map schema')
                    emit(f'rows[{i}].derivativeMaps[{j}][{k}].coefficient',m['coefficient'],'derivative-contract')
    elif key.startswith(('inverseDefinitions:','definitions:2:')):
        keys(['name','id','parameters','directions','directionParameterIndices','body','Y','operator','definition',
              'coefficientProducer','partialSumProducer','tailProducer','zeroMode','finiteSumDeclaredEqualToLimit',
              'sourceAuthenticated','requiredSourcePremises','sourceRecipe'])
        emit('body',d['body'])
    elif key.startswith('picard:'):
        keys(['name','order','xi','eta','diagonal','A0','A1','forcing','zeroAxisDatum','unknowns','radialDomain',
              'sourceLeading','tail','solutionNorm','actualSourceInputs','sourceEquations','leadingReferenceSubstitution',
              'callerSuppliedForcing'])
        matrix('A0',d['A0']);matrix('A1',d['A1'])
        for j,v in enumerate(d['forcing']):emit(f'forcing[{j}]',v)
        for j,v in enumerate(d['zeroAxisDatum']):emit(f'zeroAxisDatum[{j}]',v)
        for j,v in enumerate(d['radialDomain']):emit(f'radialDomain[{j}]',v,'domain')
        require(set(d['sourceLeading'])=={'F0','U0','v0','omega0OverX'},'Unreviewed Picard source-leading schema')
        for n,v in d['sourceLeading'].items():emit('sourceLeading.'+n,v,'coefficient-provenance')
        # etaOrder/order/diagonal/parameters are integers, not AST references.
        tail=d['tail'];fields={'sourceBound','sourceStrip','solutionStrip','loss','Kcondition','Kprecision','K','etaOrder','error','target',
            'sourceMajorant','proof','sourceTruncationIndexNumericallyMaterialized','tailIsForTheCertifiedIndexNotForDisplayedTerms'}
        require(set(tail)<=fields,'Unreviewed Picard tail schema')
        for n in ['sourceBound','sourceStrip','solutionStrip','loss','Kcondition','Kprecision','K','error','target']:
            emit('tail.'+n,tail[n],'quantitative-contract')
        for n in ['commonCollar','naturalExtensionToY5']:emit('solutionNorm.'+n,d['solutionNorm'][n],'quantitative-contract')
    elif key.startswith('monotone:'):
        keys(['name','parameters','variable','body','left','right','derivativeLower','derivativeUpper','source','endpointSigns',
              'rootBranch','bodyContainsActualSource','removableQuotientAtP2ZeroPreserved','endpointProof','numericOracle'])
        emit('body',d['body'])
        for n in ['left','right','derivativeLower','derivativeUpper']:emit(n,d[n],'root-domain-contract')
    elif key.startswith('quadratic:'):
        keys(['name','linear','quadraticDiagonal','rhs','scale','preconditioner','rootRadius','lipschitzUpper','proof',
              'actualOperandSource','valueRefinementImplementation','implicitDerivativeImplementation',
              'continuousMatrixReplacedByPreconditioner','preconditionerIsExactContinuousInverse','secondDebtRowLambdaMinusTwoRetained',
              'implicitDerivativeRule'])
        matrix('linear',d['linear']);matrix('quadraticDiagonal',d['quadraticDiagonal']);emit('scale',d['scale'])
        for j,v in enumerate(d['rhs']):emit(f'rhs[{j}]',v)
        matrix('preconditioner',d['preconditioner'],'root-domain-contract')
        for n in ['rootRadius','lipschitzUpper']:emit(n,d[n],'root-domain-contract')
    elif key.startswith(('covariance:','m3GlobalPulses:')):
        keys(['covariance','parameters','directions','directionParameterIndices','variable','matrix','initial','left','length',
              'equation','exactSolution','originalDefinition','sourceAuthenticated','matrixDerivativesSuppliedByCaller'])
        matrix('matrix',d['matrix']);emit('length',d['length'],'domain')
        original=json.loads(d['originalDefinition'])
        require(original['matrix']==d['matrix'] and original['length']==d['length'] and original['initial']==d['initial'],
                'Changed covariance original-definition body')
        if 'normUpper' in original:emit('originalDefinition.normUpper',original['normUpper'],'quantitative-contract')
    else:raise ValueError('Unreviewed native registry schema '+key)
    return out

def node_edges(i,n,reg):
    op,args=n['op'],n['args'];out=[]
    for j,v in enumerate(argument_children(n)):out.append(('n:'+str(v),f'operand[{j}]','value'))
    if op in NATIVE:
        key,d=native_definition(n,reg);out.append(('d:'+key,'actual-native-definition','value'))
    return out

def extract(get,reg,seeds,*,max_nodes=1000000):
    graph={};nodes={};defs={};domains=[];calls={};todo=deque('n:'+str(i) for i in seeds)
    while todo:
        v=todo.popleft()
        if v in graph:continue
        require(len(graph)<max_nodes,'Semantic graph budget exceeded; truncation forbidden')
        if v.startswith('n:'):
            i=int(v[2:]);n=get(i);nodes[i]=n;edges=node_edges(i,n,reg)
            if n['op'] in NATIVE:
                key,d=native_definition(n,reg);defs[key]=d
                calls[i]={'registry':key,'sourceNode':n,'sourceNodeSHA256':sha(n)}
            if n['op'] in {'inverse','sqrt_positive','log_positive'} or (n['op']=='integer_power' and n['args'][1]<0):
                domains.append({'node':i,'operation':n['op'],'argument':n['args'][0],'applicationProvedHere':False})
        else:
            key=v[2:];require(key in defs,'Unresolved native body vertex')
            edges=[('n:'+str(i),p,role) for p,i,role in semantic_roots(key,defs[key])]
        graph[v]=edges;todo.extend(w for w,_,_ in edges)
    # A reverse breadth-first traversal yields a shortest explicit witness for
    # every seed that reaches the SAME original picard:0 definition.
    def back(value_only):
        reverse=defaultdict(list)
        for v,ee in graph.items():
            for w,label,role in ee:
                if not value_only or role=='value':reverse[w].append((v,label,role))
        target='d:picard:0';ns={target:None};q=deque([target])
        while q:
            w=q.popleft()
            for v,label,role in reverse[w]:
                if v not in ns:ns[v]=(w,label,role);q.append(v)
        return ns
    maps={False:back(False),True:back(True)}
    def path(seed,value_only=False):
        v=seed if isinstance(seed,str) else 'n:'+str(seed);next_step=maps[value_only]
        if v not in next_step:return None
        result=[]
        while next_step[v] is not None:
            w,label,role=next_step[v];result.append({'from':v,'to':w,'field':label,'role':role});v=w
        return result
    return graph,nodes,defs,calls,domains,path

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for k in ['source-db','stage3','header','compact','guards','jets','pde','numeric','out']:p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args();digest=lambda pp:hashlib.sha256(pp.read_bytes()).hexdigest()
    require(digest(a.stage3)==STAGE3_PIN,'Changed authenticated reader')
    spec=importlib.util.spec_from_file_location('picard_consumer_original_v3',a.stage3);v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
    from header_binding import bind_header_to_gzip
    header,binding=bind_header_to_gzip(a.header.parent/'original-parent.ndjson.gz',a.header)
    reg=v3.registries(header);get=v3.Source(a.source_db)
    require(sha(reg['picard'][0])==PICARD_PIN,'Changed original Picard0')
    c=json.loads(a.compact.read_text(encoding='utf8'))
    require(c['sourceHeaderSHA256']==binding['sourceHeaderRecordSHA256'],'Different compact source header')
    require(c['definitions']['picard:0']['fullDefinition']==reg['picard'][0],'Different original full Picard0')
    data={k:json.loads(getattr(a,k).read_text(encoding='utf8')) for k in INPUT_PINS}
    require(all(digest(getattr(a,k))==pin for k,pin in INPUT_PINS.items()),'Changed original obligation rows')
    gr,jr,pr=exact_row_inventory(data['guards'],data['jets'],data['pde'])
    rows=[]
    for r in gr:rows.append({'id':r['id'],'family':'Guard','roots':[G_ROOT]})
    for r in jr:
        n=get(r['sourceNode']);require(sha(n)==r['sourceCallSHA256'],'Changed original jet source call')
        key,d=native_definition(n,reg);require(sha(d)==r['definitionSHA256'],'Changed original jet registry')
        rows.append({'id':r['id'],'family':'CartesianJet','roots':[r['sourceNode']]})
    for r in pr:rows.append({'id':r['id'],'family':'PDE','roots':[i for i,_ in r['sourceFactors']],
                            'sourceFactors':r['sourceFactors'],'sourceTermSHA256':r['sourceTermSHA256']})
    numeric=json.loads(a.numeric.read_text(encoding='utf8'))
    require(numeric.get('schema')=='MathScope.N6.ActualPicardOriginalNumericMajorant/1' and
            numeric.get('actualSourceAndAnalyticInputsComposed') is True and numeric.get('numericC1KCertifiedTailBoundsProvedHere') is True,
            'No fully source-composed original numeric Picard0 theorem')
    graph,nodes,defs,calls,domains,path=extract(get,reg,{i for r in rows for i in r['roots']})
    paths={};hits=Counter()
    for r in rows:
        candidates=[]
        for i in r['roots']:
            pp=path(i,True)
            if pp is not None:candidates.append((0,len(pp),i,pp))
            elif (pp:=path(i)) is not None:candidates.append((1,len(pp),i,pp))
        if candidates:
            contract,_,seed,pp=min(candidates,key=lambda t:t[:3]);signature=sha(pp);paths[signature]=pp
            r.update({'picard0Path':signature,'picard0ValueBodyPath':not bool(contract),
                      'witnessSourceRoot':seed,'actualPathDomainsProvedHere':False});hits[r['family']]+=1
        else:r['picard0Path']=None
    definitions={k:{'definitionSHA256':sha(d),'name':d.get('name'),'parameters':d.get('parameters'),
                    'semanticASTRoots':[{'field':f,'node':i,'role':role} for f,i,role in semantic_roots(k,d)],
                    'actualCallerDomainAndNativeContractProvedHere':False,
                    'sourceStatedPremises':d.get('requiredSourcePremises',d.get('analyticPremises',[])),
                    **({n:d[n] for n in ['body','Y','operator','zeroMode','finiteSumDeclaredEqualToLimit'] if n in d})}
                 for k,d in sorted(defs.items())}
    definition_paths={}
    for key in defs:
        pp=path('d:'+key,True);value_path=pp is not None
        if pp is None:pp=path('d:'+key)
        if pp is not None:
            signature=sha(pp);paths[signature]=pp
            definition_paths[key]={'picard0Path':signature,'valueBodyPath':value_path,'applicationDomainProvedHere':False}
    contexts={}
    for i,call in sorted(calls.items()):
        key=call['registry']
        if key not in contexts:contexts[key]={'sourceCallID':i,**call,'argumentTransportProvedHere':False}
    ordinary_parents=defaultdict(set)
    for i,n in nodes.items():
        for j in argument_children(n):ordinary_parents[j].add(i)
    picard_calls=[];argument_roots=set();surface_ids=set()
    for i,call in sorted(calls.items()):
        if call['registry']!='picard:0':continue
        n=call['sourceNode'];aa=n['args'];argument_roots.update(aa[2:4])
        cc=nearest_contexts(get,ordinary_parents,i)
        for context in cc:surface_ids.add(context['surface'])
        picard_calls.append({'sourceCallID':i,**call,'radialArgument':aa[2],'etaArgument':aa[3],
          'nearestSyntacticContexts':cc,'actualArgumentDomainProvedHere':False,
          'directDefinitionRootContexts':[{'registry':key,'field':f,'role':role}
            for key,d in defs.items() for f,j,role in semantic_roots(key,d) if j==i]})
    argument_nodes,argument_native,argument_domains=argument_graph(get,reg,argument_roots,max_nodes=100000)
    # Keep actual nontrivial operations along each path, not the whole large DAG.
    witness_ids={int(e[v][2:]) for pp in paths.values() for e in pp for v in ['from','to'] if e[v].startswith('n:')}
    witnesses={str(i):{'node':nodes[i],'sourceNodeSHA256':sha(nodes[i])} for i in sorted(witness_ids)}
    result={'schema':'MathScope.N6.ActualPicardConsumerGraph/1','sourceHeaderBinding':binding,
      'inputSHA256':{k:digest(getattr(a,k.replace('-','_'))) for k in ['stage3','compact','guards','jets','pde','numeric']},
      'actualPicard0SHA256':PICARD_PIN,'semanticEdgesUseReviewedASTFieldsOnly':True,
      'metadataIntegersScannedAsNodeDependencies':False,'allOriginalRowsRetainedExactlyOnce':len(rows)==1260,
      'sourceNodeCount':len(nodes),'sourceNodeContentSHA256':sha([[i,nodes[i]] for i in sorted(nodes)]),
      'nativeDefinitions':definitions,'originalRows':rows,'picard0ShortestWitnessPaths':paths,
      'nativeDefinitionPicard0Paths':definition_paths,'selectedActualNativeCallContexts':contexts,
      'actualPicard0CallContexts':picard_calls,
      'picard0ArgumentAST':{str(i):n for i,n in sorted(argument_nodes.items())},
      'picard0NearestContextSourceNodes':{str(i):get(i) for i in sorted(surface_ids)},
      'picard0ArgumentNativeBoundaries':argument_native,'picard0ArgumentPrimitiveContracts':argument_domains,
      'completeGrActualDefinition':{'key':'expressionDefinitions:21','definition':reg['expressionDefinitions'][21],
          'sameOriginalBody':reg['expressionDefinitions'][21]['body']==G_ROOT,'actualDomainProvedHere':False},
      'witnessActualSourceNodes':witnesses,'syntacticPicard0ReachByOriginalFamily':dict(hits),
      'primitiveDomainInventory':domains,'allPathCallsAndArgumentSubstitutionsDomainProved':False,
      'ordinaryIntegralContracts':[{'sourceNode':i,'integrand':n['args'][0],'binder':n['args'][1],
          'left':n['args'][2],'right':n['args'][3],'commonCompactDomainAndLeibnizProvedHere':False}
          for i,n in sorted(nodes.items()) if n['op']=='definite_integral'],
      'lazyBranchActivityProved':False,'unconditionalNumericReuseForOtherPicards':False,
      'wholeGOnJProved':False,'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0,
      'remainingContracts':['Transport each actual native argument tuple into its certified domain and retain every lazy guard.',
       'For Picard0 use the same common collar, sourceStrip delta/4 and solutionStrip delta/8; no complex X premise.',
       'For other Picards prove their own lower-order forcing, source norms, nilpotent mask and common eta loss.',
       'For inverses prove actual denominators/implicit Jacobians nonzero uniformly on the active compact domain.',
       'For Fourier use the same smooth periodic complete source, exact nonzero divisors, Haar projection and all omitted modes.',
       'For PDE retain full coefficients/factors, ordered derivative identities, boundary terms and force before recombination.']}
    a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
    print(json.dumps({'sourceNodes':len(nodes),'nativeDefinitions':len(defs),'rows':len(rows),'picardReach':dict(hits),
                      'domainProof':False,'newDischarged':0}))

if __name__=='__main__':main()
