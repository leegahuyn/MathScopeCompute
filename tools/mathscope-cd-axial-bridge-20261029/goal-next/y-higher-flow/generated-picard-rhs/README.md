# Generated original N4 Picard radial-derivative operands

`replay_picard_rhs.mjs` loads the original 7,358,162-node N4 export and
registry, checks their complete stream and byte hashes, reads the original
Picard source implementation and higher-order adapter under exact SHA-256
pins, and generates the **original** `picardRadialDerivative` for component 4
of systems `(order, id) = (1,0), (2,3), (3,5), (4,7), (5,9)` with actual
argument `sqrt(X)` and original formal eta #2. `X` is a fresh hypothetical
input coordinate, not a claimed original top-level caller.

For each system the checker finds, under the generated radial-derivative AST,
an actual `actual_Picard_radial_average` integral with its own fresh binder
and literal `[0,1]` endpoints. Within its integral body it finds natural
series calls with exactly the generated argument

```text
Y = Lambda * (t * sqrt(X))^2,  eta = #2.
```

The original system diagonal at component 4 is 3, so this integral is the
nonzero radial-average term in the original derivative formula. There are
9 distinct direct-operand calls in the generated order-one body and 6 in each
of the four higher bodies, counting unique AST nodes per body. These counts
overlap across bodies and are not a success fraction. For order 5 the fresh
replay IDs are integral #135275, binder #134747 and Y #135028. They are IDs
in this reconstructed graph, **not** IDs in the original exported graph.
The corresponding retained actual system id is 9 and source xi formal #129000.

The checker additionally generates each `picardRhs` at the same abstract
shifted input and checks its direct matching calls. It inspects ordinary
operand reach conservatively; it does not prove that every discovered node's
enclosing piecewise branch is active at any particular point. It does not
evaluate a Picard solution, identify the fresh X with an actual caller's
value, or expand lower native definitions. The readback records the entire
exact list in `higher-rhs.json`.

For a separately admissible real source frame `0<=X<=a^2`, `0<=t<=1`, and
the original parameter facts `a^2=Xa*exp(t1/16)`, `Xa=4/Lambda`,
`Lambda>0`, `0<t1<1`, the output is nonnegative and

```text
Y <= Lambda*Xa*exp(t1/16)
  = 4*exp(t1/16) < 4*(16/15) = 64/15 < 5.
```

The source graph endpoint and parameter nodes are authenticated here. The
`Xa` relation and `t1` inequalities come from the separate pinned profile
audit `work/goal-next/y-n4/audit_new15.py`, and are assumptions of this
replay; this program does not independently re-prove them. Bound-integral
semantics, valid eta, natural-series definedness at the endpoint, and source
smoothness are also premises. No log-branch argument is covered by this
direct-operand result. The original high-order coefficient bounds, all actual
caller ingresses, general n, arbitrary derivative materialization, infinite
Picard and differentiation/limit interchange remain open. RELEASE HOLD.

Run from workspace root, with Node.js:

```text
node --max-old-space-size=4096 work/goal-next/continuation39/y-source/replay_picard_rhs.mjs \
  work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph \
  work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs \
  work/goal-next/continuation39/y-source/higher-rhs.json
```

The two original runtime modules must be in the same source directory.
For PowerShell, use one line or native line continuations. The source module's
other imports are part of that same archived source tree and are not
individually hash-pinned by this replay. No local Lean or Git mutation.
