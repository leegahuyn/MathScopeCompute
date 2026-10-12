import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const builder=fileURLToPath(new URL('../p8/tools/build_browser.py',import.meta.url));
const importBuilder="import importlib.util, json, sys\nspec=importlib.util.spec_from_file_location('p8_transport_build',sys.argv[1])\nmodule=importlib.util.module_from_spec(spec)\nspec.loader.exec_module(module)\n";
function python(code,input=''){
  const result=spawnSync('python3',['-B','-c',importBuilder+code,builder],{input,encoding:'utf8',maxBuffer:4*1024*1024});
  assert.equal(result.status,0,result.stderr||result.error?.message);
  return result.stdout;
}
const rewritePublisher=text=>text.replace(/\\u([\da-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
const decode=expression=>vm.runInNewContext(expression,{TextDecoder,Uint8Array,atob});
const digest=text=>createHash('sha256').update(Buffer.from(text,'utf8')).digest('hex');
const delimiter='const key=`${edge.from}\\u0000${edge.to}`;';

test('the observed Publisher mutation breaks legacy JSON but leaves the complete UTF-8 Worker byte-exact',async()=>{
  const legacy=JSON.stringify(delimiter),corrupted=rewritePublisher(legacy);
  assert.notEqual(corrupted,legacy);
  assert.ok(corrupted.includes('\0'));
  assert.throws(()=>JSON.parse(corrupted),SyntaxError);

  const bundle=await fs.readFile(new URL('../web/p8-engine.bundle.js',import.meta.url),'utf8');
  assert.equal(rewritePublisher(rewritePublisher(bundle)),bundle);
  assert.ok(!bundle.includes('\0'));
  const expressions=[...bundle.matchAll(/^  const source=(.+);$/gm)];
  assert.equal(expressions.length,1);
  const source=decode(expressions[0][1]);
  const rebuilt=python("worker,_=module.bundle(module.ROOT/'worker-entry.mjs')\nbuild=json.loads(module.read(module.ROOT/'build-data.json'))\nsys.stdout.write('globalThis.__MATHSCOPE_P8_BUILD__='+module.canonical(build)+';\\n'+worker)\n");
  assert.deepEqual(Buffer.from(source,'utf8'),Buffer.from(rebuilt,'utf8'));
  assert.equal(digest(source),digest(rebuilt));
  assert.ok(source.includes(delimiter),'the original duplicate-edge delimiter must survive unchanged');
});

test('UTF-8 transport preserves BOM, Korean, astral Unicode, NUL, script tags and literal escapes',()=>{
  const source='\ufeff한글 ∑ 🧮\0\n'+String.raw`\u0000 \ufeff \\u0041 </script> "quoted" 'single'`+' ${literal} __P8_STATIC_WORKER_SOURCE__\r\n';
  const expression=python('sys.stdout.write(module.worker_source_expression(sys.stdin.buffer.read().decode("utf-8")))\n',source);
  assert.equal(rewritePublisher(expression),expression);
  assert.doesNotMatch(expression,/[\u0000\r\n]|<\/script|\\u[\da-f]{4}/i);
  const actual=decode(expression);
  assert.equal(actual.codePointAt(0),0xfeff);
  assert.deepEqual(Buffer.from(actual,'utf8'),Buffer.from(source,'utf8'));
  assert.equal(digest(actual),digest(source));
});

test('malformed base64 and invalid UTF-8 fail decoding without replacement text',()=>{
  const expression=python('sys.stdout.write(module.worker_source_expression("valid worker"))\n');
  const payload=expression.match(/atob\("([A-Za-z0-9+/=]+)"\)/)[1];
  assert.throws(()=>decode(expression.replace(payload,'!invalid base64!')));
  assert.throws(()=>decode(expression.replace(payload,'/w==')),TypeError);
});
