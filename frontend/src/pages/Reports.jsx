import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Download } from "lucide-react";
import { esc, safeImgSrc, openPrintWindow, printCss } from "../lib/pdf";

const Reports = () => {
  const [items, setItems] = useState([]);

  useEffect(()=>{ api.get("/service-reports").then(({data})=>setItems(data)); }, []);

  const print = (r) => {
    const photos = (arr=[]) => arr.map(p => {
      const s = safeImgSrc(p);
      return s ? `<img src="${s}" style="width:140px;height:140px;object-fit:cover;border:1px solid #e2e8f0;margin:4px;border-radius:4px"/>` : "";
    }).join("");
    const sig = safeImgSrc(r.customer_signature);
    const html = `<!doctype html><html><head><title>Service Report ${esc(r.job_number||"")}</title>
    <style>${printCss}</style></head><body>
    <div class="header"><div><h1>SERVICE REPORT</h1><div>${esc(r.job_number||"")}</div></div>
    <div style="text-align:right"><strong>PestERP UAE</strong><br/>Dubai, UAE</div></div>
    <div class="row"><div class="label">Customer</div><div>${esc(r.customer_name||"")}</div></div>
    <div class="row"><div class="label">Service Date</div><div>${esc(r.service_date||"")}</div></div>
    <div class="row"><div class="label">Service Type</div><div>${esc(r.service_type||"")}</div></div>
    <div class="row"><div class="label">Technician</div><div>${esc(r.technician_name||"")}</div></div>
    <div class="row"><div class="label">Chemicals</div><div>${esc(r.chemicals_used||"—")}</div></div>
    <div class="row"><div class="label">Notes</div><div>${esc(r.tech_notes||"")}</div></div>
    <h3>Before Photos</h3><div>${photos(r.before_photos)}</div>
    <h3>After Photos</h3><div>${photos(r.after_photos)}</div>
    <h3>Customer Signature</h3>${sig?`<img src="${sig}" style="max-width:300px;border:1px solid #e2e8f0"/>`:"—"}
    <script>window.print();<\/script></body></html>`;
    openPrintWindow(html);
  };

  return (
    <div className="space-y-5" data-testid="reports-page">
      <div><h2 className="font-display text-2xl sm:text-3xl">Service Reports</h2><p className="text-sm text-muted-foreground">Auto-generated after each completed job.</p></div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Job #</TableHead><TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead><TableHead>Technician</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map(r => (
              <TableRow key={r.id} data-testid={`report-${r.id}`}>
                <TableCell className="font-mono text-xs">{r.job_number}</TableCell>
                <TableCell>{r.customer_name}</TableCell>
                <TableCell>{r.service_type}</TableCell>
                <TableCell>{r.service_date}</TableCell>
                <TableCell>{r.technician_name}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={()=>print(r)} data-testid={`pdf-${r.id}`}><Download className="w-4 h-4"/></Button></TableCell>
              </TableRow>
            ))}
            {items.length===0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No reports yet. Complete a job to generate one.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Reports;
