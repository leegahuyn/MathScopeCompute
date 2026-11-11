# MathScope R1-07 실행 안내

검증한 실행 환경은 `e5113446c4d4ede3decd6107e6ab3dd52dce1697`의 릴리스 실험실과 보존된 v103 기준 페이지입니다. 이 안내의 입력은 `walkthrough-steps.json`에도 있습니다.

`candidate.html`에서 **M3·M4 원문·증거**를 열고 **실행·재현 작업대**로 갑니다. 매 단계에서 **기준 예제**를 고르고 **실제 입력**을 엽니다. 아래에서 지정한 JSON 항목을 편집하고 **입력 적용**을 누릅니다. 다른 항목은 기본값을 사용합니다. **새 Worker 실행**을 누르고 완료를 확인합니다. **실행 JSON 저장**으로 내보낸 파일에서 `bundle.request`, `bundle.result`, `bundle.inputHash`, `bundle.mathematicalHash`를 함께 읽습니다. 그림의 표본을 선택하면 해당 결과의 소스와 입력·결과 해시를 화면에서 확인할 수 있습니다.

## 학생 계수체 실험

1. **P¹ / F₃**에서 `input.p="3"`, `input.m=1`, `precision.N=4`로 실행합니다. `bundle.result.results.pointCount`는 `"4"`입니다. `results.cohomology`의 차수 0과 2 표본에서 `coefficientRing="Z_3"` 및 Frobenius 값 `"1","3"`을 확인합니다.
2. 같은 예제에서 `precision.N=8`만 바꿉니다. `precisionLedger.requested.N`은 8이고 점계수와 두 고유값은 같습니다. `N`은 유한 p-adic 정밀도입니다.
3. `precision.N=8`을 유지하고 `input.p="5"`로 바꿉니다. 점계수는 `"6"`, 환은 `Z_5`, 두 고유값은 `"1","5"`입니다. `scope.comparison`에서 이 계산이 외부 결정질 비교 정리를 이용한 유한 모델이라는 조건을 읽습니다.

## 연구 Frobenius 및 local factor 감사

1. **E: y²=x³−x / F₅**에서 `input.p="5"`, `input.m=1`, `precision.N=4`를 사용합니다. `bundle.result.results.primeField.affinePoints`에 아핀 점 7개가 있습니다. 25개의 `(x,y)∈F₅²`를 대입하고 무한원점을 더하면 8입니다.
2. 같은 `results`에서 `reduction.status="GOOD"`, `reduction.certificate.residue="4"`, `aP="-2"`를 확인합니다. Frobenius 특성다항식은 `characteristicPolynomial.coefficients=["5","2","1"]`이고 `localZeta.ellipticL.denominator=["1","2","5"]`는 오름차순 `1+2T+5T²`입니다. 국소 인자의 가정은 이 곡선이 5에서 좋은 감소를 갖는다는 조건입니다.
3. **Perfect prism → de Rham 비교**를 기본 입력으로 실행합니다. 첫 표본의 `sampleTrace.comparisonMap.coefficientMap`은 `A_inf --phi--> A_inf --theta--> O_K`입니다. `bundle.result.scope`에서 완료된 대상에 대한 외부 비교 정리와 유한 mod p 관측의 범위를 확인합니다.

## Δ 상태족 비교

1. **Δ 상태족 / 같은 생성 규칙**에서 `input.family.delta=1`, `input.observation.samplesPerAxis=3`, `input.probe=[0.2,-0.3,0.4,0.1]`로 실행합니다. 첫 표본을 선택하면 `sampleTrace.selected.rho=1`입니다. 결과에서 `fieldSpec.perturbation.length=1.2`와 27개 관측 표본을 확인합니다.
2. `input.family.delta=2`, `input.observation.samplesPerAxis=3`, `input.probe=[0.1,-0.15,0.2,0.05]`로 실행합니다. 두 번째 표본에서 `rho=0.5`, `fieldSpec.perturbation.length=0.6`을 확인합니다. 두 실행의 action density는 각각 약 16.6691032635와 266.7056522162입니다.
3. `samplesPerAxis=5`만 바꾸고 두 번째 표본을 다시 선택합니다. `bundle.result.hashes.physicalField`가 직전 값과 같고 `visualization.points`는 125개입니다. `proofBoundary.continuumQuantumYM`에서 연속 양자 이론의 미해결 상태를 확인합니다.

## NS 근사 및 잔차 비교

1. **Heat 외곽 r>0**에서 `input.radialCount=3`과 6을 각각 실행합니다. `bundle.result.points`가 48개와 96개이며 `domain.excludeAxis=true`입니다. 표본 추가는 외곽 공식의 유한 관측입니다.
2. **국소 축 해 / 정확 tail**에서 `input.tailDegree=8`과 16을 각각 실행합니다. `bundle.result.tails.rows[1]`의 `Y="41/160"`을 고정하고 `phiTailUpper`의 두 유리수를 비교합니다. 8차는 약 `9.1239×10⁻¹⁶`, 16차는 약 `2.0451×10⁻³¹`입니다. `inputModel.pressure`에서 `P(η)=-10/(1+η²)²`로 정의된 국소 자료와 `completedOutgoingPressure=false`를 확인합니다.
3. **Taylor–Green 기준 PDE**를 기본 입력 `time=0.19`, `viscosity=1`로 실행합니다. `meanEnergy≈0.1169166067524773`, `meanDissipation≈0.4676664270099092`, `energyDerivative≈-0.4676664270099092`입니다.
4. 검증 창을 닫습니다. 왼쪽 메뉴 **Actual Mathematical Objects**를 열고 **Navier–Stokes** 탭에서 **FD·FFT·고정밀·음성 대조군**을 선택합니다. `ns.validate` 기본 입력을 확인하고 **계산 실행**을 누릅니다. 결과의 `checks`에서 `nonlinear_axis_recurrence_order_refinement`를 찾습니다. 각도 방향 선도 잔차의 크기는 약 `4.1879×10⁻⁴`에서 `7.3229×10⁻¹¹`로 변합니다. `certifiedNonlinearTail=false`는 이 선도 유한 급수의 꼬리가 미인증임을 표시합니다. `actual_core_Cartesian_divergence_FD.fullNSResidual≈0.99533`은 같은 절차에서 측정한 전체 방정식의 잔차입니다. `taylor_green_fd_nu_1`의 두 정규화 잔차는 `10⁻⁹`보다 작고 `negative_pressure_sign_nu_1.observedResidual≈0.17036`입니다. `fullCertifiedProfile=false`에서 원본 전체 프로필 의무를 확인합니다.

정수와 유리수는 정확한 문자열입니다. 소수로 요약한 관측은 지정한 유한 실험의 수치입니다. 수치 비교에는 절대 허용차 `10⁻⁹`를 사용합니다. 입력, 실행 Worker, 수학적 결과는 각각의 해시로 확인합니다.
