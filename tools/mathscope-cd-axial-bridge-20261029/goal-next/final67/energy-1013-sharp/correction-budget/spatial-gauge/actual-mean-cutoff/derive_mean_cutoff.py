"""Bind exact localized mean-curl formulas and the radial characteristic bound."""
from pathlib import Path
from hashlib import sha256
import json
import sys
import gzip
import sympy as sp

assert len(sys.argv)==5, 'Pass GOAL_NEXT, TEMPORAL_CURL_RECEIPT, ORIGINAL_GRAPH_DIRECTORY and NEW_OUTPUT.'
goal, temporal_path, graph, output = map(Path, sys.argv[1:])
assert not output.exists()
def load(path,pin):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==pin,path
    return json.loads(data)
temporal_pin='5e6587efa93017d5d33f3ad87fc9f07cab9e59b4fea24fd520c31d9f25e78a39'
fixed_pin='9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'
outer_pin='c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37'
temporal=load(temporal_path,temporal_pin)
fixed=load(goal/'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json',fixed_pin)
outer=load(goal/'whole-k-core-force/annular-slow-force-energy.json',outer_pin)
assert temporal['status']=='VERIFIED_SAVED_TEMPORAL_COVARIANT_CURL_SOURCE_IDENTITY'
assert temporal['actualCompleteVelocity']==[3614790,3614791,3614792]
assert fixed['pressureMassSupport']['status']=='VERIFIED_Xa_LT_X0Imean_AND_exp5_X0Imean_LT_Xb'
assert fixed['pressureMassSupport']['originalEndpoints']==[633710,633712]
assert outer['geometry']['factors']['C_z']=='20/z0'
assert outer['geometry']['factors']['C_zz']=='692/z0^2'
registry_pin='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333'
registry=load(graph/'original-source-functions.json',registry_pin)
source_digest=sha256()
five_nodes={}
number=-1
with gzip.open(graph/'original-source-nodes.jsonl.gz','rb') as source:
    for line in source:
        source_digest.update(line)
        if 3614767<=number<=3614792 or number in (623135,622798,633710,633712):
            five_nodes[number]=json.loads(line)
        number+=1
assert number==4456994 and source_digest.hexdigest()==temporal['sourceSHA256']
def check(i,op,args):
    assert five_nodes[i]=={'op':op,'args':args},i
parameters=[622791,622802,622803,622804]
check(3614771,'m3_aux_expression_partial',[-20,parameters,[0,0,0,0]])
check(3614774,'m3_aux_expression_partial',[-20,[622791,3614772,622803,622804],[0,0,0,0]])
check(3614775,'multiply',[3614772,3614774])
check(3614776,'definite_integral',[3614775,3614772,633710,622802])
check(3614778,'multiply',[623135,3614776])
check(3614783,'m3_aux_expression_partial',[-20,[622791,3614772,622803,622804],[0,0,1,0]])
check(3614784,'multiply',[3614772,3614783])
check(3614785,'definite_integral',[3614784,3614772,633710,622802])
check(3614786,'multiply',[623135,3614785])
check(3614787,'multiply',[622798,3614786])
check(3614788,'multiply',[20,3614787])
check(3614789,'m3_aux_expression_partial',[-21,parameters,[0,0,0,0]])
check(3614790,'add',[1706773,3614789])
check(3614792,'add',[1706782,3614771])
def decode(value):
    return json.loads(value) if isinstance(value,str) else value
definitions=decode(decode(registry['base'])['expressionDefinitions'])
assert definitions[19]['body']==3614770 and definitions[19]['parameters']==parameters
assert definitions[19]['name']=='GlobalInitializationFiveBump_gamma'
assert definitions[20]['body']==3614788 and definitions[20]['parameters']==parameters
assert definitions[20]['name']=='GlobalInitializationFiveBump_beta'
r,z=sp.symbols('r z',positive=True)
C=sp.Function('C')(z)
Psi=sp.Function('Psi')(r,z)
v=sp.Function('v')(r,z)
beta=-sp.diff(Psi,z)
gamma=sp.diff(Psi,r)+Psi/r
Cz=sp.diff(C,z)
Czz=sp.diff(C,z,2)
ur=-sp.diff(C*Psi,z)
utheta=C*v
uz=sp.diff(C*Psi,r)+C*Psi/r
formulas={
 'u_r':(ur,C*beta-Cz*Psi),
 'u_theta':(utheta,C*v),
 'u_z':(uz,C*gamma),
 'u_r_r':(sp.diff(ur,r),C*sp.diff(beta,r)-Cz*gamma+Cz*Psi/r),
 'u_r_z':(sp.diff(ur,z),C*sp.diff(beta,z)+2*Cz*beta-Czz*Psi),
 'u_theta_r':(sp.diff(utheta,r),C*sp.diff(v,r)),
 'u_theta_z':(sp.diff(utheta,z),C*sp.diff(v,z)+Cz*v),
 'u_z_r':(sp.diff(uz,r),C*sp.diff(gamma,r)),
 'u_z_z':(sp.diff(uz,z),C*sp.diff(gamma,z)+Cz*gamma),
}
for left,right in formulas.values():
    assert sp.simplify(left-right)==0
