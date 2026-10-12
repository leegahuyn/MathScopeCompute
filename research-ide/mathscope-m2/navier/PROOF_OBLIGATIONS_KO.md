# 같은 원본의 실제 구성과 남은 의무

## 현재 판정

원문 N4/N5 16개 기준은 **16 PASS / 0 PARTIAL / 0 OPEN**이다. 원래 ID·제목·합격 문구·페이지를 그대로 유지한다. N5-06은 공통 source threshold 아래 원래 annulus의 전체 covariance family까지 인증한다. 이 acceptance와 모든 차수의 전체 물리 residual·stress·flat error를 포함하는 더 넓은 패키지 판정은 구분한다.

새 [원문 기준 재심사](research/FINITE_CRITERIA_REAUDIT_KO.md)는 필요한 조건을 실제 원문에서 확인한다. 전체 annulus·모든 차수·거대한 K항의 수치 합산 조건을 모든 개별 유한 항목에 일괄 적용하지 않는다. 동시에 실제 적분·source object가 빠졌는데 작은 오차나 기호 이름만으로 완료했다고 표시하지 않는다.

## 원래 조건으로 완료한 여섯 항목

| 기준 | 실제 원본과 연결해 실행한 내용 | 별도의 패키지 범위 |
| --- | --- | --- |
| N4-03 | 고정 n=1의 정확한 6성분 계, source-derived C1·analytic strip·Cauchy loss, 원래 공통 collar, 유한 K의 정확식과 Picard tail, 실제 축·양의 반경 관측. 15개 certificate rule, Node 8개, 독립 Laurent/Fraction 782개 검사. | 거대한 K항 수치 합산, 모든 고차 계수, 모멘트 복구와 전체 N4. |
| N4-04 | 같은 실제 n=1,2의 수렴 함수와 전체 연속 5모멘트 복구, 실제 PDE 12개·preheat/heat invariant·4 support·prior-correction gate. Node 49개 및 독립 보존식 12개·누락 대조 12개. | 전역 signed 수치 적분, 모든 차수, 전체 배경·NS 정리. 보정 전 수치 debt 크기를 생성하지 않는다. |
| N4-05 | 같은 원래 source의 보존된 고정 core에서 N=0/1 직접 Fslow, 계산된 CNm/Km·공간·시간 미분, 같은 q의 양의 norm 하한/상한 비교, 독립 mesh·bits 정련. Node 12개·독립 Fraction 1,544개 및 교차 검토. | 전체 repaired profile, 모든 N의 잔차와 전체 N4. 고정-q supremum은 원래 similarity map의 시공간 집합이다. |
| N5-04 | (5.18),(5.44),(5.45)에 따른 완성 배경의 정확한 Imean velocity restriction. Φ,n,K,AΦ,B,B′와 left inverse, nonzero kp와 frequency bound, 실제 대표점의 원래 slow 이웃 및 전체 v에서 frame·denominator 하계. | 전체 annulus의 phase bound, 모든 slow derivatives. 생성식의 Imean domain을 더 넓은 인증 영역으로 표시하지 않는다. |
| N5-05 | 원문 homogeneous m=1 growing left datum으로 실제 projected ODE 적분. moving-normal·B′·damping을 유지한 Liouville 환원과 양의 Volterra 비교, 실제 energy·직교·reference midpoint·연속 Gaussian. | 일반 nonzero forcing의 zero-datum inverse, 모든 slow derivative Gaussian, 실제 covariance와 전체 N5. |
| N5-06 | 실제 일반 차수 source·canonical cutoff·완성 배경 C²에서 공통 q*를 생성. 실제 두 moving ODE와 수렴 H 적분, Haar·angular·cutoff 질량, finalized T0·두 shear, 정확 inverse·determinant·열 오차와 81개 후보 box의 전체 물리 (7.30) 연결. | 양의 weight는 허용 band의 열린 응력 support에 한정되고 경계는 정확 0. 유한 실행 member의 domain membership, signed 수치 H 적분, 모든 slow derivative 및 전체 NS 정리는 주장하지 않는다. |

N5-05의 실제 진폭 검증은 Node 13개 및 독립 Fraction/80자리 Decimal 618개를 포함한다. 실제 중점 x/P는 약 0.353553이며 reference P=1 또는 가운데 unit datum을 실제 해로 사용하지 않는다. 실제 h, lambda, u*와 carrier는 양의 정확식으로 유지한다. Float64 interval의 하단 0은 대입값이 아니다.

