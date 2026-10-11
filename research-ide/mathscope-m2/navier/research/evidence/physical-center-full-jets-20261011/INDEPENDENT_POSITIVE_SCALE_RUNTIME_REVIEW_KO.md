# 새 양의 scale 재계산의 독립 검토

## 검토와 실행의 범위

검토자 `/root/sensitivity_kernel`은 ROOT가 작성한
`actual-physical-center-positive-scale-kernel.mjs`를 원래 동결된
`actual-physical-center-target-enclosure.mjs`의 `add` 산술과 대조했다.
새 helper를 수정하지 않고 별도 테스트만 작성했다.

경량 검사는 **7/7 PASS, 관측 Node exit 0, 9.573403081초**였다. 새 profile 및
regular target 적분을 192비트와 256비트에서 실제로 계산했다. 큰 물리
프로그램이나 covariance source constructor는 실행하지 않았다.

동일값 대조 fixture는 최초 실제 full-jet source attempt 1 도중 별도로 생성된
`target-certificate.json`이다. 그 단계의 원래 target 검사와 7개 숫자 행을
읽기 비교에 사용했다. 이후 전체 attempt 1이 program 배열의 봉인 검사에서
실패했다는 사실은 바꾸지 않는다. fixture를 private token으로 되살리거나
전체 실행 PASS로 취급하지 않았다. 새 actual source attempt 2의 최종 결과도
이 검사에서 미리 인정하지 않는다.

## 원래 부호·거듭제곱과 endpoint 변환

원래 target source가 제공하는 일곱 부등식은 문자열까지 정확히 일치해야 한다.

| 원래 scale | 원래 양의 범위 | endpoint 높이 | 폭을 보장하는 좌표 |
|---|---|---:|---|
| (A_c) | (R_{
m env}^{9}<A_c<R_{
m env}^{11}) | 4 | (log^4 A_c) |
| (	au) | (R_{
m env}^{-12}<	au<R_{
m env}^{-8}) | 4 | (log^3(-log	au)) |
| (g) | (R_{
m env}^{-12}<g<R_{
m env}^{-8}) | 4 | (log^3(-log g)) |
| (F) | (C^{-8}<F<C^{-5}) | 3 | (log^2(-log F)) |
| (X) | (C^{10}<X<C^{11}) | 3 | (log^3 X) |
| (r) | (C^{5}<r<C^{6}) | 3 | (log^3 r) |
| (gamma) | (sqrt{h/2}<gamma<sqrt h) | 2 | (log(-loggamma)) |

모든 큰 값 endpoint는 해당 seed에 반복 exp를 적용한다. 작은 양의 값은
마지막 exp의 지수를 음수로 바꾸므로 seed가 커질수록 값이 작아진다.
따라서 작은 값의 lower endpoint는 **seed upper**, upper endpoint는
**seed lower**에서 만들어야 한다. 새 helper는 이 역순을 유지한다.

(R_{
m env})와 (C)의 유한 거듭제곱에 따른 마지막 로그 좌표 변화는
원래 source의 양의 (2^{-4096}) reserve 안에 들어간다. 새 산술은 fresh
base 좌표의 upper에 이 reserve를 외향 반올림하여 더한다. lower를
임의로 높이지 않는다. (gamma)의 seed는 원래
(h=exp(-8002T))에서 (-logsqrt h=4001T)이므로
(1048576+log 4001)이다. gamma 준비 단계와 일반 add 단계의 두 reserve를
모두 유지했으며 원래 target 코드와 끝점이 정확히 일치했다.

이 읽기 검토에서 높이, 음수 지수, seed 순서, 양의 h 유지 또는 reserve의
빠진 항에 관한 구체적 오류를 찾지 못했다.

## 경량 검사가 확인한 사항

1. 별도로 보관된 원래 target fixture의 SHA256를 테스트에 고정했다.
2. 새 192비트 profile/target 계산에서 원래 15개 profile endpoint 및 7개
   add 행의 source ID, 부등식, endpoint 트리, 로그 좌표와 폭이 모두 일치했다.
3. 22개 endpoint를 독립적으로 풀어 exp 높이와 작은 값의 역순을 확인했다.
   로그 구간의 실제 유리수 upper−lower가 표시된 폭과 일치하고 tolerance
   이하임을 확인했다.
