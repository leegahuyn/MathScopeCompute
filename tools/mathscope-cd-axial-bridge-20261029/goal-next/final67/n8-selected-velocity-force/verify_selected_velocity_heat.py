"""Rebind original C52 time/viscosity operands and bound two localized wave heat terms."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import sys


C71 = 'final67/n8-directed-pressure/'
C71_PIN = '7acb77db34d1bd209524818866cc6eea91991a5935253de5a990886bcbdf8493'
C71_SCRIPT_PIN = '7612f9826ee6d9319e309ae4e9a4a99c54871d405c1933e0211888bad7432aaf'
POSE = ('R','Z','T','Y0','Y1','theta')
COMPONENTS = ('r','theta','z')


def alpha(*labels):
    return tuple(labels.count(x) for x in POSE)


def pinned(path, expected):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==expected, path
    return json.loads(data)


def exact_c52_heat_slice(graph, algebra, roots, compressed):
    pairs = {(row['field'],tuple(row['orders'])):
             {kind:row[kind] for kind in ('forced','signed')} for row in compressed['sumInputs']}
    assert len(pairs)==50
    by_id = {rid:(kind,order) for (kind,order),p in pairs.items() for rid in p.values()}
    h, epsilon, radius = 9, 17732744, 17732748
    assert graph.node(h)==('source_parameter',['h'])
    assert graph.node(epsilon)==('exp',[17732743])
    assert graph.node(radius)[0]=='coordinate'

    def coefficient_from_pressure(direction):
        arms=compressed['typedIndexedPressureGradient'][0]['coefficients']
        row=next(item for item in arms if item['derivative']==direction)
        return {tuple(tuple(a) for a in mon):Q(c) for mon,c in row['coefficient']}

    a0, a1 = (coefficient_from_pressure(key) for key in ('Y0','Y1'))
    eps = {((epsilon,1),):Q(1)}
    eps2 = algebra.mul(eps,eps)
    ir2 = {((radius,-2),):Q(1)}
    bank = {
        alpha('T'):algebra.neg(eps),
        alpha('R','R'):algebra.neg(eps),
        alpha('R','Y0'):algebra.mul(algebra.scalar(-2),eps,a0),
        alpha('R','Y1'):algebra.mul(algebra.scalar(-2),eps,a1),
        alpha('Y0','Y0'):algebra.neg(algebra.mul(eps,a0,a0)),
        alpha('Y0','Y1'):algebra.mul(algebra.scalar(-2),eps,a0,a1),
        alpha('Y1','Y1'):algebra.neg(algebra.mul(eps,a1,a1)),
        alpha('Z','Z'):algebra.neg(algebra.mul(eps2,eps)),
        alpha('theta','theta'):algebra.neg(algebra.mul(eps,ir2)),
    }
    assert len(bank)==9
    entries=[]
    for root, component in zip(roots,COMPONENTS,strict=True):
        # Time and second derivatives of the explicit indexed angular
        # velocities can only occur linearly in these source rows.
        coefficients,count=defaultdict(dict),0
        for monomial,coef in algebra.of(root).items():
            tracked=[(rid,power) for rid,power in monomial if rid in by_id and by_id[rid][0]!='p'
                     and (by_id[rid][1]==alpha('T') or sum(by_id[rid][1])==2)]
            if not tracked:
                continue
            assert len(tracked)==1 and tracked[0][1]==1
            rid, _ = tracked[0]
            assert by_id[rid][0]==component
            remain=tuple(atom for atom in monomial if atom[0]!=rid)
            assert rid not in coefficients or remain not in coefficients[rid]
            coefficients[rid][remain]=coef
            count+=1
        expected={rid:poly for order,poly in bank.items()
                  for rid in pairs[component,order].values()}
        assert coefficients==expected,(root,'actual C52 direct time/viscosity coefficient discrepancy')
        assert len(coefficients)==18
        time_missing_epsilon={**expected,pairs[component,alpha('T')]['signed']:algebra.scalar(-1)}
        axial_wrong_weight={**expected,pairs[component,alpha('Z','Z')]['forced']:algebra.neg(eps2)}
        assert coefficients!=time_missing_epsilon and coefficients!=axial_wrong_weight
        entries.append({'component':component,'sourceRoot':root,'selectedExpandedMonomials':count,
                        'actualTypedLeafCount':len(coefficients),'orders':[
                            {'formalOrder':order,'nativeRoots':pairs[component,order],
                             'coefficient':[[p,str(v)] for p,v in sorted(poly.items())]}
                            for order,poly in sorted(bank.items())
                        ]})
    return {
        'entries':entries,'typedLeaves':sum(row['actualTypedLeafCount'] for row in entries),
        'directPureSlowTime': '-epsilon*partial_T of each actual indexed wave component',
        'viscositySecondSlotsOnly': '-epsilon*(Dr^2 + Dz^2 + R^-2 partial_thetatheta) at second derivative slots',
        'retainedCoefficientSources': ['original epsilon #17732744','original R #17732748',
                                      'a_fast and a_fast*(1-sqrt(2)) Laurent coefficients from C71'],
        'scope': 'Second derivative and pure T slices. First derivative fast-time, radial coefficient differentiation, lower-order cylindrical connections and all remaining terms in the full residual remain present.',
        'negativeControls': ['removed epsilon on pure T','incorrect epsilon^2 instead of epsilon^3 on ZZ'],
    }


def own_chart_caps(transport, samples):
    assert transport['fieldExponents']=={'potential':'1/2-A','velocity':'-A','pressure':'-2A'}
    assert transport['physicalDerivativeFormula'].startswith(
        'signedPairIntegerFactor * Q^(fieldExponent-j_space/2-j_time) * epsilon^(-j_time)')
    assert samples['observedSource']['systems']==[1,5]
    assert samples['observedSource']['selectedRows']==['0:1','1:1']
    assert samples['geometry']['QownOverTau0']==['1/4','4']
    assert samples['observedSource']['includedConjugates'] and samples['strictEndpoint']['comparison']==-1
    A_max=Q(1,2)+Q(1,64)
    assert A_max+1 < 2 and A_max+Q(1,2) < 2
    # The h-charge is the power of t built into the bounded quantity.
    # Each entry gives the original derivative total order and pure time count.
    ledger = [
        ('w0','velocity',0,0,0,Q(3,4)),
        ('w1','velocity',1,0,0,Q(2,5)),
        ('tw2','velocity',2,0,1,Q(3,4)),
        ('twTime','velocity',1,1,1,Q(2,5)),
        ('a0','potential',0,0,0,Q(4,3)),
        ('a1','potential',1,0,0,Q(3,4)),
        ('a2','potential',2,0,0,Q(2,5)),
        ('taTime','potential',1,1,1,Q(3,4)),
    ]
    rows=[]
    for name, field, order, tau_count, t_charge, target in ledger:
        row = transport['conditionalPhysicalDerivativeRows'][field][order]
        assert row['order']==order and row['pole']<=42
        native_eps = Q(row['epsilonUnits'],100000) - tau_count
        assert abs(native_eps)<2
        # |Q_own/tau0|^{h*native_eps} <= 4 handles either sign.
        # Two selected rows, normalization dilation <= 16, conservative
        # Cartesian component cost <= 4, and band gain conversion <= 4.
        constant = row['signedPairIntegerFactor']*2*16*4*4
        log_cost = 2*row['KSExponent']+7*row['endpointFactorExponent']+1+(constant-1).bit_length()
        effective_eps = native_eps+t_charge
        assert effective_eps-Q(log_cost,2**128)>target
        rows.append({'quantity':name,'field':field,'spatialTotalOrder':order-tau_count,
                     'timeTotalOrder':tau_count,'timeConsumesEpsilonPower':tau_count,
                     'physicalTWeight':t_charge,'sourceEpsilonPower':str(native_eps),
                     'effectivePowerOfExpMinusH':str(effective_eps),'logCostUnitsHOver2Pow128':log_cost,
                     'strictDecayPower':str(target),'originalLedger':row})
    assert [row['strictDecayPower'] for row in rows]==['3/4','2/5','3/4','2/5','4/3','3/4','2/5','3/4']
    return rows


def normalized_products():
    # Pairs are twice the constant exponent and the h coefficient
    # of the normalizing power of tau0.
    source_weights = {
        'w0':(1,1),'w1':(2,1),'w2':(3,1),'wTime':(3,1),
        'a0':(0,1),'a1':(1,1),'a2':(2,1),'aTime':(2,1),
        'K_tau':(2,0),'K_z':(1,-1),'K_zz':(2,-2),
        'K_ztau':(3,-1),'K_zzz':(3,-3),
        'Fbar':(3,2),
    }
    terms = [
        ('Fbar',('wTime',),1),('Fbar',('w2',),1),
        ('Fbar',('K_tau','w0'),1),('Fbar',('K_zz','w0'),3),
        ('Fbar',('K_z','w1'),2),('Fbar',('K_z','aTime'),2),
        ('Fbar',('K_z','a2'),2),('Fbar',('K_ztau','a0'),2),
        ('Fbar',('K_zzz','a0'),4),('Fbar',('K_zz','a1'),3),
        ('w0',('K_z','a0'),1),('w1',('K_z','w0'),1),
        ('w1',('K_z','a1'),1),('w1',('K_zz','a0'),2),
        ('Fbar',('w0','w1'),0),
    ]
    receipts=[]
    for result, factors, t in terms:
        output=source_weights[result]
        assert tuple(output[i]-sum(source_weights[k][i] for k in factors) for i in range(2))==(0,t)
        receipts.append({'result':result,'sourceNormFactors':factors,'tPower':t})
    return receipts


def localized_bounds(c66,c71,caps):
    C=c66['normalizedCutoffCaps']['physicalProductCtimesKappa']
    assert C=={'0,0':1,'0,1':12,'1,0':22,'1,1':359,'2,0':740,'3,0':55722}
    assert c71['localizedForceError']['geometryRatioAfterNormalization']=='<27 Xb^4, using Xb>1 and 4A<3'
    assert 'log(Xb^2)<H/2^128' in c71['localizedForceError']['scaleAssumptions']
    assert c66['sourceSupport']['maxStrictTransitionsAtOnePoint']==1
    exponents={row['quantity']:Q(row['strictDecayPower']) for row in caps}
    kt,k1,k2,km,k3=(C[name] for name in ('0,1','1,0','2,0','1,1','3,0'))
    terms=[
        ('twTime',1,0),('tw2',3,0),('w0',kt,1),('w0',k2,3),('w1',2*k1,2),
        ('taTime',k1,1),('a2',3*k1,2),('a0',km,2),('a0',k3,4),('a1',2*k2,3),
    ]
    velocity=[('w0',1,0),('a0',k1,1)]
    gradient=[('w1',1,0),('w0',k1,1),('a1',k1,1),('a0',k2,2)]
    def dominant(recipe, wanted):
        powers=[exponents[g]+extra for g,_,extra in recipe]
        coeff=sum(k for _,k,_ in recipe)
        log2ceil=(coeff-1).bit_length()
        assert min(powers)-Q(log2ceil,2**128)>wanted
        return {'termCount':len(recipe),'totalPositiveCoefficient':coeff,'log2CoefficientCeiling':log2ceil,
                'uncorrectedMinimumDecayPower':str(min(powers)),'strictDecayPower':str(wanted),
                'terms': [{'group':g,'coefficient':k,'additionalTPower':extra,
                           'decayPower':str(p)}
                          for (g,k,extra),p in zip(recipe,powers,strict=True)]}
    # Exact source-admitted radius and time/axial support give the same
    # <27 Xb^4 multiplier as C71. The component maximum adds factor 3.
    assert 81 < 2**7
    assert Q(2,3)-Q(9,2**128)>Q(1,2) and Q(2,5)-Q(9,2**128)>Q(1,3)
    assert Q(2**128,3)>1024
    nonlinear_decay=min(Q(1,3)-Q(1,16),Q(2,3)-Q(1,16),Q(1))
    assert nonlinear_decay==Q(13,48)
    assert 9<2**4 and nonlinear_decay-Q(4,2**128)>Q(1,4)
    assert Q(1,4)-Q(1,2**128)>Q(1,5)
    return {
        'K':'Original outer C times first-stage chi(a1*q) on the radial plateau',
        'selectedLocalizedVelocity':'v=K*w+K_z*(ez cross A) in the original stage-one gauge',
        'weight':'Fbar=tau0^(2A+1/2) f, t=tau0^h=exp(-H). Lowercase w and A are the two selected uncut waves and their genuine potential.',
        'normalizedLinearHeat':dominant(terms,Q(1,3)),
        'normalizedVelocity':dominant(velocity,Q(2,3)),
        'normalizedGradient':dominant(gradient,Q(1,3)),
        'measureFactorAndForceNormalization':'Reuse exact C71 admitted region, normalized spacetime measure and cancellation to bound the common geometric ratio by 27*Xb^4.',
        'linearHeatSquaredError':'I((-partial_tau-Delta)v) < exp(-H/2)*S_R < 2^-1024*S_R.',
        'complementBound':'Let B bound both tau0^A*|U_i| and tau0^(A+1/2)*|(grad U)_ij| on the same chart for the true localized field after removing these selected velocities. B<=exp(H/16) is sufficient for the additional nonlinear error bound.',
        'sufficientComplementGate':'In these exact units and with the retained bounds, the weaker sufficient constraint is 3*B*(exp(-H/3)+exp(-2H/3))+3*exp(-H)+exp(-H/3) <= exp(-H/5).',
        'convectiveDifference':'U dot grad v + v dot grad U + v dot grad v. With the displayed sufficient B, its normalized component cap is strictly below exp(-H/4).',
        'completeSelectedVelocityOmission':'If the required actual complement bound holds, the normalized total velocity-only force error is below exp(-H/5), and its squared integral is below exp(-H/3)*S_R<2^-1024*S_R. Pressure is held fixed.',
        'currentActualComplementBound':'OPEN',
    }


def main():
    assert __debug__
    ap=ArgumentParser(description=__doc__)
    ap.add_argument('goal_next',type=Path)
    ap.add_argument('output',type=Path)
    args=ap.parse_args()
    assert not args.output.exists()
    root=args.goal_next
    script=root/C71/'verify_directed_pressure_error.py'
    assert sha256(script.read_bytes()).hexdigest()==C71_SCRIPT_PIN
    sys.path.insert(0,str(script.parent))
    from verify_directed_pressure_error import ACTIVE, read_source

    src=read_source(root)
    sys.path.insert(0,str(root/ACTIVE))
    from verify_direct_split_closure import CompactGraph, load_exact

    c71=pinned(root/C71/'directed-pressure-error.json',C71_PIN)
    assert c71['sourcePins']['compact']['sha256']==src['compactManifest']['closureSHA256']
    assert c71['originalN3SourceGraphNodes']==22153782
    assert c71['sameFamilyAuthorities']['completeFreshIndexedDefinitionProjectionToSelectedPressures']=='OPEN'
    graph=CompactGraph(src['compact'])
    algebra=load_exact(root/'first-force-repair/verify_repaired_first_force.py')(graph)
    for index in graph.records:
        algebra.of(index)
    roots=src['compact']['roots']['directResidualControls']
    assert roots==[22153560,22153562,22153564]
    shares=exact_c52_heat_slice(graph,algebra,roots,c71)
    caps=own_chart_caps(src['transport'],src['samples'])
    result={
        'schema':'MathScope.N8.SelectedOriginalWaveHeatError/1',
        'status':'VERIFIED_C52_TYPED_HEAT_COEFFICIENTS_AND_CONDITIONAL_SELECTED_VELOCITY_FORCE_ERROR',
        'C71ReceiptSHA256':C71_PIN,'C71CheckerSHA256':C71_SCRIPT_PIN,
        'C52DirectResidualRoots':roots,'compactRecords':len(graph.records),
        'scope':{'actualFullResidualEndpoint':False,'newActualFinalJets':0,'sameOwnerLiveIndexedBinding':'OPEN'},
        'exactC52Slices':shares,'selectedSourceVelocityAndGaugeCaps':caps,
        'normalizationProducts':normalized_products(),'forceTransfer':localized_bounds(src['cutoff'],c71,caps),
        'open':['fresh exact active-N3 mapping of the two sampled velocity/gauge contributors, with same source support, generic zero extension and actual reference transport',
                'original local C67 premises on those rows including bounded original operators and exact derivative order 2',
                'actual complement velocity and gradient norm, the remaining force-scale endpoint and the four independent N8 refinements'],
        'N7_06':'OPEN','N8_05':'OPEN','finalJets':0,'release':'HOLD',
    }
    output=(json.dumps(result,indent=2,ensure_ascii=False)+'\n').encode()
    args.output.write_bytes(output)
    print(json.dumps({'typedLeaves':shares['typedLeaves'],
                      'monomials':[row['selectedExpandedMonomials'] for row in shares['entries']],
                      'caps':len(caps),'sha256':sha256(output).hexdigest()}))


if __name__=='__main__':
    main()
