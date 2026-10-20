"""Bind actual local order-one Picard0 calls to the unchanged common collar.

The propagation follows ordinary operands, real integral binders and literal
lazy guards in original expression5..10 bodies. It does not expand opaque
other-native bodies or prove physical/mesh caller substitutions on whole J.
"""
from __future__ import annotations
import argparse,hashlib,importlib.util,json,sys
from collections import Counter
from dataclasses import dataclass
from fractions import Fraction as Q
from functools import lru_cache
from pathlib import Path
import actual_eta_transport as e
from native_domain_extract import NATIVE,argument_children,require,sha,STAGE3_PIN

PICARD='c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60'
ORDER_SOURCE='bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72'
X,ETA=4756,2
# Upper-bound ranks:0, Xkeep, Xcut, aSquared,1,+infinity.
# Strict order follows t1>0 and aSquared<1 from the unchanged fixed parameters.
@dataclass(frozen=True)
class Bound:
    nonnegative:bool=False
    upper:int=5

def transport(get,roots,constant_bounds,*,max_states=300000):
    calls=[];other_native=set();visited=set();read={};sys.setrecursionlimit(10000)
    def node(i):
        if i not in read:read[i]=get(i)
        return read[i]
    @lru_cache(None)
    def reaches(i):
        n=node(i)
        if n['op'] in {'actual_background_even_profile','actual_background_picard'} and n['args'][0]==0:return True
        return any(reaches(j) for j in argument_children(n))
    @lru_cache(None)
    def free(i):
        n=node(i);op,a=n['op'],n['args']
        if op=='coordinate':return frozenset([i])
        if op=='definite_integral':return (free(a[0])-{a[1]})|free(a[2])|free(a[3])
        return frozenset().union(*(free(j) for j in argument_children(n)))
    @lru_cache(None)
    def bound(i,environment):
        env=dict(environment)
        if i in env:return env[i]
        if i in constant_bounds:return constant_bounds[i]
        n=node(i);op,a=n['op'],n['args']
        if op=='rational':
            v=Q(int(a[0]),int(a[1]));return Bound(v>=0,0 if v==0 else 4 if 0<v<=1 else 5)
        if op=='coordinate':return Bound()
        if op=='exp':return Bound(True,5)
        if op=='integer_power' and a[1]>0:
            b=bound(a[0],environment)
            return Bound(b.nonnegative or a[1]%2==0,b.upper if b.nonnegative and b.upper<=4 else 5)
        if op=='multiply':
            rows=[bound(j,environment) for j in a]
            if any(b.nonnegative and b.upper==0 for b in rows):return Bound(True,0)
            if all(b.nonnegative for b in rows):
                return Bound(True,min(b.upper for b in rows)) if all(b.upper<=4 for b in rows) else Bound(True,5)
        if op=='add':
            rows=[bound(j,environment) for j in a]
            if all(b.nonnegative for b in rows):
                live=[b for b in rows if b.upper!=0]
                return Bound(True,0 if not live else live[0].upper if len(live)==1 else 5)
        return Bound()
    def walk(i,environment):
        if not reaches(i):return
        # Only coordinates actually free in this subtree affect its contexts.
        environment=tuple((j,b) for j,b in environment if j in free(i))
        state=(i,environment)
        if state in visited:return
        require(len(visited)<max_states,'Local transport state budget exhausted; no truncation')
        visited.add(state);n=node(i);op,a=n['op'],n['args'];env=dict(environment)
        if op in {'actual_background_even_profile','actual_background_picard'} and a[0]==0:
            require(op=='actual_background_even_profile','Unreviewed direct xi Picard caller')
            bb=bound(a[2],environment)
            require(bb.nonnegative and bb.upper<=3,'Actual Picard0 radial argument not within common collar: '+str((i,bb)))
            require(a[3]==ETA,'Actual Picard0 eta argument is not the certified same formal eta: '+str(i))
            calls.append({'node':i,'nodeSHA256':sha(n),'radialArgument':a[2],'etaArgument':a[3],
              'radialUpperRank':bb.upper,'environment':[[j,{'nonnegative':b.nonnegative,'upperRank':b.upper}] for j,b in environment],
              'ordinaryRadialAndEtaOrders':a[4:],'provedOnSameFormalEtaInterval':True,
              'sameSolutionValueNormAppliesDirectly':a[4]==0,
              'nonzeroRadialOrdersNeedActualODEDerivativeBounds':a[4]!=0})
            return
        if op=='smooth_piecewise':
            selector,left,right,*branches=a
            for j in a[:3]:walk(j,environment)
            for branch,upper in zip(branches,[left,right,None]):
                scoped=dict(env)
                if upper is not None and node(selector)['op']=='coordinate':
                    old=scoped.get(selector,Bound());u=bound(upper,environment)
                    scoped[selector]=Bound(old.nonnegative,min(old.upper,u.upper))
                walk(branch,tuple(sorted(scoped.items())))
            return
        if op=='definite_integral':
            body,binder,lo,hi=a;walk(lo,environment);walk(hi,environment)
            low,high=bound(lo,environment),bound(hi,environment)
            scoped=dict(env);scoped[binder]=Bound(low.nonnegative and high.nonnegative,max(low.upper,high.upper))
            walk(body,tuple(sorted(scoped.items())));return
        if op in NATIVE:other_native.add(i)
        for j in argument_children(n):walk(j,environment)
    for root in roots:walk(root,((X,Bound(True,5)),))
    return {'sourceNodesRead':len(read),'sourceNodeContentSHA256':sha([[i,read[i]] for i in sorted(read)]),
            'proofStates':len(visited),'actualPicard0CallStates':calls,'actualPicard0CallIDs':sorted({c['node'] for c in calls}),
            'otherNativeArgumentOnlyBoundaries':sorted(other_native),'allDirectLocalPicard0ArgumentStatesWithinOriginalCollar':True,
            'opaqueOtherNativeBodiesExpanded':False}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for k in ['source-db','stage3','header','compact','numeric','kernels','out']:p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args();digest=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
    require(digest(a.stage3)==STAGE3_PIN,'Changed original authenticated reader')
    spec=importlib.util.spec_from_file_location('picard_local_original_v3',a.stage3);v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
    from header_binding import bind_header_to_gzip
    header,binding=bind_header_to_gzip(a.header.parent/'original-parent.ndjson.gz',a.header)
    reg=v3.registries(header);get=v3.Source(a.source_db);d=reg['picard'][0]
    require(sha(d)==PICARD,'Changed original Picard0 definition')
    compact=json.loads(a.compact.read_text(encoding='utf8'));numeric=json.loads(a.numeric.read_text(encoding='utf8'))
    require(compact['sourceHeaderSHA256']==binding['sourceHeaderRecordSHA256'],'Different compact source header')
    require(numeric.get('actualSourceAndAnalyticInputsComposed') is True and numeric.get('numericC1KCertifiedTailBoundsProvedHere') is True,
            'Fully source-composed original Picard0 numeric theorem required')
    require(numeric['sourceHeaderSHA256']==binding['sourceHeaderRecordSHA256'],'Different original numeric header')
    require(numeric['inputSHA256']['compact']==digest(a.compact) and numeric['originalPicardSHA256']==PICARD,'Different numeric source theorem')
    path=a.kernels/'research-ide/mathscope-m2/navier/actual-continuation-exact-order-one.mjs'
    require(digest(path)==ORDER_SOURCE,'Changed original local extension producer')
    normal=e.Normal(get,reg);q=e.rat;mul=e.mul;exp=e.exp
    xa=('parameter','Xa');t1=('parameter','t1')
    keep,cut=28819,28823;upper=d['radialDomain'][1]
    require(normal.at(keep)==mul(xa,exp(mul(q(1,64),t1))),'Changed actual Xkeep formula')
    require(normal.at(cut)==mul(xa,exp(mul(q(1,32),t1))),'Changed actual Xcut formula')
    upper_node=get(upper)
    require(upper_node['op']=='sqrt_positive' and
            normal.at(upper_node['args'][0])==mul(xa,exp(mul(q(1,16),t1))),'Changed actual aSquared formula')
    literal={28834:('actual_background_even_profile',[0,0,X,ETA,0,0]),
      28835:('actual_background_even_profile',[0,1,X,ETA,0,0]),
      28837:('smooth_piecewise',[X,keep,cut,28834,28836,0]),
      28839:('smooth_piecewise',[X,keep,cut,28835,28838,0]),
      28854:('actual_background_even_profile',[0,1,28853,ETA,0,0]),
      28863:('smooth_piecewise',[28853,keep,cut,28854,28862,0]),
      28864:('definite_integral',[28863,28853,0,cut]),
      29331:('actual_background_even_profile',[0,1,29330,ETA,0,0]),
      29332:('definite_integral',[29331,29329,0,1]),
      29333:('multiply',[X,29332]),
      29334:('smooth_piecewise',[X,keep,29328,29333,29326,0]),
      29336:('smooth_piecewise',[X,keep,29328,29332,29335,0]),
      50557:('actual_background_even_profile',[0,3,X,ETA,0,0]),
      50558:('smooth_piecewise',[X,keep,28824,50557,50556,0])}
    for i,(op,args) in literal.items():require(get(i)=={'op':op,'args':args},'Changed actual local guard/binder/call '+str(i))
    require(normal.at(29330)==mul(('coordinate',29329),('coordinate',X)),'Changed actual axis-average tX substitution')
    expected_roots={5:29290,6:29289,7:29440,8:29334,9:29336,10:50558}
    for key,body in expected_roots.items():
        dd=reg['expression'][key]
        require(dd['body']==body and dd['parameters']==[X,ETA] and dd.get('unspecifiedOracle') is False,'Changed actual completed order-one body')
        require(compact['definitions']['expression:'+str(key)]['fullDefinition']==dd,'Different compact order-one definition')
    # Ordering is an exact theorem of the unchanged parameter trees, not a
    # floating comparison of these astronomically small constants.
    from natural_domain_proof import source_parameter_proof
    parameters=source_parameter_proof(reg['fixed'])
    cb={keep:Bound(True,1),cut:Bound(True,2)}
    result=transport(get,expected_roots.values(),cb)
    # Adverse controls mutate only an isolated reader; the original is read-only.
    controls={}
    mutations={'unguardedRawF':{28837:get(28834)},
      'axisArgumentDoubled':{29330:{'op':'multiply','args':[24,X,29329]}},
      'wrongEtaCoordinate':{28834:{'op':'actual_background_even_profile','args':[0,0,X,29329,0,0]}}}
    for name,changed in mutations.items():
        def altered(i):return changed[i] if i in changed else get(i)
        try:transport(altered,expected_roots.values(),cb)
        except ValueError:controls[name]=True
        else:controls[name]=False
    require(all(controls.values()),'A bad actual-domain transport mutation was accepted')
    result.update({'schema':'MathScope.N6.ActualPicard0LocalTransport/1','sourceHeaderBinding':binding,
      'inputSHA256':{k:digest(getattr(a,k)) for k in ['stage3','compact','numeric']},'originalPicardSHA256':PICARD,
      'originalExtensionSourceSHA256':ORDER_SOURCE,'literalOriginalLocalBindings':{str(i):get(i) for i in literal},
      'actualCompletedOrderOneDefinitionRoots':expected_roots,
      'orderingProof':'0<Xkeep=Xa*exp(t1/64)<Xcut=Xa*exp(t1/32)<aSquared=Xa*exp(t1/16)<1, from the unchanged positive t1=C^-120, Xa=4/Lambda and Lambda=Q^64.',
      'sameFormalLocalDomain':'Every real X>=0 and eta in I=[-33/32,33/32]; only active raw Picard0 calls are within 0<=argument<=Xcut<aSquared.',
      'sameNumericPicardDomainReusedForTheseLocalCalls':True,
      'numericReuseScope':'Same original value norm and each fixed eta-tail for radial order zero; nonzero radial derivatives retain their separate actual ODE bounds.',
      'ordinaryLocalLeibnizBinderRangesRetained':True,
      'strictNegativeControls':controls,'actualParameterProofDigest':sha(parameters),
      'wholeJNativeCallerTransportProved':False,'wholeGOnJProved':False,
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0})
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'actualLocalCallIDs':len(result['actualPicard0CallIDs']),'proofStates':result['proofStates'],
      'localTransport':True,'wholeJTransport':False,'newDischarged':0}))

if __name__=='__main__':main()
