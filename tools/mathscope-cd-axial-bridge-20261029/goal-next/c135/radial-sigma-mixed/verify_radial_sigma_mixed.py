"""Finite collar dependency census for three original Signed Sigma directions.

The inherited recurrence is used for source dependencies, never as a numerical
norm estimate.  Gaussian transfer remains conditional on the C134 premises.
"""
import argparse, hashlib, inspect, json, runpy
from itertools import product
from pathlib import Path

TARGETS = ((3, 1, 0), (4, 0, 0), (3, 0, 1))
PINS = {
    'c134': ('continuation134/radial-time-gaussian/verify_radial_time_gaussian.py', '73cd66c070f1e1ed9468aa1db1bb27c0c502b832f4e6d29f8fe0f72487e2a3c1'),
    'c134_receipt': ('continuation134/radial-time-gaussian/radial-time-gaussian.json', 'a69531c3a1be1d2c8fdf2a56f2b41d50c84f89b806134540c5072ea281091d23'),
    'l9': ('continuation129/temporal-presigned-extra/original-primary-l9.json', '12d869922e481f5468455a11b200d8d5faf75429be7fd0fc5381e262eb9f82eb'),
}

def main(work, goal, runtime):
    loaded = {}
    for name,(path,expected) in PINS.items():
        p = work / path
        raw = p.read_bytes()
        got = hashlib.sha256(raw).hexdigest()
        assert got == expected, (name,got,expected)
        loaded[name] = runpy.run_path(str(p)) if p.suffix == '.py' else json.loads(raw)
    c = loaded['c134']
    roots={'work':work,'goal':goal,'runtime':runtime}
    source={k:c['load'](roots,k) for k in c['PINS']}
    trace_mod=source['signedTrace']
    ops=trace_mod['pinned'](goal)['arithmetic']
    # The exact recurrence is unchanged: expand its finite direction bank only.
    text=inspect.getsource(trace_mod['trace'])
    assert text.count('range(4),range(7),range(3)') == 1
    text=text.replace('range(4),range(7),range(3)','range(6),range(7),range(3)')
    ns={}; exec(compile(text,'original_trace_expanded_bank','exec'), trace_mod['trace'].__globals__, ns)
    trace=ns['trace']
    down=c['down']; plus=c['plus']; offsets=c['OFFSETS']
    paths={}; W=set(); mean=set(); local=set()
    for target in TARGETS:
        for region in ('inner','outer'):
            row=trace(ops,target,region); paths[(target,region)]=row
            assert not row['cutoffAndDensity']
            assert all(x[0] not in {'rho','Jtheta','Jz','P'} for x in row['pressureAndSignedPrimitives'])
            for name,b in row['covariance']:
                W.add((name,b))
                for f in trace_mod['PAIRS'][name]:
                    mean.update((f,(*i,0)) for i in down(b))
            local.update(row['localStress'])
    force={plus((*b,0),o) for _,a in W for b in down(a) for o in offsets}
    force.update(plus((*b,0),o) for a in TARGETS for b in down(a) for o in offsets)
    recipes=source['modeOneRecipe']['grouped_recipes']()
    direct=set(); mean_map={'Db':'beta','Dv':'v','Dg':'gamma'}
    for a in force:
        for b in down(a):
            for terms in recipes.values():
                for term in terms:
                    for name,o in term:
                        j=plus(b,o)
                        if name in {'U','Uo','P'}: direct.add((name,j))
                        if name in mean_map: mean.add((mean_map[name],j))
    direct.update(('U_modeTwo',plus(b,o)) for a in force for b in down(a) for o in offsets)
    _, donor_cov, inverse, prim, _ = source['meanCollar']['collar'](source['meanAlgebra'],6,sorted(mean))
    direct.update(('U_Covariance',j) for _,j in donor_cov)
    highs=c['envelope']({j for _,j in direct})
    # The exact C129 L9 witness is an additional individual role, not a general L9 theorem.
    l9rows=loaded['l9']['sourceRows']
    exact_l9=sorted((row['component'],tuple(row['RZTL'])) for row in l9rows)
    primary_l8=source['primary']['weightedQuotientLedger']['transverseDerivativeCoverage']['normalizedVelocityL']
    l9_needed={(f,tuple(j)) for f,j in donor_cov if j[3] > primary_l8}
    assert l9_needed == {('W_rz',(0,1,0,9))}
    assert l9_needed <= set(exact_l9)
    maxlocal=max(sum(j) for j in local)
    assert maxlocal <= 4
    assert source['local']['source']['positive']['fullHaarResiduals']==[21999622,22000445]
    assert source['local']['weightedLocalFlux']['sameDisjointNarrowCollars']=={'inner':'0<u<=1/128','outer':'0<d<=1/32'}
    assert source['frame']['matrixDirections']==816 and source['frame']['cutoffOrder']==19
    assert highs['slow'] <= 11 and highs['L'] == 9 and highs['T'] <= 2
    # ∂R^i (R^e J(X)) = R^(e-i) P_i J, X=R²/(2s).
    # R is independent of the fixed-label coefficients of the Z/T chart.
    m=source['localOperator']; t,add,mul,deriv,euler=(m[x] for x in ('term','add','mul','derivative','euler'))
    J=t('J:')
    def radial_n(p,n):
        for i in range(n):
            p=add(mul(add(t('e'),t(multiple=-i)),p),mul(t('X',multiple=2),deriv(p,'X')))
        return p
    polynomials={'R4':radial_n(J,4),
        'R3Z':radial_n(add(mul(t('b'),euler(J)),mul(t('c'),deriv(J,'eta'))),3),
        'R3T':radial_n(mul(t('a'),euler(J)),3)}
    jet_orders={name:max(len(atom[2:].split(':')) if atom[2:] else 0
                    for word in p for atom in word if atom.startswith('J:'))
                for name,p in polynomials.items()}
    assert jet_orders == {'R4':4,'R3Z':4,'R3T':4}
    assert radial_n(J,4) != mul(t('e'),radial_n(J,3))
    c134=loaded['c134_receipt']
    assert c134['activeRoots']['protectedBody']==22004387
    assert c134['gaussianPowers']['signedTarget']=='1'
    return {'schema':'MathScope.C135.RadialSigmaMixedSourceCensus/1',
        'status':'SOURCE_DEPENDENCIES_VERIFIED_GAUSSIAN_TRANSFER_CONDITIONAL',
        'targets':TARGETS,'sourceRoots':[22001223,22001224,22000443],
        'fixedEndpoints':[17743711,17743713],
        'regions':['inner','outer'],
        'sourceTraces':[{'target':a,'region':r,**paths[(a,r)]} for a,r in sorted(paths)],
        'preSignedCovarianceRows':sorted(W),'forceRZTL':sorted(force),
        'initializedMeanRows':sorted(mean),'initializedMeanPrimaryCovariance':sorted(donor_cov),
        'oldMeanInverseRoles':sorted(inverse),'oldMeanShortPrimitiveRoles':sorted(prim),
        'localStressRows':sorted(local),'localStressMaximumTotalOrder':maxlocal,
        'localChainRule':{'jetOrders':jet_orders,'termCounts':{k:len(v) for k,v in polynomials.items()},
            'radialFactor':'R^(e-i) with e decremented after each radial derivative'},
        'primaryRows':sorted(direct),'primaryDirectionEnvelope':highs,
        'existingGeneralPrimaryL':primary_l8,'exactC129L9Rows':exact_l9,'requiredBeyondL8':sorted(l9_needed),
        'scope':'Original Signed three fixed-label radial collar recurrences; finite dependency census. Gaussian transfer requires the C134 analytic premises and exact source-specific available Primary derivatives. No aggregate C1 or numerical epsilon claim.',
        'unresolved':'The original admitted chart, frame, positive profile and Gaussian integral-realization premises remain conditional; this is not a full supported Repeat C1 proof.',
        'pins':PINS,'release':'HOLD'}

if __name__=='__main__':
    p=argparse.ArgumentParser()
    for name in ('work','goal','runtime','out'): p.add_argument('--'+name,required=True,type=Path)
    a=p.parse_args(); out=main(a.work,a.goal,a.runtime)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_bytes((json.dumps(out,indent=2,sort_keys=True)+'\n').encode())
    print('PASS source census',out['primaryDirectionEnvelope'], 'local',out['localStressMaximumTotalOrder'])
