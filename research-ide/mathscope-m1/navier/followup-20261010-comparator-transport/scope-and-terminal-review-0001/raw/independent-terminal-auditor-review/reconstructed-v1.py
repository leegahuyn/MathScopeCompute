#!/usr/bin/env python3
"""Read-only portable audit of the *actual* protected Comparator artifact.

This checker is not itself a Comparator run. It can close the gate only when
the supplied GitHub artifact contains the required real command, kernel,
source, independent-checkout, guard, and theorem-audit evidence.
"""
from __future__ import annotations
import argparse
import base64
from datetime import datetime, timezone
from hashlib import sha1, sha256
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
import re
from zipfile import ZipFile

HERE=Path(__file__).resolve().parent
TRUST=HERE.parent/"followup-20261010-n1-final/comparator-auditor-inputs"
TERMINAL_TRUST=HERE/"terminal-auditor-inputs"
# Bind only after observing the actual new workflow run and immutable sources.
BINDING_SHA256="5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab"
RUN=JOB=MATHSCOPE=None
ORIGINAL="f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
KERNEL="cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
ARCHIVE="3d011041203acacf300d343a39673f7d233743397993797c941346ae9e5df1a8"
CONTROLLER_BLOB="c381c075256953aa7be37541c7984b6780623a09"
ALLOWED={"propext","Quot.sound","Classical.choice"}
THEOREMS=["NavierStokes.Comparator.navier_stokes_breakdown_R3","NavierStokes.Comparator.navier_stokes_breakdown_periodic"]
LAKE="/home/mathscopeverify/audit/lean-4.34.0-rc2-linux/bin/lake"
REPO="/home/mathscopeverify/audit/original-source"
EXPECTED_WARNINGS=("warning: unable to access '/home/runner/.config/git/attributes': Permission denied\n"
                   "warning: unable to access '/home/runner/.config/git/ignore': Permission denied\n")

def digest(b): return sha256(b).hexdigest()
def strip_ansi(s): return re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]","",s).replace("\r\n","\n")
def probes(s):
    found=[]
    for line in strip_ansi(s).splitlines():
        match=re.search(r'\{[^\n]*"probe"[^\n]*\}',line)
        if match:
            try: found.append(json.loads(match.group()))
            except json.JSONDecodeError: pass
    return found

