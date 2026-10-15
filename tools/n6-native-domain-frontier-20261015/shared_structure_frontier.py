"""Exact native-boundary incidence for all 1,260 original OPEN obligations.

This is a shared-proof dependency calculation, not a replacement proof.
Every original row ID and PDE coefficient/factor is preserved. The fresh
authenticated cache resolves the compact excerpt's missing nodes.
"""
from __future__ import annotations
import argparse,hashlib,importlib.util,json,sys
from collections import Counter,defaultdict
from pathlib import Path
from native_domain_extract import (argument_children,native_definition,NATIVE,
                                  STAGE3_PIN,G_ROOT,require,sha)

INPUT_PINS={
 'guards':'256586450864d4c78dc5707c8eed66bb39e633b0db5105ced4694c98b9921619',
 'jets':'588bdb40f5bd86f8b972e47075822f2452e4155487623d4ff97bdb742b7c7f56',
 'pde':'53beabf2fef91f0f119a84b8c515650dd4e8bb87a0d338ebaedd678025149441'}

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def exact_row_inventory(guards,jets,pde):
    gr=[r for r in guards['rows'] if r['status']=='OPEN']
    jr=jets['rows'];pr=[r for c in pde['components'] for r in c['rows']]
    require((len(gr),len(jr),len(pr))==(10,230,1020),'Original1260 row inventory changed')
    allids=[r['id'] for rs in (gr,jr,pr) for r in rs]
    require(len(set(allids))==1260,'Dropped or duplicated original row')
    require(all(r['status']=='OPEN' for r in jr+pr),'Historical input row status changed')
    require({r['originalGuard']['body'] for r in gr}=={248},'Different original pressure family')
    return gr,jr,pr

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for k in ('source-db','stage3','header','compact','guards','jets','pde','out'):
        p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args()
    require(digest(a.stage3)==STAGE3_PIN,'Changed original Stage3')
    spec=importlib.util.spec_from_file_location('shared_frontier_original_v3',a.stage3)
    v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
    from header_binding import bind_header_to_gzip
    header,binding=bind_header_to_gzip(a.header.parent/'original-parent.ndjson.gz',a.header)
    reg=v3.registries(header);get=v3.Source(a.source_db)
    C=json.loads(a.compact.read_text(encoding='utf8'))
    require(C['sourceHeaderSHA256']==binding['sourceHeaderRecordSHA256'],'Same authenticated original header')
    data={k:json.loads(getattr(a,k).read_text(encoding='utf8')) for k in INPUT_PINS}
    require(all(digest(getattr(a,k))==v for k,v in INPUT_PINS.items()),'Changed original row/provenance inputs')
    gr,jr,pr=exact_row_inventory(data['guards'],data['jets'],data['pde'])
    definitions={};native_calls={};nodes={};cache={};active=set();key_bits={}
    sys.setrecursionlimit(10000)
    def frontier(i):
        if i in cache:return cache[i]
        require(type(i) is int and i>=0 and i not in active,'Invalid/cyclic actual source DAG')
        require(len(nodes)<500000,'Shared frontier node budget exceeded; truncation forbidden')
        n=get(i);nodes[i]=n;active.add(i);mask=0
        if n['op'] in NATIVE:
            key,d=native_definition(n,reg)
            if key not in key_bits:key_bits[key]=1<<len(key_bits)
            mask|=key_bits[key]
            record={'definitionSHA256':sha(d),'name':d.get('name'),'parameters':d.get('parameters'),
                    'body':d.get('body'),'nativeOperation':n['op']}
            if key in definitions:require(definitions[key]['definitionSHA256']==record['definitionSHA256'],'Changed native definition')
            else:definitions[key]=record
            native_calls[i]={'nodeSHA256':sha(n),'definitionKey':key,'node':n}
        for j in argument_children(n):mask|=frontier(j)
        active.remove(i);cache[i]=mask;return mask
    def keys(mask):return sorted(k for k,b in key_bits.items() if b&mask)
    rows=[];guard_mask=frontier(G_ROOT)
    for r in gr:
        rows.append({'id':r['id'],'family':'Guard','sourceGuard':r['originalGuard'],
                     'sourceRoots':[G_ROOT],'mask':guard_mask,
                     'commonAnalyticStep':'Actual joint C1 in Z,Y0,Y1 on the original full J; compactness and moving-endpoint Leibniz.'})
    for r in jr:
        target=r['conditionalTarget'];key=target['registry']
        require(key in C['definitions'],'Missing actual original jet definition')
        call=get(r['sourceNode'])
        require(sha(call)==r['sourceCallSHA256'],'Changed original jet source call')
        mask=frontier(r['sourceNode'])
        rows.append({'id':r['id'],'family':'CartesianJet','sourceRoots':[r['sourceNode']],
                     'registeredTarget':target,'orderedSourceCoordinates':r['orderedSourceCoordinates'],
                     'sourceCallSHA256':r['sourceCallSHA256'],'mask':mask,
                     'commonAnalyticStep':'Actual smooth native body and source AD/chain-rule compatibility on the unchanged admitted domain.'})
    for r in pr:
        mask=0
        for i,exponent in r['sourceFactors']:
            require(type(exponent) is int and exponent!=0,'Changed original factor exponent')
            mask|=frontier(i)
        rows.append({'id':r['id'],'family':'PDE','sourceRoots':[i for i,_ in r['sourceFactors']],
                     'coefficient':r['coefficient'],'sourceFactors':r['sourceFactors'],
                     'sourceTermSHA256':r['sourceTermSHA256'],'mask':mask,
                     'commonAnalyticStep':'Same actual full field, ordered derivatives and coupled residual assembly; cancellation is of the complete component sum.'})
    require(len(rows)==1260 and len({r['id'] for r in rows})==1260,'Incomplete output coverage')
    # Numerical dictionary keys are canonicalized only after all native bits
    # have been discovered; source integer payloads never become node IDs.
    groups=defaultdict(list);reach=defaultdict(Counter)
    for row in rows:
        mask=row.pop('mask');kk=keys(mask);row['directNativeBoundaryKeys']=kk
        signature=sha(kk);groups[(row['family'],signature)].append(row['id'])
        for key in kk:reach[key][row['family']]+=1
    coverage=[{'definitionKey':k,'rowCounts':dict(v),'totalAffected':sum(v.values())} for k,v in reach.items()]
    coverage.sort(key=lambda r:(-r['totalAffected'],r['definitionKey']))
    jet_groups=Counter(r['registeredTarget']['registry'] for r in rows if r['family']=='CartesianJet')
    result={
      'schema':'MathScope.N6.SharedSourceStructureFrontier/1','sourceHeaderBinding':binding,
      'stage3ModuleSHA256':STAGE3_PIN,'inputSHA256':{k:digest(getattr(a,k)) for k in ('compact',*INPUT_PINS)},
      'originalRowCounts':{'Guard':10,'CartesianJet':230,'PDE':1020,'total':1260},
      'everyOriginalRowRetainedExactlyOnce':True,'pdeCoefficientsAndSourceFactorsRetained':True,
      'sourceNodesRead':len(nodes),'sourceNodeIdSetSHA256':sha(sorted(nodes)),
      'readNodeContentSHA256':sha([[i,nodes[i]] for i in sorted(nodes)]),
      'directNativeDefinitions':definitions,'actualNativeBoundaryCalls':native_calls,
      'jetRegisteredFamilies':dict(sorted(jet_groups.items())),
      'nativeBoundaryReachByOriginalRow':coverage,
      'sharedSignatureGroups':[{'family':family,'nativeBoundarySetSHA256':signature,'rowIDs':ids,'count':len(ids)} for (family,signature),ids in sorted(groups.items())],
      'originalObligationRows':rows,
      'commonProofStructure':{
        'candidate':'Interpret the same source DAG by genuine smooth functions; prove every native contract and guarded domain; show evaluation commutes with the actual ordered differential/integral operators and flat assembly.',
        'sourceQuantifiersRetained':True,
        'sufficientIngredients':['Actual whole-domain primitive and parameter regularity, including H determinant/positive amplitudes.',
          'Lazy active-domain and frozen-label transport with all original flat joins.',
          'Genuine native derivative, Haar/Fourier/integral semantics and original full residual normalization.'],
        'structuralCoverageEqualsProof':False,'singleUnconditionalCommonTheoremAlreadyProved':False,
        'nativeBoundaryScope':'Direct explicit graph and native arguments only; native defining-body dependencies require their separate actual contracts.',
        'zeroPdeMonomialsClaimed':False,'PdeCancellationMustUseWholeComponentSum':True},
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
    a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
    print(json.dumps({'allOriginalRows':1260,'sourceNodes':len(nodes),'nativeDefinitions':len(definitions),
                     'sharedSignatureGroups':len(groups),'nativeDefinitionReachTop':coverage[:8],'newDischarged':0}))

if __name__=='__main__':main()
