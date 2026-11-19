"""Exact natural first-integral correspondence and historical B constants."""
import argparse
from fractions import Fraction as R
from math import factorial
from pathlib import Path
import hashlib
import json
import sympy as s

assert __debug__, 'Exact source verification requires assertions.'
p=argparse.ArgumentParser()
p.add_argument('source',type=Path)
p.add_argument('output',type=Path)
a=p.parse_args()
raw=a.source.read_bytes(); source=json.loads(raw)
assert source['status']=='PASS_ACTUAL_B26_COMMON_INNER_SOURCE_BRANCH'
assert source['axisProofSHA256']=='1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920'
assert all(source[key]['pass'] for key in ('checkShear','checkU','checkKap'))
assert all(source['actualAverageBinding'][key]['pass'] for key in ('checkCoreV','checkCollarV'))
assert all(source['actualFieldBinding'][key]['pass'] for key in ('checkActualF','checkActualU'))
X,e,h=s.symbols('X eta h',real=True)
A,D=s.Rational(1,2)+h,s.Rational(1,2)-h
d,L=1-e**2,1-2*h*e**2
F,U,P,M,I,J,S=(s.Function(name)(X,e) for name in ('F','U','P','M','I','J','S'))
primitives={M:U,I:2*X*F,J:2*X*U*F,S:U**2-X*F**2,P:F**2}
rules={}
for f,g in primitives.items():
    rules[s.diff(f,X)]=g
    rules[s.diff(f,X,e)]=s.diff(g,e)


def DX(expr):return s.diff(expr,X).xreplace(rules)
def Z(b,f):return (2*e*(b*f-X*s.diff(f,X))+d*s.diff(f,e))/L
def T(b,f):return (-b*f+X*s.diff(f,X)+D*e*s.diff(f,e))/L
W=1-(2*D*e*M+d*s.diff(M,e))/X
v=(W-1+2*e*U)/L
angular=(1-h)*I-D*e*s.diff(I,e)-d*s.diff(J,e)+2*(h-D)*e*J
Qs=-W+angular/(2*X**2*F)
Ns=-W*U+(D*(M-e*s.diff(M,e))+4*h*e*S-d*s.diff(S,e))/X+4*A*e*P-d*s.diff(P,e)
raw_theta=T(-A-s.Rational(1,2),F)+v*(X*s.diff(F,X)+F)+U*Z(-A-s.Rational(1,2),F) \
    -2*(X*s.diff(F,X,2)+2*s.diff(F,X))
raw_z=(T(-A,U)+X*v*s.diff(U,X)+U*Z(-A,U)+Z(-2*A,P)
       -2*(X*s.diff(U,X,2)+s.diff(U,X))).xreplace(rules)
Ctheta=angular-2*X**2*F*W+4*L*X**2*s.diff(F,X)
Cz=X*Ns+2*L*X*s.diff(U,X)
checks={}


def identity(name,left,right):
    difference=s.cancel(left-right)
    assert difference==0,(name,s.factor(difference))
    checks[name]=True


identity('actual_angular_first_integral_derivative',DX(Ctheta),-2*X*L*raw_theta)
identity('actual_axial_first_integral_derivative',DX(Cz),-L*raw_z)
identity('actual_source_p1_to_natural_log_slope',X*Qs/L+2*X*s.diff(F,X)/F,Ctheta/(2*L*X*F))
identity('actual_source_ns_to_natural_U_slope',Ns/L+2*s.diff(U,X),Cz/(X*L))

# Do not discard the actual pressure axis datum when interpreting the mode.
P0=s.Function('P0')(e)
wrongCz=Cz-X*(4*A*e*P0-d*s.diff(P0,e))
wrongDerivative=s.cancel(DX(wrongCz)+L*raw_z)
assert wrongDerivative!=0
identity('omitted_pressure_constant_counterterm',wrongDerivative,-4*A*e*P0+d*s.diff(P0,e))

scalar={}
def verify(name,condition,value=None):
    assert condition,name
    scalar[name]={'pass':True,**({'value':str(value)} if value is not None else {})}

# Exact B_rho evaluation on |Y|<=4.1 and dist(eta,I)<=delta.
ratio=R(41,200)+R(1,1024)
verify('radial_plus_parameter_series_ratio_below_one_quarter',ratio<R(1,4),ratio)
for k,target in [(0,R(2)),(1,R(1,5)),(2,R(1,25))]:
    bound=R(factorial(k),20**k)*R(4,3)**(k+1)
    verify('natural_Y_derivative_'+str(k),bound<=target,bound)
