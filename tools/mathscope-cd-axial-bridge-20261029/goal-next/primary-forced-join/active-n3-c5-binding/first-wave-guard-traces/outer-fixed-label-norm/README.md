# 활성 N3 원본 펄스와 바깥 진폭의 고정 라벨 상계

## VERIFIED

원본 3차 생성기를 두 번 실행했다. 활성 그래프 안의 연속된 원본 노드
123,870개가 기존 10차 배경 상계에 사용한 원본 접두부와 SHA-256까지
일치한다. 다음의 두 실제 배경원을 원본 계수와 대조했다.

| 배경원 | 실제 호출 | 네이티브 슬롯 | 정규화 슬롯 | 원본 계수 ID |
| --- | ---: | ---: | ---: | --- |
| \(F\) | 17732934 | 32027 | 32020 | 117100, 117670, 120457, 123548 |
| \(G\) | 17732935 | 32028 | 32021 | 117101, 117671, 120455, 123546 |

세 양의 차수는 실제 \(\chi(b_nq)q^{2nh}\)를 사용한다.
같은 원본 cutoff의 두 등록부 본문은 결속 변수 이름까지 정규화하면
일치한다. 실제 좌표는 \(q=2^{-\ell}s\), \(X=R^2/(2s)\),
\(\eta=Z/s^{1/2-h}\)이고, 두 물리 배율은 \(s^{-A-1/2}\),
\(s^{-A}\)이다. 창의 원래 네 번째 이후 cutoff가 평탄한 영인
조건을 적용한다. 계수 채널 교환과 2·3차 가중치 교환을 검산이
거부했다.

활성 Haar 질량에 실제로 들어간 양쪽 접벡터 \(P B w\)를
대조했다. 두 원본 Volterra 호출은 같은 \(v\), 고정된 라벨과 대표점,
그리고 실제 \(L_s\)를 사용한다. \(P\)와 \(L_s\)는 고정 라벨에서
\(R,Z,T\)와 독립이다. 기존 레지스트리 내부의 인증 플래그는
\(\mathrm{false}\)다. 아래 상계는 이 호출에 대해 별도로 적용하는
해석적 결론이다. [행렬과 미분 검산](matrix/README.md).

## CONDITIONAL

같은 원본 프로필과 차트의 정칙성 전제 아래, 실제 \(F,G\)에
느린 \(R,Z,T\) 미분 10차까지의 상계를 적용한다. 기존에 검증한 물리 slab
\(q_{\mathrm{Big}}/64\le q<q_{\mathrm{Big}}/16\)에서는 기존의
방향 반올림된 작은 상계를 그대로 쓸 수 있다. 허용된 N3 정수창의
나머지 점에서는 원본 비가중 양의 상계의 합에
\(2^{1867}\max(2,\Lambda,R_{\mathrm{env}})^{143}\)을 곱하면
라벨에 독립인 유한 상계가 된다. 후자는 \(q^{2nh}\le1\)을
사용하므로 작은 slab의 수치 문턱 비교는 이전되지 않는다.

원본의 같은 상자에서 \(n\)의 크기와 두 양의 분모가 제어되는
소섭동 조건을 사용한다. \(S=\ell^2\)이고 \(v\le L_s\le L_{\max}S\)
이므로, \(n\)의 양의 차수 도함수는 한 번의 \(S\)만 필요하다.
\(\partial_v n\), 원본 원통 연결 행렬, 고정된 참조 계수에는 이
인자가 없다. 이로부터 양쪽 부호에서 기저와 행렬 미분
\(D^jB,D^jM=O(S^j)\)가 \(j\le8\)까지 성립한다.
같은 원본 전파자 상계가 유지되는 조건에서 변분 적분은
\(D^j(Bw)=O(S^{2j})\)를 준다. 원본 고정 적분 구간과 C88의
양쪽 질량 상계 및 표적을 함께 쓰면 다음의 바깥 구간 상계를 얻는다.

| 양 | \(j\)차의 \(S\) 지수 |
| --- | ---: |
| \(H\) | \(2j-1/2\) |
| \(W=H^{-1}\bar b\) | \(2j+1/2\) |
| \(\sqrt W\) | \(2j+1/4\) |
| \(S^{-1/4}\sqrt W\) | \(2j\) |

이 미분은 라벨 \(\ell\)과 대표점을 고정한다. \(s,X,\eta\)의 정확한
경계에서는 내부 미분의 자취를 사용한다. 바깥 Gaussian 경계의 \(d=0\)에서는 C88의
정칙 계수와 극한 해석을 유지한다.

원본 \(\epsilon=\exp(-h\ell\log2)\)와 최소 라벨 문턱을 실제
노드에서 읽었다. \(0\le k\le64\)이면 저장된 원본 매개변수
부등식 아래 \(S^k\epsilon^\gamma\le\epsilon^{\gamma-2^{-20}}\)이다.
따라서 이 표에서 나온 다항식 인자는 원본 가중 지수의
\(2^{-20}\) 이내로 흡수된다.
[GitHub Lean 실행](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44630491627).

## OPEN

원본 전체 Forced 투영항과 후속 보정, 전체 압력 및 양 끝점과
중간 구간을 합친 최종 수치 구간이 남는다. 이 재현에서
N7-06 에너지 및 N8-05 수렴·꼬리 판정과 67개 최종 jet에는
수락을 추가하지 않았다. RELEASE HOLD다.

```text
node rebuild_background_roles.mjs ORIGINAL_RUNTIME NEW_ORIGINAL.json
python -B verify_outer_frame_input.py --goal GOAL --runtime ORIGINAL_RUNTIME --artifact HOSTED --cache CACHE --original NEW_ORIGINAL.json --out NEW_TRANSPORT.json
python -B verify_band_weight.py --goal GOAL --artifact HOSTED --cache CACHE --background NEW_TRANSPORT.json --matrix matrix/matrix-s-j.json --out NEW_WEIGHT.json
```
