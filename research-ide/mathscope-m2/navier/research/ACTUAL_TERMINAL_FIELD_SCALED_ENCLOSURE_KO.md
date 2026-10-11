# 원래 전체 slow F의 terminal 수치 구간과 2차 미분

2026-10-11. 이 문서는 `actual-terminal-field-scaled-enclosure.mjs`와
`evidence/terminal-field-20261011/`의 **수정 후 두 번째 실행**을 설명한다.
원래 source의 양수 h, B, R을 정확한 식으로 남기고, 이를 인수로 분리한
전체 F와 9개 slow 도함수의 계수에 방향 반올림 유리수 구간을 제공한다.
이는 한 terminal witness와 그 근방에서 유도한 결과이다. 전체 영역의 수치
계산, 공분산 행렬과 가중치의 정밀한 수치 구간, 전역 NS 잔차의 flatness,
새 Lean kernel 증명 또는 M3 완료를 뜻하지 않는다.

## 1. 원래 slow 배율을 먼저 포함한다

원래 `actual-covariance-source-operator.mjs`의 leading F와 completed F는
모두 profile 값 앞에 s의 거듭제곱을 갖는다. b=-A-1/2=-1-h라 놓으면
terminal collar에서

\[
 F_{\rm slow}=s^b E X^b f(y)H(z)
       =B_r(R) f(y)H(z),\qquad
 B_r=E(R^2/2)^b,
\]

\[
 X=R^2/(2s),\quad y=\log(X/X_{\rm tail}),\quad
 z=2(1-\eta^2)/X=4T/R^2.
\]

E는 원래 exterior amplitude이다. 원래 implicit chart
`s-Z² s^(2h)=T`와 s,X>0를 사용한다. 따라서 B_r은 Z,T와 독립이다.
source adapter는 원래 leading/completed 함수의 실제 body 두 개를 각각
`originalSlowScale * originalProfileBody`와 비교한다. caller의 표기나
복사된 PASS를 받아들여 이 배율을 가정하지 않는다.

실행 witness는 원래 ell=1 terminal source에서

\[
 X=X_b e^{-1/4},\quad X_{\rm tail}=X_b e^{-3},\quad
 \eta=0,\quad s=T=1,\quad Z=0,\quad R=\sqrt{2X}.
\]

원래 finite-band 결정으로 이 근방에서는 모든 양의 차수 background cutoff가
꺼져 completed F와 leading F가 같다. 이 ell=1 수치 witness를 admissible
공분산 band 전체의 결과로 확대하지 않는다.

## 2. heat와 원래 step의 모든 미분 항

원래 step의 반사 항등식 `sigma(1-x)=1-sigma(x)`를 사용하면

\[
 f(y)=1-\frac h{256}\sigma((3-y)/2),\quad
 f_y=\frac h{512}\sigma'((3-y)/2),\quad
 f_{yy}=-\frac h{1024}\sigma''((3-y)/2).
\]

witness에서 step 인수는 1/8이다. 다음 기호를 쓴다.

\[
 a=\sigma(1/8)/256,\quad \beta=\sigma'(1/8)/512>0,\quad
 c=-\sigma''(1/8)/1024<0,
\]

\[
 f=1-ha,\quad f_y=h\beta,\quad f_{yy}=hc,
 \quad H'=-hD_1,\quad H''=h(1+h)D_2.
\]

H는 원래 complete Gamma 적분이다. D0,D1,D2는 기존 private heat enclosure의
정규화된 적분으로, H=1-hzD0이다. finite Taylor 부호 잔여항과 improper
integral 전체를 포함한다. 무한 moment 급수의 수렴을 주장하지 않는다.

\[
 U=(bf+f_y)H-fzH',
\]

\[
 V=(b^2f+2bf_y+f_{yy})H+[(1-2b)f-2f_y]zH'+fz^2H''.
\]

그러면 실제 slow 미분은

| 미분 | 정확한 식 |
|---|---|
| F_R | 2B_r U/R |
| F_RR | B_r(4V-2U)/R² |
| F_T | B_r(bfH-U)/T |
| F_RT | 2B_r(bU-V)/(RT) |
| F_TT | B_r[V+(1-2b)U+b(b-1)fH]/T² |
| F_ZZ, witness | -2B_r f_y H |
| F_Z, F_RZ, F_ZT, witness | 0 |

마지막 두 행은 s_Z=0, s_ZZ=2와 원래 chart의 Z 짝대칭을 사용한다.
heat만의 ZZ는 0이지만 **전체 F의 ZZ는 음수이며 0이 아니다.**
13개 exact rational identity와 누락 항 3개에 대한 음성 대조가 이 연쇄법칙을
별도로 검증한다. 원래 s^b를 빼고 T 미분하는 오류도 음성 대조에 포함한다.

## 3. 작은 양수를 0으로 만들지 않는 수치 계산

소거가 발생하는 시간 미분과 ZZ에서는 h를 수치 계산 전에 정확히 분리한다.
예를 들어

\[
 \frac{TF_T}{B_rh}=-\beta H-fzD_1,
\]

