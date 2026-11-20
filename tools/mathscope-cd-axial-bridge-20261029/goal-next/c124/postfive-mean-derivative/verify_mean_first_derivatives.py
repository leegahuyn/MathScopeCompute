#!/usr/bin/env python3
"""Conditional first physical derivatives of the protected PostFive mean."""
import argparse,hashlib,importlib.util,json
from fractions import Fraction as Q
from pathlib import Path

p=argparse.ArgumentParser(description=__doc__)
for flag in ('goal','protected','prior','reference','operators','out'):p.add_argument('--'+flag,type=Path,required=True)
args=p.parse_args();ROOT=args.goal
paths={
 'late':(ROOT/'c105/late-grade/late-grade.json','d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef'),
 'initial':(ROOT/'c108/mode-one-late-mean/late-mode-one-mean.json','b01790ea041aa3a5ad4d998e61c52aceb7cb0dd40bd6a68282ae74b03639ad41'),
 'donors':(ROOT/'c108/first-k1-energy/k1-donor-join.json','8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59'),
 'geom':(ROOT/'c107/forced-mode-one-guards/verify_mode_one_guard_geometry.py','5087c7c6351028bdfe547bfbea30907f909478986f83fed930519bb473642cd9'),
 'protected':(args.protected,'83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831'),
 'prior':(args.prior,'b2eca297bde1beb0f736818ad3722341e160bfe7df47dab7dac9afbb422ee176'),
 'reference':(args.reference,'7f4db7e44f838f60e0ae27e9df8cbdd67fe6c41b154ea2dad11a810399ea079f'),
 'operators':(args.operators,'2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76')}
data={}
for k,(p,h) in paths.items():
 raw=p.read_bytes();assert hashlib.sha256(raw).hexdigest()==h,(k,p);data[k]=raw
late,initial,donors,protected,prior,ref=[json.loads(data[k]) for k in ('late','initial','donors','protected','prior','reference')]
source=data['operators'].decode()
for text in ('Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))','Dz=x=>G.mul(epsilon,G.derivative(x,Z))','De=(x,e)=>G.add(Dr(x)'):
 assert text in source,text
assert protected['sourceNodes']==22155584 and protected['sourceSHA256']=='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
assert protected['nativeSHA256']=='e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
assert prior['status']=='VERIFIED_PROTECTED_SOURCE_CONDITIONAL_POSITIVE_PHASE_GRADE' and prior['exactLatePotentials']==[22150943,22151952] and prior['exactLateDirectSwirl']==22154876
assert ref['referenceMap']=={'R':'R/sqrt(ratio)','Z':'Z/ratio^D','T':'T/ratio','Q':'ratio*Q','s':'s/ratio'}
assert donors['sourceInputs']['covarianceInputs']==len(late['premise']['componentDirections'])==127
assert {k:late['rawGate'][k] for k in ('grade','band','coefficientChargeInHOver2Pow128')}=={'grade':'22499/25000','band':'59','coefficientChargeInHOver2Pow128':195678}
assert set(protected['registry']['PostSignedFiveBump_gamma']['parameters'])=={17732737,17732748,17732749,17732750}
assert protected['nodes']['22154876']['op']=='add' and set(protected['nodes']['22154876']['args'])=={22150797,22151941}
spec=importlib.util.spec_from_file_location('source_geometry',paths['geom'][0]);assert spec and spec.loader;geometry=importlib.util.module_from_spec(spec);spec.loader.exec_module(geometry)
e=Q(1,100000);zero=(0,0,0)
assert geometry.nth('radialFast',zero)==geometry.cap(8,b=3,e=-e,r=1)
assert geometry.nth('radialFast',(1,0,0))==geometry.cap(16,b=4,e=-e,r=1)
assert not geometry.nth('radialFast',(0,1,0)) and geometry.nth('invR',zero)==geometry.cap(b=1)
assert geometry.nth('invR2',zero)==geometry.cap(b=2)
lr={(r['field'],tuple(r['RZTL'])):r for r in late['rawMeanCoefficientRows']}
ir={(r[0],tuple(r[1])):r[2] for r in initial['ordinaryMeanRows']}
def lategrade(field,alpha):
 r=lr[(field,alpha)];assert Q(r['band'])<=59 and r['totalCoefficientChargeInHOver2Pow128']<=195678;return Q(r['epsilon'])
def initgrade(field,alpha):
 r=ir[(field,alpha)];assert Q(r['bandIntercept'])<=59;return Q(r['minEpsilon'])
# Terms are (field, R/Z/T/L derivative, epsilon shift); numerical
# coefficients and source-positive geometry powers are charged separately.
AT='A_T';AF='A_F';B='B_sum'
R0=(0,0,0,0);R=(1,0,0,0);Z=(0,1,0,0);L=(0,0,0,1)
RR=(2,0,0,0);RZ=(1,1,0,0);ZZ=(0,2,0,0);RL=(1,0,0,1);ZL=(0,1,0,1);LL=(0,0,0,2)
late_terms={
 ('value','beta'):[(AT,Z,1),(AF,Z,1)],('value','v'):[(B,R0,0)],
 ('value','gamma'):[(AT,R,0),(AF,R,0),(AT,L,-e),(AT,R0,0),(AF,R0,0)],
 ('R','beta'):[(AT,RZ,1),(AF,RZ,1)],('Z','beta'):[(AT,ZZ,1),(AF,ZZ,1)],
 ('R','v'):[(B,R,0)],('Z','v'):[(B,Z,0)],
 ('R','gamma'):[(AT,RR,0),(AF,RR,0),(AT,L,-e),(AT,RL,-e),(AT,R,0),(AF,R,0),(AT,R0,0),(AF,R0,0)],
 ('Z','gamma'):[(AT,RZ,0),(AF,RZ,0),(AT,ZL,-e),(AT,Z,0),(AF,Z,0)],
 ('L','beta'):[(AT,ZL,1)],('L','v'):[(B,L,0)],
 ('L','gamma'):[(AT,RL,0),(AT,LL,-e),(AT,L,0)]}
