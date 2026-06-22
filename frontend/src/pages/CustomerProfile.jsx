import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";

const CustomerProfile = () => {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [amcs, setAmcs] = useState([]);
  const [invs, setInvs] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/customers/${id}`); setC(data);
      const [j, a, i] = await Promise.all([api.get("/jobs"), api.get("/amc"), api.get("/invoices")]);
      setJobs(j.data.filter(x => x.customer_id === id));
      setAmcs(a.data.filter(x => x.customer_id === id));
      setInvs(i.data.filter(x => x.customer_id === id));
    })();
  }, [id]);  if (!c) return <div>Loading…</div>;

  return (
    <div className="space-y-5" data-testid="customer-profile">
      <div>
        <div className="text-xs text-muted-foreground">{c.code}</div>
        <h2 className="font-display text-2xl sm:text-3xl">{c.name}</h2>
        <div className="text-sm text-muted-foreground">{c.area} · {c.city} · {c.mobile}</div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Service History</TabsTrigger>
          <TabsTrigger value="amc" data-testid="tab-amc">AMC</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="p-6 grid sm:grid-cols-2 gap-3 text-sm">
            {[["Contact", c.contact_person],["Email", c.email],["Address", c.address],["TRN", c.trn_number],["Type", c.customer_type]].map(([k,v]) => (
              <div key={k}><div className="text-xs uppercase text-muted-foreground">{k}</div><div>{v || "—"}</div></div>
            ))}
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card className="divide-y">
            {jobs.map(j => (
              <div key={j.id} className="p-4 flex justify-between items-center">
                <div><div className="font-medium">{j.service_type}</div><div className="text-xs text-muted-foreground">{j.scheduled_date} · {j.technician_name}</div></div>
                <Badge>{j.status}</Badge>
              </div>
            ))}
            {jobs.length === 0 && <div className="p-6 text-center text-muted-foreground">No jobs yet</div>}
          </Card>
        </TabsContent>
        <TabsContent value="amc">
          <Card className="divide-y">
            {amcs.map(a => (
              <div key={a.id} className="p-4 flex justify-between"><div><div className="font-medium">{a.contract_number}</div><div className="text-xs text-muted-foreground">{a.start_date} → {a.end_date}</div></div><div>AED {a.contract_value}</div></div>
            ))}
            {amcs.length === 0 && <div className="p-6 text-center text-muted-foreground">No contracts</div>}
          </Card>
        </TabsContent>
        <TabsContent value="invoices">
          <Card className="divide-y">
            {invs.map(i => (
              <div key={i.id} className="p-4 flex justify-between"><div><div className="font-medium">{i.invoice_number}</div><div className="text-xs text-muted-foreground">Due {i.due_date}</div></div><div className="flex items-center gap-3"><Badge>{i.status}</Badge>AED {i.total}</div></div>
            ))}
            {invs.length === 0 && <div className="p-6 text-center text-muted-foreground">No invoices</div>}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerProfile;
