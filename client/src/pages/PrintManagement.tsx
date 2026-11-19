import { useCallback, useEffect, useState } from "react";
import { Copy, Printer, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

type PrinterInfo = { id:string; name:string; model:string; connectionType:string; address:string; isDefault:boolean; enabled:boolean };
type Device = { id:string; name:string; platform:string; status:string; lastSeenAt:string|null; appVersion:string; printers:PrinterInfo[] };
type PrintJob = { id:number; orderNumber:number; kind:string; status:string; attempts:number; lastError:string; lastStage:string; createdAt:string; deviceName:string|null; printerName:string|null };

const field: React.CSSProperties = { width:"100%", padding:"10px 12px", border:"1px solid #d7ddd8", borderRadius:10, background:"#fff", color:"#17231c" };
const button: React.CSSProperties = { border:0, borderRadius:10, padding:"10px 14px", background:"#183d30", color:"#fff", fontWeight:700, cursor:"pointer" };
const panel: React.CSSProperties = { background:"#fff", border:"1px solid #e1e7e2", borderRadius:16, padding:18, marginBottom:16 };

export default function PrintManagement() {
  const [devices,setDevices]=useState<Device[]>([]);
  const [jobs,setJobs]=useState<PrintJob[]>([]);
  const [name,setName]=useState("");
  const [platform,setPlatform]=useState("android");
  const [newToken,setNewToken]=useState("");
  const [pairedId,setPairedId]=useState("");
  const [printerName,setPrinterName]=useState("Epson TM-T20II");
  const [model,setModel]=useState("Epson TM-T20II");
  const [connectionType,setConnectionType]=useState("usb");
  const [printerAddress,setPrinterAddress]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    try {
      const r=await fetch("/api/admin/print/devices",{cache:"no-store"});
      const d=await r.json();
      if(!r.ok) throw new Error(d.message||"تعذر تحميل أجهزة الطباعة");
      setDevices(Array.isArray(d.devices)?d.devices:[]);
      const jr=await fetch("/api/admin/print/jobs?limit=50",{cache:"no-store"});
      const jd=await jr.json();
      if(jr.ok)setJobs(Array.isArray(jd.jobs)?jd.jobs:[]);
    } catch(e) { setError(e instanceof Error?e.message:"تعذر تحميل البيانات"); }
  },[]);
  useEffect(()=>{void load();},[load]);

  const pair=async()=>{
    setBusy(true);setError("");setMessage("");setNewToken("");
    try{
      const r=await fetch("/api/admin/print/devices/pair",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,platform})});
      const d=await r.json();if(!r.ok)throw new Error(d.message||"تعذر تسجيل الجهاز");
      setPairedId(d.id);setNewToken(d.token);setName("");setMessage("تم إنشاء بيانات الجهاز. انسخ رمز الربط الآن؛ لن يظهر مرة أخرى.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"تعذر تسجيل الجهاز");}
    finally{setBusy(false);}
  };
  const addPrinter=async()=>{
    if(!pairedId)return;
    setBusy(true);setError("");setMessage("");
    try{
      const r=await fetch("/api/admin/print/printers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:pairedId,name:printerName,model,connectionType,address:printerAddress,isDefault:true})});
      const d=await r.json();if(!r.ok)throw new Error(d.message||"تعذرت إضافة الطابعة");
      setMessage("تمت إضافة الطابعة كافتراضية للجهاز.");await load();
    }catch(e){setError(e instanceof Error?e.message:"تعذرت إضافة الطابعة");}
    finally{setBusy(false);}
  };
  const updatePrinter=async(deviceId:string, printer:PrinterInfo, patch:Partial<PrinterInfo>)=>{
    const next={...printer,...patch};
    try{
      const r=await fetch(`/api/admin/print/printers/${printer.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:next.name,model:next.model,connectionType:next.connectionType,address:next.address||"",enabled:next.enabled,isDefault:next.isDefault})});
      if(!r.ok)throw new Error("تعذر تحديث إعدادات الطابعة");
      setMessage("تم تحديث إعدادات الطابعة.");await load();
    }catch(e){setError(e instanceof Error?e.message:"تعذر تحديث الطابعة");}
  };
  const revoke=async(id:string)=>{
    if(!window.confirm("هل تريد إلغاء تسجيل هذا الجهاز؟ سيتوقف عن استقبال مهام الطباعة."))return;
    try{
      const r=await fetch(`/api/admin/print/devices/${id}/revoke`,{method:"POST"});
      if(!r.ok)throw new Error("تعذر إلغاء الجهاز");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"تعذر إلغاء الجهاز");}
  };

  return <div style={{maxWidth:1100,margin:"0 auto",padding:"8px 0 30px",color:"#17231c"}}>
    <div style={{...panel,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div><div style={{fontSize:13,color:"#62746a"}}>Matamly Universal Print</div><h2 style={{margin:"4px 0"}}>إدارة أجهزة الطباعة</h2><p style={{margin:0,color:"#62746a"}}>سجّل تطبيق Matamly على جهاز الكاشير، وحدد USB أو LAN/Wi-Fi أو Bluetooth. للشبكة أدخل IP:9100، ولـ Bluetooth أدخل عنوان MAC.</p></div>
      <button style={button} onClick={()=>void load()}><RefreshCw size={16} style={{verticalAlign:"middle",marginInlineEnd:6}}/>تحديث</button>
    </div>
    {message&&<div role="status" style={{...panel,borderColor:"#b7d7c2",background:"#f4fbf6"}}>{message}</div>}
    {error&&<div role="alert" style={{...panel,borderColor:"#e6b8b8",color:"#a32929"}}>{error}</div>}
    {newToken&&<div style={{...panel,border:"1px solid #d7b86a",background:"#fffaf0"}}>
      <strong>رمز الجهاز — يظهر مرة واحدة فقط</strong>
      <p style={{fontSize:13}}>أدخله داخل تطبيق Matamly Print على الجهاز. لا تشاركه ولا ترسله في محادثة عامة.</p>
      <code style={{display:"block",overflowWrap:"anywhere",padding:12,background:"#fff",borderRadius:8}}>{newToken}</code>
      <button style={{...button,marginTop:10}} onClick={()=>void navigator.clipboard.writeText(newToken)}><Copy size={15} style={{verticalAlign:"middle",marginInlineEnd:6}}/>نسخ الرمز</button>
    </div>}
    <div style={panel}>
      <h3 style={{marginTop:0}}>تسجيل جهاز كاشير</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
        <label>اسم الجهاز<input style={field} value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: كاشير المطعم"/></label>
        <label>نظام التشغيل<select style={field} value={platform} onChange={e=>setPlatform(e.target.value)}><option value="android">Android</option><option value="windows">Windows</option><option value="macos">macOS</option><option value="linux">Linux</option></select></label>
      </div>
      <button style={{...button,marginTop:12}} disabled={busy||name.trim().length<2} onClick={()=>void pair()}><ShieldCheck size={16} style={{verticalAlign:"middle",marginInlineEnd:6}}/>إنشاء جهاز ورمز ربط</button>
    </div>
    {pairedId&&<div style={panel}>
      <h3 style={{marginTop:0}}>إضافة الطابعة للجهاز الجديد</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
        <label>اسم الطابعة<input style={field} value={printerName} onChange={e=>setPrinterName(e.target.value)}/></label>
        <label>الموديل<input style={field} value={model} onChange={e=>setModel(e.target.value)}/></label>
        <label>طريقة الاتصال<select style={field} value={connectionType} onChange={e=>setConnectionType(e.target.value)}><option value="usb">USB</option><option value="network">LAN / Wi-Fi</option><option value="bluetooth">Bluetooth</option><option value="system">طابعة النظام</option></select></label>{connectionType!=="usb"&&<label>عنوان الطابعة<input style={field} value={printerAddress} onChange={e=>setPrinterAddress(e.target.value)} placeholder={connectionType==="network"?"192.168.1.50:9100":"00:11:22:33:44:55"}/></label>}
      </div>
      <button style={{...button,marginTop:12}} disabled={busy||printerName.trim().length<2} onClick={()=>void addPrinter()}><Printer size={16} style={{verticalAlign:"middle",marginInlineEnd:6}}/>حفظ الطابعة كافتراضية</button>
    </div>}
    <h3>الأجهزة المسجلة ({devices.length})</h3>
    <h3 style={{marginTop:24}}>سجل الطباعة الأخير ({jobs.length})</h3>
    <div style={panel}>
      {jobs.length===0?<div>لا توجد مهام طباعة حتى الآن.</div>:<div style={{display:"grid",gap:8}}>{jobs.map(job=><div key={job.id} style={{padding:12,borderRadius:10,background:"#f5f8f5",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,fontSize:13}}>
        <strong>طلب #{job.orderNumber}</strong><span>المهمة: {job.id} · {job.kind==="auto"?"تلقائية":"يدوية"}</span><span>الحالة: {job.status} · المرحلة: {job.lastStage}</span><span>المحاولات: {job.attempts}</span><span>الجهاز: {job.deviceName||"غير معين"}</span><span>الطابعة: {job.printerName||"غير معينة"}</span>{job.lastError&&<span style={{color:"#a32929"}}>الخطأ: {job.lastError}</span>}
      </div>)}</div>}
    </div>
    {devices.length===0?<div style={panel}>لا توجد أجهزة مسجلة حتى الآن.</div>:devices.map(device=><div key={device.id} style={panel}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div><strong>{device.name}</strong><div style={{fontSize:13,color:"#62746a",marginTop:5}}>{device.platform} · {device.status} · {device.appVersion||"لم يرسل إصدار التطبيق بعد"}</div><div style={{fontSize:12,color:"#839087",marginTop:4}}>آخر اتصال: {device.lastSeenAt?new Date(device.lastSeenAt).toLocaleString("ar-KW"):"لم يتصل بعد"}</div></div>
        <button style={{...button,background:"#fff",color:"#a32929",border:"1px solid #e3c6c6"}} onClick={()=>void revoke(device.id)}><Trash2 size={15} style={{verticalAlign:"middle",marginInlineEnd:6}}/>إلغاء التسجيل</button>
      </div>
      <div style={{marginTop:12,display:"grid",gap:8}}>{device.printers.length?device.printers.map(p=><div key={p.id} style={{padding:12,borderRadius:10,background:"#f5f8f5",display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><span><Printer size={15} style={{verticalAlign:"middle",marginInlineEnd:6}}/><strong>{p.name}</strong> · {p.model} · {p.connectionType}</span><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><small>{p.isDefault?"الافتراضية":"إضافية"} · {p.enabled?"مفعلة":"معطلة"}</small><button style={{...button,padding:"6px 9px",fontSize:12}} onClick={()=>void updatePrinter(device.id,p,{isDefault:true,enabled:true})}>تعيين افتراضية</button><button style={{...button,padding:"6px 9px",fontSize:12,background:"#fff",color:"#183d30",border:"1px solid #d7ddd8"}} onClick={()=>void updatePrinter(device.id,p,{enabled:!p.enabled})}>{p.enabled?"تعطيل":"تفعيل"}</button></div></div>):<small style={{color:"#8b5a21"}}>لم تتم إضافة طابعة لهذا الجهاز بعد.</small>}</div>
    </div>)}
  </div>;
}
