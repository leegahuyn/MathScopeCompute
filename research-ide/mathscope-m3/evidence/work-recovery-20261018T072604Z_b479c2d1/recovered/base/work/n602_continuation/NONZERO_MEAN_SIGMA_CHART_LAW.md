# Actual nonzero-mean Sigma chart law

This argument was independently checked by `derivative_review`. It applies to the actual complete Etheta/Ez used by the new factory and does not reuse the initial zero-mean flux formula.

Put r = Qref/Qlocal, A = 1/2+h and D = 1/2−h. The unchanged original maps give Rlocal=r^(1/2)Rref, Zlocal=r^D Zref, Tlocal=rTref, uref=r^A ulocal and pref=r^(2A)plocal. Also epsilon_ref=r^h epsilon_local. Both complete radial and axial derivatives cost exponent 1/2. The full time derivative and epsilon times the Laplacian cost exponent 1+h. Therefore every complete residual term has exponent A+1+h=2A+1/2, including the nonzero beta, v, gamma terms, both ordered convective products, pressure and viscosity.

For e=2 or 1, define the actual M_e = integral R^e Haar(E_e) dR. Then M_e has exponent 2A−e/2. The original normalized physical bump rho/R^e has exponent (1+e)/2, so (rho/R^e) M_e has exactly the same exponent 2A+1/2 as E_e. Its subtraction therefore preserves that residual scale. The weighted compact radial inverse has exponent 2A, as required by the fixed original signed covariance inverse.

The whole radial envelopes represent the same compactly supported physical integral. Their endpoints may differ after a chart change, but both are outside the complete retained support, so changing them adds zero. Normalization gives integral R^e[Haar(E_e)−rho R^(−e)M_e] dR = M_e−M_e integral rho = 0. Thus the chi correction has zero whole moment; its literal root remains in the implementation.

The support, fixed label/ratio differentiation and all 162 original guards are essential source premises. The new implementation retains them through the original private ancestry and the unchanged fixed-lift assembly helper. This argument is an exact physical source identity, not a numerical uniform class-bound estimate.
