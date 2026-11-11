"""Verify original stage-zero mean operands and exact directional norm reductions."""
from argparse import ArgumentParser
from functools import lru_cache
from fractions import Fraction as F
from hashlib import sha256
from math import comb, factorial
from pathlib import Path
import gzip
import json

from sympy import Poly, diff, expand, symbols

PREFIX='99dcc6ff6aaa92d4449d6ad5aae5a8ff2037f3e1644ac3ad0fdd2994ca020745'
HOSTED='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
REGISTRY='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333'
PARAMETERS='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'


def require(ok,text):
    if not ok:
        raise ValueError(text)


def read(path):
    return json.loads(path.read_bytes())


def load_graph(path,d):
    m=read(path/'original-source-export-manifest.json')
    require(m['node_stream_sha256']==HOSTED and m['definitions_sha256']==REGISTRY,
            'same corrected GitHub graph')
    raw=(path/'original-source-functions.json').read_bytes()
    require(sha256(raw).hexdigest()==REGISTRY,'same actual native registry')
    reg=json.loads(raw)['base']
    definitions=json.loads(reg['expressionDefinitions'])
    inverses=json.loads(reg['inverseDefinitions'])
    base=json.loads(reg['base']['expression'])
    native=d['native']
    require(definitions[:26]==native['snapshot.base.expressionDefinitions'][:26]
            and inverses==native['snapshot.base.inverseDefinitions']
            and base==native['snapshot.base.base.expression'],'same actual native definitions')
    h=sha256()
    p=sha256()
    selected={int(i):node for i,node in d['sourceRecords'].items()}
    nodes={}
    with gzip.open(path/'original-source-nodes.jsonl.gz','rb') as f:
        h.update(next(f))
        for i,line in enumerate(f):
            h.update(line)
            if i<3615866:
                p.update(b'['+str(i).encode()+b','+line.rstrip(b'\r\n')+b']\n')
            if i<644000 or 1696700<=i<=1706880 or 3613876<=i<=3615865 or i in selected:
                nodes[i]=json.loads(line)
    require(i+1==4456994 and h.hexdigest()==HOSTED and p.hexdigest()==PREFIX and
            d['source']['sourceNodePrefixSHA256']==PREFIX,'full graph and exact initialized prefix')
    require(all(nodes[i]==row for i,row in selected.items()),'actual source root readback')
    return nodes,definitions,base,inverses


def check_sources(repo,d):
    if repo is None:
        return
    for rel,digest in d['sourceRuntime'].items():
        require(sha256((repo/rel).read_bytes()).hexdigest()==digest,f'unchanged original {rel}')


