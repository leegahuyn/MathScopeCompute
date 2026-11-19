"""Match the original pointwise background C10 bounds to the two live covariance pulses."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys


ACTIVE = 'primary-forced-join/active-n3-c5-binding'
BAND = ACTIVE + '/first-wave-guard-traces'
C88 = BAND + '/outer-normalized-amplitude'
PINS = {
    'original': '5571e8d0784be04e71f1b4f0531caf71578fe7a646669e958e81a3329a008eb3',
    'manifest': '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'stream': 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96',
    'registry': 'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'window': 'a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f',
    'band': 'a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b',
    'directed': 'f756d88c734373cd5a7a34684a5b1edac272298774c60d27667fc8473a1833f9',
    'leading': '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966',
    'slab': 'e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b',
    'outer': '23d3577bc75eb2a6587eb5839a7c6b9f834814e46c335c136fb165757f03aa39',
    'frame': '56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d',
}
R,Z,T,V,ELL,Q0 = 17732748,17732749,17732750,17732751,17732737,17727245
S,X,ETA,QACT = 17732766,17732770,17732775,17732776


def pinned(path, name):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name], path
    return raw


def flatten(g, root, operator):
    op, args = g.node(root)
    if op != operator:
        return [root]
    return [term for child in args for term in flatten(g, child, operator)]


def bind_background(g, exact, lexical, registry, monotone, original):
    e, E = exact, exact.of
    half = e.scalar(Fraction(1,2))
    assert g.node(ELL)[0]=='coordinate' and 'N6_global_frozen_integer_band_N3$' in g.node(ELL)[1][0]
    assert g.args(17732740,'exp')==[17732739]
    assert E(17732739)==e.neg(e.mul(E(ELL),E(127))) and g.args(127,'log_positive')==[24]
    assert g.args(S,'actual_monotone_root')==[2,Z,T]
    chart = monotone[2]
    assert [chart[key] for key in ('variable','parameters','body','left','right','derivativeLower','derivativeUpper','numericOracle')]==[
        17732756,[Z,T],17732765,19,24,19,1,False,
    ]
    assert g.args(17732760,'exp')==[17732759] and g.args(17732758,'log_positive')==[17732756]
    assert E(17732759)==e.mul(e.scalar(2),E(9),E(17732758))
    assert E(17732765)==e.sub(e.sub(E(17732756),e.mul(e.pow(E(Z),2),E(17732760))),E(T))
    assert E(X)==e.mul(half,e.pow(E(R),2),e.inv(E(S)))
    assert g.args(17732771,'log_positive')==[S] and g.args(17732773,'exp')==[17732772]
    assert E(17732772)==e.mul(e.sub(half,E(9)),E(17732771))
    assert E(ETA)==e.mul(E(Z),e.inv(E(17732773)))
    assert E(QACT)==e.mul(E(17732740),E(S))

    chart_cutoff, historical = registry[32019], registry[32012]
    actual_cutoff_digest = lexical.of(chart_cutoff['body'],tuple(chart_cutoff['parameters']))
    assert actual_cutoff_digest==lexical.of(historical['body'],tuple(historical['parameters']))
    assert g.args(chart_cutoff['body'],'smooth_piecewise')[:4]==[17732777,19,1,1]
    assert g.args(chart_cutoff['body'],'smooth_piecewise')[-1]==0
    assert all(row['derivativeLimits'][0]>=10 and not row['unspecifiedOracle'] for row in (chart_cutoff,historical))

    weights = [(1,17727273,17732792,17732793,17732798,17732799),
               (2,17727322,17732814,17732815,17732819,17732820),
               (3,17727385,17732835,17732836,17732840,17732841)]
    for n, b, sigma, chi, pwr, weight in weights:
        assert E(sigma)==e.mul(E(Q0),E(b))
        assert g.args(chi,'actual_expression_partial')==[32019,[sigma],[0]]
        [exponent]=g.args(pwr,'exp')
        assert g.args(17732796,'log_positive')==[Q0]
        assert E(exponent)==e.mul(e.scalar(2*n),E(9),E(17732796))
        assert E(weight)==e.mul(E(chi),E(pwr))
    assert E(23)==e.add(E(9),half)
    slots = []
    for field,physical,norm,root,mul,application,exp,shift in [
        ('F',32027,32020,17732934,17732886,17732902,17732885,half),
        ('G',32028,32021,17732935,17732888,17732912,17732887,e.zero),
    ]:
        d, n = registry[physical], registry[norm]
        assert d['name']==f'M3GlobalBandSlow_{field}' and n['name']==f'ActualCommonBandNormalized_{field}'
        assert d['parameters']==[R,Z,T,ELL] and n['parameters']==[Q0,4756,2]
        assert all(all(limit>=10 for limit in entry['derivativeLimits']) and not entry['unspecifiedOracle']
                   for entry in (d,n))
        assert g.args(root,'actual_expression_partial')==[physical,[R,Z,T,ELL],[0,0,0,0]]
        assert g.args(d['body'],'multiply')==[mul,application]
        assert g.args(application,'actual_expression_partial')==[norm,[QACT,X,ETA],[0,0,0]]
        assert g.args(mul,'exp')==[exp]
        assert E(exp)==e.neg(e.mul(e.add(E(23),shift),E(17732771)))
        roots = original['prefixRows']
        expected = e.add(E(roots[0][field]),
                         *(e.mul(E(row[field]),E(weight[-1])) for row,weight in zip(roots[1:],weights,strict=True)))
        assert E(n['body'])==expected
        assert len(flatten(g,n['body'],'add'))==4
        wrong = 'G' if field=='F' else 'F'
        assert E(n['body'])!=e.add(E(roots[0][wrong]),
                                  *(e.mul(E(row[wrong]),E(w[-1])) for row,w in zip(roots[1:],weights,strict=True)))
        wrong_weight = [weights[0],weights[2],weights[1]]
        assert E(n['body'])!=e.add(E(roots[0][field]),
                                  *(e.mul(E(row[field]),E(w[-1])) for row,w in zip(roots[1:],wrong_weight,strict=True)))
        slots.append({'field':field,'nativeRoot':root,'physicalSlot':physical,'normalizedSlot':norm,
                      'normalizedDomain':[Q0,4756,2],'actualProfileArguments':[QACT,X,ETA],
                      'actualSlowArguments':[R,Z,T,ELL],'normalizedBody':n['body'],
                      'coefficientRoots':[row[field] for row in roots],'multiplier':mul})
    return {'fields':slots,'cutoffIdentitySHA256':actual_cutoff_digest,
            'flatAtOne':True,'qExpScaleWeights':[dict(zip(('order','scale','argument','cutoff','power','weight'),row,strict=True))
                                                 for row in weights],
            's':S,'X':X,'eta':ETA,'q':QACT,'nativeChartBody':chart['body'],
            'frozenBandCoordinate':ELL,'swappedFieldAndOrderControlsRejected':True}


def bind_covariance(g, exact, original_pulses, outer, pulse_frame, free):
    e, E = exact, exact.of
    parameters = [R,Z,T,17732753,17732754,17732755,ELL]
    result = []
    for n, mass in enumerate(outer['positiveMasses']['sameMassAsColumns']):
        sign = mass['sign']
        frame = pulse_frame['verifiedOriginalFrames'][str(sign)]
        p, pz, x0 = map(E,(frame['p'],frame['pz'],frame['x0']))
        hr,hz = frame['HR'],frame['HZ']
        for j, f, h in [(0,17733119,17733121), (1,17733124,17733126)]:
            orders = [int(k==j) for k in range(4)]
            assert g.args(f,'actual_expression_partial')==[32027,[R,Z,T,ELL],orders]
            assert g.args(h,'actual_expression_partial')==[32028,[R,Z,T,ELL],orders]
            assert E((hr,hz)[j])==e.add(e.mul(p,E(f)),e.mul(pz,E(h)))
        nr, nt, nz = map(E,frame['n'])
        assert nr==e.sub(x0,e.mul(E(V),E(hr)))
        assert nt==e.mul(p,e.inv(E(R)))
        assert nz==e.sub(pz,e.mul(E(17732744),E(V),E(hz)))
        assert all(free(i).isdisjoint({R,Z,T,V}) for i in (frame['p'],frame['pz'],frame['x0'],17732744,17733029))
        [tsq]=g.args(frame['tau'],'sqrt_positive')
        tau,c = E(frame['tau']), E(frame['c'])
        assert E(tsq)==e.add(e.pow(nt,2),e.pow(nz,2))
        assert free(frame['c']).isdisjoint({R,Z,T})

        B = frame['B']
        assert B[0]==[1,1]
        for j, bsign in enumerate((1,-1)):
            k = e.mul(e.scalar(bsign),c,e.inv(tau))
            assert E(B[1][j])==e.add(e.neg(e.mul(nr,nt,e.pow(tau,-2))),e.mul(k,nz))
            assert E(B[2][j])==e.add(e.neg(e.mul(nr,nz,e.pow(tau,-2))),e.neg(e.mul(k,nt)))

        Gaussian = frame['P']
        assert Gaussian==mass['commonGaussian'] and free(Gaussian).isdisjoint({R,Z,T})
        length = 17733029
        assert mass['ordinaryPulse']==[0,length] and free(length).isdisjoint({R,Z,T,V})
        assert mass['normalizedVolterraComponents'] and len(mass['normalizedVolterraComponents'])==2
        w = mass['normalizedVolterraComponents']
        native = original_pulses[n]
        assert native['covariance']==n and native['variable']==V and native['parameters']==parameters
        assert native['matrix']==frame['originalMatrix'] and native['length']==length
        assert native['initial']==[1,0] and native['left']==0
        assert native['directions']==[R,Z,T] and native['directionParameterIndices']==[0,1,2]
        assert not native['matrixDerivativesSuppliedByCaller'] and not native['sourceAuthenticated']
        registered=json.loads(native['originalDefinition'])
        assert registered['name']==f'M3OwnGlobalBandPulse_{sign}'
        assert registered['matrix']==native['matrix'] and registered['parameters']==parameters
        assert registered['coefficientNormMustBeBoundBySource'] and not registered['displayedPartialSumIsExactSolution']
        for j, output in enumerate(w):
            assert g.args(output,'actual_covariance_volterra')==[n,j,V,parameters]
        tangent = [mass['positiveTangentR'],*mass['tangentialFrame']]
        for row, root in zip(B,tangent,strict=True):
            assert E(root)==e.mul(E(Gaussian),e.dot(list(map(E,row)),list(map(E,w))))
        result.append({'sign':sign,'system':n,'parameters':parameters,'length':length,'B':B,'P':Gaussian,
                       'n':frame['n'],'tau':frame['tau'],'profileGradientRZ':[hr,hz],
                       'actualTangent':tangent,'actualHaarMass':mass['mass'],'GaussianFixedSlow':True,
                       'nativeInternalSourceAuthenticated':native['sourceAuthenticated']})
    assert [r['sign'] for r in result]==[1,-1]
    return result


def verify(args):
    goal=args.goal
    sys.path[:0]=[str(goal/ACTIVE/'spatial-readback'),str(goal/ACTIVE/'live-wave-gauge/signed'),
                  str(goal/'first-force-repair'),str(goal/BAND/'weighted-haar-shell/gaussian'),
                  str(goal/C88),str(goal/C88/'pulse-frame')]
    import source_stream
    import source_cache
    from check_gaussian_shell import Graph
    from verify_repaired_first_force import Exact
    from verify_live_outer_source import SourceDigest, encode
    from verify_all_label_pulse import make_free

    runtime=args.runtime/'research-ide/mathscope-m3/navier'
    pinned(runtime/'source-global-band.mjs','band')
    window=pinned(runtime/'global-source-index.mjs','window')
    assert b'ell<=floor(log2(b_(N+1)))-1' in window
    original=json.loads(pinned(args.original,'original'))
    prior=json.loads(pinned(goal/'final67/live-background-c10/positive-c10-directed.json','directed'))
    lead=json.loads(pinned(goal/'whole-k-annular-wrz-norm/numerical/background-c8-complete.json','leading'))
    slab=json.loads(pinned(goal/'final67/local-background-c8/c8-slab.json','slab'))
    assert list(lead['leadingOrdinaryC10'])==['F0','U0'] and prior['leadingSHA']==PINS['leading']
    assert prior['localSHA']==PINS['slab'] and prior['chartMultiplier']['pointwiseBound']=='2^1867*Hc^143'
    assert [row['n'] for row in prior['rows']]==[1,2,3]
    assert prior['candidateFullC10']['combinedComparison']==-1 and not prior['actualNativeOperandTransport']
    assert prior['packetSHA']=='9055845283de393d17c0ce34e79afb58e2dc4bac9632f7369d4acdfb7c862342'
    assert 'gates' in slab

    outer=json.loads(pinned(goal/C88/'outer-live.json','outer'))
    pulse=json.loads(pinned(goal/C88/'pulse-frame/pulse-frame-caps-final.json','frame'))
    folder=args.artifact/'first-correction-spatial-source'
    manifest=json.loads(pinned(folder/source_stream.MANIFEST,'manifest'))
    native=source_stream.Native(folder,manifest)
    assert native.pin==PINS['registry']
    stream=source_cache.load(source_stream,folder,manifest,22153782,args.cache)
    try:
        assert stream.count==22155584 and stream.verify['sha256']==PINS['stream']
        g=Graph(stream)
        h=sha256()
        for i in range(original['sourceCount']):
            op,params=g.node(i)
            h.update(encode({'op':op,'args':params})+b'\n')
        assert original['sourceCount']==123870 and h.hexdigest()==original['prefixSHA']
        base=native.base_snapshot['base']
        registry=json.loads(base['expression'])
        exact=Exact(g)
        bound=bind_background(g,exact,SourceDigest(stream.record,registry),registry,json.loads(base['monotone']),original)
        families=bind_covariance(g,exact,json.loads(base['m3GlobalPulses']),outer,pulse,make_free(stream))
    finally:
        stream.__exit__()

    profile_cap={'coefficientFactor':'2^1867*max(2,Lambda,Renv)^143',
                 'leadingEndpoints':lead['leadingOrdinaryC10'],
                 'positiveUnweightedEndpoints':[row['envelope']['upper'] for row in prior['rows']],
                 'liveSlabDirectedEndpoint':prior['candidateFullC10']['upper']['upper'],
                 'originalStrictBudgetComparisonOnLiveSlab':-1}
    return {'status':'VERIFIED_ORIGINAL_N3_BACKGROUND_AND_HAAR_FRAME_OPERAND_TRANSPORT',
            'inputPins':PINS,'sourceNodes':22155584,'leadingAndCoefficientPrefixNodes':123870,
            'actualBackground':bound,'actualCovarianceFamilies':families,
            'pointwiseInputCap':profile_cap,
            'scope':{'originalPrimitiveAndChartPremisesRetained':True,'derivativeOrder':10,
                     'fixedCoordinates':[ELL,17732753,17732754,17732755],
                     'admittedN3Window':'s in [1/2,2], X in [Xa/2,2Xb], |eta|<=1, ell in original N3 integer window.',
                     'unweightedTransfer':'q=Q*s<1 on the admitted window, and n>=4 is flat zero by the original selector inequality. The normalized cutoff weights already retain the original q^(2nh), whose upper can be replaced by 1.',
                     'directedSmallerCap':'Only on qBig/64 <= q < qBig/16, with q<=2*tau0 and the authenticated leading and integral bounds.',
                     'closedEta':'Ordinary interior derivatives, inward eta limits on the closed faces.',
                     'nativeOperandTransport':True,'nativeWholeBandNumericalGradientsEnclosed':False},
            'finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for field in ('goal','runtime','artifact','cache','original','out'):
        parser.add_argument('--'+field,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        parser.error('Python assertions are required')
    result=verify(args)
    with args.out.open('x',encoding='utf-8',newline='\n') as output:
        json.dump(result,output,indent=2)
        output.write('\n')
    print(result['status'])
