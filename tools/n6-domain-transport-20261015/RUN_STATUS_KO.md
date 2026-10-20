# 실행 완료 및 추가 공통 collar 귀결

## 실제 완료한 실행

2026-10-15, 코드 commit `9221d795fa6879ff3c22bc9e85458cb6c094a996`의 전용 GitHub Actions run `38675309598` / job `116227436937`이 SUCCESS로 종료했다. 전체 원본 재인증, 4,050행 포함 검사, 188행 native 바인딩 검사, 44개 unittest 및 결과 업로드가 모두 성공했다. 31개 음성 테스트 메서드가 포함된다. 별도의 모든 저장소 CI까지 통과했다고 주장하지 않는다.

- GitHub Actions: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38675309598
- artifact: `11945960748`, `n6-domain-verification-38675309598`
- artifact SHA-256: `2572086f5acb220c4d37eda57ec1efc6c9d220f5f2efef29414e2b759e59c049`
- 만료: `2027-01-13T03:15:24Z`

클라우드에서 내려받은 RESULT.json, COVER_ROWS.json, NATIVE_BLOCK_ROWS.json, SOURCE_WITNESSES.json의 네 파일은 로컬에서 생성한 파일과 바이트 단위로 동일했다. 검증기와 테스트의 Git blob 해시도 로컬 파일과 일치했다. 동일 코드의 실행 재현성 확인이지 독립 Lean 증명은 아니다.

정확한 결과/코드 해시는 STATUS.json에 영구 보존한다. SUMMARY.json의 NOT_YET_OBSERVED는 코드 커밋 시점 관측을 보존한 것이며 완료 후 관측은 STATUS.json이 대체한다.

## 추가로 따라오는 하나의 고정된 열린 입력 주변 영역

README의 증명에서 기준 root s는 `[1/2,2]`, 활성 후보 root s'=cs는 `(1/2,2)` 안에 있다. 따라서 모든 활성 후보에서

```
1/4 < c=s'/s < 4.
```

`0<D=1/2-h<1/2`이므로 `c^D<2`, `sqrt(c)<2`도 성립한다. N과 ell을 고정한 원래 fixed-label calculus에서 `(Z,T)->(c^D Z,cT)`의 최대좌표 노름 기준 연산자 노름은 4보다 작다.

기존 slow inverse가 원래 D_h의 최대좌표 거리 `1/256` 이내에서 공통 열린 collar를 갖는다는 원본 정리를 적용하면, 모든 활성 입력점 주변에서 **동일한 반경 1/1024**의 기준 slow-input 근방을 쓸 수 있다. 실제로 입력 변동의 최대좌표 노름이 1/1024보다 작으면 변환된 입력 변동은 1/256보다 작다. 항등 입력족에도 이 작은 공통 반경은 유효하다.

이 결론은 ell을 고정해 미분한다는 원래 계약의 귀결이다. floor/ceiling을 미분하거나, label이 바뀌는 전역 경계의 smooth gluing을 완료했다고 해석해서는 안 된다. 따라서 위 결과가 새로 full-call-graph 또는 W/M/S/PDE 인증을 부여하지 않는다.

## 공식 장부

정의역 전파: 원본 indexed 4,050행 중 이 행 층의 미해결 0.
Native 부모 바인딩: 과거 미확인 188행 중 불일치 0.

이는 N6의 서로 다른 의무 단위와 섞지 않는다. 공식 잔여는 Jet 230 / Guard 38 / PDE 1,020 / 합계 1,288, N6-01 OPEN, N6-02 PARTIAL, M3 56/64이다. 이제 이 행별 증거를 상위·중첩 호출 경로 및 원래 8개 Guard acceptance 소비기에 연결해야 한다. 원본 generator/progress/UI 및 다른 Picard branch는 바꾸지 않았다.
