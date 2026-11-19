# 원본 N3 첫 보정의 cutoff와 물리각 적분

## VERIFIED

N3 원본 실행 44582875351에서 같은 24개 공간 입력을 결속했다.
`U`는 초기장을 뺀 첫 보정 속도, `A`는 실제 Forced·Signed와
두 평균 포텐셜을 포함한다. 원본 전체 cutoff는
$C=\chi(2r^2)\chi(2z^2/z_0^2)\chi(\tau/\tau_0)$이다.
첫 단계는 고정 원본 스케일 $a_1$을 써서 $\kappa_1=\chi(a_1q)$를 곱한다.
원본 $q$는 물리각과 독립이다. 실제 $A$와 $U$는 같은 물리 각주파수를
사용하고, 평균 포텐셜과 직접 swirl은 물리각과 독립이다.
정규화된 원본 좌표의 $Q$ 배율과 각방향 원통 기저 연결을 각각 유지한다.

속도와 공변 기울기 $3+9$성분, 힘 연산자에 필요한 공간 2차와 물리 시간
1차 미분의 9개 성분을 유리수 계수 다항식으로 대조했다.
일반 양의 반경에서는 $D_{\theta}\nabla T=(0,T_r/r,0)$이고,
원본 환대의 방사 plateau에서는 $T_r=0$이다.
기준 Mathlib의 확률 Haar 측도에서 원 위 유한 Hermitian 내적,
같은 정수 주파수 합산 및 지지가 겹치지 않는 경우의 소거를 GitHub Lean에서
컴파일했다. [Lean 결과](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44611824132).

## CONDITIONAL

원본의 고정 차트에서 열린 분기 미분, 허용 원본 경계 및 게이지 항등식이
성립한다고 가정한다. $T=C\kappa_1$, $g=\nabla T$, $Jv=e_z\times v$라
두면 국소화된 실제 첫 단계의 속도 계수와 압력 계수는
$V_n=T U_n+g\times A_n$ 및 $P_n=T p_n$이다. 여기서 대문자 계수는
원본 물리 배율을 반영한 값이다. 공변 공간 기울기는

$$
(D_k V)_n=T(D_k U)_n+(D_k T)U_n+(D_k g)\times A_n+g\times (D_k A)_n.
$$

각 열은 원래의 양의 반경과 좌표 변환에서 계산한다. 원통 기저에서
$D_\theta V_n=(in+J)V_n/r$이고, 전체 내적에는 양 부호를 사용한다.
Signed와 Forced를 포함해 같은 부호 정수 주파수의 모든 계수를 합한 뒤
제곱한다. 이 규칙은 같은 물리각의 평균–파동 제곱 교차항이 0인 경우와
양의 주파수의 켤레 두 항을 모두 포함한다. 균등 격자는 $N$이 서로 다른
두 지지 주파수의 차이를 나누는 경우 앨리어싱이 생길 수 있다.
원본 체적 밀도는 물리각과 독립이므로 남은 적분은 원래의 반경·축·시간
좌표에서 처리한다.

실제 최종장의 계수들이 확보되면 같은 라벨로 힘의 모드를 계산할 수 있다.
물리 시간 부호는 $-\partial_\tau$이고 압력 기울기를 포함한다.
비선형 이류항은 두 모드의 합 주파수에 들어가므로 실제 전체 속도를 먼저
조립한다. 외력 일은 $\operatorname{Re}\sum_n\overline{V_n}\cdot F_n$,
힘의 제곱은 $\sum_n|F_n|^2$이다. 정확 수 대조 예의 수치는 모드 합산과
부호 검증에 해당한다.

## OPEN

같은 원본에서 실제 압력과 속도 도함수의 구간, 제어된 방사·축·시간 적분,
후속 보정, 원본 경계에서의 균일 상계가 남는다. N7-06, N8-05,
최종 jets 및 전체 RELEASE HOLD는 기존 판정이다.

```text
python -B verify_localized_gram.py GOAL_NEXT NEW_LOCALIZED_RECEIPT.json
python -B check_modal_residual.py --goal GOAL_NEXT --localization ORIGINAL_LOCALIZATION_JSON --out NEW_RESIDUAL_RECEIPT.json
```

실제 원본 각주파수와 cutoff 검사는 [재현 명령](actual/README.md)을
따른다. 파일 해시는 상위 증거 ZIP에서 검사한다.
