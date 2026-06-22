import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, AlertTriangle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0,10);
const addYr = (d) => { const dt = new Date(d); dt.setFullYear(dt.getFullYear()+1); return dt.toISOString().slice(0,10); };

const AMC = () => {
  const [items, setItems] = useState([]);
  const [custs, setCusts] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ customer_id: "", amc_type: "Residential", start_date: today(), end_date: addYr(today()), contract_value: 1200, visits_per_year: 4, visits_used: 0, status: "Active" });

  const load = async () => {
    const [a, c] = await Promise.all([api.get("/amc"), api.get("/customers")]);
    setItems(a.data); setCusts(c.data);
  };
  useEffect(()=>{ load(); }, []);

  const save = async () => { try { await api.post("/amc", f); toast.success("AMC created"); setOpen(false); load(); } catch { toast.error("Error"); } };
  const daysLeft = (end) => Math.ceil((new Date(end) - new Date()) / 86400000);

  return (
    <div className="space-y-5" data-testid="amc-page">
      <div className="flex justify-between items-center">
        <div><h2 className="font-display text-2xl sm:text-3xl">AMC Contracts</h2><p className="text-sm text-muted-foreground">Annual maintenance contracts with renewal tracking.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-700 hover:bg-emerald-800 gap-2" data-testid="new-amc-btn"><Plus className="w-4 h-4"/>New AMC</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New AMC Contract</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Customer</Label>
                <Select value={f.customer_id} onValueChange={v=>setF({...f, customer_id:v})}>
                  <SelectTrigger data-testid="amc-customer"><SelectValue placeholder="Select customer"/></SelectTrigger>
                  <SelectContent>{custs.map(c=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={f.amc_type} onValueChange={v=>setF({...f, amc_type:v, visits_per_year: v==="Residential"?4:12})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="Residential">Residential</SelectItem><SelectItem value="Commercial">Commercial</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Visits/Year</Label><Input type="number" value={f.visits_per_year} onChange={e=>setF({...f, visits_per_year:+e.target.value})}/></div>
                <div><Label>Start</Label><Input type="date" value={f.start_date} onChange={e=>setF({...f, start_date:e.target.value, end_date: addYr(e.target.value)})}/></div>
                <div><Label>End</Label><Input type="date" value={f.end_date} onChange={e=>setF({...f, end_date:e.target.value})}/></div>
                <div className="col-span-2"><Label>Contract Value (AED)</Label><Input type="number" data-testid="amc-value" value={f.contract_value} onChange={e=>setF({...f, contract_value:+e.target.value})}/></div>
              </div>
            </div>
            <Button onClick={save} data-testid="amc-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead>Value</TableHead><TableHead>Visits</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map(a => {
              const dl = daysLeft(a.end_date);
              return (
                <TableRow key={a.id} data-testid={`amc-row-${a.id}`}>
                  <TableCell className="font-mono text-xs">{a.contract_number}</TableCell>
                  <TableCell className="font-medium">{a.customer_name}</TableCell>
                  <TableCell>{a.amc_type}</TableCell>
                  <TableCell className="text-xs">{a.start_date} → {a.end_date}</TableCell>
                  <TableCell>AED {a.contract_value}</TableCell>
                  <TableCell>{a.visits_used}/{a.visits_per_year}</TableCell>
                  <TableCell>
                    {dl <= 30 && dl > 0 ? <Badge className="bg-amber-100 text-amber-800 gap-1"><AlertTriangle className="w-3 h-3"/>{dl}d left</Badge>
                     : dl <= 0 ? <Badge variant="destructive">Expired</Badge>
                     : <Badge className="bg-emerald-100 text-emerald-800">{a.status}</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AMC;
