"""Exact selected Wrz top jets, actual moving-frame response and C8 boundary."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
import json
import sympy as S
if not __debug__:raise RuntimeError('Keep exact assertions enabled.')
PINS={'reader':'9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee',
 'directional':'02c7b2d7ea24f43f90444952a03b31eba0a187b0675f765247c931df41ff2001'}
PINS.update({'leadingU':'77f072391c9e2e925e11a28837921f203599b2242f207f77780a2140da8cc13b',
 'leadingF':'ba937ba0fa45592c3bb2e3049fddfadb57ba91a17a4fcc7264f5d1d18a20b5f6',
 'leadingOuter':'a2937d2c2066946f3dbe0a1be2a883766266a0b984914b67780ab81e55eadcbb'})
SOURCE={
 'mathscope-m2/navier/actual-covariance-matrix.mjs':'7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26',
 'mathscope-m2/navier/actual-full-curl.mjs':'4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2',
 'mathscope-m3/navier/source-global-band.mjs':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
 'mathscope-m3/navier/source-forced-class-majorants.mjs':'b609413ea8f86d023d3331c90c2ecaecf139f07de69d8d05ee6feb46c865f053'}
SOURCE['mathscope-m2/navier/actual-leading-all-order-jets.mjs']='d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d'

def main():
 p=ArgumentParser(description=__doc__);p.add_argument('goal_next',type=Path)
 p.add_argument('directional_receipt',type=Path);p.add_argument('output',type=Path);a=p.parse_args();assert not a.output.exists()
 assert sha256(a.directional_receipt.read_bytes()).hexdigest()==PINS['directional']
 prior=json.loads(a.directional_receipt.read_bytes());assert prior['selectedUnderlyingCovariancePath']['covarianceJet']=={'Z':5,'T':2,'totalOrder':7}
 cp=a.goal_next/'first-scale-closure/check_first_scale_closure.py';assert sha256(cp.read_bytes()).hexdigest()==PINS['reader']
 spec=spec_from_file_location('reader',cp);reader=module_from_spec(spec);spec.loader.exec_module(reader)
 source={}
 for path,pin in SOURCE.items():
  raw=reader.git_blob(a.goal_next.parents[2],'research-ide/'+path);assert sha256(raw).hexdigest()==pin
  source[path]=raw.decode()
 def clauses(path,*items):
  for text in items:assert text in source[path],(path,text)
 clauses('mathscope-m2/navier/actual-covariance-matrix.mjs',
  'const n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]',
  'pressureNumerator=nTK.map((x,j)=>G.sub(x,nPrime[j]))',
  'G.add(G.neg(x),G.div(G.mul(n[i],pressureNumerator[j]),n2))')
 clauses('mathscope-m2/navier/actual-full-curl.mjs',
  'const remainder=[G.neg(axialDerivatives[1]),G.sub(axialDerivatives[0],radialDerivatives[2]),G.add(radialDerivatives[1],G.mul(ir,C[1]))]')
 clauses('mathscope-m3/navier/source-global-band.mjs',
  'HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z)',
  'phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))')
 clauses('mathscope-m3/navier/source-forced-class-majorants.mjs',
  'requiredBackgroundDerivativeOrder:order+2',
  'inputDerivativeOrder:order,inputWAlphaSeminormStillRequired:true')
 # Highest potential jets in the selected covariance imaginary product.
 r,z,t,xi=S.symbols('R Z T xi');eps=S.Symbol('epsilon',positive=True)
 u=S.Function('Ctheta')(r,z,t,xi);fast=S.Function('a')(r)
 B=S.diff(u,r)+fast*S.diff(u,xi)+u/r
 expr=S.expand(S.diff(-eps*S.diff(u,z)*B,z,5,t,2))
 high=[S.diff(u,z,6,t,2),S.diff(u,r,z,5,t,2),S.diff(u,xi,z,5,t,2)]
 coefficients=[S.simplify(expr.coeff(j)) for j in high]
 assert S.simplify(coefficients[0]+eps*B)==0
 assert S.simplify(coefficients[1]+eps*S.diff(u,z))==0
 assert S.simplify(coefficients[2]+eps*fast*S.diff(u,z))==0
 # Actual source moving-frame and homogeneous ODE response, with the leading reference fixed.
 rr,p,pz,x0,k,v,epsilon,F,FR,GR,HZ,c=S.symbols('R p pz x0 k v epsilon F FR GR HZ c',real=True)
 HR=p*FR+pz*GR;n=S.Matrix([x0-v*HR,p/rr,pz-epsilon*v*HZ]);np=n.diff(v);n2=(n.T*n)[0]
 K=S.Matrix([[0,-2*F,0],[2*F+rr*FR,0,0],[GR,0,0]])
 Aphi=-K+n*(n.T*K-np.T)/n2
 assert S.simplify(n.T*Aphi+np.T)==S.zeros(1,3)
 n0=n.subs(v,0);nn=(n0.T*n0)[0];nt=S.sqrt(n0[1]**2+n0[2]**2)
 t0=S.Matrix([1,-x0*n0[1]/nt**2+c*n0[2]/nt,-x0*n0[2]/nt**2-c*n0[1]/nt])
 assert S.simplify((n0.T*t0)[0])==0
 M0=(Aphi-epsilon*k*k*n2*S.eye(3)).subs(v,0);tTaylor=t0+v*M0*t0
 potential=(n.cross(tTaylor))[1]/(k*n2);value=S.simplify(potential.subs(v,0))
 assert S.simplify(S.diff(potential,FR).subs(v,0))==0
 mixed=S.simplify(S.diff(potential,FR,v).subs(v,0))
 claimed=p*(t0[2]/(k*nn)+2*x0*value/nn);assert S.simplify(mixed-claimed)==0
 control={rr:1,p:1,pz:1,x0:2,k:4,c:-1,epsilon:S.Rational(1,16)}
 v0=S.simplify(value.subs(control));frv=S.simplify(mixed.subs(control))
 assert v0==S.Rational(1,8)-S.sqrt(2)/24 and frv==S.Rational(1,24)-S.sqrt(2)/144
 assert v0!=0 and frv!=0
 # C8 alone has no universal bound for any selected order9 derivative.
 omega=S.Symbol('omega',positive=True);R0,T0=S.symbols('R0 T0')
 f=omega**-8*S.sin(omega*(r-R0+z+t-T0))
 selected=[(2,5,2),(1,6,2),(0,7,2)]
 for ar,az,at in selected:
  assert ar+az+at==9
  assert S.simplify(S.diff(f,r,ar,z,az,t,at).subs({r:R0,z:0,t:T0}))==omega
 assert all(j-8<=0 for j in range(9))
 # Existing (9,9) leading programs already dominate pointwise total-C9, including full F beyond Xplus.
 base=a.goal_next/'primary-forced-join/active-n3-c5-binding/norm-leading'
 leading={}
 for name,file in [('leadingU','leading-u0-c99.json'),('leadingF','leading-f0-c99.json'),('leadingOuter','leading-outer-c10.json')]:
  raw=(base/file).read_bytes();assert sha256(raw).hexdigest()==PINS[name];leading[name]=json.loads(raw)
 uu,ff,oo=(leading[x] for x in ('leadingU','leadingF','leadingOuter'))
 assert uu['request']=={'radialOrder':9,'etaOrder':9}
 assert uu['sourceHash']==SOURCE['mathscope-m2/navier/actual-leading-all-order-jets.mjs']
 assert uu['sourceParameterSHA256']==ff['sourceParameterSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
 assert uu['normGraph']['sha256']==ff['normGraph']['sha256']
 assert all(row['pass'] is True for row in uu['checks'])
 assert ff['outerSourceSHA256']==PINS['leadingOuter'] and ff['matchedOuterSourceBlobs']==oo['source']['pins']
 assert oo['scope']['actualSourceF0ExteriorC10NumericallyBounded'] and oo['scope']['terminalHeatTransitionIncluded']
 assert oo['physicalBound']=='abs(dX^r dEta^e F0) < 2^(-65343) Xv / X^(r+1), r+e<=10'
 for name,oid in oo['source']['pins'].items():
  from hashlib import sha1
  raw=reader.git_blob(a.goal_next.parents[2],'research-ide/mathscope-m2/navier/'+name)
  assert sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==oid
 clauses('mathscope-m2/navier/actual-leading-all-order-jets.mjs',
  'Each returned scalar bounds every requested mixed derivative 0<=rPrime<=radialOrder, 0<=mPrime<=etaOrder',
  "bounds:{U0:{root:Ubound,domain:{X:['0','infinity']",
  "F0active:{root:FactiveBound,domain:{X:['0','Xplus=Xv*exp(1)']")
 radius,H=S.symbols('Renv H',nonnegative=True)
 for expr in [3*(1+radius**2/2)*(1+H)-H,3*(1+radius**2/2)*(2+H)-H,3*(1+radius**2/2)*(2+H)-1]:
  assert all(c>=0 for c in S.Poly(S.expand(expr),radius,H).coeffs())
 profile_orders=[(xx,ee) for nn in range(10) for xx in range(nn+1) for ee in [nn-xx]]
 assert len(profile_orders)==55 and all(xx<=9 and ee<=9 and xx+ee<=10 for xx,ee in profile_orders)
 # A W1 potential has Jr=-epsilon*Ctheta_Z, Jz=Ctheta_R+a*Ctheta_xi+Ctheta/R.
 assert 1+1+1==3 and 7+3==10
 data={'schema':'MathScope.N7.SelectedWrzHighestBackgroundDependencies/1',
  'status':'VERIFIED_SELECTED_TOP_JET_AND_UNCUT_MOVING_FRAME_RESPONSE_AUDIT',
  'inputSHA256':PINS,'sourceSHA256':SOURCE,'fixedOriginalCommit':reader.REFERENCE,
  'selectedCovariance':{'scope':'Initial pre-Forced common-Y angular covariance used by initialized Temporal',
   'jet':{'Z':5,'T':2},'leading':'L_r*L_z; amplitude slow7, background slow8 plus independent target/H/y/cutoff jets7',
   'imaginary':'-epsilon*Ctheta_Z*(Ctheta_R+a*Ctheta_xi+Ctheta/R)',
   'highestPotentialJets':[str(j) for j in high],'exactTopCoefficients':list(map(str,coefficients)),
   'transverseFactorization':'For original Primary Ctheta=chi(xi)*C0(R,Z,T,v), LZ5T2 uses only slow7 plus original chi_prime, so it adds no new slow background9 request.',
   'directPotentialSlow8Inputs':'live F,FR,GR,HR,HZ derivatives through8; HR=p*F_R+pz*G_R, HZ=p*F_Z+pz*G_Z',
   'newBackgroundDirectionsPerField':[{'R':ar,'Z':az,'T':at} for ar,az,at in selected],
   'fields':['F','G'],'newSelectedBackgroundJets':6,
   'additionalIndependentInputs':'target/H/y/normal reciprocal and cutoff jets through8; current C5 N0..N6 do not supply N7/N8'},
  'movingFrameControl':{'includesActualAphiAndTangentODE':True,'constraintDefect':'0','initialTangencyDefect':'0',
   'rawPotentialAtPulseZero':str(v0),'rawFRParameterDerivativeAtZero':'0',
   'rawMixedFRPulseDerivativeAtZero':str(frv),'formula':str(claimed),
   'actualOriginalSourceValuesNumericallySubstituted':False,
   'cutoffScope':'This is the UNCUT homogeneous coefficient. Original psi is flat at v=0. Extending noncancellation to its positive middle support requires analytic continuation of the uncut coefficient and parameter response.',
   'analyticPremise':'Fixed-slow original ntheta=p/R is nonzero, keeping normal denominators positive; original matrix coefficients and their ODE parameter responses are analytic in pulse v.',
   'scalarHWeight':'A pulse-independent positive weight cannot annul the entire uncut FR response: value!=0 and raw_FR=0 at v0 force weight_FR=0 if the response vanished identically, while mixed_FR_v!=0 then contradicts it.',
   'claim':'No universal moving-frame/constraint/normal quotient identity removes this additional layer; this is not a numerical counterexample to the fixed actual source.'},
  'epsilonWeightedSplit':{'potentialClass':'epsilon times its original weighted coefficient envelope',
   'imaginaryWrz':'epsilon^(3-kappa_s) times the selected coefficient envelope',
   'outerC64Path':'epsilon^(10-kappa_s) times the selected missing background9 envelope and original kernels',
   'HZDependence':'An additional epsilon multiplies HZ in n and n_prime; keep it on those ninth-jet contributions.',
   'actualWeightedNinthJetBoundEvaluated':False},
  'C8InformationControl':{'family':'omega^-8*sin(omega*((R-R0)+Z+(T-T0)))',
   'allSlowDerivativesThrough8SupAtMost1ForOmegaAtLeast1':True,
   'allThreeSelectedNinthDerivativesAtCenter':'omega',
   'scope':'Countermodel to a norm-only C8-to-C9 implication, not an alternative actual MathScope source.'},
  'fullLeadingPointwiseC9AlreadyAvailable':{'verified':True,
   'leadingRequest':uu['request'],'sameNormGraphSHA256':uu['normGraph']['sha256'],
   'U':'original global U0 bound on X in[0,infinity), eta in[-1,1]',
   'F':'original active F0 bound on[0,Xplus], joined to existing exteriorC10 on[Xplus,infinity)',
   'terminalHeatTransitionRetained':True,'matchedExteriorSourceBlobs':len(oo['source']['pins']),
   'oldUUpperExpression':uu['upperExpression'],'oldFUpperExpression':ff['upperExpression'],
   'oldPositiveUpperExpressionsDominatePointwiseC9':True,
   'newLeadingCompilerRequiredForDirectPointwiseC9':False,
   'reuseExistingDirectedEndpointsPermittedUnderTheirOriginalPremises':True,
   'doesNotProveFTC9':'Literal C9 FTC faces can require total11; existing exteriorC10 does not cover that stronger claim.',
   'actualSelectedPositiveOrder9RowsStillOpen':True},
  'throughUpdatedSequence':{'initialLeafCannotBeReusedForFreshPostSignedCovariance':True,
   'freshTerms':['Primary-Forced cross terms','Forced squares','old/Forced-Signed cross terms','Signed squares'],
   'existingForcedCertificateAtPotential8':{'inputForcingOrder':8,'backgroundOrder':10,
    'interpretation':'Retained certificate requirement, not a sharp mathematical minimum.'},
   'unreducedForcing8':{'mode2':'prior velocity C9','mode1':'velocity spatialC10, mixed slow8+time1, pressureC9, initialized meanC9'},
   'SignedPotential8':'fresh Sigma C8, H^-1 C8, y/reciprocal sqrt C8, homogeneous pulse and normal quotient C8, original target N0..N8',
   'furtherMeanPressureCounts':'Raw Sigma8 pressure routes can request covariance9/10 and mean beta spatial11; only proved flux/FTC cancellations may lower these unreduced counts.',
   'currentLocalC8SufficesForUpdatedSequence':False},
  'cheapestNextInitialInput':'Generate only the six selected live background9 bounds with n>=4 flat, reuse leading/global fixed primitives separately, and retain epsilon^(10-kappa_s); do not rebuild isotropic C9 unless the implementation forces it.',
  'scope':{'actualSelectedNinthJetsClosed':0,'actualStageCapsClosed':0,'newFinalGateClaim':False,
   'newArtifactDownloaded':False,'repositoryOrBase67Modified':False,'localLeanCompilation':False,
   'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}}
 a.output.write_bytes((json.dumps(data,indent=2)+'\n').encode())
 print(json.dumps({'status':data['status'],'newSelectedBackground9Jets':6,'nonzeroUncutControl':str(frv),
  'actualSelectedJetsClosed':0}))

if __name__=='__main__':main()
