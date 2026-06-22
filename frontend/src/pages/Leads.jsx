import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const STAGES = ["New", "Contacted", "Site Inspection", "Quotation Sent", "Follow Up", "Negotiation", "Won", "Lost"];
const SOURCES = ["Google", "Website", "Referral", "Facebook", "Instagram", "WhatsApp", "Existing Customer"];
const empty = { name: "", mobile: "", email: "", area: "", source: "Google", service_required: "", estimated_value: 0, stage: "New" };

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => { const { data } = await api.get("/leads"); setLeads(data); };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try { await api.post("/leads", { ...form, estimated_value: parseFloat(form.estimated_value) || 0 }); toast.success("Lead added"); setOpen(false); setForm(empty); load(); }
    catch { toast.error("Failed"); }
  };

  const move = async (id, newStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l));
    await api.patch(`/leads/${id}/stage`, { stage: newStage });
  };

  const onDragStart = (e, id) => { e.dataTransfer.setData("text/plain", id); };
  const onDrop = (e, stage) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) move(id, stage); };

  return (
    <div className="space-y-5" data-testid="leads-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl">Lead Pipeline</h2>
          <p className="text-sm text-muted-foreground">Drag & drop leads through the funnel.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-lead-btn" className="bg-emerald-700 hover:bg-emerald-800 gap-2"><Plus className="w-4 h-4" /> New Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Lead</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {[["Name","name"],["Mobile","mobile"],["Email","email"],["Area","area"],["Service","service_required"],["Est. Value (AED)","estimated_value"]].map(([l,k]) => (
                <div key={k}><Label>{l}</Label><Input data-testid={`lead-${k}`} value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} /></div>
              ))}
              <div><Label>Source</Label>
                <Select value={form.source} onValueChange={(v)=>setForm({...form, source:v})}>
                  <SelectTrigger data-testid="lead-source"><SelectValue/></SelectTrigger>
                  <SelectContent>{SOURCES.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Stage</Label>
                <Select value={form.stage} onValueChange={(v)=>setForm({...form, stage:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{STAGES.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={create} data-testid="lead-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <div key={stage} className="kanban-col" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>onDrop(e, stage)} data-testid={`col-${stage}`}>
            <div className="flex items-center justify-between px-2 py-2">
              <h3 className="font-display text-sm">{stage}</h3>
              <span className="text-xs text-muted-foreground">{leads.filter(l=>l.stage===stage).length}</span>
            </div>
            <div className="space-y-2 min-h-[200px] bg-muted/40 p-2 rounded-md">
              {leads.filter(l=>l.stage===stage).map(l => (
                <Card key={l.id} draggable onDragStart={(e)=>onDragStart(e, l.id)} className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all" data-testid={`lead-${l.id}`}>
                  <div className="font-medium text-sm">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.mobile}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">{l.source}</span>
                    <span className="text-xs font-medium">AED {l.estimated_value}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leads;
