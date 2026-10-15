# 원문·공식 Lean과 현재 source 의무 사이의 이전 경계

로컬에 내려받은 공식 Lean5개 파일을 읽고 OFFICIAL_LEAN_SOURCE_INDEX와 크기·SHA-256·Git blob SHA-1을 각각 대조했다. commit은 f9e8bc5b38b6e212696e8a30e3e91517af887bbd다. 실제 첨부 navier-stokes.pdf의 SHA-256 0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f도 현재 fixed.source의 sourcePaperSHA256과 같고, originalLeanCommit 필드도 이 commit과 일치한다. 이는 같은 원전과 commit을 사용하는 출처 연결이다. 현재 g21과 공식 함수의 동치 증명이나 공식 Lean 재빌드를 수행한 것은 아니다.

공식 소스는 현재 남은 핵심 입력을 정확히 드러낸다.

- ActualWaveRegularity.NativeData는 열린 실제 native 영역, raw smooth geometry, cutoff support, patch cover 또는 실제 zero germ을 요구한다. common_corrected_smooth는 이 입력에서 완전한 curl의 매끄러움을 도출한다. literal_native_regular도 같은 실제 함수의 NativeJets와 영역 포함, edge 성장 상계 및 실제 바깥0 값을 요구한다. 작은 strip의 숫자나 유한 jet 배열만으로 이 조건을 대체하지 않는다.
- CorrectionInitialization.zeroMean_gr_smooth는 실제 모든 covariance 성분의 공동 C∞와 moving-gauge support, 실제 mean0, local operators와 양의 containing annulus를 요구한다. zeroMean_pressure_regular는 이들로부터 같은 재구성 pressure의 정칙성과 지지를 얻는다. average_derivative_on은 열린 slow carrier, 전체 fiber에서의 실제 smoothness와 periodicity를 요구한다. 현재10개 적분 미분 Guard에 가장 가까운 경로이지만, serialized complete_gr가 바로 이 객체라는 연결이 추가로 필요하다.
- ActualPrimaryCovariance.nativePoint_time과 nativePoint_inner는 **엄격히 양의 물리 slow time**을 명시적으로 가정한다. native chart의 양수 시간과 normalized inner coordinate를 보존하지만 임의의 음수 T로 확장하는 정리가 아니다. mean_tangentCovariance_jets는 실제 native strip와 선택된 prepared.N 이후 band에서 모든 고정 derivative order에 대한 등식을 준다.
- CorrectionInitialization.PrimaryMeanData와 initializedBands_mean_defects는 정칙성 외에 weighted operator/base/covariance/stress classes, 공통 scale/index gap, 실제 rank geometry와 정규화·비영성·지지·평균 조건을 요구한다. 현재230 Jet/1020 PDE 및 보편 N6-01/N6-02 bound에 필요한 정량 입력을 정칙성 하나로 대신할 수 없다.
- ActualInitialization.initial_invariant는 공식의 같은 선택에서 representation, wave/pressure/covariance/residual/mean/debt/primitives, masses, smoothness, periodicity, support를 묶는다. initial_fullResidual은 완전한 PDE를 grouped harmonics, mean residual, 모든 excluded error로 분해한다. mean·Gaussian·flat·비선형 제곱 항을 제거하는 허가가 아니다.
- ResidualRegularity.contDiffOn_residual는 열린 spacetime 영역에서 **같은** u,p가 공동 C∞일 때 ordinary derivative로 만든 residual이 C∞라고 결론낸다. contDiffOn_residual_interior는 상대적 preSingular 가정에서 열린 시간(0,1)로 제한한다. time boundary의 지정하지 않은 확장을 미분하지 않는다.

공식 ActualPrimary.choice는 Classical.choice로 얻는 prepared geometry, covariance 상수와 label을 포함한다. 현재의 명시적 CSelected, fixed 대표점, finite source registry가 그 선택과 정의상 동일하다고 확인한 것은 아니다. 같은 논문 hash와 commit 필드만으로 이 간극이 없어지지 않는다.

실제 이전에는 현재 profile·상수와 공식 객체의 동일성 또는 refinement, 각 serialized native opcode·binder·root·무한합의 의미, label/대표점/chart/gauge/period와 압력 식의 일치, 필요한 미분·적분 교환 가정, 그리고 원본의 각 Guard/Jet/PDE ID와 양화 영역을 연결해야 한다. 이5개 파일의 source text 검토는 전체 import closure의 #print axioms 또는 선택 commit의 build 로그를 대신하지 않는다. 이번 검토로 새로 소거한 원본 의무는0개다. 정확한 declaration명·파일·행·가정·현재 gate 연결은 paper_lean_transport_boundary.json에 기록했다.
