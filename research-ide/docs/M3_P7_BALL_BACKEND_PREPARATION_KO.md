# P7 첫 analytic ball backend 사전 조사

조사일: 2026-10-11. 상태: **읽기 전용 사전 조사**. M2가 완료된 뒤 실행할 첫 P7 backend의 후보·계약·입수 경로를 정리한다. 패키지를 설치하거나 M3 구현·관문을 시작하지 않았다. 이번 조사에서는 동결된 M2 수학 모듈을 수정하지 않았다. 실제 환경 관측과 배포 메타데이터는 [별도 조사 기록](M3_P7_BALL_BACKEND_PREPARATION_EVIDENCE.json)에 있다.

## 1. 결정할 수 있는 것

첫 후보는 **python-flint 0.9.0의 공개 `arb`/`acb`/`acb_series`/`dirichlet_char` 인터페이스**다. ζ·Γ의 복소 ball, 정확한 입력에서의 Taylor 계수, Hardy Z 값, 제타 영점 고립과 총개수 API가 이미 존재한다. 따라서 첫 ζ/Γ 및 낮은 높이의 영점 관측을 위해 새 C wrapper부터 만들 필요는 없다. 다만 이 바인딩을 호출했다는 사실만으로 P7-02의 오차 항목별 기록이나 P7-03의 **독립적인 총개수 검증**이 완료되지는 않는다. [공식 0.9.0 acb 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/acb.pyx), [arb 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/arb.pyx), [Dirichlet 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/dirichlet.pyx)

현재 CPython 3.12.14·Linux x86_64·glibc 2.39에는 아래 공식 wheel의 두 플랫폼 태그가 모두 맞는다. 이 일치는 설치 없이 현재 `packaging.tags.sys_tags()`로 관측했다. 그러나 **executor에서 해당 wheel URL의 직접 HEAD 요청은 timeout**이었다. Exa를 통한 공식 PyPI JSON·문서·태그 소스 읽기는 성공했지만 바이너리 다운로드와 import는 아직 검증하지 않았다. 따라서 현재의 정확한 상태는 `ARTIFACT_IDENTIFIED_AND_TAG_COMPATIBLE / DOWNLOAD_UNVERIFIED / NOT_INSTALLED`다.

## 2. 원문 P7에서 먼저 충족할 계약

원문 Blueprint PDF의 실제 33–34쪽을 `pdftotext`로 읽었다. 파일 SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이며, 선행은 P1·P4다. 첫 backend와 직접 관련된 기준은 다음과 같다.

| 원문 항목 | 첫 backend가 넘겨야 하는 내용 | 이 조사에서 완료하지 않은 부분 |
|---|---|---|
| P7-01 | ζ, ξ, elliptic L, 완성 Λ를 서로 다른 객체로 식별하고 poles·trivial factors·정규화를 보존 | elliptic 최소 모형, Tate/bad factors, conductor·root number의 실제 계산 |
| P7-02 | critical strip에서는 해석적 연장과 complex ball; 반올림·급수 잘림·tail이 포함된 결과 | 오차 각 항의 별도 수치 ledger와 실제 새 실행 |
| P7-03 | `0 < Im(ρ) ≤ T`인 전체 strip의 중복도 포함 개수, Hardy Z 고립, 독립 count, 끝점 제외 | 실제 `N(20)=1`, `N(30)=3` 인증 실행 및 counter와의 대조 |

원문 위치는 `/workspace/scratch/cf975e3da716/upload/MathScope_Research_IDE_Blueprint_v1_KO(1)(20261011-070612).pdf`다. 현재 산술 재사용 경로와 나머지 P7 범위는 [기존 M3 진입 지도 §2](M3_ENTRYPOINT_MAP_POSITIVE_STRESS_20261011_KO.md)에 정리돼 있다. 그 지도에 있는 `M1/arithmetic/complex.mjs`는 cochain complex이며 복소 ball backend가 아니다.

## 3. 고정할 배포 artifact와 현재 환경

### 3.1 선택한 출시판

