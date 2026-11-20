"""Attach the original compact beta_ZZTT donor to the Signed axial pressure."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import comb, factorial
from pathlib import Path
import runpy


INPUTS = {
    'demand': ('continuation119/signed-time-covariance/final/signed-time-dependencies.json', 'b79de2c9bd9737b6aec215c0af95af8dc56eab644383d81e77bea9859d63fce9'),
    'sigma': ('continuation108/early-sigma-c6/final/verify_sigma_c6.py', 'f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8'),
    'mean': ('continuation103/initialized-mean/final/verify_initialized_mean.py', '7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe'),
    'whole': ('continuation97/middle-covariance/premean/final/verify_premean_whole_path.py', '0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f'),
    'c98': ('continuation98/covariance/final/global-primary-covariance.json', '05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'),
    'fiveMap': ('continuation97/middle-five-map/after-temporal-five-map.json', '3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102'),
    'profile': ('continuation102/mode-one-attachment/final/verify_mode_one_attachment.py', '32e360aa6f7449772151622bc6528681f013eba81cc39a0e7c8e70b529540554'),
    'geometry': ('continuation102/mode-one-attachment/final/mode-one-attachment.json', '84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e'),
    'weighted': ('continuation102/signed-weighted-mean/final/signed-weighted-mean.json', '6c9830a81a121c0b1cbd76c1a06cc9bc87774f22ba694cfb8ccb4da5fa4f7f26'),
    'c106': ('continuation106/high-compact-mode-one/compact-mode-one-c15.json', '00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884'),
    'signed': ('continuation99/signed-pressure/signed-pressure-flux.json', '8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942'),
}
RUNTIME = {
    'source-global-initial-mean.mjs':'cde60a57a820915c1403d8ce7b13fdbf8e75cb33e5821c8423ab9ac569fcd584',
    'source-updated-mean-pressure.mjs':'6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07',
    'source-full-mean-equations.mjs':'2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76',
    'source-global-moment.mjs':'c4cb5abe7aae54393bc3ed0ce3b7a39b26ef2c36719693545adca654b15fe741',
}
TARGET = ('beta', (0,2,2,0))


def pinned(path, sha):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == sha, path
    return data


def source_bind(runtime):
    markers = {
      'source-global-initial-mean.mjs': (
        'actualInputDefects={P:afterTemporal.mean.P,Jtheta:afterTemporal.mean.Jtheta,Jz:afterTemporal.mean.Jz}',
        'Jtheta:G.mul(power(s,G.sub(G.mul(q(2),A),q(3,2))),actualInputDefects.Jtheta)',
        'axialTarget:G.neg(targets.Jtheta)',
        "gammaDesired=shareGlobalScalar(G,G.add(...coefficients.axial.map((c,j)=>G.mul(c,b.copies[j].inQ)))",
        'integrand=G.substitute(weighted,R,r),primitive=G.integral(integrand,r,geometry.innerRadius,R)',
        'whole=G.integral(integrand,r,geometry.innerRadius,geometry.outerRadius),psi=G.div(primitive,R)',
        'rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))',
        'The exact homogeneous p=1 row gives the retained whole integral zero',
        'temporal.inverses.theta.exactZeroMode===G.zero&&'),
      'source-updated-mean-pressure.mjs': ('whole(exactNormalizedHaar(G,raw.fluxTheta,Y))',),
      'source-full-mean-equations.mjs': (
        'time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))',
        'gr=G.add(G.neg(time(beta))',
        'fluxTheta=G.mul(G.pow(R,2),G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz))'),
      'source-global-moment.mjs': (
        'gap=G.sub(G.one,axialRatio),r=G.div(axialTarget,axialFactors[1])',
        'axial=[G.div(r,gap),G.neg(G.div(r,G.mul(axialNode,gap)))]',
        'G.add(G.one,G.pow(band.chart.eta,2))',
        'G.substitute(profile,x,G.div(R,G.sqrt(s)))'),
    }
    result = {}
    for module, digest in RUNTIME.items():
        source = pinned(runtime / module, digest).decode()
        result[module] = []
        for marker in markers[module]:
            assert marker in source, (module, marker)
            result[module].append([source[:source.index(marker)].count('\n')+1,marker])
    return result


def exact_product():
    # Four separate ordinary jet factors: J_theta, s^(2A-3/2), (1+eta^2),
    # and the original R-weighted primitive of one transported bump.
    base = ((0,0),)*4
    iterative = {base:1}
    for axis in (0,1,0,1,0):
        new = Counter()
        for row, value in iterative.items():
            for k, orders in enumerate(row):
                changed = tuple(v+(j==axis) for j,v in enumerate(orders))
                new[row[:k]+(changed,)+row[k+1:]] += value
        iterative = dict(new)
    closed = {}
    for zfirst in product(range(4), repeat=3):
        for tfirst in product(range(3), repeat=3):
            last = (3-sum(zfirst),2-sum(tfirst))
            if min(last)<0:
                continue
            index = (*zip(zfirst,tfirst),last)
            divisor = 1
            for z,t in index:
                divisor *= factorial(z)*factorial(t)
            closed[index] = factorial(3)*factorial(2)//divisor
    assert iterative == closed
    assert (len(closed),sum(closed.values())) == (200,4**5)
    # A polynomial witness for the moving s factor. If J=Z^2*T^2 and
    # s_power=Z, the mixed jet is 3!*2!, while s_power frozen at its
    # value at the origin would give zero. All other factors are one.
    assert closed[((2,2),(1,0),(0,0),(0,0))]*factorial(2)*factorial(2)==12
    assert closed[((3,2),(0,0),(0,0),(0,0))]==1
    return {'formalJetProductsPerOriginalCopy':200,'totalMultiplicityPerCopy':4**5,
            'sourceAxialCopies':2,'movingScalePolynomialNonzeroControl':12,
            'sourceDerivativeBeforeBetaPrefactor':[3,2]}


def main(goal,runtime):
    modules={}
    for name,(rel,digest) in INPUTS.items():
        path=goal/rel
        body=pinned(path,digest)
        modules[name]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(body)
    m=modules
    src=source_bind(runtime)
    demand=m['demand']
    assert demand['roots']==[22001223,22001224,22000443]
    assert demand['fixedEndpoints']==[17743711,17743713]
    traces=demand['originalSourceTraces']
    locations=sorted((q,reg) for q,row in traces.items() for reg,data in row.items()
                     if ['beta',[0,2,2]] in data['compactMean'])
    assert locations==[('(0, 1, 1)','inner'),('(0, 1, 1)','middle'),('(0, 1, 1)','outer')]
    assert ['pressureDensity',[0,2,1]] in traces['(0, 1, 1)']['middle']['pressureAndSignedPrimitives']
    sigma_source=pinned(goal/INPUTS['sigma'][0],INPUTS['sigma'][1]).decode()
    assert 'scalar(bt(sh(a,2)),eps=E)' in sigma_source
    assert 'if collar and not always:' in sigma_source
    assert '(Q(7,2) if f=="beta" else Q(1,2))+3*sum(a),0,54920)' in sigma_source
    assert m['signed']['native']['actualResidualUsesIncrementalPressureZ']==22000443
    five=m['fiveMap']
    assert [five['sourceDefinitions'][k] for k in ('Jtheta','gamma','beta')]==[21374531,21374926,21374944]
    assert [five['beta'][k] for k in ('integral','nativeGammaZ','wholeGammaMomentZero')]==[21374941,21374939,True]
    assert five['fiveMapCoefficients']['axial']==[21374903,21374905]
    assert five['fiveMapCoefficients']['fiveZeroNumerators']
    assert five['radialEndpoints']==demand['fixedEndpoints']
    assert five['haarGroups'][1]['body']==21374528
    assert five['haarGroups'][1]['total']==24
    assert [five['haarGroups'][1]['groups'][k]['terms'] for k in ('linearTemporalZero','plainCovariance','temporalQuadratic')]==[12,1,11]
    assert five['haarGroups'][1]['covarianceSlotsAndOrders']==[[21374495,4,[0,0,0,0,0]]]
    assert five['conditionalBounds']['liveChart']['sDependsOnZ']
    assert five['conditionalBounds']['liveChart']['s']==17732766

    requests,linear,products=m['mean']['compact_demand']([TARGET])
    assert requests=={'P':set(),'Jz':set(),'Jtheta':set(product(range(4),range(3)))}
    temporal,sets=m['mean']['whole_recipe'](m['whole'])
    rows=[]
    for name,order,f,b,g,c,extra,multiplicity in products:
        assert name=='Jtheta' and f=='v' and g=='gamma' and not extra
        left,right=temporal(f,b),temporal(g,c)
        grade=Q(left['minEpsilon'])+Q(right['minEpsilon'])
        surplus=Q(left['bandIntercept'])+Q(right['bandIntercept'])-Q(1,2)
        rows.append({'moment':name,'order':order,'left':[f,b,left],'right':[g,c,right],
                     'multiplicity':multiplicity,'epsilon':str(grade),'bandSurplus':str(surplus)})
    assert len(rows)==60 and sum(row['multiplicity'] for row in rows)==105
    assert sum(row['multiplicity'] for row in rows if row['order']==(0,3,2,0))==32
    assert len(linear)==12 and all(f=='W_thetaz' for f,_ in linear)
    W,primitives,chi,inverse=sets
    covariance=W|linear
    maxima=[max(a[i] for _,a in covariance) for i in range(4)]
    assert len(covariance)==267 and maxima==[1,5,2,3]
    assert max(sum(a[:3]) for _,a in covariance)==7
    assert len(primitives)==66 and len(chi)==27 and len(inverse)==48 and max(map(sum,chi))==6
    assert set(f[2:] for f,_ in covariance)<=set(m['c98']['sameLiveCovariance']['authenticatedComponents'])
    assert m['c98']['coefficientBudget']['wholePathCovarianceLogCap']=='H/2^113'
    assert m['c98']['ordinaryDerivativeBudget']['mixedDirections']==1080
    assert m['c98']['ordinaryDerivativeBudget']['radialRows'][-1]['slowOrder']==7
    higher={p for p in covariance if sum(p[1][:3])>7 or p[1][3]>8}
    assert not higher
    grade=min(Q(row['epsilon']) for row in rows)
    surplus=max(Q(row['bandSurplus']) for row in rows)
    assert grade==Q(99999,50000) and surplus==Q(23,2)
    max_mass=max(Q(r[k][2]['coefficientMass']) for r in rows for k in ('left','right'))
    max_geom=max(r[k][2]['geometryPower'] for r in rows for k in ('left','right'))
    assert max_mass==Q(4013020,3) and max_mass<2**21 and max_geom==7
    geom=m['geometry']['extendedCutoffGeometry']
    assert geom['order']==9 and max(geom['coefficientLog2Ceilings'].values())<256
    mean_rank=2**15+max_geom*256+21+64
    assert (grade-1)/2>Q(2*mean_rank+4096,2**128)+surplus/2**32636
    d={'fiveMap':five,'crop':{'gradeAbsorption':{'minimumQuadraticEpsilonByMoment':{'Jtheta':str(grade)},
          'maximumQuadraticBandSurplusBeforeAbsorption':{'Jtheta':str(surplus)}}}}
    compact=m['profile']['compact_budget'](d,mean_rank,mean_rank,geom)
    assert compact['motionOfSRetained'] and compact['compactZeroOnBothSourceCollars']
    assert compact['compactIndependentOfL'] and compact['linearCompactCovarianceUsesOnlyC7']
    assert compact['higherBumpDerivativeIntegerCaps']==m['c106']['coefficientProfile']['higherBumpDerivativeIntegerCaps'][:8]
    assert compact['compactChargeInHOver2Pow128']<m['c106']['coefficientProfile']['compactChargeInHOver2Pow128']
    comp=m['weighted']['complement']
    assert comp['domain']=='u>1/128 and d>1/32 on the admitted open annulus'
    assert comp['compactProductSupport'].startswith('e*X0<X<e^2*X0')
    assert comp['inverseZetaSquareCost']=='<2^61440'
    assert 30720*2**129<2**(4096*510)
    compact_charge=compact['compactChargeInHOver2Pow128']
    weighted_charge=compact_charge+1
    assert weighted_charge<54920<2**16
    exponent=Q(7,2)+3*4
    assert exponent==Q(31,2)
    return {
      'schema':'MathScope.C119.OriginalCompactFiveMapBetaZZTTForSignedPressure/1',
      'status':'VERIFIED_EXACT_ORIGINAL_SOURCE_TRANSFER_CONDITIONAL_ON_PRIOR_C98_AND_ORDINARY_SOURCE',
      'pins':{k:v[1] for k,v in INPUTS.items()},'runtimePins':RUNTIME,'originalSourceAnchors':src,
      'sourceUse':{'signedTargets':[22001223,22001224],'incrementalAxialPressure':22000443,
        'betaRoot':21374944,'primitive':21374941,'GammaZ':21374939,'gammaRoot':21374926,
        'postTemporalJtheta':21374531,'axialCoefficients':[21374903,21374905],
        'nativeRadialEndpoints':five['radialEndpoints'],'weightedSigmaRequest':[0,1,1],
        'pressureDensityDerivative':[0,2,1],'term':'epsilon*partial_T(beta_F)',
        'retainsWholePressureRecentering':True,'sourceSigmaRegions':[r for _,r in locations]},
      'ordinaryInput':{'name':'beta','RZTL':[0,2,2,0],'productFormula':exact_product(),
        'zeroNormalizedWholeAxialRow':True,'bothCollarsExactlyZero':True,
        'outerPhysicalSupport':'e*X0<X<e^2*X0','realCompactProfilesAndScalesRetained':True},
      'C103SelectedExpansion':{'JthetaZT':sorted(requests['Jtheta']),'linearCovariance':sorted(linear),
        'quadraticHaarProducts':rows,'quadraticMultiplicity':sum(r['multiplicity'] for r in rows),
        'all267CovarianceRows':sorted(covariance),'perAxisMaximumRZTL':maxima,'maxTotalSlow':7,
        'requiredBeyondOriginalC98':sorted(higher),'cutoffMaxOrder':6,
        'sourceRadialPrimitiveRows':66,'sourceFFTInverseRows':48,
        'JthetaQuadraticMinEpsilon':str(grade),'JthetaQuadraticBandSurplus':str(surplus)},
      'bound':{'conditionalEpsilonGrade':'2','bandPower':str(exponent),'weight':'zeta','radialPole':0,
        'compactLogChargeInHOver2Pow128':compact_charge,'oneGaussianLogChargeInHOver2Pow128':weighted_charge,
        'sourceSignedAvailableChargeInHOver2Pow128':54920,'commonLogCap':'H/2^112',
        'JthetaTemporalOperandCharge':mean_rank,'normalizedProfileReplay':compact,
        'linearPressureDensityContributionEpsilonGrade':'3',
        'premises':'C98 admitted original fixed-label Primary covariance, ordinary Temporal FFT and radial differentiation, actual smooth moving s and flat compact source support'},
      'fullSignedMixedTargets':'OPEN','finalJets':0,'release':'HOLD'
    }


if __name__=='__main__':
    p=ArgumentParser(description=__doc__)
    for k in ('goal','runtime','out'):
        p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args()
    report=main(a.goal,a.runtime)
    with a.out.open('xb') as out:
        out.write((json.dumps(report,indent=2)+'\n').encode())
    print('PASS original compact beta_ZZTT, 267 C98 covariances, 60 Haar products, log charge',
          report['bound']['oneGaussianLogChargeInHOver2Pow128'])
