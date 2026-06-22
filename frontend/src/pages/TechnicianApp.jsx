import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { MapPin, Camera, PenLine, Play, CheckCircle2, Phone, Navigation } from "lucide-react";
import { toast } from "sonner";

const SignaturePad = ({ onChange }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const start = (e) => { drawing.current = true; const r = canvasRef.current.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; const ctx = canvasRef.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(p.clientX - r.left, p.clientY - r.top); };
  const move = (e) => { if (!drawing.current) return; const r = canvasRef.current.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; const ctx = canvasRef.current.getContext("2d"); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#0f172a"; ctx.lineTo(p.clientX - r.left, p.clientY - r.top); ctx.stroke(); };
  const end = () => { drawing.current = false; onChange?.(canvasRef.current.toDataURL("image/png")); };
  const clear = () => { const ctx = canvasRef.current.getContext("2d"); ctx.clearRect(0,0,canvasRef.current.width, canvasRef.current.height); onChange?.(""); };
  return (
    <div>
      <canvas ref={canvasRef} width={500} height={160} className="signature-canvas border rounded-md w-full"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      <Button variant="ghost" size="sm" onClick={clear} type="button" className="mt-1" data-testid="sig-clear">Clear</Button>
    </div>
  );
};

const fileToDataUrl = (file) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });

const TechnicianApp = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [active, setActive] = useState(null);
  const [beforePhotos, setBefore] = useState([]);
  const [afterPhotos, setAfter] = useState([]);
  const [chems, setChems] = useState("");
  const [notes, setNotes] = useState("");
  const [sig, setSig] = useState("");
  const [gpsIn, setGpsIn] = useState(null);
  const [gpsOut, setGpsOut] = useState(null);

  const load = async () => { const { data } = await api.get("/jobs"); setJobs(data); };
  useEffect(()=>{ load(); }, []);

  const today = new Date().toISOString().slice(0,10);
  const todayJobs = jobs.filter(j => j.scheduled_date === today);
  const upcoming = jobs.filter(j => j.scheduled_date > today);
  const done = jobs.filter(j => j.status === "Completed").slice(0, 10);

  const getGps = () => new Promise((res) => {
    if (!navigator.geolocation) return res({ lat: 25.276987, lng: 55.296249, note: "geo unavailable" });
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, ts: new Date().toISOString() }),
      () => res({ lat: 25.276987, lng: 55.296249, note: "default" }),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });

  const startJob = async () => {
    const g = await getGps(); setGpsIn(g);
    await api.post(`/jobs/${active.id}/start`, { gps: g });
    toast.success("Job started · GPS check-in");
    load();
  };

  const handleUpload = async (e, kind) => {
    const files = Array.from(e.target.files || []);
    const urls = await Promise.all(files.map(fileToDataUrl));
    (kind === "before" ? setBefore : setAfter)((prev) => [...prev, ...urls]);
  };

  const completeJob = async () => {
    const g = await getGps(); setGpsOut(g);
    await api.post(`/jobs/${active.id}/complete`, {
      gps: g, before_photos: beforePhotos, after_photos: afterPhotos,
      chemicals_used: chems, tech_notes: notes, customer_signature: sig
    });
    toast.success("Service report generated");
    setActive(null); setBefore([]); setAfter([]); setChems(""); setNotes(""); setSig(""); setGpsIn(null); setGpsOut(null);
    load();
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto" data-testid="technician-app">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl">Hi, {user?.name?.split(" ")[0]}</h2>
        <p className="text-sm text-muted-foreground">You have {todayJobs.length} jobs today</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><div className="text-xs uppercase tracking-widest text-muted-foreground">Today</div><div className="font-display text-2xl">{todayJobs.length}</div></Card>
        <Card className="p-4 text-center"><div className="text-xs uppercase tracking-widest text-muted-foreground">Upcoming</div><div className="font-display text-2xl">{upcoming.length}</div></Card>
        <Card className="p-4 text-center"><div className="text-xs uppercase tracking-widest text-muted-foreground">Done</div><div className="font-display text-2xl">{done.length}</div></Card>
      </div>

      <div>
        <h3 className="font-display text-lg mb-2">Today's Jobs</h3>
        <div className="space-y-2">
          {todayJobs.map(j => (
            <Card key={j.id} className="p-4 cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={()=>setActive(j)} data-testid={`tech-job-${j.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{j.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{j.service_type} · {j.scheduled_time}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/>{j.customer_address}</div>
                </div>
                <Badge>{j.status}</Badge>
              </div>
            </Card>
          ))}
          {todayJobs.length === 0 && <Card className="p-6 text-center text-muted-foreground">No jobs today. Check schedule.</Card>}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(v)=>!v && setActive(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.customer_name}</DialogTitle>
                <div className="text-xs text-muted-foreground">{active.job_number} · {active.service_type}</div>
              </DialogHeader>
              <div className="space-y-3">
                <Card className="p-3 text-sm">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-700"/>{active.customer_address}</div>
                  <a href={`tel:${active.customer_mobile}`} className="flex items-center gap-2 mt-1 text-blue-600"><Phone className="w-4 h-4"/>{active.customer_mobile}</a>
                  <a target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${encodeURIComponent(active.customer_address||"")}`} className="flex items-center gap-2 mt-1 text-blue-600"><Navigation className="w-4 h-4"/>Navigate</a>
                </Card>

                {active.status !== "Completed" && active.status !== "In Progress" && (
                  <Button onClick={startJob} data-testid="start-job-btn" className="w-full bg-emerald-700 hover:bg-emerald-800 gap-2"><Play className="w-4 h-4"/>Start Job (GPS Check-in)</Button>
                )}

                {(active.status === "In Progress" || gpsIn) && (
                  <>
                    <div>
                      <Label className="mb-2 flex items-center gap-2"><Camera className="w-4 h-4"/>Before Photos</Label>
                      <Input type="file" accept="image/*" multiple onChange={(e)=>handleUpload(e, "before")} data-testid="before-photos"/>
                      <div className="flex flex-wrap gap-2 mt-2">{beforePhotos.map((p)=><img key={p.slice(0,32)+p.length} src={p} alt="" className="w-20 h-20 object-cover rounded border"/>)}</div>
                    </div>
                    <div>
                      <Label className="mb-2 flex items-center gap-2"><Camera className="w-4 h-4"/>After Photos</Label>
                      <Input type="file" accept="image/*" multiple onChange={(e)=>handleUpload(e, "after")} data-testid="after-photos"/>
                      <div className="flex flex-wrap gap-2 mt-2">{afterPhotos.map((p)=><img key={p.slice(0,32)+p.length} src={p} alt="" className="w-20 h-20 object-cover rounded border"/>)}</div>
                    </div>
                    <div><Label>Chemicals Used</Label><Input value={chems} onChange={e=>setChems(e.target.value)} placeholder="e.g. Cypermethrin 0.5L" data-testid="chemicals"/></div>
                    <div><Label>Technician Notes</Label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} data-testid="tech-notes"/></div>
                    <div><Label className="mb-2 flex items-center gap-2"><PenLine className="w-4 h-4"/>Customer Signature</Label><SignaturePad onChange={setSig}/></div>
                    <Button onClick={completeJob} className="w-full bg-emerald-700 hover:bg-emerald-800 gap-2" data-testid="complete-job-btn"><CheckCircle2 className="w-4 h-4"/>Complete & Generate Report</Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianApp;
