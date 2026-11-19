# Same-live ordinary mean gauge reduction (C78)

The ordinary Temporal-plus-FiveMap contribution to the original candidate gauge has residual exactly(0,0,0), conditional on ordinary FTC/differentiation under the same admitted smooth native branch. The proof is tied to the successfully verified run44582875351 native mean bindings. It does not declare the three complete gauge-difference roots zero.

The receipt ordinary-mean-reduction.json pins the C77 native mean binder, spatial readback, ingress, prior compact baseline cancellation and five immutable original source files. It matches the actual potential, velocity, native derivative, integration-variable and fixed-endpoint IDs. The source commit is f8cb4034e86d7b669d52a6f2248aebba156b51b5.

## Exact surviving mean contribution

The compact original source has already cancelled its duplicated mean baseline. Write psiT and psiF for its actual Temporal and raw FiveMap potentials, and vT/vF for its original direct swirls. The candidate's azimuthal potential is psiT+psiF and its direct swirl is vT+vF.

Use the original normalized derivatives

    Dr=partial_R+aL,  Dz=epsilon*partial_Z,
    curl(psi*e_theta)=(-Dz psi,0,Dr psi+psi/R).

The original Temporal velocity is literally(-Dz psiT,vT,Dr psiT+psiT/R), in the same registered native application slots. Therefore its candidate curl contribution agrees without replacing its realized gamma by a desired gamma.

C77 independently binds the actual FiveMap bodies:

    psiF=(1/R)*integral_[sqrtXa,R] r*GammaF(ell,r,Z,T)dr
    betaF=-(epsilon/R)*integral_[sqrtXa,R] r*GammaF_Z(ell,r,Z,T)dr.

The integration variable replaces the radius in the actual native Gamma argument. The derivative application is exactly[0,0,1,0] at ell,boundRadius,Z,T. Both use the same lower bound, integration variable and upper radius. The source FiveMap increments are auxiliary-independent.

Ordinary FTC gives psiF_R+psiF/R=GammaF, betaF=-Dz psiF and LpsiF=0. Adding both original contributions and the direct swirl gives zero in all three ordinary mean gauge differences. Every derivative of this local zero identity is zero under the same branch and regularity assumptions.

No whole radial FiveMap integral is set to zero. The separate whole-integral/support proof is unnecessary for this raw ordinary curl identity and remains separate.

## Temporal shift, cutoff and fixed endpoints

For its actual shifted left/whole integrals I/J,

    Y_shift=Y+(Phi(r)-Phi(R))*vr,  a=Phi_R.
    partial_R I=R*g-a*I_L,  partial_R J=-a*J_L.

The phase terms cancel exactly in Dr. For slow auxiliary-independent chi,

    (Dr+1/R)((I-chi*J)/R)=g-chi_R*J/R,
    betaT=-epsilon*(I_Z-chi_Z*J-chi*J_Z)/R.

Both chi_R and chi_Z are retained. The realized Temporal axial velocity already contains the negative cutoff term. Replacing it by g would leave residual+chi_R*J/R, oriented as velocity minus gauge curl.

Original radial endpoints are sqrtXa and2sqrtXb, with fixed source parameters/band labels. Their R/Z/T/Y derivatives vanish. For moving endpoints, the correct general formula is

    J_Z=integral_alpha^outer f_Z+f(outer)*outer_Z-f(alpha)*alpha_Z.

The source Phi is independent of Z/T/Y on a fixed band. No derivative of a frozen mesh label, carrier or representative is taken.

## FiveMap bump eta and native derivatives

The companion check_five_bump_derivative.py pins the actual original source-global-moment.mjs copy formula. For lambda_j=exp(j*d) and x_j=R/(sqrt(s)*lambda_j),

    B_j=s^(-A)*eta0(x_j)/lambda_j,
    partial_Z(c_j*B_j)=s^(-A)/lambda_j*
       [c_j,Z*eta0(x_j)-(s_Z/s)*c_j*
          (A*eta0(x_j)+(x_j/2)*eta0_prime(x_j))].

Thus the bound-radius native GammaF_Z includes every coefficient, physical scale and bump-argument derivative. It is not a profile eta derivative with s held fixed. The generic exact control gives correct derivative-6 and incorrectly frozen-argument derivative-2, detecting the missing term. This is a calculus control, not a counterexample to the fixed original bump data.

## Compact alternative and outer eta

If a compact FiveMap potential were substituted, its difference from the actual raw potential is-chi*J_F/R. Its curl difference is

    (+epsilon*(chi_Z*J_F+chi*J_F,Z)/R,0,-chi_R*J_F/R).

These terms vanish only after the separate appropriate whole-integral identity is proved.

For a distinct slow outer localization eta, write Psi=psiT+psiF. The exact product-rule residual is

    eta*U_mean-[curl(eta*Psi*e_theta)+eta*directSwirl*e_theta]
       =(+epsilon*eta_Z*Psi,0,-eta_R*Psi).

The source physical pullback factors are those retained by C77. This formula does not claim that the source localization omitted its commutator.

Three rational controls are executed: alpha=1,R=2,GammaF=1,epsilon=1,eta=Z gives radial+3/4; retaining GammaF(R) inside an integral that requires GammaF(r), with GammaF(r)=r, gives candidate-minus-actual axial+3/4; a moving lower endpoint alpha(Z)=1+Z atR=2,Z=0 gives native-minus-curl radial-1/2 when its endpoint derivative is wrongly omitted. These are exact diagnostic controls, not fixed-original-profile counterexamples.

## What remains open

The full initialized subtraction/wave comparison, the three complete gauge-difference roots, whole FiveMap radial cancellation, uniform stage caps and final gates remain separate. The C77 verified source bindings are used as inputs; this packet does not rescan the large native stream or claim to replace its provenance.

The analytic premises are ordinary FTC on the admitted radial segment, differentiation under its same smooth native branch, fixed source endpoints/labels, and the original Temporal inverse/periodicity/support assumptions. The symbolic calculus and source/argument checks are executed locally. This is not a new Lean proof of those analytic facts; Lean compilation remains on GitHub.

## Replay

    python -B reduce_ordinary_mean.py GOAL_NEXT WORK OUTPUT/ordinary-mean-reduction.json
    python -B check_five_bump_derivative.py GOAL_NEXT OUTPUT/five-bump-derivative.json

GOAL_NEXT is the existing evidence directory; WORK is its sibling original scratch tree. Dependencies are pinned before use. Python assertions are mandatory. Both executions were replayed byte-identically, and Python -O is rejected. Files are UTF-8/LF. No repository edits, Git mutations, GitHub runs or local Lean compilation were performed.
