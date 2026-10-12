# I2 · 원본 계산에 연결된 관측과 비교

이 모듈은 M1/M2의 실제 계산 결과를 관측하는 11개 예제와, 정수 기저를 바꿔도 불변량이 유지되는 복합체 실험을 제공합니다. 모든 그림은 실행 요청, 입력/결과 해시, 원본 필드와 연결됩니다. 원본 계산의 증거 등급을 화면의 모양으로 높이지 않습니다.

## Δ 상태족의 네 모드

| 모드 | 실제 생성 규칙 | 유지하거나 다시 계산하는 것 | correlator 검사 |
| --- | --- | --- | --- |
| `ASSUMED_BOUND` | Δ를 가정된 하한으로 기록 | 원본 장·표본·관측을 유지 | 동일한 유한 spectral 자료에서 계산한 C(t)가 유지되는지 검사 |
| `UNITS` | 같은 물리 장을 다른 표시 단위로 관측 | 물리 모형과 표본은 유지하고 좌표/단위 관측을 갱신 | 물리 시간으로 환산한 동일한 C(t)인지 검사 |
| `EFFECTIVE_MODEL` | 명시한 ρ(Δ)의 고전 장과 별도 유한 Hamiltonian `E_j=Δ+e_j` | 두 명시적 유효 모형의 값을 다시 계산 | 양의 가중치 `C_Δ(t)=Σ w_j exp(−(Δ+e_j)t)`의 비율을 독립 계산 |
| `ENSEMBLE_ESTIMATE` | 실제 SU(2) Gibbs chain의 β=Δ | 원본 lattice와 보관 chain 표본을 다시 계산 | 보관된 action 이력의 실제 lag covariance를 독립 재계산 |

유효 모드의 유한 Hamiltonian은 고전 장에서 유도한 양자 이론이 아닙니다. ensemble의 가로축은 Monte Carlo lag입니다. 실제 물리 시간이나 양자 질량 간극으로 해석하지 않습니다. 작은 기본 ensemble은 분포의 평형이나 위상 혼합을 인증하지 않습니다.

양쪽 화면은 카메라를 공유합니다. `FIXED` 색은 전체 프레임의 실제 값에서 공통 범위를 고르고, `AUTO`는 선택한 프레임 쌍의 공통 범위를 고릅니다. 모형·표본·관측의 해시를 각각 보관하므로 장이 그대로인 경우와 표본을 다시 만든 경우를 구별할 수 있습니다. 유효 모드의 잘못된 correlator를 넣으면 독립 의존식 검사에서 실패합니다.

## 4D 관측

같은 실제 고전 장에서 다음 연산을 각각 실행합니다.

- `SLICE`: 지정한 Euclidean `x4`에서의 scalar 단면. 고정 좌표의 값·단위·원본 필드를 보존합니다.
- `FINITE_MARGINAL`: 명시한 유한 x4 구간의 scalar 적분. 전체 4D 장을 복원할 수 없습니다.
- `CONDITIONAL_MEAN`: 같은 유한 fibre의 균등 확률 측도에 따른 평균. 적분값을 fibre 길이로 나누고 밀도의 원래 단위를 유지합니다.
- `WILSON_OPEN`: 실제 endpoint와 경로, `D=d+A` 및 gauge convention을 가진 열린 parallel transport. 자동으로 gauge invariant라고 부르지 않습니다.
- `WILSON_CLOSED`: 닫힌 실제 경로의 character. 열린 line의 endpoint 결합과 구별합니다.

적분은 선언한 유한 구간과 Simpson 해상도에서 계산됩니다. marginal이나 평균이 gauge connection을 반환하지 않습니다. 데이터가 손실되는 관측의 reconstruction 버튼은 제공하지 않습니다.

## 물리·유사 좌표

`observation.blowup-pair`는 **M1의 명시한 유한 후보**를 한 번 만들고, 같은 profile의 각 τ를 두 좌표계로 표시합니다. 기본 유한 후보의 `h=.005`는 원문의 극도로 작은 N3 지수와 구별됩니다. 원본 후보의 PARTIAL 상태와 남은 조건도 결과에 보존됩니다.

