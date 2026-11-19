"""Actual Signed Haar residual: initialized-mean grouping and full stress arms."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as F
from functools import cache
from hashlib import sha256
from pathlib import Path
import importlib.util,json,sys
if not __debug__:raise RuntimeError('Assertions must remain enabled.')
PINS={'reader':'2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
 'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
 'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
 'git':'9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee',
 'shellReceipt':'5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308'}
def check(p,h):
 b=p.read_bytes();assert sha256(b).hexdigest()==h,p;return b
def main():
 p=ArgumentParser(description=__doc__)
 for n in ('goal','work','out'):p.add_argument('--'+n,type=Path,required=True)
 a=p.parse_args();base=a.goal/'primary-forced-join/active-n3-c5-binding';rd=base/'spatial-readback';support=base/'live-wave-gauge/signed'
 for path,pin in [(rd/'source_stream.py',PINS['reader']),(a.goal/'first-force-repair/verify_repaired_first_force.py',PINS['exact']),
  (support/'source_cache.py',PINS['cache']),(a.goal/'first-scale-closure/check_first_scale_closure.py',PINS['git'])]:check(path,pin)
 shell=json.loads(check(base/'first-wave-guard-traces/signed-shell/signed-shell.json',PINS['shellReceipt']))
 sys.path[:0]=[str(rd),str(support),str(a.goal/'first-force-repair')]
 import source_stream as reader
 from source_cache import load
 from verify_repaired_first_force import Exact
 spec=importlib.util.spec_from_file_location('source_git',a.goal/'first-scale-closure/check_first_scale_closure.py');gr=importlib.util.module_from_spec(spec);spec.loader.exec_module(gr)
 gr.REFERENCE='059df9db3a188ce18f3c43a0dca3a92f2e02a4b2';modules={};texts={}
 for name in ('source-global-temporal.mjs','source-temporal-potential.mjs','source-global-initial-mean.mjs','source-full-mean-equations.mjs','source-global-current.mjs','source-updated-mean-stress.mjs'):
  b=gr.git_blob(a.goal.parents[2],'research-ide/mathscope-m3/navier/'+name);modules[name]=sha256(b).hexdigest();texts[name]=b.decode()
 for name,fragment in [('source-global-temporal.mjs','Every finite inverse sum has zero Haar mean.'),
  ('source-temporal-potential.mjs','Normalized Haar translation invariance and Fubini keep T1'),
  ('source-global-initial-mean.mjs','originalMeanPatchSupportRetained:true'),
  ('source-full-mean-equations.mjs','allBackgroundAndSixCovarianceTermsRetained:true')]:assert fragment in texts[name],(name,fragment)
 D=a.work/'continuation70/hosted-44582875351/first-correction-spatial-source';M=json.loads((D/reader.MANIFEST).read_bytes());N=reader.Native(D,M)
 S=load(reader,D,M,22153782,a.work/'continuation80/signed-wave/cache')
 class View:
  def node(self,i):r=S.record(i);return r['op'],r['args']
 E=Exact(View());A=json.loads(N.base_snapshot['expressionDefinitions']);AI=json.loads(N.base_snapshot['inverseDefinitions']);Y=[17745430,17745431]
 R,Z,T,ell,r=17732748,17732749,17732750,17732737,17743710;eps=17732744
 def unpack(i):
  op,aa=View().node(i);assert op in ('m3_aux_expression_partial','m3_aux_inverse_partial')
  key=aa[0];group=A if op=='m3_aux_expression_partial' else AI
  # Source auxiliary expression IDs encode index by -1-index. Inverse IDs are nonnegative.
  assert op!='m3_aux_expression_partial' or key<0
  idx=-key-1 if key<0 else key;d=group[idx]
  assert len(aa[1])==len(d['parameters']) and len(aa[2])==len(d.get('directions',d['parameters']))
  return op,idx,d,aa[1],aa[2]
 @cache
 def depends(i,wanted):
  if i<0:
   key=next(k for k,v in E.inverse_atoms.items() if v==i)
   return any(depends(j,wanted) for mono,c in key for j,n in mono)
  if i<min(wanted):return False
  if i in wanted:return True
  op,aa=View().node(i)
  if op in ('rational','source_parameter','coordinate'):return False
  if op=='definite_integral':
   body,bound,lo,hi=aa
   remaining=tuple(x for x in wanted if x!=bound)
   return depends(lo,wanted) or depends(hi,wanted) or (bool(remaining) and depends(body,remaining))
  if op in ('integer_power','source_step_derivative'):children=aa[:1]
  elif op in ('add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine','maximum','ceiling','smooth_piecewise'):children=aa
  elif op.endswith('_partial') and len(aa)==3 and isinstance(aa[1],list):children=aa[1]
  elif op=='actual_monotone_root':children=aa[1:]
  elif op=='actual_quadratic_root':children=aa[2:3]
  elif op in ('actual_background_picard','actual_background_even_profile'):children=aa[2:4]
  elif op=='actual_natural_series':children=aa[1:3]
  elif op=='actual_covariance_volterra':children=[aa[2],*aa[3]]
  elif op=='m3_forced_pulse_partial':children=[aa[3],*aa[4]]
  else:raise ValueError(('Unrecognized native dependency',i,op))
  assert all(type(c) is int and c<i for c in children)
  return any(depends(c,wanted) for c in children)
 def independent_poly(poly,vars):return all(not depends(i,tuple(vars)) for m,c in poly.items() for i,n in m)
 def encode(poly):return [[[[i,n] for i,n in m],str(c)] for m,c in sorted(poly.items())]
 def poly_hash(poly):return sha256(json.dumps(encode(poly),separators=(',',':')).encode()).hexdigest()
 try:
  assert [A[k]['name'] for k in (12,18,19,20)]==['global_actual_temporal_actual_meridional_potential','GlobalInitializationFiveBump_v','GlobalInitializationFiveBump_gamma','GlobalInitializationFiveBump_beta']
  assert A[-13]['name']!='global_actual_temporal_actual_meridional_potential' # rejects Python negative-index confusion
  assert [d['name'] for d in AI]==['GlobalActualTemporal_theta','GlobalActualTemporal_z']
  assert all(d['Y']==Y and d['zeroMode']=='The exact normalized Haar mean is projected out.' and not d['finiteSumDeclaredEqualToLimit'] for d in AI)
  # Actual translated T1 potential, including the retained whole cutoff term.
  assert A[12]['body']==19570917
  assert E.of(19570917)==E.mul(E.pow(E.of(R),-1),E.sub(E.of(19570813),E.mul(E.of(17743734),E.of(19570814))))
  assert S.args(19570813,'definite_integral')==[19570812,19570776,17743711,R]
  assert S.args(19570814,'definite_integral')==[19570812,19570776,17743711,17743713]
  pp=E.of(19570812);assert len(pp)==1
  invcalls=[i for m in pp for i,n in m if i>=0 and S.record(i)['op']=='m3_aux_inverse_partial'];assert len(invcalls)==1
  inv=invcalls[0];op,idx,d,args,orders=unpack(inv);assert idx==1 and orders==[0]*5 and args[:4]==[19570776,Z,T,ell]
  translatedArgs=args
  assert all(independent_poly(E.sub(E.of(args[4+j]),E.of(Y[j])),Y) for j in (0,1))
  coefficient={tuple((i,n-1 if i==inv else n) for i,n in m if n-(1 if i==inv else 0)):c for m,c in pp.items()}
  assert independent_poly(coefficient,Y)
  # Actual initialized FiveMap gamma and homogeneous p=1 moment, distinct from post-Signed coefficients.
  assert A[19]['body']==21374926 and E.of(21374926)==E.add(E.mul(E.of(17744839),E.of(21374903)),E.mul(E.of(17744867),E.of(21374905)))
  assert A[18]['body']==21374922 and E.of(21374922)==E.add(*[E.mul(E.of(p),E.of(c)) for p,c in zip([17744839,17744867,17744897],[21374880,21374883,21374886],strict=True)])
  assert all(not depends(c,(R,)) for c in [21374880,21374883,21374886])
  assert E.add(E.of(21374903),E.mul(E.of(71672),E.of(21374905)))==E.zero
  assert not depends(21374903,(R,)) and not depends(21374905,(R,))
  profileRows=[]
  for j,root in enumerate([17744839,17744867,17744897]):
   pol=E.of(root);bumps=[i for m in pol for i,n in m if i>=0 and S.record(i)['op']=='smooth_piecewise'];assert len(set(bumps))==1
   bump=bumps[0];bb=S.args(bump,'smooth_piecewise');assert bb[1:4]==[0,1,0] and bb[-1]==0
   ratio=E.add(E.one,E.mul(E.scalar(F(1,10)),E.of(bb[0])))
   ratioExpected=E.mul(E.of(R),E.inv(E.of(17743687)),E.inv(E.of(17743688)))
   if j:
    expAtoms=[i for m in ratio for i,n in m if i>=0 and S.record(i)['op']=='exp' and S.rational(S.args(i,'exp')[0])==F(j,5)]
    assert len(expAtoms)==1;ratioExpected=E.mul(ratioExpected,E.inv(E.of(expAtoms[0])))
   assert ratio==ratioExpected and all(dict(m).get(bump)==1 for m in pol)
   profileRows.append({'copy':j,'root':root,'bareBump':bump,'argument':bb[0],'logXSupport':['1+2*j/5','1+2*j/5+2*log(11/10)']})
  assert F(1)+F(4,5)+2*F(1,10)==2 # strict log(1+x)<x puts all three copies below exp(2)*X0
  assert A[20]['body']==21374944 and E.of(21374944)==E.neg(E.mul(E.of(eps),E.pow(E.of(R),-1),E.of(21374941)))
  assert S.args(21374941,'definite_integral')==[21374940,21374928,17743711,R]
  assert S.args(21374940,'multiply')==[21374928,21374939]
  assert S.record(21374939)=={'op':'m3_aux_expression_partial','args':[-20,[ell,21374928,Z,T],[0,0,1,0]]}
  meanRows=[]
  for j,bkg in enumerate([E.of(17732936),E.mul(E.of(R),E.of(17732934)),E.of(17732935)]):
   f=N.expressions[j];assert f['name']=='ActualInitializedMeanVelocity_'+str(j) and f['body']==21435335+j
   inc=E.sub(E.of(f['body']),bkg);members=[]
   for m,c in inc.items():
    hits=[]
    for i,n in m:
     if i>=0 and S.record(i)['op'] in ('m3_aux_expression_partial','m3_aux_inverse_partial'):
      op,idx,d,args,oo=unpack(i)
      if d['name'].startswith('GlobalInitializationFiveBump') or d['name'].startswith('GlobalActualTemporal') or idx==12:hits.append((i,n,d['name']))
    assert len(hits)==1 and hits[0][1]==1
    hit=hits[0][0];rest={tuple((i,n-1 if i==hit else n) for i,n in m if n-(1 if i==hit else 0)):c}
    assert independent_poly(rest,Y);members.append(hits[0][2])
   meanRows.append({'component':j,'fullBody':f['body'],'incrementTerms':len(inc),'linearFamilies':sorted(set(members)),'coefficientHaarIndependent':True})
  # Exact classification of ACTUAL raw E monomials. No mean atom is set to zero inside a product.
  grouped=[];actualGroups={}
  for raw,expectedCounts in [(21999622,{'five_zero':47,'linear_zero':98,'quadratic':22,'torus_field_derivative_zero':9,'other':11}),
   (22000445,{'five_zero':121,'linear_zero':447,'quadratic':148,'torus_field_derivative_zero':9,'other':14})]:
   pol=E.of(raw);groups={k:{} for k in expectedCounts};inventories={'linear_zero':set(),'quadratic':set()}
   for mono,c in pol.items():
    temps=[];fives=[];yfields=[]
    for i,n in mono:
     if i<0:continue
     op,aa=View().node(i)
     if op in ('m3_aux_expression_partial','m3_aux_inverse_partial'):
      oo,idx,d,actual,orders=unpack(i)
      if d['name'].startswith('GlobalInitializationFiveBump'):
       assert actual==[ell,r,Z,T] and orders[0]==0;fives.append(i)
      elif d['name'].startswith('GlobalActualTemporal') or (oo=='m3_aux_expression_partial' and idx==12):
       assert actual==([ell,r,Z,T,*Y] if oo=='m3_aux_expression_partial' else [r,Z,T,ell,*Y]);temps.extend([i]*n)
     if op=='m3_coupled_indexed_partial' and any(aa[2][j] for j in (3,4)):yfields.append(i)
    if fives:tag='five_zero'
    elif len(temps)==1:
     tag='linear_zero';hit=temps[0];rest={tuple((i,n-1 if i==hit else n) for i,n in mono if n-(1 if i==hit else 0)):c};assert independent_poly(rest,Y);inventories[tag].update(temps)
    elif len(temps)==2:tag='quadratic';inventories[tag].update(temps)
    elif yfields:
     tag='torus_field_derivative_zero';assert len(yfields)==1 and dict(mono)[yfields[0]]==1
     hit=yfields[0];rest={tuple((i,n-1 if i==hit else n) for i,n in mono if n-(1 if i==hit else 0)):c};assert independent_poly(rest,Y)
    else:tag='other';assert not temps
    groups[tag][mono]=c
   assert {k:len(v) for k,v in groups.items()}==expectedCounts and E.add(*groups.values())==pol
   actualGroups[raw]=groups
   invRows={k:[{'root':i,'name':unpack(i)[2]['name'],'orders':unpack(i)[4]} for i in sorted(v)] for k,v in inventories.items()}
   grouped.append({'rawE':raw,'monomials':len(pol),'groups':{k:{'terms':len(v),'exactPolynomialSHA256':poly_hash(v)} for k,v in groups.items()},
    'nativeTemporalJets':invRows,'reconstructionExact':True,'allRemovedLinearCoefficientsHaarIndependent':True,
    'meaning':'Five terms vanish on the proved collars; single Temporal terms have zero normalized Haar mean; pure torus field derivative terms integrate to zero under original periodicity. Quadratic products and all pressure integrals remain.'})
  # Full original stress, leading plus all THREE actual higher rows, kept distinct from leading target y.
  stressRows=[]
  for raw,w,t,tx,ts,txs in [(21999622,2,17744338,17744315,[17744332,17744336,17744341],[17744302,17744313,17744324]),
   (22000445,1,17744453,17744430,[17744447,17744451,17744456],[17744418,17744428,17744439])]:
   pol=E.of(raw);allRoots=[t,tx,*ts,*txs];part={m:c for m,c in pol.items() if any(i in dict(m) for i in allRoots)}
   pairs=[(t,tx,E.one)]+[(v,d,E.mul(E.of(ch),E.of(qp))) for v,d,ch,qp in zip(ts,txs,[17743838,17743844,17743850],[17743840,17743846,17743852],strict=True)]
   expected=E.neg(E.mul(E.of(eps),E.of(17732886),E.add(*[E.mul(weight,E.add(E.mul(E.of(der),E.of(r),E.inv(E.of(17732766))) if n==0 else E.of(der),E.mul(E.scalar(w),E.of(value),E.pow(E.of(r),-1)))) for n,(value,der,weight) in enumerate(pairs)])))
   assert part==expected and len(part)==8
   retainedOther=E.sub(actualGroups[raw]['other'],part)
   if w==2:
    expectedOther=E.add(E.mul(E.of(eps),E.of(21999543)),E.of(21999581),E.mul(E.scalar(2),E.of(21999614),E.pow(E.of(r),-1)))
   else:
    expectedOther=E.add(E.mul(E.of(eps),E.of(22000360)),E.of(22000393),E.mul(E.of(22000422),E.pow(E.of(r),-1)),E.mul(E.of(eps),E.of(22000443)))
   assert retainedOther==expectedOther
   arms=[]
   for n,(value,der,weight) in enumerate(pairs):
    if n==0:
     registry=32017 if w==2 else 32018
     assert S.args(value,'actual_expression_partial')==[registry,[17744284,17732775],[0,0]] and S.args(der,'actual_expression_partial')==[registry,[17744284,17732775],[1,0]]
    else:
     for rr in [value,der]:
      aa=S.args(rr,'smooth_piecewise');assert aa[0]==17744284 and aa[1]==28814 and aa[3]==aa[5]==0
     assert independent_poly(weight,[r])
    arms.append({'order':n,'value':value,'derivativeRoot':der,'derivativeMeaning':'X derivative with explicit r/s chain' if n==0 else 'actual materialized R derivative including its internal r/s chain','supportGuard':None if n==0 else S.args(value,'smooth_piecewise')[:3]})
   stressRows.append({'rawE':raw,'weight':w,'matchedMonomials':len(part),'exactFullStressDivergence':True,'arms':arms,
    'allOtherTermsExactly':'epsilon*W_thetaz_Z + W_rtheta_R + 2*W_rtheta/r' if w==2 else 'epsilon*W_zz_Z + W_rz_R + W_rz/r + epsilon*p_Z',
    'actualPressureZRoot':None if w==2 else 22000443})
  assert S.args(28814,'multiply')==[3617,28813] and S.args(28813,'exp')==[28812] and E.of(28812)==E.mul(E.scalar(F(1,128)),E.of(3612))
  assert S.args(28824,'multiply')==[588,3293] and S.args(588,'exp')==[1] and S.args(3293,'multiply')==[613,3292]
  assert S.args(613,'multiply')==[12,612] and S.args(612,'exp')==[98] and S.args(3292,'exp')==[103]
  diff=E.sub(E.of(319),E.add(E.one,E.of(98),E.of(103)))
  assert diff==E.add(E.scalar(4),E.of(13),E.mul(E.scalar(30),E.of(7)),E.mul(E.scalar(-4),E.of(185)),E.of(280))
  receipt={'schema':'MathScope.C84.ActualInitializedMeanHaarShellReduction/1',
   'status':'VERIFIED_ACTUAL_LINEAR_HAAR_GROUPING_AND_FULL_STRESS_ARMS_WEIGHTED_EFFECTIVE_COVARIANCE_OPEN',
   'hostedRun':44582875351,'sourceStream':S.verify,'registrySHA256':N.pin,'inputPins':PINS,'sourceModules':modules,
   'actualHaarRoots':[21999624,22000447],'actualRawERoots':[21999622,22000445],'actualInitializedFullMean':meanRows,
   'nativeAuxIDConvention':{'expressionIndex':'-id-1','inverseIndex':'id','wrongPythonNegativeIndexControlRejected':True},
   'temporalZeroHaar':{'nativeInverseDefinitions':AI,'actualPsiDefinitionIndex':12,'actualPsiBody':19570917,'actualPsiIntegrals':[19570813,19570814],
    'actualTranslatedInverseApplication':inv,'translatedInverseArguments':translatedArgs,'coefficientHaarIndependent':True,
    'translationCheck':'Each torus argument is Y_j plus a Y-independent source translation; the actual radial position dependence is retained.',
    'analyticRationale':'Every original finite inverse sum omits the zero Fourier mode; the original uniform tail convergence gives zero Haar mean of the limit. Translation invariance and Fubini preserve zero Haar for both actual T1 integrals and their cutoff combination. Differentiation at the original position preserves zero Haar under original smoothness/periodicity. Frozen integer labels and representatives are never differentiated.',
    'astVersusAnalysis':'The graph argument/linear grouping checks are exact; the Fourier-limit, Fubini and derivative interpretation use the stated original analytic premises.'},
   'initializedFiveMap':{'gammaDefinitionIndex':19,'gammaBody':21374926,'profileRoots':[17744839,17744867],'coefficients':[21374903,21374905],
    'exactCoefficientIdentity':'c0+exp(1/5)*c1=0','coefficientsFreeOfR':True,'profiles':profileRows,
    'wholeGammaIdentity':'M1=exp(1/5)*M0 by the full profile change of variables; therefore actual initial whole Gamma=0.',
    'betaDefinitionIndex':20,'betaBody':21374944,'betaIntegral':21374941,'gammaZInsideBeta':21374939,
    'supportConclusion':'All three profile copies lie strictly in X0Imean<X<exp(2)*X0Imean. The actual initial Gamma whole identity makes beta compact too. All initial FiveMap values/derivatives vanish on both C83 shell collars.',
    'supportAnalyticPremises':'Original full supports and fixed radial envelope from the C83 source-shell receipt; ordinary change of variables and differentiation under its admitted native branch.'},
   'actualASTHaarGrouping':grouped,'actualFullStressArms':stressRows,
   'stressSupportReduction':{'lower':28814,'lowerFormula':'Xa*exp(t1/128)>Xa for actual t1>0','upperForFiveOfSixHigherArms':28824,
    'outerLogGapFormula':'log(Xb/upper)=4+Tf+30*BOuter-4*log(h)+terminalLogCorrection',
    'outerGapSignPremise':'The original terminal-log correction #280 is positive by the existing source-shell analytic proof; 0<h<1, Tf>0, BOuter>0.',
    'innerConclusion':'All six higher stress value/derivative pairs vanish on an inner shell collar.',
    'outerConclusion':'All higher z arms and theta n1,n2 vanish on an outer collar. Theta n3 uses actual outer bound Xb and remains separate.',
    'outerThetaOrder3':'OPEN_RETAINED_ZETA_BOUND_NOT_REPLACED_BY_LEADING_TARGET'},
   'effectiveCovarianceReduction':{'definition':'C_ij=Haar(W_afterForced,ij+mu_i*mu_j), mu=actual initialized increment, not full background velocity',
    'collarEquations':{'gbar':'-(partial_R+1/R)C_rr-epsilon*partial_Z C_rz+C_thetatheta/R',
     'EthetaBar':'(partial_R+2/R)(C_rtheta-fullOriginalStress_theta)+epsilon*partial_Z C_thetaz',
     'EzBar':'(partial_R+1/R)(C_rz-fullOriginalStress_z)+epsilon*partial_Z(C_zz+pbar)'},
    'scope':'Source-polynomial/Haar reduction under the verified zero-mean collar interfaces; the compact Haar pressure path is retained separately, not discarded.',
    'sufficientWeight':'Actual mean factors need sqrt(zeta) finite-pole bounds; their products then retain zeta. Actual Forced W must separately retain zeta.',
    'smallestRemainingInput':'Actual same-live effective covariance retained-zeta values and needed Z1/Z2 path derivatives. No actual weighted enclosure of these fields is produced here.'},
   'controls':{'zeroHaarDoesNotRemoveQuadratic':'A single cosine has mean0 and square mean1/2; every two-Temporal-factor monomial is therefore retained, never set to zero.',
    'leadingTargetOnlyCannotReplaceFullStress':'Exact source comparison retains 8 stress monomials per component, of which only 2 use the leading target registries. The remaining six are kept until a proved collar support exclusion applies.'},
   'scope':{'weightedHaarEOrder0':'CONDITIONAL','actualEffectiveCovarianceWeight':'OPEN','higherThetaN3OuterWeight':'OPEN','noNativeOpaqueValueEvaluated':True,'noLocalLean':True,'base67Unchanged':True,'release':'HOLD'}}
  a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8',newline='\n')
  print('PASS actual Haar grouping theta187/z739; initial FiveGamma moment; six full higher stress arms retained; weighted effective covariance remains OPEN',flush=True)
 finally:S.__exit__(None,None,None)
if __name__=='__main__':main()
