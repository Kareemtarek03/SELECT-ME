import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const menuItems = [
        { label: "Home", path: "/fan-categories", icon: "🏠" },
        { label: "Axial Catalog", path: "/catalogs", icon: "📄" },
        { label: "Unit Converter", path: "/unit-converter", icon: "⚙️" },
        { label: "Axial Data", path: "/admin/axial", icon: "📋" },
        { label: "Common Data", path: "/admin/common", icon: "⚙️" },
        { label: "Centrifugal Data", path: "/admin/centrifugal", icon: "💨" },
    ];

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "fixed",
                    top: "1rem",
                    left: "1rem",
                    zIndex: 1000,
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    padding: "0.5rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                }}
            >
                <span
                    style={{
                        width: "20px",
                        height: "2px",
                        background: "#1e293b",
                        borderRadius: "1px",
                        transition: "all 0.3s ease",
                        transform: isOpen ? "rotate(45deg) translate(4px, 4px)" : "none",
                    }}
                />
                <span
                    style={{
                        width: "20px",
                        height: "2px",
                        background: "#1e293b",
                        borderRadius: "1px",
                        transition: "all 0.3s ease",
                        opacity: isOpen ? 0 : 1,
                    }}
                />
                <span
                    style={{
                        width: "20px",
                        height: "2px",
                        background: "#1e293b",
                        borderRadius: "1px",
                        transition: "all 0.3s ease",
                        transform: isOpen ? "rotate(-45deg) translate(4px, -4px)" : "none",
                    }}
                />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.3)",
                        zIndex: 998,
                        transition: "opacity 0.3s ease",
                    }}
                />
            )}

            {/* Slide-out Menu */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: isOpen ? 0 : "-280px",
                    width: "280px",
                    height: "100vh",
                    background: "white",
                    boxShadow: isOpen ? "4px 0 20px rgba(0, 0, 0, 0.15)" : "none",
                    zIndex: 999,
                    transition: "left 0.3s ease",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Menu Header */}
                <div
                    style={{
                        padding: "1.5rem",
                        borderBottom: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        textAlign: "center",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: "#1e293b",
                        }}
                    >
                        Menu
                    </h2>
                </div>

                {/* Menu Items */}
                <div style={{ padding: "0.5rem", flex: 1 }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setIsOpen(false);
                            }}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.875rem 1rem",
                                background: "transparent",
                                border: "none",
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                fontSize: "0.9375rem",
                                color: "#1e293b",
                                textAlign: "left",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f1f5f9";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                            <span style={{ fontWeight: "500" }}>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Menu Footer */}
                <div
                    style={{
                        padding: "1rem 1.5rem",
                        borderTop: "1px solid #e2e8f0",
                        background: "#f8fafc",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: "0.75rem",
                            color: "#64748b",
                        }}
                    >
                        Mechtronics Fan Selection
                    </p>
                </div>
            </div>
        </>
    );
}
