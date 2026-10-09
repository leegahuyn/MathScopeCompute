#!/usr/bin/env python3
"""Independent mpmath 100-decimal fixtures. Does not validate the complete source theorem."""
from pathlib import Path
import json, hashlib, mpmath as mp
mp.mp.dps=100
BASE=Path(__file__).resolve().parent
fmt=lambda x:mp.nstr(x,80)
h=mp.mpf('0.005')
def heat(Z,m):
 a=h+m
 return (-1)**m*mp.rf(h,m)/mp.gamma(1+h)*mp.quad(lambda v:mp.exp(-v)*v**a/(1+Z*v)**a,[0,1,10,100,mp.inf])
heats=[]
for zs in ['0','0.1','1','10']:
 Z=mp.mpf(zs);d=[heat(Z,m) for m in range(3)]
 heats.append({'Z':zs,'h':'0.005','derivatives':list(map(fmt,d)),'odeResidual':fmt(Z**2*d[2]+(1+(2+2*h)*Z)*d[1]+h*(1+h)*d[0])})
coordinates=[]
for nus in ['0.1','1','3']:
 for es in ['-0.8','0','0.62']:
  nu=mp.mpf(nus);eta=mp.mpf(es);X=mp.mpf('0.37');tau=mp.mpf('0.1');theta=mp.mpf('0.7');q=tau/(1-eta**2);D=mp.mpf('.5')-h;r=mp.sqrt(2*nu*q*X);pos=[r*mp.cos(theta),r*mp.sin(theta),mp.sqrt(nu)*q**D*eta]
  coordinates.append({'input':{'viscosity':nus,'tau':'0.1','h':'0.005','X':'0.37','eta':es,'theta':'0.7'},'position':list(map(fmt,pos)),'q':fmt(q)})
exterior=[]
for nus in ['0.1','1','3']:
 nu=mp.mpf(nus);tau=mp.mpf('.3');r=mp.mpf('1.2');C=2**(mp.mpf('.5')+h)
 def K(rr,tt):
  rn=rr/mp.sqrt(nu);return mp.sqrt(nu)*C*rn**(-1-2*h)*heat(4*tt/rn**2,0)
 kval=K(r,tau);dr=mp.diff(lambda x:K(x,tau),r);drr=mp.diff(lambda x:K(x,tau),r,2);dt=-mp.diff(lambda t:K(r,t),tau)
 exterior.append({'viscosity':nus,'tau':'0.3','r':'1.2','K':fmt(kval),'dr':fmt(dr),'drr':fmt(drr),'dt':fmt(dt),'cylindricalResidual':fmt(dt-nu*(drr+dr/r-kval/r**2))})
r={'schemaVersion':1,'method':'mpmath 100 decimal digits; direct original v-integral, mp.diff and exact decimal inputs','precisionDigits':100,'precisionBitsAtLeast':330,'sourceSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'heat':heats,'coordinates':coordinates,'exterior':exterior,'comparison':{'z':'4.1','f0':fmt(mp.besselj(1,mp.sqrt(mp.mpf('8.2')))/mp.sqrt(mp.mpf('2.05')))},'notClaimed':'Independent high precision numerical reference; not interval-certified mpmath or full source proof.'}
(BASE/'evidence/high-precision-fixtures.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
(BASE/'fixtures.generated.mjs').write_text('export const fixtures = '+json.dumps(r,ensure_ascii=False,indent=2)+';\n')
print('Wrote independent high-precision fixtures',flush=True)
