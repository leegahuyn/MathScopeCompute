"""Independent direct axial assembly, indexed chart guards and shifted pressure envelope."""
import argparse
from collections import deque
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path

from check_n2_selector_receipt import check_stage, full_graph_nodes


def check_domain(stage, directory, node):
    root = stage["scope"]["roots"]
    prefix = stage["selector"]
    registry = json.loads((directory/"original-source-functions.json").read_bytes())
    base = registry["base"]
    expressions = json.loads(base["expression"])
    monotone = json.loads(base["monotone"])
    global_fields = json.loads(base["m3GlobalFields"])
    periodic_fields = json.loads(registry["fieldDefinitions"])
    x0, eta0, left, right, xa, xb = 4756,2,28814,28824,3617,28826
    h, D, log2 = 9,22,127
    assert expressions[1]["parameters"] == expressions[672]["parameters"] == [x0,eta0]
    assert expressions[1]["body"] == 117047 and expressions[672]["body"] == 117069

    def op(i, expected):
        n = node(i)
        assert n["op"] == expected,(i,expected,n)
        return n["args"]
    def exact(i,expected,args):
        assert op(i,expected) == args,(i,expected,args)
    def q(i):
        n = node(i)
        return F(*map(int,n["args"])) if n["op"] == "rational" else None
    def flatten(i, expected):
        n = node(i)
        if n["op"] != expected:
            return [i]
        return [x for j in n["args"] for x in flatten(j,expected)]
    def other(i, expected, known):
        a,b = op(i,expected)
        assert known in (a,b),(i,expected,known)
        return b if a == known else a
    def negative(i):
        a,b = op(i,"multiply")
        if q(a) == -1:
            return b
        assert q(b) == -1,(i,a,b)
        return a
    def factor_nodes(i,expected,predicate):
        parts = op(i,expected)
        match = [j for j in parts if predicate(j)]
        assert len(match) == 1,(i,expected,parts)
        return match[0],other(i,expected,match[0])

    Q = prefix["window"]["Q"]
    ell = prefix["window"]["ell"]
    q_actual = root["referenceTime"]
    s = other(q_actual,"multiply",Q)
    sys,Z,T = op(s,"actual_monotone_root")
    chart = monotone[sys]
    assert chart["name"] == "ActualCommonBandSlowInverse" and chart["parameters"] == [Z,T]
    assert q(chart["left"]) == F(1,2) and q(chart["right"]) == 2
    assert q(chart["derivativeLower"]) == F(1,2) and q(chart["derivativeUpper"]) == 1
    u = chart["variable"]
    chart_partial = other(chart["body"],"add",next(i for i in op(chart["body"],"add") if node(i)["op"]=="multiply" and negative(i)==T))
    shifted = negative(other(chart_partial,"add",u))
    zsq, zpower = factor_nodes(shifted,"multiply",lambda i: node(i)=={"op":"integer_power","args":[Z,2]})
    [exp_body] = op(zpower,"exp")
    [log_u] = [i for i in op(exp_body,"multiply") if node(i)=={"op":"log_positive","args":[u]}]
    assert sorted(q(j) for j in op(other(exp_body,"multiply",log_u),"multiply") if q(j) is not None)==[2]
    assert h in op(other(exp_body,"multiply",log_u),"multiply")
    assert [q(i) for i in flatten(D,"add") if q(i) is not None] == [F(1,2)]
    assert any(negative(i)==h for i in flatten(D,"add") if q(i) is None)

    # Read the actual assembled stress as a scale times the three-source sum.
    actual_sum,stress_scale = factor_nodes(root["axialStress"],"multiply",lambda i:node(i)["op"]=="add")
    actual_terms = flatten(actual_sum,"add")
    assert len(actual_terms)==3
    leading_actual = next(i for i in actual_terms if node(i)["op"]=="actual_expression_partial")
    leading_system,[X,eta],zero_orders = op(leading_actual,"actual_expression_partial")
    assert zero_orders == [0,0]
    assert expressions[leading_system]["parameters"] == [x0,eta0]
    xsq, xinv = factor_nodes(X,"multiply",lambda i:node(i)["op"]=="integer_power")
    R,power = op(xsq,"integer_power")
    assert power==2
    [den_x] = op(xinv,"inverse")
    assert q(other(den_x,"multiply",s))==2
    [exp_eta] = op(other(eta,"multiply",Z),"inverse")
    [arg_eta] = op(exp_eta,"exp")
    exact(other(arg_eta,"multiply",D),"log_positive",[s])
    for coordinate, name in zip((R,Z,T),("R","Z","T")):
        [label] = op(coordinate,"coordinate")
        assert label.startswith("m3_global_band_slow_"+name+"$")

    scale_parts = op(stress_scale,"multiply")
    exponents = [op(i,"exp")[0] for i in scale_parts]
    scaled_q = next(j for j in exponents if h in op(j,"multiply"))
    exact(other(scaled_q,"multiply",h),"log_positive",[Q])
    scaled_s = next(j for j in exponents if j!=scaled_q)
    log_s, negative_exponent = factor_nodes(scaled_s,"multiply",lambda i:node(i)=={"op":"log_positive","args":[s]})
    exponent_parts = flatten(negative(negative_exponent),"add")
    assert exponent_parts.count(h)==1 and sum(q(i) for i in exponent_parts if i!=h)==1

    def forward(i,n,xx,ee):
        x,l,b,zero,inside,after = op(i,"smooth_piecewise")
        assert (x,l,b,zero,after)==(xx,left,right,0,0)
        factors = flatten(inside,"multiply")
        assert len(factors)==3 and sum(q(j)==-1 for j in factors)==1
        [inverse] = [j for j in factors if node(j)["op"]=="inverse"]
        [den] = op(inverse,"inverse")
        [radial] = op(den,"sqrt_positive")
        assert q(other(radial,"multiply",xx))==2
        [integral] = [j for j in factors if node(j)["op"]=="definite_integral"]
        density,binder,lo,hi = op(integral,"definite_integral")
        assert (lo,hi)==(left,xx) and binder not in (xx,ee,x0,eta0)
        assert node(binder)["op"]=="coordinate"
        if n==2:
            t,l,b,z,density,z2 = op(density,"smooth_piecewise")
            assert (t,l,b,z,z2)==(binder,left,right,0,0)
        sys,args,orders=op(density,"actual_expression_partial")
        assert args==[binder,ee] and orders==[0,0]
        assert expressions[sys]["parameters"]==[x0,eta0]
        if n==1:
            assert sys==1
        else:
            assert expressions[sys]["name"]=="ActualOrder2AxialResidual"
        return {"source":i,"integral":integral,"binder":binder,"actualEta":ee,"densitySystem":sys}

    def weight(i,row,qq,n):
        native,power=factor_nodes(i,"multiply",lambda j:node(j)["op"]=="actual_expression_partial")
        cutoff_system,[sigma],[order]=op(native,"actual_expression_partial")
        assert order==0 and other(sigma,"multiply",row["scale"])==qq
        [argument]=op(power,"exp")
        factors=flatten(argument,"multiply")
        assert sorted(j for j in factors if q(j) is None)==sorted([h,next(j for j in factors if node(j)=={"op":"log_positive","args":[qq]})])
        assert [q(j) for j in factors if q(j) is not None]==[2*n]
        return cutoff_system

    [template] = [d for d in expressions if d["name"]=="ActualCommonBandNormalized_Tz"]
    q0,xx,ee=template["parameters"]
    assert (xx,ee)==(x0,eta0)
    template_terms=flatten(template["body"],"add")
    assert len(template_terms)==3
    template_leading = next(i for i in template_terms if node(i)["op"]=="actual_expression_partial")
    exact(template_leading,"actual_expression_partial",[leading_system,[x0,eta0],[0,0]])
    assembled = []
    available=set(actual_terms)-{leading_actual}
    for row in prefix["activeBackgroundRows"]:
        n=row["order"]
        stress_root=row["sourceRoots"]["Tz"]
        formal_term=next(i for i in template_terms if node(i)["op"]=="multiply" and stress_root in node(i)["args"])
        assert other(formal_term,"multiply",stress_root)==row["weight"]
        formal=forward(stress_root,n,x0,eta0)
        cutoff_system=weight(row["weight"],row,q0,n)
        [actual_term]=[j for j in available if any(node(t)["op"]=="multiply" and
            any(node(v)["op"]=="actual_expression_partial" and node(v)["args"][0]==cutoff_system
                and row["scale"] in node(node(v)["args"][1][0])["args"] for v in node(t)["args"])
            for t in node(j)["args"])]
        available.remove(actual_term)
        actual_stress,actual_weight=factor_nodes(actual_term,"multiply",lambda j:node(j)["op"]=="smooth_piecewise")
        actual=forward(actual_stress,n,X,eta)
        assert actual["binder"]==formal["binder"] and actual["densitySystem"]==formal["densitySystem"]
        assert weight(actual_weight,row,q_actual,n)==cutoff_system
        cutoff=expressions[cutoff_system]
        cvar,l,b,before,_,after=op(cutoff["body"],"smooth_piecewise")
        assert cutoff["parameters"]==[cvar] and q(l)==F(1,2) and q(b)==q(before)==1 and after==0
        assembled.append({"order":n,"formal":formal,"actual":actual,"actualWeight":actual_weight,
                          "cutoffSystem":cutoff_system,"actualWeightedTerm":actual_term})
    assert not available

    # Each declared cover row is checked for both actual slow remapping and guard shapes.
    def logq(i):
        exact(i,"log_positive",[q_actual])
    def ratio(i,label):
        [qinv] = [j for j in op(i,"multiply") if j!=Q]
        [qj] = op(qinv,"inverse")
        [exponent] = op(qj,"exp")
        assert other(negative(exponent),"multiply",log2)==label
    by_label={}
    count=0
    for fields, row_count in [(global_fields,81),(periodic_fields,162)]:
        assert len(fields)==6
        for field in fields:
            assert field["parameters"][:4]==[R,Z,T,ell] and len(field["rows"])==row_count
            for row in field["rows"]:
                count += 1
                label=row["label"]["ell"]
                grid=row["label"]["grid"]
                assert row["values"][3:7]==[label,*grid]
                rr,zz,tt=row["values"][:3]
                k=other(tt,"multiply",T)
                ratio(k,label)
                exact(other(rr,"multiply",R),"sqrt_positive",[k])
                [zexp]=op(other(zz,"multiply",Z),"exp")
                exact(other(zexp,"multiply",D),"log_positive",[k])
                shell,*mesh,band=row["guards"]
                assert shell==[X,xa,xb] and len(mesh)==3
                for [guard,lo,hi],argument,index in zip(mesh,(rr,zz,tt),grid):
                    assert q(lo)==F(-3,4) and q(hi)==F(3,4)
                    neg,scaled=factor_nodes(guard,"add",lambda j:node(j)["op"]=="multiply" and index in node(j)["args"])
                    assert negative(neg)==index
                    exact(other(scaled,"multiply",argument),"integer_power",[label,6])
                guard,lo,hi=band
                assert q(lo)==F(-3,4) and q(hi)==F(3,4)
                neg,band_center=factor_nodes(guard,"add",lambda j:node(j)["op"]=="multiply" and label in node(j)["args"])
                assert negative(neg)==label
                scaled=negative(band_center)
                inverse_base,lnq=factor_nodes(scaled,"multiply",lambda j:node(j)["op"]=="inverse")
                exact(inverse_base,"inverse",[log2])
                logq(lnq)
                by_label[label]=[k,rr,zz,tt,band_center]
    assert len(by_label)==3 and count==1458

    # Independently trace the shifted pressure binders, their true torus operands,
    # and required (non-branch, non-body) axis singularity paths.
    def children(n,required=False):
        a,t=n["args"],n["op"]
        if t in ("rational","source_parameter","coordinate"):
            return []
        if t=="smooth_piecewise":
            return a[:3] if required else a
        if t=="definite_integral":
            return a[2:] if required else [a[0],*a[2:]]
        if t in ("add","multiply","maximum"):
            return a
        if t in ("inverse","log_positive","exp","integer_power","sqrt_positive","source_step_derivative","sine","cosine","ceiling"):
            return a[:1]
        if t=="actual_monotone_root":
            return a[1:]
        if t=="actual_natural_series":
            return a[1:3]
        if t in ("actual_background_even_profile","actual_background_picard"):
            return a[2:4]
        if t=="actual_quadratic_root":
            return a[2:3]
        if t in ("actual_covariance_volterra","m3_global_pulse_jet"):
            return [a[2],*a[3]]
        assert t.endswith("_partial") and len(a)==3,(t,a)
        return a[1]

    def path_to(start,predicate,required=False):
        queue=deque([start])
        previous={start:None}
        while queue:
            i=queue.popleft()
            n=node(i)
            if predicate(i,n):
                trace=[]
                while i is not None:
                    trace.append(i)
                    i=previous[i]
                return list(reversed(trace))
            for j in children(n,required):
                if j not in previous:
                    previous[j]=i
                    queue.append(j)
        return None

    stage_pressure=stage["stages"][-1]["nodes"]
    # The constructor's pressure roots precede derivative-closure appendages.
    records={}
    for i in range(stage["stages"][-2]["nodes"],root["axialResidual"]+1):
        item=node(i)
        if item["op"]=="coordinate" and item["args"][0].startswith("n6_shifted_radial_whole_global_pressure"):
            records[i]={"name":item["args"][0],"integrals":[]}
        if item["op"]=="definite_integral" and item["args"][1] in records:
            records[item["args"][1]]["integrals"].append(i)
    assert len(records)==3
    phi_at_R=None
    source_exponent=None
    fixed_envelope=None
    for binder, record in records.items():
        i,j=record["integrals"]
        body,b,lower,upper=op(i,"definite_integral")
        assert b==binder and upper==R
        other_body,b,other_lower,outer=op(j,"definite_integral")
        assert (other_body,b,other_lower)==(body,binder,lower)
        exact(lower,"sqrt_positive",[xa])
        two,sqrt_xb=factor_nodes(outer,"multiply",lambda v:q(v)==2)
        exact(sqrt_xb,"sqrt_positive",[xb])
        assert fixed_envelope is None or fixed_envelope==[lower,outer]
        fixed_envelope=[lower,outer]

        trace=path_to(body,lambda _,v:v["op"]=="m3_aux_indexed_partial" and v["args"][1][0]==binder)
        _,values,_=op(trace[-1],"m3_aux_indexed_partial")
        assert values[:4]==[binder,Z,T,ell]
        Y0,Y1=periodic_fields[0]["parameters"][-2:]
        delta=other(values[4],"add",Y0)
        component=other(values[5],"add",Y1)
        vy=other(component,"multiply",delta)
        one_minus_sqrt2=flatten(vy,"add")
        [sqrt2]=[negative(v) for v in one_minus_sqrt2 if q(v) is None]
        [two]=op(sqrt2,"sqrt_positive")
        assert q(two)==2 and [q(v) for v in one_minus_sqrt2 if q(v) is not None]==[1]

        # The exact source shift is Phi(binder)-Phi(R), with the same coefficient and exponent.
        a,b=op(delta,"add")
        if not (node(a)["op"]=="multiply" and any(q(v)==-1 for v in node(a)["args"])):
            a,b=b,a
        phi_R=negative(a)
        assert phi_at_R is None or phi_at_R==phi_R
        phi_at_R=phi_R
        parts=op(phi_R,"multiply")
        common=set(parts)&set(op(b,"multiply"))
        assert len(common)==1
        coef=common.pop()
        def radial_exponent(phi,coord):
            term=other(phi,"multiply",coef)
            [exponent]=op(term,"exp")
            logarithm, exponent_value=factor_nodes(exponent,"multiply",lambda t:node(t)["op"]=="log_positive")
            [argument]=op(logarithm,"log_positive")
            exact(other(argument,"multiply",coord),"sqrt_positive",[Q])
            return exponent_value,logarithm
        dR,required_log=radial_exponent(phi_R,R)
        dr,_=radial_exponent(b,binder)
        assert dr==dR and (source_exponent is None or dR==source_exponent)
        source_exponent=dR
        record.update({"body":body,"fixedEnvelope":[lower,outer],"sampleIndexedCall":trace[-1],
                       "shiftedActuals":values,"shift":delta,"originalRadialPrimitive":phi_R})
    assert stage_pressure>max(v["integrals"][-1] for v in records.values())

    # Fixed mean bump normalization, one actual inverse on the pressure paths.
    rho_mass=1462830
    mass_body,mass_binder,mass_lo,mass_hi=op(rho_mass,"definite_integral")
    assert [mass_lo,mass_hi]==fixed_envelope
    bump,den_inv=factor_nodes(mass_body,"multiply",lambda i:node(i)["op"]=="smooth_piecewise")
    [den]=op(den_inv,"inverse")
    mass_scale,x_mean=factor_nodes(den,"multiply",lambda i:node(i)=={"op":"sqrt_positive","args":[s]})
    root_mean,exponential=factor_nodes(x_mean,"multiply",lambda i:node(i)["op"]=="sqrt_positive")
    [half]=op(exponential,"exp")
    assert q(half)==F(1,2)
    [twice_mean]=op(root_mean,"sqrt_positive")
    two,x0mean=factor_nodes(twice_mean,"multiply",lambda i:q(i)==2)
    exact(x0mean,"source_parameter",["X0Imean"])
    arg,zero,one,lower,interior,upper=op(bump,"smooth_piecewise")
    assert zero==lower==upper==0 and q(one)==1
    ten,minus_one=factor_nodes(arg,"multiply",lambda i:q(i)==10)
    mneg,scaled_binder=factor_nodes(minus_one,"add",lambda i:q(i)==-1)
    assert other(scaled_binder,"multiply",mass_binder)==den_inv
    [seed_exp]=op(interior,"exp")
    [product]=op(negative(seed_exp),"inverse")
    one_minus=other(product,"multiply",arg)
    assert negative(other(one_minus,"add",one))==arg
    exact(1462831,"inverse",[rho_mass])
    source=json.loads(base["fixed"])["source"]["parametersExactExpressions"]
    assert source["X0Imean"]=={"product":[{"ref":"XR"},{"exp":{"sum":[{"ref":"T"},
        {"integer":2},{"product":[{"integer":60},{"ref":"BOuter"}]},{"integer":-8}]}}]}
    assert F(1)+2*F(1,10)<5

    inverse_paths={}
    log_paths={}
    for name,i in root.items():
        inv=path_to(i,lambda _,v:v=={"op":"inverse","args":[R]},True)
        log=path_to(i,lambda j,_:j==required_log,True)
        if inv:
            inverse_paths[name]=inv
        if log:
            log_paths[name]=log
    assert {"radialPressureGradient","radialResidual","angularResidual","axialResidual"}==inverse_paths.keys()
    assert set(log_paths)==set(inverse_paths)
    assert inverse_paths["axialResidual"][-1]==1452232
    assert other(inverse_paths["axialResidual"][-2],"multiply",1452232)==root["axialStress"]

    return {
        "scope":"Exact direct N2 axial stress assembly and actual positive radial pressure binder domains under the explicit N2 reference ingress, with an exact axis countercheck.",
        "sourceChart":{"R":R,"Z":Z,"T":T,"ell":ell,"s":s,"q":q_actual,"X":X,"eta":eta,
                       "inverseSystem":sys,"referenceInputBracket":["1/2","2"]},
        "axialStress":{"root":root["axialStress"],"scale":stress_scale,"originalLeadingSource":leading_actual,
                       "template":template["body"],"actualPositiveTerms":assembled},
        "indexedRows":{"checked":count,"threeRelativeCharts":by_label,
                       "shell":[X,xa,xb],"allShellMeshAndBandOperandsExact":True},
        "shiftedPressureBinders":records,
        "positiveMeanBumpMass":{"root":rho_mass,"inverse":1462831,"binder":mass_binder,
            "mass":"(1/10)*integral_[0,1] exp(-1/(u*(1-u))) du > 0",
            "support":"X0Imean*exp(1)*(1+u/10)^2, u in [0,1], inside the fixed envelope"},
        "fixedRadialEnvelope":fixed_envelope,"envelopeImageOverWholeSBracket":["Xa/4","4*Xb"],
        "activeIndexedBodyImage":["Xa","Xb"],"strictPositiveRadialArgumentsInShiftedBodies":True,
        "requiredPathsToOuterInverseR":inverse_paths,
        "requiredPathsToOuterRadialLog":log_paths,
        "axisCountercheck":{"R":0,"eta":0,"Z":0,"T":"the admitted strict interior s>0",
            "referenceInverseRemainsAdmissible":True,"outerInverseRHasZeroDenominator":True,
            "ordinaryCartesianExtensionIndependentlyCertified":False},
        "fullPhysicalDomainClosureAudited":False,
    }


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("artifact",type=Path)
    ap.add_argument("output",type=Path)
    ap.add_argument("--executing-commit",required=True)
    args=ap.parse_args()
    assert __debug__
    stage_raw=(args.artifact/"original-n2-prefix.json").read_bytes()
    stage=json.loads(stage_raw)
    check_stage(stage,args.executing_commit)
    graph=args.artifact/"original-n2-current-pressure-graph"
    with full_graph_nodes(graph,stage) as (node,auth):
        result=check_domain(stage,graph,node)
    result.update({"schema":"MathScope.OriginalN2AxialPressureScopedDomain/1",
                   "stageSha256":hashlib.sha256(stage_raw).hexdigest(),"graphAuthentication":auth})
    args.output.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print("PASS: original N2 axial stress, 1,458 indexed guard records, six shifted pressure integrals and required axis paths.")


if __name__=="__main__":
    main()