def main():
    global RUN,JOB,MATHSCOPE
    ap=argparse.ArgumentParser(description=__doc__)
    group=ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--zip",type=Path)
    group.add_argument("--base64",type=Path)
    ap.add_argument("--artifact-id",type=int,required=True)
    ap.add_argument("--observation",type=Path,required=True,help="Saved read-only GitHub jobs+artifacts response")
    ap.add_argument("--extracted",type=Path,help="Optional extracted artifact directory to compare byte-for-byte")
    ap.add_argument("--output",type=Path,required=True,help="New output only; never overwritten")
    args=ap.parse_args()
    if not BINDING_SHA256:
        raise RuntimeError("PREPARING: actual production run and source binding not yet frozen")
    binding_bytes=(TERMINAL_TRUST/"actual-run-binding.json").read_bytes()
    if digest(binding_bytes)!=BINDING_SHA256:
        raise RuntimeError("Actual run binding hash mismatch")
    binding=json.loads(binding_bytes)
    RUN,JOB,MATHSCOPE=binding["runId"],binding["jobId"],binding["mathscopeCommit"]
    checks=[]
    def check(name,value,detail=None):
        checks.append({"name":name,"pass":bool(value),**({"detail":detail} if detail is not None else {})})
    def text_file(files,name): return files.get(name,b"").decode("utf-8",errors="replace")
    archive=args.zip.read_bytes() if args.zip else base64.b64decode("".join(args.base64.read_text().split()),validate=True)
    obs=json.loads(args.observation.read_text())
    exposed=[r.get("value",r).get("structuredContent",{}) for r in obs.get("results",[]) if isinstance(r,dict)]
    artifacts=[a for r in exposed for a in r.get("artifacts",[])]
    artifact=next((a for a in artifacts if a.get("id")==args.artifact_id),{})
    jobs=[j for r in exposed for j in r.get("jobs",[])]
    job=next((j for j in jobs if j.get("id")==JOB),{})
    check("GitHub artifact belongs to protected Comparator run",artifact.get("workflow_run",{}).get("id")==RUN
          and artifact.get("workflow_run",{}).get("head_sha")==MATHSCOPE
          and artifact.get("name","").startswith(f"original-comparator-terminal-{RUN}-"))
    check("download bytes match actual GitHub size and digest",artifact.get("size_in_bytes")==len(archive)
          and artifact.get("digest")=="sha256:"+digest(archive),{"bytes":len(archive),"sha256":digest(archive)})
    check("actual protected job completion observed",job.get("status")=="completed" and job.get("conclusion")=="success" and job.get("run_id")==RUN,
          {"status":job.get("status"),"conclusion":job.get("conclusion")})
    files={};members=[]
    with ZipFile(BytesIO(archive)) as z:
        check("artifact ZIP CRCs",z.testzip() is None)
        seen=set();safe=True
        for member in z.infolist():
            p=PurePosixPath(member.filename)
            ok=not p.is_absolute() and ".." not in p.parts and "\\" not in member.filename and member.filename not in seen
            seen.add(member.filename)
            safe=safe and ok
            if member.is_dir(): continue
            ok=ok and ((member.external_attr>>16)&0o170000)!=0o120000
            safe=safe and ok
            if not ok: continue
            data=z.read(member); files[member.filename]=data
            item={"name":member.filename,"bytes":len(data),"sha256":digest(data)}
            if args.extracted:
                local=args.extracted.joinpath(*p.parts)
                same=local.is_file() and local.read_bytes()==data
                check("extracted member bytes: "+member.filename,same)
                item["extractedBytesMatch"]=same
            members.append(item)
        check("safe unique archive members",safe)
    def jfile(name):
        try:return json.loads(text_file(files,name))
        except json.JSONDecodeError:return {}
    result,pins,before,after=jfile("result.json"),jfile("pins.json"),jfile("source-hashes-before.json"),jfile("source-hashes-after.json")
    baseline=json.loads((TRUST/"pinned-original-source-hashes.json").read_text())
    expected_pins=json.loads((TRUST/"pins.json").read_text())
    manifest=json.loads((TRUST/"manifest.json").read_text())
    for name,item in manifest["files"].items():
        b=(TRUST/name).read_bytes()
        check("portable trusted input hash: "+name,digest(b)==item["sha256"])
        if "gitBlobSHA1" in item:
            check("immutable Git blob: "+name,sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()==item["gitBlobSHA1"])
    ctrl=(TRUST/"protected-controller.py").read_bytes()
    check("exact historical controller blob",sha1(b"blob "+str(len(ctrl)).encode()+b"\0"+ctrl).hexdigest()==CONTROLLER_BLOB)
    for name,item in binding["files"].items():
        b=(TERMINAL_TRUST/name).read_bytes()
        check("frozen production input: "+name,digest(b)==item["sha256"]
              and sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()==item["gitBlobSHA1"])
        check("actual artifact production source: "+name,files.get(item["artifactName"])==b)
    check("artifact workflow source commit",text_file(files,"mathscope-commit.txt").strip()==MATHSCOPE)
    check("actual independent Comparator mode",result.get("mode")=="comparator" and result.get("schema")=="MathScope.ProtectedOriginalCI/1")
    check("pins are exactly the protected original pins",pins==expected_pins==result.get("pins")
          and result.get("pinsSHA256")==digest(files.get("pins.json",b"")))
    check("pinned original whole tracked source",len(before)==len(after)==len(baseline)==2669 and before==after==baseline)
    check("original tracked preservation explicitly recorded",result.get("trackedSourceBytesUnchanged") is True)
    check("original source head",text_file(files,"original-source-head.log").strip()==ORIGINAL==pins.get("commit"))
    for name,expected in expected_pins["sourceFileSHA256"].items():
        check("original pinned source: "+name,before.get(name)==after.get(name)==expected)
    check("exact original Comparator configuration",before.get(expected_pins["configuration"])==after.get(expected_pins["configuration"])==expected_pins["configurationSHA256"])
    cfg=json.loads((TRUST/"original-configuration.json").read_text())
    check("mandatory nanoda and literal targets",cfg.get("enable_nanoda") is True and cfg.get("theorem_names")==THEOREMS
          and set(cfg.get("permitted_axioms",[]))==ALLOWED and cfg.get("solution_module")=="NavierStokes.ComparatorSolution"
          and digest((TRUST/"original-configuration.json").read_bytes())==expected_pins["configurationSHA256"])
    check("official archive hash",result.get("downloadedArchiveSHA256")==pins.get("leanArchiveSHA256")==ARCHIVE)
    check("original shared kernel hash",result.get("leanKernelSHA256")==pins.get("leanKernelSHA256")==KERNEL)
    check("actual original official Lean version",text_file(files,"lean-version.log").strip()==
          "Lean (version 4.34.0-rc2, x86_64-unknown-linux-gnu, commit 6a10ac8c22beadecabdbb0919c2b50214762f91d, Release)")
    check("actual original official Lean prefix",text_file(files,"lean-prefix.log").strip()==
          "/home/mathscopeverify/audit/lean-4.34.0-rc2-linux")
    check("nonprivileged separate verification user",result.get("uid")==result.get("euid")==1002
          and "uid=1002(mathscopeverify)" in text_file(files,"identity.log")
          and "sudo" not in text_file(files,"identity.log"))
    check("no source or guard alteration reported",result.get("sourceChanges") is False and result.get("guardChanges") is False)
    check("zero original olean precondition",result.get("originalProjectOleansBeforeComparator")==[])
    steps=result.get("steps",[]); stages={x.get("label"):x for x in steps}
    check("unique recorded step labels",len(stages)==len(steps) and bool(steps))
    for stage in steps:
        label=stage.get("label","")
        check("complete executed step: "+label,stage.get("exitCode")==0 and bool(stage.get("completedUTC")))
        check("full recorded step log digest: "+label,stage.get("logSHA256")==digest(files.get(label+".log",b"")) and label+".log" in files)
    for name,key in [("Comparator","comparatorCommit"),("mathlib","mathlibCommit"),("lean4export","lean4exportCommit")]:
        check("actual dependency pin: "+name,text_file(files,"pin-"+name+".log").strip()==result.get("dependencyHeads",{}).get(name)==expected_pins[key])
    for name in ["landrun","nanoda"]:
        check("actual verification tool source pin: "+name,text_file(files,name+"-source-head.log").strip()==expected_pins[name]["commit"])
    check("actual Go version",("go version go"+expected_pins["goVersion"]+" ") in text_file(files,"go-version.log"))
    check("actual Rust version",("rustc "+expected_pins["rustVersion"]+" ") in text_file(files,"rust-version.log"))
    hashes=result.get("verificationToolSHA256",{})
    check("built verification tool hashes recorded",set(hashes)=={"landrun","nanoda_bin","lean4export"}
          and all(re.fullmatch("[0-9a-f]{64}",v or "") for v in hashes.values())
          and bool(re.fullmatch("[0-9a-f]{64}",result.get("comparatorBinarySHA256",""))))
    check("only trusted tools built before Comparator",stages.get("build-comparator-tools",{}).get("command")==[LAKE,"build","comparator","lean4export"]
          and "original-default-build" not in stages)
    check("literal allowed cache command",stages.get("cache-get",{}).get("command")==[LAKE,"exe","cache","get"])
    def guard_prefix(label):
        command=[x for x in stages.get(label,{}).get("command",[]) if not x.startswith("--unit=")]
        if "--" not in command:return [],[]
        pos=command.index("--")
        return command[:pos+1],command[pos+1:]
    protected,tail=guard_prefix("protected-comparator")
    expected_path="/home/mathscopeverify/audit/tool-bin:/home/mathscopeverify/audit/lean-4.34.0-rc2-linux/bin:/opt/mathscope-ci/go/bin:/opt/mathscope-ci/rust/bin:/usr/local/bin:/usr/bin:/bin"
    good_guard=(protected==["systemd-run","--user","--pty","--wait","--collect",
                "--property=RestrictAddressFamilies=~AF_UNIX","-E","PATH="+expected_path,
                "--working-directory="+REPO,"--"])
    check("actual required systemd address-family guard",good_guard)
    check("literal protected Comparator command",tail==[LAKE,"env",REPO+"/.lake/packages/Comparator/.lake/build/bin/comparator",expected_pins["configuration"]]
          and stages.get("protected-comparator",{}).get("cwd")==REPO and stages.get("protected-comparator",{}).get("exitCode")==0)
    gp,gt=guard_prefix("guard-preflight");lp,lt=guard_prefix("landlock-preflight")
    check("same actual guard in both negative probes",gp==lp==protected and good_guard)
    check("literal AF_UNIX negative probe",gt==["/usr/bin/python3","/opt/mathscope-ci/probe.py","unix-socket"])
    check("literal inherited Landlock negative probe",lt==["/home/mathscopeverify/audit/tool-bin/landrun","--best-effort","--ro","/","--rw","/dev","-ldd","-add-exec","--","/usr/bin/python3","/opt/mathscope-ci/probe.py","write-outside","/home/mathscopeverify/audit/forbidden-write"])
    pp=(TRUST/"protected-probe.py").read_text()
    check("negative probe enforces zero effective capabilities",'int(status["CapEff"].strip(), 16) == 0' in pp and 'os.geteuid() != 0' in pp)
    af=probes(text_file(files,"guard-preflight.log")); land=probes(text_file(files,"landlock-preflight.log"))
    check("AF_UNIX creation actually denied",any(p.get("probe")=="AF_UNIX socket creation" and p.get("blocked") is True and p.get("uid")==1002 and p.get("errno") in [1,13,97] for p in af))
    check("Landlock outside write actually denied",any(p.get("probe")=="Landlock write outside writable paths" and p.get("blocked") is True and p.get("uid")==1002 and p.get("errno") in [1,13] for p in land))
    workflow=(TERMINAL_TRUST/"ns-comparator-verification.yml").read_text()
    check("real new-user systemd and DBus setup pinned",all(s in workflow for s in ["sudo useradd --create-home --shell /bin/bash mathscopeverify",
          "sudo loginctl enable-linger mathscopeverify",'sudo systemctl start "user@${mathscope_uid}.service"',
          'DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/${mathscope_uid}/bus"',"systemctl --user is-active default.target"]))
    setup=next((s for s in job.get("steps",[]) if s.get("name")=="Prepare a separate unprivileged verification user"),{})
    check("actual systemd user setup step succeeded",setup.get("status")=="completed" and setup.get("conclusion")=="success")
    execution=next((s for s in job.get("steps",[]) if s.get("name")=="Run the original protected Comparator and preserve its actual exit"),{})
    check("actual protected execution workflow step succeeded",execution.get("status")=="completed" and execution.get("conclusion")=="success")
    check("actual parent has zero capabilities",result.get("parentEffectiveCapabilities")==0)
    adaptation=result.get("transportOnlyAdaptation",{})
    check("production transport bound to verified diagnostic",adaptation.get("diagnosticRunId")==38013278865
          and adaptation.get("validatedDiagnosticTransportSHA256")=="307168863bcc5923339d698de00ed66b72a0425361d060337900bc533a1fe147"
          and adaptation.get("runProtectedSHA256")==digest(files.get("run_protected.py",b""))
          and adaptation.get("protectedTransportSHA256")==digest(files.get("protected_transport.py",b""))
          and adaptation.get("copiedOriginalControllerSHA256")==digest(files.get("source-original-run.py",b""))
          and adaptation.get("guardSecurityOptionsUnchanged") is True
          and adaptation.get("preflightTimeoutSeconds")==25 and adaptation.get("comparatorTimeoutSeconds")==19800)
    guarded_labels=["guard-preflight","landlock-preflight","guard-metadata-preflight","protected-comparator"]
    units=[]
    for label in guarded_labels:
        stage=stages.get(label,{})
        transport=stage.get("transportRecord",{})
        units_in_command=[x for x in stage.get("command",[]) if x.startswith("--unit=")]
        units.extend(units_in_command)
        check("unique explicit unit for guarded stage: "+label,len(units_in_command)==1 and units_in_command[0].endswith(".service"))
        check("actual outer-PTY transport success: "+label,transport.get("transport")=="outer-pty"
              and transport.get("timedOut") is False and transport.get("captureError") is None
              and not transport.get("cleanupIncomplete",False) and not transport.get("transportException")
              and transport.get("exitCodeBeforeCleanup")==transport.get("finalClientExitCode")==stage.get("exitCode")==0
              and transport.get("eofObservedBeforeCleanup") is True and stage.get("status")=="PASS"
              and transport.get("timeoutSeconds")== (19800 if label=="protected-comparator" else 25))
        check("guarded transport preserves literal command: "+label,transport.get("command")==stage.get("command")
              and transport.get("cwd")==stage.get("cwd")==REPO)
        raw=files.get(label+".log",b"")
        check("complete raw guarded capture and stream: "+label,bool(raw)
              and transport.get("streamedBytes")==transport.get("logBytes")==len(raw)
              and transport.get("logSHA256")==stage.get("logSHA256")==digest(raw))
    check("all guarded stages have separate units",len(units)==4 and len(set(units))==4)
    mp,mt=guard_prefix("guard-metadata-preflight")
    check("same guard for direct metadata probe",mp==protected and mt==["/usr/bin/python3","/opt/mathscope-guard-ci/metadata_probe.py"])
    events=[]
    for line in strip_ansi(text_file(files,"guard-metadata-preflight.log")).splitlines():
        if line.strip().startswith("{"):
            try: events.append(json.loads(line.strip()))
            except json.JSONDecodeError: pass
    metadata_before=next((x for x in events if x.get("event")=="guard-process-before-original-probe"),{})
    metadata_after=next((x for x in events if x.get("event")=="guard-process-after-original-probe"),{})
    check("guarded same-process actual metadata",metadata_before.get("uid")==metadata_before.get("euid")==metadata_after.get("uid")==1002
          and metadata_before.get("pid")==metadata_after.get("pid") and isinstance(metadata_before.get("pid"),int)
          and metadata_before.get("probeSHA256")==metadata_after.get("probeSHA256")==digest(files.get("probe.py",b"")))
    check("guarded process has zero capabilities and NoNewPrivs",metadata_before.get("effectiveCapabilities")==0
          and metadata_before.get("effectiveCapabilitiesHex")=="0000000000000000" and metadata_before.get("noNewPrivileges")==1)
    fds=metadata_before.get("fd",{})
    check("guarded process has controlling terminal",metadata_before.get("pid")==metadata_before.get("processGroup")==metadata_before.get("sessionId")
          and set(fds)=={"0","1","2"} and all(x.get("isatty") is True and x.get("foregroundProcessGroup")==metadata_before.get("pid") for x in fds.values()))
    check("same-process metadata original AF_UNIX denial",any(x.get("probe")=="AF_UNIX socket creation" and x.get("blocked") is True and x.get("uid")==1002 for x in events))
    control=result.get("landlockWriteControl",{})
    check("Landlock denial compared with successful same-user write",control.get("uid")==1002
          and control.get("succeededWithoutLandlock") is True and control.get("path")=="/home/mathscopeverify/audit/forbidden-write"
          and result.get("landlockForbiddenWriteAbsent") is True)
    comp=strip_ansi(text_file(files,"protected-comparator.log"))
    for marker in ["Running nanoda kernel on solution","nanoda kernel accepts the solution","Running Lean default kernel on solution.","Lean default kernel accepts the solution","Your solution is okay!"]:
        check("actual protected acceptance: "+marker,marker in comp)
    check("no kernel rejection marker",not any(s in comp for s in ["kernel rejects the solution","kernel rejected the solution","Quotient post-check rejects the solution"]))
    markers=["Running nanoda kernel on solution","nanoda kernel accepts the solution","Running Lean default kernel on solution.","Lean default kernel accepts the solution","Your solution is okay!"]
    positions=[comp.find(x) for x in markers]
    check("actual kernel acceptance and final Quot postcheck order",all(x>=0 for x in positions) and positions==sorted(positions) and len(set(positions))==len(positions))
    type_log=text_file(files,"submitted-type-and-axiom-audit.log")
    ax={n:[s.strip() for s in a.split(",") if s.strip()] for n,a in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]",type_log,re.S)}
    check("both submitted theorem axioms actually printed",set(ax)==set(THEOREMS) and all(set(v)<=ALLOWED for v in ax.values()))
    check("both submitted theorem types actually printed",all(re.search(re.escape(n)+r"\s*:",type_log) for n in THEOREMS))
    check("literal submitted theorem audit command",stages.get("submitted-type-and-axiom-audit",{}).get("command")==[LAKE,"env","lean","/home/mathscopeverify/audit/SubmittedAxioms.lean"])
    status=stages.get("source-status-after",{})
    status_text=text_file(files,"source-status-after.log")
    postcheck_only=False  # The corrected recorder must actually succeed; no historical exception applies.
    stdout=files.get("source-status-after.stdout.log")
    stderr=files.get("source-status-after.stderr.log")
    clean_wrapper=result.get("status")=="PASS" and result.get("exitCode")==0 and status.get("exitCode")==0
    check("actual controller success without exception",clean_wrapper and not result.get("error"))
    check("actual separated source status streams",stdout==b"" and stderr is not None
          and status.get("stdoutLog")=="source-status-after.stdout.log" and status.get("stderrLog")=="source-status-after.stderr.log"
          and status.get("stdoutBytes")==0 and status.get("stderrBytes")==len(stderr)
          and status.get("stdoutSHA256")==digest(stdout or b"") and status.get("stderrSHA256")==digest(stderr or b""))
    check("complete combined source status log",stdout is not None and stderr is not None
          and files.get("source-status-after.log")==b"--- stdout ---\n"+(stdout or b"")+b"\n--- stderr ---\n"+(stderr or b"")+b"\n")
    check("literal last source status command",status.get("command")==["git","status","--porcelain","--untracked-files=no"])
    check("actual finish timestamp recorded",bool(result.get("completedUTC")))
    passed=all(c["pass"] for c in checks)
    report={"schema":"MathScope.OriginalProtectedComparatorTerminalAudit/1","verifiedUTC":datetime.now(timezone.utc).isoformat(),
        "status":"PASS" if passed else "FAIL_OR_INCOMPLETE","N106Completed":passed,"runId":RUN,"jobId":JOB,"artifactId":args.artifact_id,
        "githubObservationSHA256":digest(args.observation.read_bytes()),"githubObservationUTC":obs.get("receivedUTC"),
        "actualJobStatus":job.get("status"),"actualJobConclusion":job.get("conclusion"),
        "actualControllerStatus":result.get("status"),"actualControllerExitCode":result.get("exitCode"),
        "actualProtectedComparatorExitCode":stages.get("protected-comparator",{}).get("exitCode"),
        "postcheckOnlyFailure":postcheck_only,"archiveSHA256":digest(archive),"archiveBytes":len(archive),"members":members,
        "trackedFileCount":len(before),"theoremAxioms":ax,"passed":sum(c["pass"] for c in checks),"total":len(checks),"checks":checks,
        "verifierSHA256":digest(Path(__file__).read_bytes()),"portableInputManifestSHA256":digest((TRUST/"manifest.json").read_bytes()),"actualRunBindingSHA256":BINDING_SHA256,
        "scope":"Actual independent protected Comparator with the verified outer terminal transport. Requires actual successful job, controller, command, nanoda/Lean/final Quot acceptance, submitted theorem audits, and unchanged original sources/kernel/configuration/guards. Historical incomplete runs remain separate.",
        "newComparatorRunPerformedByAuditor":False}
    with args.output.open("x") as f:json.dump(report,f,indent=2);f.write("\n")
    print(json.dumps({k:report[k] for k in ["status","N106Completed","passed","total","actualJobConclusion","actualControllerExitCode","actualProtectedComparatorExitCode"]}))
    for c in checks:
        if not c["pass"]:print(json.dumps(c))
    return 0 if passed else 1

if __name__=="__main__":raise SystemExit(main())
