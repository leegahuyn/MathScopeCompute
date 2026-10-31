"""Exact algebra of source-order-one Picard row 5 versus axial residual.

This checks a transcription of the producer formula, not its AST binding and
not convergence or satisfaction of the Picard equation by the actual function.
"""
import json,hashlib
from pathlib import Path
import sympy as s
xi,eta,D,lam,L,d,U0,v0,Hu,Z0,Pknown,Visc,F0=s.symbols('xi eta D lam L d U0 v0 Hu Z0 Pknown Visc F0')
F,U,K,Pi,W,Ueta,Keta,Pieta,Uxx=s.symbols('F U K Pi W Ueta Keta Pieta Uxx')
X=xi**2; A=1-D;c=-A;gamma=c+lam;p=-2*A+lam
v1=(2*eta*U-2*eta*(D+lam)*(U+K)-d*(Ueta+Keta))/L
adv=(-gamma*U+D*eta*Ueta+xi*W/2)/L + xi*v0*W/2
adv+=U0*(2*eta*(gamma*U-xi*W/2)+d*Ueta)/L
adv+=Hu*v1+U*Z0+(2*eta*(p*Pi-X*(2*F0*F+Pknown))+d*Pieta)/L-Visc
residual=adv-(Uxx+W/xi)/2
row=(-8*eta*X*F0/L)*F
row+=(2*gamma*(2*eta*U0-1)/L+4*eta*(A-lam)*Hu/L+2*Z0)*U
row+=(-4*eta*(D+lam)*Hu/L)*K+(4*p*eta/L)*Pi
row+=(xi/L+xi*v0-2*eta*xi*U0/L)*W
row+=(2*(D*eta+d*U0-d*Hu)/L)*Ueta + (-2*d*Hu/L)*Keta+(2*d/L)*Pieta
row+=-2*Visc-4*eta*X*Pknown/L
diff=s.factor(s.together(2*residual-(-Uxx-W/xi+row)))
assert diff==0, diff
# Mutating pressure reconstruction coefficient detects omission of the extra
# factor 2 in Pi_X=2 F0 F1 + pKnown; generic symbols retain the discrepancy.
mutant=adv.subs(Pknown,Pknown+F0*F) # effective Pi_X=3 F0 F + pKnown
bad=s.factor(s.together(2*(mutant-(Uxx+W/xi)/2)-(-Uxx-W/xi+row)))
assert bad!=0 and s.simplify(bad+4*eta*X*F0*F/L)==0
out={'identity_remainder':str(diff),'mutated_pressure_remainder':str(bad),
 'conditions':['xi != 0; L != 0','X=xi^2','A+D=1','pressure_X=2*F0*F1+Pknown','V1=X*v1 from source average=U1+K1'],
 'scope':'universal exact algebra of transcribed source expressions; actual AST-to-matrix correspondence and Picard analytic solution remain separate',
 'source_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
Path(__file__).with_name('row5-algebra.json').write_text(json.dumps(out,indent=2),encoding='utf8')
print('PASS: transcribed Picard row-5 / axial residual exact identity and mutated pressure negative control')