4. 일곱 원래 부등식 각각의 lower/upper 교환, 없는/음수/unsafe root ID를
   거부했다. 여기서 root ID는 그래프 값의 부호 자체가 아니라 정수 주소이다.
5. regular target 계수의 엄격한 ((7,8)) 범위를 유지했다. lower=7,
   upper=8, 음수 구간과 pass=false를 거부하고, 저장된 정밀도가 감당할 수
   없는 작은 로그 tolerance에는 PRECISION_REQUIRED를 반환했다.
6. 256비트와 다른 tolerance에서 새 로그 endpoint가 만들어지고 모든
   반경이 양수이며 실제 폭이 허용 오차 안에 있음을 확인했다.
7. helper가 입력을 바꾸지 않고 반환한 행을 바꿔도 원래 입력을 바꾸지
   않음을 확인했다. 반환은 sourceAuthenticated=false이며 source token을
   생성하지 않는다.

## 설치 증거와의 연결 및 한계

이 helper는 원래 target 범위를 **조건으로 소비하는 순수 수치 계산**이다.
유효한 정수 주소가 실제 원래 target root인지 확인하는 역할은 설치된
외부 증거의 hash와 pin 단계에 있다. helper가 일반적인 정수 주소 하나만
보고 원본 graph를 인증한다고 주장하지 않는다.

변경된 pin 생성기는 실행된 target certificate를 hash로 확인하고
원래 (	au) root가 full-jet certificate의 target root와 같음을 검사한다.
이 부등식과 root 목록을 설치 증거에 포함하며 새 helper도 산술 manifest에
추가한다. ROOT wrapper는 이번 요청에서 새로 계산한 profile과 regular
coefficient를 넘긴다. 따라서 기존의 큰 target 구간을 더 정밀해 보이게
잘라내는 방식이 아니다.

22행의 오차 보장은 **명시한 반복 로그 좌표의 폭**이다. 원래 큰/작은
scale 자체의 상대오차를 보장하지 않는다. selector/palette 및 모든
absolute H/y scale의 수치 완료, 모든 원본 label, 전역 잔차 수치 완료나
전체 G-NUM/M2 완료를 이 검사에서 인정하지 않는다.

## 고정 파일 SHA256

| 파일 | SHA256 |
|---|---|
| `research-ide/mathscope-m2/navier/actual-physical-center-positive-scale-kernel.mjs` | `88be189eb7f2a23f191cfda2ba134e1a5f0e37d7021effe0770b2e38757b1973` |
| `research-ide/mathscope-m2/navier/actual-physical-center-target-enclosure.mjs` | `b930a9d5e53c5e35ac32a9f8b84c6cd9ee5df47587ed02267cc34ac8d45d778c` |
| `research-ide/mathscope-m2/navier/actual-positive-profile-log-enclosure.mjs` | `ea92817e914260fbe21dfd1a14a90d32ceaa217c95a8edfa9bdb8ee67a1374ae` |
| `research-ide/mathscope-m2/navier/actual-terminal-target-coefficient-kernel.mjs` | `6306a2e9161864c0b24378412a450d0604570e0391506f3c6c160850da69668b` |
| `research-ide/mathscope-m2/navier/actual-physical-center-certified-numerics.mjs` | `13a7dfe0d67f52697b368ebf36cc8ffe8bcf83566058b82460eadc0e4be5c6be` |
| `research-ide/mathscope-m2/navier/tests/pin-physical-center-executed-evidence.mjs` | `c8fc5df1196cfd581f5922475eef84743a4b045579097d9995cc9ff7cbbbac77` |
| `research-ide/mathscope-m2/navier/tests/verify-physical-center-installed-evidence.mjs` | `5ffdc812000c47fbffd959e974d6223f8312254122037b8522c2f60b2fdf68ba` |
| `research-ide/mathscope-m2/navier/tests/actual-physical-center-positive-scale-kernel.test.mjs` | `d6ad9937fbf9e27d5f8149c83b5cf5f16316a40d9529676230e9f07d3ff89693` |
| `research-ide/mathscope-m2/navier/research/evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt1-target-certificate.json` | `a0ed95d6df4f42b09968865694da43616fb560baa45b0d15532d040d083cec70` |

이 검토는 앞선 wrapper 읽기 리뷰 뒤 추가된 22행에 대한 별도 addendum이다. 앞선 문서와 실패 기록을 덮어쓰지 않았다.
