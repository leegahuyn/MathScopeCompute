"""Original fixed-label N=0 late mean: conservative source census.

The C125 recurrence is unchanged, only its finite index bank is enlarged.
Values used by that dependency tracer are placeholders, never norm estimates.
"""
import argparse, hashlib, inspect, json, runpy
from pathlib import Path

PINS={
 'c134':('continuation134/radial-time-gaussian/verify_radial_time_gaussian.py','73cd66c070f1e1ed9468aa1db1bb27c0c502b832f4e6d29f8fe0f72487e2a3c1'),
 'c134_result':('continuation134/radial-time-gaussian/radial-time-gaussian.json','a69531c3a1be1d2c8fdf2a56f2b41d50c84f89b806134540c5072ea281091d23'),
 'c135':('continuation135/radial-sigma-mixed/replay1.json','847609b8d145c6ae52f9b6a96c7aa0764531f8c8767c97be619f0969f73d6184'),
 'l9':('continuation129/temporal-presigned-extra/original-primary-l9.json','12d869922e481f5468455a11b200d8d5faf75429be7fd0fc5381e262eb9f82eb'),
 'matrix9':('continuation131/fivemap-presigned-high/matrix-order9.json','234adcb53fc323ddbce451e2948348f9c3260d1f50cd51c6da7bcb782e0a194d'),
 'meanFrontier':('continuation135/radial-mean-cofactors/late-ordinary.json','3c9cf3fbf41b554761a6cc195d183f5035b25065425473059bf25134db414e80'),
 'curlTrace':('continuation129/temporal-postsigned-covariance/verify_temporal_postsigned_covariance.py','f5e9c04c043ff9cde04c45245f6278a147951a67471026e1155c4d80395c0c7e'),
 'c136':('continuation136/radial-sigma-r2z2t/replay1.json','3b3e481102d21f60981175ee1dde2aea0389024417adfd95cf628c4c2c8cea1b'),
 'sigma125':('continuation125/sigma-mixed-join/sigma-mixed-join.json','ec610109784540efae884f7ddcb5a5c8da354cbd9e94c0c7aee8dd2790b65f0a'),
 'sigma127':('continuation127/sigma-rrt/join.json','e59a7141b801536964f6991ff99a38112e4a997cd29a3a25fe3807566fdfec3c'),
 'sigma128':('continuation128/sigma-high-time/sigma-high-time.json','c09bf88e3ad65ecf9b5f21e25fe229469cd3e491bacb2dd0ee5ead4627d6ef00'),
 'sigma130':('continuation130/sigma-rrzt/join.json','00d57efc37cceec1dcc907792d9da7db92278ed77298c6b52bef008c402e2cc3'),
 'sigma131':('continuation131/high-sigma-join/join.json','0018ec189d12d57e0d621b8e4dc4da9c67b2bfad3a57e9e09b9b28e969042297'),
}

