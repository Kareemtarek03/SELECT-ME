import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  Spinner,
  Alert,
  Table,
  Stack,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";

export default function FanDataPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fans, setFans] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFan, setSelectedFan] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("process.env.REACT_APP_API_BASE_URL",process.env.REACT_APP_API_BASE_URL)
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/fan-data/fan-data`
      );
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${text}`);
      }
      console.log("resp",resp)
      const data = await resp.json();
      const rawList = Array.isArray(data) ? data : data.data || [];
      // API may return array fields as JSON strings (e.g. from SQLite); parse so table can use them
      const SERIES_KEYS = ["airFlow", "totPressure", "staticPressure", "velPressure", "fanInputPow"];
      const list = rawList.map((item) => {
        const out = { ...item };
        SERIES_KEYS.forEach((k) => {
          if (typeof out[k] === "string") {
            try {
              const parsed = JSON.parse(out[k]);
              if (Array.isArray(parsed)) out[k] = parsed;
            } catch (_) {}
          }
        });
        return out;
      });
      setFans(list);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load fan data");
      setFans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (v) => {
    if (v === null || v === undefined) return "";
    if (Array.isArray(v))
      return v
        .map((n) =>
          typeof n === "number"
            ? n.toLocaleString(undefined, { maximumFractionDigits: 6 })
            : String(n)
        )
        .join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    if (typeof v === "number")
      return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
    return String(v);
  };
  const downloadFanTemplate = async () => {
    // expects pre-made file at /templates/FanData-template.xlsx in the client public folder
    try {
      const urlPath = `${
        process.env.PUBLIC_URL || ""
      }/templates/Fan-Data-Template.xlsx`;
      const resp = await fetch(urlPath);
      if (!resp.ok) throw new Error(`Template not found: ${resp.status}`);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Fan-Data-Template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setImportMessage(err.message || "Failed to download template");
    }
  };

  const handleDelete = async (fanId) => {
    try {
      setDeletingIds((s) => [...s, fanId]);
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/fan-data/${fanId}`,
        { method: "DELETE" }
      );
      if (!resp.ok) {
        const j = await resp.json().catch(() => null);
        throw new Error(j?.error || resp.statusText || "Delete failed");
      }
      // refresh list
      await fetchData();
      setOpenDialog(false);
      setSelectedFan(null);
    } catch (err) {
      console.error(err);
      setImportMessage(err.message || "Delete failed");
    } finally {
      setDeletingIds((s) => s.filter((x) => x !== fanId));
    }
  };
  // Build table: one row per fan. For each series list create columns named "title - index"
  const seriesKeysUnion = Array.from(
    new Set(
      fans.flatMap((item) =>
        Object.keys(item).filter(
          (k) => Array.isArray(item[k]) && item[k].length
        )
      )
    )
  );

  // determine maximum length per series key across all fans
  const seriesKeyMaxLen = seriesKeysUnion.reduce((acc, k) => {
    acc[k] = Math.max(
      ...fans.map((f) => (Array.isArray(f[k]) ? f[k].length : 0)),
      0
    );
    return acc;
  }, {});

  // columns for series elements: e.g., "airFlow - 1", "airFlow - 2", ...
  const seriesColumns = seriesKeysUnion.flatMap((k) =>
    Array.from({ length: seriesKeyMaxLen[k] || 0 }).map((_, i) => {
      if (k == "airFlow") return `Air Flow - ${i + 1}`;
      else if (k == "totPressure") return `Total Pressure - ${i + 1}`;
      else if (k == "staticPressure") return `Static Pressure - ${i + 1}`;
      else if (k == "velPressure") return `Velocity Pressure - ${i + 1}`;
      else if (k == "fanInputPow") return `Fan Input Power - ${i + 1}`;
      else return `${k} - ${i + 1}`;
    })
  );

  // rows: one per fan. If Id missing, make a temporary auto-increment id (1-based index)
  const rows = fans.map((item, fanIdx) => {
    const row = {
      FanModel: item.FanModel || "",
      Id: item.Id != null && item.Id !== "" ? item.Id : fanIdx + 1,
      RPM: item.RPM,
      // Add other fields as necessary
      Blades: item.Blades || {},
      Impeller: item.Impeller || {},
      desigDensity: item.desigDensity,
    };

    seriesKeysUnion.forEach((k) => {
      const arr = Array.isArray(item[k]) ? item[k] : [];
      const max = seriesKeyMaxLen[k] || 0;
      for (let i = 0; i < max; i++) {
        row[
          k == "airFlow"
            ? `Air Flow - ${i + 1}`
            : k == "totPressure"
            ? `Total Pressure - ${i + 1}`
            : k == "staticPressure"
            ? `Static Pressure - ${i + 1}`
            : k == "velPressure"
            ? `Velocity Pressure - ${i + 1}`
            : k == "fanInputPow"
            ? `Fan Input Power - ${i + 1}`
            : `${k} - ${i + 1}`
        ] = i < arr.length ? arr[i] : undefined;
      }
    });

    return row;
  });

  // pagination (rows are fans)
  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, totalRows);
  const pageRows = rows.slice(start, end);

  return (
    <Box p={4} bg="#f8fafc" color="#1e293b">
      <Heading mb={4} fontSize={"4xl"} textAlign={"center"} color="#1e293b">
        Fan Data
      </Heading>

      <Stack direction={"row"} justifyContent={"space-between"}>
        <Box mb={4} display="flex" gap={2} alignItems="center">
          <Button
            size="sm"
            bg="#3b82f6"
            color="white"
            _hover={{ bg: "#2563eb" }}
            onClick={fetchData}
            isDisabled={loading}
          >
            Refresh
          </Button>
          {loading && <Spinner size="sm" />}
        </Box>

        <Box mb={4} display="flex" gap={2} alignItems="center">
          <Button
            size="sm"
            bg="#059669"
            color="white"
            _hover={{ bg: "#047857" }}
            onClick={downloadFanTemplate}
          >
            Download Template
          </Button>
          <Button
            size="sm"
            bg="#3b82f6"
            color="white"
            _hover={{ bg: "#2563eb" }}
            onClick={() =>
              document.getElementById("fandata-file-input")?.click()
            }
            isDisabled={uploading}
          >
            {uploading ? "Importing..." : "Import Fan Data"}
          </Button>
          <Input
            id="fandata-file-input"
            type="file"
            display="none"
            accept=".xlsx,.xls,.csv"
            onChange={async (e) => {
              const f = e.target.files && e.target.files[0];
              e.target.value = "";
              if (!f) return;
              try {
                setUploading(true);
                setImportMessage(null);
                const dataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(f);
                });
                const base64 = String(dataUrl).split(",")[1] || "";
                const resp = await fetch(
                  `${process.env.REACT_APP_API_BASE_URL}/api/fan-data/upload`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fileBase64: base64,
                      filename: f.name,
                    }),
                  }
                );
                const json = await resp.json().catch(() => ({}));
                if (!resp.ok)
                  throw new Error(
                    json?.error ||
                      json?.details ||
                      resp.statusText ||
                      "Import failed"
                  );
                setImportMessage("Import successful");
                await fetchData();
              } catch (err) {
                console.error(err);
                setImportMessage(err.message || "Import failed");
              } finally {
                setUploading(false);
              }
            }}
          />

          <Button
            size="sm"
            bg="#3b82f6"
            color="white"
            isLoading={downloading}
            _hover={{ bg: "#2563eb" }}
            onClick={async () => {
              try {
                setDownloading(true);
                setExportMessage(null);
                const resp = await fetch(
                  `${process.env.REACT_APP_API_BASE_URL}/api/fan-data/export`
                );
                if (!resp.ok) {
                  const txt = await resp.text().catch(() => null);
                  throw new Error(txt || resp.statusText || "Export failed");
                }
                const cd = resp.headers.get("content-disposition");
                let filename = "FanData-export.xlsx";

                if (cd) {
                  const m = cd.match(
                    /filename\*=UTF-8''(.+)$|filename="?([^";]+)"?/i
                  );
                  if (m) {
                    filename = decodeURIComponent(
                      (m[1] || m[2] || filename).trim()
                    );
                  }
                }

                const blob = await resp.blob();
                if (blob.type.includes("json")) {
                  const err = await blob.text();
                  throw new Error(err);
                }

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setExportMessage("Export downloaded");
              } catch (err) {
                console.error(err);
                setExportMessage(err.message || "Export failed");
              } finally {
                setDownloading(false);
              }
            }}
          >
            Export Fan Data
          </Button>
        </Box>
      </Stack>

      {importMessage && (
        <Alert.Root
          status={/successful/i.test(importMessage) ? "success" : "error"}
          mb={4}
        >
          <Alert.Title>
            {/successful/i.test(importMessage) ? "Success" : "Error"}
          </Alert.Title>
          <Alert.Description>{importMessage}</Alert.Description>
        </Alert.Root>
      )}
      {exportMessage && (
        <Alert.Root
          status={/downloaded/i.test(exportMessage) ? "success" : "error"}
          mb={4}
        >
          <Alert.Title>
            {/downloaded/i.test(exportMessage) ? "Success" : "Error"}
          </Alert.Title>
          <Alert.Description>{exportMessage}</Alert.Description>
        </Alert.Root>
      )}

      

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      )}

      {!loading && fans.length === 0 && !error && (
        <Text>No fan data returned.</Text>
      )}

      {!loading && fans.length > 0 && (
        <>
          <Text mb={2} fontSize="sm">
            Showing {start + 1} - {end} of {totalRows} fans
          </Text>

          <Box
            className="admin-table-container"
            overflowX="auto"
            borderWidth="1px"
            borderRadius="lg"
            borderColor="#e2e8f0"
            bg="#ffffff"
            boxShadow="0 1px 3px rgba(0,0,0,0.08)"
          >
            <Table.Root bg="transparent" w={"max-content"}>
              <Table.Header bg="#f1f5f9" color="#1e293b">
                <Table.Row bg="#f1f5f9" color="#1e293b">
                  <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1">
                    Actions
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1">Id</Table.ColumnHeader>
                  <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1">
                    Designated Density
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    borderRight="1px solid #e2e8f0"
                    color="#1e293b"
                    fontWeight="600"
                    borderBottom="2px solid #cbd5e1"
                  >
                    Speed (RPM)
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1">
                    Blade Symbol
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1">
                    Blade Material
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1">
                    Blade Angle
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    borderRight="1px solid #e2e8f0"
                    color="#1e293b"
                    fontWeight="600"
                    borderBottom="2px solid #cbd5e1"
                  >
                    Number of Blades
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1">
                    Impeller Inner Diameter
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    borderRight="1px solid #e2e8f0"
                    color="#1e293b"
                    fontWeight="600"
                    borderBottom="2px solid #cbd5e1"
                  >
                    Impeller Configuration
                  </Table.ColumnHeader>
                  {seriesColumns.map((col) => {
                    const end = col.endsWith("10");
                    return (
                      <Table.ColumnHeader
                        borderRight={end ? "1px solid #e2e8f0" : "none"}
                        color="#1e293b"
                        fontWeight="600"
                        borderBottom="2px solid #cbd5e1"
                        key={col}
                      >
                        {col}
                      </Table.ColumnHeader>
                    );
                  })}
                </Table.Row>
              </Table.Header>

              <Table.Body borderColor="#e2e8f0">
                {pageRows.map((r, idx) => {
                  const rowBg = idx % 2 === 0 ? "#f8fafc" : "#ffffff";
                  // Show row if it has an Id (or at least one series value when we have series columns)
                  const hasId = r.Id != null && r.Id !== "";
                  const hasSeriesData =
                    seriesColumns.length === 0 ||
                    seriesColumns.some((col) => {
                      const v = r[col];
                      return v != null && v !== "" && v !== "-";
                    });
                  if (!hasId && !hasSeriesData) return null;
                  return (
                    <Table.Row
                      bg={rowBg}
                      color="#1e293b"
                      key={`${r.Id}-${idx}`}
                      _hover={{ bg: "#f1f5f9" }}
                    >
                      <Table.Cell borderColor="#e2e8f0">
                        {(() => {
                          const fanId = r.Id ?? null;
                          if (!fanId) return "-";
                          const isDeleting = deletingIds.includes(fanId);
                          return (
                            <Button
                              size="xs"
                              bg="#1e293b"
                              color="white"
                              _hover={{ bg: "#0f172a" }}
                              isLoading={isDeleting}
                              onClick={() => {
                                setSelectedFan({ id: fanId, row: r });
                                setOpenDialog(true);
                              }}
                            >
                              Delete
                            </Button>
                          );
                        })()}
                      </Table.Cell>
                      <Table.Cell borderColor="#e2e8f0">
                        {formatValue(r.Id)}
                      </Table.Cell>
                      <Table.Cell borderBottomColor="#e2e8f0">
                        {formatValue(r.desigDensity)}
                      </Table.Cell>
                      <Table.Cell
                        borderRight="1px solid #e2e8f0"
                        borderBottomColor="#e2e8f0"
                      >
                        {formatValue(r.RPM)}
                      </Table.Cell>
                      <Table.Cell borderColor="#e2e8f0">
                        {formatValue(r.Blades.symbol)}
                      </Table.Cell>
                      <Table.Cell borderColor="#e2e8f0">
                        {formatValue(r.Blades.material)}
                      </Table.Cell>
                      <Table.Cell borderColor="#e2e8f0">
                        {formatValue(r.Blades.angle)}
                      </Table.Cell>
                      <Table.Cell
                        borderRight="1px solid #e2e8f0"
                        borderBottomColor="#e2e8f0"
                      >
                        {formatValue(r.Blades.noBlades)}
                      </Table.Cell>
                      <Table.Cell borderColor="#e2e8f0">
                        {formatValue(r.Impeller.innerDia)}
                      </Table.Cell>
                      <Table.Cell
                        borderRight="1px solid #e2e8f0"
                        borderBottomColor="#e2e8f0"
                      >
                        {formatValue(r.Impeller.conf)}
                      </Table.Cell>

                      {seriesColumns.map((col) => {
                        const end = col.endsWith("10");
                        return (
                          <Table.Cell
                            borderRight={end ? "1px solid #e2e8f0" : "none"}
                            borderBottomColor="#e2e8f0"
                            key={col}
                          >
                            {formatValue(r[col])}
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>

          <Box mt={3} display="flex" alignItems="center" gap={3}>
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              isDisabled={page === 0}
              bg="#3b82f6"
              color="white"
              _hover={{ bg: "#2563eb" }}
            >
              Prev
            </Button>
            <Text fontSize="sm" color="#1e293b">
              Page {page + 1} of {totalPages}
            </Text>
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              isDisabled={page >= totalPages - 1}
              bg="#3b82f6"
              color="white"
              _hover={{ bg: "#2563eb" }}
            >
              Next
            </Button>
          </Box>
        </>
      )}
      <Dialog.Root open={openDialog}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="#ffffff" color="#1e293b" border="1px solid #e2e8f0" boxShadow="0 4px 12px rgba(0,0,0,0.15)">
              <Dialog.Header>
                <Dialog.Title color="#1e293b">Delete Fan Data</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {selectedFan ? (
                  <Text color="#64748b">
                    Are you sure you want to delete fan ID{" "}
                    <strong>{selectedFan.id}</strong>? This cannot be undone.
                  </Text>
                ) : (
                  <Text color="#64748b">No fan selected.</Text>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button
                    bg="#e2e8f0"
                    color="#1e293b"
                    _hover={{ bg: "#cbd5e1" }}
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  bg="#1e293b"
                  color="white"
                  _hover={{ bg: "#0f172a" }}
                  onClick={() => handleDelete(selectedFan?.id)}
                  isLoading={
                    selectedFan && deletingIds.includes(selectedFan.id)
                  }
                >
                  Delete
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="#1e293b"
                  _hover={{ bg: "#f1f5f9" }}
                  onClick={() => setOpenDialog(false)}
                />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
