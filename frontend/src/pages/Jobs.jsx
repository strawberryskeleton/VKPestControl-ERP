import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

const SERVICES = ["General Pest Control", "Cockroach Treatment", "Termite Treatment", "Bed Bug Treatment", "Rodent Control", "Mosquito Fogging"];
const STATUSES = ["Scheduled", "Assigned", "On The Way", "In Progress", "Completed", "Cancelled"];
const STATUS_COLOR = {
  Scheduled:"bg-slate-100 text-slate-700", Assigned:"bg-blue-100 text-blue-700", "On The Way":"bg-amber-100 text-amber-700",
  "In Progress":"bg-purple-100 text-purple-700", Completed:"bg-emerald-100 text-emerald-800", Cancelled:"bg-rose-100 text-rose-700"
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [custs, setCusts] = useState([]);
  const [techs, setTechs] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ customer_id: "", service_type: "General Pest Control", technician_id: "", scheduled_date: new Date().toISOString().slice(0,10), scheduled_time: "09:00", notes: "" });

  const load = async () => {
    const [j, c, t] = await Promise.all([api.get("/jobs"), api.get("/customers"), api.get("/users/technicians")]);
    setJobs(j.data); setCusts(c.data); setTechs(t.data);
  };
  useEffect(()=>{ load(); }, []);

  const save = async () => { try { await api.post("/jobs", f); toast.success("Job created"); setOpen(false); load(); } catch { toast.error("Error"); } };
  const setStatus = async (id, status) => { await api.put(`/jobs/${id}`, { status }); load(); };

  return (
    <div className="space-y-5" data-testid="jobs-page">
      <div className="flex justify-between items-center">
        <div><h2 className="font-display text-2xl sm:text-3xl">Jobs</h2><p className="text-sm text-muted-foreground">Work orders across all customers.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-700 hover:bg-emerald-800 gap-2" data-testid="new-job-btn"><Plus className="w-4 h-4"/>New Job</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Job</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Customer</Label>
                <Select value={f.customer_id} onValueChange={v=>setF({...f, customer_id:v})}>
                  <SelectTrigger data-testid="job-customer"><SelectValue placeholder="Select customer"/></SelectTrigger>
                  <SelectContent>{custs.map(c=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Service</Label>
                <Select value={f.service_type} onValueChange={v=>setF({...f, service_type:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{SERVICES.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Technician</Label>
                <Select value={f.technician_id} onValueChange={v=>setF({...f, technician_id:v})}>
                  <SelectTrigger data-testid="job-tech"><SelectValue placeholder="Assign technician"/></SelectTrigger>
                  <SelectContent>{techs.map(t=> <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={f.scheduled_date} onChange={e=>setF({...f, scheduled_date:e.target.value})}/></div>
                <div><Label>Time</Label><Input type="time" value={f.scheduled_time} onChange={e=>setF({...f, scheduled_time:e.target.value})}/></div>
              </div>
              <div><Label>Notes</Label><Textarea value={f.notes} onChange={e=>setF({...f, notes:e.target.value})}/></div>
            </div>
            <Button onClick={save} data-testid="job-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Technician</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {jobs.map(j => (
              <TableRow key={j.id} data-testid={`job-row-${j.id}`}>
                <TableCell className="font-mono text-xs">{j.job_number}</TableCell>
                <TableCell className="font-medium">{j.customer_name}</TableCell>
                <TableCell>{j.service_type}</TableCell>
                <TableCell>{j.technician_name || "—"}</TableCell>
                <TableCell className="text-xs">{j.scheduled_date} {j.scheduled_time}</TableCell>
                <TableCell>
                  <Select value={j.status} onValueChange={(v)=>setStatus(j.id, v)}>
                    <SelectTrigger className={`w-36 h-8 text-xs ${STATUS_COLOR[j.status]||""}`}><SelectValue/></SelectTrigger>
                    <SelectContent>{STATUSES.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Jobs;
