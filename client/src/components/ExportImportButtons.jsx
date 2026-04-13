import React, { useState, useRef } from "react";
import { Button, Text } from "@chakra-ui/react";
import { FaFileExcel, FaUpload } from "react-icons/fa";

import { API_BASE as API } from "../utils/api";

export default function ExportImportButtons({ exportPath, importPath, onImportDone }) {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleExport = async () => {
    try {
      const r = await fetch(`${API}${exportPath}`);
      if (!r.ok) throw new Error("Export failed");
      const blob = await r.blob();
      const disposition = r.headers.get("Content-Disposition") || "";
      // Match filename from Content-Disposition header (handles both quoted and unquoted)
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/);
      const filename = match ? match[1] : "export.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setMsg(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const r = await fetch(`${API}${importPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: base64 }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Import failed");
      setMsg(`Imported: ${result.created || 0} created, ${result.updated || 0} updated${result.errors?.length ? `, ${result.errors.length} errors` : ""}`);
      if (onImportDone) onImportDone();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <Button size="sm" bg="#16a34a" color="white" _hover={{ bg: "#15803d" }} onClick={handleExport} display="flex" alignItems="center" gap={1}>
        <FaFileExcel /> Export
      </Button>
      <Button size="sm" bg="#2563eb" color="white" _hover={{ bg: "#1d4ed8" }} onClick={() => fileRef.current?.click()} disabled={importing} display="flex" alignItems="center" gap={1}>
        <FaUpload /> {importing ? "Importing..." : "Import"}
      </Button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileChange} />
      {msg && <Text fontSize="xs" color={msg.startsWith("Error") ? "red.400" : "green.400"}>{msg}</Text>}
    </>
  );
}
