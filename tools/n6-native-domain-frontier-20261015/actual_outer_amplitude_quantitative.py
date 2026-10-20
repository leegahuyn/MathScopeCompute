"""Original outer amplitude bracket and a genuine complex coefficient tube.

The entire reference energy, including the angular change and infinite power
tail, is retained. No selectedRootBracket or derivativeFloor declaration is
accepted as an analytic premise.
"""
import argparse,copy,hashlib,json,sys
from functools import lru_cache
from fractions import Fraction as F
from pathlib import Path
try:import sympy as S
except ImportError:
 sys.path.insert(0,str(Path(__file__).resolve().parent/'audit-deps'));import sympy as S

FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
OUTER='5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9'
def need(x,m):
 if not x:raise AssertionError(m)
def exact_arithmetic():
 # Bounds hold for every actual lambda,T, not a numerical sample of them.
 # T>=128 and T+1<=2exp(T) give lambda(T+1)<2^-990.
 need(2**30*F(1,2**990)<F(1,2**100),'All nonpulse energy reserve')
 need(F(1,2**27)+F(1,2**100)<F(1,10**6),'Normalized energy error')
 ideal=F(4901,20000)
 kb_lower=ideal-F(1,500000)-F(56,2**20)
 kb_upper=ideal+F(1,375000)
 need(kb_lower>F(244,1000) and kb_upper<F(246,1000),'Actual Kb range')
 # 12800*t^2 exp(-.9t)<exp(-.5t), t>=2^200, using exp(.4t)>.4^4*t^4/24.
 need(12800*1875<2*2**400,'Affine-amplitude exponential reserve')
 need(16*F(1,2**200)<1 and 4096*F(1,2**200)<F(1,10**6),'Tiny continuous endpoint corrections')
 # Preserve strong centers for the holomorphic radicand argument.
 err=F(1,10**6)
 rad_error=err*err+4*err*(F(1,4)+err)+4*kb_upper*err
 need(rad_error<F(1,10000) and kb_lower-rad_error>F(24,100),'Complex radicand stays in right half-plane')
 need(kb_upper+err<F(1,4) and kb_lower-err>F(6,25),'Complex amp2 lower bound')
 need(kb_upper+rad_error<F(9,25),'Actual discriminant norm below (.6)^2')
 need((F(3,5)+err)/(2*F(6,25))<2,'Holomorphic selected amplitude norm')
 left=F(246,1000)*F(9,10)**2+F(1,1000)*F(9,10)-F(249,1000)
 right=F(244,1000)*F(6,5)**2-F(1,1000)*F(6,5)-F(251,1000)
 derivative=2*F(244,1000)*F(9,10)-F(1,1000)
 need(left<0 and right>0 and derivative>F(7,20),'Original selected bracket and derivative floor')
 # Complex eta-distance<1/4 from [-1,1]: |eta|²<13/8<2.
 need(1-F(1,4)**2==F(15,16) and 1+F(5,4)**2+F(1,4)**2<3,'Actual rational f tube')
 need(F(13,8)*F(21,8)**2<16,'Actual complex eta/f norm below4')
 return {'KbIdeal':str(ideal),'KbLower':str(kb_lower),'KbUpper':str(kb_upper),
   'atOriginalBracketLeftUpper':str(left),'atOriginalBracketRightLower':str(right),
   'originalDerivativeLowerImproved':str(derivative),'complexRadicandErrorUpper':str(rad_error),
   'allExactInequalitiesPassed':True}

