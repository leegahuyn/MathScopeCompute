"""Exact C52 indexed pressure projection and conditional sampled force-square error."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import sys


ACTIVE = 'primary-forced-join/active-n3-c5-binding/'
C52 = ACTIVE+'hosted-44541601028/'
PINS = {
    'compact': (C52+'direct-split-arithmetic-closure.json',
                '51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a'),
    'compactManifest': (C52+'direct-split-arithmetic-manifest.json',
                        '2952e2ba02c3973e9221e58fb8a3d63e2f56e73f8e6833bc513b3db29d3f9b4c'),
    'split': (C52+'independent-direct-split.json',
              'bc91034dffc735ef809dc9c4efd21e6ae6efa21c4af48ae0a027d2ba31110455'),
    'domains': (C52+'domains/direct-domains.json',
                '9710a61866abf6f258c88a2f7678b28bfaba7d50d7f679c535cdde8442ee7d6c'),
    'transport': (ACTIVE+'endpoint/time-phase/n3-time-carrier-and-physical.json',
                  'ed1773d48e36dcc629f93d5b54fc77cd85ff123d24cb6de50b0e85dfe4d5efc2'),
    'samples': ('final67/selected-mode-two-spatial/sample-endpoints-final.json',
                '166d3d834d4f9c9e6a1a8404ab67212a9d9dc22268f1dafad5f544625542ffec'),
    'cutoff': ('final67/annular-force-transfer/annular-force-transfer.json',
               '50700c098492c356731c52aa85c74a56c383b58ed57b2d9fc7a70d45514b9e8e'),
    'C8': ('final67/local-background-c8/c8-slab.json',
           'e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b'),
    'C8Program': ('final67/local-background-c8/verify_c8_slab.mjs',
                  'e409469db00ac80e376d0a5c47d416d75f451b9dd8050c8a88cf25f4e4fe9d61'),
    'scale': ('final67/active-n3-cap-transport/source-cap/cap-transport.json',
              '387863daedfc9fd37f7c1d43db430235238f94d23b767424baffa5d2f3348955'),
    'annulus': ('whole-k-core-force/annular-slow-force-energy.json',
                'c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37'),
}
REPORT_PINS = ('708b9948acfbd2496f5213eee714aa84a12926f7e97561663d568ba4512f561d',
               '160c99aaada4417e87993b8ff906288661960be9642485824b9ef1ec98798ddf')
POSE = ('R','Z','T','Y0','Y1','theta')
D1 = {direction:tuple(int(i==j) for i in range(6)) for j,direction in enumerate(POSE)}
PRESSURE_DIRECTIONS = ('R','Z','Y0','Y1','theta')
FIELDS = {9: ('r','forced'), 10: ('theta','forced'), 11: ('z','forced'), 12: ('p','forced'),
          16: ('r','signed'), 17: ('theta','signed'), 18: ('z','signed'), 19: ('p','signed')}


def read_pinned(path, digest):
    body = path.read_bytes()
    assert sha256(body).hexdigest() == digest, path
    return json.loads(body)


def read_source(goal):
    result = {key:read_pinned(goal/path,pin) for key,(path,pin) in PINS.items() if key != 'C8Program'}
    path, pin = PINS['C8Program']
    evaluator = (goal / path).read_bytes()
    assert sha256(evaluator).hexdigest() == pin
    result['C8Program'] = evaluator.decode()
    return result


def find_indexed_atoms(graph, c52):
    apps = defaultdict(dict)
    actual = [17732748,17732749,17732750,17732737,17745430,17745431,17732752]
    for idx in c52['opaqueOriginalIds']:
        op, args = graph.node(idx)
        if op != 'm3_coupled_indexed_partial':
            continue
        family, arguments, alpha = args
        prefix, number = family.split(':')
        assert prefix == 'coupled-field' and arguments == actual and len(alpha) == len(POSE)
        kind, which = FIELDS[int(number)]
        pair = apps[(kind, tuple(alpha))]
        assert which not in pair
        pair[which] = idx
    assert len(apps) == 50 and all(set(pair)=={'forced','signed'} for pair in apps.values())
    assert {alpha for kind,alpha in apps if kind=='p'} == {D1[d] for d in PRESSURE_DIRECTIONS}
    assert all(sum(kind==component for kind,_ in apps)==15 for component in ('r','theta','z'))
    return apps, actual


def reduce_indexed_arms(algebra, roots, pairs):
    replacements = {ids['forced']:-1000-i for i,ids in enumerate(pairs.values())}
    forced = {ids['forced'] for ids in pairs.values()}
    signed = {ids['signed'] for ids in pairs.values()}
    expansions = {replacements[pair['forced']]:tuple(pair.values()) for pair in pairs.values()}
    v = lambda idx: {((idx,1),):Q(1)}
    out = []

    def expand(poly, pairing):
        result = {}
        for monomial, value in poly.items():
            terms = [algebra.scalar(value)]
            for atom, power in monomial:
                if atom in pairing:
                    assert power >= 1
                    terms.append(algebra.pow(algebra.add(*(v(q) for q in pairing[atom])), power))
                else:
                    terms.append({((atom,power),):Q(1)})
            result = algebra.add(result,algebra.mul(*terms))
        return result

    first_pressure = replacements[pairs[('p',D1['R'])]['forced']]
    altered = {**expansions, first_pressure: (
        pairs[('p',D1['R'])]['forced'],pairs[('p',D1['Z'])]['signed'])}
    for rid in roots:
        original = algebra.of(rid)
        assert all(power>=1 for term in original for atom,power in term if atom in forced or atom in signed)
        retained = {}
        for monomial, value in original.items():
            if any(atom in signed for atom,_ in monomial):
                continue
            new = tuple(sorted((replacements.get(atom,atom),power) for atom,power in monomial))
            assert new not in retained
            retained[new] = value
        assert expand(retained, expansions)==original
        if rid == roots[0]:
            assert expand(retained, altered)!=original
        out.append({'root':rid,'originalMonomials':len(original),'groupedMonomials':len(retained),
                    'explicitIndexedDegree':max(sum(p for x,p in k if x in expansions) for k in retained)})
    return out


def isolate_pressure(graph, algebra, roots, pairs):
    all_ids = {idx for (kind,_),v in pairs.items() if kind=='p' for idx in v.values()}
    by_monomial = lambda *idx: tuple(sorted(idx))
    coordinate = by_monomial((17732748,-1))
    c = by_monomial((17732748,-1),(17734062,1),(17745444,1))
    clog = by_monomial(*c,(17733017,-1),(17734042,1))
    a = {clog:Q(2), by_monomial(*clog,(9,1)):Q(2),
         by_monomial(*c,(9,1)):Q(-1,50000)}
    one_minus_sqrt_two = {():Q(1),((3622,1),):Q(-1)}
    expected = [
        {'R':algebra.one, 'Y0':a, 'Y1':algebra.mul(a,one_minus_sqrt_two)},
        {'theta':{coordinate:Q(1)}},
        {'Z':{((17732744,1),):Q(1)}},
    ]
    assert graph.node(9)==('source_parameter',['h'])
    assert graph.node(3622)==('sqrt_positive',[24])
    assert graph.node(24)==('rational',['2','1'])
    assert graph.node(17733017)==('log_positive',[14220487])
    assert graph.node(17734042)==('log_positive',[17734041])
    assert graph.node(17732744)==('exp',[17732743])
    assert graph.node(17734062)==('exp',[17734061])
    assert graph.node(17745444)==('exp',[17745443])
    rows=[]
    for rid, directions in zip(roots,expected,strict=True):
        terms = algebra.of(rid)
        coefficients, count = defaultdict(dict), 0
        for factors, coefficient in terms.items():
            part = [(idx,power) for idx,power in factors if idx in all_ids]
            if not part:
                continue
            assert len(part)==1 and part[0][1]==1
            (idx, power), = part
            count += 1
            coefficients[idx][tuple(at for at in factors if at[0]!=idx)] = coefficient
        expected_coeff = {idx:weight for direction,weight in directions.items()
                          for idx in pairs['p',D1[direction]].values()}
        assert coefficients==expected_coeff
        rows.append({'root':rid, 'exactPressureMonomials':count, 'coefficients':[
            {'derivative':var, 'pairedNativeRoots':pairs['p',D1[var]],
             'coefficient':[[list(power),str(v)] for power,v in sorted(polynomial.items())]}
            for var,polynomial in directions.items()
        ]})
    assert [row['exactPressureMonomials'] for row in rows]==[20,2,2]
    assert algebra.sub(expected[0]['Y1'],a), 'wrong Y1 direction control'
    return rows


def compare_reports(current, archive):
    assert current['status']=='VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED'
    assert current['full']['nodes']==21999237 and current['prefix']==archive['prefix']==3
    assert current['normRoots']==archive['normRoots']
    selection = [row for row in current['full']['rows'] if row['harmonic']==2 and row['key'] in ('0:1','1:1')]
    assert len(selection)==2
    assert [(x['key'],x['system']) for x in selection]==[(x['key'],x['system']) for x in archive['rows']]==[('0:1',1),('1:1',5)]
    assert selection[0]==archive['rows'][0]
    new, old = selection[1], archive['rows'][1]
    assert set(new)==set(old)
    exceptions = {'H_w','originalSource','projected'}
    assert {key for key in new if new[key]!=old[key]}==exceptions
    changed = []
    for key in sorted(exceptions):
        def scalar_ids(row):
            if key=='H_w':
                return row[key]
            return [value[part] for value in row[key] for part in ('real','imaginary')]
        active_ids, older_ids = scalar_ids(new), scalar_ids(old)
        assert all(prior-actual==30 for actual,prior in zip(active_ids,older_ids,strict=True))
        changed.append({'role':key,'prior':older_ids,'C52':active_ids,'structuralNativeEqualityStillRequired':True})
    return {
        'reportSHA256':REPORT_PINS,
        'system1':'Exact equality of every saved typed input and role field across the two hosted receipts.',
        'system5':'Only three saved operand groups change IDs. Their constant offset is a recorded diagnostic.',
        'system5ChangedGroups':changed,
        'completeFreshIndexedDefinitionProjectionToSelectedPressures':'OPEN',
    }


def pressure_bounds(source):
    c67, transport, c8 = (source[k] for k in ('samples','transport','C8'))
    assert c67['sourcePins']['physicalModeTwoTransport']==PINS['transport'][1]
    assert c67['sourcePins']['liveC8']==PINS['C8'][1]
    assert c67['sourcePins']['referenceSpatialCap']==PINS['scale'][1]
    assert c67['observedSource']['selectedRows']==['0:1','1:1']
    assert c67['observedSource']['systems']==[1,5] and c67['observedSource']['includedConjugates'] is True
    assert c67['observedSource']['archivedFormalActualFrameVerified'] is True
    assert c67['strictEndpoint']['comparison']==-1 and c67['halfPole']['commonPole']==42
    assert c67['geometry']['QownOverTau0']==['1/4','4']
    assert [x['key'] for x in transport['sourceSlots']]==['0:1','1:1']
    assert all(row['comparisons']['smallGrowth128']==-1 for row in c8['localBudget'])
    assert c8['roots']['norm']==18310069 and c67['observedSource']['K']==18310069
    A_hi=Q(1,2)+Q(1,64)
    assert 2*A_hi+Q(1,2) < 2
    all_rows = transport['conditionalPhysicalDerivativeRows']['pressure'][:2]
    goals = [Q(4,3),Q(3,4)]
    output=[]
    for j,row in enumerate(all_rows):
        assert row['order']==j and row['pole']<=42
        # two selected rows, own-to-tau0 dilation <= 4^2, Cartesian
        # component factor <= 4, and epsilon^gamma conversion <= 4.
        integer = row['signedPairIntegerFactor'] * 2 * 16 * 4 * 4
        integer_pow=(integer-1).bit_length()
        log_cost=2*row['KSExponent']+7*row['endpointFactorExponent']+1+integer_pow
        exponent=Q(row['epsilonUnits'],100000)
        assert 0<exponent<2
        assert exponent - Q(log_cost,2**128) > goals[j]
        output.append({'order':j, 'pinnedRow':row,'ownToTau0Factor':16,'integerFactor':integer,
                       'logChargeUnitsHOver2Pow128':log_cost,'strictDecayPower':str(goals[j])})
    assert [row['logChargeUnitsHOver2Pow128'] for row in output]==[2990,3916]
    return output


def localized_force_error(source):
    cutoff=source['cutoff']['normalizedCutoffCaps']['physicalProductCtimesKappa']
    assert cutoff['0,0']==1 and cutoff['1,0']==22
    units = source['cutoff']['normalizedEndpoint']['sourceNormWeights']['tau0ExponentPairsConstantDoubled']
    assert {k:units[k] for k in ('F','P','T_z')} == {'F':[3,1], 'P':[2,2], 'T_z':[1,-1]}
    evaluator = source['C8Program']
    assert "smallGrowth128:cutAt('1/340282366920938463463374607431768211456',6)" in evaluator
    assert "const smallOtherBackground=[q('2'),q('40320')]" in evaluator
    assert 'const budgetAux=N.max([...smallOtherBackground,' in evaluator
    assert 'const localMax=closed(N.max([budgetAux,upperOnly(row.localSlowC8)]))' in evaluator
    scale = source['scale']['propagatorToOriginalPhysicalGain']['sourceInequalities']
    assert 'H_gain>h*Bnorm^512/2' in scale and 'Bnorm>=max(2^128,C12EnvelopeR^4096)' in scale
    assert any('>8002*T_parameter=log(h^-1)' in line for line in scale)
    geometry=source['annulus']['geometry']
    assert 'Xa<=X<=Xb' in geometry['coordinateDomain'] and '1/2<=rho<=1' in geometry['coordinateDomain']
    assert geometry['sliceMap']['rSquared']=='2*tau0*Q*Y/Lambda'
    assert 'axial and mixed derivatives retained' in geometry['outerCutoffSpatialDerivatives']
    measure = 4*Q(22,7)*Q(99,70)/2
    assert 2 < Q(99,70)**2 and measure==Q(2178,245)
    assert 3*measure < 27
    assert Q(4)* (Q(1,2)+Q(1,64))<3
    # tau0 exponent pairs are doubled constant coefficient and h coefficient.
    normalized_force=(3,2)
    pressure=(2,2)
    axial_cutoff_derivative=(1,-1)
    assert [value-pressure[j]-axial_cutoff_derivative[j] for j,value in enumerate(normalized_force)]==[0,1]
    assert Q(3,4)-Q(2,3)==Q(1,12) and 23<2**5 and Q(2**128,12)>5
    assert Q(4,3)-Q(2+7,2**128)>1 and 81<2**7 and 2**128>1024
    relative=Q(1,2**256)
    absolute=(1+1/relative)*Q(1,2**1024)
    assert absolute<Q(1,2**767)
    # If the 22*t factor were instead assigned an inverse t, the
    # preserved source decay would only give exp(-H/3), not exp(-2H/3).
    assert Q(4,3)-1 < Q(2,3)
    return {
        'scope':'Active N3 annular portion, fixed admitted two selected original signed mode-two pressure contributions and unchanged other fields.',
        'normalization':'Fbar=tau0^(2A+1/2) f = t*tau0^(A+1) f; pbar=tau0^(2A)*p, t=exp(-H).',
        'exactAdditionalForce':'If selected pressure is omitted from full stage-one increment, delta f=grad(C*chi(a1*q)*pSelected). All velocity, remaining pressure and state are fixed.',
        'axialCutoffMixedProduct':'Fbar_z contains t*(tau0^D K_z)*pbar. K=C*chi(a1*q).',
        'coarseSum':'max_i abs(delta Fbar_i) < exp(-3H/4) + 22 exp(-7H/3) < exp(-2H/3).',
        'annularNormalizedMeasureUpper':'(2178/245)*tau0*Xb',
        'measureRationale':'r^2<=4*tau0*Xb, length in z/z0 < sqrt(2)<99/70, length in tau/tau0 <= 1/2, pi<22/7.',
        'forceScaleRatio':'S_R/tau0=(B_h^4/(4A))*Xb^(-4A)*exp(2H), positive B_h>1.',
        'geometryRatioAfterNormalization':'<27 Xb^4, using Xb>1 and 4A<3',
        'scaleAssumptions':'The source has log(Xb^2)<H/2^128 (C63 bound exceeds its constant operands). C62 gives H>Bnorm^511/2 with Bnorm>=2^128, so log(2)<H/2^128.',
        'ownPressureErrorSquare':'0<=I(delta f)<exp(-H)*S_R<2^-1024*S_R.',
        'endpointNotation':'I(f) is the original normalized spacetime force square over the relevant admitted region.',
        'relativeAndAbsoluteFullSquareTransfer':'|I(f)-I(fhat)| < 2^-256 I(fhat) + 2^-767 S_R.',
        'relativeTransferDerivation':'Apply Young to 2 inner_product(fhat,delta f) with parameter 2^-256, and retain I(delta f). Does not presume the unknown full force magnitude.',
        'targetEndpointComplete':False,
    }


def main():
    assert __debug__
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('goal_next',type=Path)
    parser.add_argument('current_full_forced_report',type=Path)
    parser.add_argument('archived_selected_report',type=Path)
    parser.add_argument('output',type=Path)
    args=parser.parse_args()
    assert not args.output.exists()
    source=read_source(args.goal_next)
    compact, manifest, split = (source[key] for key in ('compact','compactManifest','split'))
    assert manifest['closureSHA256']==split['closureSHA256']==PINS['compact'][1]
    assert manifest['sourceGraphNodes']==compact['sourceGraphNodes']==22153782
    assert manifest['originalPrivatePDESealRevalidated'] is True and split['zeroPolynomials']==4
    assert split['actualConservativeResidualProvedZero'] is False
    assert [x['id'] for x in source['domains']['rows']]==compact['denominatorOriginalIds']
    sys.path.insert(0,str(args.goal_next/ACTIVE))
    from verify_direct_split_closure import CompactGraph, load_exact

    graph=CompactGraph(compact)
    algebra=load_exact(args.goal_next/'first-force-repair/verify_repaired_first_force.py')(graph)
    for index in graph.records:
        algebra.of(index)
    pairs, actual = find_indexed_atoms(graph,compact)
    roots=compact['roots']['directResidualControls']
    assert roots==[22153560,22153562,22153564] and roots==split['roots']['directResidualControls']
    projected=isolate_pressure(graph,algebra,roots,pairs)
    reduced=reduce_indexed_arms(algebra,roots,pairs)
    reports=compare_reports(read_pinned(args.current_full_forced_report,REPORT_PINS[0]),
                            read_pinned(args.archived_selected_report,REPORT_PINS[1]))
    result={
        'schema':'MathScope.N8.OriginalActiveAnnularPressureDirectedError/1',
        'status':'VERIFIED_C52_PRESSURE_PROJECTION_AND_CONDITIONAL_SELECTED_PRESSURE_FORCE_SQUARE_ERROR',
        'sourcePins':{key:{'path':path,'sha256':pin} for key,(path,pin) in PINS.items()},
        'sameFamilyAuthorities':reports,
        'originalN3SourceGraphNodes':22153782,
        'compactOriginalRecords':len(graph.records),
        'explicitIndexedNativeAtoms':100,
        'exactPairedIndexedSums':50,
        'pairedSameActualArguments':actual,
        'nativeDirections':POSE,
        'sumInputs':[{'field':kind,'orders':orders,**ids} for (kind,orders),ids in sorted(pairs.items())],
        'typedIndexedPressureGradient':projected,
        'groupedOriginalDirectResidual':reduced,
        'pressureDerivativeFormula':'(p_R+a_fast*(p_Y0+(1-sqrt(2))*p_Y1), p_theta/R, epsilon*p_Z). Five directional sums remain for complete explicit indexed pressure.',
        'pressureLogarithmicBounds':pressure_bounds(source),
        'localizedForceError':localized_force_error(source),
        'remaining':[
            'Exact fresh active source binding of selected pressure partials into the complete indexed C52 field, including system5 reassociation.',
            'Original ordinary zero extension, reference transport, and reapplication of the C67 coefficient hypotheses.',
            'Unselected complete wave pressure, the refreshed mean pressure, the actual residual magnitude and subsequent correction states.',
            'Full N8-05 independent mesh, Fourier, degree and precision refinements and the final 67 actual intervals.',
        ],
        'N7_06':'OPEN','N8_05':'OPEN','actualNumericalResidualIntervals':0,'finalJets':0,'release':'HOLD',
    }
    data=(json.dumps(result,indent=2,ensure_ascii=False)+'\n').encode()
    args.output.write_bytes(data)
    print(json.dumps({'pairs':len(pairs),'pressureMonomials':[x['exactPressureMonomials'] for x in projected],
                      'groupedMonomials':[x['groupedMonomials'] for x in reduced],
                      'sha256':sha256(data).hexdigest()}))


if __name__=='__main__':
    main()
