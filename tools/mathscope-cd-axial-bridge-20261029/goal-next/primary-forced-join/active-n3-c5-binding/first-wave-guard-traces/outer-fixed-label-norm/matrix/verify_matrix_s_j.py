"""Audit the actual frozen normalized pulse matrix and its sharp band degrees."""
from argparse import ArgumentParser
from dataclasses import dataclass
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
from math import comb, factorial, prod
from pathlib import Path
import json
import sys

ORDER=8
PINS={
    'pulse':'56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d',
    'pulseChecker':'38fdd2226e02fd4868f3c0eb48617bdf714fb80971a7001888daacf74d3d6fb9',
    'scale':'71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa',
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'primary':'c6d6d4a2e5d0c395cef6c758c0a8ce310ec80e82d3e4dbcecf15d83bc708e521',
    'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'reader':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
    'stream':'2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
    'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
    'cone':'b5e96a01ba3a64c2d8b07c4562cccc3bf5c062180a1b0fb8cae9bd799e896d88',
}
STREAM='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
FIELDS={'F':[17732934,17733119,17733124,17733129],
        'G':[17732935,17733121,17733126,17733131]}
R,Z,T,ELL=17732748,17732749,17732750,17732737
A_C8=14220475


@dataclass(frozen=True)
class Cap:
    multiplier:Q
    source_power:int
    band_power:int

    def __mul__(self,other):
        return Cap(self.multiplier*other.multiplier,self.source_power+other.source_power,
                   self.band_power+other.band_power)

    def __rmul__(self,other):
        return Cap(Q(other)*self.multiplier,self.source_power,self.band_power)

    def row(self):
        return [str(self.multiplier),self.source_power,self.band_power]


def plus(*terms):
    nonzero=[term for term in terms if term.multiplier]
    if not nonzero:
        return Cap(Q(0),0,0)
    return Cap(sum(term.multiplier for term in nonzero),
               max(term.source_power for term in nonzero),max(term.band_power for term in nonzero))


def dmul(a,b):
    return [plus(*(comb(j,k)*a[k]*b[j-k] for k in range(j+1))) for j in range(ORDER+1)]


def dadd(*sets):
    return [plus(*terms) for terms in zip(*sets,strict=True)]


def dscale(c,x):
    return [c*term if type(c) is int else term*c for term in x]


def dconst(x):
    return [x]+[Cap(Q(0),0,0)]*ORDER


def cap_inverse(q,u):
    inverse=[u]
    for j in range(1,ORDER+1):
        inverse.append(u*plus(*(comb(j,k)*q[k]*inverse[j-k] for k in range(1,j+1))))
    return inverse