def verify(work,goal,runtime):
    evidence={}
    for k,(rel,pin) in PINS.items():
        p=work/rel; raw=p.read_bytes(); actual=hashlib.sha256(raw).hexdigest()
        assert actual==pin,(k,actual,pin)
        evidence[k]=runpy.run_path(str(p)) if p.suffix=='.py' else json.loads(raw)
    c=evidence['c134']; roots={'work':work,'goal':goal,'runtime':runtime}
    src={k:c['load'](roots,k) for k in c['PINS']}
    assert evidence['c134_result']['activeRoots']['protectedBody']==22004387
    assert evidence['c135']['sourceRoots']==[22001223,22001224,22000443]
    assert evidence['matrix9']['maximumSuppliedOrder']==9
    assert evidence['matrix9']['allRZTMatrixAuditCount']==816
    requested={(f,tuple(j)) for f,j in evidence['meanFrontier']['inputs']['W']}
    assert len(requested)==280
    trace_src=src['signedTrace']; ops=trace_src['pinned'](goal)['arithmetic']
    gauges=set().union(*(evidence['curlTrace']['curl_needs'](f,j) for f,j in requested))
    targets={q[:3] for q in gauges}
    assert len(gauges)==158 and len(targets)==35
    old=evidence['meanFrontier']['inputs']['old']
    assert len(old)==373 and all(not compact for _,_,compact in old)
    goal_prior=goal/'c119/signed-mixed-native-time/signed-mixed-sigma-time.json'
    raw=goal_prior.read_bytes()
    assert hashlib.sha256(raw).hexdigest()=='d43d7d90c831c82b13c9fb68be5e4ab3acd8212fb7a1bd894e4d061d26673014'
    prior=json.loads(raw)
    sigma_spatial=trace_src['pinned'](goal)['spatial']
    covered={tuple(row['RZT']) for row in sigma_spatial['regions']['inner']['rows']}
    for k in ('sigma125','sigma127','sigma128','sigma130','sigma131'):
        covered.update(map(tuple,evidence[k]['targetsRZT']))
    covered.update(map(tuple,evidence['c135']['targets']))
    covered.add(tuple(evidence['c136']['target']))
    # The two T=1, order 0/1 original directions come from C119.
    # Their original dependency request is independently pinned by C125.
    prior_requests=set(map(tuple,trace_src['pinned'](goal)['oldDemand']['exactSigmaRequests']))
    covered.update(prior_requests)
    missing_sigma=sorted(targets-covered)
    code=inspect.getsource(trace_src['trace'])
    assert code.count('range(4),range(7),range(3)')==1
    code=code.replace('range(4),range(7),range(3)','range(7),range(9),range(3)')
    ns={}; exec(compile(code,'original_trace_expanded_bank','exec'),trace_src['trace'].__globals__,ns)
    trace=ns['trace']; down=c['down']; plus=c['plus']; offsets=c['OFFSETS']
    paths={}; waves=set(); means={(f,tuple(j)) for f,j,_ in old}; local=set()
    for target in sorted(targets):
      for region in ('inner','outer'):
        row=trace(ops,target,region); paths[str(target)+'/'+region]=row
        assert not row['cutoffAndDensity']
        assert all(x[0] not in {'rho','Jtheta','Jz','P'} for x in row['pressureAndSignedPrimitives'])
        for name,j in row['covariance']:
            waves.add((name,j))
            for f in trace_src['PAIRS'][name]: means.update((f,(*v,0)) for v in down(j))
        local.update(row['localStress'])
    force={plus((*b,0),o) for _,a in waves for b in down(a) for o in offsets}
    force.update(plus((*b,0),o) for target in targets for b in down(target) for o in offsets)
    force.update(gauges)
    recipes=src['modeOneRecipe']['grouped_recipes'](); direct=set()
    assert all(any(name in {'U','Uo','P'} for name,_ in term)
               for terms in recipes.values() for term in terms)
    mean_map={'Db':'beta','Dv':'v','Dg':'gamma'}
    l6_requesters=sorted((f,j) for f,j in requested if any(q[3]>=6 for q in evidence['curlTrace']['curl_needs'](f,j)))
    assert l6_requesters == [('rtheta',(0,0,0,5)),('rz',(0,0,0,5)),('rz',(0,1,0,5))]
    for name in ('Db','Dv','Dg'):
        assert (('radialFast',(0,0,0,0)),(name,(0,0,0,1)),('U',(0,0,0,0))) in recipes['meanTransportAndDivergence']
    for a in force:
        for b in down(a):
            for terms in recipes.values():
                for term in terms:
                    for name,o in term:
                        j=plus(b,o)
                        if name in {'U','Uo','P'}: direct.add((name,j))
                        if name in mean_map: means.add((mean_map[name],j))
    direct.update(('U_modeTwo',plus(b,o)) for a in force for b in down(a) for o in offsets)
    _,cov,inv,prim,_=src['meanCollar']['collar'](src['meanAlgebra'],6,sorted(means))
    _,prior_cov,_,_,_=src['meanCollar']['collar'](src['meanAlgebra'],6,sorted((f,tuple(j)) for f,j,_ in old))
    prior_above8={(f,j) for f,j in prior_cov if j[3]>8}
    isolates={}
    for f in ('beta','v','gamma'):
        _,one,_,_,_=src['meanCollar']['collar'](src['meanAlgebra'],6,[(f,(0,0,0,7))])
        isolates[f]=sorted((g,j) for g,j in one if j[3]>=10)
    assert isolates == {'beta':[('W_rz',(0,1,0,10))], 'v':[('W_rtheta',(0,0,0,10))], 'gamma':[('W_rz',(0,0,0,10))]}
    direct.update(('U_Covariance',j) for _,j in cov)
    envelope=c['envelope']({j for _,j in direct})
    l8=src['primary']['weightedQuotientLedger']['transverseDerivativeCoverage']['normalizedVelocityL']
    high_cov=sorted((f,j) for f,j in cov if j[3]>l8)
    l9_available={(x['component'],tuple(x['RZTL'])) for x in evidence['l9']['sourceRows']}
    assert prior_above8 <= l9_available
    uncovered=sorted(set(high_cov)-l9_available)
    high_non_cov=sorted((f,j) for f,j in direct if f!='U_Covariance' and j[3]>l8)
    high8=sorted((f,j) for f,j in cov if j[3]>=8)
    maxlocal=max(sum(j) for j in local)
    assert maxlocal<=6
    assert src['local']['source']['positive']['fullHaarResiduals']==[21999622,22000445]
    assert src['local']['weightedLocalFlux']['sameDisjointNarrowCollars']=={'inner':'0<u<=1/128','outer':'0<d<=1/32'}
    assert src['frame']['matrixDirections']==816 and src['frame']['cutoffOrder']==19
    assert evidence['c134_result']['gaussianPowers']['signedTarget']=='1'
    assert src['primary']['weightedQuotientLedger']['firstPulseDerivativeCoverage']['normalizedAmplitudePotentialVelocity']
    assert '|n|^2>0 and k!=0' in src['forcedSystem']
    assert '(1-psi)*f+psi_prime*t' in src['forcedSystem']
    assert 'G.div(x,G.mul(G.q(2),a[j]))' in src['signedInverse']
    assert src['oldFirstForced']['nativeConditions']['noEndpointTerms']
    assert src['inverse']['tail']['uniformPointwiseFourierTail']=='<25*K^(-1/2)*(||f||_2+||L^2 f||_2/36)'
    return {'schema':'MathScope.C136.OriginalRadialMeanOrdinary/1',
      'status':'SOURCE_CENSUS_PASS_GAUSSIAN_TRANSFER_CONDITIONAL' if not uncovered and not high_non_cov and envelope['slow']<=11 and not missing_sigma else 'SOURCE_CENSUS_PASS_FURTHER_NATIVE_INPUT_OPEN',
      'sourceRoots':[22001223,22001224,22000443],'endpoints':[17743711,17743713],
      'postSignedW':sorted(requested),'gaugeDirections':sorted(gauges),'sigmaDirections':sorted(targets),
      'postSignedWRequiringGaugeL6':l6_requesters,
      'isolatedMeanL7ToPrimaryL10':isolates,
      'old373PrimaryCovarianceCount':len(prior_cov),'old373AboveL8':sorted(prior_above8),
      'missingSigmaDirections':missing_sigma,'includedPriorOldMeanCount':len(old),
      'sourceTraces':paths,'preSignedCovarianceRows':sorted(waves),'forceRZTL':sorted(force),
      'initializedMeanRows':sorted(means),'initializedMeanPrimaryCovariance':sorted(cov),
      'oldMeanInverseRoles':sorted(inv),'oldMeanShortPrimitiveRoles':sorted(prim),
      'localStressRows':sorted(local),'localMaxPhysicalDerivativeOrder':maxlocal,
      'primaryRows':sorted(direct),'primaryEnvelope':envelope,'primaryCommonL':l8,
      'primaryCovarianceL8OrAbove':high8,'primaryCovarianceAboveL8':high_cov,
      'exactL9Available':sorted(l9_available),'aboveL8AbsentFromExactL9':uncovered,
      'nonCovarianceAboveL8':high_non_cov,
      'sourceDerivativeArgument':'Each physical chart differentiation adds at most one q/X/eta source jet; finite derivatives of admitted chart coefficients are also required. This is a structural upper bound, not a numerical norm.',
      'scope':'Conservative N=0 ordinary mean derivative frontier on both fixed-label collars under original C134 premises. Positive N directions and full Repeat C1 remain open; no quantitative epsilon claim.',
      'pins':PINS,'release':'HOLD','finalJets':0}

if __name__=='__main__':
    p=argparse.ArgumentParser()
    for k in ('work','goal','runtime','out'): p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args(); v=verify(a.work,a.goal,a.runtime)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_bytes((json.dumps(v,indent=2,sort_keys=True)+'\n').encode())
    print(v['status'],v['primaryEnvelope'],'uncovered',v['aboveL8AbsentFromExactL9'],'noncov',v['nonCovarianceAboveL8'])
