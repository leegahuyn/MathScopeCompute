"""Coarse fixed-slab scalar ingredients; no live-family or global K assertion."""
import argparse
from fractions import Fraction as F
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path

PINS={
 'norms':'517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4',
 'fixed':'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
 'lower':'5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328',
 'lower_code':'34f45caa70455663b06f9c5116aa490ef59d58fc17e00a6b618918e35b78a338',
 'global_class':'f07341f299b2b9cd24844c4d738b5c6605816bdaf4eeca317b80618b27ed7095',
 'family':'7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75',
 'time':'aa100d47e54442be8c24f167a160816d31c883ddfdc4f0a3274b496c9b3c7a53',
 'bump':'bd0f09f78a2f93cad9fdb679ba25509ecb2891ba86eee1bc3e57df6da74e37cc',
}

def read(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw) if key in ('norms','fixed','lower') else raw.decode()

def exp_height(x):
    """Exact nested positive exponent representation: exp^height(rational)."""
    n=0
    while isinstance(x,dict) and set(x)=={'exp'}:
        n+=1;x=x['exp']
    assert isinstance(x,dict) and set(x)=={'rational'}
    return n,F(x['rational'])

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for k in (*PINS,'out'):p.add_argument('--'+k.replace('_','-'),type=Path,required=True)
    a=p.parse_args()
    d={k:read(getattr(a,k),k) for k in PINS}
    norms,fixed=d['norms'],d['fixed']
    assert norms['status']=='VERIFIED_ORIGINAL_FULL_R_Z_T_BOUNDS_ON_THE_FIXED_PHYSICAL_SLAB'
    assert norms['domain']['axes']==['R','Z','T'] and norms['domain']['fixedBandAndDiscreteLabels']
    assert d['lower']['intermediate']['sqrtWeightPoles'][:7]==[12,24,48,72,96,120,144]
    checks={'global_class':["n=order+2",'partitionRows=Array.from({length:n+1}',"G.pow(partitionMax,n+4)",'G.pow(logChartMax,n+4)'],
      'family':['determinantScaleLower=G.div(', 'weightOverZetaLower=G.div('],
      'time':['for(let j=1;j<=order+2;j++)sigmaJets.push', 'j<=order+1;j++)stepBounds.push'],
      'lower_code':['let seed=new Map([[0,1n]])', 'sigma.push(64n*b)', 'den=b.map((_,j)=>mul(q(3),conv(b,b,j)))'],
      'bump':['G.q(1,4),G.q(3,4)', 'G.step(G.sub(G.q(3,2),G.mul(G.q(2),abs)))']}
    for k,patterns in checks.items():
        for fragment in patterns:assert fragment in d[k],(k,fragment)
    endpoints=[row[field]['upper'] for row in norms['backgroundC8'] for field in ('F','G')]
    endpoints += [interval['upper'] for row in norms['weightedTargetC7'] for interval in row['component']]
    endpoints += [fixed['hostedOriginal'][str(i)]['upper'] for i in (216823,300170)]
    kappa=fixed['hostedOriginal']['617289']['lower']
    assert set(kappa)=={'exp'} and set(kappa['exp'])=={'neg'}
    # reciprocal of exp(-x) equals exp(x), exactly.
    endpoints.append({'exp':kappa['exp']['neg']})
    ranks=[exp_height(x) for x in endpoints]
    assert all(0<=k<=6 and 0<base<2**30 for k,base in ranks)
    h_upper=fixed['hostedOriginal']['9']['upper']
    assert set(h_upper)=={'exp'} and set(h_upper['exp'])=={'neg'}
    hk,hbase=exp_height(h_upper['exp']['neg'])
    assert hk==1 and hbase>10  # exp(-exp(hbase)) < exp(-64) < 1/64.
    assert fixed['hostedOriginal']['300171']=={'lower':{'rational':'1/17179869184'},'upper':{'rational':'1/17179869184'}}

    # Original sigma=flat/(flat+reflected-flat), exact finite recurrence.
    raw={0:1}; seed=[]
    for n in range(10):
        seed.append(sum(abs(c)*factorial((j+1)//2) for j,c in raw.items()))
        nxt={}
        for j,c in raw.items():
            nxt[j+1]=nxt.get(j+1,0)-j*c
            nxt[j+3]=nxt.get(j+3,0)+2*c
        raw=nxt
    assert seed[:4]==[1,4,36,1968]
    sigma=[1]
    for n in range(1,10):
        sigma.append(64*(seed[n]+sum(comb(n,k)*2*seed[k]*sigma[n-k] for k in range(1,n+1))))
    assert [str(x) for x in sigma[:8]] == d['lower']['intermediate']['partitionSeedSigma']
    # Normalized Taylor majorants for three shifted bumps divided by sqrt(D), D>=1/4.
    b=[F(2**j*sigma[j],factorial(j)) for j in range(9)]
    conv=lambda x,y,n:sum((x[k]*y[n-k] for k in range(n+1)),F())
    den=[3*conv(b,b,j) for j in range(9)]
    root=[F(2)]; inv=[F(2)]
    for j in range(1,9):
        root.append(den[j]+sum((root[k]*root[j-k] for k in range(1,j)),F()))
        inv.append(2*sum((root[k]*inv[j-k] for k in range(1,j+1)),F()))
    partition=[factorial(j)*conv(b,inv,j) for j in range(9)]
    pmax=3*(1+max(partition))
    step=[1]+[1+sigma[j+1]**2 for j in range(1,9)]
    time=400**8*max(step)**2
    transverse=2**(35*7)*max(step)
    # Cauchy/FTC chart bound: 4*7!*256^7*4096^2; see README.
    chart=4*factorial(7)*256**7*4096**2
    slow=4**7*factorial(7)*pmax**11*(30*(1+chart))**11
    radius=max(factorial(7)*8**8,13**8*8**13)
    finite=[pmax,time,transverse,chart,slow,radius,2**128,2**102,3_000_000]
    C=2**100000
    assert all(0<x<C for x in finite)
    # T0=2^30, T(n+1)=exp(Tn). Exact rational inequality used in
    # logarithmic comparisons: log x <= sqrt x <= x/2^15 for x>=2^30.
    assert 100000 < 2**30 and 257*2**15 < 2**30
    output={'schema':'MathScope.Forced.FixedSlabScalarCandidate/1',
      'status':'CONDITIONAL_COARSE_FIXED_SLAB_SCALAR_CANDIDATE_NOT_ORIGINAL_GLOBAL_K',
      'pins':PINS,'T0':'1073741824','towerRecurrence':'T[n+1]=exp(T[n])','candidate':'T[10]',
      'parsedEndpointCount':len(ranks),'maxEndpointHeight':max(k for k,b in ranks),
      'endpointProof':'Each endpoint is exp^k(r) with 0<r<2^30 and k<=6, including 1/kappa via its directed lower endpoint; hence each <T6.',
      'integerCutoffBounds':{'sigmaOrders':list(range(10)),'maxSigmaBits':max(x.bit_length() for x in sigma),
         'partitionFTCBoundCeiling':str(-(-pmax.numerator//pmax.denominator)),
         'partitionThroughDerivative':8,'timeFTCStepThrough':8,'requiresSigmaThrough':9,
         'slowChartCauchyBase':str(chart),'allFiniteCoefficientsLessThan':'2^100000'},
      'proofIngredients':{'chart':'Fixed h<1/64, s∈[1/2,2], |eta|≤1, profile discs radius1/4096 and physical inverse discs radius1/256; see README. All X derivatives of log s vanish.',
        'dstar':'dstar^-1 <= 3000000*r0^-3*W^4*R^172, W=exp(3 Bnorm^256 Lmax), using u>=2, 1<Dgeom<4, Tg<6 and massLower>=1/(480 W^2 R^83).',
        'cy':'cy^-1/2 <=64 R^64 W kappa^-1/2, since massUpper<=32 W^2.',
        'bounds':'W^8<T8; dstar^-1, cy^-1/2<T9; finite cutoff, chart and radius bounds <T7; K=T10 dominates all.'},
      'crucialScope':'The physical slab background roots can serve in a re-proved fixed-slab mixed-jet lemma; they do not bound the literal enlarged all-band Cslow or literal original global K.',
      'premises':'Original same-family frozen carrier bounds Bnorm, normal/cone/determinant/weight lower and propagator/Gaussian hypotheses; chart inverse Cauchy continuation; source real derivative and FTC endpoint bounds. The numerical root certificates carry their own analytic assumptions.',
      'stillOpen':['Independent complete fixed-slab re-proof of all hypotheses and path containment','Source-bound C5 coefficient graph and numerical constant','Original all-band K','Live-family class binding'],
      'release':'HOLD'}
    raw=(json.dumps(output,indent=2)+'\n').encode();a.out.write_bytes(raw)
    print('PASS rational cutoff inventory and fixed-slab tower candidate; mixed-jet source closure remains conditional')
    print(sha256(raw).hexdigest(),a.out.name)

if __name__=='__main__':main()