late_terms[('Dr','beta')]=late_terms[('R','beta')]+[(AT,ZL,1-e)]
late_terms[('Dr','v')]=late_terms[('R','v')]+[(B,L,-e)]
late_terms[('Dr','gamma')]=late_terms[('R','gamma')]+[(AT,RL,-e),(AT,LL,-2*e),(AT,L,-e)]
for field in ('beta','v','gamma'):
 late_terms[('Dz',field)]=[(f,a,shift+1) for f,a,shift in late_terms[('Z',field)]]
results=[]
for direction in ('value','R','Z','L','Dr','Dz'):
 for field in ('beta','v','gamma'):
  candidates=[lategrade(f,a)+shift for f,a,shift in late_terms[(direction,field)]]
  if direction=='value':candidates += [initgrade(field,R0)]
  elif direction=='R':candidates += [initgrade(field,R)]
  elif direction=='Z':candidates += [initgrade(field,Z)]
  elif direction=='L':candidates += [initgrade(field,L)]
  elif direction=='Dr':candidates += [initgrade(field,R),initgrade(field,L)-e]
  else:candidates += [initgrade(field,Z)+1]
  raw=min(candidates);results.append({'direction':direction,'component':field,'rawGrade':str(raw),'gradeAfterDebit':str(raw-e),'lateTerms':len(late_terms[(direction,field)])})
worst={d:min(Q(x['gradeAfterDebit']) for x in results if x['direction']==d) for d in ('value','R','Z','L','Dr','Dz')}
assert worst=={'value':Q(22499,25000),'R':Q(17999,20000),'Z':Q(22499,25000),'L':Q(22499,25000),'Dr':Q(17999,20000),'Dz':Q(47499,25000)}
# One real physical derivative contributes at most two radial-fast factors.
# Existing rank 195678 plus nine very conservative source geometry ranks,
# plus 16 dyadic bits covers 13 terms * 8^2 * 32 overlap conversion.
rank=195678+9*1024+16
assert rank==204910 and 13*8**2*32<2**16
assert Q(rank,2**128)+Q(59,2**32636)<e/2
assert Q(1,2)+Q(1,16)<1 and 3*Q(1,16)<Q(1,2)
out={'status':'CONDITIONAL_PROTECTED_POSTFIVE_PHYSICAL_FIRST_DERIVATIVES',
 'sourceRoots':{'initialized':[21374946,21374947,21374948],'temporalPotential':22150943,'fivePotential':22151952,'directSwirl':22154876},
 'protectedSourceSHA256':protected['sourceSHA256'],'protectedRegistrySHA256':protected['nativeSHA256'],
 'normalizedCoordinateDefinitions':'D_r=partial_R+a L; D_z=epsilon partial_Z, with the original fixed band and labels.',
 'ownReferenceRadialSplit':'D_r^own Delta_own = ratio^(-A)*(ratio^(-1/2)*partial_R Delta_reference + a_own*L Delta_reference), on fixed labels. No equality between own and reference radialFast factors is assumed.',
 'componentRows':results,'componentUniformGrades':{k:str(v) for k,v in worst.items()},'bandDegree':59,'coefficientRankInHOver2Pow128':rank,'epsilonDebit':str(e),
 'physicalCoordinateScaling':'For original physical cylindrical coordinates r=Q_ref^(1/2) R, z=Q_ref^D Z and physical velocity correction Q_ref^(-A) Delta, fixed Q_ref and labels give d_r=Q_ref^(-A-1/2) D_r Delta and d_z=Q_ref^(-A-D) partial_Z Delta. A=1/2+h, D=1/2-h; hence the corresponding overall Q_ref powers are -1-h and -1.',
 'physicalBounds':['|d_r Delta_physical| <= Q_ref^(-1-h) * epsilon_ref^(17999/20000)', '|d_z Delta_physical| <= Q_ref^(-1) * epsilon_ref^(22499/25000)'],
 'domain':['The actual protected PostFive source and same-family 127 covariance donors and initialized mean bounds are valid.',
 'Fixed original labels and overlap ratio in [1/4,4]; both inverse charts are jointly admitted, with the original zero-tail equality where prefixes differ.',
 'Original early slab, whole shifted radial paths and source flat joins; physical T=0 uses existing one-sided traces.',
 'Strict original annulus where R>0; endpoint statements use independently established flat extensions.'],
 'caveats':['The physical Q_ref powers are retained; the positive epsilon grades alone do not imply unweighted small physical derivatives.',
 'No independently inferred epsilon-Gaussian weight is assigned to the mean.',
 'This does not bind every active Repeat application, a differentiated eikonal scalar, the full residual, N7/N8, or any final jet.'],
 'pins':{k:h for k,(_,h) in paths.items()},'release':'HOLD'}
args.out.parent.mkdir(parents=True,exist_ok=True)
args.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8',newline='\r\n');print('PASS conditional fixed-label mean derivative grades', {k:str(v) for k,v in worst.items()})
