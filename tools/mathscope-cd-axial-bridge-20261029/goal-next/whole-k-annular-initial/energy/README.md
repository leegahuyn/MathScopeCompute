# Energy and force intervals on the original initialized moving annulus

The physical domain uses the original `Xa <= X <= Xb`,
`(z/z0)^2 <= 1/2`, `1/2 <= rho <= 1` and all physical angles. The annulus is
inside the outer radial plateau. Write `zeta=z/z0`, `u=sqrt(2)*zeta`,
`v=(X-Xa)/(Xb-Xa)`, and `Q=q/tau0`.
For fixed zeta and rho, `r dr=q dX`. After the angle integral, the
normalized measure in `(v,u,rho)` is

    sqrt(2)*pi*tau0*(Xb-Xa) * Q dv du d rho.

The original relation is `Q=rho+(u^2/2) Q^(2h)`. Its physical solution
lies in `[1/2,2)`. Indeed, `Q-(u^2/2)Q^(2h)` is strictly increasing for
`Q>=1/2`, has value at most rho at `Q=rho`, and has value above one at
`Q=2`. Use `0<h<1/64` and `1/2<log(2)<1` to obtain
`1-2h <= Q^(2h) <= 1+4h`. Thus every cell measure, divided by the
common factor, lies in `[J-2h B,J+4h B]`, where
`J=integral(rho+u^2/2)` and `B=integral(u^2/2)` on the cell.
Both are exact rational polynomials in cell endpoints. At the final
slice their totals are `4/3,1/3` and on the full slab they are
`11/12,1/6`. Every subdivision preserves these pairs exactly, both for
space-only and time-only refinement. Pi uses a directed Machin bracket.

The numerical replay uses the 16 original localized initialized field bounds.
It computes end kinetic energy, transverse and axial dissipation at
`nu=1`, signed work, force square in spacetime, and the squared force
`L1_rho L2_x` norm. The last bound uses Cauchy–Schwarz on the
length-`1/2` time interval. The starting slice is exactly zero by the
13 cutoff derivatives at `rho=1`. The normalized variables are
`U=tau0^A u_phys` and `F=tau0^(A+1) f_phys`. Physical time is
increasing with decreasing rho, and the integrals reverse those limits.

The two moving radial faces `r_i=sqrt(2 q X_i)` have area cofactors
`±r_i(e_r-r_{i,z}e_z) dtheta dz`. Differentiating the original q relation
gives `r_{i,z}=r_i eta q^(-D)/(1-2h eta^2)` and
`r_{i,t}=-r_i/[2q(1-2h eta^2)]`. If `R=sqrt(4 tau0 Xb)`, the
replay uses `|r_{i,z}|<=4R/z0` and `|r_{i,t}|<=2R/tau0`.
It encloses the integrated diffusion, advection-plus-pressure, and
moving boundary flux terms with absolute upper endpoints. The fixed
axial faces have exact zero flux from the flat outer cutoff. The
common normalization of the radial flux is `tau0^(2A+1)` times the
area cofactor integrated in angle, zeta and rho.

The current field bounds are uniform, so refining the cell measure
alone preserves the result. These coarse finite upper endpoints do
not produce an observed energy defect or a refinement comparison.
An actual final-field replay must supply the active corrections and
enclose the integrands separately in each cell. N7-06 and N8-05 remain
OPEN, final jets remain 0/67, and release remains HOLD.

See the checkpoint replay instructions for source paths and commands.
