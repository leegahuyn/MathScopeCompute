# First derivatives of the original Repeat eikonal

**VERIFIED source.** C120's protected graph readback checks \(v_R=v_Z=0\) and \(Lv=0\) for all ten original fixed lifts. The frozen representative and label also fix the three carriers \(p,p_z,x_0\). The actual normal is
\[
 n=(x_0-v\omega_R,\ p/R,\ p_z-\varepsilon v\omega_Z).
\]
Its first ordinary \(\alpha=R,Z\) partial is
\[
 \partial_\alpha n=(-v\omega_{R\alpha},\
        -\mathbf1_{\alpha=R}p/R^2,\ -\varepsilon v\omega_{Z\alpha}).
\]
C106 supplies both original \(F,G\) through the required second slow derivatives and \(b_{\rm vel}/\varepsilon\) through first order over the entire admitted early radial chart. The two exact positive first-derivative rows reproduce C107. The fictitious dependence \(v=v(R,Z)\) would add three chain terms and is rejected by the protected source dependence check.

For the background scalar \(E_{\rm bg}=mk[b_{\rm vel}n_R+\varepsilon v(\omega_T-G\omega_Z)]\), \(L E_{\rm bg}=0\). Its ordinary first derivatives are bounded by \(36 B_{\rm norm}^6 S\exp(2H/2^{128})\sqrt\varepsilon\). The physical operators in normalized coordinates are \(D_r=\partial_R+a_{\rm own}L\) and \(D_z=\varepsilon\partial_Z\). With a \(1/100000\) debit, their conditional background absolute bounds are \(\varepsilon^{49999/100000}\) and \(\varepsilon^{149999/100000}\), respectively.

**CONDITIONAL combined scalar.** The original reference map preserves the two auxiliary \(Y\) arguments and has \(R_{\rm ref}=R/\sqrt b\), \(Z_{\rm ref}=Z/b^D\), \(Q_{\rm ref}=bQ_{\rm own}\). For the protected mean increment \(\Delta_{\rm own}\), the actual radial transport is
\[
 D_r^{\rm own}\Delta_{\rm own}
 =b^{-A}(b^{-1/2}\partial_{R_{\rm ref}}\Delta_{\rm ref}
                   +a_{\rm own}L\Delta_{\rm ref}).
\]
The source donor replay bounds these two terms separately. The original palette can give a different reference radial-fast coefficient. The axial derivative uses the exact factor \(b^{-A-1/2}\) multiplying \(D_z^{\rm ref}\Delta_{\rm ref}\). The six-term product rule combines the three differentiated mean components and the three differentiated normal components with fixed \(mk\), yielding the following absolute upper bounds.

| Scalar | \(D_r\) | \(D_z\) |
| --- | --- | --- |
| Background \(E_{\rm bg}\) | \(\varepsilon^{49999/100000}\) | \(\varepsilon^{149999/100000}\) |
| Protected mean \(mk\,\Delta_{\rm own}\cdot n\) | \(\varepsilon^{19997/50000}\) | \(\varepsilon^{27999/20000}\) |
| Whole eikonal | \(\varepsilon^{39993/100000}\) | \(\varepsilon^{69997/50000}\) |

These are normalized derivatives of the scalar. Differentiating that same normalized scalar with respect to unnormalized physical \(r,z\) retains a factor \(Q_{\rm own}^{-1/2}\). The claims require both original chart brackets, the original early slab, the same-label positive cone and the original ordinary smooth, flat-profile and shifted-path premises.

**OPEN** live appended bindings, independent seam realizations, differentiation of the restored harmonic or its multiplying wave field, and the complete Repeat residual. Final jets 0/67. RELEASE HOLD.

~~~text
python -B verify_background_first_derivative.py --goal GOAL_NEXT --runtime ORIGINAL_M3_FOLDER --baseline C123_WHOLE_EIKONAL --out background-first-derivative.json
python -B verify_complete_first_derivative.py --background background-first-derivative.json --mean PROTECTED_MEAN_FIRST_DERIVATIVES --reference C121_REFERENCE --existing-value C123_WHOLE_EIKONAL --out complete-first-derivative.json
~~~