## 실제 모멘트 복구의 완료 범위

N4-04는 원래 식의 실제 1·2차에 대해 완료했다. 새 `ns.actual-moment-restoration`은 B.22/B.26/B.34/B.8, C.12/I1, 전체 outer와 I2/heat를 수렴 함수 연산으로 조립하고 실제 연속 inverse를 적용한다. 열 개 실제 모멘트 항등식과 내부 PDE 12개, 네 응력의 안쪽·바깥쪽 support 및 보존 total을 확인했다.

원래 preheat (5.19)의 상수항도 실제 Qp density, angular reset, 양의 Qb/Qp 및 terminal wait와 연결했다. 원식을 누락한 경우 실패하는 대조를 포함한다. **모멘트가 실제로 복구되기 전에는 다음 source를 허용하지 않는다.** 유한 iterate·reference 중점·caller 숫자나 복사한 판정은 완료 객체가 아니다.

기본 전체 원본 program의 SHA-256은 `8b79ba8db0b08acb8af742f91be9fa12d666832c38a6fdaeb58ed90a4f0f7776`이다. 43개 소스·증거 파일 결속과 매번 새로 생성한 전체 program 해시를 비교한다. 수치 signed moment의 계산을 이 정확식 구성에 포함시키지 않는다. 자세한 구성·독립 리뷰는 [실제 모멘트 복구](research/ACTUAL_MOMENT_RESTORATION_KO.md)에 있다.

## N5-06의 전체 source 영역 인증

`ns.actual-uniform-covariance`는 원문 §5–7과 같은 N3를 직접 소비하는 실제 함수 compiler다. 일반 차수의 보정 전 source, 여섯 성분 수렴해, 다섯 모멘트 inverse와 보정 완료 gate, n만으로 정하는 cutoff sequence를 차례로 생성한다. 실제 finite block과 all-n tail을 합해 enlarged slow 영역의 완성 배경 C²를 인증한다. leading 방향의 closed-support modulus와 실제 moving matrix의 각 산술 항을 연결하며 caller가 전달한 상계·target·판정은 받지 않는다.

정확한 두 homogeneous ODE에서 B′·pressure·moving normal·damping을 유지한다. ordered-integral recurrence의 무한 수렴해를 H의 실제 적분 operand로 사용한다. 유한 N항의 tail은 `exp(KL)(KL)^(N+1)/(N+1)!`이며 0으로 지우지 않는다. 실제 H 계수는 `(4−2√2)*c_i*(∫χ²)/2`이고 normalized Haar의 covering factor는 1이다.

공통 `qStar=2^(-ellMinimum-4)>0`는 고정 source만의 양수식이다. anchor·유한 표시 항·나중에 요구한 derivative order에 따라 고르지 않는다. 모든 `ell≥ellMinimum`과 허용 원래 box에서 정규화 covariance 열 오차 `kappa/128`, 정규화 determinant 하계 `15/8`, 정규화 y± 범위 `[kappa/64,2]`를 연결한다. 물리 `(theta,z)` 행과 `(+,-)` 열에서는 `det(H)<0`이며, 양의 하계는 절댓값에 적용한다.

완성 leading F,U,M과 I,J,S,Cp, 실제 Π에서 T0를 만들고 두 shear를 보존한다. 실제 H adjugate inverse의 두 rational identity가 `H*y−T0,star=(0,0)`을 준다. weight는 `Xa<X<Xb`에서 양수이고 경계에서 target과 함께 정확히 0이다. 원래 flat factors로 제곱근 amplitude의 smooth zero extension을 연결한다.

전역 분할에는 실제 `−log(q)/log(2)`와 각 band의 원래 chart·mesh·nearest offset이 들어간다. 가능한 81개 box 후보 밖의 모든 정수 항은 support상 정확히 0이고 최대 16개가 동시에 양수다. 두 sign은 한 box의 두 열로 묶어 한 번만 센다. 실제 physical torus에서 각 rectangle 좌표를 pulse에 대입하고, 전체 countable palette의 지지 분리로 cross terms를 없앤다. 원래 물리 Q·q·epsilon 지수를 모두 적용한 전역 (7.30)은 `0<q<qStar`에서 성립한다.

