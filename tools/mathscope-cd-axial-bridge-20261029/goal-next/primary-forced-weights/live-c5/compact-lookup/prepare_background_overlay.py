"""Prepare a byte-reversible, source-pinned C8 memory-instrumentation overlay."""
import argparse
from hashlib import sha256
import json
from pathlib import Path

ORIGINAL='62d877ca5d45073c8e95862bc0f5d0d44197f8ace34bd77d885bfbececc69464'

# Each suffix is inserted immediately after an unchanged, unique source line.
# No existing operation, limit, argument, source body or order is replaced.
INSERTIONS=[
 (b"  context.onProgress?.({stage:'all-band-full-leading-FTC',nodeCount:G.nodes.length,sourceJetCount:leadingFTC.length});\n",
  b"  /* lookup-overlay:checkpoint */\n  context.compactNormCaches?.(G);\n  context.onProgress?.({stage:'all-band-norm-cache-checkpoint',nodeCount:G.nodes.length});\n"),
 (b"    if(coefficientFTC.length>=request.maxCoefficientJets)fail('RESOURCE_LIMIT','The actual coefficient FTC budget is exhausted.');\n",
  b"    /* lookup-overlay:coefficient */\n    if(coefficientFTC.length%128===0)context.onProgress?.({stage:'all-band-coefficient-ftc-progress',nodeCount:G.nodes.length,coefficientFTCCount:coefficientFTC.length});\n"),
 (b"  for(const [field,multiplier]of Object.entries(multipliers)){\n",
  b"    /* lookup-overlay:field-start */\n    context.onProgress?.({stage:'all-band-coefficient-field-start',field,nodeCount:G.nodes.length,coefficientFTCCount:coefficientFTC.length});\n"),
 (b"    const expansion=exactSlowProfileExpansion(G,{s,X,eta,h,multiplier,order:m,maxJetRequests:request.maxJetRequests});\n",
  b"    /* lookup-overlay:field-expanded */\n    context.onProgress?.({stage:'all-band-coefficient-field-expanded',field,nodeCount:G.nodes.length,coefficientFTCCount:coefficientFTC.length});\n"),
 (b"    coefficientExpansions[field]={...expansion,rows:expansion.rows.map(row=>({...row,terms:row.terms.map(t=>({...t,coefficientUpper:coefficientBound(t.coefficient)}))}))};\n",
  b"    /* lookup-overlay:field-done */\n    context.onProgress?.({stage:'all-band-coefficient-field-done',field,nodeCount:G.nodes.length,coefficientFTCCount:coefficientFTC.length});\n"),
 (b"  // A stable issued program is separate from the live append-only source.\n",
  b"  /* lookup-overlay:before-pack */\n  context.onProgress?.({stage:'all-band-background-before-pack',nodeCount:G.nodes.length,coefficientFTCCount:coefficientFTC.length});\n"),
 (b"  result.program=JSON.parse(canonicalStringify(packed));\n",
  b"  /* lookup-overlay:before-seal */\n  context.onProgress?.({stage:'all-band-background-before-seal',nodeCount:G.nodes.length,coefficientFTCCount:coefficientFTC.length});\n"),
]

def digest(raw):return sha256(raw).hexdigest()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--receipt',type=Path,required=True)
    a=p.parse_args()
    assert a.source.resolve()!=a.out.resolve(),'Output must be a separate scratch file.'
    original=a.source.read_bytes();assert digest(original)==ORIGINAL,'Original source bytes changed.'
    patched=original
    for base,extra in INSERTIONS:
        assert patched.count(base)==1,base.decode().strip()
        assert extra not in patched
        patched=patched.replace(base,base+extra,1)
    restored=patched
    for base,extra in reversed(INSERTIONS):
        assert restored.count(base+extra)==1,extra.decode().strip()
        restored=restored.replace(base+extra,base,1)
    assert restored==original and digest(restored)==ORIGINAL
    receipt={'schema':'MathScope.Hosted.C8ReversibleCacheOverlay/1',
      'originalSHA256':ORIGINAL,'patchedSHA256':digest(patched),'restoredSHA256':digest(restored),
      'insertions':len(INSERTIONS),'exactByteReversal':True,
      'callback':'context.compactNormCaches?.(G), immediately after all-band-full-leading-FTC',
      'progress':['cache-checkpoint','field-start','field-expanded','coefficient-ftc each 128 unique coefficients','field-done','before-pack','before-seal'],
      'semantics':'Insertion only. The optional callback may replace cache storage; runner must authenticate and verify its implementation. Progress callbacks are pre-existing context side effects.',
      'notAsserted':['C8 completion','unchanged graph when callback mutates semantic state','same-family seal','Lean verification'],'release':'HOLD'}
    a.out.write_bytes(patched);a.receipt.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8',newline='\n')
    print('PASS source pin, seven insertions and exact byte reversal')
    print('patched SHA256',digest(patched))

if __name__=='__main__':main()
