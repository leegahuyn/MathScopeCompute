#!/usr/bin/env python3
"""Create a verified self-contained English distribution; optional full v54 images.

This does not compile Lean, execute new mathematical checks, or deploy a site.
It preserves the original mathematical sources and the English edition layer.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
import zipfile

from restore_original_archive import validate_original_archive
from verify_english_release import ROOT, MANIFEST, addon_files, archived_original_files, edition_files, json_bytes, read_json, verify

ARCHIVE_ROOT='research-ide'
PACKAGE_MANIFEST='ENGLISH_PACKAGE_MANIFEST.json'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def package(output:Path, original_archive:Path|None, force:bool, archive_members:Path|None=None):
    if original_archive is not None and archive_members is not None:
        raise ValueError('Choose either the original ZIP or auxiliary-member reconstruction, not both.')
    verification=verify()
    selection=read_json('provenance/source-selection.json')
    source_paths={entry['path']:ROOT/entry['path'] for entry in selection['included']}
    auxiliary_paths={}
    if original_archive is None and archive_members is None:
        contents={name:path.read_bytes() for name,path in source_paths.items()}
        coverage='ALL_ORIGINAL_SOURCE_AND_EVIDENCE_TEXT_WITH_FINAL_SCREENSHOT; 242 RENDERED_IMAGES_OMITTED'
        original_count=len(contents)
        construction_source='GIT_SOURCE_SELECTION'
    elif archive_members is not None:
        auxiliary_paths=archived_original_files(archive_members,required=True)
        contents={name:path.read_bytes() for name,path in {**source_paths,**auxiliary_paths}.items()}
        original_count=len(contents)
        if original_count!=935:
            raise ValueError('Full reconstruction must contain exactly the 935 original source members.')
        coverage='ALL_935_ORIGINAL_MEMBERS; RECONSTRUCTED_FROM_GIT_SOURCES_AND_AUXILIARY_IMAGES'
        construction_source='GIT_MEMBERS_AND_AUXILIARY_IMAGES'
    else:
        original_contents,original_manifest=validate_original_archive(original_archive)
        contents={name:data for name,data in original_contents.items() if name!='PACKAGE_MANIFEST.json'}
        original_count=len(contents)
        if original_count!=935:
            raise ValueError('Full original coverage must include all 935 source members.')
        coverage='ALL_935_ORIGINAL_MEMBERS; ORIGINAL_ROOT_MANIFEST_PRESERVED_UNDER_PROVENANCE'
        construction_source='VERIFIED_ORIGINAL_ARCHIVE'
    observed_paths={**source_paths,**auxiliary_paths,**edition_files(),**addon_files(),MANIFEST:ROOT/MANIFEST}
    for name,path in observed_paths.items():
        data=path.read_bytes()
        if name in contents and contents[name]!=data:
            raise ValueError(f'Original archive and Git source differ: {name}')
        contents[name]=data
    contents=dict(sorted(contents.items()))
    manifest={
        'schema':'MathScope.EnglishDistributionPackage/1',
        'archiveRoot':ARCHIVE_ROOT,
        'baseline':{'version':'v54','buildId':'16f4f911','date':'2026-10-10','timezone':'Asia/Seoul'},
        'originalArchive':selection['sourceArchive'],
        'originalCoverage':coverage,
        'constructionSource':construction_source,
        'originalMembersIncluded':original_count,
        'postV54AddonMembersIncluded':len(addon_files()),
        'englishManifest':{'path':MANIFEST,'sha256':sha(contents[MANIFEST])},
        'fileCount':len(contents),
        'uncompressedBytes':sum(len(data) for data in contents.values()),
        'files':[{'path':name,'bytes':len(data),'sha256':sha(data)} for name,data in contents.items()],
        'preflight':verification,
        'deterministicZipMemberTime':'2026-10-10 00:00:00',
        'selfDigestExcluded':PACKAGE_MANIFEST+' is excluded from its own files list.',
        'buildOrDeploymentPerformed':False,
    }
    package_bytes=json_bytes(manifest)
    output=output.resolve()
    if output.exists() and not force:
        raise FileExistsError('Output already exists. Choose another path or explicitly pass --force.')
    output.parent.mkdir(parents=True,exist_ok=True)
    descriptor,tempname=tempfile.mkstemp(prefix='mathscope-english-',suffix='.tmp',dir=output.parent)
    os.close(descriptor)
    temp=Path(tempname)
    try:
        all_members={**contents,PACKAGE_MANIFEST:package_bytes}
        with zipfile.ZipFile(temp,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
            for name,data in all_members.items():
                info=zipfile.ZipInfo(ARCHIVE_ROOT+'/'+name,date_time=(2026,10,10,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED
                info.create_system=3
                info.external_attr=(0o100755 if data.startswith(b'#!') else 0o100644)<<16
                archive.writestr(info,data)
        with zipfile.ZipFile(temp) as archive:
            names=archive.namelist()
            expected={ARCHIVE_ROOT+'/'+name for name in all_members}
            if len(names)!=len(expected) or set(names)!=expected or archive.testzip() is not None:
                raise ValueError('ZIP member-set or CRC verification failed.')
            for name,data in all_members.items():
                returned=archive.read(ARCHIVE_ROOT+'/'+name)
                if len(returned)!=len(data) or sha(returned)!=sha(data):
                    raise ValueError(f'ZIP member digest mismatch: {name}')
        changed=[name for name,path in observed_paths.items() if path.read_bytes()!=contents[name]]
        if changed:
            raise ValueError('Source/edition changed during packaging: '+', '.join(changed))
        if output.exists() and not force:
            raise FileExistsError('Output appeared during packaging; refusing to replace it.')
        os.replace(temp,output)
    finally:
        if temp.exists():temp.unlink()
    receipt={
        'schema':'MathScope.EnglishDistributionReceipt/1',
        'status':'ZIP_CONTENT_VERIFIED',
        'path':str(output),
        'bytes':output.stat().st_size,
        'sha256':sha(output.read_bytes()),
        'originalMembersIncluded':original_count,
        'postV54AddonMembersIncluded':len(addon_files()),
        'totalFiles':len(contents),
        'archiveEntries':len(contents)+1,
        'allOriginalMembersIncluded':original_count==935,
        'constructionSource':construction_source,
        'rawOriginalArchiveChecked':original_archive is not None,
        'crcVerified':True,
        'everyMemberHashVerified':True,
        'sourceAndEditionUnchangedDuringPackaging':True,
        'sourcePinsMatched':verification['sourcePinsMatched'],
        'formalPass':False,
        'buildOrDeploymentPerformed':False,
    }
    output.with_suffix(output.suffix+'.sha256').write_text(receipt['sha256']+'  '+output.name+'\n')
    output.with_suffix('.package-receipt.json').write_bytes(json_bytes(receipt))
    return receipt


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'dist/MathScope_M0_M1_English.zip')
    source=parser.add_mutually_exclusive_group()
    source.add_argument('--original-archive',type=Path)
    source.add_argument('--archive-members',type=Path,help='Verified auxiliary originals at <directory>/<original path>; combine with the 693 preserved source members.')
    parser.add_argument('--force',action='store_true')
    args=parser.parse_args()
    print(json.dumps(package(args.output,args.original_archive,args.force,args.archive_members),indent=2))


if __name__=='__main__':
    main()