이 전역 등식의 `[0,0]`은 평균 covariance의 정확한 함수 등식이다. 수치 NS PDE residual이나 실제 H의 signed quadrature가 아니다. 화면에 구성한 finite member는 같은 source family의 실행 예시지만 그 ell이 ellMinimum 이상이라고 검사하지 않는다. 따라서 해당 finite member의 determinant 비영성과 y± 양성도 별도 false다. 유한 예시에서 얻은 결과를 근거로 uniform theorem을 추정하지 않는다.

[실제 family 구현](actual-covariance-source-certificate.mjs), [source 설명과 검토](research/ACTUAL_COVARIANCE_SOURCE_KO.md), [동결 manifest](evidence/actual-covariance-source.json), [정확한 compact receipt](evidence/actual-covariance-source-certificate.json)에 실제 root·영역·부등식·재현 근거를 보존한다. 이전 `ns.actual-covariance-matching`은 기존 대표점의 수치 검증 범위를 그대로 유지하며 그 결과의 whole-annulus flag는 바꾸지 않는다.

## 이미 완료한 연산자 조건의 경계

N4-06의 모든 q에 대한 cutoff schedule은 선언된 derivative constants에 대한 조건부 scalar 연산자다. N4-08은 원래 doubling 조건에서 완전한 active prefix를 확인하고 실제 supplied potential의 locally finite 합을 계산한다. 이전 예제 자체의 입력은 supplied coefficient다. 별도 source family compiler가 실제 일반 차수 sequence를 구성해 사용하며 기존 예제의 scope를 바꾸지 않는다.

N5-01의 두 chart 관측은 원래 accepted core interval과 정확한 q/Y 역변환에 연결된다. N5-02의 normalized Haar와 모든 fast/slow chain-rule 항, N5-03의 countable source mesh support allocation도 별도 exact operator다. 전역 Haar factor는 covering lift를 모두 포함해 1이고 국소 rectangle Jacobian은 4−2√2다.

N5-07은 원래 C_m와 전체 r_m의 mixed jet, cylindrical basis 미분, Cartesian curl/divergence 및 conjugate pair를 검증한다. N5-08은 supplied forcing·amplitude·cutoff jet의 모든 (1−ψ)f+ψ′t 항과 조건부 고정차수 log tail을 계산한다. 이러한 연산자의 입력이 실제 모든 harmonic의 source tuple로 연결됐다는 추가 주장은 하지 않는다.

## 재현과 출처

같은 N3 identity, parameter expression graph, accepted assembly와 원본 소스 바이트를 변경하지 않는다. 각각의 새 manifest와 독립 검사 receipt는 사용한 바이트를 검증한다. `node research-ide/mathscope-m2/navier/tests/generate-evidence.mjs`가 모든 등록 예제, original criterion text, 소스 manifest와 독립 근거를 묶는다. 최종 전체 Node·독립 검사 수와 현재 소스 hash는 `evidence/acceptance.json`에 기록한다. 기존 267개 Node·10,409개 독립 검사에 66개 Node·6,778개 독립 지원 검사 및 최종 H family 검사를 추가한다. N4-05의 고정 compact 유한 인증은 [잔차 유도](research/ACTUAL_RESIDUAL_ORDER_KO.md)와 [manifest](actual-residual-order-manifest.json)에 결속돼 있다. 균일 공분산의 기존 11개 Node·1,814개 독립 검사는 원래 보조 명제 범위를 유지한다. 실제 source 완료 판정은 별도의 최종 family compiler가 모든 입력과 영역을 연결한 뒤에만 부여한다.

새 Lean kernel proof나 전역 Navier–Stokes 정리의 완료를 주장하지 않는다. 원래 자료에 보존된 분석적 증명, 실행한 exact/interval 검사, 유한 criterion의 PASS, 전체 package의 미완료를 각각 기록한다.

## 원문 acceptance 밖의 추가 패키지 범위

원문 16개 기준에는 PARTIAL이나 OPEN이 남지 않는다. 고정 core의 N=0/1 결과를 전체 repaired profile과 모든 N의 물리 PDE residual로 확장하는 작업, 모든 slow Gaussian derivative의 명시적 norm, 전체 physical flat-error 조립은 별도의 패키지 범위다. `fullSameProfileN4/fullSameProfileN5`, 범용 `allOrderSourceCertificate`, 새 Lean `formalComplete`와 전역 NS 정리 flag를 이 체크리스트 집계로 자동 전환하지 않는다.
