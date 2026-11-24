"""Independent update of the exact old PostFive physical conservative residual.

Inputs are the published native Repeat attachment and the separate independently
replayed fixed-mean covariance/pressure data. This constructs a typed archive
expression, rather than mutating a native private graph or asserting ordinary
global differentiability at its atlas transitions.
"""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path

R, Z, T, ELL, Y0, Y1, TH = 17732748,17732749,17732750,17732737,17745430,17745431,17732752
A, AR, EPS, VR, CI, VT, RI = 17745446,21374099,17732744,17733068,17745449,17733069,17733137
RII = 17744228
ONE, NEG, ZERO = 1,20,0
HEAD = 22380596
OLD_V = (22153222,22153223,22153224)
OLD_P = 22153227
OLD_DIV = 22153248
OLD_R = (22153560,22153562,22153564)
OLD_ADVECTIVE = (22153530,22153544,22153558)
OLD_DV = ((22153240,22031933,22153289),(22153314,22031679,22153355),(22153380,22031944,22153245))
OLD_LV = (22153301,22153367,22153425)
OLD_TV = (22153525,22153539,22153553)
OLD_GP = (22153460,22031895,22153494)
DIRS = [R,Z,T,Y0,Y1,TH]
VALUES = [R,Z,T,ELL,Y0,Y1,TH]
OLD_BLOCK = range(22153220,22153565)
NATIVE_APPEND = "622c11be9a484374a504bda29ec9d1216a4641c130333305b339de506b7fbcaa"
NATIVE_DEFS = "9ea1a0768973c3f57761d7131291000743a0d7a1dc82b46b3fa7fa11da9af6be"
NATIVE_RECEIPT = "84c8fcd36cbabcbc57f1005084f4bbe5c37ffe81ec9212fb430ff5e2c500016a"
COV_APPEND = "e8ab3ec42669a055a9e1e39177488564082d3a300d80ee615b5e312c78660f12"
COV_DEFS = "f67efc40db18b897d4346e4773ad14b231a7aebf361628df9b0bfddecdebd90f"
MEAN_APPEND = "8197084d5f2ff4a7f21fcac82479246f652d7d7e8dee3a38e211ed66182181ba"
MEAN_DEFS = "12a741275c9d5f8dc2a2936058b3f907c036c1e0024215231354e70d820fe643"
MEAN_REPORT = "e5ce06fda068306616beca3ccc5e214e7b6188b76637c699a652ec417a9131d5"
COV_START, MEAN_START = 22382590,22387300
MEAN_ONLY_END = 22387424
OFFLINE_WAVE_IDS = range(2269,2285)


def serial(data):
    return json.dumps(data,ensure_ascii=False,separators=(",",":")).encode()+b"\n"


