#!/usr/bin/env python3
"""Verify original byte preservation and the separate English edition manifest.

--write-manifest refreshes only the English/release-artifact manifest, after
all original-source and translation-coverage checks have succeeded.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
from restore_original_archive import EXPECTED_ARCHIVE_BYTES, EXPECTED_ARCHIVE_SHA256, EXPECTED_MANIFEST_SHA256

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = 'SOURCE_TRANSLATION_MANIFEST.json'
ORIGINAL_ROOTS = {'mathscope-m0', 'mathscope-m1', 'mathscope-extension'}
ARCHIVE_MEMBERS_ROOT = 'archive-members'
SKIP_DIRS = {'.git', '.lake', '.venv', 'venv', 'node_modules', '__pycache__', 'dist', 'runs', 'm1-output'}
SKIP_FILES = {MANIFEST, 'ENGLISH_PACKAGE_MANIFEST.json'}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_bytes(value) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def read_json(relative: str):
    return json.loads((ROOT / relative).read_text(encoding='utf-8'))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def edition_files():
    result = {}
    for current, directories, files in os.walk(ROOT, followlinks=False):
        current_path = Path(current)
        directories[:] = sorted(d for d in directories if d not in SKIP_DIRS
                                and not (current_path == ROOT and d in ORIGINAL_ROOTS | {ARCHIVE_MEMBERS_ROOT})
                                and not (current_path/d).is_symlink())
        for name in sorted(files):
            path = current_path/name
            relative = path.relative_to(ROOT).as_posix()
            if relative in SKIP_FILES or name.endswith(('.pyc','.tmp','.zip','.zip.sha256')):
                continue
            require(not path.is_symlink(), f'Symlink in edition artifacts: {relative}')
            result[relative] = path
    return dict(sorted(result.items()))


def validate_addon_root(directory: str):
    """Limit an explicit allowlist entry to a single dated or next-step addition."""
    require(isinstance(directory, str), 'Addon roots must be strings.')
    pure = PurePosixPath(directory)
    parts = pure.parts
    next_root = len(parts) >= 4 and parts[2] == 'followup-next'
    dated_root = (len(parts) >= 3 and
                  re.fullmatch(r'followup-[0-9]{8}-[a-z0-9][a-z0-9-]*', parts[2]) is not None)
    require(not pure.is_absolute() and '..' not in parts and str(pure) == directory
            and parts[:2] == ('mathscope-m1', 'navier')
            and (next_root or dated_root),
            'Unsafe or overbroad mathematical-addon root.')
    return pure


def addon_files():
    """Only explicitly allowed new source roots; existing v54 bytes are never replaced."""
    allowlist=read_json('provenance/addon-allowlist.json')
    result={}
    for directory in allowlist['allowedRoots']:
        validate_addon_root(directory)
        base=ROOT/directory
        require(not base.is_symlink(), f'Symlink at addon root: {directory}')
        if not base.exists():continue
        require(base.is_dir(), f'Addon root must be a directory: {directory}')
        for current,directories,files in os.walk(base,followlinks=False):
            current_path=Path(current)
            directories[:]=sorted(d for d in directories if d not in SKIP_DIRS and not d.startswith('.'))
            for child in directories:
                require(not (current_path/child).is_symlink(), f'Symlink in addon: {current_path/child}')
            for name in sorted(files):
                path=current_path/name
                relative=path.relative_to(ROOT).as_posix()
                if name.endswith(('.pyc','.tmp','.zip','.zip.sha256')):continue
                require(not path.is_symlink(),f'Symlink in addon: {relative}')
                result[relative]=path
    return dict(sorted(result.items()))


def archived_original_files(directory:Path|None=None, required=False):
    """Verify optional auxiliary originals; they are not English or new math sources."""
    directory=ROOT/ARCHIVE_MEMBERS_ROOT if directory is None else directory.resolve()
    if not directory.exists():
        require(not required, f'Archived original-member directory is missing: {directory}')
        return {}
    require(directory.is_dir() and not directory.is_symlink(), 'Archived originals must occupy a real directory.')
    selection=read_json('provenance/source-selection.json')
    expected={entry['path']:entry for entry in selection['omitted']}
    actual={}
    for current,directories,files in os.walk(directory,followlinks=False):
        current_path=Path(current)
        for child in directories:
            require(not (current_path/child).is_symlink(), f'Symlink in archived originals: {current_path/child}')
        for filename in files:
            path=current_path/filename
            name=path.relative_to(directory).as_posix()
            require(not path.is_symlink() and name in expected, f'Unexpected archived original member: {name}')
            data=path.read_bytes()
            entry=expected[name]
            require(len(data)==entry['bytes'] and sha(data)==entry['sha256'], f'Archived original bytes differ: {name}')
            actual[name]=path
    require(set(actual)==set(expected), 'Archived original-member directory must contain all 242 specified images.')
    return dict(sorted(actual.items()))


def validate_source_and_translation():
    selection = read_json('provenance/source-selection.json')
    original_manifest_path = ROOT/'provenance/original-v54-PACKAGE_MANIFEST.json'
    original_manifest = json.loads(original_manifest_path.read_text())
    require(selection['sourceArchive']['sha256']==EXPECTED_ARCHIVE_SHA256
            and selection['sourceArchive']['bytes']==EXPECTED_ARCHIVE_BYTES
            and selection['sourceArchive']['manifestSha256']==EXPECTED_MANIFEST_SHA256,
            'The delivered archive identity was changed.')
    require(sha(original_manifest_path.read_bytes()) == EXPECTED_MANIFEST_SHA256, 'Original manifest was modified.')
    original = {entry['path']: entry for entry in original_manifest['files']}
    included = {entry['path']: entry for entry in selection['included']}
    omitted = {entry['path']: entry for entry in selection['omitted']}
    require(len(original) == 935 and len(included) == 693 and len(omitted) == 242, 'Original selection counts changed.')
    require(set(included).isdisjoint(omitted) and set(included) | set(omitted) == set(original), 'Original membership is inconsistent.')
    additions=addon_files()
    require(set(additions).isdisjoint(original), 'A post-v54 addon tries to replace an original archive member.')
    archived_original_files()
    for name, entry in {**included, **omitted}.items():
        require(all(entry[key] == original[name][key] for key in ('path','bytes','sha256')), f'Original digest was rewritten: {name}')
        path = ROOT/name
        if name in included:
            require(path.is_file() and not path.is_symlink(), f'Preserved original file is missing: {name}')
        if path.exists():
            data = path.read_bytes()
            require(len(data) == entry['bytes'] and sha(data) == entry['sha256'], f'Original bytes differ: {name}')
        if name in omitted:
            require(path.suffix.lower() in {'.jpg','.jpeg','.png','.webp'}, f'A non-image original member was omitted: {name}')
    build = read_json('mathscope-m1/build-manifest.json')
    pins = build['sourceFiles']
    require(len(pins) == 50, 'Unexpected baseline source-pin count.')
    for name, digest in pins.items():
        require(name in included and sha((ROOT/name).read_bytes()) == digest, f'Pinned computation source differs: {name}')
    require(sha((ROOT/'mathscope-m1/m1.worker.js').read_bytes()) == build['workerSha256'], 'Worker digest differs.')
    require(sha((ROOT/'mathscope-m1/workspace.bundle.js').read_bytes()) == build['bundleSha256'], 'App-bundle digest differs.')

    originals = read_json('mathscope-m1/evidence/original-acceptance.json')
    normalized = read_json('mathscope-m1/report/M0_M1_normalized-report-data.json')
    statuses = {item['id']:item['status'] for item in normalized['items']}
    authored = read_json('localization/acceptance-text.en.json')
    companion = read_json('localization/acceptance.en.json')
    ids = [item['id'] for item in originals]
    require(len(ids) == len(set(ids)) == 70, 'The original criterion ID list differs.')
    require([item['id'] for item in companion['items']] == ids and set(authored) == set(ids), 'The English criterion list is incomplete or reordered.')
    require(companion['originalAcceptanceSha256'] == sha((ROOT/'mathscope-m1/evidence/original-acceptance.json').read_bytes()), 'Criterion-source binding differs.')
    require(companion['statusSourceSha256'] == sha((ROOT/'mathscope-m1/report/M0_M1_normalized-report-data.json').read_bytes()), 'Status-source binding differs.')
    for source, translated in zip(originals, companion['items']):
        identifier=source['id']
        require(translated['baselineStatus'] == statuses[identifier], f'Baseline status was promoted: {identifier}')
        require([translated['title'],translated['detail'],translated['acceptanceCriterion']] == authored[identifier], f'Translated content was not regenerated: {identifier}')
        require(not re.search('[가-힣]', ''.join(authored[identifier])), f'Untranslated criterion text: {identifier}')
        digest=sha(json.dumps(source,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())
        require(translated['originalRecordSha256'] == digest, f'Original criterion binding differs: {identifier}')
    counts = dict(Counter(item['baselineStatus'] for item in companion['items']))
    require(counts == {'PASS':61,'PARTIAL':7,'BLOCKED':2}, 'Frozen baseline counts changed.')

    script = "import {listExamples} from './mathscope-m1/core/registry.mjs'; process.stdout.write(JSON.stringify(await listExamples()));"
    result = subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,check=True,capture_output=True,text=True)
    registry = json.loads(result.stdout)
    example_labels = read_json('localization/examples-text.en.json')
    example_ids = [item['id'] for item in registry]
    require(len(example_ids) == len(set(example_ids)) == 59 and set(example_ids) == set(example_labels), 'English labels do not exactly cover the installed examples.')
    require(all(isinstance(x,str) and x and not re.search('[가-힣]',x) for x in example_labels.values()), 'An English example label is missing or untranslated.')
    return selection, build, companion, registry


def expected_manifest(selection, build, companion, registry):
    files=[]
    for name,path in edition_files().items():
        data=path.read_bytes()
        files.append({'path':name,'bytes':len(data),'sha256':sha(data),'category':'ENGLISH_GUIDE_TOOL_OR_RELEASE_PROVENANCE'})
    addons=[]
    for name,path in addon_files().items():
        data=path.read_bytes()
        addons.append({'path':name,'bytes':len(data),'sha256':sha(data),'category':'POST_V54_MATHEMATICAL_ADDON'})
    return {
        'schema':'MathScope.SourceAndEnglishEdition/1',
        'baseline':{'version':'v54','buildId':'16f4f911','date':'2026-10-10','timezone':'Asia/Seoul'},
        'sourceArchive':selection['sourceArchive'],
        'sourceSelection':{'path':'provenance/source-selection.json','sha256':sha((ROOT/'provenance/source-selection.json').read_bytes()),'includedOriginalFiles':693,'omittedRenderedImages':242},
        'auxiliaryOriginalImagePolicy':{
            'optionalStorageRoot':ARCHIVE_MEMBERS_ROOT,
            'expectedMembers':242,
            'membershipAndDigests':'provenance/source-selection.json omitted list; each stored path is archive-members/<original path>.',
            'category':'UNCHANGED_ORIGINAL_ARCHIVE_MEMBER',
            'optionalInCompactDistribution':True,
            'fullDistributionPlacement':'Original member paths, without duplicate archive-members copies.',
        },
        'pinnedComputation':{'sourceFiles':50,'workerSha256':build['workerSha256'],'bundleSha256':build['bundleSha256'],'originalBytesPreserved':True},
        'translation':{
            'locale':'en',
            'originalCriteria':70,
            'originalCriterionIds':[x['id'] for x in companion['items']],
            'exampleLabels':59,
            'exampleIds':[x['id'] for x in registry],
            'frozenBaselineCounts':companion['counts'],
            'coverage':'All original criterion titles, requirements, acceptance clauses; all example labels; English guides for installation, mathematical scope, eight NS families, nine gates, evidence, and packaging.',
            'mathematicalSourceOrRequestsModified':False,
            'historicalRawMessagesTranslated':False,
            'browserDeployedOrAutomaticallyTranslated':False,
        },
        'editionArtifactCount':len(files),
        'editionArtifacts':files,
        'postV54AddonCount':len(addons),
        'postV54Addons':addons,
        'addonPolicy':'Only provenance/addon-allowlist.json roots are included. These files are separate from the immutable original 693-file selection and its 50 baseline source pins.',
        'manifestSelfDigestExcluded':True,
        'evidenceBoundary':'Integrity and translation binding only. This verification does not run Lean, validate an analytic theorem, or promote the v54 acceptance status.',
    }


def verify(write_manifest=False):
    selection,build,companion,registry=validate_source_and_translation()
    expected=expected_manifest(selection,build,companion,registry)
    target=ROOT/MANIFEST
    if write_manifest:
        target.write_bytes(json_bytes(expected))
    else:
        require(target.is_file(), 'English manifest is missing. Generate it with --write-manifest after review.')
        require(json.loads(target.read_text()) == expected, 'English/release artifact bytes or membership changed; review and regenerate the English manifest explicitly.')
    return {
        'status':'SOURCE_AND_ENGLISH_BINDINGS_VERIFIED',
        'originalFilesVerified':len(selection['included']),
        'sourcePinsMatched':len(build['sourceFiles']),
        'translatedCriteria':len(companion['items']),
        'englishExampleLabels':len(registry),
        'editionArtifactsVerified':len(expected['editionArtifacts']),
        'postV54AddonArtifactsVerified':len(expected['postV54Addons']),
        'auxiliaryOriginalImagesVerified':len(archived_original_files()),
        'baselineCounts':companion['counts'],
        'manifestSha256':sha(target.read_bytes()),
        'formalPass':False,
        'buildOrDeploymentPerformed':False,
    }


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-manifest',action='store_true')
    args=parser.parse_args()
    print(json.dumps(verify(args.write_manifest),indent=2))


if __name__ == '__main__':
    main()