\[
 \frac{RTF_{RT}}{B_rh}
 =2\{[(1+h)\beta-c]H+[(2+h)f-2h\beta]zD_1
       -f(1+h)z^2D_2\},
\]

\[
 \frac{T^2F_{TT}}{B_rh}
 =(\beta+c)H+2h\beta zD_1+f(1+h)z^2D_2,
 \qquad \frac{F_{ZZ}}{B_rh}=-2\beta H.
\]

192-bit BigInt dyadic 방향 반올림으로 각 계수의 모든 연산 오차를 포함한다.
`exp(-3072/49)`는 인수를 9번 나누어 6/49로 줄이고, 양의 Taylor 합과
`(8/7) (1/8)^(n+1)/(n+1)!` 꼬리 상계를 합친 뒤 바깥쪽 제곱 및 역수로
복원한다. 이 실행의 Taylor 차수는 32이다. step의 1차·2차 미분도 같은
구간 연산으로 감싼다.

소스에서 이미 증명된 `0<B_r<1`, `0<h<2^-4096`, `0<z<2^-2559`,
`R>2^1280`, `R²>2^2561`을 사용한다. 구간의 닫힌 끝점 0은 상하계일 뿐이며
실제 양수 parameter나 amplitude를 0으로 치환하지 않는다.

아래 소수는 **표시용**이며 인증 데이터는 JSON의 exact rational endpoints이다.
F와 R,RR의 1,-2,6 역시 근사 표시이다.

| 행 | 분리한 정확한 인수 | 계수 근사 | 계수 구간 폭 이하 | 부호 |
|---|---|---:|---:|---|
| F | B_r | 1 | 4.780e-58 | 양수 |
| R | B_r/R | -2 | 1.912e-57 | 음수 |
| T | B_r h/T | -1.1876521210e-27 | 1.594e-57 | 음수 |
| RR | B_r/R² | 6 | 9.559e-57 | 양수 |
| RT | B_r h/(RT) | 1.1936677654e-24 | 9.677e-55 | 양수 |
| ZZ | B_r h | -2.3753042419e-27 | 2.390e-57 | 음수 |
| TT | B_r h/T² | -5.9445857844e-25 | 4.834e-55 | 음수 |
| Z, RZ, ZT | 0 | 0 | 0 | 정확한 0 |

모든 계수 폭은 요청값 1e-40보다 작다. B_r 자체를 높은 상대 정밀도로
평가한 결과는 아니다. raw absolute intervals는 안전하지만 매우 보수적이다.
별도 Python Decimal 200자리 계산은 원래 두 exponential bump의 몫을
직접 미분해 step 결과를 비교하며, 180자리 참조값을 저장한다. 이 독립 비교는
방향 반올림 인증의 대체물이 아니다.

## 4. 실행과 독립 검토

수정 후 generic kernel은 7/7 PASS, source 실행은 8/8 PASS이고 실제 프로세스
exit code는 모두 0이다. source 내부 결속 검사 10개도 통과했다.
source 실행은 18.295835990초, 최대 RSS 1,424,347,136 bytes였다.
54개 source import의 실행 전후 SHA256이 같았다.

수정 후 그래프는 233,782 nodes / 9,310,892 canonical bytes이고 SHA256은
`e6a91c2e34d2f914b5c014542c826ebdeceff3ccb7db4365e41f1ef72c823501`이다.
이 해시는 실행한 식의 동일성을 확인하며 해시 자체가 해석학 증명은 아니다.

**첫 실행의 폐기 사유를 보존한다.** attempt 1도 software tests는 8/8이었지만,
독립 수학 검토에서 원래 s^b 누락을 발견했다. 따라서 첫 실행은
`SOFTWARE_CHECKS_PASSED_REJECTED_BY_INDEPENDENT_MATHEMATICAL_REVIEW`이며
도함수 완료 근거로 쓰지 않는다. 그 소스 원본·로그·프로세스 기록·certificate와
거절 검토 문서는 그대로 보존한다. 수정 실행과 과거 실행의 해시를 섞지 않는다.

최종 독립 검토와 파일 봉인은 같은 evidence 디렉터리의 validation packet에서
찾을 수 있다. 기존 공개 v77은 heat enclosure만 포함하므로 이 수정은 공개
heat 계산의 정정을 요구하지 않는다. 이 새 전체 F 모듈은 아직 Worker/UI에
설치하지 않았다.

## 5. 남은 범위

이번 결과는 한 terminal witness의 전체 F와 그 2차 slow jets까지이다.
전체 box, inner edge, 원래 admissible label 전체의 공분산과 양의 가중치,
전체 물리 curl을 거친 수치 도함수 및 전역 NS 잔차·flat-error, 새 분석학적
Lean kernel 인스턴스는 이 packet에서 완료하지 않는다. M3 진입 판정도 false다.

원문 근거: [Navier–Stokes PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf),
source PDF SHA256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
실제 구현 근거는 위 source adapter, unchanged slow source operator,
private heat enclosure와 해당 evidence에 보존되어 있다.
