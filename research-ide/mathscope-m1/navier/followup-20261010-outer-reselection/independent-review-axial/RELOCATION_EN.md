# Reproducible location of the independent axial review

The original scratch review and its source files are preserved unchanged.
REVIEW_EN.md is that original audit text, including its historical local
execution path. In this distribution use:

~~~sh
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/independent-review-axial/review_checks.py
~~~

The copied script changes only the TARGET path assignment to the sibling
independent-axial directory. Its arithmetic, exact polynomial identity,
source targets and scope are unchanged. The current checks.json is the
actual replay from this portable location; it records 16/16 checks and a
47/47 in-memory producer replay. Neither reviewed source nor producer
receipt is rewritten.

Original review script SHA-256:
3b8db64f945e391c0048e5e685d9aaf08573c2b040ef137015a3fa18f3001d22

Original review prose SHA-256:
ae60c9a8af29e3d56e7451f89d87ff8fb8dda3ca79a9752a3c6fee88f7334d2b
