# 원래 heat 수치 구간의 runtime 0.3.10 연결

## 확보한 결과

`ns.actual-heat-scaled-enclosure`를 M2 예제 **N5 · 원래 heat와 1차·2차 도함수의 엄밀한 수치 구간**으로 연결했다. 원래 양의 h, 지정된 source witness와 heat 적분은 고정한다. 사용자가 바꿀 수 있는 입력은 지원되는 source profile, 정밀도, 정확한 유리수 허용오차, 유한 전개 항의 예산이다. 양의 h를 부동소수점 0으로 바꾸거나 사용자가 보낸 graph·완료 flag를 source 인증으로 채택하지 않는다.

이번 실행은 source 17.757초, 생성된 application Worker 17.010초에 각각 exit 0으로 끝났다. 두 경로의 mathematical hash, certificate hash, original graph hash가 같으며, 최초 독립 source 실행의 certificate와도 같다. 실행 시간은 해당 Node 환경의 관측값이다. 브라우저의 속도 보장으로 해석하지 않는다.

| 검증 대상 | 결과 |
|---|---|
| 새 화면·입력 검사, 기존 cutoff/domain 화면, engine/Worker 회귀 | 20/20 PASS, exit 0 |
| 실제 원래 heat source 실행 | exit 0 |
| 실제 원래 heat generated Worker 실행 | exit 0 |
| source/Worker 및 최초 source certificate 대조 | 동일 |
| 각 실행의 새 패널 | 4개 |
| 각 실행의 원본 경로 값 셀 | 106개 일치 |
| 원본 값이 아닌 표시 항목명 | 11개 |

`allValueCellsSourceBound=true`, `allCellsSourceBound=false`를 함께 기록한다. 117개 전체 셀을 모두 독립 수학 데이터라고 세지 않는다.

## 표시하는 양과 오차

네 패널은 정규화 계수의 유리수 구간, 원래 양의 인자와 부호, 유한 Taylor 잔여항과 산술 오차, 완료 범위를 표시한다. heat 자체는 `H=1−h*z*D0`로 복원하고, 아홉 slow 도함수는 각 행의 원래 인자와 계수 구간을 곱한다. 정밀도 192 bits에서 가장 넓은 계수 구간은 `35/2^192`이다. 이를 전체 pulse·공분산·물리 curl의 절대 오차라고 해석하지 않는다.

구간 끝점은 정확한 유리수 문자열이다. 실제 성분을 담지 않은 식 ID를 3차원 수치 좌표로 변환하지 않는다. stale editor·결과 오류·원본 결속 또는 필요한 구간의 누락은 새 패널 표시를 차단한다. 정밀도/허용오차 계약, null 입력, 부동소수점 허용오차, 과도한 예산 등은 기존 runtime 경계에서 검증한다.

## 공개 검증의 구분

이 구현 저장점에서 공개 페이지는 v76, runtime 0.3.9이다. 준비한 v76→새 버전 patch는 68개이며 기존 페이지의 M1 Worker와 나머지 내용은 보존한다. 새 runtime을 게시했다고 이 문서만으로 주장하지 않는다. 게시 후 제공자의 version/hash, 실제 HTTP 응답 바이트, 브라우저 Worker 실행과 각 패널의 DOM 셀을 별도 receipt에 기록한다.

전체 leading F, 실제 Volterra pulse, 공분산 H와 inverse/sqrt weight, 모든 label의 curl에 대한 수치 구간은 이 예제로 완료되지 않는다. 새 Lean kernel 실행을 기록하지 않으며 `wholeGNUMComplete=false`, `userRequestedM2Complete=false`, `m3MayStart=false`를 유지한다.

## 재현

```sh
python research-ide/mathscope-m2/build_m2.py
node --test research-ide/mathscope-m2/tests/actual-heat-views.test.mjs research-ide/mathscope-m2/tests/actual-continuation-views.test.mjs research-ide/mathscope-m2/core/tests/engine-worker.test.mjs
node --max-old-space-size=2048 research-ide/mathscope-m2/tests/heat-runtime-case.mjs source new-attempt
node --max-old-space-size=2048 research-ide/mathscope-m2/tests/heat-runtime-case.mjs worker new-attempt
```

source와 Worker는 한 번에 하나씩 실행한다. runner는 기존 stem의 receipt를 덮어쓰지 않는다. `seal-heat-runtime.py`는 이 저장점의 `attempt1` 관측과 코드 바이트를 대조하는 감사 생성기이며 source 계산이나 해석학 증명을 재실행하지 않는다.

## 후속 공개 v77 검증

구현 커밋 [2304e3b6](https://github.com/leegahuyn/MathScopeCompute/commit/2304e3b688045eb41200100220a20d8d90cb3e8f)을 먼저 저장한 뒤 동일한 runtime을 공개 v77로 게시했다. 제공자의 version hash는 `7d4d3fb4`이다. 실제 HTTP 200 응답 8,823,478 bytes의 SHA-256은 `0ccf41c63330a1add5fa685b00ff8f7b2efe63a0cdd1b2cec3af7b2f23f75635`이며 준비한 페이지와 바이트 단위로 일치한다.

공개 브라우저에서 새 예제를 실제 실행한 job은 `m2-job:mv3j2v8y:1`이다. 실행 상태는 COMPLETED이며 source·Node Worker·browser Worker의 mathematical hash와 certificate hash가 모두 같다. 세 환경의 수학 결과 일치를 확인했지만 브라우저와 Node의 runtime identity 및 Math probe는 다르다. 환경 hash를 서로 같은 것으로 기록하거나 이 결과를 임의의 다른 환경까지 보장하지 않는다.

네 패널을 각각 선택하여 DOM의 117개 표시 셀을 확인했다. 그중 106개 원본 경로 값을 실제 browser job의 필드와 대조했고, 11개는 표시 항목명이다. 네 표 모두 관측한 586px 컨테이너에서 가로 overflow 없이 정확한 모든 자릿수를 줄바꿈한다. 데스크톱 화면만 확인했으며 모바일 브라우저 검증을 기록하지 않는다.

[실행 화면](m2-v77-heat-desktop-20261011-0757.jpg)과 [정확한 구간 표](m2-v77-heat-table-20261011-0758.jpg)는 실제 JPEG 바이트를 저장했다. screenshot digest는 Uint8Array의 JSON 표현이 아닌 원본 파일의 SHA-256이다.

새 페이지 관측 구간의 console error/warn 8개 중 5개는 브라우저 확장 metadata 전달 오류, 3개는 기존 THREE의 WebGL 비활성 오류다. 새 M2 Worker·heat 패널 오류는 관측되지 않았다. 기존 WebGL 실패를 숨기지 않고 `strictConsoleClean=false`로 남겼으며 heat 수치표는 정상 사용된다. 과거 페이지 로그 25개는 새 페이지 오류 개수에 합산하지 않았다.

기존 NS capability 설명 문자열에 남은 전역 (7.30)·전체 양성 등의 요약은 이번 heat 수치 실행이 검증한 내용이 아니다. 실제 완료 판단에는 각 결과의 scope, 이 문서와 M2 완료 관문의 명시된 의무를 사용한다. 해당 기존 설명을 정리하는 후속 변경은 별도 runtime 검증으로 기록해야 한다.

전체 판정은 계속 `userRequestedM2Complete=false`, `m3MayStart=false`다. 게시 성공·수학 hash 일치·DOM 대조가 아직 열린 전역 수학 의무를 대신하지 않는다. 재검토 명령은 `node research-ide/mathscope-m2/tests/verify-heat-browser.mjs`이며 저장한 브라우저 관측만 대조한다.
