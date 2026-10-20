# N6 Stage 4 — 원본 Guard의 직접 소거

## 판정

기준 커밋은 `9b0da62700d48b73154e837300d221eb0c5ea06c`이다. 새로운 검증은 원래 38개 미해결 Guard 중 22개를 원본 ID 그대로 소거한다. 남은 수는 **Guard 16 / Cartesian Jet 230 / PDE 항 1,020 / 총 1,266**이다. 전체 소거를 완료했다는 주장은 하지 않는다. N6-01 OPEN, N6-02 PARTIAL, M3 56/64를 유지한다.

이 문서의 근거는 아래 해석적 증명과 원본 결합·독립 기호 검산이다. 실행 성공, JSON의 상태 문자열 또는 SHA-256이 수학 증명 자체는 아니다. Lean 커널 인증은 수행하지 않았다.

## 1. 정확한 원본 범위와 의존성

원본 parent는 3,892,594개 노드이며 SHA-256은 `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f`이다. 원본 Cartesian scalarProgram의 SHA-256은 `aa2da2a3ee1a12ffd9fc24d471271fc62f6b8723d75813a91eabb68713adc0a8`이다. scalar ID와 원본 source ID는 다른 번호 체계다.

검증기는 이전 Stage 3 검증기와 bump 검증기의 코드 바이트를 고정하고 실제로 다시 실행한다. 원본 전체 stream, 28개 indexed 정의/4,050행의 입력 매핑, 188개 native 부모 바인딩, 원본 bump/profile 결합을 재검사한다. 저장된 성공 flag만 읽어서 완료로 바꾸지 않는다.

소거하는 명제의 범위는 **원래 선언된 reference atlas와 원본 활성 indexed 적용에서의, 원래 명시적 Cartesian primitive Guard**이다. 임의의 모든 실수 Z,T에서 원본 root가 존재한다는 더 강한 명제로 바꾸지 않는다. 과거 guard worker의 “모든 실수에서 보이면 충분하다”는 증명 방법은 원래 acceptance 영역 자체가 아니다.

원래 atlas는

    D_h={(Z,T)=(s^(1/2-h) eta, s(1-eta^2)): 1/2<=s<=2, |eta|<=1}

이다. Stage 3에서 실제 활성 band guard |L-ell|<3/4와 동일 배율 c의 결합으로

    2^(-3/4)<c*s<2^(3/4),  eta'=eta

를 확인했으므로 모든 해당 활성 행의 slow 입력은 D_h에 다시 속한다. 기본 reference root의 존재를 가정하지 않은 채 그것으로 자신의 guard를 정당화하는 순환은 없다. 기준 atlas의 명시적 매개화가 먼저 root의 존재를 준 뒤, 그 root로 후보 band 입력을 검사한다.

상위 연산자 전체의 존재성·Haar 적분·계수 노름·축에서의 연장·전체 접합은 원래 별도 의무로 유지한다. 이 primitive Guard의 증명으로 그 의무까지 소거하지 않는다.

## 2. Root와 양의 배율

원본 source node 622820은 실제로 `actual_monotone_root(2,Z,T)`이며 native 정의는

    F(s;Z,T)=s-Z^2*s^(2h)-T=0.

원본의 두 매개변수는 Z,T뿐이다. 본체, 양 끝점과 미분 경계에 숨은 방사형 또는 fast 좌표가 없는지 다시 검사한다. 원래 고정된 열린 collar에서는 1/4<s<3 및 F_s>1/2이므로 암시함수 정리로 모든 고정 차수에서 C-infinity다.

특히 source root는 R, theta, Y0, Y1, 두 방사형 적분 변수에 의존하지 않는다. 다음 원본 scalar의 치환은 root와 그 전체 정의역을 그대로 유지한다.

    1412 = substitute(114,119,1411) = 114
    1427 = substitute(1412,232,2) = 114
    1510 = substitute(114,232,2) = 114.

이것은 opaque 함수의 값이 같을 것이라는 추측이 아니다. 원래 native 본체와 입력·끝점·경계의 좌표 지지집합을 검사한 결과다. 반대로 Z를 바꾸는 치환은 이 항등식으로 처리하지 않으며 음성 테스트로 거부한다.

    a(s)=sqrt(2*X0Imean)*exp(1/2)*sqrt(s)>0

이므로 scalar 116, 1414, 1429, 1512가 모두 동일한 양의 배율이다. scalar 1360=2*sqrt(s)>0 역시 즉시 따른다.

따라서 C-013,014,039,044,045,048,049,056,057을 소거한다. 이 중 4개는 root의 양성, 4개는 배율의 비영성, 1개는 sqrt 미분 분모의 비영성이다.

