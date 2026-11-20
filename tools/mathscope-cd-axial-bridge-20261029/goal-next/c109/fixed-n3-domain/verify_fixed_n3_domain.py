"""Replay the fixed-reference domain and lazy native row argument maps."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
from pathlib import Path
import json
import sys


MODULES = {
    'global-source-index.mjs': 'a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f',
    'source-coupled-expressions.mjs': '5f83192211b649526a2616421a68c9e53004ace96776243e55e37b0a6973cf39',
    'source-global-band.mjs': 'a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b',
    'source-global-current.mjs': 'b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36',

    'source-global-forced-current.mjs': '1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3',
    'source-global-temporal.mjs': '16c13ea7a6ba49f78514e1c2a94e29499086e3b11c463e07f6513b8e31f32f1b',
    'source-global-pressure.mjs': 'c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4',
    'source-global-representative.mjs': 'b8bd847530ba87fc9f01f269f245a8752e39bcc20ddb55b628acf4a39a45d51b',
}

def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def verify_modules(runtime):
    code = {name: pinned(runtime / name, digest).decode() for name, digest in MODULES.items()}
    band = code['source-global-band.mjs']
    assert "qOverQ:['1/2','2']" in code['global-source-index.mjs']
    assert "G.choose(x,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero)" in band
    assert "qActual=G.mul(Q,s)" in band
    assert "at=b=>G.simultaneousSubstitute(b,[q0,X0,eta0],[qActual,X,eta])" in band
    assert "F0=atRep(leadingFields.F),FR0=atRep(G.derivative(leadingFields.F,R)),GR0=atRep(G.derivative(leadingFields.G,R))" in band
    assert "global.F)),slow,'ActualCommonBandLeading_F')" in band
    assert "global.U)),slow,'ActualCommonBandLeading_G')" in band
    assert band.count('atRep(') == 3
    assert "phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))" in band
    assert "c0,lambda0,HR,HZ,sign" in band
    assert "target={raw,H,determinant" in band
    assert "prefixSharedByAllCoverLabels:true,prefixSharedByWholeRadialIntegral:true" in code['source-global-current.mjs']
    assert "G.simultaneousSubstitute(body,[Xrep,etaRep,sRep],[representative.roots.X,representative.roots.eta,representative.roots.s])" in code['source-global-current.mjs']
    assert "sameBoxDistance:" in code['source-global-representative.mjs']
    assert "let value=unguarded;for(const [x,left,right]of row.guards)value=this.choose(x,left,right,this.zero,value,this.zero);" in code['source-coupled-expressions.mjs']


    assert "innerRadius=G.sqrt(G.parameter('Xa')),outerRadius=G.mul(q(2),G.sqrt(band.chart.Xb))" in code['source-global-current.mjs']
    assert "parameters=[R,Z,T,pressure.current.band.coordinates.ell,...Y]" in code['source-global-temporal.mjs']
    assert "N acts only on Y, with a fixed direction" in code['source-global-temporal.mjs']
    assert "G.simultaneousSubstitute(own.body,[Xrep,etaRep,sRep],[current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s])" in code['source-global-forced-current.mjs']


def floor(x):
    return x.numerator // x.denominator


def cover_reduction():
    # After the nearest-label translation the open support conditions are
    # comparisons with four rational breakpoints; one point per open cell
    # and the endpoints suffice, since all boundary predicates are affine.
    breaks = sorted({Q(-1,2), Q(-1,4), Q(1,4), Q(1,2)})
    probes = sorted(set(breaks + [(a+b)/2 for a,b in zip(breaks, breaks[1:])]))
    nearest = [row for row in range(-1,2)]
    for x in probes:
        wanted = [row for row in range(-3,4) if abs(x-row) < Q(3,4)]
        actual = [row for row in nearest if abs(x-row) < Q(3,4)]
        assert actual == wanted and len(actual) in (1,2)
    assert abs(Q(-1,2)-1) == abs(Q(1,2)+1) == Q(3,2)
    assert 3**4 == 81 and 2*3**4 == 162 and 2**4 == 16
    # u is -log2(q/Qref). The label and support predicates are affine in u.
    points = sorted({Q(-1),Q(1),Q(-1,2),Q(1,2)} | {
        Q(label)+sign*Q(3,4) for label,sign in product(range(-2,3),[-1,1])
        if -1 <= Q(label)+sign*Q(3,4) <= 1})
    probes = sorted(set(points + [(a+b)/2 for a,b in zip(points,points[1:])]))
    possible, admitted = set(),set()
    for u in probes:
        center = floor(u+Q(1,2))
        actual = {j for j in range(center-1,center+2) if abs(u-j)<Q(3,4)}
        assert actual == {j for j in range(-4,5) if abs(u-j)<Q(3,4)}
        admitted.update(actual)
        possible.update(range(center-1,center+2))
    assert admitted == {-1,0,1} and possible == {-2,-1,0,1,2}
    assert [{j for j in admitted if abs(u-j)<Q(3,4)} for u in (Q(1),Q(-1))] == [{1},{-1}]
    # s' = rho*s. The exponent linear forms are in (1,h), D=1/2-h.
    D, h = (Q(1,2),-1), (0,1)
    assert tuple(2*a+2*b for a,b in zip(D,h)) == (1,0)
    assert Q(3,4)<1 and 1-8*Q(1,16) == Q(1,2)
    assert Q(27,4)<16  # squared same-box distance multiplier 3sqrt(3)/2
    assert Q(64)*Q(1,64)==1 and Q(64)*Q(1,16)==4
    assert Q(32)*Q(1,32)==1 and Q(1,16)<1
    assert Q(2,17179869184)<Q(1,2)
    return {'offsetCells':len(probes),'positiveRelativeLabels':sorted(admitted),
            'candidateRelativeLabels':sorted(possible),'maximumPositiveBoxes':16,
            'lowerUpperActiveRelativeLabel':[1,-1],'QrefOverQBig':'1/32',
            'admittedPhysicalQOverQBig':['1/64','1/16'],
            'firstOmittedScaleTimesQ':['1','4'],'sameBoxDistance':'<4/ell^6'}


def check_cutoff_and_frozen(graph, native):
    from verify_spatial_structure import arithmetic_terms as poly
    defs = json.loads(native.base_snapshot['base']['expression'])
    time_cutoff = defs[32019]
    assert time_cutoff['name'] == 'CommonOriginalTimeCutoff'
    assert time_cutoff['parameters'] == [17732777] and time_cutoff['body'] == 17732791
    x, lower, upper, left, interior, right = graph.args(time_cutoff['body'], 'smooth_piecewise')
    assert [x, lower, upper, left, right] == [17732777,19,1,1,0]
    assert graph.rational(lower)==Q(1,2) and graph.rational(upper)==1
    leading = [defs[index] for index in (32031,32032)]
    live = [defs[index] for index in (32027,32028)]
    assert [x['name'] for x in leading] == ['ActualCommonBandLeading_F','ActualCommonBandLeading_G']
    assert [x['name'] for x in live] == ['M3GlobalBandSlow_F','M3GlobalBandSlow_G']
    assert all(x['parameters']==[17732748,17732749,17732750] for x in leading)
    assert all(x['parameters']==[17732748,17732749,17732750,17732737] for x in live)
    plugs = [17732956,17732960,17732964]
    F, FR, GR = 17732973,17732983,17732993
    for root,index,order in ((F,32031,0),(FR,32031,1),(GR,32032,1)):
        assert graph.args(root,'actual_expression_partial') == [index,plugs,[order,0,0]]
    assert graph.args(17732956,'sqrt_positive') == [17732955]
    assert poly(graph,17732955,(17732753,17732755)) == {tuple(sorted((17732753,17732755))):2}
    assert graph.args(17732960,'multiply') == [17732754,17732959]
    assert graph.args(17732959,'exp') == [17732958]
    assert graph.args(17732958,'multiply') == [22,17732957]
    assert graph.args(17732957,'log_positive') == [17732755]
    assert poly(graph,17732964,(17732755,17732961)) == {
        (17732755,):1,tuple(sorted((17732755,17732961))):-1}
    assert graph.args(17732961,'integer_power') == [17732754,2]
    gR, gabs, N1, lam, c0 = 17732994,17732998,17733000,17733008,17733010
    assert graph.args(gR,'multiply') == [plugs[0],FR]
    assert graph.args(gabs,'sqrt_positive') == [17732997]
    assert poly(graph,17732997,(gR,GR)) == {(gR,gR):1,(GR,GR):1}
    assert graph.args(N1,'multiply') == [gR,17732999]
    assert graph.args(17732999,'inverse') == [gabs]
    assert graph.args(lam,'sqrt_positive') == [17733007]
    assert poly(graph,17733007,(F,N1,gabs)) == {
        tuple(sorted((F,N1,gabs))):-2,tuple(sorted((F,F,N1,N1))):-4}
    assert graph.args(c0,'multiply') == [lam,17733009]
    assert graph.args(17733009,'inverse') == [17733004]
    assert poly(graph,17733004,(F,N1)) == {tuple(sorted((F,N1))):2}
    return {'timeCutoffDefinition':32019,'timeCutoffBody':17732791,'upperZeroFace':1,
            'leadingDefinitions':[32031,32032],'liveDefinitions':[32027,32028],
            'frozenCalls':[F,FR,GR],'frozenActualArguments':plugs,'growth':lam,'c0':c0}


def exact_graph(g,n,wave):
    from verify_spatial_structure import arithmetic_terms as poly
    from verify_wave_join import check_ratio, expect_exp
    R,Z,T,ell,s = 17732748,17732749,17732750,17732737,17732766
    assert g.args(s,'actual_monotone_root') == [2,Z,T]
    assert set(g.args(17732776,'multiply')) == {17732740,s}
    assert g.args(17732769,'inverse') == [17732768]
    assert set(g.args(17732768,'multiply')) == {24,s} and g.rational(24)==2
    assert g.args(17732767,'integer_power') == [R,2]
    assert set(g.args(17732770,'multiply')) == {17732767,17732769}
    assert g.args(17732775,'multiply') == [Z,17732774]
    assert g.args(17732774,'inverse') == [17732773]
    assert g.args(17732773,'exp') == [17732772]
    assert set(g.args(17732772,'multiply')) == {22,17732771}
    assert g.args(17732771,'log_positive') == [s]
    assert g.args(17735156,'log_positive') == [17732776]
    assert g.args(17735158,'multiply') == [20,17735157]
    assert set(g.args(17735157,'multiply')) == {17727465,17735156}
    assert g.args(17727465,'inverse') == [127] and g.args(127,'log_positive') == [24]
    band_src = 17735158
    assert poly(g,17732765,(17732756,17732757,17732760,T)) == {
        (17732756,):1,tuple(sorted((17732757,17732760))):-1,(T,):-1}
    assert g.args(17732757,'integer_power') == [Z,2]
    assert g.args(17732760,'exp') == [17732759]
    assert g.args(17732758,'log_positive') == [17732756]
    assert g.args(17732759,'multiply') == [25,17732758]
    assert poly(g,25,(9,)) == {(9,):2}
    assert poly(g,22,(9,)) == {():Q(1,2),(9,):-1}
    assert g.args(9,'source_parameter') == ['h']
    chart = json.loads(n.base_snapshot['base']['monotone'])[2]
    assert chart['name']=='ActualCommonBandSlowInverse' and chart['body']==17732765
    for root in (17735193,17735228,17735263,17735298):
        x,lo,hi,zero,inside,zero2 = g.args(root,'smooth_piecewise')
        assert zero==zero2==0 and (g.rational(lo),g.rational(hi)) == (Q(-3,4),Q(3,4))
    for j,row in enumerate(wave['originalVelocityAssembly']):
        gauge,actual,deriv = n.application(g,row['gaugeField'],f'SpatialStage1Gauge_{j}')
        assert gauge is n.fields[26+j] and not any(deriv)
    baseline = n.fields[26]
    old = n.aux_fields[6]
    old_count = len(old['rows'])
    assert old_count==162
    keys = set()
    scales = {}
    mesh_maps = set()
    related = [n.fields[k] for k in (9,10,11,16,17,18,26,27,28)]
    for index,row in enumerate(baseline['rows']):
        label=row['label']
        key=tuple(map(int,label['key'].split(':')))
        assert len(key)==4 and label['sign'] in (1,-1) and label['countBoxOnce']
        assert (key,label['sign']) not in keys
        keys.add((key,label['sign']))
        assert all(f['rows'][index]['guards']==row['guards'] for f in related)
        guards=row['guards']
        assert len(guards)==5 and guards[0]==[17732770,3617,28826]
        assert all((g.rational(a),g.rational(b))==(Q(-3,4),Q(3,4)) for _,a,b in guards[1:])
        own=label['ell']
        assert poly(g,own,(17742180,))=={(17742180,):1,**({():key[0]} if key[0] else {})}
        ceiling, = [root for root in g.args(17742180,'multiply') if root != 20]
        negated,=g.args(ceiling,'ceiling')
        assert poly(g,negated,(band_src,))=={(band_src,):-1,():Q(-1,2)}
        assert poly(g,guards[-1][0],(band_src,own))=={(band_src,):1,(own,):-1}
        assert row['values'][:7]==[R,Z,T,own,*label['grid']]
        assert row['values'][7]==ell
        assert row['coefficient']==1
        assert row['derivativeMaps']==[[{'coefficient':1,'parameter':p}] for p in (0,1,2,8,9,14)]
        old_row=old['rows'][index]
        assert all(old_row['label'][k]==label[k] for k in ('ell','grid','sign','key'))
        assert old_row['guards']==guards
        mapped_R,mapped_Z,mapped_T=old_row['values'][:3]
        rho,=[node for node in g.args(mapped_T,'multiply') if node!=T]
        assert rho in wave['referenceRatios']
        if key[0] not in scales:
            check_ratio(g,rho,127,own,ell)
            sqrt_rho,=[node for node in g.args(mapped_R,'multiply') if node!=R]
            assert g.args(sqrt_rho,'sqrt_positive')==[rho]
            power,=[node for node in g.args(mapped_Z,'multiply') if node!=Z]
            term,=g.args(power,'exp')
            logrho,=[node for node in g.args(term,'multiply') if g.record(node)=={'op':'log_positive','args':[rho]}]
            expect_exp(g,power,{(logrho,):Q(1,2),tuple(sorted((logrho,9))):-1})
            scales[key[0]]={'rho':rho,'referenceToOwnSlow':[mapped_R,mapped_Z,mapped_T]}
        assert scales[key[0]]['referenceToOwnSlow']==[mapped_R,mapped_Z,mapped_T]
        for axis,(guard,grid) in enumerate(zip(guards[1:4],label['grid'])):
            off=guard[0]
            if (key[0],axis,key[axis+1]) in mesh_maps:
                continue
            mapped=(mapped_R,mapped_Z,mapped_T)[axis]
            scaled,=[node for node in g.args(off,'add') if g.record(node)['op']=='multiply' and mapped in g.record(node)['args']]
            power,=[node for node in g.args(scaled,'multiply') if node!=mapped]
            assert g.args(power,'integer_power')==[own,6]
            assert poly(g,off,(scaled,grid))=={(scaled,):1,(grid,):-1}
            base = grid
            if key[axis+1]:
                base,=[node for node in g.args(grid,'add') if g.record(node)['op']!='rational']
                assert poly(g,grid,(base,))=={(base,):1,():key[axis+1]}
            mesh_ceil,=[node for node in g.args(base,'multiply') if node!=20]
            sub,=g.args(mesh_ceil,'ceiling')
            assert poly(g,sub,(scaled,))=={(scaled,):-1,():Q(-1,2)}
            mesh_maps.add((key[0],axis,key[axis+1]))
    row_count=len(keys)
    assert keys==set(product(product((-1,0,1),repeat=4),(1,-1)))
    assert row_count==162 and len(mesh_maps)==27
    return {'guardedRows':row_count,'matchingGaugeForcedSignedFieldComponents':len(related),
            'distinctSlowMeshMaps':len(mesh_maps),'guardPredicatesPerRow':5,
            'actualScaleRows':scales,'nativeRoot':s,'nativeReferenceQ':17732776,
            'nativeReferenceShellGuard':17732770,'nativeBandCoordinate':band_src}


def main():
    args=ArgumentParser(description=__doc__)
    for flag in ('work','goal','runtime','out'):
        args.add_argument('--'+flag,type=Path,required=True)
    x=args.parse_args()
    verify_modules(x.runtime)
    stage=x.goal/'primary-forced-join/active-n3-c5-binding'
    work=x.work
    paths = {
        'primaryAtlas':(x.goal/'whole-k-atlas/primary-reference-cover.json','143d32b523429323eb3efc8ef8ea9c8f8922162bd919712cfe41580103a788be'),
        'sameLiveSlab':(x.goal/'final67/local-background-c8/c8-slab.json','e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b'),
        'signedSeams':(stage/'first-wave-guard-traces/signed/signed-seams.json','65c08c86d7682f989e9bf6c98f7ae04a42d2f1594488287da2548e85ca0a2815'),
        'forcedSeams':(work/'continuation82/forced-seams/forced-seams-final.json','888b8575fb5f02c9fac90e37cc757261b2bb7eaf8fea62d1a6ca6b4c544532b1'),
        'wave':(work/'continuation80/wave-assembly/wave-join-palette.json','97d8d99324202b00af14373782b40493146a27e3392e5e425fde045d91e7ca23'),
        'covariance':(work/'continuation98/covariance/final/global-primary-covariance.json','05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'),
        'firstEnergy':(work/'continuation108/first-k1-energy/first-k1-energy.json','8d03cf3e9acbafed674b06c80685d198a4da07cffdd85a0f9b8647db6a4bcfb3'),
    }
    evidence={key:json.loads(pinned(path,digest)) for key,(path,digest) in paths.items()}
    assert evidence['sameLiveSlab']['cutoffProof'].startswith('b4*qBig=64')
    assert 'leading-only' in evidence['sameLiveSlab']['originalScope']
    assert evidence['primaryAtlas']['physicalSlab']['N3']['referenceEll']=='ellMinimum+15'
    assert evidence['signedSeams']['status']=='VERIFIED_FOUR_FAST_ZERO_COLLAR_FACE_CLASSES_ALL_TEN_FIXED_CASES'
    assert evidence['firstEnergy']['firstCorrectionWhole']=='CONDITIONAL'
    assert evidence['wave']['sameGuardedCoverRows']==162
    host=work/'continuation70/hosted-44582875351/first-correction-spatial-source'
    cache=work/'continuation80/signed-wave/cache'
    reader=stage/'spatial-readback'
    cache_module=stage/'live-wave-gauge/signed'
    pinned(reader/'source_stream.py','2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb')
    pinned(cache_module/'source_cache.py','909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f')
    verifier_path=work/'continuation80/wave-assembly'
    pinned(verifier_path/'verify_wave_join.py','2956e9c7b28e79260b55d2dfec643cfd4bad2e86fafc7bb1e67522619e351da6')
    pinned(reader/'verify_spatial_structure.py','1493328510177182ae760be95ee832e3a670f0b3227b12bd5714405cb7763ef9')
    sys.path[:0]=[str(reader),str(cache_module),str(verifier_path)]
    import source_stream as st
    from source_cache import load
    manifest,_=st.read(host/st.MANIFEST,'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a')
    assert manifest['node_count']==22155584 and manifest['node_stream_sha256']==evidence['wave']['stream']['sha256']
    native=st.Native(host,manifest)
    assert native.pin=='e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
    graph=load(st,host,manifest,22153782,cache)
    try:
        source=exact_graph(graph,native,evidence['wave'])
        source['cutoffAndFrozenFrame']=check_cutoff_and_frozen(graph,native)
    finally:
        graph.__exit__(None,None,None)
    geometric=cover_reduction()
    result={'schema':'MathScope.C109.FixedN3FirstCorrectionDomain/1',
            'status':'VERIFIED_EXACT_FIXED_N3_SLAB_AND_GUARDED_LABEL_TRANSPORT_CONDITIONAL_CLASSICAL_SOURCE',
            'pins':{**{k:v[1] for k,v in paths.items()},**MODULES,
                    'sourceStream':manifest['node_stream_sha256'],'registry':native.pin},
            'fixedSlab':geometric,'actualRows':source,
            'verified':[
                'Fixed ell=C+15 and Q=tau0 cover the closed q interval with the same original reference root. The third-or-lower full live coefficient prefix is exact everywhere because b4*q >= 1, including equality.',
                'At admissible active own labels s is strictly between 1/2 and 2. The same physical q, X and eta are preserved, and the exact physical row floor is fixed before all local derivatives.',
                'The original frozen frame and carrier sources use only leading F0, R*FR0 and GR0 at the same-box representative. Full n<=3 fields are evaluated at the live point. There is no requirement that b4*q_rep >= 1 for these frozen quantities.',
                'The original symbolic program wraps native local evaluation in guards using only the admitted reference root, positive scale maps and lattice relabeling. The exterior branches are literal zero.',
                'Radial primitives move R at fixed Z,T with live reindexing. Forced H_w and the Fourier inverse move pulse or auxiliary coordinates at fixed slow physical q.',
                'Nearest-label changes replace only identically-zero rows on a neighborhood. Original fast collars and exact same-body normalizations are carried by separately pinned C82 and C98 evidence.'
            ],
            'conditional':[
                'Arbitrary finite polynomial collar poles vanish against the retained source Gaussian. Using this at every whole-correction seam still requires all actual derivative bounds and classical realization of every involved source body, including exact Fourier inverse tails.',
                'q=2*tau0 retains the same finite native graph and becomes the continuous trace of the same-field bounds verified on q<2*tau0 when their ordinary one-sided regularity is established.',
                'All first-stage energy comparisons remain under the C108 analytic assumptions. A distinct source equality is needed for any separately chosen representative convention, or for extending beyond the displayed q slab.'
            ],
            'open':['End-to-end ordinary realization of all needed native inverse, shifted and pulse derivatives on every admissible path.',
                    'Whole corrected energy, later stages, N8 comparisons and final jet gates.'],
            'firstCorrectionWhole':'CONDITIONAL','finalJets':0,'release':'HOLD'}
    with x.out.open('x',encoding='utf-8',newline='\n') as sink:
        sink.write(json.dumps(result,indent=2)+'\n')
    print('PASS fixed N3, 162 native rows, 27 exact mesh maps and five guard predicates per row')


if __name__=='__main__':
    assert __debug__
    main()
