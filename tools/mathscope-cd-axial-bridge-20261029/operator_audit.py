"""Exact differential algebra; analytic source hypotheses are deliberately separate.

All computations use integers/rational functions, symbolic derivatives, and exact
integration of countermodels. No float or sampled source acceptance is used.
"""
import argparse, hashlib, json, pathlib
import sympy as s

x, eta, h, a, b, n = s.symbols('X eta h a b n', real=True)
D, A, d, L = s.Rational(1,2)-h, s.Rational(1,2)+h, 1-eta**2, 1-2*h*eta**2
f, g, v = (s.Function(k)(x,eta) for k in ('f','g','v'))

def T(a,f): return (-a*f+D*eta*s.diff(f,eta)+x*s.diff(f,x))/L
def Z(a,f): return (2*a*eta*f+d*s.diff(f,eta)-2*eta*x*s.diff(f,x))/L
def t(a,f): return (-a*f+D*eta*s.diff(f,eta))/L
def z(a,f): return (2*a*eta*f+d*s.diff(f,eta))/L

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=pathlib.Path,default=pathlib.Path(__file__).with_name('operator-audit.json'))
    args=parser.parse_args()
    checks={}
    def zero(name, expression):
        reduced=s.factor(s.together(s.expand(expression)))
        checks[name]={'pass':reduced==0, 'exact_remainder':str(reduced)}
        if reduced!=0: raise AssertionError((name,reduced))
    zero('Z_product_rule_arbitrary_exponents',Z(a+b,f*g)-Z(a,f)*g-f*Z(b,g))
    zero('T_product_rule_arbitrary_exponents',T(a+b,f*g)-T(a,f)*g-f*T(b,g))
    zero('T_integral_transfer_with_boundary',T(a,f)-t(a+1,f)-s.diff(x*f,x)/L)
    zero('Z_integral_transfer_with_boundary',Z(a,f)-z(a+1,f)+2*eta*s.diff(x*f,x)/L)
    k=2*eta/L
    boundary2=-z(a-D+1,k*x*f)-k*x*Z(a,f)
    zero('ZZ_integral_transfer_eta_coefficients_differentiated',
         Z(a-D,Z(a,f))-z(a-D+1,z(a+1,f))-s.diff(boundary2,x))
    # v is V/X in the source. Every convolution split obeys this identity.
    transport=x*v*s.diff(g,x)+f*Z(b,g)
    divdefect=s.diff(x*v,x)+Z(a,f)
    conservative=s.diff(x*v*g,x)+Z(a+b,f*g)-g*divdefect
    zero('transport_conservative_defect_per_split',transport-conservative)
    zero('radial_scalar_viscosity_boundary',-2*(x*s.diff(f,x,2)+s.diff(f,x))+2*s.diff(x*s.diff(f,x),x))
    zero('pressure_moment_boundary_density',f+x*s.diff(f,x)-s.diff(x*f,x))
    lam=2*n*h
    zero('physical_time_exponent',1-A+lam-1-(-A+lam))
    zero('physical_flux_exponent',1-2*A+lam-D-(-A+lam))
    zero('physical_lower_viscosity_exponent',1-A+2*(n-1)*h-2*D-(-A+lam))
    # R dR=dX, and (1/2)R^2*d_R Pi*dR=X*d_X Pi*dX.
    R=s.symbols('R',positive=True)
    zero('R_to_X_jacobian',s.diff(R**2/2,R)-R)
    zero('pressure_weight_transform',(s.Rational(1,2)*R**2*R)/R-R**2/2)
    # Countermodels refute omitted-hypothesis inferences, not the actual profiles.
    countermodels={
      'pressure_boundary_omitted': {
        'domain':'R in [0,1]', 'Pi':'1', 'integral_R_Pi':'1/2',
        'minus_half_integral_R2_Pi_prime':'0','boundary_half_R2_Pi':'1/2'},
      'pointwise_moment_not_eta_identity': {
        'M':'eta','eta':'0','M_at_0':'0','eta_derivative_at_0':'1'},
      'clipping_does_not_prove_raw_support': {
        'domain':'X in [0,3]', 'raw':'1','Xminus':'1','Xplus':'2',
        'full_integral':'3','clipped_integral':'1'},
      'zero_total_does_not_prove_smooth_cutoff': {
        'domain':'X in [0,1]', 'g':'2*X-1','integral_g':str(s.integrate(2*x-1,(x,0,1))),
        'primitive':'X^2-X','left_derivative_at_Xplus':'1','exterior_derivative':'0'},
      'positive_order_moments_do_not_supply_order_zero': {
        'M_positive':'0','flux_positive':'0','M_zero':'eta^2','eta':'0',
        'n1_lower_viscosity':str(-Z(-A-D,Z(-A,eta**2)).subs(eta,0)),
        'realization':'U0(X,eta)=eta^2*b(X) for any smooth compact bump of integral 1; this is not an actual source solution.'},
    }
    wrong=s.diff(L,eta)
    # Second Z's derivative hits the first Z's L^-1 coefficient.
    omitted_L_derivative=(d/L)*(-wrong/L**2)*(2*a*eta*f+d*s.diff(f,eta)-2*eta*x*s.diff(f,x))
    witness=s.factor(omitted_L_derivative.subs({f:1,a:1,h:s.Rational(1,4),eta:s.Rational(1,2)}).doit())
    # A separate direct rational witness avoids unresolved derivatives of substituted f.
    direct=s.factor(((d/L)*s.diff(1/L,eta)*2*eta).subs({h:s.Rational(1,4),eta:s.Rational(1,2)}))
    assert direct!=0
    countermodels['second_Z_eta_coefficient_frozen']={'h':'1/4','eta':'1/2','f':'1','a':'1','omitted_term':str(direct)}
    data={
      'schema':1,'arithmetic':'SymPy exact rational differential algebra',
      'domain':'X>=0, q>0, 0<h<1/2, |eta|<=1; L>=1-2h>0. Physical chart uses |eta|<1.',
      'checks':checks,'countermodels':countermodels,
      'second_Z_boundary_primitive':str(boundary2),
      'conditional_integrated_identity': 'Integral raw_n dX = t_(1-A+lambda_n)(M_n) + z_(1-2A+lambda_n)(B_n) - z_(1-A+lambda_(n-1)-D) z_(1-A+lambda_(n-1))(M_(n-1)) + boundary_and_divergence_defects',
      'M_n':'Integral U_n dX', 'B_n':'Integral (sum_(i+j=n) U_i U_j+Pi_n) dX',
      'analytic_obligations':['actual native raw_n matches the coefficient formula','divergence defects vanish for every convolution index','all radial boundary primitives vanish uniformly with eta derivatives','actual M_n and B_n vanish as functions, not sampled values','n1 uses separately established M_0=0','integrability and eta differentiation under integrals','full raw residual zero outside source clipped interval','all recursive orders satisfy induction; finite graph prefix is insufficient'],
      'status':'VERIFIED algebra; CONDITIONAL analytic transfer; OPEN actual all-order source moment certificate',
      'source_sha256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),
    }
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf8')
    print(f'{len(checks)}/{len(checks)} exact identities PASS; {len(countermodels)} omitted-hypothesis countermodels recorded')

if __name__=='__main__': main()
