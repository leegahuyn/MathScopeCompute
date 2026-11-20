#!/usr/bin/env python3
"""Conservative typed C103 frontier for the original post-Signed T swirl."""
import argparse,hashlib,json,runpy
from pathlib import Path
from itertools import product

p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'late':('continuation103/late-mean/final/verify_late_mean_inventory.py','047bde1fe4c528c7566d9ec84a5685fe3b9220366fe66c0e8fb253ec5e36ff38'),
 'protected':('continuation122/repeat-postfive-mean/protected-postfive-source.json','83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831'),
 'frontier':('continuation124/repeat-mean-time-frontier/repeat-mean-time-frontier.json','4e352dbc0f1d409dda4655626879a5a053d2ea76a4241c3325c1fb5747b41049'),
 'five':('continuation101/axial-budget/runtime/research-ide/mathscope-m3/post-signed-20261023/source-signed-actual-five-map.mjs','22976ece2c801beb9e51045820749cc077ddf2c198e364f2033a53789989466d'),
 'equations':('continuation101/axial-budget/runtime/research-ide/mathscope-m3/navier/source-full-mean-equations.mjs','2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76'),
 'updated':('continuation101/axial-budget/runtime/research-ide/mathscope-m3/navier/source-updated-mean-pressure.mjs','6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07')}
pins['fourier']=('continuation101/axial-budget/runtime/research-ide/mathscope-m3/navier/source-auxiliary-fourier.mjs','59e1d8f7fd72b880de030a2a56bee9be65b5e02203cffa73157ce8dae420ad2e')
pins['inverse']=('continuation101/axial-budget/runtime/research-ide/mathscope-m3/post-signed-20261023/source-signed-actual-temporal-inverse.mjs','5299e02c6d7b67c5fedb919be8d359a79678bd903183e27def736a65926bd628')
files={}
for k,(rel,digest) in pins.items():
 raw=(W/rel).read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,k;files[k]=raw.decode('utf-8')
protected=json.loads(files['protected']);frontier=json.loads(files['frontier'])
assert protected['nodes']['22154876']['args']==[22150797,22151941]
five=files['five'];eq=files['equations'];updated=files['updated']
for marker in ("angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)]",'deltaV=shareGlobalScalar','source=temporal.postTemporal.updatedMeanPressure','pressure.pressure.chi'):
 assert marker in five,marker
for marker in ('G.neg(time(beta))','G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz)))','G.mul(epsilon,lapVector(beta))','G.add(G.mul(q(2),G0,gamma),G.pow(gamma,2),W.zz)'):
 assert marker in eq,marker
for marker in ('P=scalar(G,whole(haarGr)', 'Jz=scalar(G,G.sub(whole(exactNormalizedHaar(G,raw.fluxZ,Y))'):
 assert marker in updated,marker
assert "direction:['sqrt(2)-1','1']" in files['fourier']
assert 'independentAllDerivativeTailApplicationsVerified:false' in files['inverse']

# Preserve the pinned C103 closure and its source-specific operations verbatim.
# Only the final request set is replaced; this is a conservative sufficient
# hull, not a claim that every role is strictly necessary after cancellation.
source=files['late'];start=source.index('def demand():');end=source.index('    spatial_psi=',start)
prefix=source[start:end].replace('def demand():','def selected(which):',1)
tail='''    if which == "temporal":
        for t in range(2): calc("vLate",(0,0,t,0))
    elif which == "five":
        # P,Jz at T on actual post-Temporal velocity. Radial Laplacian is
        # expanded as Dr=partial_R+aL before using the C103 whole path.
        selected_outputs={"betaLate": [(0,0,1,0),(1,0,1,0),(0,0,1,1),(2,0,1,0),(1,0,1,1),(0,0,1,2),(0,2,1,0),(0,1,1,0),(0,0,2,0)],
                          "gammaLate": [(0,0,1,0),(0,1,1,0)], "vLate": [(0,0,1,0)]}
        for f,aa in selected_outputs.items():
            for a in aa:
                for b in suborders(a):
                    calc(f,b)
                    old.add(({"betaLate":"beta","gammaLate":"gamma","vLate":"v"}[f],b))
        for f,a in (("rr",(1,0,1,0)),("rr",(0,0,1,1)),("thetatheta",(0,0,1,0)),("rz",(0,1,1,0)),("zz",(0,0,1,0))):
            for b in suborders(a): W(f,b)
    else: raise ValueError(which)
    return {"postSignedCovariance":sorted(wave),"oldInitializedMeans":sorted(old),"shiftedPrimitiveRoles":sorted(primitive),"centeredForcings":sorted(forcings),"fastCancellationRoles":sorted(fast_cancel)}
'''
assert prefix.count('def calc(f,a):')==1 and 'if f=="pDensity":' in prefix
namespace={};exec(compile(source[:start]+prefix+tail,'pinned_c103_selected','exec'),namespace)
temporal=namespace['selected']('temporal');fresh=namespace['selected']('five')
for result in (temporal,fresh):
 cutoff=set()
 for _,(r,z,t,l) in result['shiftedPrimitiveRoles']:
  for i,j,k in product(range(r+1),range(z+1),range(t+1)):
   cutoff.add((i,j,k));cutoff.add((i+1,j,k))
 result['conservativeCutoffOrdersRZT']=sorted(cutoff)
assert ('thetaz',(0,1,1,0)) in temporal['postSignedCovariance']
assert ('thetaz',(0,1,1,2)) in temporal['postSignedCovariance']
assert ('beta',(0,0,2,0)) in fresh['oldInitializedMeans']
out={'status':'SOURCE_BOUND_CONDITIONAL_CANDIDATE_HULL_OPEN_FULL_PROOF',
 'roots':{'temporalSwirl':22150797,'fiveSwirl':22151941,'directTotal':22154876},
 'actualFiveAngularMomentInputs':['P','Jz'],'excludedSeparateAxialMoment':'Jtheta',
 'temporalT':temporal,'freshFiveSwirlT':fresh,
 'freshMomentCovarianceDirect':[['rr',[1,0,1,0]],['rr',[0,0,1,1]],['thetatheta',[0,0,1,0]],['rz',[0,1,1,0]],['zz',[0,0,1,0]]],
 'cutoffRoles':['actual temporal radial translations and cutoff derivatives in C103 centered_int','post-FiveMap moving s and all five inQ/coefficient derivatives in T','original P and Jz full fixed radial integral endpoints','original chi in compact meridional primitive'],
 'scope':'C103 typed closure replay, conditional on the T-derivative Fourier-tail transfer, full source coefficient/cutoff bounds, and projection removing torus-independent stress. Candidate hull before integration-by-parts and cancellations; completeness and minimality not proved. Actual post-Signed bounds and separate axial-pressure frontier remain open.',
 'inputPins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS',[(k,len(v['postSignedCovariance']),len(v['oldInitializedMeans'])) for k,v in [('temporal',temporal),('five',fresh)]])