공식 PyPI의 **버전이 고정된 JSON**에서 다음 항목을 읽었다. 아래 SHA는 배포자가 게시한 파일 SHA이며, 이번에 실제 wheel bytes를 내려받아 확인한 SHA가 아니다. [PyPI 0.9.0 메타데이터](https://pypi.org/pypi/python-flint/0.9.0/json)

| 용도 | artifact | 크기 | 게시 SHA-256 |
|---|---|---:|---|
| 현재 Linux CPython 환경 | `python_flint-0.9.0-cp310-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.whl` | 10,125,938 bytes | `376b88cacd30612479e839ffdba887599d3f9c8c0e214852bf80bb2b194e4d76` |
| 동일 출시판 source distribution | `python_flint-0.9.0.tar.gz` | 486,670 bytes | `686b2907eedaf0c0842caefab29a5775d2e633fd5815b81e13b81ca2c6ad0a36` |
| 별도 브라우저/Pyodide 후보 | `python_flint-0.9.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl` | 7,121,329 bytes | `b31f5c00e0e36040ab58d00b3025156e20869b990d776e4bf90f870b1ee11ad3` |

선택한 Linux wheel의 업로드 시각은 2026-07-03 23:28:27 UTC이고 `yanked=false`, `Requires-Python >=3.10`이다. 직접 URL은 [공식 files.pythonhosted.org wheel](https://files.pythonhosted.org/packages/db/3f/5f57004f9f43ac6508f874cc97123f11b27b6811b5bb0d320c43f600f0cb/python_flint-0.9.0-cp310-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.whl)이다. `cp310-abi3`는 CPython stable ABI 태그이고 manylinux2014는 x86_64에서 glibc 2.17 기반 호환성을 표현한다. 실제 설치 가능 여부는 태그 일치 다음에 wheel SHA·import·동적 라이브러리 확인을 거쳐야 한다. [Python Packaging 공식 태그 명세](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/)

공식 배포는 dependencies를 wheel에 묶으므로, 맞는 wheel을 확보하는 경로에서는 별도의 system FLINT를 먼저 설치할 필요가 없다. source build에는 FLINT, C compiler와 Cython/Meson 등의 build 도구가 필요하다. 첫 단계는 재현 가능한 pinned wheel을 쓰는 편이 적절하다. 새 system 패키지 설치나 기존 primary runtime 변경은 이번 조사 범위가 아니다. [공식 build 안내](https://python-flint.readthedocs.io/en/latest/build.html), [0.9.0 빌드 설정](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/pyproject.toml)

WebAssembly wheel도 실제 배포 목록에 있지만 CPython 3.14·`pyemscripten_2026_0` 전용이다. 현재 Node/browser worker나 Linux CPython 3.12에 바로 import할 artifact가 아니다. 별도의 호환 Pyodide runtime·로더·메모리·직렬화·재실행 검증이 필요하므로 첫 원본 검증은 Linux backend에서 시작하고, browser 실행은 이후 같은 요청/증거 형식으로 연결하는 것이 현실적이다. 이는 artifact 태그와 프로젝트 빌드 설정으로부터의 구현 판단이다. [0.9.0 Pyodide 빌드 설정](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/pyproject.toml)

### 3.2 라이선스와 실제 버전 추적

python-flint 자체의 태그 `0.9.0/LICENSE`와 `pyproject.toml`은 **MIT**다. Linux wheel의 공식 메타데이터는 **`MIT AND LGPL-3.0-or-later`**이며, 동봉 license 경로에 **GMP 6.3.0, MPFR 4.2.2, FLINT 3.6.0**을 명시한다. FLINT 3.6.0의 `COPYING.LESSER`도 LGPL v3이다. 오래된 README의 “FLINT/Arb LGPL v2.1+” 문장을 현재 wheel의 라이선스 근거로 쓰면 안 된다. 배포 artifact와 동봉 notices를 함께 고정한다. [python-flint MIT](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/LICENSE), [FLINT 3.6.0 LGPL](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/COPYING.LESSER), [PyPI wheel 메타데이터](https://pypi.org/pypi/python-flint/0.9.0/json)

공식 FLINT 3.6.0 release도 2026-06-29에 게시돼 있다. 웹의 `latest` 문서와 검색 캐시에는 3.5/3.7 development 제목이 섞였으므로 이 보고서의 정확한 구현 대조는 **python-flint `0.9.0` / FLINT `v3.6.0` 태그**를 우선했다. 향후 import 후에는 `flint.__version__`, `flint.__FLINT_VERSION__`, `flint.__FLINT_RELEASE__`를 실제 실행 기록에 넣는다. 이 속성들은 공식 0.9.0 `__init__.py`에서 확인했지만 이번 환경에서는 호출하지 않았다. [FLINT 3.6.0 release](https://github.com/flintlib/flint/releases/tag/v3.6.0), [0.9.0 version exports](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/__init__.py)

## 4. 실제 공개 API와 증거 의미

| 작업 | 확인한 Python API | 연결된 FLINT API / 의미 |
|---|---|---|
| 복소 사각형 ball | `acb(real, imag)`, 각 성분 `arb` | 실수·허수 각각 midpoint-radius 포함 구간 |
| ζ 및 Hurwitz ζ | `s.zeta()`, `s.zeta(a)` | `acb_zeta`, `acb_hurwitz_zeta`; critical strip도 직접 해석적 값 평가 |
| Γ, reciprocal Γ, log Γ | `s.gamma()`, `s.rgamma()`, `s.lgamma()` | `acb_gamma`, `acb_rgamma`, `acb_lgamma`; poles/branch를 보존 |
| Taylor 계수 | `acb_series([s,1], prec=m+1).zeta()`, `.gamma()` | `acb_poly_zeta_series`, `acb_poly_gamma_series`; `ctx.cap`도 최소 m+1로 설정 |
| ζ pole 제거 계수 | `series.zeta(deflate=1)` | `ζ(s)-1/(s-1)`의 Taylor 계수; 원래 ζ 객체와 다른 정규화 |
| Hardy Z 값 | `dirichlet_char(1,1).hardy_z(t)` | `acb_dirichlet_hardy_z(...,len=1,prec)`; Riemann ζ의 principal character |
| 제타 영점 ball | `acb.zeta_zero(n)`, `acb.zeta_zeros(n,num)` | `acb_dirichlet_zeta_zero`, `acb_dirichlet_zeta_zeros`; n≥1, 실제 Z 고립 후 실수부 1/2를 붙임 |
| 전체 영점 개수 | `arb(T).zeta_nzeros()` | `acb_dirichlet_zeta_nzeros`; `0<Imρ≤T`, 중복도 포함 |
| 유일 정수 판정 | `count.unique_fmpz()` | ball에 들어가는 정수가 하나일 때만 그 정수, 아니면 `None` |
| 적분 | `acb.integral(func,a,b,...)` | `acb_calc_integrate`; 복소 선분 적분의 엄밀 포함값 |
| 포함·유한·정확성 | `.contains(0)`, `.is_finite()`, `.is_exact()` | 포함 여부와 정확한 singleton을 분리 |
| 재현 가능한 endpoint | `arb.lower().man_exp()`, `arb.upper().man_exp()` | 외향 dyadic endpoint `(integer,exponent)` |

표의 바인딩은 문서 이름만이 아니라 실제 호출 본문을 읽었다. [acb 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/acb.pyx), [arb 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/arb.pyx), [series 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/acb_series.pyx), [Dirichlet 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/dirichlet.pyx)

일반 scalar `acb`에 `xi()`나 `hardy_z()`가 있다고 가정하지 않는다. Hardy Z는 위 character 객체로 이미 쓸 수 있다. 완성 ξ는 FLINT C의 `acb_dirichlet_xi`가 있으며, Python 첫 wrapper를 구성한다면 원래 `ξ(s)=s(s-1)π^(-s/2)Γ(s/2)ζ(s)/2`와 removable singularity 처리를 별도로 명세해야 한다. 단순 곱을 s=0,1 또는 음의 짝수에 대입해 `0×∞`를 만들면 전체 함수 계산이 아니다. 해당 정규화·영점 변환은 별도 원본 수학 의무다. [FLINT 3.6.0 ξ 명세](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/doc/source/acb_dirichlet.rst)

## 5. ball이 보증하는 오차와 별도 의무

Arb의 기본 연산은 입력 포함 구간의 이미지를 덮는 출력 구간을 만들며 반올림과 내부 함수 근사 오차를 포함한다. working precision은 그 포함 구간이 얼마나 좁아질지를 조절하는 계산 자원이다. 목표 dps를 주었다는 사실이 dps만큼의 정확도를 얻었다는 뜻은 아니다. 넓은 입력·cancellation·singularity 때문에 결과가 넓거나 비유한일 수 있다. 저자 논문도 interval arithmetic이 수식 오류나 구현 버그 자체를 없애지는 않는다고 구분한다. [일반 연산 문서](https://python-flint.readthedocs.io/en/latest/general.html), [Johansson, Arb 논문](https://arxiv.org/abs/1611.02831)

P7 첫 결과 형식은 다음 세 층을 구별해야 한다.

1. **입력:** 정수·유리수·dyadic 또는 명시한 입력 ball. 사용자 문자열 `0.1`을 먼저 JavaScript/Python float로 바꾼 후 정확한 1/10이라고 쓰지 않는다.
2. **출력:** real/imag 외향 endpoint, 실제 radius와 절대/상대 허용 오차 비교, working precision, singularity·branch·input domain, backend/artifact SHA.
3. **오차 provenance:** FLINT 내부 total enclosure, 별도 외부 finite product/series tail, 사용자가 입력한 불확실성. wrapper가 공개하지 않는 내부 반올림·Euler–Maclaurin/RS tail 분해를 `0`으로 기록하거나 따로 측정한 값처럼 만들지 않는다.

`acb_series([s,1])`의 k번째 계수는 `f^(k)(s)/k!`의 포함값이다. 표시되는 `O(x^m)`은 formal truncation 차수이며, 임의의 비영 x에 유한 Taylor 다항식을 대입했을 때의 수치 remainder bound가 아니다. 그 용도에는 Cauchy 등의 별도 나머지 상계가 필요하다. `ctx.prec`와 `ctx.cap`는 서로 다른 설정이며 context를 복원하거나 계산 요청별 프로세스를 분리한다. [0.9.0 series 구현](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/acb_series.pyx), [0.9.0 context 구현](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/flint_base/flint_context.pyx)

직렬화는 `.str(radius=False)`나 midpoint decimal을 인증 endpoint로 사용하지 않는다. finite real/imag 성분의 `lower()/upper()`를 취하고 `man_exp()`가 주는 두 정수 문자열을 저장하면 출력 바깥쪽으로 반올림한 dyadic를 보존할 수 있다. JSON integer 정밀도 손실을 피하려고 mantissa와 exponent를 문자열로 내보내고 역변환 containment를 확인한다. [arb endpoint 및 변환 구현](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/arb.pyx)

### 적분의 중요한 조건

`acb.integral` callback은 `(x, analytic)`을 받는다. `analytic=True`일 때는 해당 복소 box에서 holomorphic함을 유지해야 한다. `sqrt/log` 등의 branch cut을 무시하면 반환 숫자가 그럴듯해도 포함 보증의 전제가 깨진다. meromorphic 표현은 poles가 닿는 입력을 비유한으로 반환해야 한다. [Python 적분 설명](https://python-flint.readthedocs.io/en/latest/acb.html#flint.acb.integral)

FLINT C 함수는 `ARB_CALC_SUCCESS/NO_CONVERGENCE`를 반환하지만 0.9.0 Python wrapper는 그 return code를 사용자에게 별도 내보내지 않는다. 더구나 공식 C 문서는 subinterval tolerance를 지침으로 정의하며 누적 오차가 목표보다 커질 수 있다고 명시한다. 따라서 Python에서 **finite output와 실제 최종 폭**을 검사해야 한다. improper integral에는 별도 잘림·tail이 필요하다. [태그가 고정된 C 적분 명세](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/doc/source/acb_calc.rst), [Python wrapper 본문](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/acb.pyx)

## 6. zero count와 RH_VERIFIED_TO_T의 올바른 경로

### 6.1 API의 정확한 의미

FLINT는 `N(T)`를 **`0<Imρ≤T`인 모든 ζ 영점의 중복도 포함 개수**로 정의한다. T가 exact일 때 정수 count를 계산하고, T가 ball이면 양 끝점의 count를 덮는 ball을 만든다. 높이 ball이 영점을 가로지르면 결과를 한 정수로 확정할 수 없다. `unique_fmpz()`가 유일한 정수를 반환하는 경우만 이를 count로 저장하며, 작은 실수의 반올림으로 정수를 만들어내지 않는다. [v3.6.0 명세](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/doc/source/acb_dirichlet.rst), [실제 nzeros 구현](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/src/acb_dirichlet/isolate_hardy_z_zero.c)

`acb.zeta_zeros`가 실수부 1/2인 결과를 내보내는 이유는 그 값을 임의로 투영하기 때문이 아니라, 먼저 Hardy Z의 실수 영점을 고립하고 그 ordinate를 넣는 구현이기 때문이다. 반환된 단일 ball에서 `ζ(ball)`이 0을 포함한다는 사실만으로 근의 존재·유일성을 새로 증명할 수는 없다. 성공한 고립 algorithm의 계약이나 독립적인 부호/interval Newton 검사가 필요하다. [zeta_zeros 구현](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/src/acb_dirichlet/zeta_zeros.c), [Hardy Z 고립 구현](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/src/acb_dirichlet/isolate_hardy_z_zero.c)

Turing 방법은 부호 변화로 얻은 임계선 근의 하계와 명시적인 총개수 경계를 비교하는 구조다. 공식 구현은 Gram/Turing 영역을 검사하고 필요하면 정밀도·분할을 증가시킨다. 특정 정리를 쓸 수 있는 높이/Gram index 조건을 생략하면 안 된다. 또한 일부 sign/refinement 경로는 반복문을 사용하므로 API 자체의 유한 실행 시간 보증을 가정하지 않는다. timeout·unresolved sign·범위 초과를 `UNRESOLVED`로 남긴다. [공식 알고리즘 명세](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/doc/source/acb_dirichlet.rst), [Arias de Reyna, 2012](https://ir.cwi.nl/pub/19724), [Trudgian, 2014](https://arxiv.org/abs/1406.3416)

### 6.2 두 Python 호출은 완전히 독립적인 계산이 아니다

`zeta_zeros`와 `zeta_nzeros`는 FLINT 3.6.0에서 동일한 `isolate_hardy_z_zero.c`의 분리·Turing machinery를 공유한다. `backlund_s()`도 내부에서 N(T)를 이용하므로 `N = theta/pi + 1 + backlund_s`를 다시 계산하는 것은 독립 count가 아니다. `arg(ζ(1/2+iT))`의 principal argument를 Backlund의 연속 argument로 대체해서도 안 된다. [실제 공통 구현](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/src/acb_dirichlet/isolate_hardy_z_zero.c), [Backlund 명세](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/doc/source/acb_dirichlet.rst)

따라서 첫 P7-03 검증은 다음 **독립 알고리즘**을 준비하는 것이 적절하다. 같은 ball library에 대한 신뢰는 공유하지만, 총개수를 임계선 고립 목록에서 다시 읽지 않는 경로다.

- T=20 또는 30을 정확한 정수로 고정한다.
- `Re(s)=-1,2`, `Im(s)=-T,T`인 반시계 사각 contour를 사용한다. 각 선분을 유한하게 분할하고 **그 선분 전체**의 ζ ball이 0을 배제함을 기록한다. 정점 값만 검사하는 것은 부족하다.
- 각 선분에서 `ζ′/ζ`를 복소 ball 적분한다. ζ′는 실제 Taylor 1차 계수로 생성한다. 선분의 nonzero covering 및 callback의 holomorphic 전제를 보존한다.
- `W=(2πi)^(-1)∮ζ′(s)/ζ(s) ds`의 최종 ball이 유일한 정수를 포함하는지 검사한다. 이 contour 안에는 ζ의 simple pole s=1이 하나 있고 trivial zeros는 없으므로 argument principle과 conjugation에서 `W=2N(T)-1`, 즉 `N(T)=(W+1)/2`가 된다. 이 보정식을 source 수학 계약으로 기록한다.
- 별도 Hardy Z 부호 변화/고립 boxes를 양의 ordinate 순으로 보관한다. 모두 `(0,T)` 안에 있고 서로 겹치지 않으며 전체 count와 일치해야 한다. 필요하면 derivative nonzero 또는 interval Newton으로 각 box의 유일성·단순성을 추가 인증한다.

이 contour 선택과 pole 보정은 위 공식 API를 이용하는 **새 구현을 위한 수학적 도출**이며, 이번에 실제 적분하거나 N(20),N(30)을 계산하지 않았다. 원문 acceptance의 기대값은 각각 1과 3이다. 두 경로와 끝점 제외가 모두 실행된 뒤에만 `RH_VERIFIED_TO_T`를 만들 수 있다. 이는 유한 높이의 명제이며 일반 RH가 아니다.

## 7. 지금 사용할 수 있는 도구의 범위

현재 primary Python에는 `flint`, `mpmath`, `sympy`, `gmpy2`가 없고 NumPy·SciPy가 있다. 별도 설치 없이 버전·module availability·wheel tag만 조사했다. Exa는 공식 문서, PyPI JSON, 태그 소스를 읽을 수 있었다. 직접 binary URL HEAD는 timeout이었다. 이 둘은 서로 다른 네트워크 경로이므로 웹 검색 성공을 executor package download 성공으로 기록하지 않는다.

사용자가 선택한 **Precise Special Functions**의 현재 ζ·Γ 도구는 `s:number` 또는 `z:number`, `precision_dps`를 받아 **결과 문자열 한 개**를 반환한다. 복소 입력의 두 성분, 입력 radius, 결과 radius, directed endpoints, zero-count certificate는 현재 tool schema에 없다. 조사 중 `ζ(2)`와 `Γ(1/2)`를 60dps로 호출해 정상 문자열 출력을 관측했으나 엄밀 오차 경계는 반환되지 않았다. 따라서 별도 대조값으로는 쓸 수 있지만 P7의 analytic ball source authority나 `N(T)` 증거를 대신하지 않는다. 이 판단의 근거는 외부 명칭이 아니라 이번 세션에서 노출된 tool schema와 실제 반환 구조다. 원래 반환값은 별도 조사 JSON에 있다.

## 8. M2 완료 뒤의 첫 실행 묶음

첫 실제 실행 범위는 **ζ/Γ 값·Taylor 계수·낮은 높이 영점 검증의 작은 묶음**으로 정한다. 전체 P7 rank/BSD backend나 M3 나머지 작업을 동시에 완료한 것으로 해석하지 않는다.

| 단계 | 구체적 입력/산출물 | 통과에 필요한 실제 확인 |
|---|---|---|
| Artifact 확보 | 위 pinned Linux wheel, SHA, version·license metadata | 허용된 download 경로에서 bytes SHA 확인; 실패 시 환경 접근 문제로 기록 |
| 격리 실행 | 별도 환경의 python-flint 0.9.0 및 실제 FLINT version | import, 라이브러리 버전, 프로세스 종료, 자기검사; 기존 M2 runtime 불변 |
| Value/jet | exact rational/dyadic s, ζ/Γ/rgamma/lgamma와 s 주변 finite jets | finite enclosure, actual width, branch/pole 정책, k! 정규화, endpoint round trip |
| 음성 대조 | ζ pole s=1, Γ pole, 0을 가로지르는 ball, 잘못된 branch callback | nonfinite/unresolved를 성공으로 승격하지 않음; float/중점-only 직렬화 거부 |
| 영점 단계 | T=20,30; Hardy Z 고립과 ζ′/ζ contour | 끝점·선분 nonzero, 중복도 total count, 모든 고립 boxes 및 independent count 일치 |
| 증거 export | exact input, method/domain, precision·cap, endpoints, versions·artifact SHA, error provenance | 재생 요청의 동일성과 관측 결과를 원래 값에 결속; failure도 보존 |

예를 들어 `ζ(2)=π²/6`, `Γ(1/2)=√π`, `Γ(z+1)=zΓ(z)`를 각각 만든 ball의 겹침으로 대조할 수 있다. 이 실행은 regression이며 함수 항등식 자체의 증명을 대체하지 않는다. `0∈ball`은 exact zero가 아니고 `0∉ball`만 nonvanishing을 준다는 규칙을 처음부터 형식에 넣는다.

wheel 파일이 실제로 확보되기 전에는 설치 완료·backend 준비 완료라고 기록하지 않는다. 또한 고정 출시판에 있는 기능이 특정 elliptic curve의 full L, bad factor, root number, descent/Selmer 또는 exact modular-symbol vanishing을 자동으로 제공한다고 간주하지 않는다. 그 입력과 증거는 이후 원문 P7의 별도 생성자에서 연결해야 한다.

## 9. 조사 범위와 남은 결정

공식 문서/API 및 배포 metadata와 현재 interpreter 태그는 확인했다. 패키지 설치, FLINT import, ζ/Γ ball 실행, 영점 count, contour 적분, 브라우저 WASM 실행, P7 관문 변경은 **전부 미실행**이다. 지금 해결해야 할 현실적 첫 문제는 wheel binary를 실제 실행 환경에 넣는 승인된 경로의 확보다. 그 다음에는 구현할 수 있는 API가 이미 있으므로 ζ/Γ부터 실제 ball packet을 만들고, 독립 contour count를 추가하는 순서가 맞다.

조사는 Exa의 서로 다른 7개 검색으로 요청한 35개 후보 결과 중 공식 maintainer 문서·태그 코드·PyPI metadata·저자 논문을 직접 읽어 정리했다. 검색 결과 수는 증명 수나 서로 독립적인 근거 수가 아니다. 최종 사실 근거는 위에 인용한 primary URL과 별도 환경 관측 기록이다.
