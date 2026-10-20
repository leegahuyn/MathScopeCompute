# Independent nonzero-mean Sigma chart review

The actual-current construction has the required chart exponent. This statement concerns its exact source formula and does not supply numerical all-order seminorm values.

Let r=Qref/Qlocal, A=1/2+h and D=1/2-h. With labels and ratios frozen before differentiation, the original charts satisfy Rlocal=r^(1/2)Rref, Zlocal=r^D Zref, Tlocal=r Tref, uref=r^A ulocal, pref=r^(2A)plocal and epsilon_ref=r^h epsilon_local. The full radial derivative and the full axial derivative each cost exponent 1/2. The time operator and epsilon times the Laplacian each cost exponent 1+h. Hence the linear terms have exponent A+1+h=2A+1/2; both ordered convective products and the full pressure gradient have this same exponent. This applies to the complete current with nonzero beta, v and gamma.

For e=2 or e=1, Eref=r^(2A+1/2) Elocal implies

Mref=integral Rref^e Haar(Eref) dRref=r^(2A-e/2) Mlocal.

The normalized physical density satisfies (rho/R^e)ref=r^((1+e)/2)(rho/R^e)local. Thus (rho/R^e)M has exponent 2A+1/2, and subtracting it from Haar(E) preserves the residual scaling. The inverse -R^(-e) integral R^e[Haar(E)-rho R^(-e)M] dR has exponent 2A, precisely the signed covariance target exponent.

Normalization gives integral R^e[Haar(E)-rho R^(-e)M] dR=M-M integral rho=0. The retained chi-times-whole-integral term therefore vanishes as a source identity, though its root remains present in the code. Changing chart endpoints changes neither whole integral when both endpoint pairs lie outside the same complete compact support. This uses the original physical support, fixed labels and ratios, and the unchanged 162 guards; it would not be justified for an arbitrary unbound function.

This derivation does not use the initial-only zero-mean flux identity. The new factory obtains Etheta/Ez from the complete actual post-forced mean and latest full pressure. Its existing original private ancestry and unchanged field assembly provide the source and chart binding reviewed here.

Reviewed module SHA256: 7cb5819ba9db2c1f5530ae744d6c15966e7af25bdaa1926e6a6a8485266cb12b.

Reviewed helper SHA256: 72725fea67bbb4943530d77b0266bee61e251901b6e148ea1bb6d7c6b0341651.