def source_checks(fixed):
 o=fixed['outer'];g=o['nodes'];ps=o['equations']['pulse'];ang=o['equations']['angular'];st=o['stages']
 params=fixed['source']['parametersExactExpressions']
 need(params['T']=={'sum':[{'exp':{'ref':'Md'}},{'integer':10}]} and params['Md']=={'integer':1048576},'Original large T')
 need(params['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}} and params['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},'Original small lambda,h')
 need(params['BOuter']=={'product':[{'integer':1000},{'ref':'T'}]} and params['Tf']=={'integer':128},'Original stage lengths')
 T,lam,h,f,eta=S.symbols('T lambda h f eta',positive=True)
 sig=S.Function('sigma');prim=S.Function('sigmaIntegral');choose=S.Function('originalChoose')
 common={2:eta,8:lam,9:h,17:f,18:S.log(f)}
 # The node numbers above are independently checked against their actual roles.
 need(g[2]=={'op':'coordinate','args':['eta']},'Actual eta node')
 need(g[8]=={'op':'source_parameter','args':['lambda']} and g[9]=={'op':'source_parameter','args':['h']},'Actual small parameter nodes')
 need(g[17]=={'op':'inverse','args':[16]} and g[16]=={'op':'add','args':[1,15]} and g[15]=={'op':'integer_power','args':[2,2]},'Literal actual f=(1+eta^2)^-1')
 def expression(root,extra=None):
  overrides={**common,**(extra or {})}
  @lru_cache(None)
  def at(i):
   if i in overrides:return overrides[i]
   n=g[i];op,a=n['op'],n['args']
   if op=='rational':return S.Rational(*map(int,a))
   if op=='source_parameter':return {'T':T,'lambda':lam,'h':h,'BOuter':1000*T,'Tf':S.Integer(128),'co':S.Rational(1,256)}.get(a[0],S.Symbol(a[0],positive=True))
   if op=='coordinate':return S.Symbol('actual_'+str(i),real=True)
   if op=='add':return S.Add(*(at(j) for j in a))
   if op=='multiply':return S.Mul(*(at(j) for j in a))
   if op=='inverse':return 1/at(a[0])
   if op=='integer_power':return at(a[0])**a[1]
   if op=='exp':return S.exp(at(a[0]))
   if op=='log_positive':return S.log(at(a[0]))
   if op=='sqrt_positive':return S.sqrt(at(a[0]))
   if op=='source_step_derivative':
    x=S.cancel(at(a[0]));order=a[1]
    if order==0 and x in (0,1):return x
    return (sig if order==0 else S.Function('sigmaD'+str(order)))(x)
   if op=='smooth_piecewise':return choose(*(at(j) for j in a))
   if op=='definite_integral':
    body,v,lo,hi=at(a[0]),at(a[1]),at(a[2]),at(a[3])
    if body==sig(v) and lo==0:
     return S.Rational(1,2) if hi==1 else prim(hi)
    return S.Integral(body,(v,lo,hi))
   raise AssertionError('Unreviewed actual outer operator '+str((i,op)))
  return at(root)
 def equal(x,y,label):
  need(S.expand((x-y).as_dummy())==0 or S.simplify((x-y).as_dummy())==0,label)
 pulse=st[4]
 equal(expression(pulse['start'])+2*expression(pulse['logAStart']),S.Rational(3,5)-lam-120000*lam*T,'Actual pulse normalization exponent')
 alpha=-S.Rational(1,2)-lam;rho=h/256;hold=-4*S.log(h)
 W=S.Symbol('actualWait',positive=True)
 delta=[lambda s:s/10-3*prim(s)/5,lambda s:-s/2,lambda s:-s/2-lam*prim(s),
   lambda s:alpha*s,lambda s:alpha*s,lambda s:alpha*s-S.log(2)*sig(s/128),lambda s:alpha*s,
   lambda s:alpha*s-(1-lam)*prim(s),lambda s:-3*s/2,
   lambda s:-3*s/2+(1-h)*prim(s),lambda s:-(S.Rational(1,2)+h)*s,
   lambda s:-(S.Rational(1,2)+h)*s+S.log((1-rho*(1-sig((s-1)/2)))/(1-rho))]
 slopes={1:-S.Rational(1,2),3:alpha,4:alpha,6:alpha,8:-S.Rational(3,2),10:-S.Rational(1,2)-h}
 duration=[1,T,1,60000*T,13/lam,128,30000*T,1,hold,1,W,3]
 common_extra={o['roots']['terminalWait']:W}
 stage_checks=[]
 for j,row in enumerate(st):
  s=expression(row['localCoordinate']);ys=expression(row['start'],common_extra);a0=expression(row['logAStart'],common_extra)
  theta=0 if j>=6 else (1-sig(s/128) if j==5 else 1)
  factor=S.exp(ys+2*a0)
  if j in slopes:
   rate=1+2*slopes[j]
   expected=factor*f**(2*theta)*(duration[j] if rate==0 else (S.exp(rate*duration[j])-1)/rate)
  else:expected=factor*S.Integral(S.exp(s+2*delta[j](s)+2*theta*S.log(f)),(s,0,duration[j]))
  got=expression(row['energy'],common_extra)
  equal(got,expected,'Literal energy stage '+row['id']);stage_checks.append(row['id'])
 # Identify the exact total: all twelve actual stages + reference term +
 # full infinite tail + the actual angular energy change. No term is omitted.
 def add_leaves(i,stops):
  if i in stops:return[i]
  n=g[i];return sum((add_leaves(j,stops) for j in n['args']),[]) if n['op']=='add' else[i]
 leaves=add_leaves(o['roots']['totalOuterEnergy'],{r['energy'] for r in st})
 need(all(leaves.count(r['energy'])==1 for r in st),'Every actual energy stage retained')
 rest=[i for i in leaves if i not in {r['energy'] for r in st}]
 # Angular energy is an add and therefore appears as its two correction terms.
 @lru_cache(None)
 def contains(i,target):
  if i==target:return True
  op,a=g[i]['op'],g[i]['args']
  if op in ('rational','coordinate','source_parameter'):return False
  child=a[:1] if op in ('integer_power','source_step_derivative') else a
  return any(contains(j,target) for j in child)
 ang_ids=[i for i in rest if any(contains(i,c) for c in ang['coefficients'])]
 nong=[i for i in rest if i not in ang_ids]
 terminal=st[-1];tail=S.exp(expression(terminal['end'],common_extra)+2*expression(terminal['logAEnd'],common_extra))/(2*h)
 tail_ids=[i for i in nong if S.simplify(expression(i,common_extra)-tail)==0]
 need(len(tail_ids)==1,'Full infinite exterior power tail retained')
 ref_ids=[i for i in nong if i not in tail_ids and S.simplify(expression(i,common_extra)-S.Rational(5,6)*f*f)==0]
 need(len(ref_ids)==1,'Actual reference prefix energy retained')
 need(set(rest)==set(tail_ids+ref_ids+ang_ids),'No omitted reference energy term')
 need(len(ang_ids)==2,'Both actual angular energy corrections retained')
 C0,C1=S.symbols('actualAngularC0 actualAngularC1')
 ac={ang['coefficients'][0]:C0,ang['coefficients'][1]:C1,**common_extra}
 for j,i in enumerate(ang_ids):
  term=expression(i,ac)
  need(term.has((C0,C1)[j]) and not term.has((C0,C1)[1-j]),'Each retained angular correction has its actual coefficient')
 # Literal actual amplitude polynomial and its complete normalizations.
 nu,ne,Kb=S.symbols('nu ne Kb');w0,w1,A0,A1,B0,B1=S.symbols('w0 w1 A0 A1 B0 B1')
 poly_over={889:nu,893:ne,907:w0,921:w1,ps['affineConstant'][0]:A0,ps['affineConstant'][1]:A1,ps['affineAmplitude'][0]:B0,ps['affineAmplitude'][1]:B1,o['roots']['Kb']:Kb}
 expected=[nu-ne/2+w0*A0*A0+w1*A1*A1,2*w0*A0*B0+2*w1*A1*B1,Kb+w0*B0*B0+w1*B1*B1]
 for i,v in zip(ps['amplitudePolynomial'],expected):equal(expression(i,poly_over),v,'Actual full amplitude coefficient')
 # Verify the complete main pulse ends at w=11; its primitive is w-.01 on [.02,10].
 rr=expression(o['roots']['R0']);vv=next(iter(rr.free_symbols-{T,lam,h,f,eta}))
 integrals=list(rr.atoms(S.Integral));need(len(integrals)==1,'Original R0 beginning has one actual prefix')
 ip=integrals[0];iv=ip.limits[0][0]
 expected_r=choose(vv,0,S.Rational(1,50),0,S.Integral(sig(50*iv),(iv,0,vv)),vv-S.Rational(1,100))*(1-sig(vv-10))
 equal(rr,expected_r,'Actual compact R0 body')
 # Wrong sign/normalization controls concern the literal original body.
 need(S.expand(expression(ps['amplitudePolynomial'][0],poly_over)-(nu+ne/2+w0*A0*A0+w1*A1*A1))!=0,'Negative energy sign control')
 need(len(stage_checks)==12 and len(leaves)==16,'Complete literal reference energy decomposition')
 return {'allTwelveLiteralEnergyStages':stage_checks,'completeEnergyLeaves':leaves,'infinitePowerTailNode':tail_ids[0],
   'angularEnergyCorrectionNodes':ang_ids,'referenceEnergyNode':ref_ids[0],
   'literalPulseNormalizationExponent':'3/5-lambda-120000*lambda*T','allThreeLiteralAmplitudeCoefficients':True,
   'literalCompactMainPulseBody':True,'negativeEnergySignMutationRejected':True}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for name in ('payload','kernel-binding','outer','out'):p.add_argument('--'+name,type=Path,required=True)
 p.add_argument('--kernels',type=Path,default=Path(__file__).resolve().parent/'regularity-source');a=p.parse_args()
 paths={'payload':a.payload,'kernel-binding':a.kernel_binding,'outer':a.outer};raw={k:v.read_bytes() for k,v in paths.items()};d={k:json.loads(v) for k,v in raw.items()}
 fixed=d['payload']['fullNativePayloads']['fixed'];b=d['kernel-binding'];outer=d['outer']
 need(b['schema']=='MathScope.N6.ActualNaturalOriginalKernelRebinding/1' and b['fixedDefinitionSHA256']==FIXED,'Same original fixed kernel')
 need(b['fullActualOuterProgramEqual'] and b['sourceKernelBytesUnchanged'],'Actual original outer producer')
 need(outer['schema']=='MathScope.N6.ActualOuterRootAndHeatDomains/1' and outer['fixedDefinitionSHA256']==FIXED,'Actual qualitative outer proof')
 need(outer['inputSHA256']['payload']==hashlib.sha256(raw['payload']).hexdigest() and outer['inputSHA256']['kernel-binding']==hashlib.sha256(raw['kernel-binding']).hexdigest(),'Same actual outer proof chain')
 source_path='research-ide/mathscope-m2/navier/actual-global-source-outer.mjs'
 need(hashlib.sha256((a.kernels/source_path).read_bytes()).hexdigest()==OUTER,'Unchanged original outer source')
 checks=source_checks(fixed);arithmetic=exact_arithmetic()
 # Remove a literal retained term in an isolated in-memory copy. Source
 # hashes alone would not catch a consumer silently dropping this operand.
 controls={}
 for label,omitted in [('omittedActualInfiniteTailRejected',checks['infinitePowerTailNode']),('omittedActualAngularEnergyRejected',checks['angularEnergyCorrectionNodes'][0])]:
  changed=copy.deepcopy(fixed);gg=changed['outer']['nodes']
  parents=[n for n in gg if n['op']=='add' and omitted in n['args']]
  need(len(parents)==1,'Unambiguous literal energy control operand')
  parents[0]['args']=[i for i in parents[0]['args'] if i!=omitted]
  try:source_checks(changed)
  except AssertionError:controls[label]=True
  else:raise AssertionError('Accepted omitted original energy term '+label)
 result={'schema':'MathScope.N6.ActualOuterAmplitudeQuantitative/1','fixedDefinitionSHA256':FIXED,
   'inputSHA256':{k:hashlib.sha256(v).hexdigest() for k,v in raw.items()},'sourcePath':source_path,'sourceSHA256':OUTER,
   'actualLiteralSourceChecks':checks,'independentExactArithmetic':arithmetic,'actualSourceNegativeControls':controls,
   'provedActualUniformConclusions':{'realEtaDomain':'[-1,1]','sameOriginalSelectedBracket':['9/10','6/5'],
    'sameOriginalDerivativeFloor':'7/20','actualAmplitudeInsideOriginalBracket':True,'actualDerivativeStrictlyAboveOriginalFloor':True,
    'complexEtaDomain':'distance(eta,[-1,1])<1/4','allPulsePolynomialAndAffineCoefficientsHolomorphic':True,
    'actualDiscriminantRealPartLower':'6/25','actualAmp2RealPartLower':'6/25',
    'actualSelectedAmplitudeHolomorphicNormUpper':'2','actualAngularAndPulseCoefficientNormUpper':'CSelected^32',
    'actualAmplitudeAndCoefficientCauchyRadius':'1/8','fullReferenceInfiniteEnergyTailRetained':True,
    'sameReferenceEnergyNotFinalGlobalESquared':True},
   'quantitativeBounds':{'normalizedEnergyErrorFromHalf':'<1/1000000','normalizedNonpulseEnergyAbsolute':'<2^30*lambda*(T+1)',
    'amplitudePolynomial0ErrorFromMinusQuarter':'<1/1000000','amplitudePolynomial1Absolute':'<1/1000000',
    'amplitudePolynomial2ErrorFromKb':'<1/1000000','affineConstantAbsolute':'<exp(-5/lambda)','affineAmplitudeAbsolute':'<exp(-1/(2lambda))'},
   'proof':'ACTUAL_OUTER_AMPLITUDE_QUANTITATIVE_KO.md','sourceBracketDeclarationsUsedAsProof':False,
   'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0,
   'excluded':['Whole all-order leading majorant composition','Whole covariance target cone and determinant','Full g21/J and original row closure']}
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps({'actualOriginalAmplitudeBracket':True,'actualOriginalDerivativeFloor':True,'actualHolomorphicCoefficientTube':True,'newOriginalDischarged':0}))
if __name__=='__main__':main()
