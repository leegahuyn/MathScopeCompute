"""Verify original Git blobs for simultaneous substitution and indexed guards."""
import hashlib,json,subprocess
from pathlib import Path
from os import environ
R=Path(environ["MATHSCOPE_SOURCE_REPO"]);rev='a9b3a5b317525f6d0a71e2e356b054c9d25d2e60';D=Path(__file__).resolve().parent
shas={
'research-ide/mathscope-m3/navier/source-global-current.mjs':'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
'research-ide/mathscope-m3/navier/source-global-expressions.mjs':'89904bd7441a57cf634ff7b4c579e9ee7688868d14eafd999e44f41f74f0c2d1',
'research-ide/mathscope-m3/navier/source-auxiliary-expressions.mjs':'4e1741d0a5ebadaf0858d79b141856d9dc52bb0b3b119b39e6cf83248355ca86',
'research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3'}
data={}
for path,sha in shas.items():
 blob=subprocess.check_output(['git','-C',str(R),'show',rev+':'+path]);assert hashlib.sha256(blob).hexdigest()==sha; assert (Path(environ["MATHSCOPE_ORIGINAL_RUNTIME"])/path).read_bytes()==blob;data[path]=blob.decode('utf8')
a=data['research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs']; assert "Every free coordinate of a shared expression body must be an explicit parameter" in a and "this.fresh('capture_free_argument')" in a and "this.fresh('alpha_renamed_integral')" in a and 'this.simultaneousSubstitute(body,s.parameters,values)' in a
c=data['research-ide/mathscope-m3/navier/source-global-current.mjs'];assert 'candidateGuardRunsBeforeLocalMonotoneRoot:true' in c and '...meshOffsets.map(x=>[x,G.neg(radius),radius]),[bandOffset,G.neg(radius),radius]' in c
for path in ('research-ide/mathscope-m3/navier/source-global-expressions.mjs','research-ide/mathscope-m3/navier/source-auxiliary-expressions.mjs'):
 s=data[path]; assert 'of row.guards)' in s and 'this.choose(coordinate,left,right,this.zero,' in s
out={'schema':'MathScope.Y.N2.OriginalSourceGuardAndSubstitution/1','sourceCommit':rev,'verifiedBlobsSHA256':shas,'conclusions':['shared expression free coordinates must be explicit parameters','fresh simultaneous argument substitution','integral binder alpha renaming on capture risk','band guard is last in row guard list and indexed materializers wrap in list order','the band guard is the outermost exact choose node'], 'scope':'Source implementation and byte identity; does not by itself prove interval interpretation or all fixed-label boundary derivative matching.', 'release':'HOLD'}
(D/'original-source-guards.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS pinned original shared substitution and outer band guard source')