## 3. Bump, 고정 지지집합 및 정규화

원본 bump는

    beta(t)=exp(-1/[t(1-t)]) (0<t<1), 0 (나머지)

이다. u=t(1-t)에 대해

    beta^(n)=exp(-1/u)*P_n/u^(2n),
    P_0=1,
    P_(n+1)=u^2 P_n' - 2n*u*u'*P_n + u'*P_n

가 모든 n에 대한 귀납으로 성립한다. deg P_n<=3n이고 B_0=1, B_(n+1)=(24n+3)B_n이면 ||P_n||_1<=B_n이다. y=1/u에 대한 지수함수 우세로 모든 도함수가 양 끝점에서 0으로 수렴한다. 따라서 beta의 영 연장은 실수 전체에서 C-infinity이며 ||beta^(n)||<=B_n(2n)!이다. 유한 12차 기호 테스트를 전 차수 증명으로 외삽하는 것이 아니다.

원본 clock의 정확한 식에서 X_a<4, X_0>110, X_b>exp(13)X_0가 도출된다. 그 근거인 A,B의 정의를 생략하지 않는다.

    A=e^(-(1-h)/2)*[nonnegative terms + (-4 log h)(1-h)] >8002,
    B=co*h/[2(1-co*h)] * integral_1^3 sigma'((q-1)/2)e^((1-h)q)dq,
    0<B<27/8192<1.

여기서 sigma는 원래 flat logistic step이며 beta와 다른 함수다. 실제 h=exp(-8002 T_param), T_param=exp(1048576)+10, co=1/256, 0<h<lambda<1/2를 사용한다. sigma는 내부에서 증가하고 integral_1^3 sigma'((q-1)/2)dq=2이다. A/B>1을 원래 X_b 표현에 대입하면 log(X_b/X_0)>13을 얻는다.

따라서 같은 collar 1/4<s<3의 모든 점에서

    sqrt(X_a)<a(s)<11a(s)/10<2sqrt(X_b)

가 성립한다. 매 차수마다 새 영역이나 다른 매개변수 profile을 택하지 않는다.

원본 scalar 230의 적분에 r=a(s)(1+t/10)을 대입하면

    I(s)=integral_L^U a(s)^(-1) beta(10(r/a(s)-1))dr
        =(1/10)integral_0^1 beta(t)dt = C_beta,
    1/14580<C_beta<1/160,  1/C_beta<14580.

지지집합과 모든 매개변수 도함수가 하나의 고정 유한 구간에 들어가며, 고정 collar의 더 작은 닫힌 근방에서 연속인 모든 고정 차수 도함수는 균일하게 유계다. 그러므로 매 차수의 매개변수 미분과 적분 교환이 가능하다. I의 모든 양의 차수 slow/fast/radial 미분은 0이다. 함수 f가 상수라고 선언한 뒤 적분 교환을 추론한 것이 아니라, smooth integrand와 공통 지지집합을 먼저 확보했다.

이 논증은 매개변수 적분의 공통 근방과 적분 가능한 도함수 상계를 요구하는 표준 정리와 일치한다. 예를 들어 Mathlib의 `Analysis.Calculus.ParametricIntegral`에 해당 조건이 명시되어 있다. 이 문서를 인용하는 것과 실제 Lean 증명 실행은 다르다.

이에 따라 정규화 C-025, Leibniz C-038,068,076,084,092 및 flat join C-040,041을 소거한다.

## 4. 새 적분 변수를 사용한 동일 정규화

미분기의 capture 방지용 alpha-renaming에서 원본 scalar 1508이라는 적분이 추가되었다. 검증기는 integral binder를 de Bruijn 수준으로 바꾸어 비교하고, 적분 끝점에서는 binder가 바인딩되지 않음을 보존한다. 다음 정확한 등식이 모두 재현된다.

    1487=202, 1497=218, 1507=229, 1508=230.

실제 body, 배율, 적분 변수와 두 끝점 모두 포함한 비교이다. 따라서 C-054의 분모도 같은 양의 C_beta이며 소거한다. 끝점·binder·body를 변조하면 검증이 실패한다. 0에 미정의 함수를 곱했다는 이유로 항을 삭제하지 않는다.

## 5. 분기 안의 세 분모

C-046,050,058의 피연산자는 각각 scalar 1421,1436,1519이며 정확히 t(1-t) 형태다. 전체 원본 scalarProgram에서 각 역원의 모든 부모 경로를 거슬러 올라간다. 해당 inverse의 모든 실제 사용 경로는 matching `choose(t,0,1,0,interior,0)`의 내부 분기에서만 평가된다.

    1422 -> 1423 -> 1424 -> 1425
    1437 -> 1438 -> 1439 -> 1440
    1520 -> 1521 -> 1522 -> 1523.

