import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { FormProvider } from "./context/FormContext";
import GraphDetailPage from "./pages/GraphDetailPage";
import FanCategories from "./pages/FanCategories";
import UnitConverter from "./pages/UnitConverter";
import LandingPage from "./pages/LandingPage";
import CatalogPage from "./pages/CatalogPage";

// Axial fan pages
import AxialFanTypesPage from "./pages/axial/AxialFanTypesPage";
import AxialFanSelectionPage from "./pages/axial/AxialFanSelectionPage";
import AxialResultsPage from "./pages/axial/AxialResultsPage";
import AxialGraphDetailPage from "./pages/axial/AxialGraphDetailPage";

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
          <Route
            path="/graph-detail"
            element={
              <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
                <GraphDetailPage />
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
          <Route
            path="/axial/graph-detail"
            element={
              <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
                <AxialGraphDetailPage />
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
