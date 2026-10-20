#!/usr/bin/env python3
"""Bind actual frozen-frame domains to completed-leading shear premises.

This is a conditional domain theorem, not a proof of the source C12 margin.
Fresh SQLite mode independently checks matrix ancestry; compact-only mode
retains that explicit gap. No complete source graph is exported or built.
"""
from __future__ import annotations
import argparse,hashlib,importlib.util,json,os
from functools import lru_cache
from pathlib import Path
import sympy as S

def canonical(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return hashlib.sha256(canonical(x)).hexdigest()
def require(condition):
 if not condition:raise AssertionError('Exact original frozen-frame binding failed')
def main():
 p=argparse.ArgumentParser();p.add_argument('--compact',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 p.add_argument('--source-db',type=Path);p.add_argument('--stage3',type=Path);p.add_argument('--header',type=Path)
 a=p.parse_args();fresh=a.source_db is not None
 assert fresh==bool(a.stage3)==bool(a.header),'Supply source-db, stage3 and header together'
 C=json.loads(a.compact.read_text(encoding='utf-8'));G=C['sourceGraphExcerpt'];reg=None
 if fresh:
  assert hashlib.sha256(a.stage3.read_bytes()).hexdigest()=='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f'
  assert hashlib.sha256(a.header.read_bytes()).hexdigest()==C['sourceHeaderSHA256']
  sp=importlib.util.spec_from_file_location('frame_original_v3',a.stage3);v3=importlib.util.module_from_spec(sp);sp.loader.exec_module(v3)
  source=v3.Source(a.source_db);reg=v3.registries(json.loads(a.header.read_text(encoding='utf-8')))
  def node(i):
   n=source(i)
   if str(i) in G:assert n==G[str(i)]
   return n
 else:
  def node(i):return G[str(i)]
 def definition(key):
  d=C['definitions'][key];return d.get('fullDefinition',d)
 Fdef=definition('expression:692');Udef=definition('expression:693')
 assert Fdef['name']=='ActualCommonBandLeading_F' and Udef['name']=='ActualCommonBandLeading_G'
 assert Fdef['parameters']==Udef['parameters']==[622802,622803,622804]
 if fresh:
  for index in (692,693):assert sha(reg['expression'][index])==C['definitions']['expression:'+str(index)]['sha256']
 # These actual source calls are the original frozen leading value and
 # derivatives, not values from the pre-C12 state or completed full Fn sum.
 Rrep,Zrep,Trep=622954,622958,622962;F0,FR0,GR0=622971,622981,622991
 for root,system,orders in ((F0,692,[0,0,0]),(FR0,692,[1,0,0]),(GR0,693,[1,0,0])):
  assert node(root)=={'op':'actual_expression_partial','args':[system,[Rrep,Zrep,Trep],orders]}
 roots={'radialFrozenGradient':622992,'axialFrozenGradient':GR0,'gabs':622996,'N0':622998,'N1':622999,
        'growthRadicand':623005,'lambda0':623006,'c0':623008,'Bs':623034,'ci':623025,'Ls':623027}
 F,aa,bb,R,eps,k,ci,u=S.symbols('F a bs R epsilon k ci u',positive=True)
 # bs and u are real; no nonzero/positive axial-shear assumption is used.
 bb=S.Symbol('bs',real=True);u=S.Symbol('u',real=True)
 env={F0:F,FR0:-aa*F/R,GR0:bb*F,Rrep:R,622798:eps,622801:k,623025:ci,617291:u}
 selected={}
 def expression(root,overrides=None):
  local={**env,**(overrides or {})}
  @lru_cache(None)
  def at(i):
   selected[str(i)]=node(i)
   if i in local:return local[i]
   n=node(i);op=n['op'];xs=n['args']
   if op=='rational':return S.Rational(*map(int,xs))
   if op=='add':return S.Add(*(at(j) for j in xs))
   if op=='multiply':return S.Mul(*(at(j) for j in xs))
   if op=='inverse':return 1/at(xs[0])
   if op=='integer_power':return at(xs[0])**xs[1]
   if op=='sqrt_positive':return S.sqrt(at(xs[0]))
   raise ValueError('Unreviewed operator inside frozen-frame proof cone '+str(i)+' '+op)
  return at(root)
 norm2=aa**2+bb**2;vs=norm2/aa
 computed={name:expression(root) for name,root in roots.items()}
 eq=lambda x,y:S.factor(x-y)==0 or S.simplify(x-y)==0
 checks={
  'actualRadialGradientAfterExactShearIdentity':eq(computed['radialFrozenGradient'],-aa*F),
  'actualAxialGradientAfterExactShearIdentity':eq(computed['axialFrozenGradient'],bb*F),
  'actualNormSquared':eq(computed['gabs']**2,F**2*norm2),
  'actualNormalRadialSignFormula':eq(computed['N0'],-aa/S.sqrt(norm2)),
  'actualNormalAxialFormula':eq(computed['N1'],bb/S.sqrt(norm2)),
  'actualGrowthFormula':eq(computed['growthRadicand'],2*F**2*aa**2*(vs-2)/norm2),
  'actualPositiveLambdaBranch':node(623006)=={'op':'sqrt_positive','args':[623005]},
  'actualLambdaSquared':eq(computed['lambda0']**2,computed['growthRadicand']),
  'actualC0SignedFormula':eq(computed['c0'],computed['lambda0']/(2*F*computed['N0'])),
  'actualC0Squared':eq(computed['c0']**2,(vs-2)/2),
  'actualPositiveBsBranch':node(623034)['op']=='sqrt_positive',
  'actualBsSquared':eq(computed['Bs']**2,computed['lambda0']/(eps*k**2*(1+u**2)**S.Rational(3,2))),
  'actualPositiveLengthFormula':eq(computed['Ls'],S.Rational(1,8589934592)/ci)}
 assert all(checks.values()),checks
 # Source positive exponential / ceiling / positive-length operand shapes.
 assert node(622798)['op']=='exp' and node(622801)['op']=='ceiling'
 kinv=node(node(622801)['args'][0]);assert kinv['op']=='inverse'
 assert node(kinv['args'][0])=={'op':'sqrt_positive','args':[622798]}
 assert node(623025)['op']=='multiply' and len(node(623025)['args'])==2
 assert all(node(i)['op']=='exp' for i in node(623025)['args'])
 # Retain those exact immediate positive source cones without pulling in
 # the completed profile, integer-label producer, or source environment.
 for i in (622798,622801,node(622801)['args'][0],kinv['args'][0],623025,*node(623025)['args']):selected[str(i)]=node(i)
 # Full leading chart bodies bind the physical shear identities to the
 # same two native base profiles used by the source background proof.
 assert Fdef['body']==622942 and Udef['body']==622950
 assert node(622942)=={'op':'multiply','args':[622884,622941]}
 assert node(622950)=={'op':'multiply','args':[622886,622949]}
 assert node(622941)=={'op':'actual_expression_partial','args':[2,[622824,622829],[0,0]]}
 assert node(622949)=={'op':'actual_expression_partial','args':[3,[622824,622829],[0,0]]}
 assert node(622820)=={'op':'actual_monotone_root','args':[2,622803,622804]}
 # The R-independence of the implicit chart root is read from its actual
 # arguments. Its existence/regularity comes from the original chart proof.
 chart_selected={}
 ss,A,D=S.symbols('s A D',positive=True);RR=S.Symbol('R',positive=True);ZZ=S.Symbol('Z',real=True)
 XrepVar,srepVar=S.symbols('Xrep srep',positive=True);etarepVar=S.Symbol('etarep',real=True)
 chart_env={622820:ss,622802:RR,622803:ZZ,25246:-A-S.Rational(1,2),281:-A,22:D}
 chart_env.update({622807:XrepVar,622808:etarepVar,622809:srepVar})
 @lru_cache(None)
 def chart_at(i):
  chart_selected[str(i)]=node(i)
  if i in chart_env:return chart_env[i]
  n=node(i);op=n['op'];xs=n['args']
  if op=='rational':return S.Rational(*map(int,xs))
  if op=='add':return S.Add(*(chart_at(j) for j in xs))
  if op=='multiply':return S.Mul(*(chart_at(j) for j in xs))
  if op=='integer_power':return chart_at(xs[0])**xs[1]
  if op=='inverse':return 1/chart_at(xs[0])
  if op=='sqrt_positive':return S.sqrt(chart_at(xs[0]))
  if op=='exp':return S.exp(chart_at(xs[0]))
  if op=='log_positive':return S.log(chart_at(xs[0]))
  raise ValueError('Unexpected original slow-chart operator '+str(i)+' '+op)
 X=chart_at(622824);eta=chart_at(622829);mf=chart_at(622884);mg=chart_at(622886)
 assert eq(X,RR**2/(2*ss)) and eq(eta,ZZ*ss**(-D))
 assert eq(mf,ss**(-A-S.Rational(1,2))) and eq(mg,ss**(-A))
 assert eq(S.diff(X,RR),RR/ss) and S.diff(eta,RR)==0 and S.diff(mf,RR)==S.diff(mg,RR)==0
 require(eq(RR*S.diff(X,RR),2*X))
 require(eq((mg/mf)*S.diff(X,RR),S.sqrt(2*X)))
 require(eq(RR*mf/S.sqrt(2*X),mg))
 representativeExpressions=[chart_at(i) for i in (Rrep,Zrep,Trep)]
 require(all(eq(x,y) for x,y in zip(representativeExpressions,[S.sqrt(2*XrepVar*srepVar),srepVar**D*etarepVar,srepVar*(1-etarepVar**2)])))
 # Verify the actual exponent operands, rather than substituting arbitrary
 # power constants into the chart proof. A=1/2+h, D=1/2-h.
 h=S.Symbol('h',positive=True)
 def scalar(i):
  n=node(i);selected[str(i)]=n;op=n['op'];xs=n['args']
  if i==9:return h
  if op=='rational':return S.Rational(*map(int,xs))
  if op=='add':return sum(scalar(j) for j in xs)
  if op=='multiply':return S.prod(scalar(j) for j in xs)
  raise ValueError('Unexpected actual chart exponent '+str(i)+' '+op)
 assert eq(scalar(25246),-(1+h)) and eq(scalar(281),-(S.Rational(1,2)+h)) and eq(scalar(22),S.Rational(1,2)-h)
 selected.update(chart_selected)
 for i in (622942,622950,622941,622949,622820):selected[str(i)]=node(i)
 ancestry=[];missing_ancestry=not fresh
 if fresh:
  unary={'inverse','sqrt_positive','exp','log_positive','integer_power','ceiling','source_step_derivative','sine','cosine'}
  many={'add','multiply','maximum','smooth_piecewise','definite_integral'}
  for covariance in (0,1):
   rec=C['definitions']['covariance:'+str(covariance)];d=rec.get('fullDefinition',rec)
   actual=[r for r in reg['m3GlobalPulses'] if r['covariance']==covariance]
   assert len(actual)==1 and actual[0]==d and sha(actual[0])==rec['sha256']
   seen=set();todo=[i for row in d['matrix'] for i in row]
   while todo:
    i=todo.pop()
    if i in seen:continue
    seen.add(i);assert len(seen)<=20000,'Explicit remote matrix search budget exceeded'
    n=node(i);op=n['op'];xs=n['args']
    if op in unary:todo.extend(xs[:1])
    elif op in many:todo.extend(xs)
   require(set(roots.values()).issubset(seen))
   ancestry.append({'covariance':covariance,'definitionSHA256':rec['sha256'],'actualMatrixRoots':d['matrix'],
                    'primitiveSearchNodes':len(seen),'allActualStaticFrameRootsAreMatrixAncestors':True})
 # The source mutations make a wrong connection or a lost sign fail.
 controls=[]
 def reject(name,test):
  try:require(test())
  except AssertionError:controls.append({'name':name,'rejected':True})
  else:raise AssertionError('Accepted changed actual frame control '+name)
 reject('omitted physical R in actual radial gradient',lambda:eq(expression(622996,{FR0:-aa*F}),F*S.sqrt(norm2)))
 reject('changed actual radial shear sign',lambda:eq(expression(623005,{FR0:aa*F/R}),2*F**2*aa**2*(vs-2)/norm2))
 reject('omitted actual factor two in growth interaction',lambda:eq(2*F**2*aa*(norm2-aa)/norm2,computed['growthRadicand']))
 reject('changed c0 branch sign',lambda:eq(-computed['c0'],computed['c0']))
 assert len(selected)<=500,'Selected frame proof cone exceeds500 source nodes'
 result={'schema':'MathScope.N6.ActualFrozenFrameConditionalDomains/1','executionRun':os.environ.get('GITHUB_RUN_ID'),
  'sourceHeaderSHA256':C['sourceHeaderSHA256'],'compactSHA256':hashlib.sha256(a.compact.read_bytes()).hexdigest(),
  'freshCacheScope':'Fresh mode reads the same cache authenticated by the preceding original-source replay; this small reader does not independently authenticate the complete SQLite graph.',
  'freshMatrixAncestryVerified':not missing_ancestry,'actualMatrixAncestryBindings':ancestry,
  'actualCompletedLeadingDefinitions':{key:C['definitions'][key] for key in ('expression:2','expression:3','expression:692','expression:693')},
  'actualFrozenLeadingCalls':{'F0':F0,'FR0':FR0,'GR0':GR0,'representative':[Rrep,Zrep,Trep]},'actualStaticRoots':roots,
  'originalSelectedSourceGraph':selected,'selectedSourceNodeCount':len(selected),'exactAlgebraChecks':checks,'strictNegativeControls':controls,
  'actualChartChainRule':{'X':str(X),'eta':str(eta),'FMultiplier':str(mf),'GMultiplier':str(mg),
    'actualRepresentativeImage':[str(x) for x in representativeExpressions],
    'baseFDefinition':2,'baseUDefinition':3,'fixedZTPreservesSAndEta':True,
    'radialChainFactorExactly2X':True,'axialChainFactorExactlySqrt2X':True,'physicalEIsPositiveChartMultipleOfBaseE':True,
    'exactCompletedLeadingShears':'a=−2X*Fbase_X/Fbase; bs=sqrt(2X)*Ubase_X/Fbase; R*F_R=−a*F; G_R/F=bs',
    'analyticPremise':'The same actual completed leading base F/U are C1 and the original slow-chart inverse exists on its unchanged image.'},
  'conditionalStaticDomainTheorem':{'premises':['Original representative R>0 and completed-leading E=R*F>0.',
    'Completed-leading actual a>0 and vs=a+bs^2/a>2 at that same representative.',
    'Actual epsilon and ci exponent operands are finite real, so epsilon>0, ci>0; actual k=ceil(epsilon^-1/2)>=1.',
    'All unchanged frozen source coefficients, including u, are finite real.'],
   'identities':['gabs^2=F^2*(a^2+bs^2)','lambda0^2=2*F^2*a^2*(vs−2)/(a^2+bs^2)',
    'c0=−sqrt((vs−2)/2)','Bs^2=lambda0/(epsilon*k^2*(1+u^2)^(3/2))','Ls=2*r0/ci'],
   'conclusion':'gabs>0, lambda0>0, c0<0, Bs>0, Ls>0. The static original moving-frame divisions and square roots have their required domains. Together with the separate actual dynamic nt/n^2 binder, the moving-frame algebra introduces no additional denominator or radical obstruction under these completed-leading premises. Native whole-background functions retain their separate OPEN domains and regularity.'},
  'completedLeadingPositiveShearMarginProvedHere':False,'preloopMarginSubstitutedForCompletedLeading':False,
  'wholeVolterraRegularityProved':False,'newOriginalGuardDischarged':0,'newOriginalJetDischarged':0,'newOriginalPDEDischarged':0,
  'remainingOpen':['Actual completed-leading C1 and strict E/a/vs>2 source bounds on the entire representative domain.',
   'The full original background-profile regularity and finite source parameters.',
   *([] if fresh else ['Fresh covariance matrix ancestry check: compact-only diagnostic mode.'])]}
 a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 print(json.dumps({'selectedSourceNodes':len(selected),'actualStaticFormulaChecks':len(checks),'freshMatrixAncestryVerified':fresh,
                   'completedLeadingMarginStillOpen':True,'newOriginalDischarged':0}))
if __name__=='__main__':main()