def checked(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return raw


def refs(op, args):
    if op in {"multiply","add","smooth_piecewise","definite_integral"}:
        return args
    if op in {"m3_coupled_expression_partial","m3_coupled_indexed_partial"}:
        return args[1]
    raise AssertionError((op,args))


def remap_node(row, remap):
    op,args = row["op"],row["args"]
    if op in {"m3_coupled_expression_partial","m3_coupled_indexed_partial"}:
        name,values,orders=args
        assert not (
            name.startswith("coupled-field:") and 29<=int(name.split(":")[1])<=32
            or name.startswith("coupled-expression:") and int(name.split(":")[1]) in OFFLINE_WAVE_IDS
        ), ("foreign waveform definition", name)
        return {"op":op,"args":[name,[remap(i) for i in values],orders]}
    return {"op":op,"args":[remap(i) for i in refs(op,args)]}


def remap_definitions(packet, remap):
    # Only the body slots depend on the relocation. Parameters, directions,
    # coordinate derivative maps and row dispatch all use the original prefix.
    if isinstance(packet,list):
        packet={"expressions":packet,"fields":[]}
    result={"expressions":[],"fields":[]}
    for ex in packet["expressions"]:
        assert all(p < HEAD for p in ex["parameters"])
        result["expressions"].append({**ex,"body":remap(ex["body"])})
    for field in packet["fields"]:
        assert all(p < HEAD for p in field["parameters"]+field["directions"])
        rows=[]
        for row in field["rows"]:
            assert all(v<HEAD for v in row["values"])
            assert row["coefficient"]<HEAD
            assert all(v<HEAD for triple in row["guards"] for v in triple)
            assert all(term["coefficient"]<HEAD for terms in row["derivativeMaps"] for term in terms)
            rows.append({**row,"localBody":remap(row["localBody"])})
        result["fields"].append({**field,"rows":rows})
    return result


class Source:
    def __init__(self, prior, raw):
        self.prior=prior
        self.raw=raw
        self.extra={}
        self.start=HEAD+len(raw)

    def get(self,index):
        return self.raw[index-HEAD] if index>=HEAD else self.prior[index]

    def n(self,op,args):
        packet={"op":op,"args":args}
        key=serial(packet)
        if key not in self.extra:
            self.extra[key]=HEAD+len(self.raw)
            self.raw.append(packet)
        return self.extra[key]

    def q(self,x):
        if x in (0,1,-1):
            return {0:ZERO,1:ONE,-1:NEG}[x]
        return self.n("rational",[str(x),"1"])

    def add(self,*items):
        result=ZERO
        for item in items:
            if item:
                result=item if result==ZERO else self.n("add",[result,item])
        return result

    def mul(self,*items):
        result=ONE
        for item in items:
            if item==ZERO:
                return ZERO
            if item!=ONE:
                result=item if result==ONE else self.n("multiply",[result,item])
        return result

    def minus(self,*items):
        return self.mul(NEG,*items)

    def partial(self, field, *axes):
        assert field["parameters"]==VALUES and field["directions"]==DIRS
        orders=[axes.count(axis) for axis in DIRS]
        assert set(axes)<=set(DIRS) and sum(orders)==len(axes)
        return self.n("m3_coupled_indexed_partial",[field["id"],VALUES,orders])


def polys(source, atoms, unfold_before=()):
    through=set(unfold_before)
    @cache
    def p(index):
        if index==ZERO:
            return {}
        if index in (ONE,NEG):
            return {():Fraction(1 if index==ONE else -1)}
        if index in atoms or index<source.start and index not in through:
            # The unchanged archived source subgraph is intentionally opaque.
            return {(index,):Fraction(1)}
        op,args=source.get(index).values()
        if op=="rational":
            value=Fraction(int(args[0]),int(args[1]))
            return {():value} if value else {}
        if op=="add":
            ar=Counter()
            for i in args:
                ar.update(p(i))
        elif op=="multiply":
            ar=Counter()
            assert len(args)==2
            for a,va in p(args[0]).items():
                for b,vb in p(args[1]).items():
                    ar[tuple(sorted((*a,*b)))]+=va*vb
        elif op=="integer_power":
            ar=Counter({():Fraction(1)})
            inp,power=args
            assert power>=0
            for _ in range(power):
                acc=Counter()
                for a,va in ar.items():
                    for b,vb in p(inp).items():
                        acc[tuple(sorted((*a,*b)))]+=va*vb
                ar=acc
        elif op.endswith("_partial"):
            return {(index,):Fraction(1)}
        else:
            raise AssertionError((op,index))
        return {k:v for k,v in ar.items() if v}
    return p


def build(archive, selected, c148, out):
    original={int(k):v for k,v in json.loads(selected.read_bytes()).items()}
    required={
        R:("coordinate",None),Z:("coordinate",None),T:("coordinate",None),TH:("coordinate",None),
        Y0:("coordinate",None),Y1:("coordinate",None),VR:("add",[1,17733067]),
        VT:("add",[20,3622]),A:("multiply",[17735154,17745444]),CI:("multiply",[17733026,17745448]),
        22153252:("multiply",[AR,22153238]),
        22153318:("multiply",[AR,22153312]),
    }
    for identity,(op,args) in required.items():
        assert original[identity]["op"]==op
        if args is not None:
            assert original[identity]["args"]==args
    araw=checked(archive/"active-repeat-indexed-append.jsonl",NATIVE_APPEND)
    native=json.loads(checked(archive/"active-repeat-indexed-definitions.json",NATIVE_DEFS))
    attach=json.loads(checked(archive/"active-repeat-indexed-attachment.json",NATIVE_RECEIPT))
    rawa=[json.loads(line) for line in araw.splitlines()]
    assert len(rawa)==1764 and len(native["fields"])==4
    shift=HEAD+len(rawa)-COV_START
    def remap(i):
        if i<HEAD:
            return i
        assert COV_START<=i<MEAN_ONLY_END, ("offline dependency",i)
        return i+shift
    covariance=c148/"offline-covariance/replay-c132"
    mean=c148/"offline-mean/replay-c132"
    sources=(("covariance",covariance,COV_APPEND,COV_DEFS),("mean",mean,MEAN_APPEND,MEAN_DEFS))
    data=[]
    definitions={}
    for label,where,an,df in sources:
        ms=remap_definitions(json.loads(checked(where/"offline-definitions.json",df)),remap)
        definitions[label]=ms
        selected_lines=checked(where/"offline-append.jsonl",an).splitlines()
        if label=="mean":
            selected_lines=selected_lines[:MEAN_ONLY_END-MEAN_START]
        for line in selected_lines:
            row=json.loads(line)
            assert all(i<HEAD or i<COV_START+len(data) for i in refs(row["op"],row["args"]))
            data.append(remap_node(row,remap))
    assert len(data)==MEAN_ONLY_END-COV_START
    graph=Source(original,[*rawa,*data])
    if len(attach["registration"]["fields"])!=4:
        raise AssertionError("Incomplete native four-field receipt")
    wave_roots=tuple(item["root"] for item in attach["registration"]["fields"])
    for root,field,summary in zip(wave_roots,native["fields"],attach["registration"]["fields"],strict=True):
        assert len(field["rows"])==162 and field["parameters"]==VALUES and field["directions"]==DIRS
        assert summary["field"]==field["id"]
        assert graph.get(root)=={"op":"m3_coupled_indexed_partial","args":[field["id"],VALUES,[0]*6]}
    v=[*OLD_V]
    w=list(wave_roots[:3])
    d=graph.partial
    add,mul,minus=graph.add,graph.mul,graph.minus
    two=graph.q(2)
    vp=[add(u,dv) for u,dv in zip(v,w,strict=True)]
    mean_raw=json.loads(checked(mean/"offline-report.json",MEAN_REPORT))["meanDelta"]
    M={key:remap(value) for key,value in mean_raw.items()}
    pressure=add(OLD_P,wave_roots[3],M["value"])

    def linear_dy(f,*axes):
        return add(d(f,Y0,*axes),mul(VR,d(f,Y1,*axes)))

    def independent_d2y(f):
        return add(d(f,Y0,Y0),mul(two,VR,d(f,Y0,Y1)),mul(VR,VR,d(f,Y1,Y1)))

    def vectors(f):
        x=add(d(f,R),mul(A,linear_dy(f)))
        th=mul(RI,d(f,TH))
        z=mul(EPS,d(f,Z))
        return (x,th,z)

    def scalar_lap(f,rder):
        rr=add(d(f,R,R),mul(two,A,linear_dy(f,R)),mul(AR,linear_dy(f)),
               mul(A,A,independent_d2y(f)))
        return add(rr,mul(RI,rder),mul(EPS,EPS,d(f,Z,Z)),mul(RI,RI,d(f,TH,TH)))

    delta_d=[vectors(f) for f in native["fields"][:3]]
    delta_scalar=[scalar_lap(f,delta_d[i][0]) for i,f in enumerate(native["fields"][:3])]
    theta_u, theta_v=(d(f,TH) for f in native["fields"][:2])
    delta_lap=(add(delta_scalar[0],minus(RI,RI,w[0]),minus(two,RI,RI,theta_v)),
               add(delta_scalar[1],minus(RI,RI,w[1]),mul(two,RI,RI,theta_u)),
               delta_scalar[2])
    delta_time=[add(minus(EPS,d(f,T)),mul(CI,add(d(f,Y1),mul(VT,d(f,Y0)))))
                for f in native["fields"][:3]]
    pa=vectors(native["fields"][3])
    delta_mean_dr=add(M["gr"],minus(17743727,M["P"]),minus(M["A0"]))
    pm=(delta_mean_dr,ZERO,mul(EPS,M["slowZDerivative"]))
    dp=tuple(add(a,b) for a,b in zip(pa,pm,strict=True))
    delta_div=add(delta_d[0][0],mul(RI,w[0]),delta_d[1][1],delta_d[2][2])
    new_div=add(OLD_DIV,delta_div)
    new_spatial=[[add(x,y) for x,y in zip(a,b,strict=True)] for a,b in zip(OLD_DV,delta_d,strict=True)]

    def contraction(a,b):
        return add(*(mul(x,y) for x,y in zip(a,b,strict=True)))

    def original_adv(u, spatial, j):
        c=contraction(u,spatial)
        if j==0:
            return add(c,minus(RI,u[1],u[1]))
        if j==1:
            return add(c,mul(RI,u[0],u[1]))
        return c

    def direct(j):
        a=original_adv(vp,new_spatial[j],j)
        return add(OLD_TV[j],delta_time[j],a,minus(EPS,add(OLD_LV[j],delta_lap[j])),
                   OLD_GP[j],dp[j],mul(vp[j],new_div))

    def change(j, omit=None):
        c=contraction(v,delta_d[j])
        ww=contraction(w,delta_d[j]) if omit!="quadratic-transport" else ZERO
        a=add(c,contraction(w,OLD_DV[j]),ww)
        if j==0:
            a=add(a,minus(RI,two,v[1],w[1]),minus(RI,w[1],w[1]))
        if j==1:
            a=add(a,mul(RI,v[0],w[1]),mul(RI,w[0],v[1]),mul(RI,w[0],w[1]))
        p=add(dp[j],M["A0"]) if j==0 and omit=="pressure-cutoff" else dp[j]
        vis=delta_lap[j]
        if j==0 and omit=="radial-vector-connection":
            vis=add(vis,mul(two,RI,RI,theta_v))
        return add(OLD_R[j],delta_time[j],a,minus(EPS,vis),p,
                   mul(v[j],delta_div),mul(w[j],OLD_DIV),mul(w[j],delta_div))

    atoms=set(OLD_V)|set(OLD_GP)|set(OLD_TV)|set(OLD_LV)|{OLD_DIV}
    atoms |= {i for row in OLD_DV for i in row}
    frozen=[*range(HEAD,graph.start)]
    frozen.remove(M["fullRadialDerivative"])
    # Expand only the archived pressure arithmetic of the derivative lift.
    # Do not open new field applications or nested integral binders.
    def follow_mean_operators(index):
        if index in {M["gr"],M["P"],M["A0"],M["auxiliaryLeft"],M["auxiliaryWhole"]} or index<HEAD:
            return
        op,args=graph.get(index).values()
        if op in {"add","multiply"}:
            if index in frozen:
                frozen.remove(index)
            for child in args:
                follow_mean_operators(child)
    follow_mean_operators(M["fullRadialDerivative"])
    atoms.update(frozen)
    # The archived inverse radial factor alpha*chi is a pre-multiplied root.
    # Give it the exact decomposition before comparing cancellations.
    assert graph.prior[17754219]=={"op":"multiply","args":[17743734,A]}
    atoms.discard(17754219)
    polynomial=polys(graph,atoms,(*OLD_BLOCK,17754219,*[i for i in range(HEAD,graph.start) if i not in atoms]))
    assert polynomial(M["fullRadialDerivative"])==polynomial(delta_mean_dr), "C148 shifted radial product-rule replay"
    # Validate the three original archived equations in their own namespace
    # before relying on their exact split as predecessor terms.
    for j in range(3):
        check=add(OLD_TV[j],original_adv(v,OLD_DV[j],j),minus(EPS,OLD_LV[j]),OLD_GP[j],mul(v[j],OLD_DIV))
        assert polynomial(OLD_R[j])==polynomial(check), ("original physical PDE",j)
        assert graph.get(OLD_R[j])["args"][0]==OLD_ADVECTIVE[j]
    atoms2=atoms-{OLD_DIV}
    p2=polys(graph,atoms2,OLD_BLOCK)
    assert p2(OLD_DIV)==p2(add(OLD_DV[0][0],mul(RI,v[0]),OLD_DV[1][1],OLD_DV[2][2]))
    direct_roots=tuple(direct(j) for j in range(3))
    changed_roots=tuple(change(j) for j in range(3))
    for a,b in zip(direct_roots,changed_roots,strict=True):
        assert polynomial(a)==polynomial(b), "new physical PDE recomposition"
    for omitted in ("quadratic-transport","pressure-cutoff","radial-vector-connection"):
        assert polynomial(change(0,omitted))!=polynomial(changed_roots[0]), omitted

    candidate={"schema":"MathScope.C149.ArchivePhysicalConservativeResidualCandidate/1",
               "nativeIncrementRoots":wave_roots,"oldVelocity":OLD_V,"oldPressure":OLD_P,
               "newVelocity":vp,"newPressure":pressure,"oldDivergence":OLD_DIV,
               "deltaDivergence":delta_div,"newDivergence":new_div,
               "deltaMeanPressure":M["value"],"deltaPressureGradient":dp,
               "nativeVelocityDerivativeOrdersThrough":2,
               "oldSpatialDerivativeRoots":OLD_DV,
               "directConservativeResidual":direct_roots,"incrementConservativeResidual":changed_roots,
               "nodeCount":HEAD+len(graph.raw),"nativeSuffixCount":len(rawa),
               "relocatedOfflineMeanAndCovarianceCount":len(data),
               "constructedOperatorCount":len(graph.raw)-len(data)-len(rawa),
               "constructionAssumptions":["same physical original chart with ordinary differential semantics",
                    "C148 covariance is the exact angular mean of this native increment on the entire claimed support",
                    "C148 original fixed-mean pressure refresh applies; no other mean correction yet"],
               "physicalAllDomainAdmission":"OPEN","wholeResidualZero":False,
               "privateLiveSeal":False,"finalJets":0,"release":"HOLD"}
    new=b"".join(serial(row) for row in graph.raw[len(rawa):])
    candidate["appendSHA256"]=sha256(new).hexdigest()
    out.mkdir(parents=True,exist_ok=True)
    (out/"relocated-covariance-mean-operator.jsonl").write_bytes(new)
    (out/"relocated-definitions.json").write_bytes(serial(definitions))
    (out/"candidate.json").write_bytes(serial(candidate))
    print(serial(candidate).decode())


if __name__=="__main__":
    cli=ArgumentParser(description=__doc__)
    for name in ("archive","selected","c148","out"):
        cli.add_argument(name,type=Path)
    args=cli.parse_args()
    build(args.archive,args.selected,args.c148,args.out)
