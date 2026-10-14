# 독립 수학·코드 검토 범위

이번 검토는 새로운 Lean 커널 인증이 아니다. 유한 정확 연산과 고전적 해석학
증명을 실제 원본 정의에 연결하고, 적용 전제가 남은 정리는 조건부로 유지한다.

## Rayleigh 및 열 함수

원본 shared chart의 s와 eta는 R을 포함하지 않으며 RX_R=2X다.
정확 chain rule은 gR=-aF0,gZ=bF0이고, 원본 sqrt 입력은 P/(gR²+gZ²)다.
독립 검토자는 인수분해 P=2a²F0⁴(v_s-2), c0²=(v_s-2)/2 및 유한
양의 margin의 지수·분모를 재검토했다. C12 보조정리에는 모든 phase에서
동일한 실제 입력 상계와 perturbation 상계가 필요하다. 그 상계가 OPEN인
상태를 완료로 바꾸지 않았다.

열 primitive의 compactification과 Jacobian, Gamma recurrence,
각 고정 차수의 dominated convergence 및 eta endpoint Taylor 반경 0
증명도 독립 검토했다. 전체 열 ingredient의 holomorphic 확장 불가능성과,
열이 없는 내부 Picard coefficient strip의 미해결 존재성을 구분한다.

## Picard 및 모든 고정 차수

원문166쪽 PDF의 Lemma5.1, p48 수식과 sparse A1 구조를 대조했다.
A1 D A1 및 A1 D partial_eta A1의 소멸은 diagonal Green kernel의
block 보존을 포함하며, A1²=0만으로 다른 단어의 소멸을 주장하지 않는다.
모든 k에 대한 derivative word 수 ceil(k/2), factorial/Cauchy tail 및
even-X 미분 공식에는 일반 귀납 증명을 제공했다. 유한 monomial/word
검사는 구현 오류를 찾는 control이다. 실제 coefficient norm과 strip은
그 귀납 증명으로 공급되지 않으므로 OPEN이다.

sigma의 전역 sharp derivative 상계8은 endpoint flatness와 정확 다항식의
단조성으로 얻는다. t=1/2의 sigma'=8은 더 작은 상계를 거부하는 control이다.
Prop9.5의 유리수 exponent 비교는 원래 uniform seminorm이 있을 때의
함의이며, seminorm이 있다는 증명이 아니다.

## Cartesian leaf와 실제 cover maps

23개 selector 미분은 frozen band와 요청된 실제 공간좌표의 primitive
dependency closure를 분리해서 닫는다. 좌표에 의존하는 ceiling이나
불투명 function capture에는 이 규칙을 적용하지 않는다.

slow root622820의 first jet5개는 실제 implicit body와 공통 collar의
Fs>1/2 및 유일성을 이용한다. 다른 실제 global 호출이 모두 그 collar에
속함을 주장하지 않는다. 원래94개 guard를 그대로 보존한다.

fixed-label/fixed-nearest-copy cell 내부의 Jacobian 검사는 global cover
접합 증명이 아니다. 실제 body, formals, maps, labels와 source operands를
보존하며, analytic body 미분은 별도 미계산 값으로 남긴다.
독립 검토에서 second-word helper가 variable map coefficient의 Leibniz
항을 생략할 위험을 발견했다. 최종 API는 사용 전에 coefficient의 해당
미분이 정확히0임을 검증하고, 변하는 coefficient 또는 누락된 constancy
증거를 거부한다. 이를 위한 별도 부정 검사를 추가했다.

원래 coupled roots3825003–3825005는 residual field 정의다. velocity
update가 아니라는 실제 이름·registry·stage를 확인했으므로, direct velocity
operands에 없다는 사실을 stage mismatch나 수학 반례로 보고하지 않는다.
