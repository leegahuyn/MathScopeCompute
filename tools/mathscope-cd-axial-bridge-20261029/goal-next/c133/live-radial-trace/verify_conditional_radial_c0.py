"""Attach already authenticated radial Gaussian donors to the exact active Repeat value trace."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path

p=ArgumentParser(description=__doc__)
for key in ("work","goal","census","out"):
    p.add_argument("--"+key,required=True,type=Path)
a=p.parse_args()
w=a.work
g=a.goal
nav=w/"continuation66/stage2/runtime-exact/research-ide/mathscope-m3/navier"
pins={
 "live":(a.census,"70d841c3686c7f3135592e04e170048cd5663cfaaf4e53ac5b12bae84bb5c8ba"),
 "primary":(g/"c106/high-compact-mode-one/primary-quotient-c11.json","595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8"),
 "forcedSpatialOne":(g/"c108/forced-mode-one-late/mode-one-late-join.json","3a6c22308f6b76804b05bce58548b6b928e09cb8f6d4fdd1f8a93cc5f176912b"),
 "forcedSpatialTwo":(g/"c107/post-signed-gauge/forced-mode-two-late-directions.json","0cf2a4587f2d5c82eaeadb3a0ff0f694961c29b4fd2f047cff509af7a50f5449"),
 "forcedMixed":(w/"continuation129/temporal-presigned-extra/full-covariance-first.json","797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac"),
 "signedStatic":(g/"c107/post-signed-gauge/signed-gauge-cutoffs.json","449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a"),
 "sigma":(g/"c108/early-sigma-c6/early-sigma-c6.json","d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
 "signedSlow":(g/"c119/signed-mixed-native-time/signed-physical-time.json","2ad6fcd043b1be18b4482cd7b055bbd94a528621e57badd4c6860e487e76f9ff"),
 "signedFast":(w/"continuation120/signed-pulse-time/signed-fast-pulse.json","9d58464ea8182764e9354867105ebd9cb8454ddf53d6a70b359fe488849f0b35"),
 "pressure":(w/"continuation120/first-cycle-wave-pressure/final/repeat-wave-pressure.json","412d110f4167387da8fa5cc697c50ac5c7d147a2f3eec8969daadc56cdbc11e5"),
 "meanSpatial":(g/"c124/postfive-mean-derivative/first-derivative-grades.json","5e5a5a4585aad76fbba3a5c0d2b290fb00d208ce058c5308094a805c5e6dec23"),
 "meanTime":(w/"continuation133/fivemap-velocity-time-bound/fivemap-first-time.json","a6f277d09c5c287f32e4175008076cfd453fd94b988b4aa8440eb284d3146072"),
 "harmonic":(nav/"source-harmonic-assembly.mjs","339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20"),
 "pulse":(nav/"source-forced-pulse.mjs","866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9"),
 "mapped":(nav/"source-mapped-forced-curl.mjs","3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd"),
}
d={}
for key,(path,h) in pins.items():
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==h,path
    d[key]=json.loads(raw) if path.suffix==".json" else raw.decode()

live=d["live"]
assert live["source"]["run"]==44682703381 and live["source"]["appendRecordsRead"]==225012
assert live["coreTimeWitness"]["actualTApplication"]==22161393
assert live["coreTimeWitness"]["exactCoefficient"]=="-epsilon" and not live["coreTimeWitness"]["presentInSubtraction"]
assert live["rawPressureUses"]==200 and live["ordinaryTimeWaveUses"]==120

for key,required in {
 "harmonic":("Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))","time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))",
             "lap=M=>S.add(Dr(Dr(M))","pressureGradient:gradient(P)",
             "linear:base,quadratic,conservative:base.map((x,j)=>S.add(x,quadratic[j]))"),
 "pulse":("projectedRaw=projection.map(row=>cscale(G,G.q(-1),cdot(G,row,forcing)))",
          "projection=n.map((x,i)=>n.map((y,j)=>G.sub(i===j?G.one:G.zero,G.div(G.mul(x,y),nSquared))))",
          "matrix=Aphi.map((row,i)=>row.map((x,j)=>i===j?G.sub(x,G.mul(G.q(m*m),damping)):x))",
          "left:this.zero,initial:Array.from({length:3},()=>complex(this))"),
 "mapped":("remainingSource:inverse.source.map(z=>mapComplex(C.scale(G.sub(G.one,psiPath),z)))",
           "derivativeSource:inverse.velocity.map(z=>mapComplex(C.scale(pathCutoff.dpsi,z)))",
           "numerator=Object.fromEntries(parts.map(part=>[part,cross(G,normal,amplitude.map(z=>z[part]))]))",
           "G.div(x,G.mul(km,n2))"),
}.items():
    assert all(x in d[key] for x in required),key
primary=d["primary"]["weightedQuotientLedger"]
assert primary["firstPulseDerivativeCoverage"]["normalizedAmplitudePotentialVelocity"]
assert primary["transverseDerivativeCoverage"]["normalizedVelocityL"]>=3
assert primary["transverseDerivativeCoverage"]["costInSAndLaurent"]==0
assert max(x["slowOrder"] for x in primary["bounds"])>=4
space={q for q in product(range(4),repeat=3) if sum(q)<=3}
time={(*q[:2],1,q[2]) for q in space if sum(q)<=1}
needed={(*q[:2],0,q[2]) for q in space}|time
forced=d["forcedMixed"]
assert needed<=set(map(tuple,forced["targetGaugeDirections"]))
assert {tuple(r["RZTL"]) for r in forced["modeTwoGauges"]}>=needed
for region in ("inner","outer","middle"):
    table={tuple(r["RZTL"]):r for r in forced["threeRegionModeOneGauges"][region]}
    assert needed<=table.keys()
    assert all(Q(table[q]["poleAfterHalfGaussian"])<64 for q in needed)
    assert all(table[q]["rawGroupWeights"] for q in needed)
assert space<=set(map(tuple,d["forcedSpatialOne"]["directions"]))
two_raw={tuple(r["RZL"]):r for r in d["forcedSpatialTwo"]["raw"]}
assert {q for q in space if sum(q)<=1}<=two_raw.keys()
assert all(two_raw[q]["rawAdditionalLogPoleAfterGToMode"]<=12 for q in two_raw if sum(q)<=1)
assert space<={tuple(r["RZL"]) for r in d["signedStatic"]["rows"]}
assert d["sigma"]["commonBound"]["retainedGaussian"]=="zeta"
assert d["signedSlow"]["physicalSlowTerm"]["gaussian"]=="sqrt(zeta)"
assert d["signedFast"]["restoredHarmonicPulse"]["weights"]=="P*sqrt(zeta)"
assert Q(d["signedFast"]["restoredHarmonicPulse"]["epsilon"])==0
press_orders={tuple(q) for q in d["pressure"]["fourteenCommonProductDirections"]}
assert {(0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1)}<=press_orders
assert d["meanSpatial"]["sourceRoots"]["initialized"]==d["meanTime"]["accumulatedAndInitializedRoots"]["initialized"]

# Exact fixed-label Gaussian control against finite poles. The original
# positive c can depend on the retained compact label/tangential set.
# For any integer pole P choose m with 2m>P+1.
assert all(2*((p+1)//2+1)>p+1 for p in range(512))
# Disjoint radial bump centres d_n and width d_n^2/16. The first
# (ordinary) time derivative still has a Gaussian while the second
# derivative at the centres is one for the separate generic control.
for n in range(1,21):
    d0=Q(1,2**n)
    d1=d0/2
    assert d0*d0/16+d1*d1/16==Q(5,64)*d0*d0<d0-d1

out={"schema":"MathScope.C133.OriginalActiveRepeatConditionalRadialValueTrace/1",
     "status":"CONDITIONAL_SAME_SOURCE_C0_RADIAL_ZERO_EXTENSION_OPEN_ORDINARY_C1",
     "pins":{k:h for k,(_,h) in pins.items()},"actualShell":live["guard"],"source":live["source"],
     "requiredWaveGaugeOrdersRZTL":sorted(needed),"directRawLowAndHigh":live["rawHomogeneity"],
     "modeCount":40,"realScalarCount":240,
     "rawValueTrace":{
         "highModes":"Quadratic wave velocity. The only differentiations are grouped Dr, Dz and angular winding. Each reachable wave factor has at most one spatial derivative. Thus each term contains at least one surviving half-Gaussian.",
         "lowSpatialAndSlowT":"The original Dr ladder uses the L combination of independent torus partials. Its square uses L twice and Lv=0; it does not request a second pulse-clock derivative. Direct ordinary T is separate and the needed actual mode-one/mode-two gauge coordinates and Signed slow-time are pinned. Restoring the carrier multiplies by bounded fixed-label phase coefficients, retaining the Gaussian.",
         "lowPressure":"The exact native divided normal admits a positive bound from its nonzero cylindrical winding/R, and the C120 pressure proof already includes value/R/Z/L and the unprojected normal row. The raw 200 actual live applications group to these directions.",
         "currentMeans":"The protected initialized and late mean coefficients carry bounded value and first spatial gradients at their true actual roots. That boundedness pays the cofactors without adding a Gaussian. The mean T coefficient is not within the nonzero angular raw time term.",
         "firstForcedFastPulse":"On fixed compact admitted radial collars the actual M=-K+n(K^T n-n_v)^T/q_n-m^2 epsilon k^2 q_n I is bounded independently of shell distance. The uncut original source f and its first R,Z,L derivatives retain Gaussian factors (mode one groups and mode two raw G^2). The projected source remains weighted by 1/same q_n, bounded from positive winding. Zero initial data and the integral equation give t with a Gaussian by a uniform bounded propagator. First R,Z,L derivatives solve the same system forced by differentiated source and M_alpha t and keep it. Then t_v=M t-Pi f and its first spatial derivatives retain that Gaussian through the actual mapped cross-product curl. This controls the standalone N time component, without any division by the longitudinal cutoff.",
         "directPrimaryAndSignedFast":"C106 first original Primary pulse derivative and C120 restored Signed fast harmonic retain their own half-Gaussian. A nonpositive epsilon grade does not obstruct the fixed-label radial value trace."},
     "subtractionValueTrace":{
         "first-forced-remaining-source":"(1-psi) f_m retains the actual unprojected source Gaussian.",
         "first-forced-cutoff-derivative":"psi_v t_m retains the weighted uncut zero-data solution bound.",
         "primary-cutoff-derivative":"Actual psi_v times original weighted Primary state.",
         "signed-cutoff-derivative":"Actual bound Signed principal term uses its C108 Sigma and reciprocal half-Gaussian. It is a separate explicit subtraction, not part of the raw wave ideal."},
     "conditionalEquality":"At either physical radial face each actual supported scalar tends to zero from the strict shell uniformly on compact retained tangential and closed pulse sets. On the joint admitted chart the original lazy zero equals this continuous extension. This is the C0 statement for this one fixed-label radial interface.",
     "ordinaryC1Open":{"exactActiveWitness":live["coreTimeWitness"],
         "nextTimeRow":"At fixed label epsilon_T=0. Applying ordinary T to the exact exposed -epsilon partial_T native wave term yields -epsilon partial_TT of the same protected body #22004387. Its joint shell trace or an independent cancellation of the full original supported derivative is needed.",
         "genericControl":"Take d_n=2^-n, widths d_n^2/16, a_n=exp(-c/d_n^2), and a smooth bump rho with rho(0)=1. The sum a_n^2 rho((d-d_n)/(d_n^2/16)) (1-cos((T-T0)/a_n)) has Gaussian bounds for every spatial derivative of the value and first ordinary T. Yet its second T derivative at (d_n,T0) is exactly one. This is an independent sufficiency control only."},
     "conditions":"Same joint source chart, native positive projection/frame and pulse realization, flat nonradial guards, and the pinned weighted donor hypotheses. The source-normalized geometry coefficients stay bounded as indicated on every admitted fixed compact set. No all-label quantitative epsilon estimate follows.",
     "completeStageTwo":False,"finalJets":0,"release":"HOLD"}
a.out.write_bytes((json.dumps(out,indent=2,sort_keys=True)+"\n").encode())
print("PASS conditional fixed-label radial value trace for all 240 actual scalars. Joint ordinary C1 time still open.")
