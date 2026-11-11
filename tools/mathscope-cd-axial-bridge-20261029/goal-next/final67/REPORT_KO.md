# 원본 67 jet 입력과 실제 계산 경계

## 확인한 원본 입력과 연산

요청의 67개는 원본 게이지 A의 세 Cartesian 성분별 19개씩, 매끄러운 축대칭 직접 성분 b(s,z,τ)의 6개, 전체 압력 p의 4개다. s=x²+y²이고 물리 시간 미분은 −∂τ다. 원래 요청은 모든 활성 공간·양의 시간 셀 전체의 닫힌 구간을 요구한다. 위치가 한 점으로 고정된 원본 native 역함수의 도함수는 이 67개 입력과 별도로 기록했다.

원래 합성기의 연산은 u=curl(CA)+Cb(−y,x,0), f=−∂τu−Δu+(u·∇)u+∇(Cp)다. 원본 67+13 도함수 스텐실과 독립 Cartesian 기호 미분의 17개 검사가 통과했다. 정량 합성의 두 원래 다항식 대조군은 구조 검증에만 사용했다.

원본 유한 창 조립기 constructFinalSummationFromRoots는 같은 그래프의 완전한 활성 단계 창과 각 단계 A 세 성분, b(s,z,τ), p를 요구한다. 조립기의 finalDirectMean은 Cartesian 벡터를 반환한다. 67개 입력에 쓰는 b를 얻으려면 각 단계의 원래 방사 스칼라를 좌표 치환 전부터 보존해야 한다. 동일한 cutoff로 b₀+Σχ(aⱼq)bⱼ를 구성하고 s=x²+y² 치환 뒤 두 직접 성분이 같음을 확인해야 한다.

## 실제 cutoff 셀과 native 역함수

원래 N7 바깥 cutoff는 χ(v)=1−σ₁(2v−1)이며 σ₁의 seed는 exp(−1/u)다. 원본 terminal 적분 #275의 σ₂는 exp(−1/u²)를 사용한다. 원본 Git의 outer_cutoff.py로 13개 cutoff jet을 다시 계산했다. 8³의 512개와 16³의 4,096개 셀 표 및 모든 분수 jet 구간이 원래 표와 일치했다.

공간 격자를 8³으로 고정하고 시간 셀을 4에서 8로 세분화했다. 부모 26,624개 jet 구간 중 3,904개가 좁아졌고 정확한 영 구간 20,704개는 유지됐다. 시간 셀의 두 자식 구간의 볼록껍질과 부모 구간의 교집합을 사용했다.

실제 cutoff의 정규화된 제곱 측도 ∫C² dx dy d(z/z₀) d(τ/τ₀)를 유리수로 감쌌다. 극좌표에서 dxdy=π ds와 u=2s를 적용하고, 축방향의 짝대칭을 사용했다. 각 1차원 인자의 256개 단조 구간 합과 정확한 Machin 급수로 다시 계산한 구간 [0.2623500192, 0.2681274692]는 시간 분할 결과에 들어간다. 물리 측도의 복원 인자는 z₀τ₀이며 두 스케일을 양의 원본 식으로 유지했다.

양의 원본 N=1 창에서 ℓ=L+2, s=1, η=0, X=(Xₐ+Xᵦ)/2인 활성 점을 사용했다. #622820의 (Z,T)=(0,1)에서 4차까지 15개 formal 역함수 도함수를 평가했다. s=T+T^(2h) Z²+2h T^(4h−1) Z⁴+O(Z⁶)에서 ∂ZZs=2, ∂ZZTs=4h, ∂ZZTTs=4h(2h−1), ∂ZZZZs=48h를 직접 얻었다. 정확한 양의 h를 보존한 채 256-bit 유리수 구간 결과와 대조했다. 원래 범위를 벗어나는 자유 (Z,T)=(0,0) 및 상단 시간 대조군은 거부됐다.

