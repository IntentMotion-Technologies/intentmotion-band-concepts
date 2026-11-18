(()=>{
'use strict';
const cfg=window.INTENTMOTION_CONFIG||{};
const qs=(s,el=document)=>el.querySelector(s);
const all=(s,el=document)=>[...el.querySelectorAll(s)];
const navBtn=qs('[data-mobile-nav]');
if(navBtn){navBtn.addEventListener('click',()=>{const nav=qs('.main-nav');const show=nav.classList.toggle('open');navBtn.setAttribute('aria-expanded',String(show));});}
const form=qs('[data-interest-form]');
if(form){
  const status=qs('[data-form-status]',form);
  const submit=qs('button[type=submit]',form);
  const privacyLink=qs('[data-privacy-link]',form);
  if(privacyLink&&cfg.privacyUrl){privacyLink.href=cfg.privacyUrl;privacyLink.hidden=false;}
  const mode=qs('[data-storage-mode]');
  if(mode){mode.textContent=cfg.formEndpoint?'已连接反馈接口；请核对隐私声明及数据处理合规性。':'本页为本地演示：提交仅保存至当前浏览器，不会发送给团队。正式上线需配置反馈接口。';}
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(form);
    const payload={product:fd.get('product'),price:fd.get('price'),scenario:fd.get('scenario'),email:String(fd.get('email')||'').trim(),consent:fd.get('consent')==='yes',source:'intentmotion-concept-test-v1',timestamp:new Date().toISOString()};
    if(!payload.price){status.textContent='请先选择一项价格意向。';status.classList.add('show');return;}
    if(payload.email&&!payload.consent){status.textContent='如果填写邮箱，请先勾选联系授权；或者清空邮箱仅提交匿名价格意向。';status.classList.add('show');return;}
    submit.disabled=true;
    try{
      if(cfg.formEndpoint){
        if(payload.email&&!cfg.privacyUrl)throw new Error('配置反馈接口后，收集邮箱前还需配置 privacyUrl 隐私说明页面。');
        const r=await fetch(cfg.formEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
        if(!r.ok)throw new Error('服务端未接受提交（'+r.status+'）');
        status.textContent='反馈已发送，感谢参与。本次是需求调研，不构成预售或交付承诺。';
      }else{
        // 仅供本地验证，不会向任何远程服务发送数据
        const prev=JSON.parse(localStorage.getItem('intentmotion_preview_leads_v1')||'[]');
        prev.push(payload);
        localStorage.setItem('intentmotion_preview_leads_v1',JSON.stringify(prev));
        status.textContent='演示反馈已保存在本机浏览器；意动科技不会自动收到。请在正式推广前配置表单接口。';
      }
      status.classList.add('show');
      form.reset();
    }catch(error){status.textContent='提交未完成：'+error.message;status.classList.add('show');}
    finally{submit.disabled=false;}
  });
}
const exportBtn=qs('[data-export-preview]');
if(exportBtn){exportBtn.addEventListener('click',()=>{
  const rows=JSON.parse(localStorage.getItem('intentmotion_preview_leads_v1')||'[]');
  if(!rows.length){alert('当前浏览器还没有测试反馈。打开任意产品页试填一次后即可导出。');return;}
  const cols=['product','price','scenario','email','consent','source','timestamp'];
  const clean=x=>'"'+String(x??'').replace(/"/g,'""').replace(/^[=+@-]/,"'$&")+'"';
  const csv='\uFEFF'+cols.join(',')+'\r\n'+rows.map(r=>cols.map(c=>clean(r[c])).join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.download='IntentMotion_本机演示反馈.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
});}
})();