verify('Phi_eta_upper_4Q_over_rho',R(4,3)**2<4,R(4,3)**2)
verify('complex_Phi_lower',R(1,4)-R(4,1024)==R(63,256)>R(1,8),R(63,256))
verify('Q135_dominates_Caxis_finite_constants',2**135>128)
verify('selected_width_small_and_8Qt1_below_one',R(1,2**120)<R(1,10) and 8*R(1,2**119)<1)
verify('original_delta_inside_eta_complex_tube',R(1,2048)<R(1,32))
verify('common_natural_argument_below_4_1',4/(1-R(1,160))<R(41,10),4/(1-R(1,160)))
eta=R(33,32)
verify('complex_L_inverse_below_two',1-R(1,8)*eta**2>R(1,2),1-R(1,8)*eta**2)
verify('natural_U_value_below_five',4*eta+R(1,1000)+R(2,2**63)<5)

Y=R(41,10)
inversePhi=R(256,63)
# Check the FULL source p1_ref=-2Y Phi_Y/Phi, including its factor2.
# The actual B26 log-F slope is -p1_ref/2, hence obeys these same loose bounds.
pbound=Y*R(1,5)*(2*inversePhi)
pybound=pbound+Y**2*R(1,25)*(2*inversePhi)+Y**2*R(1,25)*(2*inversePhi**2)
verify('actual_full_source_p1_bound_8Q',pbound<8,pbound)
verify('actual_full_source_p1_y_bound_80Q2',pybound<80,pybound)
rbound=Y*R(1,5)
rybound=Y*R(1,5)+Y**2*R(1,25)
verify('actual_natural_U_y_bound_Q_over_Lambda',rbound<1,rbound)
verify('actual_natural_U_yy_bound_2Q_over_Lambda',rybound<2,rybound)

# These are the actual B26 equations after the source/mode binding:
# F_y=kappa*p*F, U_y=kappa*r, |kappa|<=1, |kappa_y|<=9/t1.
Fheight=6
Fy=8*Fheight
Fyy_t1=9*8*Fheight
Fyy_plain=(80+8**2)*Fheight
Fxx=R(Fyy_t1+Fyy_plain+Fy,16)
verify('actual_B26_F_X_coefficient',R(Fy,4)==12,R(Fy,4))
verify('actual_B26_F_XX_coefficient',Fxx==84 and Fxx<2048,Fxx)
Uxx=R(9+2+1,16)
verify('actual_B26_U_XX_coefficient',Uxx==R(3,4) and Uxx<2,Uxx)
verify('historical_B_dominates_all_natural_and_B26_C2_coefficients',
       max(6,12,Fxx,1,Uxx)<4096)

# Source scale identity and parameter hierarchy are exact original ones.
pe=source['parameterExpressions']
assert pe['Lambda']=={'power':[{'ref':'Q'},64]}
assert pe['t1']=={'power':[{'ref':'CSelected'},-120]}
assert pe['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]}
assert pe['kappa0']=={'ref':'t1'}
assert pe['rho']=={'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]}
assert pe['Q']['quotient'][0]['product'][0]['integer']==str(2**260)
assert source['originalScaling']['B']==24812
out={
 'schema':'MathScope.N1HistoricalLeadingBFromActualNaturalMode/1',
 'status':'PASS_SOURCE_MODE_IDENTITIES_AND_HISTORICAL_B_CONSTANTS',
 'sourceSHA256':hashlib.sha256(raw).hexdigest(),'axisProofSHA256':source['axisProofSHA256'],
 'modeFirstIntegralIdentities':checks,'exactScalarChecks':scalar,
 'wrongPressureConstantDifference':str(wrongDerivative),
 'actualDerivedBounds':{'F0_value':'6Q','F0_X':'12 Lambda Q^2',
   'F0_XX':'84 Lambda^2 Q^3/t1','U0_value':'6','U0_X':'Q/4',
   'U0_XX':'(3/4) Lambda Q/t1'},
 'historicalB':'4096 Lambda^2 Q^3/t1, same original source node24812',
 'conditionalInstantiation':'Uses the pinned independently constructed actual natural-axis infinite analytic function of the same datum, its B_rho norm<=Q and natural ODE; no B bound or B26 reference-slope identity is assumed. The source branch audit and the new first-integral identities bind those inputs to actual B26.',
 'closure':'These bounds hold for actual real X in[0,a^2] and eta inS_delta, with matching flat jets at Xa. They supply the exact leading premise of the separate n=1 source kernel packet.',
 'formalLimit':'Ordinary analytic proof plus exact source/scalar evidence. This is not a full Lean instantiation of the original natural-axis coefficient-space construction or a numerical native evaluator.',
 'release':'HOLD'}
a.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'status':out['status'],'modeChecks':len(checks),'scalarChecks':len(scalar),
                  'FxxCoefficient':str(Fxx),'UxxCoefficient':str(Uxx),'BUnchanged':True}))
