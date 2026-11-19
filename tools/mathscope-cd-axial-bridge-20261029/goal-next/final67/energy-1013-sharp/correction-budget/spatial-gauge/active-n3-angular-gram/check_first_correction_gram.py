"""Same-live mean, Forced and Signed angular energy/dissipation Gram."""
from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from pathlib import Path
import json
import sys

PINS={
    'cross':'f2ce47b2822ee0ae07fb907fa62479d96e310ea10048f6ac449785732b479c02',
    'join':'30c381af72215313fcceb4dd8cb150681a7b4a6469798f9fbc62c2513f282cc8',
    'signed':'429918bd2cd4a167bcbc8e76e7d04b42b6ac11e4a2dbaa7ec06e14caffcd19ef',
    'signedLocal':'7e494388cecfb1cdfa8c22732491063135af4947ee9b667f37f0ce25d4604aec',
    'fourier':'582eda176935ded2bd2a3f7243281c29f28b45c698185ceb106d21aa9aeca11f',
    'ingress':'20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'cacheCode':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'readerCode':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
}
SOURCE='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
THETA=17732752
K=17732747


def actual_bindings(graph,cross,join,signed,old_signed,five,ingress,registry):
    assert graph.verify['sha256']==cross['source']['sha256']==join['stream']['sha256']==signed['sourceStreamSHA256']==SOURCE
    assert signed['registrySHA256']==PINS['registry']
    assert signed['signedLocalReceiptSHA256']==PINS['signedLocal']
    assert signed['ingressSHA256']==join['ingressSHA256']==PINS['ingress']
    assert signed['hostedRun']==join['run']==five['source']['liveRun']==44582875351
    assert signed['actualOperands']['k']==cross['source']['waveNumberK']==K
    assert graph.record(THETA)=={'op':'coordinate','args':['m3_global_band_angle$1207477']}
    expr,fields,inverse,pulse,_=json.loads(registry['definitions'])
    aux=registry['base']
    local=json.loads(aux['expressionDefinitions'])
    native=json.loads(aux['base']['expression'])
    original_aux_inverse=json.loads(aux['inverseDefinitions'])
    primitive=['add','multiply','smooth_piecewise','maximum']
    unary=['inverse','sqrt_positive','log_positive','exp','sine','cosine','ceiling',
           'integer_power','source_step_derivative']
    reached=set()
    native_calls=set()

    @cache
    def theta_free(i):
        if i<=THETA:
            return i!=THETA
        reached.add(i)
        rec=graph.record(i)
        op,a=rec['op'],rec['args']
        if op in ('rational','coordinate','source_parameter'):
            return True
        if op in primitive:
            kids=a
        elif op in unary:
            kids=a[:1]
        elif op=='definite_integral':
            assert a[1]!=THETA
            kids=[a[0],a[2],a[3]]
        elif op in ('m3_coupled_expression_partial','m3_aux_expression_partial','actual_expression_partial'):
            system,values,orders=a
            defn=(expr[int(system.split(':')[1])] if isinstance(system,str)
                  else local[-1-system] if system<0 else native[system])
            assert len(defn['parameters'])==len(values)==len(orders)
            kids=values
            native_calls.add(i)
        elif op in ('m3_aux_inverse_partial','m3_coupled_inverse_partial'):
            system,values,orders=a
            defn=(inverse[int(system.split(':')[1])] if isinstance(system,str) else original_aux_inverse[system])
            assert len(defn['parameters'])==len(values)
            kids=values
            native_calls.add(i)
        elif op=='m3_forced_pulse_partial':
            system,_,_,v,values,orders=a
            assert len(pulse[system]['parameters'])==len(values)
            kids=[v,*values]
            native_calls.add(i)
        elif op=='actual_monotone_root':
            kids=a[1] if isinstance(a[1],list) else a[1:]
        elif op in ('actual_covariance_volterra','m3_global_pulse_jet'):
            kids=[a[2],*a[3]]
        else:
            raise AssertionError((i,op,a))
        assert all(type(k) is int and k<i for k in kids),(i,op,kids)
        return all(theta_free(k) for k in kids)

    def field_app(root,name):
        v=graph.record(root)
        op,args=v['op'],v['args']
        assert op=='m3_coupled_indexed_partial'
        system,values,orders=args
        f=fields[int(system.split(':')[1])]
        assert f['id']==system and f['name']==name and f['parameters']==values
        assert len(f['rows'])==162 and orders==[0]*6
        return f

    originals=join['originalVelocityAssembly']
    assert [r['U'] for r in originals]==ingress['normalizedRoots']['U']
    old_cases={r['key']:r for r in old_signed['cases']}
    literal=cross['source']['literalPhaseRoots']
    mapped={r['key']:r for r in ingress['wave']['perTemplate']}
    assert len(old_cases)==len(mapped)==len(literal)==10
    expected_roots={int(i) for i in literal}
    signed_coefficients=[]
    for row in signed['cases']:
        old=old_cases[row['key']]
        assert old['sameCandidatePhaseAndGuards'] and old['carrier']==row['carrier']==K
        assert old['phase']==mapped[row['key']]['phase']==row['phase'] and row['phase'] in expected_roots
        assert all(c['sameSevenGuards'] for c in row['components']) and len(old['guards'])==7
        roots=[part for pair in old['actualVelocityCoefficients'] for part in pair.values()]
        assert len(roots)==6 and all(theta_free(x) for x in roots)
        assert all(theta_free(x) for guard in old['guards'] for x in guard)
        signed_coefficients.append({'key':row['key'],'phase':row['phase'],
                                    'p':literal[str(row['phase'])]['thetaSlope'],
                                    'omega':cross['source']['nonzeroIntegerCarrierNodes'][str(literal[str(row['phase'])]['thetaSlope'])]['omega'],
                                    'positiveMode':1,'signedOwnChartVelocityCoefficients':old['actualVelocityCoefficients']})
    assert len(signed_coefficients)==10
    row_operands=set()
    for j,row in enumerate(originals):
        signed_field=field_app(row['signedWave'],'GenericSigned162_velocity_'+str(j))
        forced_field=field_app(row['forcedFullWave'],'ActualForcedCurrent_velocity_'+str(j))
        for a,b in zip(signed_field['rows'],forced_field['rows'],strict=True):
            for fld in ('values','guards','label'):
                assert a[fld]==b[fld],(j,fld)
            assert a['values'].count(THETA)==1
            row_operands.update(k for k in a['values'] if k!=THETA)
            row_operands.update(k for lim in a['guards'] for k in lim)
            row_operands.update([a['coefficient'],b['coefficient']])
    assert all(theta_free(x) for x in row_operands)
    mean_ids=[row['meanIncrement'] for row in originals]
    assert mean_ids==[22153217,22153219,22153221] and all(theta_free(x) for x in mean_ids)
    return {'actualFirstCorrection':originals,'actualNetMeanZeroMode':mean_ids,
            'netMeanContext':'Actual retained mean increment includes its original Temporal and FiveMap contributions and baseline subtraction.',
            'phaseSharedForcedSigned':signed_coefficients,'nativeApplicationsChecked':len(native_calls),
            'checkedNodesAfterNativeTheta':len(reached),'checkedSharedOuterMapOperands':len(row_operands),
            'sourceGraph':graph.verify}


