#!/usr/bin/env python3
"""Source-bound, read-only M3/M4 original acceptance audit. Never promotes status."""
import hashlib, json, os, pathlib, sys, datetime

ROOT=pathlib.Path(__file__).resolve().parents[3]
M3="research-ide/mathscope-m3/recovery-20261019/M3_CURRENT_ORIGINAL_LEDGER.json"
M4="research-ide/mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json"
SOURCE_COMMIT="a9b3a5b317525f6d0a71e2e356b054c9d25d2e60"
EXPECTED={"m3":{"blob_sha":"4634076ded72d588c862fb8002bb1cf4e634b940","row_count":64},
          "m4":{"blob_sha":"a046586e421155f72914eb1ffbec48519b4bd2bb","row_count":16}}
def read(path):
    raw=(ROOT/path).read_bytes()
    return json.loads(raw),hashlib.sha256(raw).hexdigest(),hashlib.sha1(b"blob "+str(len(raw)).encode()+bytes([0])+raw).hexdigest()
def check(value, message):
    if not value: raise RuntimeError("FAIL_CLOSED: "+message)
def main():
    m3,h3,b3=read(M3);m4,h4,b4=read(M4)
    check(b3==EXPECTED["m3"]["blob_sha"],"original M3 ledger git blob changed")
    check(b4==EXPECTED["m4"]["blob_sha"],"original M4 matrix git blob changed")
    a=m3["rows"];b=m4["rows"]
    check(len(a)==64 and len({x["id"] for x in a})==64,"M3 denominator and uniqueness")
    check(len(b)==16 and len({x["id"] for x in b})==16,"M4 denominator and uniqueness")
    complete=[x["id"] for x in a if x.get("original_criterion_complete_inherited") is True]
    open_m3=[x["id"] for x in a if x.get("original_criterion_complete_inherited") is not True]
    check(len(complete)==62 and set(open_m3)=={"N7-06","N8-05"},"M3 original outstanding gates changed")
    counts={k:sum(x.get("status")==k for x in b) for k in ["ACCEPTED","PARTIAL","OPEN"]}
    check(counts=={"ACCEPTED":0,"PARTIAL":14,"OPEN":2},"M4 original status changed")
    check(m4["overallRelease"]=="HOLD" and m4["finalAcceptance"]=="UNCONFIRMED","release status incorrectly promoted")
    check(m4["M3"]["actualGlobalLastResolvedTau"] is None,"unproved last resolved tau")
    output={"schema":"MathScope.M3M4.SourceBoundReadOnlyAudit/1",
      "run_timestamp_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "repo_commit":os.environ.get("GITHUB_SHA"),"original_base_commit":SOURCE_COMMIT,
      "m3":{"path":M3,"sha256":h3,"git_blob_sha1":b3,"total":64,"inherited_complete":62,"open":open_m3},
      "m4":{"path":M4,"sha256":h4,"git_blob_sha1":b4,"total":16,"status_counts":counts,"rows":[{"id":x["id"],"status":x["status"],"originalAcceptance":x.get("originalAcceptance")} for x in b]},
      "source_gate":"PASS","original_mathematical_acceptance_newly_earned":0,
      "numerical_final_field_jets_authenticated":0,"N7-06":"OPEN","N8-05":"OPEN",
      "all_M3_M4_closed":False,"release":"HOLD"}
    dest=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path("audit_original_acceptance_result.json")
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(output,ensure_ascii=False,indent=2)+chr(10))
    print(json.dumps({"audit":"PASS","original_M3":"62/64","original_M4":"0/16 ACCEPTED","destination":str(dest),"release":"HOLD"}))
if __name__=="__main__":main()