물리 좌표의 시야는 모든 유한 τ 프레임에서 고정합니다. 유사 좌표에는 radial/axial 확대율을 저장하고, 양쪽 색은 같은 물리 속도 크기를 사용합니다. τ=0에서는 두 그림과 정확표를 모두 경계 상태로 바꿉니다. 지원 정밀도를 벗어난 τ에는 `PRECISION_REQUIRED`를 표시하며 overflow나 underflow를 무한대의 증거로 사용하지 않습니다.

M2 NS의 별도 source 관측은 N3 원문의 정확한 기호식과 기존 구간 근거를 사용합니다. 이 두 입력 경로를 같은 프로파일이라고 합치지 않습니다.

## 복합체와 기저 교체

`observation.complex-basis`는 M1에서 실제 계산한 완비 Čech–de Rham 복합체의 유한 대체를 사용합니다. `ORIGINAL`, `REVERSE`, `SHEAR`는 정수 unimodular 행렬 B에 의한 기저입니다.

`D'=B_(k+1)^−1 D B_k`를 만들 때 Frobenius의 source/target, deformation retract의 i/r/h, filtration inclusion도 함께 운반합니다. 각 행렬, kernel/image 생성자와 완전성 근거, 계산된 H와 그 Frobenius를 결과에 보관합니다. 영차원 모듈의 사상은 빈 그림 대신 정확한 0 사상이라는 표를 표시합니다.

선택한 기저 성분에서는 미분, Frobenius, filtration 포함 여부와 비교 사상을 추적합니다. 화면상의 행·열과 차수는 categorical 좌표입니다. 화면 거리로 p-adic 또는 위상적 가까움을 주장하지 않습니다.

## 렌더링과 검증 범위

WebGL은 유지된 원본 점의 **표시 좌표와 색**만 rasterize합니다. CPU 투영, 정확한 수치표와 선택 원본은 두 경로에서 같습니다. context를 만들지 못하거나 잃으면 CPU Canvas2D로 전환합니다.

이번 클라우드 브라우저에서는 WebGL context가 제공되지 않았습니다. 실제 브라우저에서는 CPU fallback, 키보드 카메라, 두 화면 동기화, 입력 변경 시 이전 그림 제거, 기저 선택, τ 경계 및 재현 MATCH를 검사했습니다. `evidence/browser-i2-v58-audit.json`은 v58에서 실행한 11종의 기록이며 최종 배포의 전체 실행은 별도 릴리스 기록을 참조합니다.

GPU 프로그램은 다음 두 독립 방식으로 확인합니다.

1. JS 경로 검사: 실제 `SourceBoundScene`의 WebGL 분기를 실행하는 API fixture로 CPU 중복 그리기 방지, 동일 투영/정확 선택값, context-loss fallback을 검사합니다.
2. GLSL/raster 검사: 실제 소스의 셰이더와 `packMarks` 버퍼를 offscreen OpenGL ES에서 실행합니다. Mesa llvmpipe software renderer에서 색·alpha·투명한 바깥 영역을 읽고 잘못 이동한 셰이더가 실패하는지 확인합니다. 이 검사는 이 브라우저의 WebGL context나 물리 GPU 실행을 의미하지 않습니다.

6,000점 raster의 30회 측정 p95는 약 5.2ms이고, 최대 Float32 표시 좌표 오차는 0.001px 미만이었습니다. 기준과 실제 환경은 `evidence/gpu-shader-raster-audit.json`에 기록됩니다. 같은 점의 정확한 값은 Float32로 덮어쓰지 않습니다.

```bash
node --test research-ide/mathscope-m2/observatory/tests/*.test.mjs
python research-ide/mathscope-m2/tests/gpu_raster_audit.py
```

입력/범위 오류, 취소, 미지원 정밀도, 바뀐 입력, τ=0, 원본과 맞지 않는 correlator는 성공 모양의 자료로 대체하지 않습니다. M1 prime atlas 및 전체 59개 관측의 별도 검사는 `visualization/visualization.test.mjs`에 있습니다.
