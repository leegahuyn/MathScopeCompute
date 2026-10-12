# M2의 실제 미분 연결에 사용하는 Lean 대수 보조정리

`MathScope/M2/Navier/DifferentialAlgebra.lean`의 **14개 주정리**를 실제 Lean
커널로 검사했다. 이는 M2에 새로 추가한 형식 증명이며, 기존 원문 NS proof,
Comparator, N1/N3, 원문 64개 acceptance 판정을 수정하지 않는다.

## 정확히 증명한 내용

함수의 미분을 다루기 위한 `Differential K`는 덧셈 법칙, Leibniz 법칙,
상수 0·1의 미분을 **명시적인 입력 조건**으로 가진다. 일반 역행렬·변분
정리는 비가환 `Ring K`에서 성립한다. 따라서 곱의 순서와 두 개의 혼합
교차항을 교환하거나 합쳐 없애지 않는다. 공분산 밀도와 원통좌표 curl은
스칼라 함수에 해당하는 `CommRing K`에서 증명한다.

| Lean 선언 | 커널로 확인한 결론 |
| --- | --- |
| `Differential.mixed_product` | 두 미분의 합성에 대해 곱의 네 항을 모두 유지 |
| `Differential.first_variation_rhs` | `D(Mw)=M(Dw)+(DM)w` |
| `Differential.mixed_variation_rhs` | `DE(Mw)=M(DEw)+(DM)(Ew)+(EM)(Dw)+(DEM)w` |
| `Differential.second_variation_rhs` | 같은 방향의 2차 미분에서 두 개의 동일 교차항을 유지 |
| `Differential.inverse_first` | `AB=BA=1`이면 `DB=-B(DA)B` |
| `Differential.inverse_mixed` | `DEB=B(EA)B(DA)B+B(DA)B(EA)B-B(DEA)B` |
| `Differential.solve_first` | `JH=1`, `Hy=T`이면 `Dy=J(DT-(DH)y)` |
| `Differential.solve_mixed` | `DEy=J(DET-(DEH)y-(EH)(Dy)-(DH)(Ey))` |
| `covariance_density_mixed` | `DE(t_r t_j)`의 네 항을 보존 |
| `square_root_first_relation` | `s²=y`이면 `(s+s)Ds=Dy` |
| `square_root_mixed_relation` | `(s+s)DEs+(Ds)(Es)+(Ds)(Es)=DEy` |
| `full_cylindrical_curl_divergence` | 명시한 gradient·원통 기저·교환 조건에서 전체 curl의 divergence가 0 |
| `square_root_first` | `s+s≠0`을 입력받아 제곱근 1차 미분식을 나눗셈으로 해결 |
| `two_column_inverse` | `ad-bc≠0`인 실제 2열 adjugate 공식의 두 행이 target과 같음 |

`D,E`가 서로 commute한다는 조건을 기본적으로 가정하지 않는다. 일반
혼합 공식은 적힌 순서 `D(E f)` 그대로 성립한다. curl 정리에서 필요한
`Dr(Dz Ct)=Dz(Dr Ct)`는 해당 정리의 별도 가정이다.

### 전체 curl의 형식화

`w=ikm`, `ir=1/R`에 대응하는 대수 변수로 다음 진폭을 정의한다.

\[
\begin{aligned}
a_r&=w(n_\theta C_z-n_zC_\theta)-D_zC_\theta,\\
a_\theta&=w(n_zC_r-n_rC_z)+D_zC_r-D_rC_z,\\
a_z&=w(n_rC_\theta-n_\theta C_r)+D_rC_\theta+ir\,C_\theta.
\end{aligned}
\]

`Dr w=Dz w=0`, `Dr nt=-ir*nt`, `Dz nt=0`, `Dr nz=Dz nr`, `Dz ir=0`,
그리고 위 혼합 미분 조건으로

\[
D_ra_r+ir\,a_r+D_za_z+w(n_ra_r+n_\theta a_\theta+n_za_z)=0
\]

을 증명한다. `ir*C_theta`를 지운 동일 소스는 실제 Lean 컴파일에서 실패한다.
이는 원래 `source-pulse-curl.mjs`의 형식 항등식에 대응한다.

