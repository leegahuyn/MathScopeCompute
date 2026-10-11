# 실제 terminal slow F의 수정 수치 jet: 최종 독립 검토

## 결론

수정된 두 번째 source 실행과 원래 field body를 읽고 비교했다. **현재 표시 점에서의 실제 slow F 값과 9개 1·2차 slow jet에 대해, 원래 양의 배율을 보존한 coefficient 구간이라는 범위에서 수학적 오류를 찾지 못했다.** 첫 실행을 거절한 이유와 당시 기록은 [첫 독립 거절 기록](INDEPENDENT_TERMINAL_FIELD_ATTEMPT1_REJECTION_KO.md)에 그대로 남아 있다. 그 기록을 수정된 결과로 덮어쓰지 않는다.

검토자는 새 heavy source를 실행하지 않았다. 원래 operator, 수정 모듈·tests, 최종 certificate/process/TAP 및 현재 54개 literal import 파일의 SHA를 대조했다. 이는 새로운 Lean kernel 증명이나 전체 프로그램의 형식 검증이 아니다.

## 1. 수정 실행과 현재 파일의 결속

- Source attempt2: 8/8 실행 검사 그룹 PASS, process exit 0.
- Process 18.295835989998523초, peak RSS 1,424,347,136 bytes.
- 233,782 nodes, canonical program 9,310,892 bytes.
- Graph SHA256: `e6a91c2e34d2f914b5c014542c826ebdeceff3ccb7db4365e41f1ef72c823501`.
- Source module SHA256: `c2a0fc4c57f07cd63533f981163bfb4e516ac66c81d9a6fac753f98fcbff11f7`.
- Certificate SHA256: `68e90d6322776d06760ba9a07da9314c4cd8d8a0942c5eec2de61e5b3b4ad01a`.
- Process SHA256: `82a19ac9fb6f2a54f09b5fbb8c4a621e067b224aa8516ad3e64f7242b3b8c36e`.
- TAP SHA256: `753014db61b346d61c62816e121f7b366c730110dc8529ec3ca201951cfceae4`.

실행 전후 54개 import가 같다는 process 기록을 확인했고, 검토 시점의 54개 파일도 모두 그 SHA와 일치했다. 최종 certificate의 10개 source 결속 항목과 13개 일반 미분·정규화 항등식이 모두 PASS이다. 누락된 radial 곡률, implicit Z 곡률, 원래 slow 배율의 세 음성대조를 확인했다.

## 2. 원래 s 배율은 값 비교와 별도로 검사된다

수정 코드가 원래 leading 및 completed F share의 body를 각각 읽고

\[
F_{\rm slow}=s^{-A-1/2}F_{\rm profile}(X,\eta),\qquad
b=-A-\tfrac12=-1-h
\]

라는 곱 전체의 literal equality를 대조하는 것을 확인했다. 따라서 \(s=1\)에서만 값이 같은 두 함수를 도함수에서도 같다고 취급하던 첫 오류가 제거됐다.

원래 terminal 식, \(X=R^2/(2s)\), \(z=4T/R^2\)를 함께 사용하면

\[
F_{\rm slow}=C_{\rm tail}(R^2/2)^b f(y)H(z),\quad
y=\log\frac{R^2}{2sX_{\rm tail}}.
\]

generic integrand audit도 이 실제 배율을 먼저 포함하여 미분한다. 지수의 소거는 양의 s와 X에서의 해석 항등식이며, 원래 heat 적분의 값이나 h를 바꾸는 근사가 아니다.

## 3. 미분식과 부호

최종 T, RT, TT의 식은 첫 독립 검토에서 다시 도출한 실제 slow 식과 같다. \(Z=0,T=s=1\)에서 \(s_Z=0,s_{ZZ}=2\), \(z_Z=0\)이므로

\[
F_{ZZ}=-2Bf_yH<0.
\]

heat만의 ZZ jet이 0인 사실은 전체 F의 ZZ jet을 0으로 만들지 않는다. 전체 F의 Z 곡률에는 terminal cutoff의 미분이 남는다.

\(f=1-ha\), \(f_y=hd\), \(f_{yy}=hc\),
\(H'=-hD_1\), \(H''=h(1+h)D_2\)를 대입한 h 분리식도 대조했다. T, RT, TT, ZZ에서 양의 h를 정확히 먼저 뽑기 때문에 작은 h를 수치 0으로 바꾸지 않고 계수의 부호를 판정한다.

| 실제 jet | 최종 부호 | 보존한 양의 배율 |
|---|---|---|
| F | 양수 | B |
| R | 음수 | B/R |
| T | 음수 | Bh/T |
| RR | 양수 | B/R² |
| RT | 양수 | Bh/(RT) |
| ZZ | 음수 | Bh |
| TT | 음수 | Bh/T² |
| Z, RZ, ZT | 0 | 원래 Z-even chart의 정확한 0 |

여기서 T=1은 현재 witness의 값이다. 표의 배율을 일반 T에 대한 수치 평가로 확대하지 않는다.

## 4. 수치 구간의 의미

terminal step의 실제 인자는 \(1/8\)이고, 지수는 정확히 \(-3072/49\)이다. \(g'\), \(g''\), sigmoid 1·2차 미분식과 원래 step의 reflection 식을 대조했다. 양의 지수 Taylor 급수의 명시적 나머지, 외향 제곱, 외향 역수 순서가 지수 구간을 보존한다. 코드가 양의 exp와 step 도함수의 부호를 실제 구간에서 분리한다.

전체 heat의 \(D_0,D_1,D_2\)는 기존 source-bound 양의 Gamma 적분에서 온다. 고정된 유한 heat 미분의 적분 integrand는 원래 Gamma 밀도에 다항식을 곱한 함수로 지배되므로, 사용한 미분과 적분 교환이 정당하다. 이 검토에서 기존 전체 heat 모듈의 변경은 필요하지 않았다.

각 coefficient 폭은 실제 요청 tolerance와 비교한다. source B와 h를 수치로 고상대정밀 평가했다고 말하지 않는다. \(0<B<1\), \(h<2^{-4096}\), \(R>2^{1280}\), \(R^2>2^{2561}\)를 사용한 느슨한 raw 절대 구간도 부호와 방향이 맞다. raw 구간에 쓰인 0 끝점은 상계·하계의 끝점이며, source 인자를 0으로 대입한 결과가 아니다.

## 5. 완료로 넓힐 수 없는 범위

현재 결과는 원래 식을 쓰는 terminal witness 한 점의 scaled 수치 jet이다. 표시용 ell=1의 원래 최종 \(\Gamma\) 소속이나 그 band의 양의 covariance weights를 주장하지 않는다. 전체 영역 F, 실제 Volterra pulse, 전체 H, determinant 또는 weights의 수치 구간을 완성한 것도 아니다. 전역 residual·flat-error, G-NUM 전체, G-POS 전체, 새로운 해석 Lean 및 M3 시작은 이 결과로 승인되지 않는다.
