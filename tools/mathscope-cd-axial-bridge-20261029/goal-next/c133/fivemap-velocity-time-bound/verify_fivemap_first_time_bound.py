"""Quantitatively evaluate the exact first-T native FiveMap moment and bump route."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import inspect
from itertools import product
import json
from pathlib import Path
import runpy

p=ArgumentParser(description=__doc__)
for name in ("work","goal","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()
w=a.work
g=a.goal
stage=g/"primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget"
pins={
 "postFiveTransport":(w/"continuation122/repeat-postfive-mean/postfive-mean-transport.json","b2eca297bde1beb0f736818ad3722341e160bfe7df47dab7dac9afbb422ee176"),
 "fiveNative":(w/"continuation131/fivemap-velocity-time/fivemap-velocity-time.json","f91e6c15292c6970a95de7141d109e18ee5c0b57056e4a635faa6f23c9adddf7"),
 "postSignedCandidate":(w/"continuation132/fivemap-wave-coverage-update/updated.json","647fd7960db358ccbb32102380ced87bec492d31379c8b9fa76c997b6a86884d"),
 "temporalT":(w/"continuation130/temporal-velocity-time-bound/late-temporal-velocity-T.json","13b540ce18ce8671da208ec8eeb1a363be98e428355f195399c3a9b89a5d976a"),
 "swirlT":(w/"continuation127/late-temporal-swirl-T/late-temporal-swirl-T.json","dabc398f8bbd002c1ab534dbd430123b2a83a65ff1ea72c1e45fbaf5b1af7d6c"),
 "temporalZT":(w/"continuation132/temporal-mixed-fivemap/mixed-temporal-bound.json","800bc8a398af0d57504eafc205e8fbd6a79b31537de1d2fbf619bc6e4a8ec7d4"),
 "initialized":(w/"continuation132/fivemap-old-mean/fivemap-old-mean.json","1b8ddd4ce8b5006d96835b13ba892157b7fee7aef647d64306f96359abfea9bf"),
 "momentTwoRows":(w/"continuation132/fivemap-wave-coverage/two-caps.json","6d2831b942253b834b1556525ef7fa78f77db975ada3671eaeefd29a2d45702a"),
 "cov129":(w/"continuation129/temporal-postsigned-covariance/temporal-postsigned-covariance.json","97c245a1f59d1d35af8f843e6983be14aa3a0e3e58816bbe3f1171f0d590352d"),
 "cov130":(w/"continuation130/postsigned-covariance-final/complete-94.json","bca0ba42238e2d50913eb6d540fa4d31d3ad4cfe44c17881bc7d8c1484d555ff"),
 "swirlMixedEight":(w/"continuation132/fivemap-vzt-wave/vzt-covariance-eight.json","443b4a53c861882707c1e533a33f59c8dbd84e1f5380e33cb93d080dcdd399c4"),
 "sixPressureRows":(w/"continuation132/fivemap-wave-coverage/six-caps.json","e012bfd8ba80a42408adb4f1b882147d12adfddb0b4b437e3c613436ae8fb6a6"),
 "spatialOps":(g/"c105/late-grade/verify_late_grade.py","b7df296fa485ae391e0d53762e58c6a9eb469f53842083acb5189e220d81c4cc"),
 "spatial":(g/"c105/late-grade/late-grade.json","d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef"),
 "spatialBoundJoin":(g/"c108/first-k1-energy/k1-donor-join.json","8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59"),
 "C106Chart":(g/"c106/high-compact-mode-one/compact-mode-one-c15.json","00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884"),
 "matrixFactors":(stage/"after-temporal-five-map/after-temporal-five-map.json","3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102"),
 "nativeMeanGeometry":(stage/"native-mean-pressure/verify_mean_pressure_enclosure.py","f0fffd5c57aec9344487524e27ecefeef53ea91237269ad30b45d97109729650"),
}
d={}
for k,(path,h) in pins.items():
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==h,path
    d[k]=runpy.run_path(str(path)) if path.suffix==".py" else json.loads(raw)

five=d["fiveNative"]
roots=five["graph"]
assert roots["increments"]=={"beta":22151963,"v":22151941,"gamma":22151945}
assert roots["potential"]==22151952 and roots["whole"]==22151951
assert roots["fixedEndpoints"]==[17743711,17743713] and roots["nativeScale"]==17732766
assert five["wholeAxialCancellation"]["wholeT"]==five["wholeAxialCancellation"]["wholeZT"]==0
assert five["freshMoments"]["required"]=={"P":["P","P_T"],"Jz":["Jz","Jz_T"],"Jtheta":["Jtheta","Jtheta_Z","Jtheta_T","Jtheta_ZT"]}
assert d["temporalT"]["actualSource"]["potential"]==22150943==d["temporalZT"]["originalRoots"]["betaPotential"]
assert d["temporalZT"]["originalRoots"]["v"]==d["swirlT"]["roots"]["actualTemporalSwirl"]==22150797
assert d["postSignedCandidate"]["remaining"]==[["rz",[1,2,1,0]],["rz",[1,2,1,2]]]

ops=d["spatialOps"]
N,scale,add,mul,leibniz,shift,encode,E=(ops[k] for k in ("NORM","scale","add","mul","leibniz","shift","encode","EPS"))
Z0=(0,0,0,0)
RR=(1,0,0,0)
ZZ=(0,1,0,0)
TT=(0,0,1,0)
LL=(0,0,0,1)
ZT=(0,1,1,0)
CURR={0:Z0,1:TT}
FOUR=(Z0,ZZ,TT,ZT)
ZERO=N(100*E,0,0,0)
assert E==100000

old=d["initialized"]["originalDirectionTable"]
assert len(old["middle"])==d["initialized"]["requiredCount"]==266
old_table={(r["field"],tuple(r["RZTL"])):r for r in old["middle"]}
assert {(r["field"],tuple(r["RZTL"])) for r in old["inner"]}==set(old_table)
assert {(r["field"],tuple(r["RZTL"])) for r in old["outer"]}==set(old_table)
old_rank=max(old["common"]["coefficientRanksInHOver2Pow128"])
old_profile=d["initialized"]["compactProfile"]
compact_rank=old_profile["compactChargeInHOver2Pow128"]
assert old_rank==48636 and compact_rank==51313
assert old_profile["compactIndependentOfL"] and old_profile["compactZeroOnBothSourceCollars"] and old_profile["motionOfSRetained"]

# Attach the older spatial source premises and the newer unweighted paired
# original conditional covariance bounds with their exact component labels.
spatial={(f,tuple(q)) for f,q in d["spatial"]["premise"]["componentDirections"]}
assert len(spatial)==d["spatialBoundJoin"]["sourceInputs"]["covarianceInputs"]==127
assert not any(q[2] for _,q in spatial)
assert Q(d["spatialBoundJoin"]["conditionalResult"]["covarianceGrade"])==Q(45999,50000)
assert 2*(Q(1,2**100)+Q(128,2**32636))<Q(1,100000)
spatial_grade=E*Q(d["spatialBoundJoin"]["conditionalResult"]["covarianceGrade"])-1
existing={(f,tuple(q)) for f,q in d["cov129"]["previouslyAttached"]}
existing|={(r["tensor"],tuple(r["RZTL"])) for r in d["cov129"]["newlyAttached"]+d["cov130"]["newlyAttached"]}
assert len(existing)==94 and d["cov130"]["stillOpen"]==[]
swirl_proof_cov={(f,tuple(q)) for f,q in d["swirlT"]["weightedSourceAndTransfer"]["usedPostSignedCovariance"]}
assert len(swirl_proof_cov)==16
extra={}
for key in ("momentTwoRows","swirlMixedEight","sixPressureRows"):
    for r in d[key]["targets"]:
        order=(r["tensor"],tuple(r["RZTL"]))
        assert Q(r["wholePathEpsilonGrade"])==Q(99999,100000)
        extra[order]=key
spatial_grade=int(spatial_grade)
certified={key:spatial_grade for key in spatial}
certified.update({key:99999 for key in (existing|extra.keys()|swirl_proof_cov) if key[1][2]})

used_W=set()
used_old=set()
used_bg=set()
used_temp=set()

def source_W(f,q):
    key=f,q
    used_W.add(key)
    if key not in certified:
        raise KeyError(("independent post-Signed covariance bound is missing",key))
    return N(certified[key],0,1,0)

def old_mean(f,q,compact=False):
    key=f,q
    used_old.add(key)
    r=old_table[key]
    slow=sum(q[:3])
    n=N(Q(r["minEpsilon"])*E,Q(r["bandIntercept"])+3*slow,1,old_rank)
    if q[3] or compact=="directOnly":
        return n
    c=N(2*E if f=="beta" else E,(Q(7,2) if f=="beta" else Q(1,2))+3*slow,1,compact_rank)
    return add(n,c)

def background(f,q):
    if q[3]:
        return ZERO
    used_bg.add((f,q))
    assert sum(q[:3])<=3
    return N(E if f=="b" else 0,0,1,2 if f=="V" else 1)

def spatial_swirl():
    fn=ops["calculus"]
    s=inspect.getsource(fn)
    begin=s.index('    old_data=d["old"]')
    end=s.index("    def background",begin)
    s=s[:begin]+'''    def W(f,q):
        waveseen.add((f,q))
        return d["W"](f,q)
    def old(f,q,compact=False):
        oldseen.add((f,q))
        return d["mean"](f,q,compact)
\n'''+s[end:]
    end=s.index('    for label,output in (')
    s=s[:end]+'''    result={q:late("v",q) for q in d["orders"]}
    return result, {"W":waveseen,"old":oldseen,"background":bgseen,"centeredSources":forcing}
'''
    ns={}
    exec(compile(s,str(pins["spatialOps"][0]),"exec"),fn.__globals__,ns)
    orders=(Z0,RR,ZZ,LL)
    result,trace=ns["calculus"]({"late":{"demand":{"postSignedCovarianceOrders":[],"initialMeanOrdinaryInputOrders":[]}},
                                "W":source_W,"mean":old_mean,"orders":orders})
    assert {f for f,_ in trace["W"]}=={"rtheta","thetaz"}
    assert all(f=="theta" and not q[2] for f,q in trace["centeredSources"])
    return result,trace

v_spatial,swirl_trace=spatial_swirl()

def source_norm(r,debit=False):
    key="epsilonAfterFiniteCoefficientDebit" if debit else "epsilon"
    grade=Q(r[key])*E
    assert grade.denominator==1
    return N(grade,Q(r["band"]),1,0 if debit else r["totalCoefficientChargeInHOver2Pow128"])

A={(tuple(x["RZTL"])):source_norm(x) for x in d["spatial"]["rawMeanCoefficientRows"] if x["field"]=="A_T"}
assert all(q[2]==0 for q in A) and len(A)==10
temporal={
    ("beta",TT):source_norm(d["temporalT"]["normalizedTemporalT"]["betaT"],True),
    ("gamma",TT):source_norm(d["temporalT"]["normalizedTemporalT"]["gammaT"],True),
    ("v",TT):source_norm(d["swirlT"]["weightedSourceAndTransfer"]["nativeSwirlT"],True),
    ("beta",ZT):source_norm(d["temporalZT"]["normalizedFixedLabelBounds"]["beta_ZT"]["normalizedBound"],True),
    ("v",ZT):source_norm(d["temporalZT"]["normalizedFixedLabelBounds"]["v_ZT"]["normalizedBound"],True),
}
for q in (Z0,RR,ZZ,LL):
    temporal["v",q]=v_spatial[q]
    temporal["beta",q]=scale(A[shift(q,1)],e=E)
for q in (Z0,ZZ):
    temporal["gamma",q]=add(A[shift(q,0)],scale(A[shift(q,3)],e=-1,c=1),scale(A[q],c=1))

def temp(f,q):
    used_temp.add((f,q))
    return temporal[f,q]

def post(f,q):
    return add(old_mean(f,q),temp(f,q))

def old_field(n):
    return lambda q:old_mean(n,q)

def total_field(n):
    return lambda q:post(n,q)

def product_jet(f,g,q):
    terms=[scale(mul(f(u),g(v)),m=b) for u,v,b in leibniz(q)]
    return add(*terms)

b=lambda q:background("b",q)
V=lambda q:background("V",q)
G=lambda q:background("G",q)
ob,ov,og=(old_field(n) for n in ("beta","v","gamma"))
pb,pv,pg=(total_field(n) for n in ("beta","v","gamma"))

# In the only product carrying gamma_temporal,ZT use its source
# divergence. The weighted adjoint has no boundary term after both
# actual flat endpoints and periodic normalized Haar.
def gamma_ZT_product(full_f,q_weight):
    terms=[scale(mul(full_f(q),pg(k)),c=int(q_weight>0))
           for q,k in ((ZT,Z0),(ZZ,TT),(TT,ZZ))]
    terms.append(scale(mul(full_f(Z0),og(ZT)),c=int(q_weight>0)))
    adjoint=add(scale(full_f(RR),c=int(q_weight>0)),
                scale(full_f(LL),e=-1,c=1+int(q_weight>0)),
                scale(full_f(Z0),m=abs(q_weight-1),c=1))
    terms.append(scale(mul(temp("beta",TT),adjoint),e=-E))
    return add(*terms)

def live_mixed_product(full_f,q,weight):
    if q==ZT:
        return gamma_ZT_product(full_f,weight)
    return scale(product_jet(full_f,pg,q),c=int(weight>0))

def gr_integral(weight,t):
    q=CURR[t]
    qp=shift(q,1)
    qtt=shift(q,2)
    qzz=shift(q,1,2)
    ur=add(scale(product_jet(b,ob,q),m=2),product_jet(pb,pb,q),source_W("rr",q))
    bt=add(scale(product_jet(V,ov,q),m=2),product_jet(pv,pv,q),source_W("thetatheta",q))
    mixed_linear=add(product_jet(b,og,qp),product_jet(G,ob,qp),source_W("rz",qp))
    mixed=add(scale(mixed_linear,c=int(weight>0)),live_mixed_product(pb,qp,weight))
    # w'-w/R is -1/R or R. w/R is 1/R or R.
    # For these weights the twice integrated radial viscosity bulk is zero.
    interior=add(scale(ur,m=abs(weight-1),c=1),scale(bt,c=1),scale(mixed,e=E),
                 scale(ob(qtt),e=E,c=int(weight>0)),scale(ob(qzz),e=3*E,c=int(weight>0)))
    return scale(interior,c=1)

def jtheta(q):
    return scale(add(scale(add(product_jet(G,ov,q),product_jet(V,og,q),source_W("thetaz",q)),c=1),
                     live_mixed_product(pv,q,2)),c=1)

def jz(t):
    q=CURR[t]
    flux=add(scale(product_jet(G,og,q),m=2),product_jet(pg,pg,q),source_W("zz",q))
    return add(scale(flux,c=2),scale(gr_integral(2,t),m=Q(1,2)))

snap=set(used_W)
moments={"P":{q:gr_integral(0,t) for t,q in CURR.items()},
         "Jz":{q:jz(t) for t,q in CURR.items()},"Jtheta":{q:jtheta(q) for q in FOUR}}
direct_W={(f,q) for f,q in used_W if (f,q) not in snap} | {(f,q) for f,q in used_W&snap if f=="thetaz" and q in FOUR}
direct_expected={("rr",q) for q in CURR.values()}|{("thetatheta",q) for q in CURR.values()}|{("zz",q) for q in CURR.values()}
direct_expected|={("rz",ZZ),("rz",ZT)}|{("thetaz",q) for q in FOUR}
assert direct_W==direct_expected
assert {f for f,q in used_W if q[2]}=={"rr","thetatheta","zz","rz","thetaz"}
assert set(map(lambda x:(x[0],tuple(x[1])),d["postSignedCandidate"]["remaining"])).isdisjoint(used_W)
assert all(k in old_table for k in used_old)
assert ("beta",(0,0,2,0)) in used_old and ("beta",(0,2,1,0)) in used_old

# Certified positive original static shape, implicit moving s and native
# matrix factors. The finite ledger below does not use a norm bound for an
# abstract inverse: it treats the actual 3x3 and 2x2 rows separately.
chart=d["C106Chart"]["cutoff"]
assert chart["order"]==13 and chart["coefficientLog2Ceilings"]["sScaleOrdinary"]==181 and chart["coefficientLog2Ceilings"]["etaOrdinary"]==182
mp=d["matrixFactors"]
limits=mp["conditionalBounds"]
assert mp["fiveMapCoefficients"]["fiveZeroNumerators"] and mp["beta"]["wholeGammaMomentZero"]
assert limits["fiveNormalizedMomentLower"]=="2^-16"
assert limits["angularNodeGapStrictLower"]=="1/8" and limits["axialNodeGapLower"]=="lambda/5"
assert limits["liveChart"]["s"]==roots["nativeScale"]
assert mp["fiveMapCoefficients"]["axialBaseAndRatio"][0]==five["wholeAxialCancellation"]["axisScale"]
assert d["nativeMeanGeometry"]["coefficient_charges"](chart,7)["fiveMapOverGlobalCovariance"]["logCap"]=="H/2^128"
assert int(chart["coefficientLog2Ceilings"]["sScaleOrdinary"])<512
Amax=Q(1,2)+Q(1,128)
assert max(abs(x) for x in (-Amax,-Q(1,2),2*Amax,2*Amax-Q(3,2),2*Amax-1))<2

# (Exact integer upper coefficient, power of Renv); the source has
# D<=Renv and B_R<=2Renv. The exponent and integer notations are kept
# separate throughout this positive source geometry calculation.
def csum(*xs):
    return sum(x[0] for x in xs),max(x[1] for x in xs)

def cprod(*xs):
    c,k=1,0
    for u,v in xs:
        c*=u
        k+=v
    return c,k

def jet_product(left,right):
    return {q:csum(*(cprod(left[u],right[v],(b,0)) for u,v,b in leibniz(q))) for q in FOUR}

spow={q:(4 if q==Z0 else 2**181,0) for q in FOUR}
eta={q:(1 if q==Z0 else 2**182,0) for q in FOUR}
peta=jet_product(eta,eta)
peta[Z0]=csum(peta[Z0],(1,0))
# The profile argument is 10*(R*s^(-1/2)/(x0*exp(j*d))-1).
arg=(20*2**181,2)
bump_upper=d["C106Chart"]["coefficientProfile"]["higherBumpDerivativeIntegerCaps"][:3]
assert bump_upper==[1,4,120]
shape={Z0:(1,0),ZZ:cprod((4,0),arg),TT:cprod((4,0),arg),
       ZT:csum(cprod((120,0),arg,arg),cprod((4,0),arg))}
profile=jet_product(spow,shape)
profile={q:cprod((1,1),x) for q,x in profile.items()}

# For the angular columns the larger of the two inverse factors costs
# <=2^16*D^4*(1+eta^2). The static Lagrange coefficient is <=2^8.
# Axial uses 5/lambda in the actual gap and the inverse mu_{1-2lambda}
# and a. Its native exp(d) only improves the absolute coefficient.
assert Q(11,10)**4<2
assert 6*Q(1,5)>1
static={"P":(2**24,4),"Jz":(2**24,4),"Jtheta":(5*2**16,3)}
geometries={}
for f,coefficient in static.items():
    cf=jet_product(spow,{q:cprod(coefficient,x) for q,x in peta.items()})
    entries=jet_product(cf,profile)
    multiplicity=2 if f=="Jtheta" else 3
    geometries[f]={q:cprod((multiplicity,0),x) for q,x in entries.items()}

def geometry_rank(x):
    bits,power=x[0].bit_length(),x[1]
    assert bits+power<4096
    # One original Bnorm charge pays the combined integer and Renv powers.
    # Its comparison to H/2^128 is the same as the pinned native geometry.
    assert (bits+power)*2**129 < 2**(4096*510)
    return bits+power

def assembly(moment_name,q):
    table=moments[moment_name]
    terms=[]
    for u,v,b in leibniz(q):
        terms.append(scale(table[v],m=b,c=geometry_rank(geometries[moment_name][u])))
    return add(*terms)

ng=assembly("Jtheta",TT)
ngzt=assembly("Jtheta",ZT)
nv=add(assembly("P",TT),assembly("Jz",TT))
# R^-1 left weighted primitive uses positive R, inner trace zero, original
# fixed envelope and three radial factors. Band epsilon is static.
primitive_charge=geometry_rank((8,3))
nb=scale(ngzt,e=E,c=primitive_charge)
potential=scale(ng,c=primitive_charge)
ret={}
for k,n in (("beta_T",nb),("v_T",nv),("gamma_T",ng),("potential_T",potential)):
    obj=encode(n)
    band=Q(obj["band"])
    rank=obj["totalCoefficientChargeInHOver2Pow128"]
    assert 2*(Q(rank,2**128)+band/2**32636)<Q(1,E)
    obj["epsilonAfterJointCoefficientAndBandDebit"]=str(Q(obj["epsilon"])-Q(1,E))
    ret[k]=obj

# The protected Repeat subtracts the two-step initialized baseline. The
# exact remaining mean derivative is this FiveMap increment plus its
# preceding centered Temporal increment in the same chart.
post_five=d["postFiveTransport"]
assert post_five["protectedSource"]==five["graph"]["sourceStream"]
assert post_five["meanComponentRoots"]==[[21374946,22153217,22151963],
                                       [21374947,22153219,22151941],
                                       [21374948,22153221,22151945]]
assert post_five["exactLatePotentials"]==[22150943,22151952] and post_five["exactLateDirectSwirl"]==22154876
previous={"beta":d["temporalT"]["normalizedTemporalT"]["betaT"],
          "gamma":d["temporalT"]["normalizedTemporalT"]["gammaT"],
          "v":d["swirlT"]["weightedSourceAndTransfer"]["nativeSwirlT"]}
aggregate={}
for f,fivenorm in (("beta",nb),("v",nv),("gamma",ng)):
    m=encode(add(source_norm(previous[f]),fivenorm))
    assert 2*(Q(m["totalCoefficientChargeInHOver2Pow128"],2**128)+Q(m["band"])/2**32636)<Q(1,E)
    m["epsilonAfterJointCoefficientAndBandDebit"]=str(Q(m["epsilon"])-Q(1,E))
    assert m["epsilonAfterJointCoefficientAndBandDebit"]==ret[f+"_T"]["epsilonAfterJointCoefficientAndBandDebit"]
    aggregate[f]=m

initialized_addend={}
for f in ("beta","v","gamma"):
    m=encode(old_mean(f,TT))
    assert 2*(Q(m["totalCoefficientChargeInHOver2Pow128"],2**128)+Q(m["band"])/2**32636)<Q(1,E)
    m["epsilonAfterJointCoefficientAndBandDebit"]=str(Q(m["epsilon"])-Q(1,E))
    initialized_addend[f]=m

result={"schema":"MathScope.C133.OriginalFiveMapFirstTimeQuantitative/1",
        "status":"CONDITIONAL_AUTHENTICATED_ORIGINAL_FIVEMAP_TIME_NORM",
        "pins":{k:h for k,(_,h) in pins.items()},
        "roots":{k:roots[k] for k in ("increments","nativeScale","potential","whole","fixedEndpoints","freshMomentBodies")},
        "weightedOriginalMomentBounds":{f:[{"RZTL":q,**encode(n)} for q,n in sorted(table.items())] for f,table in moments.items()},
        "fiveMapFixedLabelBounds":ret,"postFiveFixedLabelAccumulatedMeanIncrementT":aggregate,
        "accumulatedAndInitializedRoots":{"initialized":[21374946,21374947,21374948],
                                          "postMinusInitialized":[22153217,22153219,22153221],
                                          "latestFive":[22151963,22151941,22151945]},
        "initializedFixedLabelMeanTSeparateAddend":initialized_addend,
        "nativeReferenceTimeTransfer":"At fixed label ratio b, the reference-to-own derivative adds b^(-A-1) to each normalized derivative. Verify the normalized eikonal transfer separately using both source mean addends.",
        "trueDirectFreshWplusRoles":sorted(direct_W),"usedOriginalWplusIncludingLowSpatialSwirl":sorted(used_W),
        "unneededConservativePositiveTSlots":d["postSignedCandidate"]["remaining"],
        "initializedRoles":sorted(used_old),"temporalRoles":sorted(used_temp),"backgroundRoles":sorted(used_bg|swirl_trace["background"]),
        "spatialSwirlSourceCounts":{"covariance":len(swirl_trace["W"]),"initialized":len(swirl_trace["old"]),"forcing":len(swirl_trace["centeredSources"])},
        "actualBumpGeometry":[{"target":f,"RZTL":q,"integerCoefficientBits":c.bit_length(),"RenvPower":k}
                              for f,table in geometries.items() for q,(c,k) in sorted(table.items())],
        "primitiveGeometryRank":primitive_charge,
        "scope":"Original admitted normalized fixed-label chart, normalized Haar, both fixed flat endpoint traces, previous original derivative norms, positive matrix factors and the original directed H slab. The full physical Repeat estimate and final jets are separate.",
        "finalJets":0,"release":"HOLD"}
a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
print("PASS actual original FiveMap first time",ret)
print("W direct",len(direct_W),"W selected including low spatial swirl",len(used_W),"old",len(used_old),"centered prior norms",len(used_temp))
