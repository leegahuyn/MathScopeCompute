# M3 P7 재개 기록 · 2026-10-12

인수 기준은 `6256547a92f099dd63a12e90b471625656b690b0`이다. M2 완료 커밋 `90e977ba9225bfaa20fd3dcc97db7f794c5ed4c9`, `M3_ENTRY.json` 및 M2 gate 바이트를 승계했다. M2 수학 실행을 다시 돌리지 않았다. 기존 `P7_EXECUTED_RELEASE.json`과 `README_KO.md`는 최초 실행판의 기록으로 그대로 보존한다. 현재 판정은 `P7_PROGRESS.json`과 아래 재개 증거를 함께 읽는다.

## 실제로 추가한 계산

| 원 기준 | 새 구현 | 범위와 남은 조건 |
| --- | --- | --- |
| P7-01/02/06 | `p7.elliptic_analytic` | 정확한 11a1·37a1에 대해 L(1), L′(1), Λ(1), Λ′(1)의 ball 및 명시적 무한 급수 tail. 일반 Tate 가법 분기·임의 복소점은 미지원. |
| P7-02 | `p7.taylor_remainder` | ζ·Γ·1/Γ의 극점을 피하는 원판에서 전체 사각형 ball로 Cauchy 상계를 구하고 유한 변위 remainder를 별도 계산한다. FLINT 내부 반올림과 내부 특수함수 절단을 개별 수치로 분리하지는 않는다. |
| P7-04 | `p7.explicit_formula` | half-integer x와 T=20/30에 대해 적분 명시적 공식의 단위 차분, 대칭 영점 합, trivial/nontrivial tail을 계산한다. x=10.5의 독립 소수 측은 log(2520). |
| P7-05 | `p7.operator_audit` | ℓ²의 D e_n=n e_n 참조 연산자에서 유한 spectrum·중복도·특성다항식·trace·det₂·양성·정규화를 검사한다. 실제 변조 9종을 거부한다. 일반 RH 연산자 후보와 bridge는 RESEARCH_OPEN. |

11a1은 중앙 L값의 0 배제로 **해석적 rank 0**, 37a1은 함수방정식의 정확한 vanishing과 1차 도함수의 0 배제로 **해석적 rank 1**을 얻는다. 이는 명시한 모듈러성·Mellin 정리에 의존하는 계산이며 새 Lean 증명이 아니다. 대수적 rank의 descent/Selmer 상계나 BSD leading term을 인증한 것이 아니다.

명시적 공식의 기본 예제는 T=30에서 약 `[1.99455, 14.59422]`의 넓은 구간이다. 실제 폭 약 12.60과 요청 폭 16을 구별한다. 이론적 tail은 관측한 소수 측 residual에 맞추지 않았으며 전역 RH를 가정하지 않는다. 별도 unsmoothed partial sum에는 이 smoothed tail을 붙이지 않는다.

## 실행과 재현

Linux에서 저장소의 `requirements.txt`를 설치한다. FLINT는 python-flint 0.9.0 / FLINT 3.6.0으로 고정한다. P7 CLI의 주소 공간·CPU 자원 제한은 Linux를 요구한다.

```bash
cd research-ide/mathscope-m3
PYTHONPATH=. python -m pytest -q tests p7/tests
python cli.py run examples/zeta-2.json --output zeta-result.json --max-seconds 90 --memory-mib 384
python cli.py replay zeta-result.json --output zeta-replay.json --max-seconds 90 --memory-mib 384
```

후속 실제 실행은 `evidence/resume-20261012/attempt2/manifest.json`에 기록한다. 큰 영점 상세를 담는 원본·replay는 손실 없는 `.json.gz`로 보관하며 CLI가 직접 읽을 수 있다. 압축은 저장 용량만 줄이고 수학적 범위·정확한 숫자·해시 계약을 바꾸지 않는다. 이 디렉터리의 파일 및 GitHub Actions 실행이 영구 기록이다. attempt1은 직렬화 오류 처리 보강 전의 기록으로 보존하고, 현재 소스는 attempt2와 대조한다.

`sourceBinding`은 CLI와 `p7/*.py`의 바이트를 포함한다. 과거 기록을 현재 소스에서 그대로 승인하지 않으며, 같은 소스·환경에서 새 계산한 수학적 해시가 같아야 MATCH다. 다른 버전에서 비교할 때는 원래 입력을 새 실행으로 처리한다. 모든 실행은 `wholeP7Complete=false`, `wholeM3Complete=false`, `formalLeanProofIssued=false`를 유지한다.

