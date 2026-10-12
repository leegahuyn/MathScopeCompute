"""Static local module bundling with two audited deferred assertion imports.

The preserved M2 family graph has two ESM cycles. Each backedge imports only
the same assertion function, called from function bodies after initialization.
The exact reviewed bytes are allowlisted; all other cycles fail closed.
"""
from pathlib import Path
import hashlib
import re

RESEARCH = Path(__file__).resolve().parents[2]
IMPORT = re.compile(r"^import\s+(\{[\s\S]*?\}|\*\s+as\s+\w+)\s+from\s+['\"]([^'\"]+)['\"];?\s*$", re.M)
REEXPORT = re.compile(r"^export\s+(\{[^}]+\}|\*)\s+from\s+['\"]([^'\"]+)['\"];?\s*$", re.M)
FAMILY = 'mathscope-m2/navier/actual-common-admissible-family.mjs'
FAMILY_SHA = '7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75'
AUDITED_EDGES = [
    {'from': 'mathscope-m2/navier/actual-common-admissible-band.mjs', 'to': FAMILY,
     'fromSHA256': '41a1fb93ec6384a3999761913ede62d374bce077810c366cbb6c2a065c71d28a', 'toSHA256': FAMILY_SHA,
     'functions': ['assertActualCommonAdmissibleFamily']},
    {'from': 'mathscope-m2/navier/actual-common-target-weighted-norms.mjs', 'to': FAMILY,
     'fromSHA256': '6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a', 'toSHA256': FAMILY_SHA,
     'functions': ['assertActualCommonAdmissibleFamily']},
]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def bundle(entry, *, root=RESEARCH, audited_edges=None):
    root = Path(root).resolve()
    allowed = AUDITED_EDGES if audited_edges is None else audited_edges
    order, visiting, done, deferred = [], set(), set(), {}

    def target(path, value):
        if not value.startswith('.'):
            raise ValueError('Only static local imports: ' + value)
        resolved = (path.parent / value).resolve()
        if not resolved.is_relative_to(root) or not resolved.is_file():
            raise ValueError('Invalid module path: ' + str(resolved))
        return resolved

    def visit(path):
        if path in done:
            return
        visiting.add(path)
        source = path.read_text(encoding='utf-8')
        if re.search(r'\bimport\s*\(|\bimport\.meta|\beval\s*\(|\bnew\s+Function\b', source):
            raise ValueError('Dynamic execution is outside this static bundle: ' + str(path))
        for pattern in [IMPORT, REEXPORT]:
            for match in pattern.finditer(source):
                dependency = target(path, match.group(2))
                if dependency in visiting:
                    key = (path.relative_to(root).as_posix(), dependency.relative_to(root).as_posix())
                    rows = [row for row in allowed if (row['from'], row['to']) == key]
                    if pattern is not IMPORT or len(rows) != 1:
                        raise ValueError('Unaudited module cycle: ' + ' -> '.join(key))
                    row = rows[0]
                    fields = [name.strip() for name in match.group(1).strip('{}').split(',')]
                    if fields != row['functions'] or any(not re.fullmatch(r'[A-Za-z_$][\w$]*', name) for name in fields):
                        raise ValueError('Cycle import must contain exactly its audited named functions.')
                    if sha(path) != row['fromSHA256'] or sha(dependency) != row['toSHA256']:
                        raise ValueError('Audited cycle source bytes changed.')
                    for name in fields:
                        if not re.search(r'^export\s+(?:async\s+)?function\s+' + re.escape(name) + r'\s*\(', dependency.read_text(), re.M):
                            raise ValueError('Deferred cycle export is not an explicit function.')
                    deferred[(path, dependency)] = dict(row)
                else:
                    visit(dependency)
        visiting.remove(path)
        done.add(path)
        order.append(path)

    visit(Path(entry).resolve())
    symbols = {path: '__m3_static_' + str(i) for i, path in enumerate(order)}
    output = ['/* Static M3 closure; original source bytes are bound in build metadata. */', '(()=>{', '"use strict";',
              'let ' + ','.join(symbols.values()) + ';']
    for path in order:
        source = path.read_text(encoding='utf-8')
        exports, stars = [], []

        def imports(match):
            fields = match.group(1)
            dep_path = target(path, match.group(2))
            dependency = symbols[dep_path]
            row = deferred.get((path, dep_path))
            if row:
                return '\n'.join('function ' + name + '(...args){if(!' + dependency + '||typeof ' + dependency + '.' + name +
                                 '!=="function")throw new ReferenceError("Deferred source assertion accessed before module initialization");return ' +
                                 dependency + '.' + name + '(...args);}' for name in row['functions'])
            return 'const ' + (fields.split()[-1] if fields.startswith('*') else re.sub(r'\s+as\s+', ': ', fields)) + ' = ' + dependency + ';'

        source = IMPORT.sub(imports, source)

        def reexport(match):
            dependency = symbols[target(path, match.group(2))]
            if match.group(1) == '*':
                stars.append('...' + dependency)
            else:
                for item in match.group(1)[1:-1].split(','):
                    names = re.split(r'\s+as\s+', item.strip())
                    exports.append(names[-1] + ':' + dependency + '.' + names[0])
            return ''

        source = REEXPORT.sub(reexport, source)
        exports.extend(re.findall(r'^export\s+(?:async\s+)?(?:function|class|const|let)\s+([\w$]+)', source, re.M))

        def list_export(match):
            for item in match.group(1).split(','):
                names = re.split(r'\s+as\s+', item.strip())
                exports.append(names[-1] + ':' + names[0])
            return ''

        source = re.sub(r'^export\s*\{([^}]+)\}\s*;?\s*$', list_export, source, flags=re.M)
        source = re.sub(r'^export\s+', '', source, flags=re.M)
        if re.search(r'^\s*(?:import|export)\s', source, re.M):
            raise ValueError('Unsupported ESM form: ' + str(path))
        output += [symbols[path] + ' = (()=>{', source, 'return {' + ','.join(stars + list(dict.fromkeys(exports))) + '};', '})();']
    output.append('})();')
    audit = [deferred[key] for key in sorted(deferred, key=lambda pair: (str(pair[0]), str(pair[1])))]
    return '\n'.join(output), order, audit
