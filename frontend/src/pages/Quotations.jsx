import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Download } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { esc, openPrintWindow, printCss } from "../lib/pdf";

const empty = { customer_name: "", service_type: "General Pest Control", description: "", frequency: "Monthly", amount: 0, vat: 0, total: 0, status: "Draft" };

const Quotations = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => { const { data } = await api.get("/quotations"); setItems(data); };
  useEffect(()=>{ load(); }, []);

  const recalc = (amt) => {
    const a = parseFloat(amt) || 0; const vat = +(a * 0.05).toFixed(2); return { amount: a, vat, total: +(a + vat).toFixed(2) };
  };

  const save = async () => {
    try { await api.post("/quotations", { ...form, ...recalc(form.amount) }); toast.success("Quote saved"); setOpen(false); setForm(empty); load(); } catch { toast.error("Error"); }
  };

  const printPdf = (q) => {
    const html = `<!doctype html><html><head><title>${esc(q.quote_number)}</title><style>${printCss}</style></head><body>
      <div class="header"><div><h1>QUOTATION</h1><div>${esc(q.quote_number)}</div></div>
        <div style="text-align:right"><strong>PestERP UAE</strong><br/>Dubai, UAE<br/>TRN: 100123456700003</div></div>
      <div><strong>To:</strong> ${esc(q.customer_name)}</div>
      <table><thead><tr><th>Service</th><th>Description</th><th>Frequency</th><th class="right">Amount (AED)</th></tr></thead>
      <tbody><tr><td>${esc(q.service_type)}</td><td>${esc(q.description||"")}</td><td>${esc(q.frequency||"")}</td><td class="right">${esc(q.amount.toFixed(2))}</td></tr></tbody></table>
      <table style="margin-top:8px;border:none"><tr><td style="border:none;text-align:right">VAT (5%)</td><td style="border:none;text-align:right;width:140px">${esc(q.vat.toFixed(2))}</td></tr>
      <tr><td style="border:none;text-align:right" class="total">TOTAL</td><td style="border:none;text-align:right" class="total">AED ${esc(q.total.toFixed(2))}</td></tr></table>
      <p style="margin-top:40px;color:#64748b">Thank you for your business.</p>
      <script>window.print();<\/script></body></html>`;
    openPrintWindow(html);
  };

  return (
    <div className="space-y-5" data-testid="quotations-page">
      <div className="flex justify-between items-center">
        <div><h2 className="font-display text-2xl sm:text-3xl">Quotations</h2><p className="text-sm text-muted-foreground">Generate professional PDF quotes.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-700 hover:bg-emerald-800 gap-2" data-testid="new-quote-btn"><Plus className="w-4 h-4"/>New Quote</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Customer Name</Label><Input data-testid="q-customer" value={form.customer_name} onChange={e=>setForm({...form, customer_name:e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Service Type</Label><Input value={form.service_type} onChange={e=>setForm({...form, service_type:e.target.value})}/></div>
                <div><Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={v=>setForm({...form, frequency:v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{["One-time","Monthly","Quarterly","Annual"].map(f=><SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/></div>
              <div><Label>Amount (AED)</Label><Input type="number" data-testid="q-amount" value={form.amount} onChange={e=>{const c=recalc(e.target.value); setForm({...form, ...c});}}/></div>
              <div className="text-sm text-muted-foreground">VAT 5%: AED {form.vat} · <strong className="text-foreground">Total: AED {form.total}</strong></div>
            </div>
            <Button onClick={save} data-testid="q-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map(q => (
              <TableRow key={q.id}><TableCell className="font-mono text-xs">{q.quote_number}</TableCell><TableCell>{q.customer_name}</TableCell>
              <TableCell>{q.service_type}</TableCell><TableCell>AED {q.total}</TableCell><TableCell><Badge>{q.status}</Badge></TableCell>
              <TableCell><Button size="sm" variant="ghost" onClick={()=>printPdf(q)} data-testid={`q-pdf-${q.id}`}><Download className="w-4 h-4"/></Button></TableCell></TableRow>
            ))}
            {items.length===0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No quotations</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
export default Quotations;
