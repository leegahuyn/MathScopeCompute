#!/usr/bin/env python3
"""Source-pinned typed frontier for the late Temporal velocity T derivative."""
import argparse,hashlib,json
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'code':('continuation103/late-mean/final/verify_late_mean_inventory.py','047bde1fe4c528c7566d9ec84a5685fe3b9220366fe66c0e8fb253ec5e36ff38'),
 'source':('continuation122/repeat-postfive-mean/protected-postfive-source.json','83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831'),
 'spatial':('continuation103/late-mean/final/late-mean-inventory.json','1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b'),
 'initial':('continuation103/initialized-mean/final/initialized-mean.json','c6f1aaf7d81c4810c5d72671357eacf7caf7f50904fe6e4a62582b6ee29f1cb8'),
 'time':('continuation116/mean-time-operands/mean-time-operands.json','3ec640563531208b18f019167174e7c39db1c744e937f834d313eeefafd86e14'),
 'swirl':('continuation127/late-swirl-complete/complete-covariance.json','c555b0f627542dadc8674967bc4b3064541297a43e65c09e9d175221347d210f'),
 'rz':('continuation128/post-signed-rz-z3t/post-signed-wrz-z3t.json','3a53063e6d47ff36d29fa26520ce27f07cf739fd919df1beba4f113f221ac897'),
 'highPre':('continuation128/pressure-presigned/pressure-covariance.json','51e3a1190c574723990a28ad9af2f477d01bf2e1a6789122243f612115497a85'),
 'oldv':('continuation127/sigma-rrt/old-v-ttl2.json','616b5cee7d992e8115f6438e69fc92c51496b193f9fe5484d746db7c79aba609'),
 'equations':('continuation101/axial-budget/runtime/research-ide/mathscope-m3/navier/source-full-mean-equations.mjs','2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76'),
 'physical':('continuation101/axial-budget/runtime/research-ide/mathscope-m2/navier/actual-common-band-physical-curl.mjs','60001a58480274c646856bba803b62fd234db0f9bca33b9d81421963d19b5b70'),
 'pressureSource':('continuation101/axial-budget/runtime/research-ide/mathscope-m3/navier/source-pressure.mjs','fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f'),
 'five':('continuation101/axial-budget/runtime/research-ide/mathscope-m3/post-signed-20261023/source-signed-actual-five-map.mjs','22976ece2c801beb9e51045820749cc077ddf2c198e364f2033a53789989466d')}
D={}
for key,(rel,digest) in pins.items():
 raw=(W/rel).read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,key
 D[key]=json.loads(raw) if rel.endswith('.json') else raw.decode('utf-8')
assert D['source']['nodes']['22150943']['args'][0]=='coupled-expression:1329'
assert D['source']['nodes']['22151952']['args']==[17733137,22151950]
assert D['spatial']['source']['centeredSource']==[22032006,22032008] and D['spatial']['source']['signedPressureZ']==22031648
for marker in ('Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))','Dz=x=>G.mul(epsilon,G.derivative(x,Z))','G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz)))'):
 assert marker in D['equations']
for marker in ('basis=[[G.one,G.sub(G.one,sqrt2)],[G.sub(sqrt2,G.one),G.one]]','actual-R-only-fast-factor','return {coordinates,basis,meshLabels'):
 assert marker in D['physical']
assert 'vr=physical.geometry.basis[0]' in D['pressureSource']
for marker in ('axialTarget:G.neg(targets.Jtheta)','gammaDesired=shareGlobalScalar','integrand=G.substitute(G.mul(R,gammaDesired),R,r)'):
 assert marker in D['five']
source=D['code'];start=source.index('def demand():');end=source.index('    spatial_psi=',start)
prefix=source[start:end].replace('def demand():','def selected(alpha):',1)
tail='''    for j in suborders(alpha): calc("psiLate",j)
    return {"postSignedCovariance":sorted(wave),"initializedMean":sorted(old),"shiftedPrimitives":sorted(primitive),"forcing":sorted(forcings),"fastCancellation":sorted(fast_cancel)}
'''
ns={};exec(compile(source[:start]+prefix+tail,'pinned_original_c103_temporal','exec'),ns)
asks={'A_T_ZT':(0,1,1,0),'A_T_RT':(1,0,1,0),'A_T_LT':(0,0,1,1),'A_T_T':(0,0,1,0)}
rows={name:ns['selected'](alpha) for name,alpha in asks.items()}
existingW={(f,tuple(j)) for f,j in D['spatial']['demand']['postSignedCovarianceOrders']}
existingW|={(f,tuple(j)) for f,j in D['swirl']['requiredCovariance']}
assert D['rz']['RZTL']==[0,3,1,0]
existingW.add(('rz',(0,3,1,0)))
old={(f,tuple(j)) for f,j,*_ in D['initial']['directTemporal']}
old|={(f,tuple(j)) for f,j,*_ in D['time']['temporalMeanRows']}
old|={(f,tuple(j)) for f,j in D['highPre']['meanAndCompactDependencies']['requested']}
old.add(('v',(0,0,2,2)))
for item in rows.values():
 item['postSignedNotInPinnedReceipts']=sorted(set(item['postSignedCovariance'])-existingW)
 item['oldNotInPinnedReceipts']=sorted(set(item['initializedMean'])-old)
unionW=set().union(*(set(r['postSignedCovariance']) for r in rows.values()))
unionOld=set().union(*(set(r['initializedMean']) for r in rows.values()))
assert ('rz',(0,3,1,0)) in unionW and ('rz',(0,3,1,2)) in unionW
out={'schema':'MathScope.C129.LateTemporalVelocityTimeFrontier/1','status':'SOURCE_TYPED_CONDITIONAL_C103_FRONTIER_OPEN_FULL_NORM',
 'actualSource':{'potential':22150943,'separateFiveMapPotential':22151952,'pressureZ':22031648,'centeredAxialSource':22032008},
 'normalizedVelocityT':{'beta':'-epsilon*A_T,ZT','gamma':'A_T,RT + a*A_T,LT + A_T,T/R',
   'timeIndependentCoefficients':'original physical basis is constant and original radialFast is R-only; fixed-band epsilon is T-independent',
   'fixedLabelReferenceTimeFactor':'b^(-A-1) under the original fixed-label reference map','requiredPotentialDerivatives':asks},
 'temporalPotentialCandidateRows':rows,'combinedPostSignedCovariance':sorted(unionW),'combinedOldMean':sorted(unionOld),
 'combinedPostSignedNotInPinnedReceipts':sorted(unionW-existingW),'combinedOldNotInPinnedReceipts':sorted(unionOld-old),
 'knownKeyRows':{'rz_Z3T_ordinary':'C128 conditional receipt included','rz_Z3T_L2':'not counted unless a separately pinned receipt is provided'},
 'separateFiveMap':'A_F has no L derivative. Its beta_T needs Jtheta_ZT and gamma_T needs Jtheta_T, using fresh post-Temporal v, gamma and W_thetaz; its moment/product and cutoff bounds are a separate proof.',
 'scope':'Source-pinned C103 dependency candidate with downward derivatives. Positive-time covariance absence is relative only to named pinned receipts; the time derivative of the native inverse/Fourier tail, reference-to-own radial-fast transfer, and cutoff estimates remain separate obligations. No quantitative full velocity norm or M3/M4 closure follows.',
 'pins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS AT time frontier W+',len(unionW),'missing',len(unionW-existingW),'old',len(unionOld),'missing',len(unionOld-old))
