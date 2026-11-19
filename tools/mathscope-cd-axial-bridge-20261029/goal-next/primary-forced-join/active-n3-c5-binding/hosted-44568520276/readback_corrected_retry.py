"""Replay the corrected hosted active-N3 exporter once its artifact is available."""
from argparse import ArgumentParser
from pathlib import Path
import json
import sys


def main():
    cli = ArgumentParser(description=__doc__)
    for name in ('reader', 'artifact', 'metadata', 'prior', 'reference', 'scratch', 'out'):
        cli.add_argument('--' + name, type=Path, required=True)
    a = cli.parse_args()
    sys.path.insert(0, str(a.reader))
    import verify_spatial_artifact as reader
    reader.RETRY = (44582875351, '059df9db3a188ce18f3c43a0dca3a92f2e02a4b2')
    result = reader.readback(a.artifact,a.reference,a.metadata,a.prior,None,a.scratch,retry=True)
    with a.out.open('x',encoding='utf8',newline='\n') as handle:
        json.dump(result,handle,indent=2)
        handle.write('\n')
    print(json.dumps({'status':result['status'],'hostedRun':result['hostedRun']}))


if __name__ == '__main__':
    assert __debug__
    main()
