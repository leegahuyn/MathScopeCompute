# Source-coupled spatial cutoff caps from the 24-operand interface

The executed exact verifier confirms a sharper spatial cutoff calculation and the complete signed velocity, covariant-gradient and vorticity stencils. This is a conditional energy implication. It evaluates no actual source supremum, proves no exported gauge defect zero, and closes no correction budget. The original numerical base67, repository files and running GitHub job are untouched. No local Lean compilation is used.

The pinned active-N3 builder supplies **one correction: stage 1** of the N3 background/regularity build. Its 24 operands are U[3], G_U[3,3], A[3], G_A[3,3], in component/direction order r, theta, z. They are not four correction stages. `U` subtracts the original initialized velocity from the post-Five physical velocity. `A` combines the original Forced/Signed mapped wave potentials with the Temporal and FiveMap psi values in its theta component. The direct swirl combines the two mean azimuthal increments. All gradient matrices are orthonormal cylindrical covariant gradients, including the angular connection.

The physical multipliers of those normalized operand groups are respectively Q^-A, Q^(-A-1/2), Q^-h, Q^-A, with A=1/2+h. They retain the original native own/reference factors. A subsequent numerical enclosure must retain both physical signs, all 162 original row maps, lazy guards and flat seams, slow/fast phase pullbacks, and the correct reference Q. An AST readback certifies operand assembly; it does not certify a uniform endpoint.

Let kappa=chi(a_j*q), C be the original outer cutoff, and T=C*kappa. On the original annular radial plateau, T has only axial spatial derivatives. The exact Fraction replay uses 0<h<1/64 and |eta|<3/4 to sharpen the original q derivatives:

    L=1-2h*eta^2 >=503/512,
    |q_z/q| <=2 q^-D,
    |q_zz/q| <=3 q^(-2D), D=1/2-h.

The original seed bounds |chi'|<=5, |chi''|<=42 and a_j*q<=1 on its derivative support give |kappa_z|<=10 q^-D and |kappa_zz|<=183 q^(-2D), uniformly for each fixed a_j>=1. Both jets vanish on the flat branches and extend through the original flat seams. With q/tau0 in[1/2,2], sqrt(2)<3/2, and the pinned outer bounds20 tau0^-D and692 tau0^(-2D),

    |T|<=1, |T_z|<=35 tau0^-D, |T_zz|<=1658 tau0^(-2D).

The old bounds60 q^-D and5100 q^(-2D) become90 tau0^-D and10200 tau0^(-2D) with the same rational conversion. The new coefficients are strictly smaller in the same units. The pinned stage-four support result separately implies **effective bounds on the correction support**15 and366, because the outer cutoff is one there. This statement does not claim a global bound15/366 for T derivatives independent of the correction support.

The required source gauge identity is

    U=curl(A)+directSwirl*e_theta.

Its three exported difference roots must be proved zero, or their values and first derivatives must be separately bounded and included. This packet does neither. Assuming that identity, the exact cutoff-before-curl velocity and its derivatives are

    v=T U+T_z e_z cross A,
    (grad v)_k=T (G_U)_k +delta_kz*T_z U
                 +T_z e_z cross (G_A)_k +delta_kz*T_zz e_z cross A.

The verifier independently differentiates the velocity, including the cylindrical angular connection, and obtains every one of the nine claimed entries. It derives all three curl components from those entries and checks their separate signed formulas. No second derivatives of A, pressure, or time roots are needed for this first spatial energy calculation. The direct gradient bound avoids invoking an integration by parts on a restricted annulus; replacing it by a curl norm would need the relevant divergence and boundary conditions.

Define four uniform physical caps over the same complete original domain:

    u0=sup_i tau0^A |U_i|, u1=sup_ik tau0^(A+1/2) |G_U_ik|,
    a0=sup_i tau0^h |A_i|, a1=sup_ik tau0^A |G_A_ik|, t=tau0^h.

Set c1=35 and c2=1658. The componentwise velocity majorants are (V_p,V_p,u0), where V_p=u0+c1*t*a0. In the gradient, the four transverse entries are G_p=u1+c1*t*a1; the two transverse-direction derivatives of the axial component are u1; the two axial derivatives of transverse components are G_a=u1+c1*t*(u0+a1)+c2*t^2*a0; the axial/axial entry is G_z=u1+c1*t*u0. Thus the sharper energy bracket emitted as an exact polynomial is

    E24=2 V_p^2+u0^2+2(4 G_p^2+2 u1^2+2 G_a^2+G_z^2).

The same affine energy normalization and measure bound used by the pinned existing annular budget evaluator give

    J_j^2/tau0 <=32 Xb E24.

For V=u0+35t*a0 and G=u1+35t*(u0+a1)+1658t^2*a0, the verifier checks coefficientwise that E24<=3V^2+18G^2. The original force scale satisfies S_R/tau0=t^-2 B_h^4 Xb^(-4A)/(4A). Under its existing premises B_h>1, Xb>1 and4A<3,

    J_j^2/S_R <=96 Xb^4 t^2 E24.

Actual caps satisfying this ratio<=2^-26 meet the existing per-correction allocation. An actual comparison has not been run. The initialized field and four correction norms must be combined using the triangle inequality; the packet asserts no orthogonality between correction stages.

If independently established same-reference Q/tau0 bounds are[1/4,4], an enclosure of the normalized source groups can conservatively be converted to these four caps with factors4,8,2,4. The same chart, native label and reference ownership must first be authenticated. The verifier does not infer that domain premise from the new source graph or import another source family's numerical scale. Keeping the exact Q/tau0 factors may be sharper.

`spatial-cutoff-caps.json` contains all 24 source-slot mappings, the physical multipliers, 15 signed output stencils, the exact majorant polynomials and their source pins. The root IDs are null until a completed actual ingress is supplied with its independent successful native readback. It deliberately contains no guessed IDs copied from an older N1 graph or a different direct/split root list.

The exact controls use rational synthetic caps and test fields, not original numerical evidence. Removing the T_z U term changes the tested axial gradient from-2 to-1; removing T_zz e_z cross A changes another from-1 to0. At the synthetic caps u0=u1=a0=a1=1 and t=1/16, the entrywise bracket is2821161/4096, below both its coarser same-coefficient scalar bracket20961297/8192 and the old-coefficient entrywise bracket2915001/256. Those comparisons demonstrate the algebraic improvement only.

Replay with the Python standard library, into a fresh output path:

```text
python -B verify_spatial_cutoff_caps.py GOAL_NEXT NEW_OUTPUT.json
```

Once the existing large GitHub job is complete and the separate native reader has succeeded, bind its small metadata without downloading the large graph again:

```text
python -B verify_spatial_cutoff_caps.py GOAL_NEXT NEW_BOUND_OUTPUT.json --ingress first-correction-spatial-ingress.json --readback INDEPENDENT_SUCCESSFUL_READBACK.json
```

The optional binding rejects partial readbacks, unmatched ingress hashes, wrong source-cycle/guard pins and wrong physical multipliers. It records the actual24 root IDs and three remaining gauge defects. A successful binding still does not prove their zero values or provide the24 uniform caps. Stages2–4 require their own authentic successor states and operand construction; the present first-cycle builder is not an all-stage constructor. N8 nonlinear force and higher/time/pressure jets require more source information than these first spatial roots. N7-06, N8-05, final jets0/67 and RELEASE HOLD remain unchanged.

The final five files include the script, receipt, replay log, README and MANIFEST. All use UTF-8/LF; Python optimized execution is rejected. The receipt reproduces byte-for-byte with unchanged pinned inputs.
