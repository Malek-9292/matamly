import { useEffect, useMemo, useState } from "react";

type Area = { id: number; name: string; active: boolean; minimumOrder: number; deliveryFee: number };
type Group = { id: number; name: string; active: boolean; minimumOrder: number; deliveryFee: number; areaIds: number[] };

const emptyArea = { id: 0, name: "", active: true, minimumOrder: "0.000", deliveryFee: "0.000" };
const emptyGroup = { id: 0, name: "", active: true, minimumOrder: "0.000", deliveryFee: "0.000", areaIds: [] as number[] };

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "تعذر حفظ مناطق التوصيل");
  return body;
}

export default function DeliveryAdmin() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [query, setQuery] = useState("");
  const [areaForm, setAreaForm] = useState(emptyArea);
  const [groupForm, setGroupForm] = useState(emptyGroup);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const data = await api("/api/admin/delivery");
    setAreas(data.areas || []);
    setGroups(data.groups || []);
  };
  useEffect(() => { void load().catch((reason) => setError(reason.message)); }, []);

  const visible = useMemo(() => areas.filter((area) => area.name.includes(query.trim())), [areas, query]);
  const groupName = (areaId: number) => groups.find((group) => group.areaIds.includes(areaId))?.name || "قاعدة مستقلة";

  const saveArea = async () => {
    setError(""); setMessage("");
    const payload = { name: areaForm.name, active: areaForm.active, minimumOrder: Number(areaForm.minimumOrder), deliveryFee: Number(areaForm.deliveryFee) };
    try {
      if (areaForm.id) await api(`/api/admin/areas/${areaForm.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/admin/areas", { method: "POST", body: JSON.stringify(payload) });
      setAreaForm(emptyArea); setMessage("تم حفظ المنطقة"); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "تعذر الحفظ"); }
  };
  const saveGroup = async () => {
    setError(""); setMessage("");
    const payload = { name: groupForm.name, active: groupForm.active, minimumOrder: Number(groupForm.minimumOrder), deliveryFee: Number(groupForm.deliveryFee), areaIds: groupForm.areaIds };
    try {
      if (groupForm.id) await api(`/api/admin/groups/${groupForm.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/admin/groups", { method: "POST", body: JSON.stringify(payload) });
      setGroupForm(emptyGroup); setMessage("تم حفظ المجموعة"); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "تعذر الحفظ"); }
  };

  return <section className="delivery-admin">
    {error && <p className="cashier-error">{error}</p>}
    {message && <p className="delivery-note">{message}</p>}
    <div className="panel">
      <span className="eyebrow">منطقة واحدة</span>
      <h2>{areaForm.id ? "تعديل منطقة" : "إضافة منطقة"}</h2>
      <label>الاسم<input value={areaForm.name} onChange={(event) => setAreaForm({ ...areaForm, name: event.target.value })} /></label>
      <div className="two-cols"><label>الحد الأدنى<input value={areaForm.minimumOrder} onChange={(event) => setAreaForm({ ...areaForm, minimumOrder: event.target.value })} /></label><label>رسوم التوصيل<input value={areaForm.deliveryFee} onChange={(event) => setAreaForm({ ...areaForm, deliveryFee: event.target.value })} /></label></div>
      <label className="check-label"><input type="checkbox" checked={areaForm.active} onChange={(event) => setAreaForm({ ...areaForm, active: event.target.checked })} /> المنطقة ظاهرة للعملاء</label>
      <button className="primary-btn" onClick={() => void saveArea()}>حفظ المنطقة</button>
    </div>
    <div className="panel">
      <span className="eyebrow">مجموعة مناطق</span>
      <h2>{groupForm.id ? "تعديل مجموعة" : "مجموعة جديدة"}</h2>
      <p>المنطقة التابعة لمجموعة تستخدم حد المجموعة ورسومها. لا يمكن وضع المنطقة في مجموعتين.</p>
      <label>اسم المجموعة<input value={groupForm.name} onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })} /></label>
      <div className="two-cols"><label>الحد الأدنى<input value={groupForm.minimumOrder} onChange={(event) => setGroupForm({ ...groupForm, minimumOrder: event.target.value })} /></label><label>رسوم التوصيل<input value={groupForm.deliveryFee} onChange={(event) => setGroupForm({ ...groupForm, deliveryFee: event.target.value })} /></label></div>
      <label className="check-label"><input type="checkbox" checked={groupForm.active} onChange={(event) => setGroupForm({ ...groupForm, active: event.target.checked })} /> المجموعة مفعلة</label>
      <div className="area-checks">{areas.map((area) => {
        const owner = groups.find((group) => group.areaIds.includes(area.id) && group.id !== groupForm.id);
        return <label key={area.id} className="check-label"><input type="checkbox" disabled={Boolean(owner)} checked={groupForm.areaIds.includes(area.id)} onChange={(event) => setGroupForm({ ...groupForm, areaIds: event.target.checked ? [...groupForm.areaIds, area.id] : groupForm.areaIds.filter((id) => id !== area.id) })} />{area.name}{owner ? ` — ضمن ${owner.name}` : ""}</label>;
      })}</div>
      <button className="primary-btn" onClick={() => void saveGroup()}>حفظ المجموعة</button>
    </div>
    <div className="panel">
      <label>بحث عن منطقة<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="اسم المنطقة" /></label>
      <div className="delivery-table">{visible.map((area) => <article key={area.id}><div><strong>{area.name}</strong><small>{groupName(area.id)} · {area.active ? "مفعلة" : "متوقفة"} · حد {Number(area.minimumOrder).toFixed(3)} · رسوم {Number(area.deliveryFee).toFixed(3)}</small></div><div><button className="outline-btn" onClick={() => setAreaForm({ id: area.id, name: area.name, active: area.active, minimumOrder: Number(area.minimumOrder).toFixed(3), deliveryFee: Number(area.deliveryFee).toFixed(3) })}>تعديل</button><button className="outline-btn" onClick={() => void api(`/api/admin/areas/${area.id}`, { method: "PUT", body: JSON.stringify({ ...area, active: !area.active }) }).then(load).catch((reason) => setError(reason.message))}>{area.active ? "إيقاف" : "تفعيل"}</button><button className="cashier-cancel-btn" onClick={() => { if (window.confirm("حذف المنطقة؟")) void api(`/api/admin/areas/${area.id}`, { method: "DELETE" }).then(load).catch((reason) => setError(reason.message)); }}>حذف</button></div></article>)}</div>
      <div className="delivery-table">{groups.map((group) => <article key={group.id}><div><strong>{group.name}</strong><small>{group.areaIds.length} مناطق · حد {Number(group.minimumOrder).toFixed(3)} · رسوم {Number(group.deliveryFee).toFixed(3)}</small></div><div><button className="outline-btn" onClick={() => setGroupForm({ id: group.id, name: group.name, active: group.active, minimumOrder: Number(group.minimumOrder).toFixed(3), deliveryFee: Number(group.deliveryFee).toFixed(3), areaIds: group.areaIds })}>تعديل</button><button className="cashier-cancel-btn" onClick={() => { if (window.confirm("حذف المجموعة؟ تبقى المناطق بقواعدها الخاصة.")) void api(`/api/admin/groups/${group.id}`, { method: "DELETE" }).then(() => { setGroupForm(emptyGroup); return load(); }).catch((reason) => setError(reason.message)); }}>حذف</button></div></article>)}</div>
    </div>
  </section>;
}
