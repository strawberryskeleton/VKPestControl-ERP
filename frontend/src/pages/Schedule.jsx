import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const fmt = (d) => d.toISOString().slice(0,10);
const STATUS_COLOR = {
  Scheduled:"bg-slate-200 text-slate-700", Assigned:"bg-blue-100 text-blue-700", "On The Way":"bg-amber-100 text-amber-800",
  "In Progress":"bg-purple-100 text-purple-700", Completed:"bg-emerald-100 text-emerald-800", Cancelled:"bg-rose-100 text-rose-700"
};

const Schedule = () => {
  const [jobs, setJobs] = useState([]);
  const [techs, setTechs] = useState([]);
  const [week, setWeek] = useState(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; });

  const days = [...Array(7)].map((_, i) => { const d = new Date(week); d.setDate(week.getDate()+i); return d; });

  const load = useCallback(async () => {
    const from = fmt(days[0]); const to = fmt(days[6]);
    const [j, t] = await Promise.all([api.get("/jobs", { params: { date_from: from, date_to: to } }), api.get("/users/technicians")]);
    setJobs(j.data); setTechs(t.data);
  }, [days]);
  useEffect(()=>{ load(); }, [load]);

  const reassign = async (jobId, techId) => { await api.put(`/jobs/${jobId}`, { technician_id: techId }); load(); };
  const moveDate = async (jobId, date) => { await api.put(`/jobs/${jobId}`, { scheduled_date: date }); load(); };

  const onDragStart = (e, jobId) => e.dataTransfer.setData("text/plain", jobId);
  const onDrop = (e, day) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) moveDate(id, fmt(day)); };

  return (
    <div className="space-y-5" data-testid="schedule-page">
      <div className="flex justify-between items-center">
        <div><h2 className="font-display text-2xl sm:text-3xl">Schedule</h2><p className="text-sm text-muted-foreground">Drag jobs between days to reschedule.</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={()=>{ const d = new Date(week); d.setDate(d.getDate()-7); setWeek(d); }} data-testid="prev-week"><ChevronLeft className="w-4 h-4"/></Button>
          <div className="font-display text-sm px-3">{fmt(days[0])} → {fmt(days[6])}</div>
          <Button variant="outline" size="icon" onClick={()=>{ const d = new Date(week); d.setDate(d.getDate()+7); setWeek(d); }} data-testid="next-week"><ChevronRight className="w-4 h-4"/></Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map((d) => {
          const ds = fmt(d);
          const dayJobs = jobs.filter(j => j.scheduled_date === ds);
          return (
            <Card key={ds} className="p-3 min-h-[360px]" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>onDrop(e, d)} data-testid={`day-${ds}`}>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div className="font-display text-lg">{d.getDate()}</div>
              <div className="space-y-2 mt-3">
                {dayJobs.map(j => (
                  <div key={j.id} draggable onDragStart={(e)=>onDragStart(e, j.id)} className={`p-2 rounded text-xs border cursor-grab ${STATUS_COLOR[j.status]||""}`}>
                    <div className="font-medium truncate">{j.customer_name}</div>
                    <div className="text-[10px] opacity-80 truncate">{j.scheduled_time} · {j.service_type}</div>
                    <Select value={j.technician_id || ""} onValueChange={(v)=>reassign(j.id, v)}>
                      <SelectTrigger className="h-6 text-[10px] mt-1 bg-white/60"><SelectValue placeholder="Assign"/></SelectTrigger>
                      <SelectContent>{techs.map(t=> <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
                {dayJobs.length===0 && <div className="text-xs text-muted-foreground italic">No jobs</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Schedule;
