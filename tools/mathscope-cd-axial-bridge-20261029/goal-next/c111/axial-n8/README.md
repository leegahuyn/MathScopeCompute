# Original axial integrands and fixed boundaries through order eight

The authenticated issuer and C100 runner produce 165,076 records. Both source generations give identical outputs and logs. The original first-order density #117047, forward #117057, backward #117066 and stored whole #117075 remain identical. At order eight, density #143862 is the retained input to forward #143875, backward #143889 and whole #165056, independently of the power exponent. The original sign controls reject reversed signs at each of eight orders.

The two comparisons that exhausted the original 300,000 visit limit are incongruent candidates in a search for a unique density. The Python comparator visits 327,299 and 368,061 states, then independently returns false for both. The original comparator returns the same normal-form IDs and answer when it is applied to the second comparison with an explicit sufficient visit limit. A separate untrusted-data reader checks all 144,907 stored records, 6,817 integral binders, 483 application argument lists and 207 formal signatures for that comparison. It computes each free-coordinate set from the operand schema and matches it to the retained original argument lists.

Use the pinned original runtime, Node 24 and the existing C100 source runner. Set \`MATHSCOPE_AXIAL_PYTHON\` to the Python executable and use a file URL for the hook on Windows.

~~~text
node --max-old-space-size=5500 --stack-size=4096 --import HOOK EXISTING_RUNNER ORIGINAL_RUNTIME 8 5000000 FRESH_OUTPUT.json
node check_capture_control.mjs ORIGINAL_PRIMITIVE_MODULE primitive-request.tmp.json REPLAY_LOG
python -B verify_free_coordinates.py primitive-request.tmp.json
~~~

The diagnostic request is produced by the exact replay and authenticated in each log. The arbitrary-order ordinary native realization and infinite tail are open. The existing proof of fixed-endpoint exchange applies once the required original derivative continuity is established.
