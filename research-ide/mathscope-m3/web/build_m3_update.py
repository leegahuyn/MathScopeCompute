"""Update only the named M3 blocks in an observed, already integrated page."""
from pathlib import Path
import argparse
import hashlib
import json
import re

WEB = Path(__file__).resolve().parent


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def build(observed, group='all'):
    patches, changed, candidate = [], [], observed

    def replace(pattern, content, name):
        nonlocal candidate
        matches = list(re.finditer(pattern, candidate, re.S))
        if len(matches) != 1:
            raise ValueError(f'Expected one observed owned block: {name}')
        old = matches[0].group(0)
        if old == content:
            return
        if candidate.count(old) != 1:
            raise ValueError(f'Ambiguous exact block: {name}')
        patches.append({'operation': 'replace', 'find': old, 'replace': content})
        candidate = candidate.replace(old, content, 1)
        changed.append({'name': name, 'beforeSHA256': sha(old), 'afterSHA256': sha(content)})

    def script(element, filename):
        content = re.sub(r'</script', lambda _: r'<\/script', (WEB / filename).read_text(), flags=re.I)
        replace(r'<script id="' + re.escape(element) + r'">.*?</script>',
                '<script id="' + element + '">\n' + content + '\n</script>', filename)

    def style(element, filename, *additional_files):
        filenames = (filename, *additional_files)
        content = '\n'.join((WEB / name).read_text() for name in filenames)
        replace(r'<style id="' + re.escape(element) + r'">.*?</style>',
                '<style id="' + element + '">\n' + content + '\n</style>', ' + '.join(filenames))

    if group in ('p7', 'all'):
        style('mathscope-m3-css', 'workspace.css', 'p7-visualization.css')
        for element, filename in [
            ('mathscope-m3-js', 'workspace.js'),
            ('p7-visual-models-js', 'p7-visual-models.js'),
            ('p7-visualization-js', 'p7-visualization.js'),
            ('p7-visual-controller-js', 'p7-visual-controller.js'),
        ]:
            script(element, filename)
        seed_content = (WEB / 'p7-visual-seeds.json').read_text().replace('</', '<\\/')
        replace(r'<script id="p7-visual-seeds" type="application/json">.*?</script>',
                '<script id="p7-visual-seeds" type="application/json">' + seed_content + '</script>',
                'p7-visual-seeds.json')

    if group in ('extended', 'all'):
        html = (WEB / 'extended-workspace.html').read_text()
        for workspace in ('g3', 'n3'):
            pattern = r'<section\b[^>]*data-e3="' + workspace + r'"[^>]*>.*?</section>'
            sections = re.findall(pattern, html, re.S)
            if len(sections) != 1:
                raise ValueError('Expected one new workspace section: ' + workspace)
            replace(pattern, sections[0], 'extended-workspace.html:' + workspace)
        style('mathscope-m3-extended-css', 'extended-workspace.css')
        script('mathscope-m3-extended-engine-js', 'extended-engine.bundle.js')
        script('mathscope-m3-extended-workspace-js', 'extended-workspace.js')

    if group in ('p8', 'all'):
        html = (WEB / 'p8-workspace.html').read_text().strip()
        replace(r'<section\b[^>]*id="mathscopeResearchM3P8"[^>]*>.*?</section>', html, 'p8-workspace.html')
        style('mathscope-m3-p8-css', 'p8-workspace.css')
        for element, filename in [
            ('mathscope-m3-p8-engine-js', 'p8-engine.bundle.js'),
            ('p8-visual-models-js', 'p8-visual-models.js'),
            ('p8-visualization-js', 'p8-visualization.js'),
            ('p8-workspace-js', 'p8-workspace.js'),
        ]:
            script(element, filename)

    restored = candidate
    for patch in reversed(patches):
        if restored.count(patch['replace']) != 1:
            raise ValueError('Ambiguous reverse update')
        restored = restored.replace(patch['replace'], patch['find'], 1)
    if restored != observed:
        raise ValueError('The update changed unrelated page bytes')
    return patches, candidate, {
        'schema': 'MathScope.M3.OwnedBlockUpdate/1',
        'observedSHA256': sha(observed), 'candidateSHA256': sha(candidate),
        'group': group, 'changedBlocks': changed, 'patchCount': len(patches),
        'newAssets': 0, 'newPages': 0, 'unrelatedBytesPreserved': True,
        'pagePatchChangesMathematicalSource': False, 'requestedM3Scope': 'ALL_64_INCLUDING_P7',
        'wholeM3Complete': False,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--observed', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--group', choices=['p7', 'extended', 'p8', 'all'], default='all')
    args = parser.parse_args()
    patches, page, manifest = build(args.observed.read_text(), args.group)
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / 'page-patches.json').write_text(json.dumps(patches, ensure_ascii=False))
    (args.out / 'candidate.html').write_text(page)
    (args.out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False))
