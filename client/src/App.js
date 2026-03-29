import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { FormProvider } from "./context/FormContext";
import FanCategories from "./pages/FanCategories";
import UnitConverter from "./pages/UnitConverter";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CatalogPage from "./pages/CatalogPage";
import "./index.css";

// Axial fan pages
import AxialFanTypesPage from "./pages/axial/AxialFanTypesPage";
import AxialFanSelectionPage from "./pages/axial/AxialFanSelectionPage";
import AxialResultsPage from "./pages/axial/AxialResultsPage";

// Admin pages
import AxialFanDataPage from "./pages/admin/AxialFanDataPage";
import MotorDataPage from "./pages/admin/MotorDataPage";
import CentrifugalDataPage from "./pages/admin/CentrifugalDataPage";
import AdminPricingPage from "./pages/admin/AdminPricingPage";
// Centrifugal fan pages
import CentrifugalFanTypesPage from "./pages/centrifugal/CentrifugalFanTypesPage";
import CentrifugalFanSelectionPage from "./pages/centrifugal/CentrifugalFanSelectionPage";
import CentrifugalFanResultPage from "./pages/centrifugal/CentrifugalFanResultPage";
import CentrifugalFanSecondInputPage from "./pages/centrifugal/CentrifugalFanSecondInputPage";
import CentrifugalFanFinalResultPage from "./pages/centrifugal/CentrifugalFanFinalResultPage";

function App() {
  // Global double-click handler: select all text in any input field on double-click
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" && (e.target.type === "text" || e.target.type === "number")) {
        e.target.select();
      }
    };
    document.addEventListener("dblclick", handler);
    return () => document.removeEventListener("dblclick", handler);
  }, []);

  return (
    <FormProvider>
      <Router>
        <Routes>
          {/* Landing Page - Default route */}
          <Route path="/" element={<LandingPage />} />

          {/* Dashboard - Main menu after landing page */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Admin Dashboard - Links to all admin data tables */}
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />

          {/* Admin - /admin redirects to axial fan data; order: 1 Axial Fan, 2 Motor, 3 Centrifugal, 4 Pricing */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/axial-fan-data" replace />}
          />
          <Route
            path="/admin/axial-fan-data"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <AxialFanDataPage />
              </div>
            }
          />
          <Route
            path="/admin/motor"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <MotorDataPage />
              </div>
            }
          />
          <Route
            path="/admin/centrifugal"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <CentrifugalDataPage />
              </div>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <AdminPricingPage />
              </div>
            }
          />

          {/* Fan Categories Route - No Header */}
          <Route
            path="/fan-categories"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <FanCategories />
              </div>
            }
          />

          {/* Fan Selection Routes - No Header */}
          <Route
            path="/fan-selection"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <AxialFanSelectionPage />
              </div>
            }
          />
          <Route
            path="/results"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <AxialResultsPage />
              </div>
            }
          />
          {/* Unit Converter Route - No Header */}
          <Route
            path="/unit-converter"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <UnitConverter />
              </div>
            }
          />

          {/* Catalog Route - No Header */}
          <Route
            path="/catalogs"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <CatalogPage />
              </div>
            }
          />

          {/* Axial Fan Routes */}
          <Route
            path="/axial/fan-types"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <AxialFanTypesPage />
              </div>
            }
          />
          <Route
            path="/axial/fan-selection"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <AxialFanSelectionPage />
              </div>
            }
          />
          <Route
            path="/axial/results"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <AxialResultsPage />
              </div>
            }
          />
          {/* Centrifugal Fan Routes */}
          <Route
            path="/centrifugal/fan-types"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <CentrifugalFanTypesPage />
              </div>
            }
          />
          <Route
            path="/centrifugal/fan-selection"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <CentrifugalFanSelectionPage />
              </div>
            }
          />
          <Route
            path="/centrifugal/results"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <CentrifugalFanResultPage />
              </div>
            }
          />
          <Route
            path="/centrifugal/second-input"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <CentrifugalFanSecondInputPage />
              </div>
            }
          />
          <Route
            path="/centrifugal/final-result"
            element={
              <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <CentrifugalFanFinalResultPage />
              </div>
            }
          />
        </Routes>
      </Router>
    </FormProvider>
  );
}

export default App;
