(() => {
  'use strict';
  const root=document.getElementById('ms-brho-note');
  if(!root||root.dataset.initialized)return;
  root.dataset.initialized='true';
  const parent=document.getElementById('ms-a21-u1'),dialog=document.getElementById('ms3ip');
  const body=document.getElementById('ms-brho-result'),status=document.getElementById('ms-brho-status');
  const button=document.getElementById('ms-brho-json');let bytes=null,ready=false,request=0;
  const decode=id=>Uint8Array.from(atob(document.getElementById(id).textContent.trim()),c=>c.charCodeAt(0));
  const sha=async raw=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(x=>x.toString(16).padStart(2,'0')).join('');
  function openHash(){
    if(location.hash!=='#m3-brho')return;
    parent.open=true;parent.querySelector('.ms-a21-method').open=true;
    if(!dialog.open)dialog.showModal();
    setTimeout(()=>root.scrollIntoView({block:'center',behavior:'instant'}),80);
  }
  async function verify(){
    const current=++request;ready=false;body.hidden=true;button.disabled=true;
    root.dataset.status='loading';status.textContent='원본 계수 실행과 후속 증명의 연결을 확인하고 있습니다.';
    try{
      const raw=decode('ms-brho-payload'),digest=await sha(raw);
      if(current!==request)return;
      if(digest!==root.dataset.payloadSha)throw Error('후속 실행 파일의 해시가 다릅니다. 증명 결과 표시를 중단했습니다.');
      const data=JSON.parse(new TextDecoder().decode(raw)),r=data.result;
      const parentRaw=decode('ms-a21-payload'),parentSHA=await sha(parentRaw);
      if(current!==request)return;
      if(parentSHA!==data.pressure_file_sha256||parentSHA!==parent.dataset.payloadSha||data.pressure_run_hash_sha256!==parent.dataset.runHash)throw Error('첫 계수 그림과 후속 증명의 실행 연결이 다릅니다.');
      if(data.run_hash_sha256!==root.dataset.runHash||r.schema!=='MathScope.M3.ExplicitIntervalWholeBrhoMajorant/1'||r.I_prime?.join(',')!=='-2,2'||!r.whole_radial_series_Brho_on_I_prime_by_written_proof)throw Error('후속 증명의 명시 구간 또는 범위가 다릅니다.');
      if(r.original_unspecified_appendix_I_bound!==false||r.all_native_call_arguments_bound!==false||r.final_A_D_fields_computed!==false||r.quadrature_Banach_complex_analysis_formalized_in_Lean!==false||r.release!=='HOLD'||r.final_67_jets!==0||r.M3!=='62/64'||r.M4!=='0/16')throw Error('최종 인증과 후속 증명의 경계가 다릅니다.');
      if(r.J2_R1.monomials.length!==12||r.J1_R2.monomials.length!==10||r.J2_R1.computed_total_Q_exponent!==14||r.J1_R2.computed_total_Q_exponent!==18)throw Error('원본 remainder 검사 결과가 다릅니다.');
      bytes=raw;ready=true;body.hidden=false;button.disabled=false;
      root.dataset.status='verified';root.dataset.verifiedRunHash=data.run_hash_sha256;
      status.textContent='두 실행의 파일 해시와 연결 일치 · I′ 위 전체 radial 급수 · 최종장 RELEASE HOLD';
    }catch(error){root.dataset.status='error';status.textContent=error.message||'후속 실행을 확인하지 못했습니다.';}
    openHash();
  }
  button.addEventListener('click',()=>{
    if(!ready)return;
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/json'})),link=document.createElement('a');
    link.href=url;link.download='mathscope-whole-brho-'+root.dataset.runHash.slice(0,12)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  });
  document.getElementById('ms-brho-retry').addEventListener('click',verify);
  window.addEventListener('hashchange',openHash);
  dialog.addEventListener('close',()=>{if(location.hash==='#m3-brho')history.replaceState(null,'',location.pathname+location.search);});
  // The inline note precedes its parent's payload in the published HTML.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',verify,{once:true});
  else verify();
})();
