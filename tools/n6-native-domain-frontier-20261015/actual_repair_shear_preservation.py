#!/usr/bin/env python3
"""Small source reader for actual I1/I2 E-repair shear preservation.

Actual root-box existence is an OPEN premise, never inferred from a
registry's radius or proof booleans. This reads an authenticated fresh
cache and exports <=500 selected nodes; it does not run any producer.
"""
from __future__ import annotations
import argparse,hashlib,importlib.util,json,os
from functools import lru_cache
from pathlib import Path
from fractions import Fraction as Q
import sympy as S

def canonical(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return hashlib.sha256(canonical(x)).hexdigest()
def rational_certificate():
 r=Q(1,1000000);beta=64;beta1=1024;xmax=14
 rel=xmax*beta*r;logder=(xmax*xmax*beta1+xmax*beta)*r
 step_inner=Q(41**2,10)+Q(189,4)
 outer_poly=(2*Q(5,2)**3+10)**2+6*Q(5,2)**4
 assert step_inner<256 and outer_poly<2048
 assert Q(4375,108)<41 and 6*(Q(5,2)**4-Q(5,3)**4)<189
 assert Q(125,36)>3 and rel<1 and 2*logder/(1-rel)<Q(1,2)
 t=S.Symbol('t',real=True)
 assert S.factor(S.Rational(1,108)-t*(1-t)**2/16-(t-S.Rational(1,3))**2*(S.Rational(4,3)-t)/16)==0
 return {'actualStep':'sigma(t)=exp(-1/t^2)/(exp(-1/t^2)+exp(-1/(1-t)^2)), extended by0/1',
  'universalStepFirstDerivativeUpper':32,'universalStepSecondDerivativeAbsoluteUpper':256,
  'actualHalfWidthBumpUpper':beta,'actualHalfWidthBumpDerivativeAbsoluteUpper':beta1,
  'rootBoxRadius':str(r),'normalizedSupportXUpper':xmax,'relativeEChangeOverLambdaUpper':str(rel),
  'logRadialRelativeChangeOverLambdaUpper':str(logder),'shearChangeOverLambdaUpper':str(2*logder/(1-rel)),
  'strictlyBelowHalf':True,'conclusionGivenActualRootBox':'E_new>0 and a_new>=2+3lambda/2, hence vs_new>=a_new>2 on each actual repair patch.',
  'arithmeticNegativeControls':[{'name':'root radius enlarged to1/1000','rejected':not (2*(xmax*xmax*beta1+xmax*beta)*Q(1,1000)/(1-xmax*beta*Q(1,1000))<Q(1,2))},
   {'name':'discarded lambda factor in E repair','rejected':not (2*logder/(1-rel)<Q(1,2**201))}]}
def main():
 p=argparse.ArgumentParser();p.add_argument('--source-db',type=Path);p.add_argument('--stage3',type=Path);p.add_argument('--header',type=Path)
 p.add_argument('--compact',type=Path,required=True);p.add_argument('--profile',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 p.add_argument('--arithmetic-only',action='store_true');a=p.parse_args();arith=rational_certificate()
 C=json.loads(a.compact.read_text(encoding='utf-8'))
 assert hashlib.sha256(a.profile.read_bytes()).hexdigest()=='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
 text=a.profile.read_text(encoding='utf-8');profile=json.loads(text.split('export const PINNED_N3 = ',1)[1].strip().removesuffix(';'))
 params=profile['parametersExactExpressions'];assert params['BOuter']=={'product':[{'integer':1000},{'ref':'T'}]}
 assert params['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}} and params['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
 for patch,offset in (('I1',-25),('I2',-20)):
  assert params['X0'+patch]=={'product':[{'ref':'XR'},{'exp':{'sum':[{'ref':'T'},{'integer':2},{'product':[{'integer':60},{'ref':'BOuter'}]},{'integer':offset}]}}]}
  assert params[patch+'Right']=={'product':[{'ref':'X0'+patch},{'exp':{'integer':5}}]}
 common={'schema':'MathScope.N6.ActualRepairShearPreservation/1','executionRun':os.environ.get('GITHUB_RUN_ID'),
   'sourceHeaderSHA256':C['sourceHeaderSHA256'],'profileFileSHA256':hashlib.sha256(a.profile.read_bytes()).hexdigest(),
   'parameterExpressionSHA256':profile['parameterExpressionSHA256'],'independentRationalPreservationCertificate':arith,
   'actualRootBoxExistenceProved':False,'completedLeadingWholeDomainGapProved':False,
   'newOriginalGuardDischarged':0,'newOriginalJetDischarged':0,'newOriginalPDEDischarged':0}
 if a.arithmetic_only:
  common.update({'actualSourceFormulaBindingsComplete':False,'scope':'Rational preservation theorem plus pinned actual parameter tree only; fresh source-node binding still pending.'})
  a.out.write_text(json.dumps(common,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');return
 assert a.source_db and a.stage3 and a.header
 assert hashlib.sha256(a.stage3.read_bytes()).hexdigest()=='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f'
 assert hashlib.sha256(a.header.read_bytes()).hexdigest()==C['sourceHeaderSHA256']
 sp=importlib.util.spec_from_file_location('repair_original_v3',a.stage3);v3=importlib.util.module_from_spec(sp);sp.loader.exec_module(v3)
 g=v3.Source(a.source_db);reg=v3.registries(json.loads(a.header.read_text(encoding='utf-8')));selected={};root_atoms={}
 for index in (1,2):
  assert sha(reg['quadratic'][index])==C['definitions']['quadratic:'+str(index)]['sha256']
  rr=g(reg['quadratic'][index]['rootRadius']);assert rr=={'op':'rational','args':['1','1000000']};selected[str(reg['quadratic'][index]['rootRadius'])]=rr
 X,x,XR,P,T,B,lam=S.symbols('X x XR P T B lambda',positive=True);eta=S.Symbol('eta',real=True)
 pwr=S.Rational(1,2)+lam;Xi1=XR*S.exp(T+2+60*B-25);Xi2=XR*S.exp(T+2+60*B-20)
 par={'XR':XR,'Pstar':P,'T':T,'BOuter':B,'lambda':lam,'X0I1':Xi1,'X0I2':Xi2}
 Sigma1=S.Function('actual_sigma_prime');Sigma0=S.Function('actual_sigma')
 @lru_cache(None)
 def at(i):
  n=g(i);selected[str(i)]=n;op=n['op'];xs=n['args'];assert len(selected)<=500,'Selected repair cone exceeds500 source nodes'
  if op=='rational':return S.Rational(*map(int,xs))
  if op=='coordinate':
   if i==4756:return X
   if i==2:return eta
   return S.Symbol('original_coordinate_'+str(i),real=True)
  if op=='source_parameter':return par[xs[0]]
  if op=='add':return S.Add(*(at(j) for j in xs))
  if op=='multiply':return S.Mul(*(at(j) for j in xs))
  if op=='inverse':return 1/at(xs[0])
  if op=='integer_power':return at(xs[0])**xs[1]
  if op=='sqrt_positive':return S.sqrt(at(xs[0]))
  if op=='exp':return S.exp(at(xs[0]))
  if op=='log_positive':return S.log(at(xs[0]))
  if op=='source_step_derivative':
   assert xs[1] in (0,1)
   return (Sigma0 if xs[1]==0 else Sigma1)(at(xs[0]))
  if op=='actual_quadratic_root':
   assert xs[0] in (1,2) and xs[2]==2
   root_atoms[i]={'system':xs[0],'component':xs[1],'actualEta':xs[2]}
   return S.Symbol('actual_z'+str(xs[0])+'_'+str(xs[1]),real=True)
  if op=='definite_integral':
   body,var,left,right=xs;bn=g(body);selected[str(body)]=bn;selected[str(var)]=g(var)
   assert bn=={'op':'source_step_derivative','args':[var,0]} and at(left)==0 and at(right)==1
   return S.Rational(1,2) # exact sigma(t)+sigma(1-t)=1
  raise ValueError('Unreviewed original repair/base operator '+str(i)+' '+op)
 def normalize(y):return S.simplify(S.expand_log(y,force=True))
 def eq(y,z):return normalize(y-z)==0
 k1=at(8799);k2=at(71685);base=at(71874);repairs={9227:at(9227),9209:at(9209),71740:at(71740)}
 expectedK=lambda offset:P/(1+eta**2)*S.exp(-T/2-S.Rational(7,10)-lam/2-pwr*(60*B+offset))
 assert eq(k1,expectedK(-25)) and eq(k2,expectedK(-20))
 # The actual power-stage E reconstructed from the full pressure density.
 assert eq(base.subs(X,Xi1*x),k1*x**(-pwr)) and eq(base.subs(X,Xi2*x),k2*x**(-pwr))
 original_bump=lambda left:2*Sigma1(2*(x-left))
 source_checks=[]
 for root,system,components,lefts,Kval,X0 in ((9227,1,(2,3,4),(11,12,13),k1,Xi1),(9209,1,(0,1),(9,10),k1,Xi1),(71740,2,(0,1,2),(11,12,13),k2,Xi2)):
  expected=Kval*lam*sum(S.Symbol('actual_z'+str(system)+'_'+str(j),real=True)*original_bump(left) for j,left in zip(components,lefts))
  assert eq(repairs[root].subs(X,X0*x),expected)
  source_checks.append({'actualRepairSource':root,'quadraticSystem':system,'actualComponents':list(components),'actualHalfWidthBumpLefts':list(lefts),'exactOriginalFormulaChecked':True})
 # Bind the actual unchanged reserved-power selector and the guarded repair
 # summands in the final leading F, without interpreting other stages.
 expected_nodes={71875:{'op':'smooth_piecewise','args':[4791,76,98,71874,71874,71865]},
  71905:{'op':'smooth_piecewise','args':[4756,7981,7982,0,9227,0]},
  71741:{'op':'smooth_piecewise','args':[4756,71678,71679,0,71740,0]},
  71959:{'op':'smooth_piecewise','args':[4756,3617,71673,4759,71958,71958]},
  71958:{'op':'multiply','args':[4781,71957]},71957:{'op':'add','args':[71955,71956]},
  71956:{'op':'add','args':[71741,71907]},71907:{'op':'add','args':[71905,71906]}}
 for i,n in expected_nodes.items():assert g(i)==n;selected[str(i)]=n
 assert eq(at(4791),S.log(X/XR)) and eq(at(76),T+2) and eq(at(98),T+2+60*B)
 # Negative control: original width/offset and lambda factors are binding.
 controls=[]
 for name,wrong,right in (('changed actual bump width',Sigma1(x-11),original_bump(11)),
  ('omitted actual lambda normalization',k1*original_bump(11),k1*lam*original_bump(11)),
  ('changed actual reserved-power exponent',k1*x**(-S.Rational(1,2)),k1*x**(-pwr))):
  assert not eq(wrong,right);controls.append({'name':name,'rejected':True})
 common.update({'actualSourceFormulaBindingsComplete':True,'selectedSourceNodeCount':len(selected),'originalSelectedSourceGraph':selected,
  'actualQuadraticDefinitions':{str(j):C['definitions']['quadratic:'+str(j)] for j in (1,2)},
  'actualRootAtoms':root_atoms,'actualRepairBindings':source_checks,'actualReservedPowerBranch':71874,
  'actualBaseIdentitiesCheckedForBothPatches':True,'strictSourceNegativeControls':controls,
  'scope':'Exact actual I1/I2 formula and quantitative shear preservation, conditional on genuine original root-box solutions and unchanged source patch/collar domains.',
  'remainingOpen':['Existence of the actual I1/I2 roots in their original10^-6 boxes from their actual incoming debts; radius metadata alone is not evidence.',
   'Whole completed-leading positivity/shear margins outside I1/I2, including all actual C12 loop and flat collars.',
   'Original finite native background/source domains and the unchanged patch separation from the heat switch.'],
  'freshCacheScope':'Reader consumes the fresh cache authenticated by preceding full source replay; no full producer is run here.'})
 a.out.write_text(json.dumps(common,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 print(json.dumps({'selectedSourceNodes':len(selected),'actualRepairFormulas':len(source_checks),'actualRootBoxExistenceProved':False,'newOriginalDischarged':0}))
if __name__=='__main__':main()