같은 점의 실제 frozen 라벨은 g_T=ℓ⁶, g_Z=0, g_R=floor(ℓ⁶R+1/2)이다. 원본 #617465의 log 2 최대값 항과 #622785의 floor 치환에서 ℓ≥3이다. 원본 #623858~#623870의 메쉬 폭 3/(4ℓ⁶)과 이미 검증한 활성 상자 중점 증명을 결속했다. 따라서 실제 #623935에 들어오는 |Z_rep|, |T_rep−1|은 각각 1/972 이하이고 s_rep의 유리수 구간은 [0.9989711934, 1.0010298651]에 포함된다. 출력의 고차 도함수는 이 상자의 formal (Z,T) 역함수에 대한 구간이다. frozen 라벨을 고정한 실시간 좌표 미분에 이 도함수를 대입하지 않는다.

## 최종 원본장을 결정하는 누락 입력

보관된 첫 FiveMap의 실제 11개 루트는 물리 속도·압력·발산·잔차 및 그 대조를 제공한다. 게이지 A에 ∇x를 더해도 cutoff 이전 속도·압력·잔차는 같다. 실제 바깥 cutoff를 적용한 속도의 차이는 ∇C×(1,0,0)이다. x=y=0, z/z₀=√(3/8), τ/τ₀=3/4에서 z₀C_z=−8√(3/8)이다. z/z₀=5/8의 유리수 점에서도 160-bit 원본 cutoff 계산으로 차이가 0이 아닌 것을 확인했다. 이 반례는 정확한 게이지 생산기가 필요함을 보인다.

첫 FiveMap의 159,655개 도달 노드에는 범용 유리수 평가기가 처리하지 않는 연산의 노드 12,664개가 남는다. 적분, 지지 가드, 유한 Fourier 연산과 강제 펄스 등은 각각의 원본 정의역 및 오차 증거가 필요하다. 두 실제 native 역함수 구간은 그중 원본 system 2에 대한 제한된 실행이다.

다음 실제 반복에는 f_68465a2d86d9ee074ccccd4b의 원본 지지 잔차와 f_a242f88bead89cbf747ec4d4의 반복 Forced가 필요하다. 첫 스케일에도 원래 ActualCutoffCurlBound의 m=0,1 두 입력이 남는다. 폐합된 실제 활성 상태, 원본 스케일 및 동일한 최종 A,b,p 생산기가 있어야 최종장 닫힌 셀 구간에 들어갈 수 있다. 전체 K 에너지·소산·외력 일·외력 노름과 N8의 grid/Fourier/차수/정밀도 비교는 OPEN이며, 최종 jet 0/67 및 RELEASE HOLD다.

## 재현

원본 Git 저장소의 고정 eab39df 커밋, 원본 export 그래프와 manifest, 기존 Y 영수증과 reached.json, principal-flat-subtraction.json을 입력으로 사용한다. 아래에서 EVIDENCE는 이 폴더다.

    python EVIDENCE/materialize.py --repo REPO --output EVIDENCE
    python EVIDENCE/source/research-ide/mathscope-m3/recovery-20261019/run_outer_cutoff.py --grid 8 --precision 80 --output EVIDENCE/outer-replay
    python EVIDENCE/cutoff_time_refinement.py --outer-replay EVIDENCE/outer-replay --out cutoff.json
    python EVIDENCE/source_native_inputs.py --graph-dir GRAPH --y-receipt Y_RECEIPT --out native.json
    python EVIDENCE/audit_final_route.py --reached REACHED --manifest MANIFEST --subtraction SUBTRACTION --out route.json

스텐실 단위 검사는 EVIDENCE/source/research-ide/mathscope-m3/closure-evidence-20261023에서 실행한다.

    python -m unittest -v test_compile_original_67jet_force_stencil test_conditional_67jet_force_intervals test_verify_original_N7_localization_67jet_independent