def zadd(a,b):
    return (a[0]+b[0],a[1]+b[1])


def zmul(a,b):
    return (a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0])


def conj(a):
    return (a[0],-a[1])


def gram(x,y,N=None):
    total=Q(0),Q(0)
    for n,a in x.items():
        for m,b in y.items():
            if n==m or (N is not None and (n-m)%N==0):
                for u,v in zip(a,b,strict=True):
                    total=zadd(total,zmul(u,conj(v)))
    assert total[1]==0
    return total[0]


def grouped(mode_records):
    pairs=defaultdict(lambda:[(Q(0),Q(0)) for _ in mode_records[0][1]])
    for mode,coeff in mode_records:
        assert type(mode) is int and mode!=0
        for src,zs in ((mode,coeff),(-mode,[conj(c) for c in coeff])):
            pairs[src]=[zadd(x,y) for x,y in zip(pairs[src],zs,strict=True)]
    return dict(pairs)


def numerical_controls():
    # Gaussian rational coefficients here are exact controls for the
    # Gram algorithm, never replacements for unmeasured source values.
    Z=lambda a,b=0:(Q(a),Q(b))
    A,B,C=[Z(1,2)],[Z(3,-1)],[Z(-1,2)]
    # Same-label fundamental collision and a signed opposite-carrier
    # collision with another label's second harmonic.
    forced=grouped([(6,A),(2*(-3),B)])
    signed=grouped([(6,C)])
    mean={0:[Z(5)]}
    combined=grouped([(6,A),(-6,B),(6,C)])
    assert gram(mean,forced)==gram(mean,signed)==0
    assert gram(forced,signed)==4
    assert gram(combined,combined)==gram(forced,forced)+gram(signed,signed)+2*gram(forced,signed)
    assert gram(mean,forced,6)!=0 and gram(mean,forced,13)==0
    J=lambda r,t,z: (Z(-t),Z(r),Z(0))
    u=(2,0,1)
    j=J(*u)
    assert j==(Z(0),Z(2),Z(0))
    covariant=[zadd(zmul(Z(0,6),Z(x)),y) for x,y in zip(u,j,strict=True)]
    assert covariant==[Z(0,12),Z(2),Z(0,6)]
    return {'sameAndCrossLabelMerge':'n=6 with Forced mode1 on omega=6 and Forced mode2 on omega=-3; Signed on omega=6',
            'forcedSignedCrossInControl':str(gram(forced,signed)),
            'sixPointAliasingControl':str(gram(mean,forced,6)),
            'thirteenPointControl':str(gram(mean,forced,13)),
            'nonzeroCylindricalConnectionControl':[(str(a),str(b)) for a,b in covariant]}


