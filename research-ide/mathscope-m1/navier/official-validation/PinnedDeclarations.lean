import NavierStokes.ComparatorSolution

/- Audit entry only. The imported official source and its statements are unchanged. -/
#check @NavierStokes.Comparator.navier_stokes_breakdown_R3
#check @NavierStokes.Comparator.navier_stokes_breakdown_periodic
#print axioms NavierStokes.Comparator.navier_stokes_breakdown_R3
#print axioms NavierStokes.Comparator.navier_stokes_breakdown_periodic

set_option pp.all true in
#check @NavierStokes.Comparator.navier_stokes_breakdown_R3

set_option pp.all true in
#check @NavierStokes.Comparator.navier_stokes_breakdown_periodic
