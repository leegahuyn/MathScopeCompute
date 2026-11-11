from hashlib import sha256
import json
from pathlib import Path
import sys

evidence = Path(sys.argv[1])
receipt_path = evidence / 'R1-07_RECEIPT.json'
independent = Path(sys.argv[2])
receipt = json.loads(receipt_path.read_bytes())
reader = json.loads(independent.read_bytes())
assert reader['schema'] == 'MathScope.M4.R107.IndependentGuideReadback/1'
assert reader['candidateSHA256'] == receipt['candidateSHA256']
assert reader['readGuideSHA256'] == sha256((evidence / 'WALKTHROUGHS_KO.md').read_bytes()).hexdigest()
assert reader['errors'] == []

expected = {job['inputHash']: (name, job) for name, job in receipt['jobs'].items()}
seen = set()
for observed in reader['jobReceipts']:
    name, reference = expected[observed['inputHash']]
    assert name not in seen
    assert observed['workerSHA256'] == reference['workerSha256'], name
    assert observed['mathematicalHash'] == reference['mathematicalHash'], name
    seen.add(name)
assert seen == set(receipt['jobs'])
receipt['independentReaderReplay'] = {
    'guideSHA256': reader['readGuideSHA256'],
    'candidateSHA256': reader['candidateSHA256'],
    'independentReceiptSHA256': sha256(independent.read_bytes()).hexdigest(),
    'sameInputAndWorker': len(seen),
    'sameMathematicalHash': len(seen),
    'readerUsedSeparateScript': True,
}
receipt_path.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(receipt['independentReaderReplay']))
