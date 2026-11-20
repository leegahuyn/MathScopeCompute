"""Authenticate actual FiveMap T/whole moments and narrow their mixed pressure frontier."""
from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy
from types import SimpleNamespace

p=ArgumentParser(description=__doc__)
for name in ("work","goal","source","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()
runtime=a.work/"continuation101/axial-budget/runtime/research-ide/mathscope-m3"
pins={
 "FiveMap":(runtime/"post-signed-20261023/source-signed-actual-five-map.mjs","22976ece2c801beb9e51045820749cc077ddf2c198e364f2033a53789989466d"),
 "moments":(runtime/"navier/source-global-moment.mjs","c4cb5abe7aae54393bc3ed0ce3b7a39b26ef2c36719693545adca654b15fe741"),
 "current":(runtime/"navier/source-global-current.mjs","b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36"),
 "band":(runtime/"navier/source-global-band.mjs","a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
 "mean":(runtime/"navier/source-updated-mean-pressure.mjs","6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07"),
 "eq":(runtime/"navier/source-full-mean-equations.mjs","2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76"),
 "temporal":(runtime/"navier/source-temporal-potential.mjs","c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8"),
 "C103":(a.work/"continuation103/late-mean/final/verify_late_mean_inventory.py","047bde1fe4c528c7566d9ec84a5685fe3b9220366fe66c0e8fb253ec5e36ff38"),
 "C126":(a.work/"continuation126/late-wrz-mixed-frontier/late-wrz-mixed-frontier.json","5db77c948687ee351a42ce0ac027513d6986c04e9a14b40b3ae181cf7c652f19"),
 "C130Temporal":(a.work/"continuation130/temporal-velocity-time-bound/late-temporal-velocity-T.json","13b540ce18ce8671da208ec8eeb1a363be98e428355f195399c3a9b89a5d976a"),
 "C130Covariance":(a.work/"continuation130/postsigned-covariance-final/complete-94.json","bca0ba42238e2d50913eb6d540fa4d31d3ad4cfe44c17881bc7d8c1484d555ff"),
 "C129Covariance":(a.work/"continuation129/temporal-postsigned-covariance/temporal-postsigned-covariance.json","97c245a1f59d1d35af8f843e6983be14aa3a0e3e58816bbe3f1171f0d590352d"),
 "C129Mean":(a.work/"continuation129/temporal-old-mean/temporal-old-mean.json","d5db88769a2246d6142fe6bb8102e9e8ad873233d12181e0a6278a8c54e20bbd"),
 "compact":(a.goal/"c106/high-compact-mode-one/compact-mode-one-c15.json","00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884"),
 "algebra":(a.goal/"first-force-repair/verify_repaired_first_force.py","260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75"),
}
d={}
for name,(path,want) in pins.items():
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==want,path
    d[name]=json.loads(raw) if path.suffix==".json" else raw.decode()

for key,strings in {
    "FiveMap":("source=temporal.postTemporal.updatedMeanPressure","const start=G.nodes.length,s=band.chart.s",
               "angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)]",
               "axialTarget:G.neg(targets.Jtheta)","G.substitute(G.mul(R,gammaDesired),R,r)",
               "rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))",
               "wholeIntegralAnalyticCancellationRequired:true"),
    "moments":("axialNode=G.exp(d)","axial=[G.div(r,gap),G.neg(G.div(r,G.mul(axialNode,gap)))]",
               "scale=G.exp(logScale),profile=G.div(G.substitute(eta0,x,G.div(x,scale)),scale)",
               "inQ=G.mul(g.power(s,G.neg(A)),G.substitute(profile,x,G.div(R,G.sqrt(s))))",
               "g.power(s,G.sub(G.one,A)),coefficients.axialValues[0]","G.pow(band.chart.eta,2)"),
    "band":("s=G.monotoneRoot(chartSystem,[Z,T])","X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D))"),
    "current":("innerRadius=G.sqrt(G.parameter('Xa')),outerRadius=G.mul(q(2),G.sqrt(band.chart.Xb))",
               "global-radial-envelope-fixed-in-slow-calculus"),
    "mean":("P=scalar(G,whole(haarGr)", "Jtheta=scalar(G,whole(exactNormalizedHaar(G,raw.fluxTheta,Y))",
            "Jz=scalar(G,G.sub(whole(exactNormalizedHaar(G,raw.fluxZ,Y))",
            "G.mul(G.q(1,2),whole(G.mul(G.pow(R,2),haarGr)))"),
    "eq":("G.neg(time(beta))","G.mul(epsilon,lapVector(beta))",
          "G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz)))",
          "fluxTheta=G.mul(G.pow(R,2),G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz))",
          "divergence=G.add(De(beta,1),Dz(gamma))"),
    "temporal":("zeroMeanDerivation:'The inverse has zero Haar mean for each slow point.",
                "original-T1-endpoint-and-A1","complete-meridional-incompressibility"),
}.items():
    assert all(x in d[key] for x in strings),key
assert "Xa<X0Imean, exp(5)*X0Imean<Xb, 1/2<=s<=2." in d["compact"]["cutoff"]["fixedEnvelopeAndDensitySupport"]

raw=a.source.read_bytes()
pinned_source="16ec39721dc4246515f99e5a997915db966c8d3f1a3ee244b91d1045848e1df1"
assert sha256(raw).hexdigest()==pinned_source
source=json.loads(raw)
assert source["protectedStream"]=="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
assert source["protectedRegistry"]=="e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
records={int(k):v for k,v in source["records"].items()}
native={r["id"]:r for r in source["nativeMomentsAndFields"]}
def node(n,op,args):
    assert records[n]=={"op":op,"args":args},n

R,Z,T=17732748,17732749,17732750
ell=17732737
Y=[17745430,17745431]
eps=17732744
alpha,omega=17743711,17743713
node(17732766,"actual_monotone_root",[2,Z,T])
node(17732768,"multiply",[24,17732766])
node(17732770,"multiply",[17732767,17732769])
node(alpha,"sqrt_positive",[3617])
node(3617,"source_parameter",["Xa"])
node(omega,"multiply",[24,17743712])
node(17743712,"sqrt_positive",[28826])
node(28826,"multiply",[12,28825])
assert 28826<ell<min(R,Z,T)
node(17732743,"multiply",[9,17732742])
node(eps,"exp",[17732743])
node(17732742,"log_positive",[17732740])
node(17732740,"exp",[17732739])
node(17732739,"multiply",[20,17732738])
node(17732738,"multiply",[127,ell])
slot_names=("P","Jtheta","Jz")
moment_bodies=(22151513,22151576,22151635)
moment_apps=(22151514,22151577,22151636)
for n,x,y in zip(range(1332,1335),moment_bodies,moment_apps,strict=True):
    key=f"coupled-expression:{n}"
    assert native[key]["body"]==x and native[key]["parameters"]==[ell,Z,T]
    node(y,"m3_coupled_expression_partial",[key,[ell,Z,T],[0,0,0]])
node(22151513,"definite_integral",[22151512,22151511,alpha,omega])
node(22151576,"definite_integral",[22151575,22151517,alpha,omega])
node(22151509,"definite_integral",[22151508,Y[1],0,1])
node(22151508,"definite_integral",[22151507,Y[0],0,1])
node(22151635,"add",[22151626,22151634])
node(22151626,"definite_integral",[22151625,22151580,alpha,omega])
node(22151888,"multiply",[17744708,22151514])
node(22151889,"multiply",[17744712,22151577])
node(22151890,"multiply",[17744716,22151636])
for n,x,y in ((1335,22151940,22151941),(1336,22151944,22151945),(1337,22151962,22151963)):
    key=f"coupled-expression:{n}"
    assert native[key]["body"]==x and native[key]["parameters"]==[ell,R,Z,T]
    node(y,"m3_coupled_expression_partial",[key,[ell,R,Z,T],[0,0,0,0]])
node(22151949,"multiply",[22151946,22151948])
node(22151948,"m3_coupled_expression_partial",["coupled-expression:1336",[ell,22151946,Z,T],[0,0,0,0]])
node(22151950,"definite_integral",[22151949,22151946,alpha,R])
node(22151951,"definite_integral",[22151949,22151946,alpha,omega])
node(22151952,"multiply",[17733137,22151950])
node(22151956,"multiply",[17733137,22151955])
node(22151955,"add",[22151950,22151954])
node(22151953,"multiply",[17743734,22151951])
node(22151957,"m3_coupled_expression_partial",["coupled-expression:1336",[ell,22151946,Z,T],[0,0,1,0]])
node(22151959,"definite_integral",[22151958,22151946,alpha,R])
node(22151961,"multiply",[eps,22151960])
node(22151962,"multiply",[20,22151961])
node(22151944,"add",[22151942,22151943])
node(22151942,"multiply",[17744839,22151921])
node(22151943,"multiply",[17744867,22151923])
node(22151921,"multiply",[17744805,22151920])
node(22151923,"multiply",[20,22151922])
node(22151922,"multiply",[17744808,22151920])
node(17744805,"inverse",[17744802])
node(17744808,"inverse",[17744807])
node(17744807,"multiply",[71672,17744802])
node(20,"rational",["-1","1"])
node(71672,"exp",[4708])
node(17732771,"log_positive",[17732766])
node(17732887,"multiply",[281,17732771])
node(17732888,"exp",[17732887])
node(17743688,"sqrt_positive",[17732766])
node(17744826,"inverse",[17743688])
node(17744827,"multiply",[R,17744826])
node(17744837,"smooth_piecewise",[17744830,0,1,0,17744836,0])
node(17744838,"multiply",[17744653,17744837])
node(17744839,"multiply",[17732888,17744838])
node(17744840,"inverse",[71672])
node(17744854,"multiply",[17744827,17744840])
node(17744855,"multiply",[17744653,17744854])
node(17744864,"smooth_piecewise",[17744857,0,1,0,17744863,0])
node(17744865,"multiply",[17744653,17744864])
node(17744866,"multiply",[17744840,17744865])
node(17744867,"multiply",[17732888,17744866])
node(22151964,"add",[22151019,22151963])
node(22151965,"add",[22151020,22151941])
node(22151966,"add",[22151021,22151945])
def exact_node(n):
    # The shared source target and denominator are the same algebraic
    # atom on both copies. Keep them symbolic while proving the zero row.
    if n in (22151920,71672,17744802):
        return "analytic_atom",[]
    row=records[n]
    return row["op"],row["args"]
E=runpy.run_path(str(pins["algebra"][0]))["Exact"](SimpleNamespace(node=exact_node))
p0,p1,z=map(E.of,(22151921,22151923,71672))
assert p0 and p1 and E.add(p0,E.mul(z,p1))==E.zero
assert E.add(p0,p1)!=E.zero
assert Q(1)+2*Q(2,5)+2*Q(1,10)==2
assert d["C126"]["originalGraph"]["pressureZ"]==22031648
assert d["C126"]["originalGraph"]["WplusRz"]==22031219
assert d["C126"]["originalGraph"]["fixedEndpoints"]==[alpha,omega]
assert d["C130Covariance"]["completeCount"]==94 and d["C130Covariance"]["stillOpen"]==[]
assert d["C130Temporal"]["actualSource"]["potential"]==22150943

# Reuse the complete C103 source recipe for each lower Temporal operand.
# The weighted-moment substitutions below change the top requests only.
original=d["C103"]
i=original.index("def demand():")
j=original.index("    spatial_psi=",i)
selected=original[i:j].replace("def demand():","def selected(outputs,directOld,directW):",1)
tail='''    for field, orders in outputs.items():
        for a in orders:
            for b in suborders(a):
                calc(field,b)
    for field,a in directOld:
        old.update((field,b) for b in suborders(a))
    for field,a in directW:
        wave.update((field,b) for b in suborders(a))
    return {"W":sorted(wave),"old":sorted(old),"primitives":sorted(primitive),"centeredForcings":sorted(forcings)}
'''
program={}
exec(compile(original[:i]+selected+tail,"pinned_source_c103","exec"),program)
t,zt,z0=(0,0,1,0),(0,1,1,0),(0,1,0,0)
r0,l0=(1,0,0,0),(0,0,0,1)
direct_press=[("rr",t),("thetatheta",t),("rz",zt),("zz",t)]
pressure_rows=program["selected"](
    {"betaLate":[zt,r0,l0],"gammaLate":[t,z0],"vLate":[t]},
    [("beta",(0,0,2,0)),("beta",(0,2,1,0)),("beta",r0),("beta",l0),
     ("gamma",zt),("v",t)],
    direct_press)
theta_rows=program["selected"](
    {"betaLate":[t],"gammaLate":[t,z0],"vLate":[zt,r0,l0]},
    [("beta",t),("gamma",zt),("v",zt),("v",r0),("v",l0)],
    [("thetaz",zt)])
rows={item:pressure_rows["W"] for item in ("P_T","Jz_T")}
rows["Jtheta_ZT"]=theta_rows["W"]
Wnew=set(pressure_rows["W"])|set(theta_rows["W"])
oldnew=set(pressure_rows["old"])|set(theta_rows["old"])
assert max(a0[1] for _,a0 in Wnew)==4
assert {x for x in Wnew if x[0]=="rz" and x[1][1:3]==(4,1)}=={("rz",(0,4,1,0)),("rz",(0,4,1,2))}
assert max(a0[1] for _,a0 in theta_rows["W"])<=3
assert all(x in oldnew for x in (("beta",(0,0,2,0)),("beta",(0,2,1,0))))
known_w={(n,tuple(q)) for n,q in d["C129Covariance"]["previouslyAttached"]}
known_w|={(x["tensor"],tuple(x["RZTL"])) for x in d["C129Covariance"]["newlyAttached"]+d["C130Covariance"]["newlyAttached"]}
known_old={(row["field"],tuple(row["RZTL"])) for row in d["C129Mean"]["originalDirectionTable"]["middle"]}
assert len(known_w)==94 and len(known_old)==172
primitive=set(pressure_rows["primitives"])|set(theta_rows["primitives"])
cutoff={(i0,j0,k0) for _,(r,z,t,l) in primitive for i0,j0,k0 in product(range(r+2),range(z+1),range(t+1))}
assert (0,0,1) in cutoff and (0,1,1) in cutoff

# Weighted radial terms. The positive endpoints are kept in the proof.
weights={}
for power in (0,2):
    assert power*(power-1)-power==0
    weights[str(power)]={"radialFluxWeightInBulk":f"{power-1} R^{power-1}",
                         "radialViscosityBulk":0,
                         "weightedD1Adjoint":f"R^{power} (partial_R+a L) + {power-1} R^{power-1}"}
# Nonzero generic control through the two original translated FTCs.
def mul(f,g):
    p=defaultdict(Q)
    for i,u in f.items():
        for j,v in g.items():
            p[i+j]+=u*v
    return p
def integral(f,e=0):
    return sum((v*Q(3**(k+e+1)-1,k+e+1) for k,v in f.items()),Q(0))
x=mul({2:1,1:-2,0:1},{2:1,1:-6,0:9})
v=mul(x,{k:(k+1)*c for k,c in x.items()})
square=mul(x,x)
p_test=integral(v)/2
j_test=-integral(v,2)/4
assert p_test==integral(square)/4==Q(64,315)
assert j_test==integral(square,2)/8==Q(32,77)

out={"schema":"MathScope.C131.OriginalPostTemporalFiveMapVelocityT/1",
 "status":"VERIFIED_EXACT_PROTECTED_SOURCE_CONDITIONAL_ORIGINAL_SMOOTH_FLAT_PROFILES",
 "pins":{**{k:h for k,(_,h) in pins.items()},"protectedFiveMapSlice":pinned_source},
 "graph":{"sourceStream":source["protectedStream"],"activeRegistry":source["protectedRegistry"],
          "increments":{"beta":22151963,"v":22151941,"gamma":22151945},"postFive":{"beta":22151964,"v":22151965,"gamma":22151966},
          "potential":22151952,"compactPotential":22151956,"primitive":22151950,"whole":22151951,
          "nativeScale":17732766,"fixedEndpoints":[alpha,omega],"freshMomentBodies":dict(zip(slot_names,moment_bodies)),
          "freshMomentApplications":dict(zip(slot_names,moment_apps))},
 "normalizedFixedLabelT":{"beta":"-epsilon/R * integral_alpha^R r gamma_F,ZT dr","v":"partial_T of three actual P,Jz-dependent bump copies",
                          "gamma":"partial_T of two actual Jtheta-dependent bump copies",
                          "vAndGammaL":0,"betaAndPsiL":0,
                          "physicalTimeUnit":"original normalized derivative preserves the fixed reference-to-own b^(-A-1) factor"},
 "wholeAxialCancellation":{"identity":"s^(1-A)*mu3*(c0+exp(d)*c1)=0","nativeCoefficients":[22151921,22151923],
            "axisScale":71672,"radialDependencyOfS":False,"wholeT":0,"wholeZT":0,
            "support":"Original positive bump copies satisfy Xa < X0Imean < X < exp(2)X0Imean < Xb and 1/2 <= s <= 2, hence remain strictly inside both fixed radial ends. Shape cutoffs are flat before extending zero."},
 "freshMoments":{"required":{"P":["P","P_T"],"Jz":["Jz","Jz_T"],"Jtheta":["Jtheta","Jtheta_Z","Jtheta_T","Jtheta_ZT"]},
   "oldInitializedBetaSurvivingLinear":["beta_TT","beta_ZZT"],
   "zeroTemporalLinear":"Haar of the centered inverse and its shifted T1 is zero, including ordinary derivatives. Accordingly -time(beta_Temporal) and epsilon lapVector(beta_Temporal) contribute zero.",
   "weightedRadialFTC":weights,
   "gamma_ZTTransfer":"Using eps gamma_Temporal,ZT=-D1 beta_Temporal,T, move D1 onto R^w times the factor using normalized periodic Haar. The boundary is -[R^w Haar(f beta_Temporal,T)]/eps and vanishes on both original flat traces. For Jtheta the factor is V+v; for the mixed pressure flux it is b+beta. The initialized gamma_ZT is retained explicitly.",
   "directCovariance":{"P_and_Jz":direct_press,"Jtheta":[["thetaz",zt]]}},
 "exactTemporalPressureFrontier":{"source":22031648,"Wrz":22031219,
   "highestZWithTime":[["rz",[0,4,1,0]],["rz",[0,4,1,2]]],
   "reason":"The surviving beta_Temporal,ZT*gamma term has psi_Temporal,ZZT, hence the twice differentiated axial W_rz pressure density. No separate P_ZT or Jz_ZT occurs for FiveMap first T. The L2 companion comes from the selected Fourier estimate.",
   "genericNonzeroControl":{"P_T_over_epsilon2":str(p_test),"Jz_T_over_epsilon2":str(j_test),
      "method":"Smooth compact f and a normalized co-moving cosine. Perturb W_rz by Z^4 (T-T0)/24 times (ci/epsilon^2) Dr(R^-1 Dr(R^2 f)) N(h). Exact translated FTC at both primitives gives delta psi_ZZT=R f h. The printed finite polynomial example is only a check of the signed rational factors."}},
 "sourceRequestCensus":{"Wplus":sorted(Wnew),"initializedMean":sorted(oldnew),"fixedCutoff":sorted(cutoff),
      "shiftedPrimitives":sorted(primitive),"PAndJz":pressure_rows,"Jtheta":theta_rows,
      "WplusOutsideC130":sorted(Wnew-known_w),"initializedMeanOutsideC129":sorted(oldnew-known_old)},
 "scope":"Protected identities and a sufficient pinned source request set. Requires smooth admitted original chart and flat guards, quantitative v_ZT and beta_ZT bounds, positive original matrix factors and their differentiated coefficient geometry for any new whole-velocity norm.",
 "finalJets":0,"release":"HOLD"}
a.out.write_bytes((json.dumps(out,indent=2,sort_keys=True)+"\n").encode())
print("PASS original FiveMap T, whole axial zero, retained Z4T pair; source W+ requests",len(Wnew),"outside C130",len(Wnew-known_w),"old",len(oldnew),"outside C129",len(oldnew-known_old))