## 분석적으로 추가 연결해야 하는 내용

위 조건에서 얻는 보조정리와 실제 NS source의 분석적 조건을 구분한다.

- 원래 완성 배경·moving frame·Volterra 무한해의 실제 미분 가능성 및
  미분과 적분/무한급수의 교환은 이 파일에서 증명하지 않는다.
- `ell=1` 실행 예시가 공통 `ellMinimum` 이상이라는 판정이나 그 member의
  공분산 양성·행렬식 비영성을 새로 부여하지 않는다.
- `s²=y`와 `s+s≠0`은 smooth positive square root 존재의 증명이 아니다.
  원래 열린 support, 평탄한 경계, zero extension 조건을 별도로 확인해야 한다.
- ring-valued linear solve 정리를 특정 2×2 실제 covariance source와 그
  vector/matrix representation에 연결하는 형식 인스턴스는 별도이다.
- 실제 full-curl field, global physical PDE residual, flat error, 모든 차수
  Gaussian bound 또는 전체 Navier–Stokes 정리는 이 파일의 결론에 포함하지 않는다.

따라서 이번 새 보조정리의 `kernelChecked`와 전체 패키지의
`fullSameProfileN5`는 같은 판정이 아니다. 감사 기록에 실제 source의
형식 인스턴스화·수렴·양성·전체 잔차에 대한 완료 flag는 `false`로 남긴다.

## 실제 검증 결과

검증 도구는 저장소의 `tools/ns-original-ci/pins.json`과 같은 **Lean
4.34.0-rc2**다. 공식 archive와 `libleanshared.so`의 SHA-256이 기존 pin과
일치했다. 이 실행 환경은 executable 설치 루트를 자동으로 찾을 수 없어,
수정하지 않은 M0의 `lean-embed-check.c`가 `Lean.initSearchPath`를 명시한
뒤 공식 frontend를 호출했다. 커널 및 이미 있던 driver 바이트는 보존했다.

| 실행 | 관측된 exit code | 판정 |
| --- | ---: | --- |
| 양성 소스에서 `.olean` 생성 | 0 | 통과 |
| 별도 파일에서 생성 `.olean`을 새로 import하고 14개 `#print axioms` 실행 | 0 | 통과 |
| `False`의 가짜 증명 | 1 | 예상대로 실패 |
| 혼합 곱의 교차항 하나를 제거한 소스 | 1 | 예상대로 실패 |
| 원통 curl의 `ir*Ct`를 제거한 소스 | 1 | 예상대로 실패 |

양성 소스와 재import 증거에 `sorryAx` 또는 새로운 공리는 없다. 증명별로
기본 Lean 공리 `propext`, `Classical.choice`, `Quot.sound`만 사용하거나,
공리 의존성이 없다. 이것은 공리 의존성이 모두 없다는 주장이 아니다.
음성 실패 로그에는 Lean의 오류 복구가 생성하는 `sorryAx`가 나올 수 있지만,
그 실패한 소스는 exit code 1로 거절되며 양성 `.olean`에 포함되지 않는다.

상세한 source·kernel·driver·출력 hash, 선언별 공리, 실제 명령과 로그는
`evidence/audit.json` 및 같은 폴더의 `.log` 파일에 있다.

## 재현

공식 pinned release를 내려받아 SHA-256을 확인하고 별도 경로에 푼 뒤 실행한다.
다른 원문 저장소를 빌드하거나 수정하지 않는다.

```sh
python3 research-ide/mathscope-m2/navier/lean/reproduce.py \
  --lean-root /absolute/path/to/lean-4.34.0-rc2-linux \
  --archive /absolute/path/to/lean-4.34.0-rc2-linux.tar.zst \
  --work /absolute/path/to/temporary-m2-lean-audit
```

일반 환경에서 stock CLI가 설치 루트를 찾으면 `--normal-frontend`를 추가한다.
`--output`으로 별도 감사 결과 폴더를 지정할 수 있다. 스크립트는 커널 pin,
실제 종료 코드, 재import 후 14개 선언과 공리, 음성 대조를 검사하고 하나라도
맞지 않으면 성공으로 보고하지 않는다.