def cap_invsqrt(q):
    # 0<q and 1/q<=A. A>=1 allows q^(-r-1/2)<=A^(r+1).
    out=[Cap(Q(1),1,0)]
    for j in range(1,ORDER+1):
        terms=[]
        for counts in product(*(range(j//i+1) for i in range(1,j+1))):
            if sum(i*k for i,k in enumerate(counts,1))!=j:
                continue
            r=sum(counts)
            pp=Q(factorial(j),prod(factorial(i)**k*factorial(k) for i,k in enumerate(counts,1)))
            derivative=Q(factorial(2*r),4**r*factorial(r))
            value=Cap(pp*derivative,r+1,0)
            for i,k in enumerate(counts,1):
                for _ in range(k):
                    value*=q[i]
            terms.append(value)
        out.append(plus(*terms))
    return out


def verify_degrees(c88_scale):
    one=Cap(Q(1),0,0)
    A=Cap(Q(1),1,0)
    Asq=A*A
    # Positive n-jet orders cost one factor S, not S per every undifferentiated factor.
    n=[A]+[Cap(Q(factorial(j)+1),j+2,1) for j in range(1,ORDER+1)]
    n_w=[Asq]*(ORDER+1)
    K=[(j+3)*Asq for j in range(ORDER+1)]
    n2=dscale(3,dmul(n,n))
    tang2=dscale(2,dmul(n,n))
    tang2_w=dscale(4,dmul(n,n_w))
    invq=cap_inverse(n2,A)
    invt=cap_inverse(tang2,A)
    invroot=cap_invsqrt(tang2)
    # Original u>=2, |sigma|<=3u/2. Include u|c0| in A.
    # Intermediate squared inequality applies at the smallest u=2.
    assert Q(7,4)*4>=1
    c,c_w,inv_c=2*A,Asq,A
    invt_w=dmul(tang2_w,dmul(invt,invt))
    invroot_w=dscale(Cap(Q(1,2),0,0),dmul(tang2_w,dmul(invroot,dmul(invroot,invroot))))
    nn=dmul(n,n)
    frame=dadd(dconst(one),dmul(nn,invt),dscale(c,dmul(n,invroot)))
    frame_left=dadd(dconst(Cap(Q(1,2),0,0)),dscale(inv_c,dmul(n,invroot)))
    frame_w=dadd(dscale(2,dmul(dmul(n,n_w),invt)),dmul(nn,invt_w),
                 dscale(c_w,dmul(n,invroot)),dscale(c,dmul(n_w,invroot)),
                 dscale(c,dmul(n,invroot_w)))
    Aphi=dadd(K,dmul(invq,dadd(dscale(3,dmul(nn,K)),dmul(n,n_w))))
    projection=dadd(dconst(one),dmul(nn,invq))
    # M_m=B_left(A_phi B-B_w)-(lambda-dref+m^2*d)I, 0<=m^2*eps*k^2<=16.
    # Both reference rates are independent of the slow coordinates.
    M=dadd(dscale(9,dmul(frame_left,dmul(Aphi,frame))),dscale(3,dmul(frame_left,frame_w)),
           dconst(5*A),dscale(16,n2))
    # 2-dimensional normalized matrix infinity norm and tangent 3x2 norm.
    Mnorm=dscale(2,M)
    Bnorm=dscale(2,frame)
    ledgers=dict(n=n,nPrime=n_w,cylindricalK=K,normalSquared=n2,tangentSquared=tang2,
                 inverseNormalSquared=invq,inverseTangentSquared=invt,inverseTangentLength=invroot,
                 inverseTangentSquaredW=invt_w,inverseTangentLengthW=invroot_w,
                 projector=projection,Aphi=Aphi,B=frame,BLeft=frame_left,BPrime=frame_w,
                 normalizedMode1And2Matrix=M,normalizedMode1And2MatrixInfinityNorm=Mnorm,
                 movingBasisInfinityNorm=Bnorm)
    for key,seq in ledgers.items():
        assert all(cap.band_power <= j for j,cap in enumerate(seq)),key
    assert [t.band_power for t in Mnorm]==list(range(ORDER+1))
    assert [t.band_power for t in n2]==[0,1]+[2]*(ORDER-1)
    assert all(t.band_power==0 for t in ledgers['nPrime'])
    assert [t.band_power for t in Bnorm]==list(range(ORDER+1))

    # C0 is a common fixed-label normalized forward propagator bound.
    # For j>0, each variation integral contributes Lmax*S and a
    # nonzero j-k coefficient derivative, so S^(1+k+2(j-k))<=S^(2j).
    W=[0]
    T=[0]
    normalized_forced=[1]
    catalog=[]
    for j in range(1,ORDER+1):
        harmonic=[1+Mnorm[k].band_power+W[j-k] for k in range(1,j+1)]
        W.append(max(harmonic))
        T.append(max(Bnorm[k].band_power+W[j-k] for k in range(j+1)))
        forced=[1+j]+[1+Mnorm[k].band_power+normalized_forced[j-k] for k in range(1,j+1)]
        normalized_forced.append(max(forced))
        assert W[j]==T[j]==2*j and normalized_forced[j]==2*j+1
        catalog.append({'order':j,'matchedHomogeneousPulseBandPower':W[j],
                        'tangentOverPBandPower':T[j],
                        'normalizedZeroDataForcedBandPowerIfRHS_jIsWeightedS^j':normalized_forced[j],
                        'allLowerOrderContributionBandPowers':harmonic})
    assert [int(row['normalizedPulseDerivatives']) for row in c88_scale['scaleRows']]==W
    assert [int(row['tangentOverP']) for row in c88_scale['scaleRows']]==T
    assert [row['order'] for row in c88_scale['scaleRows']]==list(range(ORDER+1))

    # Check the combined product weights and grouping by total order for
    # every mixed slow derivative up to the original 8th-order target.
    tested=0
    for alpha in product(range(ORDER+1),repeat=3):
        j=sum(alpha)
        if j>ORDER:continue
        weights=[0]*(j+1)
        for beta in product(*(range(v+1) for v in alpha)):
            weights[sum(beta)]+=prod(comb(a,b) for a,b in zip(alpha,beta,strict=True))
        assert weights==[comb(j,k) for k in range(j+1)]
        tested+=1
    assert tested==165
    # Controls for the source assumptions: allowing |n|~S even at order
    # zero loses the target scale, and omitting the S in Ls understates W.
    assert (Cap(Q(1),1,1)*Cap(Q(1),1,1)).band_power>0
    assert 1+Mnorm[1].band_power+W[0]==2
    return {
        'upperBoundNotation':'Each triple [c,a,b] bounds the scalar entry or indicated infinity norm by c*A^a*S^b.',
        'slowDirections':['R','Z','T'],'distinctMixedMultiIndicesAudited':tested,
        'capA':[
            'At least 1, Renv and Rmin^(-1), and the label-independent physical F/G derivative cap through order 9.',
            'At least Lmax, Lmin^(-1), |p|+|pz|, lambda0, u|c0| and |c0|^(-1) on the same original fixed labels.',
            'At least the original Bnorm^4, bounding |n|, 1/(n dot n) and 1/(n_theta^2+n_z^2) on the same source cone.',
        ],
        'exactDerivativeLedgers':{key:[item.row() for item in seq] for key,seq in ledgers.items()},
        'zeroDerivativeInCommonTorusDirections':True,
        'normalizedForwardPropagatorC0':'exp(3*Bnorm^256*Lmax); normalized reference diag(0,-2lambda) and source entry/damping errors remain; m^2>=1 adds nonpositive damping.',
        'variationConstantRecurrence':'U_0=C0, U_j=C0*Lmax*sum_(k=1)^j binom(j,k)*normM_k*U_(j-k), where normM_k is the source-only part of the cap after stripping S^k.',
        'homogeneousInitialDataIsConstant':[1,0],
        'sourceTargetBandTransfer':catalog,
        'degreeOnlyNegativeControls':['Permitting n=O(S) in value invalidates the order-zero cap.',
                                     'Dropping Ls<=Lmax*S from the first variation loses one band factor.'],
    }


def pinned(path,k):
    raw=path.read_bytes()
    if path.suffix=='.py':
        raw=raw.replace(b'\r\n',b'\n')
    assert sha256(raw).hexdigest()==PINS[k],k
    return raw


def verify_live(g,registry,c88,primary,frame,Exact):
    assert g.verify['sha256']==STREAM==c88['sourceStream']['sha256']
    assert c88['verifiedNativeMatrixEntries']==180 and c88['verifiedNativeProjectedScalars']==120
    records=json.loads(registry['base']['base']['expression'])
    homogeneous=json.loads(registry['base']['base']['m3GlobalPulses'])
    roots={}
    for name,ids in FIELDS.items():
        first,actual,orders=g.args(ids[0],'actual_expression_partial')
        original=[R,Z,T,ELL]
        assert actual==original and orders==[0,0,0,0]
        definition=records[first]
        assert definition['name']==f'M3GlobalBandSlow_{name}' and definition['parameters']==original
        assert min(definition['derivativeLimits'])>=9
        for j,root in enumerate(ids[1:]):
            assert g.args(root,'actual_expression_partial')==[first,original,
                        [int(k==j) for k in range(4)]]
        roots[name]={'sourceRootAndFirstRZTJets':ids,'nativeSlot':first,
                     'nativeBody':definition['body'],'registeredDerivativeLimits':definition['derivativeLimits']}
    original_frames=frame.verify_original(g,Exact,homogeneous)
    assert original_frames==c88['verifiedOriginalFrames']
    EForm=frame.Forms(g,Exact,{})
    e=EForm.a
    at=lambda k:EForm.val(k,False)
    to_form=lambda arr:[at(k) for k in arr]
    for sign,row in original_frames.items():
        p,pz=to_form([row['p'],row['pz']])
        for axis,root in [(1,row['HR']),(2,row['HZ'])]:
            assert EForm.eq(at(root),e.add(e.mul(p,at(FIELDS['F'][axis])),e.mul(pz,at(FIELDS['G'][axis]))))
        assert EForm.eq(at(row['n'][0]),e.sub(at(row['x0']),e.mul(at(frame.V),at(row['HR']))))
        assert EForm.eq(at(row['n'][2]),e.sub(pz,e.mul(at(frame.EPS),at(frame.V),at(row['HZ']))))
    K=[[e.zero,e.neg(e.mul(e.scalar(2),at(FIELDS['F'][0]))),e.zero],
       [e.add(e.mul(e.scalar(2),at(FIELDS['F'][0])),e.mul(at(R),at(FIELDS['F'][1]))),e.zero,e.zero],
       [at(FIELDS['G'][1]),e.zero,e.zero]]
    assert all(EForm.eq(K[i][j],at(frame.KBASE[i][j])) for i in range(3) for j in range(3))

    fixed=[frame.EPS,frame.KF,frame.LS,frame.C0,frame.LAMBDA0,*frame.ACTUALS]
    for row in original_frames.values():
        fixed.extend(row[k] for k in ('p','pz','x0','s','sroot','c','lambda','dref','P'))
    for k in set(fixed):
        assert frame.free(g,k).isdisjoint({R,Z,T,frame.Y0,frame.Y1}),(k,'slow/torus dependency')
    for sign,row in original_frames.items():
        matrices=row['originalMatrix']
        for root in [*row['n'],*row['np'],*(x for y in matrices for x in y)]:
            assert frame.free(g,root).isdisjoint({frame.Y0,frame.Y1})

    old=primary['originalBackgroundC8']
    assert old['scope']['actualGeneratedSlowOrder']==8
    assert old['scope']['independentOfEllAndMeshLabels']
    assert old['scope']['uniformUnderCanonicalCutoffEnlargement']
    assert primary['backgroundRow']['C_mPlusTwo']==A_C8
    row=primary['backgroundRow']
    return {'physicalFieldBindings':roots,'activeAllBandC8NormHandle':row,
            'preciseSourceInputBoundary':{
                'orders0to7':'Use the authenticated original C8 field-norm recipe, with its admitted actual selector, real analytic domain and ordinary derivative interpretation.',
                'order8':'Needs a common original ninth slow derivative bound for these exact same-body F and G (or the immediately needed F_R, G_R, F_Z, G_Z derivative bounds through eight).',
                'finiteSourceC8ScopeDoesNotProduceC9':True,
                'numericSourceCapEvaluatedHere':False,
            },
            'frozenOperandsVerified':sorted(set(fixed)),
            'originalMatrixRows':{k:{key:x[key] for key in ('originalMatrix','B','BL','P','n','np','q')}
                                  for k,x in original_frames.items()},
            'actualCylindricalMatrixRoots':frame.KBASE,
            'registeredHomogeneousSystems':[
                {k:v for k,v in r.items() if k in ('covariance','matrix','length','variable','parameters','directions','initial')}
                for r in homogeneous],
            'actualNativeTransportScope':'C88 all 20 positive native systems already use these exact same frozen normals, K, reference pulse and mode-squared damping.'}


def main():
    cli=ArgumentParser(description=__doc__)
    for name in ('goal','artifact','cache','outer-runtime','out'):
        cli.add_argument('--'+name,type=Path,required=True)
    args=cli.parse_args()
    assert __debug__
    active=args.goal/'primary-forced-join/active-n3-c5-binding'
    shell=active/'first-wave-guard-traces/outer-normalized-amplitude'
    pulse=shell/'pulse-frame'
    host=args.artifact/'first-correction-spatial-source'
    src=args.outer_runtime/'research-ide/mathscope-m2/navier'
    paths={
        'pulse':pulse/'pulse-frame-caps-final.json','pulseChecker':pulse/'verify_all_label_pulse.py',
        'scale':shell/'outer-scale.json','manifest':host/'original-source-export-manifest.json',
        'registry':host/'original-source-functions.json','primary':args.artifact/'primary-c5-native.json',
        'cache':active/'live-wave-gauge/signed/source_cache.py','reader':active/'spatial-readback/verify_spatial_artifact.py',
        'stream':active/'spatial-readback/source_stream.py',
        'exact':args.goal/'first-force-repair/verify_repaired_first_force.py',
        'cone':src/'actual-covariance-operator-bounds.mjs',
    }
    pins={k:pinned(path,k) for k,path in paths.items()}
    assert all(key in pins['cone'] for key in (b'normalMagnitude:',b'|n|,|n_ref|<=B^4',b'|n_tan|>=B^-2',b'operatorError:E,dampingError:E'))
    pulse,scale,manifest,registry,primary=(json.loads(pins[k]) for k in ('pulse','scale','manifest','registry','primary'))
    sys.path[:0]=[str(paths[k].parent) for k in ('cache','reader','exact','pulseChecker')]
    import source_cache
    import verify_spatial_artifact
    import verify_all_label_pulse as frame
    from verify_repaired_first_force import Exact
    graph=source_cache.load(verify_spatial_artifact,host,manifest,22153782,args.cache)
    try:
        live=verify_live(graph,registry,pulse,primary,frame,Exact)
    finally:
        graph.__exit__(None,None,None)
    result={'status':'VERIFIED_ACTUAL_NORMALIZED_MATRIX_SOURCE_AND_CONDITIONAL_S_J_DERIVATIVE_CAP',
            'inputPins':PINS,'sourceStream':graph.verify,'sameLiveMatrixBinding':live,
            'sharpBandDegreeAudit':verify_degrees(scale),'finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf8',newline='\n') as f:
        json.dump(result,f,indent=2)
        f.write('\n')
    print(result['status'],flush=True)
    print('165 R/Z/T mixed indices, both signs, modes 1 and 2, j=0..8; F/G C9 premise for order 8',flush=True)


if __name__=='__main__':
    main()