## 기존 웹과 서버 연결

공개 화면은 [기존 MathScope의 M3/P7](https://project29770.websitepublisher.ai/v0.3.1.html#research-m3)이다. 페이지 v82에 기존 M2 화면 및 증거를 보존하는 5개 문맥 패치를 적용했다. 소스는 `web/`, 실제 배포·HTTP·브라우저 확인 기록은 `evidence/resume-20261012/production/`에 있다. 새 사이트나 유료 서비스를 만들지 않았다. 브라우저가 native WebMCP를 지원하지 않으면 그 상태를 표시하고 일반 실행 화면을 제공한다.

기존 Compute 서비스의 `/v1/p7/capabilities`, `/v1/p7/run`, `/v1/p7/replay`가 동일한 CLI를 실행한다. 실행 입력은 64 KiB, replay는 32 MiB, 실행은 90초·384 MiB로 제한한다. 스레드 및 프로세스 간 파일 잠금으로 동일 인스턴스의 P7 계산은 한 번에 하나만 허용한다. 브라우저 대기 시간 초과는 서버 작업 종료를 뜻하지 않는다.

웹 테스트에서 입력 변경 후 이전 결과 차단, 소스 변경 감지, 내보내기→실제 파일 선택→재계산, 중복 JSON key 거부, 모바일 폭 및 route 왕복을 구별해서 기록한다. fixture UI 검증과 실제 서버 실행 검증은 서로 다른 evidence 파일이다. 공개 배포 여부는 배포 receipt로 확인하며 코드 존재만으로 공개 완료를 표시하지 않는다.

## 아직 진행하지 않은 범위

P7 전체와 M3 전체는 미완료다. P7-07의 descent/Selmer·height/regulator·period/saturation·Sha/Manin 조건, P7-08의 구체 곡선 rank equality 및 refined leading-term 연결은 남아 있다. 사용자의 2026-10-12 후속 지시에 따라 P7 시각화 배포와 GitHub 저장을 마친 뒤 다음 M3 항목 P8을 진행하고, Y5→Y6→Y7, N6→N7→N8 순서를 이어간다. 이 작업 순서 변경은 P7 미완료 조건의 승인이 아니다. M4 I3/R1 전체 인수 완료도 아직 선언하지 않는다. 원문 80개 관련 기준은 `ORIGINAL_M3_M4_CRITERIA.json`에서 원 PDF 페이지·SHA와 함께 확인한다; 이 수를 전체 224개 완료율로 환산하지 않는다.

## P7 8개 조건의 3D 화면

`web/p7-visual-models.js`는 실제 실행 기록에서만 표시 좌표를 만들고, `p7-visualization.js`는 한 개의 Three.js 장면을 8개 탭에서 재사용한다. `p7-visual-controller.js`가 현재 입력의 서버 결과와 저장 예제를 구분한다. 입력이나 서버 소스가 바뀌면 현재 결과 연결을 해제한다. 화면 좌표는 근사이며 원본 dyadic·유리수·구간은 표와 선택 항목에 보존한다. 극소 구간의 화면상 겹침, 무한원점, 미계산 값, 미해결 연구 조건을 0이나 완료 상태로 바꾸지 않는다.

저장 예제는 attempt2 원본 7개에서 생성한 약 146KB의 표시용 발췌이며, 전체 `.json.gz` 증거는 정확한 GitHub commit 링크로 연결한다. 브라우저 확대·회전·선택은 수학적 원본을 변경하지 않는다. WebGL을 사용할 수 없어도 동일 데이터 표를 읽을 수 있다. `node --test research-ide/mathscope-m3/tests/*.test.mjs`가 데이터 의미와 현재 결과 연결의 회귀를 검사한다.

설계 계약은 `web/visualization-contract.json`, 검증 기록은 `evidence/resume-20261012/visualization-3d/`에 있다. 공개 페이지 v83 (`f052cafd`)에 게시했고 8개 GPU 프레임·새 계산·재현 MATCH·원본 조회를 확인했다. 해당 폴더의 `publication.json`, `public-http-integrity.json`, `publicQA.json`이 배포 증거다. 로컬 실제 390px 검증과 공개 브라우저 실제 520px 검증을 구분하며, 공개 좁은 화면 스크린샷 제한도 기록했다. 이 3D 구현은 수치 커널·CLI·M2 gate의 바이트를 변경하지 않는다. 남은 M3 56개 원문 기준은 `evidence/resume-20261012/m3-remaining-acceptance.json`에 별도로 정리했다.
