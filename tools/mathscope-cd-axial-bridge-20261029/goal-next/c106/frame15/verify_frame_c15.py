"""Extend original Primary frame to the complete C105 mode-one upstream census."""

from argparse import ArgumentParser
from hashlib import sha256
import inspect
import json
from math import comb
from pathlib import Path
import runpy


STAGE=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
PINS={
    "frameProgram":"72bc9342d6f3ec22f1923d9c05b4aa0a887d29e37d86b48d6b93c59d7e6b4ee9",
    "frame13":"4552e8b0b8d6d3d850b3e7c03d579ecb5fccb9efbf10df3612a0d86f0200034c",
    "chart16":"ba0830ec36ca4dcd8c7c9709e868a4523b938afc4ed0c97cb9ddbfbb160b823c",
    "dependencies":"9cec4ad5ae9860a47d4d448cf2d3b0cdce3de697d77d42a805f51711cf20a028",
    "earlyMean":"7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe",
    "premean":"0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
}


def pin(name,p):
    raw=p.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],(name,p)
    return raw


def adapt(fn,changes,globals_extra=None):
    code=inspect.getsource(fn)
    for old,new in changes:
        assert code.count(old)==1,old
        code=code.replace(old,new)
    ns={}
    exec(compile(code,inspect.getfile(fn),"exec"),{**fn.__globals__,**(globals_extra or {})},ns)
    return ns[fn.__name__]


def frame15(a):
    program=a.goal/"c104/frame13/verify_selected_frame_c13.py"
    pin("frameProgram",program)
    old=runpy.run_path(str(program))
    prior=json.loads(pin("frame13",a.goal/"c104/frame13/selected-frame-c13.json"))
    pin("chart16",a.chart14)
    # Preserve every original finite recurrence and the C13 readback.
    rec=adapt(old["coefficient_recurrence"],[
        ('== "2^3654*Hc^255"','== "2^4803*Hc^323"'),
        ('== 680','== 969'),
        ('ORDER"] = 13\'', 'ORDER"] = 15\''),
        ('"assert tested==560"','"assert tested==816"'),
        ('"range(9,14)"','"range(9,16)"'),
        ("'== 560'","'== 816'"),
        ("'== 26'","'== 30'"),
        ("'== 14',2","'== 16',2"),
        ("'range(1, 14)',1","'range(1, 16)',1"),
        ("'range(14)',3","'range(16)',3"),
        ("'range(13)',1","'range(15)',1"),
        ('== comb(16,3)==560','== comb(18,3)==816'),
        ('["51/2","53/2","105/4"]','["59/2","61/2","121/4"]'),
        ('"maximum=17"','"maximum=19"'),
        ('\'"2^3654*Hc^255"\',1','\'"2^4803*Hc^323"\',1'),
        ("'3654+factorial(15)',1","'4803+factorial(17)',1"),
        ("'255+2*15+1',1","'323+2*17+1',1"),
        ("'range(14)',1","'range(16)',1"),
        ('==17','==19'),
    ],{"PINS":{**old["PINS"],"chart14":PINS["chart16"]}})
    return rec,prior


def early_mean(a):
    demand=json.loads(pin("dependencies",a.dependencies))
    path=a.goal/"c103/initialized-mean/verify_initialized_mean.py"
    premean=a.goal/STAGE/"middle-premean-whole-path/verify_premean_whole_path.py"
    pin("earlyMean",path)
    pin("premean",premean)
    old=runpy.run_path(str(path))
    temporal,roles=old["whole_recipe"](runpy.run_path(str(premean)))
    names=old["NAMES"]
    mean=sorted({(names[i],(r,z,0,l)) for _,i,(r,z,l) in demand["meanDemands"]})
    for name,order in mean:
        temporal(name,order)
    moments,linear,products=old["compact_demand"](mean)
    for _,_,f,b,g,c,_,_ in products:
        temporal(f,b)
        temporal(g,c)
    cov=roles[0]|linear
    assert len(cov)==1213 and len(mean)==273
    assert max(sum(b[:3]) for _,b in cov)==14
    assert {x for x in cov if sum(x[1][:3])==14}=={
        ("W_rz",(0,14,0,0)),("W_rz",(0,14,0,2))}
    high={row for row in cov if sum(row[1][:3])>7 or row[1][3]>8}
    rank=adapt(old["high_covariance_rows"],[
        ("j<=10 and l<=14","j<=14 and l<=18"),
        ("outer_cost<2**23 and inner_cost<2**54","outer_cost<2**44 and inner_cost<2**88"),
        ("cover.bit_length()+54","cover.bit_length()+88"),
        ("sum(ranks)<2**16","sum(ranks)<2**17"),
        ('"H/2^112"','"H/2^111"'),
    ])
    return len(cov),high,rank,{key:max(map(sum,v)) for key,v in moments.items()}


def main(a):
    rec,prior=frame15(a)
    matrix,catalog,band,cuts,gaussian,cap=rec(a)
    assert matrix["distinctMixedMultiIndicesAudited"]==comb(18,3)==816
    for name,data in catalog.items():
        previous=prior["frame"]["coefficientRanks"][name]
        if name!="gramInverse":
            data=data[:len(previous)]
        assert json.loads(json.dumps(data))==previous,name
    assert band==["59/2","61/2","121/4"]
    assert cuts["maximumOrdinaryOrder"]==19
    assert all(gaussian[k][:14]==prior["collarGaussian"][k] for k in gaussian)
    count,high,rank,moments=early_mean(a)
    rows=rank(high,{"primaryUniformLogRanks":cap})
    result={"schema":"MathScope.C106.OriginalPrimaryFrameC15ForHighModeOne/1",
            "status":"VERIFIED_ORIGINAL_RECURRENCES_CONDITIONAL_C16_BACKGROUND_C15_TARGETS",
            "pins":PINS,"matrixDirections":816,"catalogue":catalog,"bandAtFifteen":band,
            "cutoffOrder":19,"gaussians":gaussian,"uniformLogRanks":cap,
            "upstreamPrimaryCount":count,"upstreamHighPrimaryCount":len(rows),
            "higherCovarianceRows":rows,"preFiveMapMomentDepths":moments,
            "open":["Live C16/C15 join and original high raw Forced mode-one weights and cancellation."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS mixed C15 frame, C19 cutoff, high covariance rows",len(rows))


if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    for name in ("goal","chart14","dependencies","out"):
        parser.add_argument("--"+name,required=True,type=Path)
    main(parser.parse_args())
