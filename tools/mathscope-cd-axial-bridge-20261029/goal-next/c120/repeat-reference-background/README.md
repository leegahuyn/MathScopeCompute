# Original reference-scaled background in the repeat eikonal

The original initialized reference uses the ratio $b=2^{\ell-\ell_{\rm ref}}$ and substitutes $(R/\sqrt b,Z/b^D,T/b)$ with $Q_{\rm ref}=bQ$. The original PostFive mean shares its actual fields through the same reference values and multiplies velocity by $b^{-A}$ and pressure by $b^{-2A}$. With $D=1/2-h$, the original inverse equation carries its root to $s/b$. The verified Lean chart theorem selects this same root whenever it lies in the registered interval $[1/2,2]$. It also preserves $X$. The cylindrical radius, actual $q=Qs$, and $\eta$ transformations give the exact source exponents of the repeated background. In particular $R_{\rm ref}F_{\rm ref}$ scales by $b^A$, $G_{\rm ref}$ scales by $b^A$, and the radial factor $\varepsilon_{\rm ref}s_{\rm ref}^{-1/2}$ scales by $b^{h+1/2}=b^A$. Pressure scales by $b^{2A}$. The ordinary normalized positive-order profiles are unchanged at identical $(q,X,\eta)$, with the same physical cutoff if the retained source atlas is valid at both labels.

The actual phase uses $\omega=pF+p_zG$. Its original physical first derivative and its co-moving background transport give

$$
D_t\phi+(b_{\rm vel},RF,G)\cdot\nabla\phi
= b_{\rm vel} n_R+\varepsilon v(\omega_T-G\omega_Z).
$$

Here $b_{\rm vel}$ is the radial background field. The fixed native pulse lift gives $D_t=-\varepsilon\partial_T+\partial_v$ on phase-free amplitudes. The terms $-\omega+pF+p_zG$ cancel exactly. Adding the actual reference-scaled PostFive mean increment $\Delta$ adds $\Delta\cdot n$ to the right side. No numerical sign or smallness is asserted for that increment. The original harmonic multiplies the reduced phase by $imk$.

**CONDITIONAL on joint admission.** Both original inverse charts must select the transported root on their registered intervals, and any difference in finite retained profile prefixes must be justified by the exact zero cutoff tail. Separate coarse scale bounds cannot replace this condition. For example $s=1/2$ and ratio $4$ give a candidate reference root $1/8$ outside the registered interval. The currently pending active append and its physical guard chart tests must bind these premises at all actual applications.

~~~text
python -B verify_repeat_reference_background.py --goal GOAL_NEXT --repo REPO --runtime ORIGINAL_RUNTIME --out FRESH.json
~~~
