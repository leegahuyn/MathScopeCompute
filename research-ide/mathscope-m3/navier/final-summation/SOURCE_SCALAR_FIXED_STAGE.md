# Original source scalar comparison at one fixed stage

`source-fixed-stage-scalar-comparison.mjs` extends the finite-window
consumer with the exact stage choice needed for the original positive
`h=exp(-8002*(exp(1048576)+10))`. The comparison index may be enormously
large. It remains a finite ceiling expression in the source graph.
Neither `h` nor the index is rounded, numerically sampled, or replaced.

For a residual derivative order `m` and requested flatness order `N`, use

```
J = ceil(max(m+2,
             20*(N+K_(m+1)+1+ellPrime_(m+2))/h,
             10*(N+K_m+1)/h))
```

The full exact identities give

```
beta = h*(J+1)/20 - ellPrime_(m+2)
beta - (N+K_(m+1)+1) >= h/20 > 0
rho = h*(1/5+J/10)
rho - K_m - (N+1) >= h/5 > 0
```

The velocity norm is required through order `m+1`, the cutoff error
through `m+2`, and the finite residual and its sole flat remainder through
`m`. Every supplied estimate must carry exactly the same stage root.
The fixed physical losses and the original residual decay cannot be
replaced by caller-selected values.

After fixing `J`, the scalar binder retains the actual supplied velocity,
residual and flat-error constant roots and both logarithmic powers. It
chooses the comparison neighborhood inside the unchanged common domain
and inside the first-`J` cutoff plateau. Its two logarithmic absorption
calculations target `1/2`; their internal dyadic target index `1` never
replaces the selected correction stage `J`.

The complete Cartesian Navier–Stokes difference uses `6*2^m`. The final
coefficient is the exact scalar expression

```
15*2^m*exp(-J*log(2)) + 1/2 + positiveMajorant(C_(J,m,N)).
```

Only the one fixed-stage flat remainder is added. No series of finite
flat errors is formed. Both metadata and all existing graph nodes,
parameter definitions and captured function definitions are sealed.
Independent graph extension remains possible.

## Observed validation

| Attempt | Node tests | Independent exact checks | Outcome |
|---|---:|---:|---|
| 1 | 8/8 | Checker stopped before a final count | The independent checker tried to inspect an unrelated coordinate-dependent logarithm while locating `log(2)`. Its failure record and all input bytes are preserved. |
| 2 | 8/8 | 170/170 | Passed after restricting that lookup to the exact rational operand and accounting for folded rational comparison scales. |

Attempt 2 captured 20 source files and confirmed every byte afterward.
It ran in 1.369 seconds under the fixed 60-second and 384-MiB V8 limits.
Its receipt SHA-256 is
`b3cf60061987b50335a2ff6c8e27b368e181671ffa612ef3e61e2375c43b36a3`.

The Python checker uses independent exact Fraction Laurent polynomials.
It checks the complete physical losses, two full margin identities,
integer maximum/ceiling selection, logarithmic thresholds, the retained
dyadic factor and the single flat-error coefficient. Mutation controls
reject an omitted derivative loss, omitted nonlinear factor, different
flat-error stage, changed original exponent, omitted logarithmic power
and false original-field promotion. No numerical sample of the original
`h` is used as evidence for the order inequalities.

Read-only mathematical review against source pp.112–115 found no blocking
error in the derivative orders, margin identities, constants or domain
choice. That review also confirms the following attachment requirement.

## Required actual source attachment

The exercised scalar constants and cutoff scale are declared fixtures.
An actual adapter must authenticate that the supplied `L_J` is the
`J`th value of the original monotone cutoff schedule and that every
required future increment satisfies its differentiated tail norm. It must
also supply the actual same-stage velocity, residual and flat-error
constants from the unchanged private source family.

Selecting this exact finite `J` does not construct those fields, constants,
or the complete cutoff prefix. It does not enumerate an active positive
window. Every original-field and original-criterion completion flag
therefore remains false, and the acceptance assessment remains 55/64.
