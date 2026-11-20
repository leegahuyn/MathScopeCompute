# Original FiveMap and accumulated PostFive time derivatives

The protected original FiveMap roots #22151963, #22151941 and #22151945 have conditional fixed-label normalized first-time bounds. The source potential is #22151952 and its whole weighted primitive #22151951 is zero with its original T and ZT derivatives. The original scale #17732766 is independent of radius, and both fixed positive endpoint traces are retained.

| First time derivative | Raw epsilon power | Raw band power | Log coefficient rank in H/2^128 | After joint coefficient and band debit |
| --- | ---: | ---: | ---: | ---: |
| Radial FiveMap β | 191997/100000 | 53 | 200132 | 47999/25000 |
| Swirl FiveMap v | 91997/100000 | 59 | 205515 | 22999/25000 |
| Axial FiveMap γ | 91997/100000 | 47 | 199931 | 22999/25000 |
| FiveMap potential ψ | 91997/100000 | 47 | 199938 | 22999/25000 |

The post-debit bounds are pure powers of ε on the original directed H slab. The direct positive-time fresh moment grades for P_T, Jz_T, Jθ_T and Jθ_ZT are all 99999/100000 before the coefficient debit. Their band powers are 59, 59, 47 and 53. The original matrix and bump scales also differentiate against the undifferentiated moments, which explains the lower common velocity grade.

The recipe keeps the weighted radial flux in the bulk after integration by parts. For weights 1 and R², the radial vector viscosity has zero bulk contribution and the original flat traces remove the boundary terms. Normalized Haar removes the linear centered Temporal terms. The γ_Temporal,ZT product uses the exact original divergence and weighted R/L adjoint, retaining the initialized γ_ZT branch. The quadratic Temporal products, initialization cross terms, fresh covariance W⁺ and old linear β_TT and β_ZZT terms all remain. The exact raw fresh moment calculation uses 12 direct W⁺ inputs. Including the separate low spatial swirl replay uses 36 W⁺ and 87 initialized mean inputs, with 15 preceding Temporal velocity directions. The two rows left open in the conservative 155/157 inventory, W⁺rz at RZ²T and its L² companion, lie outside this selected reduced recurrence.

The finite scalar calculation uses the original distinct angular nodes, their reciprocal gaps, three actual angular copies, the factored axial gap and two actual axial copies. The moment lower bounds, native positive a, exponents of s, a⁻¹ equal to its fixed factor times 1+η², mixed implicit-chart derivatives, and the flat bump shape all use the original C131/C106 inputs. At ZT the worst geometric coefficient has at most 409 integer bits and Renv degree 9. The radial beta formula includes its ε multiplier and the original R⁻¹ weighted forward primitive. All coefficient and band costs fit one joint 1/100000 debit without changing the source normalization.

## Accumulated increment and initialized mean

Protected accumulated PostFive roots #22153217, #22153219 and #22153221 subtract the initialized baseline #21374946, #21374947 and #21374948. The retained increment is exactly Temporal plus FiveMap. Directly summing their pre-debit majorants gives the same final three component exponents as the FiveMap rows above, with pre-debit log ranks 200132, 262197 and 199931 for radial, swirl and axial components. The initialized mean is a separate eikonal addend with normalized first-time grades 99999/50000, 49999/50000 and 49999/50000 and common pre-debit log rank 51315. The original reference-to-own derivative keeps the factor b^(-A-1) at fixed ratio b. The packet provides the two independently labeled inputs for the later eikonal calculation.

The bounds require the original admitted fixed radial charts and normalized auxiliary torus, jointly smooth source and flat endpoint realizations, and positive original matrix factors. The complete Repeat residual and final jets remain open. RELEASE HOLD.

## Reproduction

Run with the pinned previous-cycle evidence root `WORK` and repository evidence root `GOAL`. Two runs produce byte-identical receipts.

```text
python -B verify_fivemap_first_time_bound.py --work WORK --goal GOAL --out fivemap-first-time.json
```
