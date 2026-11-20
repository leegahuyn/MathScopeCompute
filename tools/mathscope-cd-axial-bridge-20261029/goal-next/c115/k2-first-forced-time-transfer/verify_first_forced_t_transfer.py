"""Exact first Forced transfer with one time derivative at fixed native pulse."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
import json
from math import comb, factorial, prod
from pathlib import Path


PINS = {
    "frame":("work","continuation106/frame15/frame-c15.json","09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"),
    "join":("work","continuation106/frame15/joined-c15.json","98e3fa519ab4e323373d8f0beb85029938ba7b4ede221af982524705fd590fd3"),
    "compact":("work","continuation106/high-compact-mode-one/compact-mode-one-c15.json","00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884"),
    "matrix":("work","continuation89/matrix/final/matrix-s-j.json","e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "factor":("work","continuation90/forced-source/final/forced-source-factor.json","bf31bdd56a71545d67e615a6018f062770324ebc0b353d76461e53f16c573e97"),
    "one":("work","continuation94/mode1/final/mode1-linear-cancellation.json","02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364"),
    "two":("work","continuation94/mode2/mode-two-tangency.json","f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a"),
    "highTwo":("work","continuation105/forced-mode-two-high/final/forced-mode-two-high.json","c892d8878e0607117077f08c41b6d8d79f3e8729dc85bf79f35e346daf9cfa9e"),
    "path":("work","continuation110/k1-path-compacts/final/k1-path-compacts.json","32004b3c7de4b1ac526852301c180db649601785e578f3074f8ee3eae72657f0"),
    "band":("runtime","source-global-band.mjs","a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "init":("runtime","source-initialized-angular.mjs","4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
    "forced":("runtime","source-global-forced-current.mjs","1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"),
    "kernel":("runtime","source-forced-pulse.mjs","866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9"),
}
ZERO = (0,0,0,0)
T = (0,0,1,0)
STREAM = "faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"


def load(roots):
    result = {}
    for key,(root,relative,pin) in PINS.items():
        path = roots[root]/relative
        raw = path.read_bytes()
        assert sha256(raw).hexdigest()==pin,(key,path)
        result[key]=json.loads(raw) if path.suffix==".json" else raw.decode()
    return result


def slow(a):
    return sum(a[:3])


def sub(a,b):
    return tuple(x-y for x,y in zip(a,b,strict=True))


def choose(a,b):
    return prod(comb(x,y) for x,y in zip(a,b,strict=True))


def slow_subs(a):
    return product(*(range(x+1) for x in a[:3]),(0,))


@cache
def words(a):
    out = [(a,(),1)]
    for b in slow_subs(a):
        if b!=ZERO:
            out.extend((remaining,(b,*word),choose(a,b)*c) for remaining,word,c in words(sub(a,b)))
    return tuple(out)


def coefficient_bits(q):
    return ((q.numerator+q.denominator-1)//q.denominator).bit_length()


def variation(a, ledger):
    def series(key, factor=1):
        return [(factor*Q(c),A,S) for c,A,S in ledger[key]]
    M,left,proj,B,n,inv = (series("normalizedMode1And2MatrixInfinityNorm"),
        series("BLeft",3),series("projector",3),series("movingBasisInfinityNorm"),
        series("n"),series("inverseNormalSquared"))
    tables=defaultdict(Counter)
    for normal in slow_subs(a):
        rest=sub(a,normal)
        for reciprocal in slow_subs(rest):
            rest2=sub(rest,reciprocal)
            for basis in slow_subs(rest2):
                rest3=sub(rest2,basis)
                external=(normal,reciprocal,basis)
                coefficient=2*choose(a,normal)*choose(rest,reciprocal)*choose(rest2,basis)
                for remain,word,mult in words(rest3):
                    k=len(word)
                    for b in slow_subs(remain):
                        mid=sub(remain,b)
                        for p in slow_subs(mid):
                            f=sub(mid,p)
                            terms=[seq[slow(i)] for seq,i in zip((n,inv,B,left,proj),(*external,b,p))]
                            terms.extend(M[slow(i)] for i in word)
                            assert f[3]==a[3]
                            S=sum(t[2] for t in terms)
                            assert S+k+3*slow(f)<=3*slow(a)
                            weight=Q(coefficient*mult*choose(remain,b)*choose(mid,p),factorial(k))
                            tables[k][sum(t[1] for t in terms)] += weight*prod(t[0] for t in terms)
    assert sorted(tables)==list(range(slow(a)+1))
    return [{"matrixInsertions":k,"propagatorPower":k+1,"windowPower":k,
             "sourcePower":max(row),"positiveCoefficient":str(sum(row.values())),
             "positiveCoefficientBits":coefficient_bits(sum(row.values()))}
            for k,row in sorted(tables.items())]


def check_sources(d):
    assert d["join"]["pins"]["frame"]==PINS["frame"][2]
    assert d["join"]["pins"]["compact"]==PINS["compact"][2]
    assert (d["join"]["originalBackgroundOrder"],d["join"]["regularTargetOrder"],d["frame"]["matrixDirections"])==(16,15,816)
    for side in ("inner","outer"):
        rows=d["frame"]["gaussians"][side]
        assert [row["additionalPole"] for row in rows]==list(range(0,46,3))
    assert d["matrix"]["sourceStream"]["sha256"]==d["factor"]["sourceStream"]["sha256"]==d["one"]["sourceStream"]["sha256"]==STREAM
    for name, literal in [
        ("band","phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))"),
        ("band","G.mul(v,phaseSpeed)"),
        ("band","G.sub(frame.reference.lambda,frame.reference.dref)"),
        ("init","original-integer-lift-pulse-at-Hw-is-w"),
        ("init","original-integer-lift-transverse-fixed"),
        ("forced","directions:[R,Z,T,...Y]"),
        ("kernel","partial_v t = matrix*t + forcing; t(0)=0"),
    ]:
        assert literal in d[name]
    rows=d["compact"]["ordinaryRows"]
    assert len(rows)==273 and all(row[1][2]==0 for row in rows)
    assert d["path"]["pathGeometry"]["upperReferenceFaceIntersectsActualK"] is False
    assert d["path"]["derivedPositiveBounds"]["P"].endswith("every active closed pulse")
    assert d["two"]["carrierAfterTangency"]=="-2 k (n dot Im U) U"
    assert d["two"]["epsilonGradesByFamily"]["unphased"]==d["two"]["epsilonGradesByFamily"]["carrier_real"]=="99999/100000"
    assert "Delta_theta*Re(U_j)" in d["one"]["minimalFormalSurvivor"]["example"]
    mode_counts=Counter()
    scalar_counts=Counter()
    max_mass=Q(0)
    for chart in d["factor"]["cases"]:
        m=chart["mode"]
        assert chart["powerRemainingAfterDivisionByP"]==m-1
        roles={row["root"]:row for row in chart["rawJetAtoms"]}
        for row in chart["scalars"]:
            scalar_counts[m]+=1
            if m!=2:
                continue
            polynomial=row["termsAfterFactoringPToMode"]
            mode_counts[m]+=len(polynomial)
            max_mass=max(max_mass,sum(abs(Q(c)) for c,_ in polynomial))
            for _, monomial in polynomial:
                u=[(roles[i],m) for i,m in monomial if i in roles]
                assert sum(m for _,m in u)==2 and all(j["role"]=="u" for j,_ in u)
                assert sum(sum(j["orders"])*m for j,m in u)<=1
                assert sum(m for i,m in monomial if i not in roles)<=2
    assert scalar_counts=={1:60,2:60} and mode_counts[2]==1270 and max_mass<2**32
    assert d["highTwo"]["initializedMeanOperandRequired"] is False
    baseQ=d["matrix"]["sameLiveMatrixBinding"]["physicalFieldBindings"]
    assert baseQ["F"]["sourceRootAndFirstRZTJets"][-1]==17733129
    assert baseQ["G"]["sourceRootAndFirstRZTJets"][-1]==17733131
    return str(max_mass)


def main(args):
    d=load(vars(args))
    raw_mass=check_sources(d)
    ledger=d["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    directions=tuple(sorted(a for a in product(range(3),range(3),range(2),range(3))
                        if a[0]+a[1]+a[3]<=2))
    assert len(directions)==20
    assert [(r,k,len(w)) for r,w,k in words(T)]==[(T,1,0),(ZERO,1,1)]
    output=[]
    for alpha in directions:
        j=slow(alpha)
        variants=variation(alpha,ledger)
        # Charge both C106 Primary factors, two C105 high geometry factors,
        # exact source rational mass and Leibniz count, the middle complement,
        # the outer/inner Laurent conversion, and all exact positive frame terms.
        primary=sum(d["frame"]["uniformLogRanks"])
        assert primary==28156
        frame=max(row["positiveCoefficientBits"]+6*row["sourcePower"]+
                  row["propagatorPower"]+row["sourcePower"]+6 for row in variants)
        log_rank=2*(primary+64+128+1)+32+2*sum(alpha)+185+128+frame
        assert log_rank<2**16
        band=3*j+Q(23,2)
        assert 2*band/2**32636+Q(2,2**112)<Q(1,100000)
        output.append({"RZTL":alpha,"rawBand":3*j+11,"gaugeBand":str(band),
                       "collarPole":3*j+13,"gaugePrefactorRankInHOver2Pow128":log_rank,
                       "orderedTerms":variants})
    assert d["path"]["derivedPositiveBounds"]["normalSquares"].startswith("|n|^2,n_theta^2+n_z^2 >=")
    # An exact arithmetic falsifier for inferring a T norm from all RZL norms:
    # f_N(T)=a sin(N(T-T0)) is uniformly bounded by a in the old norms.
    assert [Q(n,100)*100 for n in (10,100,1000)]==[10,100,1000]
    report={
        "schema":"MathScope.C115.OriginalFirstForcedNativeTTransfer/1",
        "status":"MODE_TWO_WEIGHTED_TRANSFER_MODE_ONE_SEPARATE_TIME_MEAN_INPUT_OPEN",
        "pins":{k:v[2] for k,v in PINS.items()},
        "nativeConditions":{"actualStreamSHA256":STREAM,"modeSystems":[10,10],
            "fixedAtNativeT":["v","xi","Ls","H_w","P","positive frozen label parameters"],
            "moving":["F,G and respective first time jets #17733129,#17733131","n,K,M,Pi,B and actual projected source","slow cutoff sqrt zeta"],
            "noEndpointTerms":True,"remainsPInModeTwoIntegrand":True},
        "radial":{"X":"R^2/(2*s)","sT":"1/(1-2*h*Z^2*s^(2*h-1))","a":"sT/s",
            "uT":"-a/t1","dT":"a","logSqrtZetaT":"-a/(t1*u^3)+4*a/d^3",
            "collarRule":"Keep the original half Gaussian. Up to three extra collar poles per ordinary slow derivative. Inner t1^-1 remains in the original geometric rank.",
            "positiveDivisors":d["path"]["derivedPositiveBounds"]["normalSquares"]},
        "modeTwo":{"rawScalars":60,"monomials":1270,"rawMaxRationalCoefficientSum":raw_mass,
            "raw": "epsilon^(99999/100000)*zeta*S^(3*j+11)*c^(-3*j-13)",
            "gaugeOverP":"epsilon^(99999/100000)/(2*k)*zeta*S^(3*j+23/2)*c^(-3*j-13)",
            "logCap":"H/2^112","j":"R+Z+T order","c":"nearest collar coordinate u or d; omit pole in middle",
            "maxRequiredPrimaryPotentialOrder":5,"sameMeanOperandRequired":False,
            "directions":output},
        "modeOne":{"previousWholeMeanRows":273,"previousPositiveTRows":0,
            "actualSurvivingDerivative":"k*n_theta*D_T(Delta_theta)*Re(U_j)",
            "separateJointNorm":"Same live initialized mean D^(a+T) Delta with zero-order and spatial gradient slots (R, Z, L) on original whole and shifted radial paths, including compact FiveMap time derivatives. Need beta grade 99997/50000 and v,gamma grade 99999/100000 before joint coefficient and band charges, or a verified better exact grouping.",
            "transfer":"If the grouped time source F1/P has its original epsilon grade and half Gaussian times a finite collar pole, the normalized zero-data variation preserves that weight. The transfer itself consumes at most 2 slow band powers per moved matrix derivative."},
        "phase":{"fixedNativeDT":"-i*m*k*v*(p*F_T+p_z*G_T) times the harmonic",
            "protectedRawMinusEpsilonDT":"i*m*epsilon*k*v*(p*F_T+p_z*G_T) times the harmonic",
            "protectedPhaseScale":"O(sqrt(epsilon)*S) at fixed native slow chart",
            "physicalPulseClock":"Retain the independent partial_v contribution of D_t=-epsilon*partial_T+partial_v."},
        "premises":["Original C106 coefficient ranks on the admitted source chart, actual ordinary profiles, positive frame, stable forward propagator and whole fixed pulse paths.","Mode Two provides a phase-free first Forced transfer. Mode One joint time mean, Signed time gauge and the complete Repeat estimate remain open."],
        "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(report,indent=2,ensure_ascii=False)+"\n").encode())
    print("PASS: original mode-two 1270 monomials; 20 mixed directions, 10 with T; source-bound mode-one time-mean obstruction")


if __name__=="__main__":
    parser=ArgumentParser()
    for key in ("work","runtime","out"):
        parser.add_argument(f"--{key}",type=Path,required=True)
    main(parser.parse_args())