def main():
    cli=ArgumentParser(description=__doc__)
    cli.add_argument('goal',type=Path)
    cli.add_argument('artifact',type=Path)
    cli.add_argument('cache',type=Path)
    cli.add_argument('out',type=Path)
    args=cli.parse_args()
    goal=args.goal
    runner=args.artifact
    hosted=runner/'first-correction-spatial-source'
    native=goal/'primary-forced-join/active-n3-c5-binding'
    signed=native/'live-wave-gauge/signed'
    reader=native/'spatial-readback'
    gauge=goal/'final67/energy-1013-sharp/correction-budget/spatial-gauge'
    paths={
        'cross':gauge/'active-n3-angular-cross/angular-cross-final.json',
        'join':gauge/'active-n3-angular-cross/wave-join-parent.json',
        'signed':signed/'signed-wave-reduction.json','signedLocal':signed/'signed-local-curl.json',
        'fourier':gauge/'active-n3-five-map-fourier/fivemap-fourier-verified.json',
        'ingress':runner/'first-correction-spatial-ingress.json',
        'registry':hosted/'original-source-functions.json','manifest':hosted/'original-source-export-manifest.json',
        'cacheCode':signed/'source_cache.py','readerCode':reader/'verify_spatial_artifact.py',
    }
    raw={k:p.read_bytes() for k,p in paths.items()}
    for k in ('cacheCode','readerCode'):
        raw[k] = raw[k].replace(b'\r\n',b'\n')
    for k,v in raw.items():
        assert sha256(v).hexdigest()==PINS[k],k
    sys.path[:0]=[str(signed),str(reader)]
    import source_cache
    import verify_spatial_artifact
    prefix=22153782
    manifest=json.loads(raw['manifest'])
    assert manifest['node_count']==22155584 and manifest['node_stream_sha256']==SOURCE
    graph=source_cache.load(verify_spatial_artifact,hosted,manifest,prefix,args.cache)
    try:
        actual=actual_bindings(graph,*(json.loads(raw[k]) for k in
            ('cross','join','signed','signedLocal','fourier','ingress','registry')))
    finally:
        graph.__exit__(None,None,None)
    result={
        'status':'VERIFIED_ACTUAL_FIRST_CORRECTION_ANGULAR_GRAM_CONDITIONAL_ON_SMOOTH_GUARDS',
        'sourcePins':PINS,'sourceBindings':actual,'exactControls':numerical_controls(),
        'harmonicGram':{
            'field':'Uncut direct first correction is M + W_F + W_S, where W_F is full first Forced wave minus initialized wave and M is actual net mean.',
            'modeZero':'M includes the actual Temporal and FiveMap corrections with the initialized mean subtracted; θ-free even with original auxiliary Y.',
            'nonzeroBasis':'Each guarded own row has signed frequencies ±m*omega for m in {1,2} (Forced-only), ±omega (Signed-only), with a shared phase on the same row.',
            'grouping':'Use each own field and its original physical weight. Multiply its positive relative coefficient by exp(i*m*k*phi_offset), assign n=m*omega, and add conjugate at -n. Sum coefficients by the literal signed integer n across all contributing labels and pieces before squaring.',
            'kineticDensity':'On dtheta/(2*pi): |M|^2 + 2*sum_{n>0}|F_n+S_n|^2; kinetic energy includes a separate factor 1/2 if used by the experiment.',
            'dissipationDensity':'On dtheta/(2*pi): ||G_0(M)||_F^2 + 2*sum_{n>0}||G_n(F_n+S_n)||_F^2, where G_n(c)=[D_r c, (i*n*c+J*c)/r, D_z c] in the original orthonormal cylindrical basis.',
            'forcedSignedPairing':'2*Re sum_{n>0}<F_n,S_n>; multiply by 2 to obtain the cross contribution to the full squared norm. Replace coefficients by G_n for the dissipation pairing.',
            'guards':'All typed guard and selector functions used here are theta-independent; degree calculation and ordinary differentiation are on the original admitted smooth branches and joins.',
            'discreteAlias':'Uniform N-node quadrature also retains the otherwise omitted pairs with n≠m yet n-m divisible by N. The exact matched-frequency table excludes those pairs; no data claim about a finite raw grid.',
            'connection':'J(r,theta,z)=(-theta,r,0) includes its action even at n=0; basis rotation cancels inside the full vector/Frobenius contractions.',
        },
        'remaining':['numerical interval values for all wave and mean coefficients and their ordinary derivatives along the admitted physical radial/time grid',
                     'outer cutoffs, complete N7 energy identity including work, and later correction cycles',
                     'whole final N8 experiment, source numerical endpoints and final jets'],
        'finalJets':0,'n8ComparisonsCompleted':0,'release':'HOLD',
    }
    with args.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    main()
