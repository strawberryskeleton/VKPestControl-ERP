import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";
import Leads from "./pages/Leads";
import Quotations from "./pages/Quotations";
import AMC from "./pages/AMC";
import Jobs from "./pages/Jobs";
import Schedule from "./pages/Schedule";
import TechnicianApp from "./pages/TechnicianApp";
import Reports from "./pages/Reports";
import Invoices from "./pages/Invoices";
import Finance from "./pages/Finance";
import Inventory from "./pages/Inventory";
import Investments from "./pages/Investments";
import { Toaster } from "./components/ui/sonner";

const Wrap = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Wrap><Dashboard /></Wrap>} />
          <Route path="/customers" element={<Wrap><Customers /></Wrap>} />
          <Route path="/customers/:id" element={<Wrap><CustomerProfile /></Wrap>} />
          <Route path="/leads" element={<Wrap><Leads /></Wrap>} />
          <Route path="/quotations" element={<Wrap><Quotations /></Wrap>} />
          <Route path="/amc" element={<Wrap><AMC /></Wrap>} />
          <Route path="/jobs" element={<Wrap><Jobs /></Wrap>} />
          <Route path="/schedule" element={<Wrap><Schedule /></Wrap>} />
          <Route path="/technician" element={<Wrap><TechnicianApp /></Wrap>} />
          <Route path="/reports" element={<Wrap><Reports /></Wrap>} />
          <Route path="/invoices" element={<Wrap><Invoices /></Wrap>} />
          <Route path="/finance" element={<Wrap><Finance /></Wrap>} />
          <Route path="/inventory" element={<Wrap><Inventory /></Wrap>} />
          <Route path="/investments" element={<Wrap><Investments /></Wrap>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export default App;
