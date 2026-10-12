# 실제 terminal potential 3차 jet의 독립 읽기 검토

검토자는 source 실행을 다시 하지 않았다. 별도 agent가 작성한 모듈, 일반 검사의 수학, 실제 source attempt3 JSON/log 및 68개 literal import 파일의 현재 SHA를 읽고 대조했다.

## 확인한 실행

- Source HEAD: a2bc6ef15632f2c953915e41352e03fbc096e4fc.
- 실제 attempt3: 11개 실행 검사 그룹 PASS, runner의 exitCode 0 기록과 실행 담당자의 관측 exit 0.
- 43,001.87623 ms, peak RSS 1,905,721,344 bytes.
- 363,295 nodes, canonical program 15,756,568 bytes.
- Graph SHA256: e96bcba6819970cf60fc32613a753a70775ea7f44592ecdcf8c0129cc8c7f688.
- Source JSON SHA256: 1ba133dc0924892f2013baf6daa468a8c907e3f6021ad6fea2be664a25fff4e8.
- 68개 import manifest SHA256: 54af4455efca90829554fcd457b6f938d7fa2c0a4f981ac73dd6912737bdffcd.
- 검토 시 68개 파일의 SHA가 모두 실행 manifest와 같았다.

원래 private small-q terminal covariance source의 선택 band, 전체 \(H,\bar T,y,\sqrt y\)를 유지한다. 당시 별도로 강화한 \(a_n\) 배경과 동일시하지 않는다.

## 1. 40성분 계와 실제 함수의 동일성

세 slow 변수의 \(|\alpha|\le3\)인 multiindex는 20개이고 각 \(w_\alpha\)에는 두 성분이 있으므로 확장 계의 차원은 40이다. 코드의 블록 행은

\[
\partial_vw_\alpha
=\sum_{\beta\le\alpha}{\alpha\choose\beta}
M_{\alpha-\beta}w_\beta
\]

를 직접 생성한다. 반복된 세 미분에서 \(1,3,3,1\) 계수가 생기는 식과 혼합미분 식이 일치한다. 원래 0차 covariance system과의 결속은 변수, parameter 배열, matrix body, datum 및 길이를 모두 대조한 후에만 허용한다. 단지 같은 이름의 새 ODE를 만들어 원래 해라고 부르지 않는다.

현재 실제 datum은 \(w(0)=(1,0)\)이고 왼쪽 끝점 0과 길이 \(L_s\)는 slow 변수에 독립이다. 그 독립성은 원래 source roots에서 검사한다. generic kernel의 움직이는 평가점 chain rule과 원래 실제 고정 초기 끝점은 별개로 유지한다.

## 2. FTC 상계의 정확한 의미

각 실제 \(M_\alpha\), \(B_\alpha\)의 body와 pulse 시간 미분을 생성한다. norm은 실제 finite interval에서의

\[
\sqrt{1+f(0,a)^2}
+\int_0^{L_s}\sqrt{1+(\partial_vf(v,a))^2}\,dv
\]

형식이다. 유한 interval의 FTC와 삼각부등식으로 \(\sup_v|f(v,a)|\)를 상계한다. matrix에는 실제 최대 행합을 쓴다. 각 \(\alpha\) 블록의 binomial 행합으로 확장 계 norm을 만드는 점도 맞다.

새 compact share는 임의의 함수 oracle가 아니다. body와 그 실제 시간 미분을 유지하고, share의 두 materialization이 원래 body 및 원래 AD 시간 미분 root와 같은지 확인한다. 초기점 및 적분 dummy 변수의 대입만 공유한다. cutoff/heat/Volterra의 수치 적분을 실행했다는 주장은 없다.

이 norm은 parameter에 의존한다. 열린 terminal chart의 각 compact 내부 근방에서 joint smoothness와 locally bounded \(L_s\)를 이용하면 국소 균일 majorant가 생기므로 미분한 Volterra 수렴을 정당화한다. 모든 band나 flat 경계에서의 한 공통 수치 norm이라고 읽어서는 안 된다.

## 3. 공분산, 역행렬, 제곱근 및 potential

