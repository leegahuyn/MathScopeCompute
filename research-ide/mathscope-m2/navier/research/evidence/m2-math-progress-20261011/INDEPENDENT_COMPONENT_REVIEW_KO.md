# M2 재개: heat·n=1 응력·작은 q 공분산의 독립 검토

## 판정과 검토 방법

세 모듈의 실제 식, 구현, 실행 로그와 검증 범위를 독립적으로 읽었다. 아래에 명시한 범위에서 구체적인 수학 오류를 발견하지 못했다. 이 문서는 해석학적 추론의 서면 검토다. source의 정확한 항등 검사, BigInt 수치 포함구간, 일반 대수 테스트, Lean kernel 증명을 서로 같은 종류의 증거로 취급하지 않는다.

검토 대상은 `actual-heat-scaled-enclosure.mjs`, `actual-order-one-weighted-stress.mjs`, `actual-admissible-terminal-covariance.mjs`와 각각의 한국어 설명 및 실제 source 실행이다. 파일별 SHA와 실제 process 결과는 함께 저장한 `review-validation.json`에서 대조한다. 새 대형 source를 이 검토 때문에 다시 생성하지 않았다.

## 1. 실제 heat의 정규화 수치 구간

원래 전체 Gamma 밀도와 `(1+zv)^(-h)`를 보존하는지 확인했다. 유한 Taylor 잔여항의 부호는 항수 N에 따라 `(-1)^N`이고, 절댓값은 다음 양의 Gamma moment 항으로 감싸진다. 이 부등식은 `zv>=0` 전체에 성립하므로 무한 적분의 tail을 별도로 잘라 없애지 않는다. 일반적인 무한 moment 급수의 수렴을 가정하지 않는다.

계수 `D0=(1-H)/(hz)`, `D1=-H'/h`, `D2=H''/[h(1+h)]`의 초기 항과 recurrence를 수식과 대조했다. D0의 분모는 다음 단계에서 `n+2`, D1/D2는 `n+1`이다. D2의 상승계승은 `h+2`와 `h+3`에서 시작한다. 따라서 D0를 D1의 recurrence로 잘못 계산하거나 D2의 `1+h`를 버리는 오류가 없다.

실제 chart의 근방에서 `z=4T/R²`라는 등식은 원래 양의 root `s-Z²s^(2h)=T`로부터 나온다. 그 등식의 R/Z/T 1차·대칭 2차 미분을 다시 계산했다. RR에는 `-6 D1+4(1+h)z D2`, RT에는 `2 D1-2(1+h)z D2`가 필요하며 구현은 두 항을 모두 보존한다. Z를 포함하는 네 도함수는 정확히 0이다. 이 결론은 전체 leading F의 Z 미분이 0이라는 뜻이 아니다.

원래 `0<h<2^-4096`, `0<z<2^-2559`, `R>2^1280`, `R²>2^2561`, `T=1`로부터 양의 인자 상한의 지수 6655, 7935, 9216, 9214를 재계산했다. 각각의 실제 인자는 graph root로 남아 있다. 절대 포함구간에 0 또는 1이 들어 있어도 실제 h를 0, H를 1로 대체하지 않는다. 192-bit 계수 구간의 최대 폭 `35*2^-192`는 원래 h 자체의 상대 오차 보증과 구별한다.

**범위:** 실제 지정점의 heat와 아홉 slow jet 포함구간이다. 전체 pulse, 공분산 행렬, 가중치, curl의 합산 수치 오차는 아직 이 모듈에 없다.

## 2. 실제 n=1 응력의 terminal 경계

원래 angular residual의 `-∂zz` 부호와 양의 backward stress 표현을 대조했다. backward 표현은 원래 다섯 모멘트와 전체 I2 보정의 소거를 소비한다. compact support만으로 적분값을 0이라고 가정하지 않는다.

`δ=log(Xb/X)`에서 `1-fo=E a`, `E=exp(-4/δ²)`인 smooth factor의 식과 미분을 확인했다. `a(0)=ρe`, `a'(0)=ρe`, `a''(0)=5ρe/2`이다. 마지막 값과 Taylor 2차 계수 `5ρe/4`를 구별한다. 잔차의 `az² fo_yy+bz fo_y`에서 `bz`와 `a'`, `a''` 항이 유지된다. 물리 heat는 z 방향으로 독립이라는 원래 exterior identity가 있으므로 이 특정 product rule에서 heat의 물리 z 미분항이 추가로 남지 않는다.

