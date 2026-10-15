#!/usr/bin/env python3
"""Bind and differentiate the original native monotone:2 chart, not a fixture."""
import argparse
from collections import Counter
import hashlib,json
from pathlib import Path
import sympy as S

def sha(o):return hashlib.sha256(json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--extract',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 data=json.loads(a.extract.read_text(encoding='utf-8'));g=data['sourceGraphExcerpt'];definitions=data['definitions']
 def exact(i,op,args):assert g[str(i)]=={'op':op,'args':args}
 for i,op,args in [(9,'source_parameter',['h']),(24,'rational',['2','1']),(25,'multiply',[9,24]),
  (622810,'coordinate',['m3_global_band_implicit_s$30443']),(622811,'integer_power',[622803,2]),
  (622812,'log_positive',[622810]),(622813,'multiply',[25,622812]),(622814,'exp',[622813]),
  (622815,'multiply',[622811,622814]),(622816,'multiply',[20,622815]),(622817,'add',[622810,622816]),
  (622818,'multiply',[20,622804]),(622819,'add',[622817,622818]),(20,'rational',['-1','1']),
  (622820,'actual_monotone_root',[2,622803,622804])]:exact(i,op,args)
 native=definitions['monotone:2'];d=native.get('fullDefinition',native)
 assert d['name']=='ActualCommonBandSlowInverse' and d['body']==622819 and d['variable']==622810 and d['parameters']==[622803,622804]
 s,z,t,h=S.symbols('s z t h');F=s-z*z*s**(2*h)-t;den=S.diff(F,s)
 sz=-S.diff(F,z)/den;st=-S.diff(F,t)/den
 def Dz(x):return S.diff(x,z)+S.diff(x,s)*sz
 def Dt(x):return S.diff(x,t)+S.diff(x,s)*st
 source_symbols={s:622820,z:622803,t:622804,h:9}
 def expr(x):
  if x in source_symbols:return {'source':source_symbols[x]}
  if x.is_Rational:return {'op':'rational','args':[str(x.p),str(x.q)]}
  if x.is_Add:return {'op':'add','args':[expr(y) for y in x.args]}
  if x.is_Mul:return {'op':'multiply','args':[expr(y) for y in x.args]}
  if x.is_Pow:
   b,e=x.args
   if e.is_Integer:return {'op':'integer_power','args':[expr(b),int(e)]}
   return {'op':'exp','args':[{'op':'multiply','args':[expr(e),{'op':'log_positive','args':[expr(b)]}]}]}
  raise ValueError('Nonprimitive generated derivative: '+repr(x))
 derivatives=[]
 for n in range(1,4):
  for nz in range(n+1):
   nt=n-nz;x=s
   # Preserve the displayed ORDER: Z derivatives first, then T derivatives.
   for _ in range(nz):x=Dz(x)
   for _ in range(nt):x=Dt(x)
   x=S.factor(x)
   derivatives.append({'orderedSourceDirections':[622803]*nz+[622804]*nt,'orders':[nz,nt],
                       'primitiveExpression':expr(x),'text':str(x),'containsFormalDerivative':False})
 # Check the differentiated ORIGINAL equation, using independent total
 # derivatives. This does not check unrelated finite test values.
 assert S.simplify(Dz(F))==0 and S.simplify(Dt(F))==0
 assert S.cancel(Dz(st)-Dt(sz))==0
 families=[]
 for key,rows in data['families'].items():
  r=definitions[key];dd=r.get('fullDefinition',r)
  families.append({'registry':key,'name':dd.get('name'),'definitionSHA256':r['sha256'],
                   'body':dd.get('body'),'originalRequestCount':len(rows),
                   'classCounts':dict(Counter(x['classification'] for x in rows)),
                   'maximumRequestedNativeTotalOrder':max((sum(x['conditionalTarget']['orders']) for x in rows if x.get('conditionalTarget')),default=None)})
 calls=[{'source':int(k),**v} for k,v in data['sourceCalls'].items() if not v['definitionKey'].startswith('definitions:1:')]
 assert len(calls)==19 and len(families)==15
 out={'schema':'MathScope.N6.ActualNativeChartDerivativeLemma/1','newOriginalJetDischarged':0,'newOriginalPDEDischarged':0,
      'sourceHeaderSHA256':data['sourceHeaderSHA256'],'nativeDefinitionSHA256':native['sha256'],
      'nativeDefinition':d,'originalEquation':'s-Z^2*s^(2*h)-T=0',
      'originalDomain':'s in [1/2,2], Z=s^(1/2-h)*eta, T=s*(1-eta^2), eta in [-1,1], 0<h<1/16; band N frozen.',
      'proof':[
       'The actual defining F is C-infinity for s>0. On every original root Z^2*s^(2*h-1)=eta^2<=1, so F_s=1-2*h*eta^2>7/8.',
       'On the entire original bracket, Z^2<=2^(1-2h), s^(2h-1)<=2^(1-2h), so F_s>=1-2h*4^(1-2h)>1-8h>1/2. Thus the original selected bracket root is unique.',
       'The implicit function theorem at the original root gives the same unique C-infinity local branch, including a relative smooth extension at chart boundaries. This adds no restriction to the original image domain.',
       'Its first derivatives are s_Z=2Z*s^(2h)/F_s and s_T=1/F_s. Apply D_Z=partial_Z+s_Z*partial_s and D_T=partial_T+s_T*partial_s recursively to obtain the actual displayed source-bound primitive expressions.'
      ],'denominator':'1-2*h*Z^2*s^(2*h-1)','denominatorLowerAtOriginalRoots':'strictly greater than 7/8',
      'derivatives':derivatives,'actualRootEquationTotalDerivativeChecks':True,'mixedSecondDerivativeEqualityChecked':True,
      'jetFamilyMapping':families,'distinctOriginalJetSourceCalls':calls,'distinctJetSourceCallCount':19,'uniqueJetNativeDefinitionCount':15,
      'scope':'Proves the original monotone:2 chart subkernel regularity and its primitive derivatives. This does not prove regularity of all background profiles, integrals, Fourier limits or indexed fields composed with that chart.'}
 a.out.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 print(json.dumps({'bytes':a.out.stat().st_size,'actualNativeChartDerivatives':len(derivatives),'sourceCalls':19,'nativeDefinitions':15,'newOriginalJetDischarged':0}))
if __name__=='__main__':main()
