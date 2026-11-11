# 첫 실제 축소 스케일의 m=0,1 입력

원본 f_3b700fc1d0d2c77582a0399d의 두 입력은 f_5486aa5a7070b99cce5740bb와 f_9f3819cae1476e00bce4e5c9다. 각각 같은 첫 실제 보정 f_ac81b63855489a21bb407b2d의 원본 1차와 2차 weighted uncut bound를 사용한다. 보정은 실제 단계가 돌려준 A,B와 두 압력의 차이다.

## 원본 q와 cutoff에서 얻는 새 정량 상계

q−τ−z²q^(2h)=0, z=q^D η, D=1/2−h이고 η²≤1이다. 암시함수의 분모 L=1−2hη²는 1/2보다 크다. 정확한 기호 미분을 다시 계산해 다음을 확인했다.

- |q_τ|≤2, |q_z|≤4q^(1−D)
- |q_zz|≤12q^(1−2D), |q_zτ|≤3q^(−D)

원본 단계 cutoff χ의 전이 구간 [1/2,1]을 256개 닫힌 셀로 분할해 원래 linear-seed 구간 연산으로 |χ′|≤5, |χ″|≤42를 얻었다. a를 고정한 χ(aq)의 양의 차수 도함수는 전이 구간에서만 생긴다. 이 구간에서 aq≤1이므로 a≤1/q다. 따라서 |χ_z(aq)|≤20q^(−D), |χ_τ(aq)|≤10q⁻¹, |χ_zz(aq)|≤732q^(−2D), |χ_zτ(aq)|≤351q^(−D−1)이다. 표기는 χ(aq)를 전체 합성함수로 미분한 값이다.

원본의 cutoff curl을 χU+χ_z(e_z×A), 압력을 χp로 전개한다. U=curl A+B eθ다. q는 x,y에 의존하지 않으므로 m=0에서 최대 cutoff 손실은 D, m=1에서 D+1이다. 구성된 모든 성분과 도함수의 절댓값을 합한 곱 상계는 K₀=84, K₁=15460이다. 정확한 원본 uncut |Z|_(m+1)+|U|_(m+1) 상계 C q^(−ℓ_(m+1)+g₁)(1+|log q|)^P가 주어지면, 원래 cutoff 가중치 ℓ′_m=ℓ_(m+1)+m+1 뒤에 q^(1−D)가 남는다.

B=log(1/qBig), x=log(1/q)≥B로 둔다. 1−D>1/2와 지수 급수의 P번째 양의 항을 사용하면 원본 supremum의 p=0 값에 2 K_m C 4^P P! exp(−B/4)라는 유한 상계를 얻는다. 따라서 이 원본 uncut 상계를 사용할 수 있는 범위에서 최소 정수 P̂_(1,0)=P̂_(1,1)=0이다.

## 정확한 첫 guard와 남은 원본 입력

원본 Ĉ_m=1+ceil(Ŝ_m(0)), Cmax=max(Ĉ₀,Ĉ₁), γ=h/20을 유지한다. 그러면 L₁=max(B+1,40(Cmax+1)/h)이고 a₁=exp(L₁)다. 거대한 a₁를 평가하지 않고 E=h(L₁−B)=max(h,40(Cmax+1)−hB)를 비교하면 된다.

q/qBig의 닫힌 셀 구간이 [r_lo,r_hi]이면 E≤h log(1/(2r_hi))일 때 χ=1이고, E≥h log(1/r_lo)일 때 χ=0이다. 원래 전체 K 슬랩의 보수적 q/qBig 구간 [1/64,1/16]에는 각각 h log 8과 h log 64를 쓴다. 양쪽 조건에서 cutoff 평탄 경계를 포함한다.

두 m에서 실제 원본 C,P로 위의 상계가 1 이하임을 보이면 Cmax≤2다. 원본 ℓ_min≥(64/h)²와 qBig=2^(−ℓ_min−10)에서 hB>2048/h>120이다. 따라서 실제 L₁=B+1이고 전체 슬랩에서 a₁q≤e/16<1/2가 성립한다. 이 충분조건은 동일 원본의 전 영역 uncut bound를 요구한다. 첫 FiveMap의 물리장 내보내기와 principal flat 제거만으로 그 상계는 공급되지 않는다.

기존 shrinkingCutoffThresholdExpression은 입력 norm에 1+sqrt(1+norm²)을 적용한다. 원본 함수항의 1+ceil(Ŝ)와 값이 달라질 수 있으므로, 그 보조식의 cutoff 판정을 원본의 선택된 스케일 판정으로 기록할 수 없다. 이 실행은 원래 selector와 guard를 조건부 정확식으로 낸다. 실제 Ĉ, 실제 guard의 분기, 최종장 jet은 OPEN이다.

재현 명령은 다음과 같다. 고정된 원본을 materialize.py로 준비하고 이전 원본 whole-k-chart.json을 입력한다.

    python EVIDENCE/audit_scale1.py --whole-k-chart WHOLE_K_CHART --out first-scale-selector.json
