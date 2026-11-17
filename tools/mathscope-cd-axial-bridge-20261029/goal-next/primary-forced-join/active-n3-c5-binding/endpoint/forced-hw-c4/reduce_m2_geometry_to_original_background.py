#!/usr/bin/env python3
"""Reduce selected C4/normal geometry to actual fixed-label source quantities."""
import hashlib,json
from pathlib import Path
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
base=Path('work/goal-next/continuation30/forced-probe/runtime/research-ide')
files={
 'initialized':(base/'mathscope-m3/navier/source-initialized-angular.mjs','5270ae0792718cbc475c9e7249f7cb4e8f0309c6'),
 'band':(base/'mathscope-m3/navier/source-global-band.mjs','1f1c18a26372c998d8389b6c5138b3c9d3a66f36'),
 'frame':(base/'mathscope-m2/navier/actual-covariance-matrix.mjs','80c0976b8bbd7b24a1f9e094937d1822726b240d'),
 'family':(Path('work/goal-next/continuation27/original-primary-degree-runtime/research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs'),'614c59419ec1a6d7e37a52084d10b6a3b4e5d30b')}
contents={}
for key,(path,pin) in files.items():
 data=path.read_bytes();assert blob(data)==pin;contents[key]=data
for k,frags in {
 'initialized':[b'phaseGradient=[Dlocal.Dr(phase),Dlocal.angular(phase),Dlocal.Dz(phase)]',b'phaseVerifier(G.sub(x,normal[j]))',b'key:delta+\':\'+prior.sign'],
 'band':[b'phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))',b'HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z)'],
 'family':[b'r0=q(1,1n<<34n)'],
 'frame':[b'n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]']}.items():
 for s in frags:assert s in contents[k],s
Q=Path('work/goal-next/continuation42/forced/n3-projected-m2-source-c4.json');q=json.loads(Q.read_bytes())
H=Path('work/goal-next/continuation42/forced/n3-same-live-hw-c4-pullback.json');h=json.loads(H.read_bytes())
I=Path('work/goal-next/continuation42/forced/n3-normal-inverse-bound.json');i=json.loads(I.read_bytes())
G=Path('work/goal-next/continuation38/beta-gamma/same-live-gamma-bound-v3.json');gamma=json.loads(G.read_bytes())
assert q['status']=='CONDITIONAL_SAME_LIVE_PROJECTED_M2_SOURCE_C4' and q['hwPullbackSHA256']==hashlib.sha256(H.read_bytes()).hexdigest()
assert i['status']=='CONDITIONAL_SAME_LIVE_NORMAL_INVERSE_BOUND' and i['priorProjectionSHA256']==hashlib.sha256(Q.read_bytes()).hexdigest()
assert h['status']=='CONDITIONAL_SAME_LIVE_HW_C4_SOURCE_PULLBACK'
assert {r['key'] for r in q['branches']}=={'0:1','1:1'}
# Original affine lift: |v|<=Ls=2*r0/ci<=1/ci and |D_Y v|<=19/(4ci).
# Palette ci^(-1)<Tg*S, Tg<11/2: 19/4*11/2=209/8<27.
assert 19*11<27*8 and 2*27*2**4==864
out={'status':'CONDITIONAL_ACTUAL_M2_C4_GEOMETRY_REDUCTION','branches':['0:1','1:1'],
 'inputs':{
  'A':'At least 1, bounds original slow a and 1/R derivatives through order 4 on the admitted fixed-label shell.',
  'B':'At least 1, bounds original F and G derivatives through order 5 in the fixed slow coordinates.',
  'P':'max(1,|p|,|pz|,|x0|), with actual same-label frozen carriers and representative.',
  'S':'ell^2, with ell>=1.',
  'Renv':'Original C12 radial envelope with 4Xb<=Renv^2.'},
 'prePullbackNormalC4':'N := P*(A+864*S*B) bounds every original normal component and its derivatives through order 4.',
 'sourceCoefficientC4':'C4 <= A + 4*epsilon^(-1/2)*N.',
 'postPullbackProjectionM':'M = max(1,16*N,4*Renv^2/epsilon) is sufficient for the preceding projected-source C4 bound.',
 'proof':'The original local phase-gradient checks give (Dr phi,partial_theta phi/R,Dz phi)=n. The moving frame is (x0-v*HR,p/R,pz-epsilon*v*HZ), HR=dR(pF+pzG), HZ=dZ(pF+pzG), with p,pz,x0 frozen. The original source palette and fixed lift give |v| and all its derivatives through order four <=27S on 0<=v<=Ls. Each derivative of HR,HZ through order 4 is <=2 P B. The product rule uses at most 2^4=16 terms, hence all three normal-component derivatives are <=P(A+864 S B). Since k<=2 epsilon^(-1/2), every derivative of 2k*n is <=4 epsilon^(-1/2)*N. After the affine H_w pullback, derivatives cost at most 16, and the original carrier gives |n|^(-2)<=4Renv^2/epsilon.',
 'KSubstitution':'If the independently proved same-family source estimate A<=K*epsilon^(-kappa_s) applies on this fixed-label domain, the existing directed K<T25 gives A<T25*epsilon^(-kappa_s). This does not bound B or P by T25.',
 'scope':'Conditional reduction of the actual two selected C4 source coefficients and projection normal. A,B,P and Renv are original source quantities; no directed finite enclosure for B or P, no H_w-independent source theorem, no matrix propagator/output or jet claim follows.',
 'pins':{'projectionSHA256':hashlib.sha256(Q.read_bytes()).hexdigest(),'hwSHA256':hashlib.sha256(H.read_bytes()).hexdigest(),'normalInverseSHA256':hashlib.sha256(I.read_bytes()).hexdigest(),'priorGammaSHA256':hashlib.sha256(G.read_bytes()).hexdigest(),**{k:v[1] for k,v in files.items()}},'release':'HOLD'}
dest=Path('work/goal-next/continuation42/forced/n3-m2-c4-source-geometry.json');dest.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS selected same-live C4 reduction to A,B,P and explicit inverse normal')
