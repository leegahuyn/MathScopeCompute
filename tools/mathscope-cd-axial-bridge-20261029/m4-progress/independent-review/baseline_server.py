"""Serve the historical baseline builder output from memory, without deployment."""
import gzip, importlib.util, json, os
from pathlib import Path
from http.server import BaseHTTPRequestHandler,HTTPServer

R=Path(__file__).resolve().parent
repo=Path(os.environ.get('MATHSCOPE_SOURCE_REPO','C:/Users/사용자/Documents/Codex/2026-10-15/task/MathScopeCompute'))
SNAPSHOT=Path(os.environ.get('MATHSCOPE_SOURCE_SNAPSHOT',str(R.parent/'source')))
S=SNAPSHOT/'research-ide'/'mathscope-m4'/'web'
spec=importlib.util.spec_from_file_location('original_builder',S/'original-builder.py'); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=gzip.open(repo/'docs/evidence/m4-evidence-panel-v103-20261013/public-v103.html.gz','rb').read().decode('utf8')
catalog=json.loads((SNAPSHOT/'research-ide/mathscope-m4/release-lab/catalog.json').read_text(encoding='utf8'))
verification=json.loads((repo/'research-ide/mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json').read_text(encoding='utf8'))
kernel=json.loads((repo/'research-ide/mathscope-m4/evidence/local-kernel-replay-20261013-attempt2/replay.json').read_text(encoding='utf8'))
html=m.build(data,catalog,verification,kernel)[1].encode('utf8')
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  if self.path!='/baseline.html':self.send_error(404);return
  self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(html)));self.end_headers();self.wfile.write(html)
HTTPServer(('127.0.0.1',int(os.environ.get('MATHSCOPE_BASELINE_PORT','39148'))),Handler).serve_forever()
