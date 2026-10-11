# 원래 전역 압력 곱합 독립 검토

검토자: root. 검토 대상은 구현 담당자가 동결한 `validation.json`
SHA256 `067949013e917129b266c9c4d7cea2284cc998c70ecb0a233486cb3d160af154`이다.
이 문서는 그 packet 이후의 별도 검토 기록이며 원래 packet이나 실패 기록을 수정하지 않는다.

## 판단

실제 생성한 n1/n2의 전역 압력 곱합 및 원래 압력 원시함수 연결에서 수학적 오류를 발견하지 못했다.
코드, generic algebra, source 검사, 한국어 증명 문서와 실행 기록을 대조했다.
이 판단은 아래의 소스 결속형 분석 증명 범위에 한정한다. 모든 차수를 수치로 실행하거나
전체 Navier–Stokes 물리 잔차와 flat-error를 증명했다는 판단은 아니다.

## 실제 확인한 연결

1. **같은 원래 leading source.** M0 감사와 양의 차수 induction 감사는 동일한 originalLeading 객체,
   복사된 node prefix, 보존된 함수 본문 및 M0/U0/v0 root를 대조한다. 서로 다른 감사 graph에
   나중에 추가한 node ID를 교환하지 않는다. 앞선 M0의 FTC와 continuity를 사용하는 전제가 명시돼 있다.
2. **전역 leading 함수의 실제 제한.** natural과 B26 collar의 F0/U0/v0는 원래 inner 함수와 비교한다.
   Ipos에서는 원래 reservedPower stage, 양의 반경의 log 법칙, `1/sqrt(2X)`와 원래 lambda를 모두 보존한다.
   endpoint 순서는 고정 원본 표현식과 stage 길이·offset으로 증명한다. 적분의 누적 질량은 제거하지 않는다.
3. **활성 collar의 평균.** 양의 U의 실제 kappa cutoff와 `integral_0^1 U_local(tX)dt`가 확인된다.
   원래 M_X=U와 zero axis datum으로 global average와 같아지므로, Xcut 뒤에서도 남는 질량/X를
   그대로 가진다. raw Picard 함수를 전체 collar로 확장하지 않는다.
4. **두 피연산자의 정당한 치환.** 원래 F0Fn split을 실제 global F0*Fn으로, 원래 Omega의
   core/middle/exterior 대표식을 동일한 global differential polynomial로 연결한다.
   이 두 증명된 피연산자만 `pressureDerivative`에 치환한 뒤 모든 ordered pair와 비교한다.
   앞선 `remainingDifference` 자체를 0으로 바꾸는 치환은 없다.
5. **원래 n1 Omega prefix.** 네 literal 적분 J_eta, H_eta, H, K는 endpoint density로 식별하고,
   각 적분의 고정 하한·bound-variable 독립성·FTC를 확인한다. 원래 모든 경계항을 포함한 도함수 차이는

   \[
   \partial_XP_\Omega-\tfrac12\mathcal O_0
   =\frac{v_0}{2L}
   \{L(v_0+Xv_{0,X})+dU_{0,\eta}-2A\eta U_0-2\eta XU_{0,X}\}
   \]

   이다. 여기서 `mathcal O_0=Omega_0/X`이므로 반경 인자를 추가로 나누거나 제거하지 않는다.
   대괄호가 0이라는 결론은 같은 private M0와 stream 재구성에 따른다.
6. **축과 전체 이력.** 실제 natural v0(0)가 원래 `actualGlobalAxisVX` 상수와 같은지 별도로
   검사한다. 이 상수의 이름을 v_X(0)라는 새로운 주장으로 해석하지 않는다. prefix의 axis 값은
   coincident endpoints 및 정칙성으로 처리한다. Xv에서는 네 prefix가 원래 weightedOmega의
   완전한 이력과 같고, 원래 zero exterior의 경계항이 사라진다.
7. **원래 Pi1과 모든 join.** local pressure 적분, 세 angular bump, R=Rbase*u의 Jacobian,
   원래 연속 Emat 행렬 및 세 번째 moment를 모두 보존한다. Xkeep은 동일한 도함수와 axis 값으로,
   Xcut·각 bump·Xv는 실제 full integral로, Xplus는 원래 세 번째 moment로 연결한다.
   compact density만으로 primitive의 남은 상수를 0으로 처리하지 않는다.

## 실행 증거 대조

최종 source attempt 4는 관측 exit 0, 9/9 PASS, 13.0840494569984초,
peak RSS 1,367,908,352 bytes였다. 최종 generic attempt 6은 5/5 PASS이다.
37개 literal dependency SHA를 검토 시점의 실제 파일과 대조해 모두 일치했다.
그중 기존 frozen dependency는 35개, 새 모듈은 2개다.

고정 source graph는 121,160 nodes / 4,818,267 canonical bytes이며 SHA256은
`f83156b902489fc544e9ad1f9badde1fe9da4453aad4b1b9b9b389fd70e93a64`이다.
실패했던 source attempt 1과 generic attempt 2–4, 그 당시 파일 snapshot과 로그가 보존돼 있다.
중간 source PASS의 당시 좁은 범위를 최종 원시함수 완료로 소급하지 않았다.

## 남는 경계

이 실제 실행은 n1/n2의 유한 generated prefix다. 같은 재귀의 일반 n에 대한 서술형 귀납,
원래 강화 cutoff를 적용한 무한 배경, 다섯 conservative stress moment, n0 leading stress,
모든 label의 전체 physical curl과 비선형 항, 전역 flat-error는 각각 추가 연결이 필요하다.
whole G-N4, whole G-NUM 및 M3 시작은 이 packet으로 판정하지 않는다.
새 해석학 Lean 실행을 검토하거나 주장하지 않았다.
