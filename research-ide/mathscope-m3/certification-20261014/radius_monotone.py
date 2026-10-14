#!/usr/bin/env python3
"""Source-bound analytic proof attempt; no numerical samples or ledger changes.

`PROVED` means the accompanying written proof, supported
by exact rational side conditions. It never means a Lean/kernel execution.
Source applications that still need real regular upstream functions stay open.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BASE = "research-ide/mathscope-m3/navier/"
MAXIMUM_HASH = "190f8b3abf266b728f0c3b299d71ce6d31d7bf97fcba0249a7d59842872a1e06"
DEFINITION_HASHES = [
    "a62918fe806c1c7c476fd3751b3c7db40e769658525d25a3e656e1ea42a5b55a",
    "cb14bd8cb0201d630aff22dfaf1f5b52474f44172107c3fbebc4aaa917842c3e",
    "e53efe521098aa99b855aa457a26f35edec45e6f74224d650afce71b80fec958",
]

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()

def assert_equal(a, b, message):
    if a != b:
        raise ValueError(message)

def exact_side_conditions():
    """Checks all finite arithmetic in the written universal implications."""
    s = 2**20
    m1_upper = F(5, 4) + F(1, 64)/(1-F(1, 36))
    tests = {
        "M_at_one_series_tail_ratio": F(1, 36) < 1,
        "M_at_one_squared_less_than_two": m1_upper**2 < 2,
        "large_z_threshold_square": 12**2 == 144,
        "middle_interval_variance_lower": F(1, 4) >= F(12, 48) > F(12, 64),
        "large_interval_variance_lower": F(1, 6)-F(1, 12) == F(1, 12) > F(1, 64),
        "pi_definition_lower_upper": F(4)*F(1, 2) == 2 < 4,
        "h_parameter_numerator_bound": 8002*10 > 15,
        "source_envelope_power_exceeds_2pow20": 100000 > 20,
        "lower_W_derivative_absorption": 16-10 >= 6 and 16**12 >= 2,
        "upper_W_derivative_absorption": 16**9 > 6,
        "small_variance_endpoint": s**21 > 1024,
        "large_variance_endpoint": s > 16384,
        "circle_lower_density_denominator": 2*4*2 == 16,
        "FTC_anchor_margin": 3-1 == 2,
        "full_slow_bracket_derivative": 8*F(1,16) == F(1,2),
    }
    if not all(tests.values()):
        raise AssertionError(tests)
    # M(z)=sum z^(2k)/(4^k(k!)^2). Exact coefficients of R=M(2z)/M(z)^2.
    def mul(a,b,n):
        return [sum((a[j]*b[k-j] for j in range(k+1)),F()) for k in range(n+1)]
    def inverse(a,n):
        out=[1/a[0]]
        for k in range(1,n+1): out.append(-sum((a[j]*out[k-j] for j in range(1,k+1)),F())/a[0])
        return out
    n=4
    m=[F(1),F(1,4),F(1,64),F(1,2304),F(1,147456)] # powers of z^2
    r=mul([m[k]*4**k for k in range(n+1)],inverse(mul(m,m,n),n),n)
    assert_equal(r[:2],[F(1),F(1,2)],"The removable Q(0)=1/2 coefficient changed.")
    return {"arithmetic":"EXACT_FRACTION_INTEGER_ONLY","checks":tests,"allPassed":True,
            "M_one_upper":str(m1_upper),"R_even_coefficients_through_z8":[str(x) for x in r],
            "Q_at_zero":"1/2","W_mu_at_p_or_mu_zero":"d0/sqrt(2)",
            "noQuadrature":True,"noFiniteSampleAcceptedAsProof":True}

def universal_lemmas():
    return [
        {"id":"VARIANCE_Q_POSITIVE","status":"PROVED","proofMethod":"CLASSICAL_ANALYTIC_WRITTEN",
         "statement":"For every real z, M(z)>0 and Q(z)>0; Q is real analytic including z=0, Q(0)=1/2.",
         "proof":["Normalized circle measure has E sin(theta)=0 and E sin(theta)^2=1/2.",
           "R(z)-1=Var(exp(z*sin(theta)))/M(z)^2; the variance is strictly positive for z!=0.",
           "R(0)=1,R'(0)=0,R''(0)=1; Taylor's integral remainder is Q(z)=Integral_0^1(1-s)R''(s*z)ds.",
           "The difference-quotient bound |exp(z*x)-exp(z*y)| is between |z|exp(-|z|)|x-y| and |z|exp(|z|)|x-y|.",
           "The pairwise variance formula and exp(-|z|)<=M(z)<=exp(|z|) give exp(-4|z|)/2<=Q(z)<=exp(4|z|)/2."],
         "doesNotAssume":"R_second>=0 pointwise (this unnecessary assertion is not used)."},
        {"id":"SIGNED_VARIANCE_SIMPLE_ROOT","status":"PROVED","proofMethod":"CLASSICAL_ANALYTIC_WRITTEN",
         "statement":"For every real p, positive d0 and mu>=0, W(mu,p)=d0*mu*sqrt(Q(mu*p)) has W_mu>0.",
         "proof":["m=(log M)' has m'(t)=Var_tilt(sin)>0, since the positive tilted density preserves nonconstant sine.",
           "(log R)'(z)=2*(m(2*z)-m(z)); consequently z*R'(z)>0 for z!=0.",
           "For z=mu*p!=0, W_mu=d0*R'(z)/(2*z*sqrt(Q(z)))>0.",
           "At p=0 or mu=0, the analytic removable expression gives W_mu=d0/sqrt(2)>0.",
           "Tilted density>=exp(-2|t|); the pairwise variance bound gives m'(t)>=exp(-4|t|)/2.",
           "For |mu*p|<=B, d0*exp(-10B)/sqrt(2)<=W_mu<=sqrt(2)*d0*exp(6B)."],
         "parameterRegularity":"W is real analytic in (mu,p) for real arguments; no all-order preloop source regularity follows."},
        {"id":"VARIANCE_SOURCE_BRACKET","status":"PROVED","proofMethod":"CLASSICAL_ANALYTIC_WRITTEN","scope":"UNIVERSAL_IMPLICATION_WITH_EXPLICIT_PREMISES",
         "premises":["S>=2^20","d0=1/(8S)","muMax=S^12","actual a>=1/S","actual |p2|<=S","actual bs is real","literal cutoff sigma in[0,1]","delta=exp(-S^16)"],
         "statement":"For the literal source r and all mu in[0,S^12], F=W-r has opposite endpoint signs and exp(-S^14)<F_mu<exp(S^22).",
         "proof":["The small-argument bound R(z)-1>=z^2/4 follows from Cauchy-Schwarz, E[sin(theta)*exp(z sin(theta))]>=z/2 and M(1)^2<2.",
           "For |z|>=1, the Gaussian cosine bound, e<3, pi<4 and strict monotonicity of R give R(z)-1>=sqrt(|z|)/64.",
           "At mu=S^12, V=W^2>=S^22/256 for |mu*p2|<=1; otherwise V>=S^2/4096 because |p2|^(3/2)<=S^2. Both exceed4S.",
           "vs=a+bs^2/a>=a>0 and vStar<5/2 imply the literal active cutoff r^2<3/a<=3S, hence F(muMax)>0 and F(0)<=0.",
           "Use B=S^13 in SIGNED_VARIANCE_SIMPLE_ROOT. For S>=16, S^14-10S^13>=12S>log(8sqrt(2)S), and 6S^13<S^22."],
         "sourceApplicationStatus":"UNRESOLVED_ACTUAL_PRELOOP_ENVELOPE"},
        {"id":"CIRCLE_NORMALIZATION_AND_INVERSE","status":"PROVED","proofMethod":"CLASSICAL_ANALYTIC_WRITTEN","scope":"UNIVERSAL_IMPLICATION_WITH_EXPLICIT_PREMISES",
         "premises":["actual a>0 and ts,p2 real","system0 selected exact root W=r exists","source t uses the retained removable integral","vTarget uses the same a,vs,zeta,r"],
         "statement":"The literal density is positive, has period mass1, and defines a unique global lifted inverse with the retained bracket2pi*(phase±1).",
         "proof":["For p2!=0, t=ts+(d0/p2)*(exp(z sin(theta))/M(z)-1), where z=mu*p2. At p2=0 the limit is ts+d0*mu*sin(theta).",
           "Its circle mean is ts and its variance is V=W^2=r^2. Therefore a*(1+mean(t^2))=vs+a*r^2=vTarget.",
           "The density a*(1+t^2)/(2pi*vTarget) is positive and integrates to1 over a period.",
           "phi(theta+2pi)=phi(theta)+1, phi(0)=0. Positivity makes phi a strictly increasing onto mapR->R.",
           "If n<=phase<n+1 for integer n, monotonicity puts phi(2pi*(phase-1))<=phase<=phi(2pi*(phase+1)); the unique inverse is in the original bracket."],
         "sourceApplicationStatus":"UNRESOLVED_ACTUAL_PRELOOP_AND_SYSTEM0"},
        {"id":"CIRCLE_LITERAL_DERIVATIVE_BOUNDS","status":"PROVED","proofMethod":"CLASSICAL_ANALYTIC_WRITTEN","scope":"UNIVERSAL_IMPLICATION_WITH_EXPLICIT_PREMISES",
         "premises":["VARIANCE_SOURCE_BRACKET premises","actual |ts|<=S","actual a<=S","actual vs<=S"],
         "statement":"1/(16S^2)<=phi_theta<=exp(S^38) for the literal system1.",
         "proof":["vTarget is between vs and vStar and positive; for S>=2^20, vTarget<=2S. Thus a>=1/S and pi<4 give the lower bound.",
           "vTarget>=a follows from vs>=a and the literal cutoff regimes. Thus density<=(1+t^2)/(2pi).",
           "The removable normalized-tilt derivative obeys |partial_z(exp(z sin(theta))/M(z))|<=2exp(2|z|), giving |t|<=S+2d0*S^12*exp(2S^13).",
           "For S>=2^20 this is less than exp(S^14), and 1+t^2<exp(S^38)."],
         "sourceApplicationStatus":"UNRESOLVED_ACTUAL_PRELOOP_ENVELOPE"},
        {"id":"SOURCE_SLOW_INVERSE","status":"PROVED","proofMethod":"CLASSICAL_ANALYTIC_WRITTEN","scope":"UNIVERSAL_IMPLICATION_ON_SOURCE_CHART_IMAGE",
         "premises":["actual pinned0<h<1/16","Z=s0^(1/2-h)*eta","T=s0*(1-eta^2)","s0 in[1/2,2],eta in[-1,1]"],
         "statement":"F(s)=s-Z^2*s^(2h)-T has the unique root s0 and1/2<F_s<=1 on the full retained bracket[1/2,2].",
         "proof":["Z^2<=2^(1-2h), s^(2h-1)<=2^(1-2h) on the full bracket.",
           "0<=2h*Z^2*s^(2h-1)<=2h*2^(2-4h)<8h<1/2.",
           "F(s0)=s0-s0*eta^2-s0*(1-eta^2)=0, using2D+2h=1. Monotonicity gives endpoint signs and uniqueness."],
         "boundaryScope":"The inverse extends smoothly locally at each point by F_s!=0. Eta±1 source fields require their own one-sided parameter regularity."},
    ]

def collect_tables(definitions):
    out={}
    def collect(layer):
        for key,value in layer.items():
            if key=="base": collect(value)
            elif key in ("fixed","monotone","quadratic","expression","picard") and isinstance(value,str):
                if key in out: raise ValueError("Ambiguous source registry:"+key)
                out[key]=json.loads(value)
    collect(definitions)
    return out

def verify_parameters(parameters):
    expected={
      "Md":{"integer":1048576},"T":{"sum":[{"exp":{"ref":"Md"}},{"integer":10}]},
      "h":{"exp":{"product":[{"integer":-8002},{"ref":"T"}]}},
      "sourceEnvelopeS":{"power":[{"ref":"CSelected"},100000]},
      "loopD0":{"quotient":[{"integer":1},{"product":[{"integer":8},{"ref":"sourceEnvelopeS"}]}]},
      "loopMuMax":{"power":[{"ref":"sourceEnvelopeS"},12]},
      "loopDelta":{"exp":{"product":[{"integer":-1},{"power":[{"ref":"sourceEnvelopeS"},16]}]}},
    }
    for name,value in expected.items(): assert_equal(parameters[name],value,"Changed exact source parameter:"+name)
    assert_equal(parameters["j0"],{"power":[{"ref":"h"},4]},"Changed j0")
    assert_equal(parameters["sigmaStar"],{"quotient":[{"ref":"j0"},{"integer":2000}]},"Changed sigmaStar")
    assert_equal(parameters["K"],{"power":[{"ref":"Pstar"},2]},"Changed K")
    assert_equal(parameters["Pstar"],{"exp":{"ref":"logP"}},"Changed Pstar")
    assert_equal(parameters["logP"],{"product":[{"integer":2},{"ref":"T"}]},"Changed logP")
    q=parameters["Q"]
    assert_equal(q["quotient"][1],{"power":[{"ref":"sigmaStar"},2]},"Changed Q denominator")
    factors=q["quotient"][0]["product"]
    assert_equal(int(factors[0]["integer"]),2**260,"Changed Q coefficient")
    assert_equal(factors[1],{"ref":"K"},"Changed Q K factor")
    assert_equal(parameters["BRefUpper"],{"power":[{"ref":"Q"},300]},"Changed BRefUpper")
    assert_equal(parameters["logCSelected"],{"sum":[{"product":[{"integer":10},{"log":{"sum":[{"integer":1},{"ref":"BRefUpper"}]}}]},{"power":[{"ref":"Q"},200]}]},"Changed logCSelected")
    assert_equal(parameters["CSelected"],{"exp":{"ref":"logCSelected"}},"Changed CSelected")
    return {"status":"PROVED","proofMethod":"CLASSICAL_ANALYTIC_WRITTEN_WITH_EXACT_PARAMETER_GRAPH","expressionsVerified":expected,
      "h":{"statement":"0<h<1/16","proof":"T=exp(1048576)+10>10. exp(8002T)>=1+8002T>16. Hence0<exp(-8002T)<1/16.","binary64NotUsed":True},
      "S":{"statement":"S>2^20,d0>0,muMax>0,0<delta<1",
         "proof":"Pstar>1,K>1,0<sigmaStar<1 => Q>2^260>1. logCSelected>Q^200>1 => CSelected>e>2. S=CSelected^100000>2^100000>2^20; d0,muMax,delta follow directly."}}

def source_closure(nodes,tables,root):
    """Independent body-aware lexical capture, never a serialized freeCoordinates."""
    cache={}; active=set(); unresolved={}; used=set()
    core=tables["fixed"]["core"]; eta=core["eta"]
    natural_inputs=[core[k] for k in ("h","Lambda","A","D","d","L","Ustar","Hstar","Wstar","Zstar","chi","zeta","gSquared")]
    def visit(id):
        if id in active: raise ValueError("Defining source dependency cycle:"+str(id))
        if id in cache:return cache[id]
        if id not in nodes: unresolved[id]="NODE_OUTSIDE_RETAINED_PREFIX";return frozenset()
        used.add(id); active.add(id); n=nodes[id];op=n["op"];a=n["args"]
        def union(ids):return set().union(*(visit(x) for x in ids)) if ids else set()
        if op=="coordinate":result={id}
        elif op in ("rational","source_parameter"):result=set()
        elif op in ("add","multiply","maximum","smooth_piecewise"):result=union(a)
        elif op in ("inverse","sqrt_positive","exp","log_positive","sine","cosine","ceiling","integer_power","source_step_derivative"):result=visit(a[0])
        elif op=="definite_integral":result=(set(visit(a[0]))-{a[1]})|union(a[2:])
        elif op=="actual_natural_series":result=(union(natural_inputs)-{eta})|union(a[1:3])
        elif op=="actual_monotone_root":
            d=tables["monotone"][a[0]];formal=d["parameters"]+[d["variable"]]
            result=(union([d[k] for k in ("body","left","right","derivativeLower","derivativeUpper")])-set(formal))|union(a[1:])
        elif op=="actual_quadratic_root":
            d=tables["quadratic"][a[0]];parts=d["rhs"]+sum(d["linear"],[])+sum(d["quadraticDiagonal"],[])+[d["scale"]]+sum(d.get("preconditioner",[]),[])+[d[k] for k in ("rootRadius","lipschitzUpper") if k in d]
            result=(union(parts)-{eta})|visit(a[2])
        elif op=="actual_expression_partial":
            d=tables["expression"][a[0]];result=(set(visit(d["body"]))-set(d["parameters"]))|union(a[1])
        else: unresolved[id]={"operation":op,"actualOperands":a};result=set()
        active.remove(id);cache[id]=frozenset(result);return cache[id]
    free=sorted(visit(root))
    return {"root":root,"freeCoordinateNodes":free,"freeCoordinateRows":[{"sourceNode":id,"node":nodes[id]} for id in free],
      "unknownDefiningOperators":[{"sourceNode":id,"reason":value} for id,value in sorted(unresolved.items())],
      "closureProved":not unresolved,"closedConstantProved":not unresolved and not free,"visitedNodeCount":len(used),
      "selectedNodesSHA256":digest([[id,nodes[id]] for id in sorted(used)])}

def radius_faces(nodes):
    def flatten(id):
        n=nodes[id]
        return sum((flatten(x) for x in n["args"]),[]) if n["op"]=="add" else [id]
    faces=[]
    for id in flatten(539399):
        root=id;integrals=[]
        while nodes[id]["op"]=="definite_integral":
            a=nodes[id]["args"];integrals.append({"sourceNode":id,"boundCoordinate":a[1],"lower":a[2],"upper":a[3]});id=a[0]
        a=nodes[id];assert_equal(a["op"],"sqrt_positive","FTC face lost positive square root")
        inside=nodes[a["args"][0]];assert_equal(inside["op"],"add","FTC face lost1+square")
        args=inside["args"]
        if 1 not in args:raise ValueError("FTC face lost unit")
        square=args[1] if args[0]==1 else args[0]
        assert_equal(nodes[square]["op"],"integer_power","FTC face square changed")
        assert_equal(nodes[square]["args"][1],2,"FTC face square exponent changed")
        faces.append({"sourceFace":root,"integrals":integrals,"actualBody":nodes[square]["args"][0]})
    assert_equal([Counter(len(f["integrals"]) for f in faces)[d] for d in range(4)],[3,9,9,3],"Original24-face inventory changed")
    assert_equal(sorted(f["sourceFace"] for f in faces if not f["integrals"]),[494498,499013,516218],"Original zero-dimensional anchors changed")
    return faces

def run_source(repo):
    # The shared loader pins all captured source files and graph compressed/raw
    # bytes. A changed source fails; caller graphs or mathematical flags are absent.
    from source_dag import verify_capture, open_header, stream_snapshot, pinned_json, CAPTURE_SHA, BASE as CAPTURE_BASE
    capture=verify_capture(repo)
    header=open_header(repo)
    tables=collect_tables(header["definitions"])
    for d,pin in zip(tables["monotone"],DEFINITION_HASHES):assert_equal(digest(d),pin,"Original monotone definition changed")
    assert_equal(len(tables["monotone"]),3,"Keep all3 monotone systems")
    params=verify_parameters(tables["fixed"]["source"]["parametersExactExpressions"])
    nodes={}
    for id,n in stream_snapshot(repo):
        if id<=622820:nodes[id]=n
    after_capture=verify_capture(repo)
    assert_equal(after_capture,capture,"The actual155 producer files changed during the source stream")
    source_files=pinned_json(repo/CAPTURE_BASE/"source-bytes-before.json",CAPTURE_SHA)["files"]
    selected_paths=["research-ide/mathscope-m2/navier/"+name for name in ("source-profile-data.mjs","source-profile.mjs","actual-continuation-exact-loop.mjs","actual-background-physical-seminorms.mjs","actual-continuation-exact-b8.mjs","actual-continuation-exact-b8-data.mjs")]+[BASE+"source-global-band.mjs"]
    producer_bindings=[r for r in source_files if r["path"] in selected_paths]
    assert_equal(len(producer_bindings),len(selected_paths),"Every reviewed original proof producer must be in the immutable capture")
    assert_equal(digest(nodes[539400]),MAXIMUM_HASH,"Original maximum changed")
    assert_equal(nodes[539400],{"op":"maximum","args":[1,539399]},"Original max(1,B) changed")
    faces=radius_faces(nodes)
    assert_equal(nodes[20],{"op":"rational","args":["-1","1"]},"Original eta lower endpoint changed")
    assert_equal(nodes[1],{"op":"rational","args":["1","1"]},"Original eta upper endpoint changed")
    assert_equal(nodes[215514],{"op":"sqrt_positive","args":[137008]},"Original Cartesian radius changed")
    assert_equal(nodes[346574],{"op":"multiply","args":[20,215514]},"Original negative radius changed")
    closures={"maximum":source_closure(nodes,tables,539400),"radiusSquared":source_closure(nodes,tables,137008)}
    for j,d in enumerate(tables["monotone"]):closures[f"monotone{j}Body"]=source_closure(nodes,tables,d["body"])
    return {"status":"SOURCE_VERIFIED","sourceCapture":capture,"sourceCaptureReverifiedAfterStream":True,"fullParentStreamExhaustedAndVerified":True,"fullParentNodeCount":3892594,"retainedNodeCount":len(nodes),"sourceParameters":params,
      "reviewedProducerBindings":producer_bindings,"sourcePaperSHA256":tables["fixed"]["source"]["sourcePaperSHA256"],
      "originalMaximum":{"sourceNode":539400,"node":nodes[539400],"nodeSHA256":MAXIMUM_HASH},"FTCfaces":faces,
      "sourceMonotoneDefinitions":[{"index":j,"definition":d,"definitionSHA256":DEFINITION_HASHES[j]} for j,d in enumerate(tables["monotone"])],
      "sourceClosures":closures,
      "remainingSourceLemmas":[
        {"id":"REAL_REGULAR_PRELOOP","nodes":[7450,7539],"needed":"The exact continued/B8 source E>0,a>=1/S,|p2|<=S,|ts|<=S,vs<=S on the whole actual loop rectangle. For finite order m, actual preloop bodies and cutoff must have that order; a3-jet is not all-orderC-infinity.","status":"UNRESOLVED"},
        {"id":"FTC_REAL_INTEGRABLE","nodes":[539399,494498,499013,516218],"needed":"All24 actual face bodies are real, retained face integrals finite, and every required parameter derivative may pass through them. Finite endpoint ordering alone does not prove this.","status":"UNRESOLVED"},
        {"id":"SOURCE_IMAGE_MEMBERSHIP","nodes":[622819,622820],"needed":"Every actual substituted system2 tuple lies on the declared s0/eta source image; formal uninstantiatedZ,T outside that domain are not certified.","status":"SOURCE_DOMAIN_RESTRICTION_RETAINED"}],
      "sourceApplicationUnconditionallyProved":False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument("--output",type=Path);parser.add_argument("--repo-root",type=Path,default=ROOT);parser.add_argument("--self-test",action="store_true")
    args=parser.parse_args();arithmetic=exact_side_conditions()
    if args.self_test:print(json.dumps(arithmetic,ensure_ascii=False));return
    if args.output is None:parser.error("--output DIR is required for immutable evidence")
    started=datetime.now(timezone.utc).isoformat()
    report={"schema":"MathScope.N6.RadiusMonotoneAnalyticProofAttempt/1","startedAtUTC":started,
       "arithmeticChecks":arithmetic,"analyticLemmas":universal_lemmas(),"source":run_source(args.repo_root.resolve()),
       "proofBoundary":{"trustedStandardAnalysis":["Ordinary real exp/log/trig calculus","Compact-interval differentiation of smooth integrands","Variance/Cauchy-Schwarz and Gaussian integral identities","Implicit function theorem"],
          "writtenClassicalProofPresent":True,"newLeanKernelExecuted":False,"sourceFlagsAcceptedAsProof":False,"sampledGridAcceptedAsProof":False,
          "unconditionalWholeSourceCertificate":False,"originalN601Complete":False,"originalN602Complete":False,"M3CountRaised":False}}
    report["finishedAtUTC"]=datetime.now(timezone.utc).isoformat()
    args.output.mkdir(parents=True,exist_ok=True)
    out=args.output/"radius-monotone-proof.json"
    raw=(json.dumps(report,ensure_ascii=False,indent=2)+"\n").encode()
    with out.open("xb") as file:file.write(raw)
    receipt={"schema":"MathScope.N6.RadiusMonotoneAnalyticProofReceipt/1","artifact":out.name,"artifactSHA256":hashlib.sha256(raw).hexdigest(),
       "implementationSHA256":hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),"startedAtUTC":started,"finishedAtUTC":report["finishedAtUTC"],
       "arithmeticChecksPassed":True,"unconditionalWholeSourceCertificate":False,"originalN601Complete":False,"originalN602Complete":False,"M3CountRaised":False}
    with (args.output/"execution.json").open("x",encoding="utf-8") as file:json.dump(receipt,file,ensure_ascii=False,indent=2);file.write("\n")
    print("RADIUS_MONOTONE_PROOF",json.dumps(receipt,ensure_ascii=False))

if __name__=="__main__":main()
