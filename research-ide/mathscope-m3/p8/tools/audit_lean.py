#!/usr/bin/env python3
"""Fresh, fail-closed P8 Lean consumer audit; requires the pinned CI Lake environment.

No installation and no inherited JSON authority. A successful serialized audit is
still untrusted after transport and must be independently replayed by its consumer.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

STANDARD = {"propext", "Classical.choice", "Quot.sound"}
PREFIX = "MathScope.P8."
MODULES = ["MathScope.M1.Arithmetic.Algebra", "MathScope.M1.Arithmetic.Precision", "MathScope.P8.Finite", "MathScope.P8.Generated"]
TARGETS = [
    ("inherited_d_squared", "FINITE_CHAIN_D_SQUARED", "UNIVERSAL_INTEGER_CHAIN_IDENTITY", "Finite"),
    ("inherited_unit_contraction", "FINITE_UNIT_CONTRACTION", "UNIVERSAL_INTEGER_CHAIN_IDENTITY", "Finite"),
    ("inherited_precision_reduction", "PRECISION_REDUCTION", "UNIVERSAL_WITH_PRINTED_HYPOTHESES", "Finite"),
    ("trace_cayley_hamilton", "TRACE_CAYLEY_HAMILTON", "UNIVERSAL_INTEGER_MATRIX_IDENTITY", "Finite"),
    ("matrix_trace_recurrence", "TRACE_RECURRENCE", "UNIVERSAL_INTEGER_MATRIX_IDENTITY", "Finite"),
    ("residue_625_unique", "BOUNDED_RECONSTRUCTION", "FIXED_MODULUS_WITH_PRINTED_BOUND_HYPOTHESES", "Finite"),
    ("finite_euler_regrouping", "FINITE_EULER_REGROUPING", "UNIVERSAL_FINITE_RING_IDENTITY", "Finite"),
    ("Generated.point_count_certificate", "ELLIPTIC_F5_COUNT", "FINITE_FIXTURE", "Generated"),
    ("Generated.prime_and_smooth_fixture", "ELLIPTIC_F5_PRIME_SMOOTH_RESIDUE", "FINITE_FIXTURE", "Generated"),
    ("Generated.trace_matrix_certificate", "COMPANION_TRACE_PREFIX", "FINITE_FIXTURE", "Generated"),
    ("Generated.reconstruction_certificate", "FINITE_RESIDUE_CANDIDATE_LIST", "FINITE_FIXTURE", "Generated"),
    ("Generated.finite_euler_certificate", "FINITE_EULER_PREFIX", "FINITE_FIXTURE", "Generated"),
]
NEGATIVES = ["NegativePointCount", "NegativeTrace", "NegativeResidue", "NegativeEuler", "NegativeContraction", "NegativeDifferential", "NegativePrecision", "NegativeFalse"]

def sha(data):
    return hashlib.sha256(data).hexdigest()

def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")

def strip_comments(source):
    out, i, depth = [], 0, 0
    while i < len(source):
        if source.startswith("/-", i): depth += 1; i += 2
        elif depth and source.startswith("-/", i): depth -= 1; i += 2
        elif depth:
            if source[i] == "\n": out.append("\n")
            i += 1
        elif source.startswith("--", i):
            j = source.find("\n", i); i = len(source) if j < 0 else j
        else: out.append(source[i]); i += 1
    if depth: raise ValueError("Unterminated source comment")
    return "".join(out)

def imports(source):
    source = strip_comments(source)
    result = [] if re.search(r"^\s*prelude\b", source, re.M) else ["Init"]
    for line in source.splitlines():
        line = line.strip()
        if not line or line in {"module", "prelude"}: continue
        match = re.fullmatch(r"(?:(?:public|private|meta)\s+)*import\s+(.+)", line)
        if not match: break
        result.extend(x for x in match[1].split() if x != "all" and re.fullmatch(r"[A-Za-z_][\w.]*", x))
    return sorted(set(result))

def target_manifest():
    return [{"name":PREFIX+name,"propositionId":"P8.FINITE."+pid,"scope":scope,
             "sourceFile":f"lean/MathScope/P8/{module}.lean"} for name,pid,scope,module in TARGETS]

def audit_source():
    lines = ["import MathScope.P8.Generated", "", "set_option pp.fullNames true", "set_option pp.universes false", ""]
    for row in target_manifest():
        name = row["name"]
        lines += [f'#eval IO.println "P8_AUDIT_BEGIN {name}"',f"#check {name}",f"#print axioms {name}",f'#eval IO.println "P8_AUDIT_END {name}"',""]
    return "\n".join(lines)

def parse_targets(log, expected=None):
    """Markers and exact target set prevent missing/duplicate/truncated log acceptance."""
    expected = expected or [row["name"] for row in target_manifest()]
    matches = list(re.finditer(r"^P8_AUDIT_BEGIN ([\w.]+)\r?\n(.*?)^P8_AUDIT_END \1\r?$",log,re.M|re.S))
    if [m[1] for m in matches] != expected or len(set(expected)) != len(expected):
        raise ValueError("Missing, duplicate, reordered, or unexpected audit target")
    leftover = log
    for m in reversed(matches): leftover = leftover[:m.start()] + leftover[m.end():]
    if leftover.strip(): raise ValueError("Unexpected output outside target audit blocks")
    rows=[]
    for match in matches:
        name, block = match[1], match[2].strip()
        pattern = r"^(.+?)\n'"+re.escape(name)+r"' (?:does not depend on any axioms|depends on axioms:\s*\[([^]]*)\])$"
        parsed = re.fullmatch(pattern,block,re.S)
        if not parsed: raise ValueError("Malformed or missing target type/axiom report: "+name)
        statement=parsed[1].strip()
        if not re.match(re.escape(name)+r"(?:\.\{|\s|\s*:)",statement) or ":" not in statement:
            raise ValueError("Wrong declaration type for "+name)
        axioms=[] if parsed[2] is None else [a.strip() for a in parsed[2].split(",")]
        if any(not re.fullmatch(r"[A-Za-z_][\w.]*",a) for a in axioms) or len(set(axioms))!=len(axioms):
            raise ValueError("Malformed/duplicate axiom set")
        custom=sorted(set(axioms)-STANDARD)
        if custom: raise ValueError("Unexpected custom axiom: "+repr(custom))
        rows.append({"name":name,"type":statement,"typeSha256":sha(statement.encode()),
                     "axioms":{"all":sorted(axioms),"standard":sorted(axioms),"custom":[]}})
    return rows

def source_manifest(base):
    paths = sorted((base/"lean").glob("*.lean")) + sorted((base/"lean/MathScope").rglob("*.lean"))
    paths += [base/"lean/lean-toolchain",base/"lean/pins.json",base/"lean/finite-input.json",base/"finite-certificates.mjs",base/"tools/generate_finite.mjs",Path(__file__).resolve()]
    return [{"path":p.relative_to(base).as_posix(),"sha256":sha(p.read_bytes())} for p in sorted(set(paths),key=lambda p:p.relative_to(base).as_posix())]

def check_static(base):
    pins=json.loads((base/"lean/pins.json").read_text(encoding="utf-8"))
    if (base/"lean/lean-toolchain").read_text(encoding="utf-8").strip()!=pins["leanToolchain"]: raise ValueError("Lean toolchain pin mismatch")
    if pins["mathlibCommit"] not in (base/"lean/lakefile.lean").read_text(encoding="utf-8"): raise ValueError("Mathlib lakefile pin mismatch")
    for row in pins["inheritedSources"]:
        if sha((base/row["path"]).read_bytes())!=row["sha256"]: raise ValueError("Inherited source changed: "+row["path"])
    if (base/"lean/Audit.lean").read_text(encoding="utf-8")!=audit_source(): raise ValueError("Audit consumer list differs from generated target manifest")
    for row in source_manifest(base):
        if not row["path"].endswith(".lean"): continue
        source=strip_comments((base/row["path"]).read_text(encoding="utf-8"))
        if re.search(r"\b(?:sorry|admit|axiom|unsafe|native_decide|implemented_by)\b",source): raise ValueError("Forbidden source construct: "+row["path"])
    return pins

def command(args,cwd,output,name,timeout=600,check=True):
    started=time.monotonic()
    run=subprocess.run(args,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=timeout)
    log=run.stdout.decode("utf-8",errors="strict")
    (output/(name+".log")).write_bytes(run.stdout)
    row={"command":list(map(str,args)),"exitCode":run.returncode,"seconds":round(time.monotonic()-started,6),"logFile":name+".log","logSha256":sha(run.stdout)}
    if check and run.returncode: raise RuntimeError(name+" failed: "+log[-5000:])
    return row,log

def closure_manifest(lean,lean_root):
    mathlib=lean/".lake/packages/mathlib"
    packages=sorted(p for p in (lean/".lake/packages").iterdir() if p.is_dir())
    sources=[lean,mathlib,lean_root/"src/lean"]+packages
    artifacts=[lean/".lake/build/lib/lean",mathlib/".lake/build/lib/lean",lean_root/"lib/lean"]+[p/".lake/build/lib/lean" for p in packages]
    todo=MODULES.copy();seen={}
    while todo:
        module=todo.pop()
        if module in seen: continue
        rel=Path(*module.split("."))
        source=next(((r/rel).with_suffix(".lean") for r in sources if (r/rel).with_suffix(".lean").is_file()),None)
        artifact=next(((r/rel).with_suffix(".olean") for r in artifacts if (r/rel).with_suffix(".olean").is_file()),None)
        if source is None or artifact is None: raise ValueError("Unresolved source/compiled import: "+module)
        imported=imports(source.read_text(encoding="utf-8"));compiled=[]
        for ext in [".olean",".olean.private",".ir"]:
            path=artifact.with_suffix(ext)
            if path.exists():compiled.append({"kind":ext,"sha256":sha(path.read_bytes())})
        seen[module]={"module":module,"sourceSha256":sha(source.read_bytes()),"imports":imported,"compiledArtifacts":compiled}
        todo.extend(x for x in imported if x!=module)
    return {"modules":[seen[k] for k in sorted(seen)],"unresolved":[]}

def main():
    parser=argparse.ArgumentParser();parser.add_argument("--output",type=Path);parser.add_argument("--check-static",action="store_true")
    args=parser.parse_args();base=Path(__file__).resolve().parents[1];lean=base/"lean"
    if args.check_static:
        check_static(base);print("Static source/pin checks passed; Lean has not been executed.");return
    output=(args.output or base/"evidence/lean-audit").resolve();output.mkdir(parents=True,exist_ok=True)
    result={"schema":"MathScope.M3.P8.LeanAudit/1","status":"FAILED","serializedAuthority":"UNTRUSTED_REQUIRES_REEXECUTION","checkedAt":dt.datetime.now(dt.timezone.utc).isoformat(),"wholeP8Complete":False,"wholeM3Complete":False,"globalRHProved":False,"globalBSDProved":False,"formalScope":"Only the exact printed consumer declarations; no geometric comparison or infinite conjecture bridge.","targets":[],"negativeControls":[]}
    try:
        pins=check_static(base);before=source_manifest(base)
        command(["node",str(base/"tools/generate_finite.mjs"),"--check"],lean,output,"generated-input-check")
        _,version=command(["lake","env","lean","--version"],lean,output,"lean-version")
        if not re.search(r"version\s+"+re.escape(pins["leanVersion"])+r"(?:\D|$)",version) or pins["leanCommit"][:12] not in version: raise ValueError("Unexpected Lean version/commit")
        _,prefix=command(["lake","env","lean","--print-prefix"],lean,output,"lean-prefix")
        lean_root=Path(prefix.strip());mathlib=lean/".lake/packages/mathlib"
        _,commit=command(["git","rev-parse","HEAD"],mathlib,output,"mathlib-commit")
        if commit.strip()!=pins["mathlibCommit"]:raise ValueError("Mathlib checkout pin mismatch")
        builds=[]
        for module in MODULES:
            relative=Path(*module.split("."));source=relative.with_suffix(".lean");out=Path(".lake/build/lib/lean")/relative.with_suffix(".olean")
            (lean/out).parent.mkdir(parents=True,exist_ok=True)
            row,_=command(["lake","env","lean","-o",str(out),str(source)],lean,output,"build-"+module)
            row.update(module=module,sourceFile=str(source).replace("\\","/"),sourceSha256=sha((lean/source).read_bytes()),oleanSha256=sha((lean/out).read_bytes()));builds.append(row)
        audit_run,log=command(["lake","env","lean","Audit.lean"],lean,output,"fresh-consumer-audit")
        targets=parse_targets(log)
        for row,meta in zip(targets,target_manifest()):row.update(meta,sourceSha256=sha((base/meta["sourceFile"]).read_bytes()))
        controls=[]
        for name in NEGATIVES:
            row,negative_log=command(["lake","env","lean",name+".lean"],lean,output,name,check=False)
            # Dependency/transport failures are not evidence that a false proposition was rejected.
            semantic="Tactic `decide` proved that the proposition" in negative_log and "is false" in negative_log
            if row["exitCode"]==0 or not semantic or name+".lean:" not in negative_log: raise ValueError("Negative control lacked expected semantic rejection: "+name)
            row.update(name=name,expectedRejected=True,rejected=True,sourceSha256=sha((lean/(name+".lean")).read_bytes()));controls.append(row)
        closure=closure_manifest(lean,lean_root);closure_bytes=canonical(closure)+b"\n";(output/"import-closure.json").write_bytes(closure_bytes)
        after=source_manifest(base)
        if before!=after:raise ValueError("Sources changed during audit")
        runtime=lean_root/"lib/lean/libleanshared.so"
        environment={"leanVersion":version.strip(),"leanCommit":pins["leanCommit"],"mathlibCommit":commit.strip(),"leanBinarySha256":sha((lean_root/"bin/lean").read_bytes()),"runtimeLibrarySha256":sha(runtime.read_bytes()),"lakeManifestSha256":sha((lean/"lake-manifest.json").read_bytes()),"importClosureSha256":sha(closure_bytes),"importedModuleCount":len(closure["modules"]),"kernelModified":False,"runtimeModified":False}
        result.update(status="KERNEL_CHECKED_FINITE_SCOPES",targets=targets,builds=builds,consumerAudit=audit_run,negativeControls=controls,sourceFiles=before,sourceManifestSha256=sha(canonical(before)),inputManifestSha256=sha((lean/"finite-input.json").read_bytes()),consumerManifest=target_manifest(),consumerManifestSha256=sha(canonical(target_manifest())),environment=environment,absenceOfSorry=True,customAxioms=[])
    except Exception as exc:
        result["error"]={"type":type(exc).__name__,"message":str(exc)}
    (output/"audit.json").write_bytes(json.dumps(result,ensure_ascii=False,indent=2,allow_nan=False).encode()+b"\n")
    print(result["status"])
    if result["status"]!="KERNEL_CHECKED_FINITE_SCOPES":print(result.get("error"),file=sys.stderr);raise SystemExit(1)

if __name__=="__main__":main()
