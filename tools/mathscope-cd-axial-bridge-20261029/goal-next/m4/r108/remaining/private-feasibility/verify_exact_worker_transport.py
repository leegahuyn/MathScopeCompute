import base64
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile


CANDIDATE_SHA256 = '0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735'
ROUTES = ('/', '/v0.3.1.html')
CSP = '; '.join((
    "default-src 'none'", "script-src 'self' 'unsafe-inline' blob:",
    "worker-src 'self' blob:", "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:", "font-src 'self' data:", "connect-src 'self'",
    "object-src 'none'", "base-uri 'self'", "form-action 'none'",
))


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def render_worker(packed):
    encoded = base64.b64encode(packed).decode('ascii')
    return f'''const encoded = "{encoded}";
const binary = atob(encoded);
const payload = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) payload[i] = binary.charCodeAt(i);
const htmlRoutes = new Set({json.dumps(ROUTES)});

export default {{
  fetch(request) {{
    if (!htmlRoutes.has(new URL(request.url).pathname)) {{
      return new Response(null, {{ status: 404 }});
    }}
    if (request.method !== 'GET' && request.method !== 'HEAD') {{
      return new Response(null, {{ status: 405, headers: {{ Allow: 'GET, HEAD' }} }});
    }}
    const headers = {{
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': {json.dumps(CSP)},
    }};
    const body = request.method === 'GET'
      ? new Response(payload).body.pipeThrough(new DecompressionStream('gzip'))
      : null;
    return new Response(body, {{ headers }});
  }},
}};
'''.encode('utf-8')


NODE_CHECK = '''
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const [workerPath, expectedHash, expectedSize, ...paths] = process.argv.slice(1);
const worker = (await import(pathToFileURL(workerPath))).default;
const read = (path, method = 'GET') => worker.fetch(
  new Request(`https://fixture.invalid${path}`, { method }),
);
for (const path of paths) {
  const response = await read(path);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.match(response.headers.get('content-security-policy'), /worker-src 'self' blob:/);
  const html = await response.arrayBuffer();
  assert.equal(html.byteLength, Number(expectedSize));
  assert.equal(createHash('sha256').update(Buffer.from(html)).digest('hex'), expectedHash);
  const head = await read(path, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, null);
}
assert.equal((await read('/missing')).status, 404);
assert.equal((await read('/', 'POST')).status, 405);
'''


def main(candidate_path, browser_check=False):
    candidate = candidate_path.read_bytes()
    if sha256(candidate) != CANDIDATE_SHA256:
        raise ValueError('Candidate bytes do not match the isolated browser fixture.')
    packed = gzip.compress(candidate, mtime=0)
    worker = render_worker(packed)
    with tempfile.TemporaryDirectory(prefix='mathscope-r108-transport-') as tmp:
        worker_path = Path(tmp) / 'worker.mjs'
        worker_path.write_bytes(worker)
        result = subprocess.run(
            ['node', '--input-type=module', '-e', NODE_CHECK, str(worker_path),
             CANDIDATE_SHA256, str(len(candidate)), *ROUTES],
            capture_output=True, text=True, encoding='utf-8', errors='replace',
        )
        if result.returncode:
            raise RuntimeError(result.stderr[-2000:])
        browser = None
        if browser_check:
            checker = Path(__file__).with_name('verify_browser_isolation.cjs')
            result = subprocess.run(
                ['node', str(checker), str(worker_path)],
                capture_output=True, text=True, encoding='utf-8', errors='replace',
            )
            if result.returncode:
                raise RuntimeError(result.stderr[-4000:])
            browser = json.loads(result.stdout)
    print(json.dumps({
        'schema': 'MathScope.M4.R108.LocalCandidateTransport/1',
        'candidateSHA256': CANDIDATE_SHA256,
        'candidateBytes': len(candidate),
        'gzipSHA256': sha256(packed),
        'gzipBytes': len(packed),
        'workerSHA256': sha256(worker),
        'workerBytes': len(worker),
        'getByteEqualityVerifiedRoutes': ROUTES,
        'headEmptyRoutes': ROUTES,
        'contentSecurityPolicy': CSP,
        'localBrowser': browser,
        'publicationConfirmed': False,
    }, indent=2))


if __name__ == '__main__':
    main(Path(sys.argv[1]), browser_check='--browser-check' in sys.argv[2:])