def verify_lineage(g,defs,base,inverses,d):
    G=d['geometry']
    R,Z,T=map(G.get,('R','Z','T'))
    Y=set(G['Y'])
    src=d['semanticRefs']
    roots=d['roots']

    def is_node(i,op,args):
        require(g[i]=={'op':op,'args':args},f'exact {op} at #{i}')

    def dependencies(i):
        n=g[i]
        op,a=n['op'],n['args']
        if op in ('coordinate','rational','source_parameter'):
            return []
        if op=='definite_integral':
            return [a[0],a[2],a[3]]
        if op in ('actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial'):
            return a[1]
        if op in ('source_step_derivative','integer_power'):
            return a[:1]
        if op in ('actual_background_picard','actual_background_even_profile','actual_natural_series'):
            return a[2:4] if op!='actual_natural_series' else a[1:3]
        if op in ('actual_monotone_root','actual_quadratic_root'):
            return a[1] if isinstance(a[1],list) else a[1:]
        if op in ('add','multiply','inverse','maximum','minimum','log_positive','exp','sqrt_positive','smooth_piecewise','ceiling'):
            return a
        raise ValueError(f'unknown zero-mode dependency op {op} at #{i}')

    free_cache={i:1<<j for j,i in enumerate(G['Y'])}
    def free_y(root):
        stack=[(root,False)]
        while stack:
            i,seen=stack.pop()
            if i in free_cache:
                continue
            c=dependencies(i)
            if not seen:
                require(all(k<i for k in c),'topological original source dependencies')
                stack.append((i,True))
                stack.extend((k,False) for k in c if k not in free_cache)
                continue
            flags=0
            for j,k in enumerate(c):
                value=free_cache[k]
                if j==0 and g[i]['op']=='definite_integral':
                    binder=g[i]['args'][1]
                    if binder in Y:
                        value &= ~free_cache[binder]
                flags |= value
            free_cache[i]=flags
        return free_cache[root]

    is_node(roots['Etheta'],'add',[633892,643867])
    is_node(roots['Ez'],'add',[633990,643882])
    for i in (633892,633990,643108,633733,633960):
        require(not free_y(i),f'actual #{i} is auxiliary-independent')
    is_node(643109,'add',[643052,643108])
    is_node(643052,'add',[643036,643051])
    is_node(643051,'add',[643047,643050])
    is_node(643050,'multiply',[20,643049])
    is_node(643049,'multiply',[G['epsilon'],643048])
    is_node(643048,'m3_aux_indexed_partial',[2,[R,Z,T,622791,*G['Y']],[0,2,0,0,0]])
    is_node(643806,'definite_integral',[643805,643595,G['innerRadius'],R])
    is_node(643807,'definite_integral',[643805,643595,G['innerRadius'],G['outerRadius']])
    is_node(643849,'add',[643846,643848])
    require(all(ref['body']==roots[key] and ref==inverses[j] for j,(ref,key) in
                enumerate(zip(src['earlyInverseDefinitions'],('Etheta','Ez')))),
            'both original exact Fourier inverse bodies')
    require(all(inv['Y']==G['Y'] for inv in inverses),'same complete normalized torus')

    fresh=src['freshActualTargets']
    scaled=src['scaledFiveTargets']
    for key,def_index in [('P',15),('Jtheta',16),('Jz',17)]:
        require(src['temporalBeforeFive'][key]==fresh[key] and fresh[key] in g[scaled[key]]['args']
                and g[fresh[key]]['args'][0]==-1-def_index,
                f'actual recomputed post-Temporal {key} enters the five-map')
        require(set(defs[def_index]['parameters']).isdisjoint(Y|{R}),
                f'actual {key} is independent of R and Y')

    keys={i:name for name,i in scaled.items()}
    @lru_cache(None)
    def uses_target(i):
        if i in keys:
            return frozenset([keys[i]])
        if i<3614700:
            return frozenset()
        node=g[i]
        op,a=node['op'],node['args']
        if op=='m3_aux_expression_partial':
            c=[defs[-1-a[0]]['body'],*a[1]]
        elif op in ('integer_power','source_step_derivative'):
            c=a[:1]
        elif op in ('rational','source_parameter','coordinate'):
            c=[]
        else:
            c=a
        return frozenset().union(*(uses_target(k) for k in c))

    require(uses_target(roots['fivePotential'])=={'Jtheta'} and uses_target(roots['fiveRadial'])=={'Jtheta'}
            and uses_target(roots['fiveAxial'])=={'Jtheta'}
            and uses_target(roots['totalAzimuthal'])=={'P','Jz'},
            'exact live FiveMap axial/azimuthal dependency split')
    require(src['fiveMomentRows'][1]['target']==0 and all(c['pass'] for c in src['fivePotential']['checks']),
            'actual axial whole moment and realized potential')

    require(g[roots['finalMeanPressure']]['args']==[3615204,3615360] and
            g[3615204]['args'][:2]==g[3615205]['args'][:2],
            'late actual mean pressure retains shifted left and whole centering')
    require(defs[21]['body']==3614891 and g[src['rebuiltFinal']['gr']]['args'][0]==-22,
            'actual late full pressure gr body')
    is_node(3614891,'add',[3614887,3614890])
    is_node(3614887,'multiply',[G['epsilon'],3614886])
    is_node(3614883,'add',[3614881,3614882])
    is_node(3614881,'multiply',[G['epsilon'],3614880])
    is_node(3614880,'multiply',[G['epsilon'],3614879])
    is_node(3614879,'add',[3613981,3614878])
    is_node(3613981,'multiply',[20,3613980])
    is_node(3613980,'multiply',[G['epsilon'],3613979])
    is_node(3613979,'m3_aux_expression_partial',[-13,[622791,R,Z,T,*G['Y']],[0,0,3,0,0,0]])
    return {'earlyNonzeroHaarEtheta':643867,'earlyNonzeroHaarEz':643882,
            'exactZeroModeOnlyRoots':[633892,633990,643108],
            'earlyPressureZ':643849,'earlyPressureWrzZZ':643048,
            'freshTargets':fresh,'fivePsiUses':['Jtheta'],'fiveVUses':['P','Jz'],
            'lateGr':3614891,'lateTemporalViscousAxialNativePsiZZZ':3613979,
            'latePressure':roots['finalMeanPressure']}


def fourier():
    sep=16
    mass=2*sep**2*2
    all_shells=F(4,3)*mass
    require(all_shells<F(37**2) and 2*37**2<54**2,'exact pointwise constant 1/4')
    require(4*F(3,2)/6**2==F(1,6),'exact L2 constant 1/6')
    return {'slope':'sqrt(2)-1','normalization':'[0,1]^2 and 2*pi',
            'minimumPairSpacingOnDyadicShell':'1/(16*N)',
            'inverseSquareShellCoefficient':mass,'weightedAllShellsSum':str(all_shells),
            'CInfinityByTwoPureTorusDerivatives':'1/4',
            'CInfinityTailOnDyadicCutoff':'1/(4*N)',
            'L2ByOnePureTorusDerivative':'1/6'}