따라서 실제 역원을 평가하는 동안 0<t<1이고 t(1-t)>0이다. 끝점과 구간 밖에서는 내부 식을 평가하기 전에 0분기를 선택한다. 이는 분모에 전체 영역에서 양의 하한이 있다는 주장이 아니다. 새로운 guard 없는 경로가 하나라도 추가되면 검증은 실패한다.

마지막으로 scalar 253은 원래 step sigma를 10(R/a-1)에 합성한 것이다. a>0이고 그 합성 인자가 매끄러우므로 원래 step의 전역 C-infinity 성질로 C-060의 1차 미분 조건을 소거한다.

## 6. 정확한 원본 ID와 장부 보존

새로 소거한 원본 번호는 다음 22개다.

    013,014,025,038,039,040,041,044,045,046,048,049,
    050,054,056,057,058,060,068,076,084,092.

새 `GUARD_DISCHARGES.json`은 원래 ID, 원래 명제와 그 해시, source ID, 적용 정리, 의존성을 모두 보존한다. 소거된 22개와 남은 16개의 합집합은 정확히 이전 38개이고 중복이 없다. 과거 matrix의 내용을 덮어쓰지 않고 새 원본 ID별 matrix를 만든다.

남은 Guard는 기존의 다음 16개다. 새로운 목표를 추가한 것이 아니다.

- 기존 C-005,008,009,010,011: 실제 band/좌표 범위와 축에서의 전체 연장/평가 경로 조건.
- 기존 C-059: shifted complete_gr의 비자명한 치환과 전체 정의역 보존.
- 기존 C-027,061,062,069,070,077,078,085,086,093: scalar 248의 전체 integrand. 여기에는 정규화 bump 외에 실제 complete_gr와 P 함수가 들어 있으므로, 그 정칙성·공통 지배 상계까지 증명해야 한다.

## 7. Jet와 PDE에 실제로 수행한 작업

남은 230개 Jet는 원래 ordered coordinate sequence와 실제 source call을 보존했다. 실제 19개 원본 함수족의 registry/argument tuple을 다시 열고, 대표 첫 미분에 대해 독립적인 유한 source-chain-rule 전개를 시도했다. 계산 가능한 산술 접두부는 전개하고, 실제 natural-series/적분/원본 저장 도함수/indexed/Fourier 연산에서 필요한 증명이 없으면 정확한 source node와 이유를 남겼다. 이후 도함수의 좌표 순서를 교환하지 않았고 미계산 도함수를 0으로 두지 않았다. 새로 소거한 원본 Jet는 0개다.

PDE 3성분의 원래 169/197/654개 항에서 계수, 모든 source factor ID와 실제 operation을 검사하고, 정확 유리수 monomial 수집을 재실행했다. 이 재수집 단계에서는 추가 상쇄가 없었다. 이것은 source 함수가 실제로 비영이라는 반례가 아니며 전체 independent Cartesian PDE 재계산이 성공했다는 뜻도 아니다. 다른 native 함수 사이의 항등식을 추가로 증명해야 하는 형식적 미해결 식이 남았다는 뜻이다.

1,020개 항을 각자 0으로 만들어야 한다고도 주장하지 않는다. 최종 목표는 전체 direct-minus-assembled 식이 모든 원본 정의역 조건을 충족하면서 0임을 보이는 것이다. 이번 primitive Guard 증명만으로 그 전체 항등식은 얻지 못했다.

## 8. 재현

Python 3.12+와 Node.js가 필요하다. 독립 CAS 회귀검사에는 SymPy 1.14.0을 사용한다. 이전 Stage 3와 bump 모듈은 각각 코드 SHA-256으로 고정되어 있다.

    python direct_discharge.py --source SOURCE_EXPORT --prepared PREPARED \
      --prior FINAL_SUMMARY --stage3-module PREVIOUS_STAGE3_PY \
      --bump-module PREVIOUS_BUMP_PY --out evidence

    N6_SOURCE=SOURCE_EXPORT N6_PREPARED=PREPARED N6_PRIOR=FINAL_SUMMARY \
    N6_STAGE3=PREVIOUS_STAGE3_PY N6_BUMP=PREVIOUS_BUMP_PY \
    N6_EVIDENCE=evidence python -m unittest -v test_direct_discharge

현재 로컬 실행은 40/40 테스트 통과다. 클라우드의 최종 실행 결과는 실제 종료 후 별도 관측 파일에 기록한다. 다른 저장소 전체 CI까지 자동으로 통과했다고 주장하지 않는다.

참고: https://leanprover-community.github.io/mathlib4_docs/Mathlib/Analysis/Calculus/ParametricIntegral.html
