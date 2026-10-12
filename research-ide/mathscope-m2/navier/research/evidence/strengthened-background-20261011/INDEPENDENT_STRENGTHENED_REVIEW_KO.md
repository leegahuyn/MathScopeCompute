# 강화 배경·유한 잔차의 독립 검토

검토 대상은 `validation.json` SHA-256 `649c4dca91c1483e330962c4a187acdc08d35d82996b69a4599f3a7ff3d64db9`에 고정된 세 새 모듈과 실제 두 번째 source 실행이다. 이는 실제 source 재실행을 새로 세는 문서가 아니다. 원본 PDF의 (5.24)–(5.26), 코드 본문, 성공·실패 영수증과 독립 대수 검사를 읽고 비교했다.

## 강화 cutoff와 실제 물리 본문

`max(log c_n, log physicalCandidate_n, log a_(n−1)+log 2)`는 이전 정규화 선택을 보존하면서 새 물리 조건을 동시에 만족시킨다. 선택한 새 scale가 실제 `χ(a_n q)`와 그 미분 인자에 들어간다. `q≥1/(4a_j)`에서 `a_(j+2)q≥1`, `q≤1/(2a_j)`에서 `a_nq≤1/2 (n≤j)`이므로 `j+1`까지의 완전한 band 본문이라는 설명은 타당하다. 이것은 모든 q에 대한 유한 prefix의 충분성 주장이 아니다.

Cartesian radial 항의 `−η(a_nq)χ'(a_nq)(M_n/X)/L`을 확인했다. 이것은 stream에 cutoff를 곱한 뒤 curl을 적용할 때 생기는 항이다. 원래 `χ'`를 생략하거나 그 미분까지 0으로 놓지 않는다. 압력과 두 stress 성분도 같은 cutoff로 함께 구성한다.

원문 (5.24)는 augmented momentum의 stress 항을 `(∂r+2/r)Tθ eθ+(∂r+1/r)Tz ez`로 정의한다. 새 physical momentum 모듈은 정확히 이 정의를 사용한다. 이를 별도로 주어지지 않은 대칭 stress tensor의 모든 성분을 재구성한 결과라고 해석하지 않는다. stress의 `1/r` 표현은 X>0에서만 사용한다.

물리 미분 연산자의 q 지수와 부호도 원문 (5.26)에 대조했다. `q∂q`, transverse Euler, `η` 미분의 모든 계수 미분을 실제 Laplacian과 transport에서 유지한다. 차수별 손실 `1/2,D,1`은 계수 index n과 독립이며, n에서 생기는 다항 상수는 norm에 남는다.

## 실제 primitive와 오차 경계

stress FTC는 원래 primitive의 분모를 먼저 제거하고 실제 AD로 미분한다. density의 shared body는 미분 후 열며, 적분 방향의 음수를 보존한다. 네 개 primitive의 반대 부호 대조도 확인했다. 첫 실패를 통과로 바꿔 세지 않았다.

수정된 0 reducer는 모든 branch가 정확히 0인 함수와 그 적분만 없앤다. compact support 자체를 zero integral의 근거로 사용하지 않는다. 이 규칙은 실제 첫 실패를 해결하는 데 충분하며, 일반적인 전역 moment 항등식을 대신하지 않는다.

finite N=2 전개에서 ordered products는 두 index가 모두 `0..N`인 모든 쌍이다. shifted viscosity와 Ω_(n−1)/X 때문에 radial의 최고 차수는 2N+1이 맞다. 각 높은 차수의 다섯 Cartesian 기여와 미분 단어에 대한 8개 FTC face가 보존된다. 가장 약한 공통 손실 `2A+1+m`은 angular/axial의 `A+1+m`과 radial의 `2A+1/2+m`보다 충분히 크다.

낮은 차수 defects는 실제 root로 남아 있다. 따라서 제공한 `C_(N,m)`은 높은 차수 꼬리를 감싸며, 낮은 차수 cancellation이 해소되기 전에는 유한 잔차 전체의 경계가 아니다. `fullFiniteResidualBoundEstablished=false`와 전역 flatness false는 정확한 범위 판정이다.

## 판정

실제 강화 band 조립, signed primitive 내부 FTC, 높은 유한 잔차의 물리 미분 상수라는 제한된 결과에 대해 구현과 서면 유도가 일치한다. 모든 차수의 전역 pressure/stream 접합과 low-order cancellation, 무한합의 flat tail, 모든 pulse label 및 새 해석학 Lean 의무를 이 묶음으로 닫지 않는다. 원본 64개 기준과 개별 검사 수를 합산하지 않는다.
