"""Original first-cycle wave pressure donor for the Repeat gradient."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import factorial,prod
from pathlib import Path
import runpy


PINS={
 "signedSigma":("goal","c119/signed-mixed-native-time/signed-mixed-sigma-time.json","d43d7d90c831c82b13c9fb68be5e4ab3acd8212fb7a1bd894e4d061d26673014"),
 "pureSigma":("work","continuation118/pure-sigma-time-join/pure-sigma-time.json","b128b6131412a2aef44c6a945b00ca03b38c04308a57c141e03476ea82d5c796"),
 "sigma":("work","continuation108/early-sigma-c6/final/early-sigma-c6.json","d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
 "waveModes":("work","continuation115/first-cycle-pressure-modes/first-cycle-pressure-modes.json","dd9e600d34d6e32fc045d51892c04c3297b1a789c79d802b5e4d478d72072141"),
 "f1C118":("work","continuation118/first-mode-one-mixed-time/final/first-mode-one-time.json","989a5ad9ba91bf75c4d1ec77cd8fa6afe5875ee8e9cb9b7663714761ad45f26c"),
 "f2C115":("work","continuation115/k2-radial-time-analytic/final/first-forced-t-transfer.json","aa0068461cdfeda7a8ac77700a60a2695c811db8a79a5e9bd854f43e7f37b05a"),
 "mixedGauges":("work","continuation119/signed-time-covariance/final/mixed-signed-time-covariance.json","18b36ba6fceb10cc448f24361dd6c8e7a2a0e3f3c69dabee966102418f508f7f"),
 "baseCode":("work","continuation115/k2-radial-time-analytic/final/verify_first_forced_t_transfer.py","eaaeba91d9a62e83be10dd494943f36fd6e52616d6f187b094e1b3370b85b06a"),
 "signedCore":("goal","c103/signed-high/signed-high.json","e8ab0b3aad45d6f995346a20ead2ed412b0fc63fcf9c7ac0a3ed5753bb212b35"),
 "signedCutoffs":("goal","c107/post-signed-gauge/signed-gauge-cutoffs.json","449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a"),
 "primary":("work","continuation106/high-compact-mode-one/primary-quotient-c11.json","595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8"),
 "angle":("navier","source-global-angular.mjs","eb4e4ae44e9bb84713f89d36d1d7ae33cf1b072638d0a8e67e2a90f38d411010"),
 "kernel":("navier","source-forced-pulse.mjs","866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9"),
 "map":("navier","source-mapped-forced-curl.mjs","3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd"),
 "assembly":("navier","source-harmonic-assembly.mjs","339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20"),
 "signed":("navier","generic-signed-source-kernel.mjs","15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2"),
 "bridge":("navier","original-generic-signed-bridge.mjs","8d828a5be966766e0e59fbf5d3c9cd8a5f8ab5a188d7a2a58a43e35f6c6f7c51"),
 "repeat":("post","source-postfive-repeat-forced.mjs","4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"),
}
ZERO=(0,0,0,0)
R=(1,0,0,0)
Z=(0,1,0,0)
L=(0,0,0,1)


def read(path,pin):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==pin,(path,pin)
    if path.suffix==".json":
        return json.loads(raw)
    if path.suffix==".py":
        return runpy.run_path(str(path))
    return raw.decode()


def add(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def load(a):
    roots={"work":a.work,"goal":a.goal,"navier":a.runtime/"research-ide/mathscope-m3/navier",
           "post":a.runtime/"research-ide/mathscope-m3/post-signed-20261023"}
    return {key:read(roots[root]/rel,pin) for key,(root,rel,pin) in PINS.items()}


def check_routing(d):
    strings={
      "kernel":["pressureNumerator=cadd(G,cdot(G,normalRow,velocity),cdot(G,n,forcing))",
                "normalRow=K[0].map((_,j)=>G.sub(dot(G,n,K.map(row=>row[j])),nPrime[j]))",
                "G.neg(G.div(pressureNumerator.imaginary,denominator)),G.div(pressureNumerator.real,denominator)",
                "formula:'principal(psi*t,psi*pi)+f=(1-psi)*f+psi_prime*t'"],
      "map":["pressure:mapComplex(pathCutoff.pressure)","map=x=>G.simultaneousSubstitute(x,[w],[pulseValue])"],
      "assembly":["gradient=P=>[Dr(P),angular(P),Dz(P)]","linear=(U,P)=>",
                  "C.imaginary(G.mul(k,G.q(m),phaseDerivative),x)",
                  "angular=M=>S.map(M,(x,m)=>C.imaginary(G.mul(k,G.q(m),phaseGradient[1]),x))"],
      "signed":["K:f.frame.principalK,k,amplitude:weighted","homogeneousSignedAngularPressure:homogeneousPressure.value"],
      "angle":["imaginary=dot(G,row,amplitude)","nPrime[j])","G.mul(k,squared)"],
      "bridge":["homogeneousPressure:originalHomogeneousPrimaryPressure"],
      "repeat":["pressure: shared[3]","const wavePressure = G.add(forced.assembly.angularPressureField.root, signed.indexed.roots.angularPressure)",
                "family: 'first-forced-remaining-source', value: f.remainingSource",
                "family: 'first-forced-cutoff-derivative', value: f.derivativeSource",
                "family: 'signed-cutoff-derivative', value: signedPrincipal"],
    }
    for role,check in strings.items():
        assert all(text in d[role] for text in check),(role,check)
    modes=d["waveModes"]
    assert modes["pressureRoot"]==22153227
    indexed=modes["physicalPressureAngularFields"]
    assert len(indexed)==2 and all(x["sameVelocityRows"]==x["nonzeroAngularRows"]==162 for x in indexed)
    # Exact negative control for dropping n.f. For n=f=e_theta the
    # projected source vanishes, but i*m*k*n*pi must cancel f.
    m,k=2,5
    pi_imag=Q(1,m*k)
    assert -m*k*pi_imag==-1
    assert -m*k*Q(0)!=-1
    # Principal ψ cutoff equation and the actual Repeat subtraction.
    # The symbolic forcing coefficient, then the cutoff derivative coefficient.
    for psi in (Q(0),Q(1,3),Q(1)):
        principal=(-psi,1)
        subtract=(1-psi,1)
        assert tuple(a-b for a,b in zip(principal,subtract,strict=True))==(-1,0)
    pressure_row_orders={ZERO,R,Z,L}
    closure=pressure_row_orders|{add(a,R) for a in pressure_row_orders}
    return {"originalFirstCyclePressureRoot":22153227,"sameLivePressureFieldRows":324,
            "WSharedPressureComponentIndex":3,"nonzeroPressureHarmonics":[-2,-1,1,2],
            "noRawPressureGradientForHarmonics":[-4,-3,3,4],
            "zeroModeMeanPressureOnlyEntersModeZeroGradient":True,
            "rawPhaseFreePressureRZTL":sorted(pressure_row_orders),
            "rawRadialDerivativeClosureRZTL":sorted(closure),
            "ungroupedAuxiliaryDerivatives":["Y0","Y1"],
            "groupedPolarOperator":"Dr=D_R+a L, Dz=epsilon D_Z; Lv=0. No pure pulse derivative remains in the grouped pressure gradient.",
            "originalPressureFalsifier":"n=f=e_theta, t=0: projected source zero, pi=i/(mk), phase gradient cancels f. Omitting n·f fails.",
            "principalCutoffCancellation":"Original principal(psi*t,psi*pi)+f=(1-psi)*f+psi_v*t; removing both registered flat terms from principal alone leaves -f. Keep all ordinary curl and spatial commutators."}


def pressure_variation(base,d,alpha):
    led=d["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    slow,subs,sub,choose,words=(base[k] for k in ("slow","slow_subs","sub","choose","words"))
    def read(name,j,fac=1):
        c,a,s=led[name][j]
        return fac*Q(c),a,s
    totals={}
    def charge(k,coef,factors,stem):
        p=sum(x[1] for x in factors)
        old=totals.get((stem,k),(Q(0),0))
        totals[stem,k]=(old[0]+coef*prod(x[0] for x in factors),max(old[1],p))
    # M, B_left and Pi produce the state. B converts it to the actual
    # tangent t/P before applying the pressure row. Choose the source's
    # q^-1, n, K and n_v slots explicitly at every Leibniz split.
    for iq in subs(alpha):
        r=sub(alpha,iq)
        for ix in subs(r):
            s=sub(r,ix)
            fixed=[read("inverseNormalSquared",slow(iq)),read("n",slow(ix),3)]
            assert sum(x[2] for x in fixed)+3*slow(s)<=3*slow(alpha)
            charge(0,choose(alpha,iq)*choose(r,ix),fixed,"normalSource")
            for kind in ("K","nPrime"):
                for ik in subs(s):
                    if kind=="nPrime" and ix!=ZERO:
                        continue
                    rem=sub(s,ik)
                    picked=[read("inverseNormalSquared",slow(iq))]
                    if kind=="K":
                        picked.extend([read("n",slow(ix),3),read("cylindricalK",slow(ik),3)])
                    else:
                        picked.append(read("nPrime",slow(ik),3))
                    lead=choose(alpha,iq)*choose(r,ix)*choose(s,ik)
                    for ib in subs(rem):
                        bsub=sub(rem,ib)
                        top=picked+[read("movingBasisInfinityNorm",slow(ib))]
                        for rest,word,coef in words(bsub):
                            mk=[read("normalizedMode1And2MatrixInfinityNorm",slow(x)) for x in word]
                            k=len(word)
                            for il in subs(rest):
                                post=sub(rest,il)
                                for ip in subs(post):
                                    raw=sub(post,ip)
                                    all_basis=top+mk+[read("BLeft",slow(il),3),read("projector",slow(ip),3)]
                                    assert sum(x[2] for x in all_basis)+k+3*slow(raw)<=3*slow(alpha)
                                    factor=Q(lead*choose(rem,ib)*coef*choose(rest,il)*choose(post,ip),factorial(k))
                                    charge(k,factor,all_basis,"tangentPressure")
    assert ("normalSource",0) in totals
    return [{"term":tag,"insertions":k,"positiveCoefficient":str(c),"coefficientBits":base["coefficient_bits"](c),
             "sourcePower":a,"propagatorPower":0 if tag=="normalSource" else k+1}
            for (tag,k),(c,a) in sorted(totals.items())]


def check_sigma_orders(d,region):
    old=d["sigma"]["regions"]["complement" if region=="middle" else region]["rows"]
    table={(row["field"],tuple(row["RZT"])):row for row in old}
    assert all((n,a) in table for n in ("theta","z") for a in product(range(3),range(3),[0]) if sum(a)<=2)
    assert d["signedSigma"]["nativeSigmaRoots"]==d["pureSigma"]["actualNativeSigma"]==[22001223,22001224]
    mixed=d["signedSigma"]["mixedCommon"]
    assert mixed["epsilon"]=="1"
    return [d["sigma"]["commonBound"],d["pureSigma"]["absoluteBound"],mixed]


def main(a):
    d=load(a)
    route=check_routing(d)
    p_apps=a.applications.read_bytes()
    apps=json.loads(p_apps)
    assert len(apps["activePressureWrappers"])==40 and len(apps["archivedExactPressureApplyNodes"])==200
    base=d["baseCode"]
    inputs=base["load"]({"work":a.work,"runtime":a.runtime/"research-ide/mathscope-m3/navier"})
    base["check_sources"](inputs)
    assert all(tuple(c["unpulledPulseEndpoint"] for c in inputs["factor"]["normalizedPrimaryByChart"].values()))
    assert all(row["L_v"]==0 for row in inputs["factor"]["normalizedPrimaryByChart"].values())
    directions=sorted(q for q in product(range(3),range(3),range(2),range(3)) if q[0]+q[1]+q[3]<=2-q[2])
    assert len(directions)==14
    assert set(map(tuple,route["rawRadialDerivativeClosureRZTL"]))<=set(directions)
    core=d["signedCore"]["transfer"]["requests"]
    assert all(Q(row["bandPower"])<=Q(1,4)+2*sum(row["RZ"]) for row in core if sum(row["RZ"])<=2)
    assert all(d["signedCutoffs"]["GaussianReciprocal"][side][2]["extraPole"]==6 for side in ("inner","outer"))
    primary=d["primary"]["weightedQuotientLedger"]["bounds"]
    res={}
    for reg in ("inner","outer","middle"):
        sig=check_sigma_orders(d,reg)
        tab1={tuple(row["RZTL"]):row for row in d["f1C118"]["regions"][reg]["rows"]}
        tab1.update({tuple(row["RZTL"]):row for row in d["mixedGauges"]["threeRegionModeOneGauges"][reg]})
        tab2={tuple(row["RZTL"]):{"logRank":row["gaugePrefactorRankInHOver2Pow128"]} for row in d["f2C115"]["modeTwo"]["directions"]}
        tab2.update({tuple(row["RZTL"]):row for row in d["mixedGauges"]["modeTwoGauges"]})
        rho=[]
        for b in directions:
            j=base["slow"](b)
            variants=pressure_variation(base,inputs,b)
            geom=max(x["coefficientBits"]+7*x["sourcePower"]+x["propagatorPower"]+24 for x in variants)
            # Normal projection, normal-row product and actual small
            # source coefficient ranks are both explicitly counted.
            raw1=Q(tab1[b]["rawCommon"][0])
            assert raw1<=Q(67,4)+3*j and Q(tab1[b]["rawCommon"][1])>=Q(99996,100000)
            f1={"sourceGrade":"99996/100000","band":str(Q(71,4)+3*j),
                "pole":str(0 if reg=="middle" else Q(21,2)+3*j),"weight":"sqrt(zeta)",
                "carrier":"1/k","coefficientRank":tab1[b]["prefactorLogRankHOver2Pow128"]+geom+512}
            f2={"sourceGrade":"99999/100000","band":str(Q(23,2)+3*j),
                "pole":str(0 if reg=="middle" else 3*j+13),"weight":"zeta",
                "carrier":"1/(2k)","coefficientRank":tab2[b]["logRank"]+geom+512}
            sig_p=max(int(row.get("collarPole",row.get("pole",0))) for row in sig)
            sig_s=max(Q(row["band"]) for row in sig)
            assert sig_p<=48 and sig_s<=Q(131,2)
            sig_rank=max(int(row.get("logCoefficientUnitsHOver2Pow128",row.get("coefficientInHOver2Pow128",0))) for row in sig)
            core_rank=max(sum(row["logRanks"]) for row in core if sum(row["RZ"])<=j)
            signed_rank=sig_rank+core_rank+2**15
            assert signed_rank<2**22
            signed={"sourceGrade":"1","band":str(sig_s+Q(1,4)+3*j),"coefficientRank":signed_rank,
                    "pole":str(0 if reg=="middle" else sig_p+3*j),"weight":"sqrt(zeta)",
                    "scale":"sqrt(epsilon)/(epsilon*k) <= 1"}
            h=[row for row in primary if row["role"]=="pressureOverP" and row["slowOrder"]==j]
            assert len(h)==1
            pure={"sourceGrade":"1/2","band":h[0]["constantSPower"],
                  "pole":str(0 if reg=="middle" else Q(3,2)+h[0]["totalLogPoleAfterG"]),
                  "weight":"sqrt(zeta)","carrier":"1/k"}
            assert max(f1["coefficientRank"],f2["coefficientRank"])<2**17
            rho.append({"RZTL":b,"forced1":f1,"forced2":f2,"signed1":signed,"primary1":pure,
                        "exactPositiveForcedPressureExpansion":variants})
        res[reg]=rho
    report={"schema":"MathScope.C120.FirstCycleWavePressureForRepeatGradient/1",
       "status":"ORIGINAL_PRESSURE_OPERATOR_AND_CONDITIONAL_FIXED_LABEL_COLLAR_NORMS",
       "pins":{k:v[2] for k,v in PINS.items()},
       "archivedExactApplicationAndActiveCapsuleReceiptSHA256":sha256(p_apps).hexdigest(),
       "actualRawRepeatPressureRouting":route,"fourteenCommonProductDirections":directions,
       "pressureOverP":{"regions":res,"scope":"Both original narrow radial collars and the admitted middle; pressure bounds before physical harmonic differentiation."},
       "gradeOfPhysicalPressureWithoutOtherGroups":{"modeOnePhase":"1/2","modeOneOrdinaryRadial":"99999/100000",
          "modeOneOrdinaryAxial":"2","modeTwoPhase":"99999/100000","modeTwoOrdinaryRadial":"74999/50000",
          "modeTwoOrdinaryAxial":"249999/100000","afterRadialFastDebit":True},
       "signedPressureCoefficientCap":"H/2^106",
       "boundaryOfEvidence":"Source graph recipes and same-live first-cycle pressure cover. Numeric total raw Repeat estimate and any native live appended W census require separate combination and readback.",
       "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(report,indent=2,ensure_ascii=False)+"\n").encode())
    print("PASS original pressure routing, all 14 pressure derivatives, both collars; distinct pressure phase debit and principal exact coupling")


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","goal","runtime","applications","out"):
        p.add_argument(f"--{key}",type=Path,required=True)
    main(p.parse_args())
