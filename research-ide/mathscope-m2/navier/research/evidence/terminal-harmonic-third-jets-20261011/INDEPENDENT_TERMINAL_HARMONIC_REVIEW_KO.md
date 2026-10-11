# 실제 terminal harmonic 3차 slow jet의 독립 검토

검토자는 새 heavy source를 실행하지 않았다. `actual-harmonic-third-jet-kernel.mjs`, `actual-terminal-harmonic-third-jets.mjs`, 실제 source runner와 최종 receipt를 읽고, 현재 70개 literal import SHA를 모두 실행 기록과 대조했다. **현재 선택한 작은 q의 열린 terminal chart에서, 실제 \(iC e^{ik\Phi}\)의 3차 slow 미분이라는 범위에 수학적 오류를 찾지 못했다.**

## 실행과 원래 C의 결속

- 실제 source attempt1: 11개 검사 그룹 PASS, 내부 source 결속 8개 PASS.
- JSON의 exitCode 0과 실행 담당자가 관측한 process exit 0을 확인했다.
- 45,872.619964 ms, peak RSS 1,905,029,120 bytes.
- 376,092 nodes, canonical program 15,852,199 bytes.
- Graph SHA256: `235374c4fe2bfe79912ed0a653c594864fc6a221c92f1142bef5ac0665bf0cd6`.
- Source JSON SHA256: `75af3dbfd80c0c3f7de438524beec1d8ad6ad129a1424213c27f45da4e6858bc`.
- Log SHA256: `25fdc75ccdb26327e81ce960aa80455d7238bdbbcc82ee7b035dc7bc13a42544`.
- 70개 import manifest SHA256: `25bc52614a5862c171ad3615a52e1f09e1266c7215c2f65a69937ca4d25d5980`.

검토 시 모든 70개 import 파일이 실행 SHA와 같았다. 원래 실제 C producer의 graph SHA `e96bcba6819970cf60fc32613a753a70775ea7f44592ecdcf8c0129cc8c7f688`를 그대로 재현하고, 그 고정 prefix를 유지한 채 harmonic 식을 append했다는 검사도 확인했다.

## Bell 항과 반복·혼합 미분

\(E_\alpha=e^{-ik\Phi}\partial^\alpha e^{ik\Phi}\)라 쓰면

\[
E_i=ik\Phi_i,\qquad
E_{ij}=-k^2\Phi_i\Phi_j+ik\Phi_{ij},
\]

\[
E_{ijl}=-k^2(\Phi_{ij}\Phi_l+\Phi_{il}\Phi_j+\Phi_{jl}\Phi_i)
+i(k\Phi_{ijl}-k^3\Phi_i\Phi_j\Phi_l).
\]

코드의 세 차수 식이 이 공식과 일치한다. 같은 축이 반복되면 세 pair 항이 각각 남아 정확한 계수 3이 된다. 서로 다른 세 축에서는 서로 다른 세 항을 보존한다. \(iC\)와의 Leibniz 합에서 multiindex binomial 계수도 빠지지 않는다.

\((A_\alpha+iB_\alpha)e^{ik\Phi}\)의 다음 미분은

\[
A_{\alpha+e_j}=\partial_j A_\alpha-k\Phi_jB_\alpha,
\qquad
B_{\alpha+e_j}=\partial_j B_\alpha+k\Phi_jA_\alpha
\]

이다. 차수 2 이하 multiindex는 10개이므로 세 방향의 phase recurrence edge는 30개, 세 성분의 edge는 90개다. 실제 두 sign 각각에서 이 수와 식을 대조한다. 20개 multiindex × 세 성분 × real/imaginary의 120개 scalar root가 sign마다 있다.

## 실제 삼각함수와 원래 함수 body

0차 real/imaginary body는 각각 \(-C\sin(k\Phi)\), \(C\cos(k\Phi)\)이다. 일반 share의 형식 대수 항등식 검사와 원래 body의 materialization 검사를 분리하는 점을 확인했다. 각 C 성분과 phase의 20개 share 미분을 실제 body로 materialize하고, 직접 원래 body를 미분한 root와 literal equality를 검사한다. 또한 C의 직접 20개 root는 앞선 실제 C producer의 20개 jet과 그대로 같다.

따라서 common-denominator polynomial helper가 analytic 함수를 단순한 symbol로 취급한다는 사실을 전체 함수 결속으로 오해하지 않는다. 실제 harmonic adapter가 별도 body 검사를 소비한다. 삼각함수는 원래 graph operation이고, 수치 값을 넣거나 별도 complex oracle를 도입하지 않는다.

실제 k와 원래 \(Q^{1/2-A}\) prefactor가 각 R/Z/T 방향에 독립인지 원래 root에서 검사한 뒤, 그 prefactor를 모든 root에 곱한다. 움직이는 정수 carrier의 불연속을 미분한 것은 아니다. carrier와 대표점은 원래 정해진 chart에서 고정된다.

## 범위

이 결과는 R/Z/T가 독립 slow 좌표인 상태에서 원통 frame의 계수 성분을 미분한다. \(\xi\), pulse 시간 v, 각도 \(\theta\)는 이 미분 동안 독립 좌표다. physical 좌표 대입으로 생기는 fast chain term, 원통 basis의 미분, 전체 curl 및 velocity의 2차 physical 미분은 별도 작업이다.

원래 선택한 열린 terminal 양성 범위와 전체 Volterra limit을 보존한다. 별도로 강화한 내부 background로 교체한 결과가 아니다. 모든 label의 무한 합, 경계 0 연장, 전역 physical residual·flat-error, 전체 G-NUM, 새로운 Lean kernel 증명 또는 M3 시작을 이 검토로 승인하지 않는다.
