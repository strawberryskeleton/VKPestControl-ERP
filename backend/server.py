"""Pest Control ERP - Backend
Production-ready FastAPI server with MongoDB, JWT auth, RBAC, and Claude AI assistant.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal, Any
from datetime import datetime, timezone, timedelta, date
from pathlib import Path
import os, uuid, jwt, bcrypt, logging, asyncio, json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
JWT_ALG = "HS256"
JWT_EXPIRE_HOURS = 24 * 7

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Pest Control ERP API")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def gen_id() -> str:
    return str(uuid.uuid4())

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def make_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

def require_roles(*roles: str):
    async def checker(user=Depends(get_current_user)):
        if user["role"] not in roles and user["role"] != "super_admin":
            raise HTTPException(403, "Forbidden")
        return user
    return checker

async def audit(user, action: str, entity: str, entity_id: str, meta: dict = None):
    await db.audit_logs.insert_one({
        "id": gen_id(),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "meta": meta or {},
        "timestamp": now_iso(),
    })

# ---------- Models ----------
ROLE = Literal["super_admin", "ops_manager", "sales", "accountant", "technician"]

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: ROLE
    phone: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    code: Optional[str] = None
    name: str
    contact_person: Optional[str] = None
    mobile: str
    email: Optional[str] = None
    address: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = "Dubai"
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    customer_type: Literal["Residential", "Commercial"] = "Residential"
    trn_number: Optional[str] = None
    notes: Optional[str] = None
    active: bool = True
    created_at: str = Field(default_factory=now_iso)

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    name: str
    mobile: str
    email: Optional[str] = None
    area: Optional[str] = None
    source: Literal["Google", "Website", "Referral", "Facebook", "Instagram", "WhatsApp", "Existing Customer", "Other"] = "Google"
    service_required: Optional[str] = None
    estimated_value: float = 0.0
    stage: Literal["New", "Contacted", "Site Inspection", "Quotation Sent", "Follow Up", "Negotiation", "Won", "Lost"] = "New"
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class AMC(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    contract_number: str
    customer_id: str
    customer_name: Optional[str] = None
    amc_type: Literal["Residential", "Commercial"] = "Residential"
    start_date: str
    end_date: str
    contract_value: float
    visits_per_year: int = 4
    visits_used: int = 0
    status: Literal["Active", "Expired", "Cancelled"] = "Active"
    created_at: str = Field(default_factory=now_iso)

class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    job_number: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_mobile: Optional[str] = None
    customer_address: Optional[str] = None
    service_type: str
    technician_id: Optional[str] = None
    technician_name: Optional[str] = None
    amc_id: Optional[str] = None
    scheduled_date: str   # ISO date YYYY-MM-DD
    scheduled_time: str = "09:00"
    status: Literal["Scheduled", "Assigned", "On The Way", "In Progress", "Completed", "Cancelled"] = "Scheduled"
    notes: Optional[str] = None
    gps_checkin: Optional[dict] = None
    gps_checkout: Optional[dict] = None
    before_photos: List[str] = []
    after_photos: List[str] = []
    chemicals_used: Optional[str] = None
    tech_notes: Optional[str] = None
    customer_signature: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    invoice_number: str
    customer_id: str
    customer_name: Optional[str] = None
    job_id: Optional[str] = None
    amount: float
    vat: float = 0.0
    total: float
    due_date: str
    status: Literal["Draft", "Sent", "Paid", "Overdue"] = "Draft"
    description: Optional[str] = None
    paid_at: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    category: Literal["Salaries", "Fuel", "Chemicals", "Vehicles", "Rent", "Utilities", "Miscellaneous"]
    amount: float
    description: Optional[str] = None
    date: str
    created_at: str = Field(default_factory=now_iso)

class Inventory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    chemical_name: str
    category: Optional[str] = "Insecticide"
    supplier: Optional[str] = None
    quantity: float
    unit: str = "Liters"
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    min_stock: float = 10.0
    created_at: str = Field(default_factory=now_iso)

class Investment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    asset_type: Literal["Mutual Fund", "ETF", "Stock"]
    name: str
    quantity: float = 0
    units: float = 0
    sip_amount: float = 0
    avg_cost: float = 0
    buy_price: float = 0
    current_value: float = 0
    created_at: str = Field(default_factory=now_iso)

class Quotation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    quote_number: str
    customer_id: Optional[str] = None
    customer_name: str
    service_type: str
    description: Optional[str] = None
    frequency: Optional[str] = None
    amount: float
    vat: float = 0.0
    total: float
    status: Literal["Draft", "Sent", "Accepted", "Rejected"] = "Draft"
    created_at: str = Field(default_factory=now_iso)

# ---------- Generic CRUD helpers ----------
async def list_collection(coll: str, filt: dict = None, limit: int = 500):
    return await db[coll].find(filt or {}, {"_id": 0}).sort("created_at", -1).to_list(limit)

# ---------- AUTH ----------
@api.post("/auth/login")
async def login(payload: LoginIn):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_pw(payload.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    if not user.get("active", True):
        raise HTTPException(403, "Account disabled")
    token = make_token(user["id"], user["role"])
    user.pop("password", None)
    user.pop("_id", None)
    return {"token": token, "user": user}

@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user

@api.post("/auth/register")
async def register(payload: UserCreate, user=Depends(require_roles("super_admin"))):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(400, "Email already exists")
    u = {
        "id": gen_id(),
        "name": payload.name,
        "email": payload.email.lower(),
        "password": hash_pw(payload.password),
        "role": payload.role,
        "phone": payload.phone,
        "active": True,
        "created_at": now_iso(),
    }
    await db.users.insert_one(u)
    u.pop("password"); u.pop("_id", None)
    await audit(user, "create", "user", u["id"])
    return u

@api.get("/users")
async def list_users(user=Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(500)
    return users

@api.get("/users/technicians")
async def list_technicians(user=Depends(get_current_user)):
    techs = await db.users.find({"role": "technician"}, {"_id": 0, "password": 0}).to_list(100)
    return techs

# ---------- CUSTOMERS ----------
@api.post("/customers")
async def create_customer(c: Customer, user=Depends(get_current_user)):
    doc = c.model_dump()
    if not doc.get("code"):
        count = await db.customers.count_documents({})
        doc["code"] = f"CUST-{1000 + count + 1}"
    await db.customers.insert_one(doc)
    await audit(user, "create", "customer", doc["id"])
    doc.pop("_id", None)
    return doc

@api.get("/customers")
async def list_customers(q: Optional[str] = None, user=Depends(get_current_user)):
    filt = {}
    if q:
        filt = {"$or": [{"name": {"$regex": q, "$options": "i"}}, {"mobile": {"$regex": q, "$options": "i"}}, {"code": {"$regex": q, "$options": "i"}}]}
    return await list_collection("customers", filt)

@api.get("/customers/{cid}")
async def get_customer(cid: str, user=Depends(get_current_user)):
    c = await db.customers.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(404)
    return c

@api.put("/customers/{cid}")
async def update_customer(cid: str, c: Customer, user=Depends(get_current_user)):
    doc = c.model_dump()
    doc["id"] = cid
    await db.customers.update_one({"id": cid}, {"$set": doc})
    await audit(user, "update", "customer", cid)
    return doc

@api.delete("/customers/{cid}")
async def delete_customer(cid: str, user=Depends(require_roles("super_admin", "ops_manager"))):
    await db.customers.update_one({"id": cid}, {"$set": {"active": False}})
    await audit(user, "delete", "customer", cid)
    return {"ok": True}

# ---------- LEADS ----------
@api.post("/leads")
async def create_lead(l: Lead, user=Depends(get_current_user)):
    doc = l.model_dump()
    await db.leads.insert_one(doc)
    await audit(user, "create", "lead", doc["id"])
    doc.pop("_id", None)
    return doc

@api.get("/leads")
async def list_leads(user=Depends(get_current_user)):
    return await list_collection("leads")

@api.put("/leads/{lid}")
async def update_lead(lid: str, l: Lead, user=Depends(get_current_user)):
    doc = l.model_dump()
    doc["id"] = lid
    doc["updated_at"] = now_iso()
    await db.leads.update_one({"id": lid}, {"$set": doc})
    return doc

@api.patch("/leads/{lid}/stage")
async def update_lead_stage(lid: str, payload: dict, user=Depends(get_current_user)):
    await db.leads.update_one({"id": lid}, {"$set": {"stage": payload["stage"], "updated_at": now_iso()}})
    return {"ok": True}

@api.delete("/leads/{lid}")
async def delete_lead(lid: str, user=Depends(get_current_user)):
    await db.leads.delete_one({"id": lid})
    return {"ok": True}

# ---------- AMC ----------
@api.post("/amc")
async def create_amc(a: AMC, user=Depends(get_current_user)):
    doc = a.model_dump()
    if not doc.get("contract_number"):
        count = await db.amc.count_documents({})
        doc["contract_number"] = f"AMC-{2000 + count + 1}"
    cust = await db.customers.find_one({"id": a.customer_id}, {"_id": 0})
    if cust:
        doc["customer_name"] = cust["name"]
    await db.amc.insert_one(doc)
    await audit(user, "create", "amc", doc["id"])
    doc.pop("_id", None)
    return doc

@api.get("/amc")
async def list_amc(user=Depends(get_current_user)):
    return await list_collection("amc")

@api.get("/amc/expiring")
async def expiring_amc(days: int = 30, user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).date()
    limit_d = today + timedelta(days=days)
    items = await db.amc.find({"status": "Active"}, {"_id": 0, "end_date": 1, "id": 1, "contract_number": 1, "customer_name": 1}).to_list(500)
    out = []
    for a in items:
        try:
            ed = datetime.fromisoformat(a["end_date"]).date()
            if today <= ed <= limit_d:
                out.append(a)
        except Exception:
            pass
    return out

# ---------- JOBS ----------
@api.post("/jobs")
async def create_job(j: Job, user=Depends(get_current_user)):
    doc = j.model_dump()
    if not doc.get("job_number"):
        count = await db.jobs.count_documents({})
        doc["job_number"] = f"JOB-{5000 + count + 1}"
    cust = await db.customers.find_one({"id": j.customer_id}, {"_id": 0})
    if cust:
        doc["customer_name"] = cust["name"]
        doc["customer_mobile"] = cust["mobile"]
        doc["customer_address"] = cust.get("address")
    if j.technician_id:
        tech = await db.users.find_one({"id": j.technician_id}, {"_id": 0})
        if tech:
            doc["technician_name"] = tech["name"]
            if doc["status"] == "Scheduled":
                doc["status"] = "Assigned"
    await db.jobs.insert_one(doc)
    await audit(user, "create", "job", doc["id"])
    doc.pop("_id", None)
    return doc

@api.get("/jobs")
async def list_jobs(date_from: Optional[str] = None, date_to: Optional[str] = None, technician_id: Optional[str] = None, status: Optional[str] = None, user=Depends(get_current_user)):
    filt = {}
    if technician_id:
        filt["technician_id"] = technician_id
    if status:
        filt["status"] = status
    if date_from or date_to:
        filt["scheduled_date"] = {}
        if date_from:
            filt["scheduled_date"]["$gte"] = date_from
        if date_to:
            filt["scheduled_date"]["$lte"] = date_to
    # Technician role sees only their own
    if user["role"] == "technician":
        filt["technician_id"] = user["id"]
    return await db.jobs.find(filt, {"_id": 0}).sort("scheduled_date", 1).to_list(500)

@api.get("/jobs/{jid}")
async def get_job(jid: str, user=Depends(get_current_user)):
    j = await db.jobs.find_one({"id": jid}, {"_id": 0})
    if not j:
        raise HTTPException(404)
    return j

@api.put("/jobs/{jid}")
async def update_job(jid: str, payload: dict, user=Depends(get_current_user)):
    payload.pop("_id", None)
    if "technician_id" in payload and payload["technician_id"]:
        tech = await db.users.find_one({"id": payload["technician_id"]}, {"_id": 0})
        if tech:
            payload["technician_name"] = tech["name"]
    await db.jobs.update_one({"id": jid}, {"$set": payload})
    await audit(user, "update", "job", jid, payload)
    return await db.jobs.find_one({"id": jid}, {"_id": 0})

@api.post("/jobs/{jid}/start")
async def start_job(jid: str, payload: dict, user=Depends(get_current_user)):
    upd = {"status": "In Progress", "started_at": now_iso(), "gps_checkin": payload.get("gps")}
    await db.jobs.update_one({"id": jid}, {"$set": upd})
    return {"ok": True}

@api.post("/jobs/{jid}/complete")
async def complete_job(jid: str, payload: dict, user=Depends(get_current_user)):
    upd = {
        "status": "Completed",
        "completed_at": now_iso(),
        "gps_checkout": payload.get("gps"),
        "before_photos": payload.get("before_photos", []),
        "after_photos": payload.get("after_photos", []),
        "chemicals_used": payload.get("chemicals_used"),
        "tech_notes": payload.get("tech_notes"),
        "customer_signature": payload.get("customer_signature"),
    }
    await db.jobs.update_one({"id": jid}, {"$set": upd})
    j = await db.jobs.find_one({"id": jid}, {"_id": 0})
    # Auto-create service report
    await db.service_reports.insert_one({
        "id": gen_id(),
        "job_id": jid,
        "job_number": j.get("job_number"),
        "customer_name": j.get("customer_name"),
        "service_type": j.get("service_type"),
        "technician_name": j.get("technician_name"),
        "service_date": j.get("scheduled_date"),
        "before_photos": upd["before_photos"],
        "after_photos": upd["after_photos"],
        "chemicals_used": upd["chemicals_used"],
        "tech_notes": upd["tech_notes"],
        "customer_signature": upd["customer_signature"],
        "created_at": now_iso(),
    })
    return {"ok": True}

@api.delete("/jobs/{jid}")
async def delete_job(jid: str, user=Depends(require_roles("super_admin", "ops_manager"))):
    await db.jobs.delete_one({"id": jid})
    return {"ok": True}

# ---------- SERVICE REPORTS ----------
@api.get("/service-reports")
async def list_reports(user=Depends(get_current_user)):
    return await list_collection("service_reports")

@api.get("/service-reports/{rid}")
async def get_report(rid: str, user=Depends(get_current_user)):
    r = await db.service_reports.find_one({"id": rid}, {"_id": 0})
    if not r:
        raise HTTPException(404)
    return r

# ---------- INVOICES ----------
@api.post("/invoices")
async def create_invoice(inv: Invoice, user=Depends(get_current_user)):
    doc = inv.model_dump()
    if not doc.get("invoice_number"):
        count = await db.invoices.count_documents({})
        doc["invoice_number"] = f"INV-{3000 + count + 1}"
    cust = await db.customers.find_one({"id": inv.customer_id}, {"_id": 0})
    if cust:
        doc["customer_name"] = cust["name"]
    await db.invoices.insert_one(doc)
    await audit(user, "create", "invoice", doc["id"])
    doc.pop("_id", None)
    return doc

@api.get("/invoices")
async def list_invoices(user=Depends(get_current_user)):
    return await list_collection("invoices")

@api.patch("/invoices/{iid}/status")
async def invoice_status(iid: str, payload: dict, user=Depends(get_current_user)):
    upd = {"status": payload["status"]}
    if payload["status"] == "Paid":
        upd["paid_at"] = now_iso()
    await db.invoices.update_one({"id": iid}, {"$set": upd})
    return {"ok": True}

# ---------- EXPENSES ----------
@api.post("/expenses")
async def create_expense(e: Expense, user=Depends(get_current_user)):
    doc = e.model_dump()
    await db.expenses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/expenses")
async def list_expenses(user=Depends(get_current_user)):
    return await list_collection("expenses")

@api.delete("/expenses/{eid}")
async def delete_expense(eid: str, user=Depends(get_current_user)):
    await db.expenses.delete_one({"id": eid})
    return {"ok": True}

# ---------- INVENTORY ----------
@api.post("/inventory")
async def create_inv(i: Inventory, user=Depends(get_current_user)):
    doc = i.model_dump()
    await db.inventory.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/inventory")
async def list_inv(user=Depends(get_current_user)):
    return await list_collection("inventory")

@api.put("/inventory/{iid}")
async def update_inv(iid: str, i: Inventory, user=Depends(get_current_user)):
    doc = i.model_dump(); doc["id"] = iid
    await db.inventory.update_one({"id": iid}, {"$set": doc})
    return doc

@api.delete("/inventory/{iid}")
async def delete_inv(iid: str, user=Depends(get_current_user)):
    await db.inventory.delete_one({"id": iid})
    return {"ok": True}

# ---------- INVESTMENTS ----------
@api.post("/investments")
async def create_invest(i: Investment, user=Depends(get_current_user)):
    doc = i.model_dump()
    await db.investments.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/investments")
async def list_invest(user=Depends(get_current_user)):
    return await list_collection("investments")

@api.delete("/investments/{iid}")
async def delete_invest(iid: str, user=Depends(get_current_user)):
    await db.investments.delete_one({"id": iid})
    return {"ok": True}

# ---------- QUOTATIONS ----------
@api.post("/quotations")
async def create_quote(q: Quotation, user=Depends(get_current_user)):
    doc = q.model_dump()
    if not doc.get("quote_number"):
        count = await db.quotations.count_documents({})
        doc["quote_number"] = f"QT-{4000 + count + 1}"
    await db.quotations.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/quotations")
async def list_quotes(user=Depends(get_current_user)):
    return await list_collection("quotations")

# ---------- DASHBOARD ----------
@api.get("/dashboard/kpis")
async def kpis(user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    week_start = (datetime.now(timezone.utc).date() - timedelta(days=7)).isoformat()
    month_start = datetime.now(timezone.utc).date().replace(day=1).isoformat()

    total_customers = await db.customers.count_documents({})
    active_customers = await db.customers.count_documents({"active": True})
    active_amc = await db.amc.count_documents({"status": "Active"})
    
    # Expiring AMC in 30 days
    amcs = await db.amc.find({"status": "Active"}, {"_id": 0, "end_date": 1}).to_list(500)
    today_d = datetime.now(timezone.utc).date()
    expiring = 0
    for a in amcs:
        try:
            ed = datetime.fromisoformat(a["end_date"]).date()
            if today_d <= ed <= today_d + timedelta(days=30):
                expiring += 1
        except Exception:
            pass

    jobs_today = await db.jobs.count_documents({"scheduled_date": today})
    jobs_week = await db.jobs.count_documents({"scheduled_date": {"$gte": week_start}})
    completed = await db.jobs.count_documents({"status": "Completed"})
    pending = await db.jobs.count_documents({"status": {"$in": ["Scheduled", "Assigned", "On The Way", "In Progress"]}})

    # Revenue and expenses (current month) - DB-level filter + projection
    invs = await db.invoices.find({"status": "Paid", "paid_at": {"$gte": month_start}}, {"_id": 0, "total": 1, "paid_at": 1}).to_list(2000)
    monthly_rev = sum(i["total"] for i in invs)
    exps = await db.expenses.find({"date": {"$gte": month_start}}, {"_id": 0, "amount": 1, "date": 1}).to_list(2000)
    monthly_exp = sum(e["amount"] for e in exps)
    profit = monthly_rev - monthly_exp

    outstanding_q = await db.invoices.find({"status": {"$in": ["Sent", "Overdue"]}}, {"_id": 0, "total": 1}).to_list(2000)
    outstanding = sum(i["total"] for i in outstanding_q)

    techs = await db.users.count_documents({"role": "technician"})
    busy_techs = len(set([j.get("technician_id") for j in await db.jobs.find({"status": {"$in": ["Assigned", "On The Way", "In Progress"]}}, {"_id": 0, "technician_id": 1}).to_list(500) if j.get("technician_id")]))
    utilization = round((busy_techs / techs) * 100) if techs else 0

    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "active_amc": active_amc,
        "expiring_amc": expiring,
        "jobs_today": jobs_today,
        "jobs_week": jobs_week,
        "completed_jobs": completed,
        "pending_jobs": pending,
        "monthly_revenue": round(monthly_rev, 2),
        "monthly_expenses": round(monthly_exp, 2),
        "monthly_profit": round(profit, 2),
        "outstanding_invoices": round(outstanding, 2),
        "technician_utilization": utilization,
    }

@api.get("/dashboard/charts")
async def charts(user=Depends(get_current_user)):
    # Last 6 months revenue trend
    today = datetime.now(timezone.utc).date()
    months = []
    for i in range(5, -1, -1):
        d = (today.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        months.append(d.isoformat()[:7])
    months = sorted(set(months))[-6:]

    six_months_ago = (today - timedelta(days=200)).isoformat()
    invs = await db.invoices.find({"status": "Paid", "paid_at": {"$gte": six_months_ago}}, {"_id": 0, "total": 1, "paid_at": 1}).to_list(5000)
    revenue_trend = []
    for m in months:
        total = sum(i["total"] for i in invs if (i.get("paid_at") or "")[:7] == m)
        revenue_trend.append({"month": m, "revenue": round(total, 2)})

    # Jobs by service type
    jobs = await db.jobs.find({"created_at": {"$gte": six_months_ago}}, {"_id": 0, "service_type": 1, "status": 1, "technician_name": 1}).to_list(5000)
    by_type = {}
    for j in jobs:
        by_type[j["service_type"]] = by_type.get(j["service_type"], 0) + 1
    jobs_by_type = [{"name": k, "value": v} for k, v in by_type.items()]

    # Lead funnel
    leads = await db.leads.find({"created_at": {"$gte": six_months_ago}}, {"_id": 0, "stage": 1}).to_list(5000)
    stages = ["New", "Contacted", "Site Inspection", "Quotation Sent", "Follow Up", "Negotiation", "Won"]
    funnel = [{"stage": s, "count": sum(1 for l in leads if l["stage"] == s)} for s in stages]

    # Tech performance
    completed_jobs = [j for j in jobs if j["status"] == "Completed"]
    perf = {}
    for j in completed_jobs:
        n = j.get("technician_name") or "Unassigned"
        perf[n] = perf.get(n, 0) + 1
    tech_perf = [{"name": k, "jobs": v} for k, v in perf.items()]

    # AMC renewal trend (last 6 months)
    amcs = await db.amc.find({"start_date": {"$gte": six_months_ago}}, {"_id": 0, "start_date": 1}).to_list(2000)
    amc_trend = []
    for m in months:
        c = sum(1 for a in amcs if (a.get("start_date") or "")[:7] == m)
        amc_trend.append({"month": m, "count": c})

    return {
        "revenue_trend": revenue_trend,
        "jobs_by_type": jobs_by_type,
        "lead_funnel": funnel,
        "tech_performance": tech_perf,
        "amc_trend": amc_trend,
    }

# ---------- AUDIT LOGS ----------
@api.get("/audit-logs")
async def list_audit(user=Depends(require_roles("super_admin"))):
    return await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(200).to_list(200)

# ---------- AI ASSISTANT (Claude Sonnet 4.5) ----------
@api.post("/ai/ask")
async def ai_ask(payload: dict, user=Depends(get_current_user)):
    """Non-streaming AI ask for simplicity - returns full response."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    question = payload.get("question", "")
    # Build business context
    kpis_data = await kpis(user)
    leads_count = await db.leads.count_documents({})
    amc_count = await db.amc.count_documents({"status": "Active"})

    context = f"""You are the AI assistant for a UAE pest control company's ERP. Be concise, professional, and use AED currency.
Current business snapshot:
- Total customers: {kpis_data['total_customers']}, Active AMC: {amc_count}, Expiring AMC (30d): {kpis_data['expiring_amc']}
- Jobs today: {kpis_data['jobs_today']}, Pending: {kpis_data['pending_jobs']}, Completed: {kpis_data['completed_jobs']}
- Monthly revenue: AED {kpis_data['monthly_revenue']}, Expenses: AED {kpis_data['monthly_expenses']}, Profit: AED {kpis_data['monthly_profit']}
- Outstanding invoices: AED {kpis_data['outstanding_invoices']}, Technician utilization: {kpis_data['technician_utilization']}%
- Total leads in pipeline: {leads_count}

You can help with: predicting AMC renewals, forecasting revenue/cash flow, identifying overdue customers, suggesting technician assignments, drafting customer follow-up WhatsApp messages, and generating quotation descriptions. Keep answers short, actionable, and formatted as a brief markdown response.
"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"erp-{user['id']}-{gen_id()[:8]}",
            system_message=context,
        ).with_model("anthropic", "claude-sonnet-4-6")
        resp = await chat.send_message(UserMessage(text=question))
        return {"answer": resp}
    except Exception as e:
        logging.exception("AI error")
        raise HTTPException(500, f"AI error: {str(e)}")

# ---------- HEALTH ----------
@api.get("/")
async def root():
    return {"status": "ok", "service": "pest-control-erp", "ts": now_iso()}

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.customers.create_index("mobile")
    await db.jobs.create_index("scheduled_date")
    await db.jobs.create_index("technician_id")
    # Seed if empty
    if await db.users.count_documents({}) == 0:
        from seed import seed_all
        await seed_all(db)
        logger.info("Seeded database with demo data")

@app.on_event("shutdown")
async def shutdown():
    client.close()