theta=sp.symbols('theta',real=True)
U,V,W=(sp.Function(name)(r,z) for name in ('U','V','W'))
cartesian=[U*sp.cos(theta)-V*sp.sin(theta),U*sp.sin(theta)+V*sp.cos(theta),W]
def dx(f):
    return sp.cos(theta)*sp.diff(f,r)-sp.sin(theta)*sp.diff(f,theta)/r
def dy(f):
    return sp.sin(theta)*sp.diff(f,r)+sp.cos(theta)*sp.diff(f,theta)/r
cartesian_square=sum(op(f)**2 for f in cartesian for op in (dx,dy,lambda f:sp.diff(f,z)))
cylindrical_square=sum(sp.diff(f,r)**2+sp.diff(f,z)**2 for f in (U,V,W))+(U**2+V**2)/r**2
assert sp.trigsimp(sp.expand(cartesian_square-cylindrical_square))==0
# A constant unit azimuthal component has nonzero Cartesian gradient.
assert cylindrical_square.subs({U:0,V:1,W:0}).doit().subs(r,2)==sp.Rational(1,4)
# Correct coefficients in the radial/axial commutator gradients.
assert sp.simplify(sp.diff(ur,z)-(C*sp.diff(beta,z)+Cz*beta-Czz*Psi))==Cz*beta
R,a=sp.symbols('R a',positive=True)
kernel=(R**2-a**2)/(2*R)
assert sp.simplify(R/2-kernel-a**2/(2*R))==0
h=sp.symbols('h',real=True)
A=sp.Rational(1,2)+h
D=sp.Rational(1,2)-h
assert sp.simplify((-h-sp.Rational(1,2))-(-A))==0
assert sp.simplify((-h-D-h)-(-A))==0
out={
 'status':'VERIFIED_SOURCE_LOCALIZED_MEAN_CURL_FORMULAS_WITH_CONDITIONAL_RADIAL_FTC_BOUND',
 'sourceSHA256':temporal['sourceSHA256'],
 'pins':{'temporalCurl':temporal_pin,'fixedChart':fixed_pin,'outerCutoff':outer_pin,'registry':registry_pin},
 'verifiedFullSourceNodes':number,
 'actualFiveMap':{'gamma':3614771,'psi':3614778,'beta':3614789,
                 'parameters':parameters,'nodes':five_nodes,
                 'gammaDefinition':definitions[19],'betaDefinition':definitions[20]},
 'sourceMean':{'psiTemporal':1706770,'psiFive':3614778,'completeVelocity':[3614790,3614791,3614792]},
 'physicalScale':{'Psi':'Q^(-h) psi','velocityScale':'Q^(-A)','A':'1/2+h','D':'1/2-h','epsilon':'Q^h'},
 'physicalFormulas':{
  'beta':'-Psi_z','gamma':'Psi_r+Psi/r',
  'ur':'C beta-C_z Psi','utheta':'C v','uz':'C gamma',
  'ur_r':'C beta_r-C_z gamma+C_z Psi/r',
  'ur_z':'C beta_z+2 C_z beta-C_zz Psi',
  'utheta_r':'C v_r','utheta_z':'C v_z+C_z v',
  'uz_r':'C gamma_r','uz_z':'C gamma_z+C_z gamma',
  'gradientSquared':'ur_r^2+ur_z^2+utheta_r^2+utheta_z^2+uz_r^2+uz_z^2+(ur^2+utheta^2)/r^2'},
 'cutoffConstants':{'value':1,'z':20,'zz':692,'radialDerivative':0},
 'radialCharacteristic':{
  'YDerivative':'a(R) v_r',
  'ODE':'d_R[R psi(R,Y(R))]=R gamma(R,Y(R))',
  'innerValue':'psi=0 at the fixed inner radius sqrt(Xa)',
  'TemporalReason':'The left integral is zero and chi(inner)=0. The original reserved mean patch and s>=1/2 put its step argument below zero.',
  'FiveMapReason':'The unshifted radial primitive has its fixed left endpoint at that inner radius. The source FiveMap has no auxiliary dependence.',
  'bound':'|psi(R,Y)| <= (R^2-Rinner^2)/(2R) sup|gamma| <= R/2 sup|gamma|',
  'derived':'|psi/R|<=sup|gamma|/2 and |D_R psi|<=3 sup|gamma|/2',
  'uniformityPremise':'The same source gamma bound holds on the whole radial characteristic, including original zero extensions and chart seams.'},
 'negativeControl':'A coefficient 1 in front of C_z beta in ur_z leaves nonzero residual C_z beta. The exact coefficient is 2.',
 'cartesianGradientProof':'Direct symbolic x/y/z differentiation of the rotated axisymmetric vector equals the retained six radial/axial squares plus (ur^2+utheta^2)/r^2.',
 'angularConnectionControl':'A unit constant azimuthal velocity at r=2 has gradient square 1/4. Dropping the angular connection would give zero.',
 'assumptions':temporal['assumptions']+[
  'The source beta,v,gamma bounds are uniform along the radial characteristic in the saved reference band',
  'The original source radial zero extensions and FiveMap FTC/compact support identities apply',
  'The original outer radial cutoff is on its plateau throughout the annulus'],
 'scope':'Exact source-tied localized curl formulas and conditional pointwise radial-FTC envelope. Numeric mean-energy acceptance and later corrections remain independent.',
 'release':'HOLD',
}
output.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8')
print('PASS exact mean cutoff curl and first derivatives; conditional radial-FTC psi bound retained')
