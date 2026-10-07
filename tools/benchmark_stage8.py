"""Deterministic small Stage8 backend benchmark. Run: python tools/benchmark_stage8.py"""
import json, time
from app.adapters.zeta_complex import ComplexZetaSurfaceAdapter
from app.adapters.advanced_research import SpectralFlowReferenceAdapter
def timed(adapter, spec):
    t=time.perf_counter(); result=adapter.run(spec, {"benchmark": True})
    return {"name":adapter.name,"elapsedMs":round((time.perf_counter()-t)*1000,3),
            "representations":len(result.outputRepresentations),
            "grade":result.evidenceRecords[0].grade}
if __name__=="__main__":
    results=[timed(ComplexZetaSurfaceAdapter(),{"realSamples":9,"imagSamples":9,"precisionDps":25}),
             timed(SpectralFlowReferenceAdapter(),{})]
    print(json.dumps({"benchmark":"stage8-reference","results":results,"releasePassFromSpeedAlone":False},indent=2))
