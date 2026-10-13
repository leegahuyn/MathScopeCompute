"""Attack controls for repository versus standalone edition membership."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import verify_english_release as verify


class EditionVisibilityTests(unittest.TestCase):
    def setUp(self):
        if shutil.which('git') is None:
            self.skipTest('Git is required for repository membership attack controls.')
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.root = self.repo / 'research-ide'
        self.root.mkdir()
        self.git('init', '-q')
        self.patch = patch.object(verify, 'ROOT', self.root)
        self.patch.start()
        self.addCleanup(self.patch.stop)

    def git(self, *args):
        return subprocess.run(['git', *args], cwd=self.repo, check=True,
                              capture_output=True, encoding='utf-8')

    def write(self, relative, value='source'):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value, encoding='utf-8', newline='\n')
        return path

    def ignore(self, pattern):
        (self.repo / '.gitignore').write_text(pattern + '\n', encoding='utf-8', newline='\n')

    def manifest(self):
        selection = {'sourceArchive': {}}
        self.write('provenance/source-selection.json', '{}')
        self.write('provenance/addon-allowlist.json', '{"allowedRoots":[]}')
        return verify.expected_manifest(selection, {'workerSha256': 'worker', 'bundleSha256': 'bundle'},
                                        {'items': [], 'counts': {}}, [])

    def test_ignored_local_html_is_excluded_without_excluding_m4_evidence(self):
        self.ignore('research-ide/mathscope-m4/evidence/local-candidate*.html')
        self.write('mathscope-m4/evidence/local-candidate.html', 'unpublished local candidate')
        self.write('mathscope-m4/evidence/replay-receipt.json', '{"pass":false}')
        self.write('mathscope-m4/acceptance.mjs', 'export const complete=false;')
        files = verify.edition_files()
        self.assertNotIn('mathscope-m4/evidence/local-candidate.html', files)
        self.assertIn('mathscope-m4/evidence/replay-receipt.json', files)
        self.assertIn('mathscope-m4/acceptance.mjs', files)

    def test_an_ignore_rule_cannot_remove_a_tracked_proof_receipt(self):
        self.write('mathscope-m4/evidence/pinned-proof.json', '{"pass":false}')
        self.git('add', 'research-ide/mathscope-m4/evidence/pinned-proof.json')
        self.ignore('research-ide/mathscope-m4/evidence/*.json')
        self.write('mathscope-m4/evidence/ignored-untracked.json', '{"pass":true}')
        files = verify.edition_files()
        self.assertIn('mathscope-m4/evidence/pinned-proof.json', files)
        self.assertNotIn('mathscope-m4/evidence/ignored-untracked.json', files)

    def test_an_explicitly_added_ignored_candidate_changes_manifest_membership(self):
        self.ignore('research-ide/mathscope-m4/evidence/local-candidate*.html')
        self.write('mathscope-m4/evidence/local-candidate.html')
        before = self.manifest()
        self.git('add', '-f', 'research-ide/mathscope-m4/evidence/local-candidate.html')
        after = self.manifest()
        self.assertNotEqual(before, after)
        self.assertIn('mathscope-m4/evidence/local-candidate.html', {r['path'] for r in after['editionArtifacts']})

    def test_new_untracked_code_and_changed_proof_bytes_make_manifest_stale(self):
        proof = self.write('mathscope-m4/evidence/replay-receipt.json', '{"pass":false}')
        self.git('add', 'research-ide/mathscope-m4/evidence/replay-receipt.json')
        before = self.manifest()
        self.write('mathscope-m3/navier/new-reviewed-source.mjs', 'export const complete=false;')
        proof.write_text('{"pass":true}', encoding='utf-8', newline='\n')
        after = self.manifest()
        self.assertNotEqual(before, after)
        row = next(r for r in after['editionArtifacts'] if r['path'] == 'mathscope-m4/evidence/replay-receipt.json')
        self.assertEqual(row['sha256'], hashlib.sha256(proof.read_bytes()).hexdigest())
        self.assertIn('mathscope-m3/navier/new-reviewed-source.mjs', {r['path'] for r in after['editionArtifacts']})

    def test_missing_tracked_artifact_cannot_be_silently_regenerated_away(self):
        path = self.write('mathscope-m4/evidence/replay-receipt.json')
        self.git('add', 'research-ide/mathscope-m4/evidence/replay-receipt.json')
        path.unlink()
        with self.assertRaisesRegex(ValueError, 'Git-visible edition artifact is missing'):
            verify.edition_files()

    def test_standalone_archive_replay_keeps_full_filesystem_membership(self):
        outside = self.repo / 'standalone'
        outside.mkdir()
        (outside / 'release-guide.md').write_text('guide', encoding='utf-8')
        # This directory is still beneath the temporary Git worktree; force
        # the Git probe to report no worktree as an unpacked archive would.
        probe = subprocess.CompletedProcess([], 128, stdout='', stderr='not a git repository')
        with patch.object(verify, 'ROOT', outside), patch.object(verify.subprocess, 'run', return_value=probe):
            self.assertIn('release-guide.md', verify.edition_files())


if __name__ == '__main__':
    unittest.main()
