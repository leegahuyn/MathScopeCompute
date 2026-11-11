# M3의 실제 전체 K 접합 구간

원본 8³ 공간 격자의 192개 내부 또는 경계 교차 셀에서 실제 물리 좌표 차트의 구간을 유리수로 계산했다. 공간만 두 배로 늘린 1,440개 셀과 시간만 두 배로 늘린 384개 셀의 차트 구간이 각각 부모 셀 구간에 포함됨을 확인했다. 원본 바깥 cutoff의 접합 구간 전체에서 배경 급수는 차수 0~3, (9.21)의 보정 급수는 단계 1~4까지만 평가 대상이 될 수 있다.

## 좌표와 정확 계산

원본의 `tau=1-t`, `tau0=qBig/32`, `z0=tau0^D`, `D=1/2-h`를 유지한다. 원본 공간 및 시간 범위에서 `x²+y²≤1/2`, `zeta=z/z0`, `sigma=zeta²≤1/2`, `rho=tau/tau0∈[1/2,1]`이다. `Q=q/tau0`와 `alpha=2h`를 쓰면

```text
rho = Q - sigma * Q^alpha
eta² = 1 - rho/Q = sigma * Q^(alpha-1)
X = (x²+y²)/(2*tau0*Q)
```

`Q^(1-alpha)-sigma-rho*Q^(-alpha)`는 양의 Q에서 엄격히 증가한다. `Q-sigma*Q^alpha-rho`는 Q=1/2에서 0 이하이고 Q=2에서 양수다. 따라서 유일한 양의 해는 `1/2≤Q<2`에 있고 `q<qBig/16`이다. 원본 `h<2^-4096`와 `|log Q|≤log 2<1`에서 `|alpha log Q|<delta=2^-20`이다. `exp(u)≥1+u`와 양의 u에서의 기하급수 상계를 적용하면

```text
1-delta ≤ Q^alpha ≤ 1/(1-delta)
rho_lo + sigma_lo*(1-delta) ≤ Q ≤ rho_hi + sigma_hi/(1-delta)
```

이 식을 `[1/2,2]`와 교차시켜 각 닫힌 셀의 Q 범위를 계산했다. `eta²=v/(rho+v)`, `v=sigma*Q^alpha`를 사용해 `eta²≤1/(2-delta)<9/16`도 확인했다. 따라서 이 물리 차트의 `|eta|<3/4`이다. 별도의 native 호출에서 인자를 바꾼 뒤에도 이 범위가 적용되려면 그 치환을 증명해야 한다.

각 해에서 `1-2h*eta²>0`이므로 차트는 국소적으로 매끄럽고 고정 z에서 `partial_t q=-1/(1-2h*eta²)`이다. 공간 측도는 `z0 dx dy dzeta`, 시간은 `dt=-tau0 d rho`이다. 물리 시간이 증가하는 적분을 rho로 쓸 때 경계 순서를 뒤집는다.

## 실제 활성 차수와 단계

원본 공통 배경 cutoff의 첫 선택은 `b1≥1/qBig`, 두 번째는 `b2≥16 b1`, 이후는 `b_n≥2 b_(n-1)`이다. 전 구간에서 `q≥tau≥qBig/64`이므로 `b_n q≥1`은 모든 n≥4에서 성립한다. Q≥1인 셀에서는 n≥3도 제외된다. 원본 `chi(s)`는 s≥1에서 0이고 s=1에서 모든 차수의 도함수가 0이다. 따라서 n=4의 등호 경계도 포함해, 이 배경 cutoff의 물리 미분은 모두 0이다.

회수된 원본 함수 항 기록에서 (9.21) 보정 cutoff는 `L0=log(1/qBig)`, `L_j≥L_(j-1)+1`, `a_j=exp(L_j)`이다. 귀납적으로 `a_j q≥exp(j)/64`이며 `exp(5)>64`는 지수급수의 양의 유한 부분합으로 인증된다. j≥5에는 1보다 큰 엄격한 여유가 있어 차트의 연속성으로 각 점의 근방에서 cutoff가 항등적으로 0이다. 이에 따라 위치 및 시간의 모든 도함수가 사라진다. `curl(chi(a_j*q) A_j)`의 cutoff 미분항도 포함한다. 이 결론은 해당 척도 정의의 순서 관계에 의존하며, 필요한 1~4단계의 실제 척도 값을 결정하지 않는다.