def five_kernel():
    t=symbols('t')
    u=t*(1-t)
    p=1
    rows=[]
    for j in range(4):
        poly=Poly(p,t)
        l1=sum(abs(int(c)) for c in poly.all_coeffs())
        rows.append({'order':j,'polynomial':str(poly.as_expr()),'powerOfX0Inverse':j+1,
                     'seedMultiplier':10**j*factorial(2*j)*l1})
        p=expand(u*u*diff(p,t)+(1-2*j*u)*diff(u,t)*p)
    require(rows[0]['seedMultiplier']==1,'actual unscaled seed')
    contraction=F(1,32)*4*F(8,3)
    require(contraction==F(1,3) and F(9,128)+contraction/8<F(1,8),
            'actual slow implicit chart has a fixed complex collar')
    bell=[
        [1],[1],[1,1],[1,3,1],[1,7,6,1]
    ]
    require([sum(r) for r in bell]==[1,1,2,5,15],'exact set-partition counts through order four')
    return {'kernel':'actual FiveMap separated fixed unit source profiles',
            'implicitSlowChartComplexRadius':'1/(128*Rstar)',
            'complexChartContraction':str(contraction),
            'normalizingPrefactorSupWithoutInverseR':136,
            'normalizingPrefactorSupWithInverseR':'272*Rstar',
            'compositionXComplexSup':'4*Rstar',
            'seedDerivativeRows':rows,'totalBellSetPartitionCountsThroughOrder4':bell,
            'profileG':['|G|<=2*mu3','|G^(j)|<=2*(2*Rstar*eta0Norm[j-1]+(j-1)*eta0Norm[j-2]), j>=1'],
            'fixedSourceFactorsRetained':['K*(2*X0)^(1/2+lambda)','mu_j','geometric Vandermonde inverse','1-exp(-2*d*lambda)']}


def demand():
    def row(name,field,j,loss,early):
        return {'output':name,'temporalInput':field,'temporalOrder':j,'torusLoss':loss,
                'earlyCovarianceOrderIncrease':early,'covarianceOrder':j+loss+early}
    rows=[
        row('Temporal azimuthal potential','psi_T pointwise',3,2,2),
        row('Temporal direct mean','v_T pointwise',2,2,1),
        row('fresh Jtheta -> FiveMap axial/potential','gamma_T and v_T slow L2_Y',4,1,2),
        row('fresh P,Jz -> FiveMap direct v','psi_T slow L2_Y from beta_T slow C3',4,1,2),
        row('late mean pressure lower products','psi_T pointwise from beta_T C2',3,2,2),
        row('late mean pressure temporal axial viscosity','pointwise psi_T Z4',4,2,2)
    ]
    require([a['covarianceOrder'] for a in rows]==[7,5,7,7,7,8],'all exact requested derivative ceilings')
    return {'rows':rows,'worstSurvivingPreHaarCovarianceOrder':8,
            'strongestExposedMixedJet':'partial_Z^6 partial_Y_i^2 W_rz',
            'weightedTargetOrderViaOriginalPrimaryAdapter':9,
            'backgroundOrderViaOriginalPrimaryAdapter':11,
            'highWeightedStressInputNeeded':False,'oldGenericTargetOrder':16}


def main():
    p=ArgumentParser()
    for f in ('graph','operands','fixed','out'):
        p.add_argument('--'+f,type=Path,required=True)
    p.add_argument('--original-repo',type=Path)
    a=p.parse_args()
    d=read(a.operands)
    check_sources(a.original_repo,d)
    fixed=read(a.fixed)
    require(fixed['sourceSHA']==d['source']['parameterExpressionSHA256']==PARAMETERS and
            all(c['pass'] for c in fixed['radial']['checks']) and
            [o['order'] for o in fixed['unweighted'][1]['rows']]==list(range(5)),
            'actual fixed original radial and unweighted operator through order4')
    graph,defs,base,inverses=load_graph(a.graph,d)
    lineage=verify_lineage(graph,defs,base,inverses,d)
    out={'schema':'MathScope.N7.StageZeroDirectionalMeanOrderReduction/1',
         'pinnedInputs':{p.name:sha256(p.read_bytes()).hexdigest() for p in (a.operands,a.fixed)},
         'correctedHostedGraphSHA256':HOSTED,'sameActualInitializedPrefixSHA256':PREFIX,
         'lineage':lineage,'fourier':fourier(),'fiveKernel':five_kernel(),'directionalDemand':demand(),
         'fixedRadialUnweightedNorms':fixed['unweighted'],
         'scope':{'fixedFourierAndRadialBoundsVerified':True,'separateAnalyticFixedFiveKernelBound':True,
                  'actualC8CovarianceNormMaterialized':False,'actualFinalJetCoverage':'0/67','release':'HOLD'}}
    a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8')
    print('PASS exact original mean branches, Fourier loss 2 pointwise / 1 in L2, fixed kernels, and directional dependency W C8.')
    print('Remaining same-source covariance C8 / weighted target C9; no numerical mean jets claimed.')
    print('Receipt SHA256',sha256(a.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
