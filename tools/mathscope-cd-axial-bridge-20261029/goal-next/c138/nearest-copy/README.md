# Nearest-copy changes in the fixed-label torus rectangle

The original rectangle uses `copy=floor(mappedY-center+1/2)` and the two
orthogonal vectors $v_r=(1,1-\sqrt 2)$ and $v_t=(\sqrt 2-1,1)$, both with
squared norm $4-2\sqrt 2$. For the local offset $z$ after the copy,
the original definitions give $z=\xi v_r+\eta_{\rm aux}v_t$ and
$v=(\eta_{\rm aux}+r_0)/c_i$. The pulse interval is
$0<v<2r_0/c_i$. The original transverse guard and the pulse guard
therefore require $|\xi|,|\eta_{\rm aux}|<r_0$. Each basis coefficient
has magnitude at most one, so the support requires
$\lVert z\rVert_\infty<2r_0=2^{-33}$.

At a nearest-copy switch a coordinate of the offset is $\pm1/2$. An open
strip of radius $1/4$ around each switch has offset magnitude greater than
$1/4$ for both representatives. The guarded source is identically zero
in that strip. Its ordinary first jets are zero there, including at
a radial corner where the fixed-label slow coordinate is admitted. This
is a fixed-label result and does not establish equality across changes of
the physical reference label. The pinned dispatch packet supplies the
existing row layout for the prospective Repeat registration.

```text
python -B verify_nearest_copy_zero_strip.py --goal GOAL --runtime ORIGINAL_RESEARCH_IDE --out nearest-copy-zero-strip.json
```