실제 \(t=B(Pw)\)의 곱 순서를 보존하고, 별도의 Leibniz 식으로 같은 body의 모든 20개 multiindex를 대조한다. \(P\)와 원래 transverse cutoff \(\chi(\xi)\), pulse 시간 cutoff \(\psi(v)\)의 slow 독립성은 원래 source에서 확인한다. 이 진술은 slow partition \(\eta_\beta\)를 상수로 취급한다는 뜻이 아니다. 2개 sign과 각 2개 covariance 성분, 20개 multiindex를 합친 80개 공분산 적분 검사는 고정된 0과 \(L_s\) 사이의 원래 적분을 유지한다.

\[
H\,y_\alpha
=\bar T_\alpha-\sum_{0<\beta\le\alpha}
{\alpha\choose\beta}H_\beta y_{\alpha-\beta}
\]

의 실제 두 성분을 20개 multiindex에서 검사한다. 행렬식이 0이 아님은 원래 small-q source 양성 정리에서 소비하며, generic rational identity 자체가 그 부호를 증명하는 것은 아니다.

\[
2\sigma\sigma_\alpha
=y_\alpha-\sum_{0<\beta<\alpha}
{\alpha\choose\beta}\sigma_\beta\sigma_{\alpha-\beta}
\]

의 합은 두 끝점을 제외한다. 양의 차수 19개에 대해 각 weight의 실제 \(\sqrt y\) AD를 대조한다. 원래 weight의 양성 범위를 벗어난 square root를 계산하지 않는다.

Potential은 실제 \(\sqrt\epsilon\), \(\sqrt y\), transverse/longitudinal cutoff, \(k|n|^2\) 분모, \(n\times t\), 고정 label slow partition factor를 모두 포함한다. 각 sign의 세 성분에 20개 multiindex, 합계 60개 root가 있다. Phase의 cylindrical gradient가 실제 \(n\)이라는 결속도 포함된다. 이것만으로 전체 physical time derivative 또는 전체 velocity의 2차 derivative가 자동 구성되었다고 결론내리지는 않는다.

## 4. 대수 share의 책임 범위

retainedThirdBodyBinding은 각 source body를 가진 share를 만들고, 20개 formal derivative를 materialize하여 직접 AD root와 동일함을 대조한다. 역행렬·제곱근·곱 adapter는 그 대조를 실제로 소비한다. 공통 determinant의 분모를 먼저 통분하는 방식은 동일한 분모를 중복하여 폭발적으로 전개하는 일을 피하며, 필요한 거듭제곱과 본문을 없애지 않는다.

다만 generic retainedCommonDenominatorIdentity의 내부 polynomial checker는 analytic/share operand를 원자로 취급한다. 그 helper의 sourceFunctionsMaterializedToTheirBodies 플래그는 helper 단독으로 실행한 추가 analytic 전개가 아니라 **앞뒤 caller의 명시적 body binding 검사에 의존하는 설명**으로 읽어야 한다. 실제 source adapter에서 그 검사가 모두 통과했음을 확인했다. 이 문구의 구분은 수학 식이나 당시 실행 SHA를 바꾸지 않는 검토 사항이다.

## 5. 실패 기록과 결론의 한계

첫 source attempt의 heap OOM, 두 번째 attempt의 기존 frozen carrier의 동치 0 branch 표현에 관한 결속 실패는 실제 개발 실패 기록이다. 설계된 음성대조로 다시 이름 붙이지 않는다. cache 폐기는 memo table만 대상으로 하며, 원래 node, lookup, source parameter, 함수 정의, Volterra 정의와 private seal은 보존한다. 동치 branch 정규화는 같은 세 branch만 합치고, 활성 branch를 제거하는 근사가 아니다.

읽기 검토에서 현재 **선택한 작은 q terminal 열린 chart의 3차 slow jet** 명제에 수학적 오류를 찾지 못했다. 이 판단은 새 Lean kernel 증명이나 68개 프로그램 전체의 형식 검증이 아니다. 전체 공분산 수치 enclosure, 모든 label의 합, inner/outer flat 연장, 전체 물리 residual 및 M2 완료는 이 결과로 주장할 수 없다.
