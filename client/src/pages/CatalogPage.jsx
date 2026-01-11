import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu.jsx";

export default function CatalogPage() {
    const [catalogs, setCatalogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        fetchCatalogs();
    }, []);

    const fetchCatalogs = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/catalogs");
            if (!response.ok) {
                throw new Error("Failed to fetch catalogs");
            }
            const data = await response.json();
            setCatalogs(data.catalogs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const handleDownload = async (catalog) => {
        try {
            setDownloading(catalog.name);

            const response = await fetch(`/api/catalogs/download/${encodeURIComponent(catalog.name)}`);
            if (!response.ok) {
                throw new Error("Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            // Open the PDF directly in a new window instead of prompting save dialog
            window.open(url, "_blank");
        } catch (err) {
            alert("Failed to download: " + err.message);
        } finally {
            setDownloading(null);
        }
    };

    // Filter catalogs based on search query
    const filteredCatalogs = catalogs.filter((catalog) => {
        const query = searchQuery.toLowerCase();
        const name = (catalog.displayName || catalog.name || "").toLowerCase();
        return name.includes(query);
    });

    return (
        <div style={{
            height: "100vh",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative"
        }}>
            <HamburgerMenu />
            <style>
                {`@keyframes spin { to { transform: rotate(360deg); } }`}
            </style>

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    zIndex: 1000,
                    padding: "0.5rem 1rem",
                    background: "white",
                    color: "#1e293b",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                }}
            >
                <span>←</span> Back
            </button>

            {/* Main Content */}
            <div style={{
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column"
            }}>
                {/* Header Section */}
                <div style={{
                    maxWidth: "800px",
                    width: "100%",
                    margin: "0 auto",
                    padding: "2rem 1.5rem 1rem",
                }}>
                    {/* Title and Search Row */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "1.5rem",
                        flexWrap: "wrap",
                        gap: "1rem",
                    }}>
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: "1.75rem",
                                fontWeight: "700",
                                color: "#1e293b",
                                letterSpacing: "-0.025em",
                            }}>
                                Axial Fan Catalogs
                            </h1>
                            <p style={{
                                margin: "0.25rem 0 0",
                                fontSize: "0.9rem",
                                color: "#64748b",
                            }}>
                                Download product catalogs for detailed specifications
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div style={{
                            position: "relative",
                            minWidth: "250px",
                        }}>
                            <span style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#94a3b8",
                                fontSize: "1rem",
                            }}>
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Search by series name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.625rem 1rem 0.625rem 2.5rem",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "0.5rem",
                                    fontSize: "0.875rem",
                                    color: "#1e293b",
                                    background: "white",
                                    outline: "none",
                                    transition: "border-color 0.2s, box-shadow 0.2s",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#3b82f6";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#e2e8f0";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                        height: "1px",
                        background: "#e2e8f0",
                        marginBottom: "1.5rem",
                    }} />
                </div>

                {/* Catalog List */}
                <div style={{
                    maxWidth: "800px",
                    width: "100%",
                    margin: "0 auto",
                    padding: "0 1.5rem",
                    flex: 1,
                }}>
                    {loading ? (
                        <div style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "#64748b",
                        }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                border: "3px solid #e2e8f0",
                                borderTopColor: "#3b82f6",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                margin: "0 auto 1rem",
                            }} />
                            Loading catalogs...
                        </div>
                    ) : error ? (
                        <div style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "#ef4444",
                            background: "#fef2f2",
                            borderRadius: "0.5rem",
                        }}>
                            <p style={{ margin: 0 }}>Error: {error}</p>
                            <button
                                onClick={fetchCatalogs}
                                style={{
                                    marginTop: "1rem",
                                    padding: "0.5rem 1rem",
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    cursor: "pointer",
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredCatalogs.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "#64748b",
                        }}>
                            {searchQuery ? `No catalogs found matching "${searchQuery}"` : "No catalogs available"}
                        </div>
                    ) : (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                        }}>
                            {filteredCatalogs.map((catalog) => (
                                <div
                                    key={catalog.name}
                                    style={{
                                        background: "white",
                                        borderRadius: "0.75rem",
                                        padding: "1rem 1.25rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "1rem",
                                        transition: "all 0.2s ease",
                                        border: "1px solid #e2e8f0",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "#cbd5e1";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "#e2e8f0";
                                    }}
                                >
                                    {/* PDF Icon */}
                                    <div style={{
                                        width: "48px",
                                        height: "48px",
                                        background: "#fef2f2",
                                        borderRadius: "0.5rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <div style={{
                                            width: "32px",
                                            height: "32px",
                                            background: "#fee2e2",
                                            borderRadius: "0.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: "1px solid #fecaca",
                                        }}>
                                            <span style={{
                                                color: "#dc2626",
                                                fontWeight: "700",
                                                fontSize: "0.6rem",
                                            }}>PDF</span>
                                        </div>
                                    </div>

                                    {/* Catalog Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: "0.95rem",
                                            fontWeight: "600",
                                            color: "#1e293b",
                                        }}>
                                            {catalog.displayName}
                                        </h3>
                                        <p style={{
                                            margin: "0.25rem 0 0",
                                            fontSize: "0.8rem",
                                            color: "#64748b",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.25rem",
                                        }}>
                                            <span style={{ fontSize: "0.7rem" }}>📄</span>
                                            {formatFileSize(catalog.size)}
                                        </p>
                                    </div>

                                    {/* Download Button */}
                                    <button
                                        onClick={() => handleDownload(catalog)}
                                        disabled={downloading === catalog.name}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            background: downloading === catalog.name ? "#94a3b8" : "#3b82f6",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "0.5rem",
                                            cursor: downloading === catalog.name ? "not-allowed" : "pointer",
                                            fontWeight: "500",
                                            fontSize: "0.8rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            transition: "all 0.2s ease",
                                            flexShrink: 0,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (downloading !== catalog.name) {
                                                e.currentTarget.style.background = "#2563eb";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (downloading !== catalog.name) {
                                                e.currentTarget.style.background = "#3b82f6";
                                            }
                                        }}
                                    >
                                        {downloading === catalog.name ? (
                                            <>
                                                <span style={{
                                                    width: "14px",
                                                    height: "14px",
                                                    border: "2px solid rgba(255,255,255,0.3)",
                                                    borderTopColor: "white",
                                                    borderRadius: "50%",
                                                    animation: "spin 1s linear infinite",
                                                }} />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                View

                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
}
