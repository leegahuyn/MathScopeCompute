#!/usr/bin/env python3
"""Independent fresh destination diagnostic for disposable cache persistence."""
import argparse,json,pathlib,sqlite3,subprocess,sys,time
import recover_scalar_closure as r

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--source',type=pathlib.Path,required=True);ap.add_argument('--stage3',type=pathlib.Path,required=True);ap.add_argument('--out',type=pathlib.Path,required=True);args=ap.parse_args()
    args.out.mkdir(parents=True,exist_ok=True);dest=args.out/'independent-recheck.sqlite';r.require(not dest.exists(),'Refuse existing diagnostic destination')
    stage3=r.module(args.stage3,'pinned_persistence',r.STAGE3_PIN);start=time.monotonic()
    header,authentication=stage3.prepare_source(args.source,dest)
    con=sqlite3.connect(dest.resolve().as_uri()+'?mode=ro',uri=True)
    rows=con.execute('SELECT COUNT(*) FROM nodes').fetchone()[0];node31=con.execute('SELECT raw FROM nodes WHERE id=31').fetchone();con.close()
    second=subprocess.run([sys.executable,'-c','import sqlite3,sys; c=sqlite3.connect(sys.argv[1]+"?mode=ro",uri=True); print(c.execute("SELECT COUNT(*) FROM nodes").fetchone()[0])',dest.resolve().as_uri()],capture_output=True,text=True)
    r.require(rows==r.SOURCE_PIN['nodes'] and node31 is not None and second.returncode==0 and int(second.stdout.strip())==rows,'Fresh cache persistence diagnostic failed')
    report={'schema':'MathScope.FreshCachePersistenceDiagnostic/1','authentication':authentication,'fresh_destination':str(dest),'rows_reopened_in_process':rows,'rows_reopened_in_second_process':int(second.stdout),'source_node_31':json.loads(node31[0]),'cache_bytes':dest.stat().st_size,'cache_sha256':r.file_sha(dest),'stage3_sha256':r.STAGE3_PIN,'diagnostic_code_sha256':r.file_sha(__file__),'elapsed_seconds':round(time.monotonic()-start,3),'previous_empty_cache_cause_established':False,'cache_is_source_authority':False}
    r.write(args.out/'CACHE_PERSISTENCE_DIAGNOSTIC.json',report);print(json.dumps(report))
if __name__=='__main__':main()