`(E δ^-3)'=E δ^-6(8-3δ²)`와 `0<δ<=1/4`를 사용하면 계수의 하한은 정확히 `125/16`이다. 그러므로 backward 적분에서 얻는 상수는 `16/125`이고 inverse-power 손실은 6에서 3으로 줄어든다. 이후 Laurent recurrence, Leibniz 항과 ordinary X 미분으로 바꿀 때 필요한 모든 낮은 로그 미분항을 확인했다.

원래 ζ로 나누는 직사각형은 `[Xminus, Xb exp(-1/4)]`이며 Xa와 Xb를 포함하지 않는다. terminal에서는 E/ζ의 유한 상계를 사용한다. 실제 양의 분모를 확인하지 않은 채 flat endpoint에서 0으로 나누는 식을 만들지 않는다. 실행한 요청 `r+k<=2`의 terminal FTC 6개와 interior FTC 12개, 원래 c1의 `q∂q`까지 포함한 mixed 10개 행을 구별했다.

**범위:** 원래 (5.22)의 n=1 terminal 추정과 (5.43)의 n=1 항이다. 미분은 `q∂q, ∂X, ∂η`이다. 강화 selector를 전체 원본 배경에 이미 적용했다거나 모든 차수의 물리 잔차가 닫혔다고 해석하지 않는다.

## 3. 실제 작은 q 공분산의 열린 외측 영역

기존 표시용 ell=1 graph는 원래 leading/background norm/target의 생산자로만 사용한다. `ell*=ellMinimum+8`로 정한 새 정수의 Q, S, epsilon, 반올림 carrier, palette 길이, moving-normal pressure, moving basis와 두 Volterra 시스템을 다시 생성하는지 확인했다.

모든 양의 차수 보정은 공통 Xplus 뒤에서 정확히 0이다. 이 결론은 원래 moment가 닫힌 after-branch 구조에 대한 차수 귀납이며, 작은 q에서 많은 cutoff가 켜질 수 있다는 사실을 무시하지 않는다. 따라서 이 열린 외측 영역에서만 completed field를 leading field로 정확히 줄일 수 있다. 같은 축약을 내부 X<=Xplus에 사용하지 않는다.

원래 palette 식으로 `1/(Tg*S)<ci<=1/S`, 따라서 `2r0<=Ls/S<2r0*Tg`를 재계산했다. 전체 s band의 `q<=2Q=qStar/8`도 유지된다. 이 비교는 실제 양의 h로 정의된 정수식에 대한 것이며, 그 값을 부동소수점으로 만들 필요가 없다.

정규화 행렬 C와 실제 H의 행 순서, 두 열의 양의 mass 및 Haar 인자를 확인했다. `det([-N/Ac; K/u])=-1/(Ac*u)`이므로 C의 양의 determinant로부터 실제 `det H<0`가 나온다. 두 inverse weight는 실제 양의 target scale과 mass로 정규화한다. 추가 독립 검토 `INDEPENDENT_TERMINAL_COVARIANCE_REVIEW_KO.md`는 chart target의 양의 s 인자를 명시하여 원래 profile target과 구별한다.

**범위:** 선언한 외측 열린 영역에서의 실제 고정 label, 비영 determinant, 두 양의 weight와 열린 영역의 smooth square root다. 원문의 미지 최종 Γ, 내부 활성 보정, 모든 label의 접합 및 flat 경계의 zero extension은 이 결과에서 해결되지 않는다.

## 4. M2와 M3 상태

실제 source 실행은 heat 12/12, n=1 응력 6/6, 작은 q 공분산 13/13이다. 각 module 내부 검사 수와 일반 kernel 검사 수를 서로 더해 새로운 원문 정리 수로 만들지 않는다. 원문 64개 기준의 역사적 기록도 그대로 보존한다.

이 세 결과는 G-NUM, G-N4, G-POS의 구체적인 부분을 진전시킨다. 전체 G-CURL/G-N5와 함께 남는 의무를 모두 해소하지 않았으므로 `userRequestedM2Complete=false`, `m3MayStart=false`다. 이후 runtime에 새 기능을 연결한 경우에는 그 Worker·브라우저 실행을 별도 기록해야 하며, 이 직접 Node source 실행을 과거 v75/v76의 브라우저 증거라고 바꾸지 않는다.
