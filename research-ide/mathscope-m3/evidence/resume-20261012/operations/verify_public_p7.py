"""Observe the deployed source and actual HTTP execution; persist compact receipts."""
import gzip
import hashlib
import json
from pathlib import Path
import urllib.request
import urllib.error
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'evidence/resume-20261012/production'
BASE = 'https://mathscope-compute.onrender.com'
ORIGIN = 'https://project29770.websitepublisher.ai'

def call(path, body=None, method=None):
    headers = {'Origin': ORIGIN}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        response = urllib.request.urlopen(req, timeout=120)
    except urllib.error.HTTPError as error:
        response = error
    raw = response.read()
    return response.status, {k.lower():v for k,v in response.headers.items()}, json.loads(raw), raw

def save(name, raw):
    p = OUT / (name + '.json.gz')
    p.write_bytes(gzip.compress(raw, mtime=0))
    return {'path': p.name, 'bytes': p.stat().st_size,
            'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}

def main():
    OUT.mkdir(exist_ok=False)
    expected = json.loads((ROOT/'evidence/resume-20261012/attempt2/manifest.json').read_text(encoding='utf-8'))['sourceBinding']
    report = {'schema':'MathScope.M3.P7PublicHTTPVerification/1',
              'observedAt': datetime.now(timezone.utc).isoformat(), 'base': BASE,
              'origin': ORIGIN, 'wholeP7Complete': False, 'wholeM3Complete': False}
    status, _, health, _ = call('/health')
    assert status == 200 and health['ok']
    status, headers, caps, raw = call('/v1/p7/capabilities')
    assert status == 200 and caps['sourceBinding'] == expected
    assert headers.get('access-control-allow-origin') == ORIGIN
    assert len(caps['kinds']) == 7 and not caps['wholeP7Complete']
    report['capabilities'] = save('capabilities', raw)
    report['sourceMatchesAttempt2'] = True
    report['CORSOriginMatches'] = True
    request = next(x['request'] for x in caps['examples'] if x['id']=='zeta-2')
    status, _, record, raw = call('/v1/p7/run', json.dumps(request).encode())
    assert status == 200 and record['execution']['status']=='COMPLETED'
    assert record['sourceBinding']==expected and record['result']['toleranceMet']
    report['run'] = save('zeta-2', raw)
    status, _, replay, replay_raw = call('/v1/p7/replay', raw)
    assert status == 200 and replay['status']=='MATCH'
    report['replay'] = save('zeta-2-replay', replay_raw)
    report['freshReplayStatus'] = replay['status']
    rejected=[]
    for body in (b'{"kind":"p7.special_function","input":{"x":1e309}}', b'{"kind":"p7.special_function","input":{"x":"\\ud800"}}'):
        status, _, result, _ = call('/v1/p7/run', body)
        assert status == 400
        rejected.append({'request':body.decode(), 'HTTPStatus':status,'detail':result['detail']})
    report['invalidInputsRejected']=rejected
    report['environment']=record['environment']
    report['predecessor']=record['predecessor']
    report['execution']=record['execution']
    report['allChecksPassed']=True
    (OUT/'http-verification.json').write_bytes((json.dumps(report,indent=2,ensure_ascii=False)+'\n').encode())
    print(json.dumps({'allChecksPassed':True,'sourceMatches':True,'replay':'MATCH'}),flush=True)

if __name__=='__main__':
    main()
