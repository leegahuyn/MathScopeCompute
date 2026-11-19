# 활성 원본 바깥 진폭과 펄스 집중

**VERIFIED.** 원본 표적과 바깥 인자 생성기를 다시 실행했다.
활성 그래프의 표적 슬롯 32017·32018과 별도 재생성의 두 본문이
변수 이름과 노드 번호를 제외하고 일치했다. 이 비교는 적분의 결속
좌표, 네이티브 인자 순서와 미분 차수를 보존한다.
실제 네 Haar 적분의 양쪽 질량과 같은 길이·cutoff·정규화 인자를
대조했다. 표적 인자의 끝점과 종단 높이도 원래 프로필과 일치한다.

바깥 로그 거리 \(d=\log(X_b/X)\)에서 \(0<d\le1/2\)이면
\(X_+<X\)이고 원본 열 cutoff가 1이다.
원래 선도 모멘트와 보통 적분 해석 아래 활성 원본 표적은
\[
 T_{\rm bar}=\exp(-4/d^2)d^{-3}\,\bar b,\qquad
 \bar b=s^{-A-1/2}(b_\theta,d^6 b_z)
\]
이다. 원본 세 각응력 항, 압력 제곱과 두 축방향 적분을 유지했다.
같은 활성 차트에 기존 종단 Taylor·열 적분 상계를 연결하면
\(\bar b\)의 실제 \(R,Z,T\) 미분 8차까지 명시적 상수를 갖는다.
기존 프로필 상계를 \(\log X\)에서 \(X\)로 옮길 때 Stirling 계수의
합 \(j!\)과 \(X^{-j}\le1\)을 사용했다.

## Gaussian 집중과 정규화 진폭

\(S=\ell^2\)이며 고정 라벨을 미분할 때 일정하다.
원본 정수 팔레트와 펄스 길이는
\[
 \frac{1}{T_g S}<c_i\le\frac{1}{S},\qquad L_s=\frac{2r_0}{c_i}.
\]
원본 펄스 \(P\)의 Gaussian 하한 계수 \(g_L\)에 대해
\(\int_0^{L_s}P^2\,dv\le3\sqrt{L_s/(2g_L)}\)이다.
\(|x|\le1\)에서는 단위 상계를 쓰고, 바깥은
\(e^{-x^2}\le e^{-|x|}\)로 적분한다.
같은 Haar 인자를 곱하면 양쪽 원본 질량은
\(m_L/\sqrt S\)과 \(m_U/\sqrt S\) 사이에 있다.
양의 정규화 표적 크기 \(\tilde\tau\)는 같은 상자 방향 전제에서
\(R_{\mathrm{env}}^{-55}\)와 \(R_{\mathrm{env}}^8\) 사이에 있다.

**CONDITIONAL.** 원본이 허용하는 상자와 실제 방향·열·펄스 상계 아래
\(\lvert\det H\rvert\ge D_0/S\)이고, 기존 \(H\)의 양의 정규화 역을
써서 \(\lvert H^{-1}\rvert=O(\sqrt S)\)를 얻는다.
\(W=H^{-1}\bar b\)의 두 성분은 각각 \(\sqrt S\)에 비례하는
양의 양쪽 상계를 갖는다. 정규화 공분산 행렬의 각 열 오차가 \(\kappa/128\)
이하이고 표적 방향이 원래 cone 안에 있을 때의 행렬식·역·질량 하한
보조정리 두 개는 GitHub Lean에서 컴파일했다.
[GitHub Lean](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44625438914).

| 고정 느린 미분 \(j\) | 밴드 크기 \(S\)의 지수 |
| --- | ---: |
| \(H^{(j)}\) | \(2j-1/2\) |
| \(W^{(j)}\) | \(2j+1/2\) |
| \((\sqrt W)^{(j)}\) | \(2j+1/4\) |
| \((S^{-1/4}\sqrt W)^{(j)}\) | \(2j\) |

원래 Gaussian을 미분하면서 만든 인자는 이 표의 \(S\) 지수와
별도로 보존한다. 원본 \(\eta=\pm1\)에는 안쪽 열 미분을 쓰고,
\(d=0\)은 정칙 인자의 극한으로 계산한다. 이 미분 상계는 실제
행렬과 프레임 도함수의 원래 고정 라벨 상계에 의존한다.
첫 Forced의 펄스 행렬, 투영항 및 원본 \(P(v)\) 인자는
[별도 소스 검증](pulse-frame/README.md)에 있다.

**OPEN.** 전체 활성 라벨에서 높은 차수의 프레임·펄스 상수와
정량적인 동일 차트 결속, 전체 압력과 후속 보정, 최종장 수치 구간이
남는다. M3 62/64, 최종 jets 0/67 및 RELEASE HOLD다.

```text
node rebuild_outer_source.mjs ORIGINAL_RUNTIME NEW_ORIGINAL.json LOCAL_GRAPH.json
python -B verify_live_outer_source.py --goal GOAL --artifact HOSTED --cache CACHE --original NEW_ORIGINAL.json --private-graph LOCAL_GRAPH.json --out NEW_LIVE.json
python -B verify_outer_scale.py --goal GOAL --original NEW_ORIGINAL.json --live NEW_LIVE.json --out NEW_SCALE.json
```