| 계산 | 내부 및 교차 셀 | 원본 cutoff 밖 셀 | Q 구간 최대 폭 | j=4가 확실히 0인 내부 및 교차 셀 |
| --- | ---: | ---: | ---: | ---: |
| 8³, 시간 셀 1 | 192 | 320 | 약 0.750000 | 64 |
| 16³, 시간 셀 1 | 1,440 | 2,656 | 약 0.640625 | 720 |
| 8³, 시간 셀 2 | 384 | 640 | 약 0.500000 | 256 |

공간 refinement는 시간 셀을 고정했고 시간 refinement는 공간 격자를 고정했다. 표의 폭은 JSON의 정확한 유리수 값을 반올림한 차트 폭이다. 공간 및 시간 refinement로 실제 에너지 defect가 줄어드는지 판단하려면 각 셀에서 최종장의 값이 필요하다.

## 기존 고정 J 창의 범위

`prepareSourceScalarFinalWindow`가 택하는 단일 q 창의 끝점 비율은 `exp(1/2)`이다. 원본의 같은 시간 `rho=1/2`, `r=0`에서 `zeta=0`이면 Q=1/2이고, `zeta=2/3`이면 Q>7/8이다. 두 점 모두 공간 cutoff 안쪽에 있다. 두 번째 점에서 Q≤7/8이라면 `Q^alpha>Q`이므로 `Q-(4/9)*Q^alpha < (5/9)*(7/8) = 35/72 < 1/2`로 모순이다. 실제 q 비율은 7/4보다 크고 `exp(1/2)<sqrt(3)<7/4`이다. 따라서 단일 고정 J 창을 전체 K에 그대로 적용할 수 없다. 위 활성 차수 및 단계 상계는 각 창의 위치나 폭에 의존하지 않는다.

## N7-06 적분과 다음 실제 입력

`u*=tau0^A u`, `f*=tau0^(A+1) f`, `A=1/2+h`로 두고 `x,y,zeta,rho`를 사용하면 에너지와 적분 방정식에서 공통 양의 계수 `z0*tau0^(-2A)`가 소거된다. `E*`는 `|u*|²`의 공간 적분이고 `Dxy*, Dzeta*`는 각 좌표 방향의 제곱 미분의 공간·시간 적분이다. 물리 시간 방향으로 적분을 정리한 정규화 balance는

```text
(E*_end-E*_start)/2 + nu*tau0*Dxy* + nu*tau0^(2h)*Dzeta* - W*
```

이다. 여기서 `W*`는 `f*·u*`의 공간·시간 적분이고 `tau0/z0²=tau0^(2h)`다. ν=1에서 (10.13)의 힘 L² 시간 적분 제곱도 같은 양의 공통 계수로 나뉜다. 시작점 rho=1은 원본 평탄 cutoff에서 E*=0이다. 위 좌표 계산은 `Dxy*, Dzeta*, W*` 및 힘의 실제 수치 적분을 제공하지 않는다.

실행 커밋 `f8cb4034e86d7b669d52a6f2248aebba156b51b5`의 실제 runner는 첫 Forced→Signed→Temporal→FiveMap 및 3D 잔차 AST를 만든다. 다음 원본 함수 항은 완성된 첫 상태로부터 두 번째 cycle의 `GroupedSupportedNonzeroResidual` `f_68465a2d86d9ee074ccccd4b`를 만들고, 이를 `OriginalForcedMap` `f_a242f88bead89cbf747ec4d4`에 전달한다. 이때 `0<|m|≤4`의 실제 supported residual 전체와 고정 label을 사용해야 한다. 기존 Forced 생성기는 최초 initialized private seal과 첫 cycle의 20개 양의 시스템 및 162개 기여를 검증하므로 그 API에 첫 FiveMap의 AST 또는 영수증을 입력해 두 번째 cycle을 실행할 수 없다. 첫 cutoff 척도조차 원본 `ActualCutoffCurlBound`의 m=0,1 두 값이 비어 있다. 동일 원본의 단계별 갱신, 척도, A·b·p 및 닫힌 셀 jet 평가를 계속 구현해야 한다.

N7-06의 전체 K 에너지·소산·일·힘 노름과 독립 공간 및 시간 defect 비교, N8-05의 같은 최종장에 대한 grid·Fourier cutoff·계수 차수·정밀도 비교와 독립 tail은 OPEN이다. 실제 최종장 `last_resolved_tau`도 미정이다.

`python source_whole_k_chart.py --repo <MathScopeCompute checkout> --out whole-k-chart.json`으로 두 고정 커밋의 소스와 회수된 세 Git blob의 일치, 셀 목록, 순서 및 경계 부등식을 재현한다. `WholeKCutoff.lean`은 실수 cutoff 인자와 창 폭에 관한 네 보조정리의 GitHub 컴파일 대상이다.
