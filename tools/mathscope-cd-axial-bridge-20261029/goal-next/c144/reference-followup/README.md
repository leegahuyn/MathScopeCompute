# Repeat covariance and shifted mean pressure refresh

The Repeat increment has no zero **physical angular** mode. The PostFive
mean velocity, background and original stress therefore remain the same
during this angular substep. The angular covariance of the entire field
changes, which in turn changes the mean pressure and all three radial
defects. Adding only the four newly indexed angular velocity and pressure
roots would omit this pressure change.

## Complete covariance increment

Within each signed row use $o_m$ for the existing PostFive wave, which
has modes $m=\pm1,\pm2$, and $u_m$ for the new Repeat wave, which has
modes $m=\pm1,\pm2,\pm3,\pm4$. Each amplitude has three velocity
components. Terms outside these inventories are zero. The mean change is

\[
 \Delta W_{ij}
 =\sum_{m\ne0}\left(
 o_{m,i}\,u_{-m,j}+u_{m,i}\,o_{-m,j}+u_{m,i}\,u_{-m,j}
 \right).
\]

Both mixed terms survive. Modes 3 and 4 contribute to the last term
even though they have no predecessor partners. The routine checks the
displayed expansion for all six components against the original exact
angular covariance operator applied to $o+u$ and to $o$. The angular
zero mode uses every conjugate pair and retains all auxiliary torus
dependence. Summing those six local changes over all original signed rows
gives the whole change when the support and original palette premises
of C143 give zero cross-row products. The registration uses the source
`completeSourceField` with the covariance scale $2A$. Its row slots
and derivative maps are checked against the velocity intermediary after
omitting exactly the angular slot and direction.

## Mean refresh with fixed source geometry

Write $D^e=D_r+e/R$ and let the overline mean normalized Haar average in
the two auxiliary coordinates. With identical mean velocity, background,
stress and geometry before and after Repeat, the original equations give

\[
\begin{aligned}
 f&=\Delta g_r=-D^1\Delta W_{rr}-D_z\Delta W_{rz}
       +\Delta W_{\theta\theta}/R,\\
 \Delta P&=\int_{R_-}^{R_+}\overline f\,dR,\\
 \Delta J_\theta&=\int_{R_-}^{R_+} R^2\overline{\Delta W_{\theta z}}\,dR,\\
 \Delta J_z&=\int_{R_-}^{R_+}R\overline{\Delta W_{zz}}\,dR
             -\tfrac12\int_{R_-}^{R_+}R^2\overline f\,dR.
\end{aligned}
\]

The true pressure difference is $T_0(f-\rho\Delta P)$. Here $T_0$
means the original translated partial radial integral from $R_-$ to
$R$, minus $\chi$ times the translated whole integral from $R_-$
to $R_+$. Both evaluate their integrands on the radial path with
auxiliary displacement $(\Phi(r)-\Phi(R))v_r$. By linearity this is
the difference of the two complete original mean pressure integrals, on
their common domain of integrable operands. There is no projection of
$f$ inside $T_0$. The auxiliary average appears only in the defects.
The original $\chi_R$ cutoff remainder, both slow-$Z$ endpoint terms
and the pressure contribution $\epsilon\partial_Z\Delta p$ to the
axial source are retained. Haar cancellation of a whole integral does
not set the pointwise translated whole integral to zero.

The adapter calls the original full mean reconstruction with zero for the
**increments** of the unchanged mean, background and stress, so the
covariance change passes through the actual production calculus. The
physical output retains the full PostFive velocity and pressure and adds
the three angular velocity increments, the angular pressure increment and
this mean pressure difference. The old radial defects are likewise added
to their changes. All covariance frames, radial endpoints, original
stress and mean inputs of the old physical field are preserved.

## Execution and status

`buildLiveRepeatMeanRefresh` is an in-process handoff adapter. Run it
after the C135 live registration, using the same sealed PostFive object,
the intact Repeat result and the just-attached four original fields.
Pass the native functions named in the adapter from the original runtime.
The original private `completeSourceField` accessor must be the same
one used by the registration handoff. No JSON hydration of a production
graph is used.

The reproducible fixture loads the pinned native operator modules and
executes the covariance expansion, the original shifted pressure kernel
and the exact derivatives on synthetic inputs. It checks independent
integer values for all six complex covariance components and compares
all five raw differential quantities against two complete original mean
PDE evaluations at identical nonzero mean, background and stress.
The radial fixture uses a nonzero fast variable in the source, so the
shift actually changes an auxiliary coordinate. It retains the cutoff
remainder as a nonzero graph expression. A missing conjugate row is
rejected.

**VERIFIED** for the native operator fixture. **CONDITIONAL** for the
whole original covariance projection under the C143 support assumptions.
**OPEN** for execution on the live original graph. At readback, GitHub
run 44698543085 was still building and had not emitted the registration
artifact. The present packet does not certify the unguarded original
Repeat field, global derivative closure, or the full updated PDE.
Final jets remain 0/67 and release stays on HOLD.

Run from the workspace root with the pinned native runtime:

    node work/goal-next/continuation144/reference-followup/test_repeat_mean_refresh.mjs work/goal-next/continuation66/stage2/runtime-exact/research-ide
