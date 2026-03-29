import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OptimizationProvider } from "./context/OptimizationContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";

export default function App() {
  return (
    <OptimizationProvider>
      <BrowserRouter>
        <div className="noise-overlay" aria-hidden="true" />
        <div className="relative z-[2] min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workspace" element={<Workspace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </OptimizationProvider>
  );
}
