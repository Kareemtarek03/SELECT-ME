import React, { useState, useEffect } from "react";
import {
    Box,
    Text,
    Heading,
    Table,
    Button,
    Input,
    Spinner,
    Badge,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

export default function PricingItemsTab() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState(null);
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        sr: "",
        description: "",
        unit: "",
        updatedDate: "",
        priceWithoutVat: "",
        priceWithVat: "",
    });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchPricingData();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    const fetchPricingData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/api/pricing/categories/name/axial_pricing`,
                { headers: getAuthHeaders() }
            );

            if (response.status === 401) {
                navigate("/login");
                return;
            }

            if (response.status === 403) {
                setAlert({ type: "error", message: "Access denied. Admin only." });
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setCategory(data);
                setItems(data.items || []);
            } else {
                setAlert({ type: "error", message: "Failed to fetch pricing data" });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setAlert({ type: "error", message: "Failed to connect to server" });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditForm({
            sr: item.sr,
            description: item.description,
            unit: item.unit,
            updatedDate: item.updatedDate || "",
            priceWithoutVat: item.priceWithoutVat || "",
            priceWithVat: item.priceWithVat || "",
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/pricing/items/${id}`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                const updatedItem = await response.json();
                setItems(items.map((item) => (item.id === id ? updatedItem : item)));
                setEditingId(null);
                setEditForm({});
                setAlert({ type: "success", message: "Item updated successfully" });
            } else {
                const error = await response.json();
                setAlert({ type: "error", message: error.error || "Failed to update item" });
            }
        } catch (error) {
            console.error("Update error:", error);
            setAlert({ type: "error", message: "Failed to update item" });
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/pricing/items/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setItems(items.filter((item) => item.id !== id));
                setDeleteConfirm(null);
                setAlert({ type: "success", message: "Item deleted successfully" });
            } else {
                const error = await response.json();
                setAlert({ type: "error", message: error.error || "Failed to delete item" });
            }
        } catch (error) {
            console.error("Delete error:", error);
            setAlert({ type: "error", message: "Failed to delete item" });
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/pricing/items/template/download?categoryName=axial_pricing`,
                { headers: getAuthHeaders() }
            );
            if (!response.ok) throw new Error("Download failed");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "PricingItems-axial_pricing-template.xlsx";
            a.click();
            window.URL.revokeObjectURL(url);
            setAlert({ type: "success", message: "Template downloaded" });
        } catch (e) {
            setAlert({ type: "error", message: e.message || "Failed to download template" });
        }
    };

    const handleImportTemplate = async (e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result?.split(",")?.[1];
                if (!base64) {
                    setAlert({ type: "error", message: "Could not read file" });
                    return;
                }
                const response = await fetch(`${API_BASE_URL}/api/pricing/items/import`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        fileBase64: base64,
                        filename: file.name,
                        categoryName: "axial_pricing",
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    setAlert({
                        type: "success",
                        message: data.message || `${data.updated} item(s) updated`,
                    });
                    fetchPricingData();
                } else {
                    setAlert({ type: "error", message: data.error || "Import failed" });
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setAlert({ type: "error", message: err.message || "Import failed" });
        }
        e.target.value = "";
    };

    const handleAddItem = async () => {
        if (!newItem.sr || !newItem.description || !newItem.unit) {
            setAlert({ type: "error", message: "Sr, Description, and Unit are required" });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/pricing/items`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...newItem,
                    categoryId: category.id,
                }),
            });

            if (response.ok) {
                const createdItem = await response.json();
                setItems([...items, createdItem].sort((a, b) => a.sr - b.sr));
                setShowAddForm(false);
                setNewItem({
                    sr: "",
                    description: "",
                    unit: "",
                    updatedDate: "",
                    priceWithoutVat: "",
                    priceWithVat: "",
                });
                setAlert({ type: "success", message: "Item added successfully" });
            } else {
                const error = await response.json();
                setAlert({ type: "error", message: error.error || "Failed to add item" });
            }
        } catch (error) {
            console.error("Add error:", error);
            setAlert({ type: "error", message: "Failed to add item" });
        }
    };

    if (loading) {
        return (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                py={20}
            >
                <Spinner size="xl" color="#3b82f6" />
            </Box>
        );
    }

    return (
        <Box>
            {/* Alert */}
            {alert && (
                <Box
                    bg={alert.type === "success" ? "#10b98120" : "#ef444420"}
                    border="1px solid"
                    borderColor={alert.type === "success" ? "#10b981" : "#ef4444"}
                    borderRadius="lg"
                    p={4}
                    mb={4}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Text color={alert.type === "success" ? "#10b981" : "#ef4444"}>
                        {alert.message}
                    </Text>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAlert(null)}
                        color={alert.type === "success" ? "#10b981" : "#ef4444"}
                    >
                        ✕
                    </Button>
                </Box>
            )}

            {/* Header with Add Button */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
            >
                <Box display="flex" alignItems="center" gap={3}>
                    {category && (
                        <>
                            <Badge bg="#3b82f620" color="#3b82f6" px={3} py={1} borderRadius="md">
                                {category.displayName}
                            </Badge>
                            <Text color="#64748b" fontSize="sm">
                                {items.length} items
                            </Text>
                        </>
                    )}
                </Box>
                <Box display="flex" gap={2} alignItems="center">
                    <Button
                        bg="#3b82f6"
                        color="white"
                        _hover={{ bg: "#2563eb" }}
                        leftIcon={<FaPlus />}
                        onClick={() => setShowAddForm(true)}
                    >
                        Add Item
                    </Button>
                    <Button
                        size="sm"
                        bg="#059669"
                        color="white"
                        _hover={{ bg: "#047857" }}
                        onClick={handleDownloadTemplate}
                    >
                        Download Template
                    </Button>
                    <Button
                        size="sm"
                        as="label"
                        bg="#0ea5e9"
                        color="white"
                        _hover={{ bg: "#0284c7" }}
                        sx={{ cursor: "pointer" }}
                    >
                        Import Template
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            hidden
                            onChange={handleImportTemplate}
                        />
                    </Button>
                </Box>
            </Box>

            {/* Add Item Form */}
            {showAddForm && (
                <Box
                    bg="#ffffff"
                    borderRadius="lg"
                    border="1px solid #e2e8f0"
                    p={6}
                    mb={6}
                    boxShadow="0 1px 3px rgba(0,0,0,0.08)"
                >
                    <Heading as="h3" size="md" color="#1e293b" mb={4}>
                        Add New Pricing Item
                    </Heading>
                    <Box display="grid" gridTemplateColumns="repeat(6, 1fr)" gap={4}>
                        <Input
                            placeholder="Sr."
                            value={newItem.sr}
                            onChange={(e) => setNewItem({ ...newItem, sr: e.target.value })}
                            bg="#f8fafc"
                            color="#1e293b"
                            border="1px solid #e2e8f0"
                            _placeholder={{ color: "#64748b" }}
                        />
                        <Input
                            placeholder="Description"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            bg="#f8fafc"
                            color="#1e293b"
                            border="1px solid #e2e8f0"
                            _placeholder={{ color: "#64748b" }}
                            gridColumn="span 2"
                        />
                        <Input
                            placeholder="Unit"
                            value={newItem.unit}
                            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                            bg="#f8fafc"
                            color="#1e293b"
                            border="1px solid #e2e8f0"
                            _placeholder={{ color: "#64748b" }}
                        />
                        <Input
                            placeholder="Price w/o VAT"
                            type="number"
                            value={newItem.priceWithoutVat}
                            onChange={(e) => setNewItem({ ...newItem, priceWithoutVat: e.target.value })}
                            bg="#f8fafc"
                            color="#1e293b"
                            border="1px solid #e2e8f0"
                            _placeholder={{ color: "#64748b" }}
                        />
                        <Input
                            placeholder="Price with VAT"
                            type="number"
                            value={newItem.priceWithVat}
                            onChange={(e) => setNewItem({ ...newItem, priceWithVat: e.target.value })}
                            bg="#f8fafc"
                            color="#1e293b"
                            border="1px solid #e2e8f0"
                            _placeholder={{ color: "#64748b" }}
                        />
                    </Box>
                    <Box display="flex" gap={3} mt={4}>
                        <Button
                            bg="#059669"
                            color="white"
                            _hover={{ bg: "#047857" }}
                            leftIcon={<FaSave />}
                            onClick={handleAddItem}
                        >
                            Save
                        </Button>
                        <Button
                            bg="#e2e8f0"
                            color="#1e293b"
                            _hover={{ bg: "#cbd5e1" }}
                            leftIcon={<FaTimes />}
                            onClick={() => setShowAddForm(false)}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Pricing Table */}
            <Box
                className="admin-table-container"
                borderWidth="1px"
                borderRadius="lg"
                borderColor="#e2e8f0"
                bg="#ffffff"
                overflow="hidden"
                boxShadow="0 1px 3px rgba(0,0,0,0.08)"
            >
                <Table.Root bg="transparent" w="100%">
                    <Table.Header bg="#f1f5f9" color="#1e293b">
                        <Table.Row bg="#f1f5f9" color="#1e293b">
                            <Table.ColumnHeader color="#1e293b" fontWeight="600" borderRight="1px solid #e2e8f0" borderBottom="2px solid #cbd5e1" py={3} px={4} textAlign="center">
                                Sr.
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="#1e293b" fontWeight="600" borderRight="1px solid #e2e8f0" borderBottom="2px solid #cbd5e1" py={3} px={4} textAlign="center">
                                Description
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="#1e293b" fontWeight="600" borderRight="1px solid #e2e8f0" borderBottom="2px solid #cbd5e1" py={3} px={4} textAlign="center">
                                Unit
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="#1e293b" fontWeight="600" borderRight="1px solid #e2e8f0" borderBottom="2px solid #cbd5e1" py={3} px={4} textAlign="center">
                                Updated Date
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="#1e293b" fontWeight="600" borderRight="1px solid #e2e8f0" borderBottom="2px solid #cbd5e1" py={3} px={4} textAlign="center">
                                Price w/o VAT
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="#1e293b" fontWeight="600" borderRight="1px solid #e2e8f0" borderBottom="2px solid #cbd5e1" py={3} px={4} textAlign="center">
                                Price with VAT
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1" py={3} px={4} textAlign="center">
                                Actions
                            </Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body borderColor="#e2e8f0">
                        {items.map((item, idx) => {
                            const rowBg = idx % 2 === 0 ? "#f8fafc" : "#ffffff";
                            return (
                                <Table.Row
                                    key={item.id}
                                    bg={rowBg}
                                    color="#1e293b"
                                    _hover={{ bg: "#f1f5f9" }}
                                >
                                    {editingId === item.id ? (
                                        <>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" py={3} px={4}>
                                                <Input
                                                    size="sm"
                                                    value={editForm.sr}
                                                    onChange={(e) => setEditForm({ ...editForm, sr: e.target.value })}
                                                    bg="#f8fafc"
                                                    color="#1e293b"
                                                    border="1px solid #e2e8f0"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" py={3} px={4}>
                                                <Input
                                                    size="sm"
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    bg="#f8fafc"
                                                    color="#1e293b"
                                                    border="1px solid #e2e8f0"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" py={3} px={4}>
                                                <Input
                                                    size="sm"
                                                    value={editForm.unit}
                                                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                                    bg="#f8fafc"
                                                    color="#1e293b"
                                                    border="1px solid #e2e8f0"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" py={3} px={4}>
                                                <Input
                                                    size="sm"
                                                    value={editForm.updatedDate}
                                                    onChange={(e) => setEditForm({ ...editForm, updatedDate: e.target.value })}
                                                    bg="#f8fafc"
                                                    color="#1e293b"
                                                    border="1px solid #e2e8f0"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" py={3} px={4}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    value={editForm.priceWithoutVat}
                                                    onChange={(e) => setEditForm({ ...editForm, priceWithoutVat: e.target.value })}
                                                    bg="#f8fafc"
                                                    color="#1e293b"
                                                    border="1px solid #e2e8f0"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" py={3} px={4}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    value={editForm.priceWithVat}
                                                    onChange={(e) => setEditForm({ ...editForm, priceWithVat: e.target.value })}
                                                    bg="#f8fafc"
                                                    color="#1e293b"
                                                    border="1px solid #e2e8f0"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" py={3} px={4}>
                                                <Box display="flex" gap={2}>
                                                    <Button
                                                        size="xs"
                                                        bg="#059669"
                                                        color="white"
                                                        _hover={{ bg: "#047857" }}
                                                        onClick={() => handleSaveEdit(item.id)}
                                                    >
                                                        <FaSave />
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        bg="#e2e8f0"
                                                        color="#1e293b"
                                                        _hover={{ bg: "#cbd5e1" }}
                                                        onClick={handleCancelEdit}
                                                    >
                                                        <FaTimes />
                                                    </Button>
                                                </Box>
                                            </Table.Cell>
                                        </>
                                    ) : (
                                        <>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" color="#1e293b" py={3} px={4} textAlign="center">
                                                {item.sr}
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" color="#1e293b" py={3} px={4} textAlign="center">
                                                {item.description}
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" color="#1e293b" py={3} px={4} textAlign="center">
                                                {item.unit}
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" color="#1e293b" py={3} px={4} textAlign="center">
                                                {item.updatedDate || "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" color="#1e293b" py={3} px={4} textAlign="center">
                                                {item.priceWithoutVat != null ? item.priceWithoutVat.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" borderRight="1px solid #e2e8f0" color="#1e293b" py={3} px={4} textAlign="center">
                                                {item.priceWithVat != null ? item.priceWithVat.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="#e2e8f0" color="#1e293b" py={3} px={4} textAlign="center">
                                                <Box display="flex" gap={2} justifyContent="center">
                                                    <Button
                                                        size="xs"
                                                        bg="#3b82f6"
                                                        color="white"
                                                        _hover={{ bg: "#2563eb" }}
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        bg="#dc2626"
                                                        color="white"
                                                        _hover={{ bg: "#b91c1c" }}
                                                        onClick={() => setDeleteConfirm(item.id)}
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </Box>
                                            </Table.Cell>
                                        </>
                                    )}
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table.Root>
            </Box>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0, 0, 0, 0.5)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={1000}
                >
                    <Box
                        bg="#ffffff"
                        borderRadius="lg"
                        border="1px solid #e2e8f0"
                        p={6}
                        maxW="400px"
                        w="90%"
                        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
                    >
                        <Heading as="h3" size="md" color="#1e293b" mb={4}>
                            Confirm Delete
                        </Heading>
                        <Text color="#64748b" mb={6}>
                            Are you sure you want to delete this pricing item? This action cannot be undone.
                        </Text>
                        <Box display="flex" gap={3} justifyContent="flex-end">
                            <Button
                                bg="#e2e8f0"
                                color="#1e293b"
                                _hover={{ bg: "#cbd5e1" }}
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                bg="#dc2626"
                                color="white"
                                _hover={{ bg: "#b91c1c" }}
                                onClick={() => handleDelete(deleteConfirm)}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
