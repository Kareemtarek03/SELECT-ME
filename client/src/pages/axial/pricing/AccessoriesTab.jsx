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
import ExportImportButtons from "../../../components/ExportImportButtons";

import { API_BASE as API_BASE_URL } from "../../../utils/api";

export default function AccessoriesTab() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        sr: "",
        fanModel: "",
        fanSizeMm: "",
        vinylStickersLe: "",
        namePlateLe: "",
        packingLe: "",
        labourCostLe: "",
        internalTransportationLe: "",
        boltsAndNutsKg: "",
    });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [alert, setAlert] = useState(null);
    const [boltsPrice, setBoltsPrice] = useState(0);

    useEffect(() => {
        fetchData();
        fetchBoltsPrice();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/api/accessories-pricing`,
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
                setItems(data || []);
            } else {
                setAlert({ type: "error", message: "Failed to fetch accessories data" });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setAlert({ type: "error", message: "Failed to connect to server" });
        } finally {
            setLoading(false);
        }
    };

    const fetchBoltsPrice = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/accessories-pricing/bolts-price`,
                { headers: getAuthHeaders() }
            );
            if (response.ok) {
                const data = await response.json();
                setBoltsPrice(data.price || 0);
            }
        } catch (error) {
            console.error("Error fetching bolts price:", error);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditForm({
            sr: item.sr,
            fanModel: item.fanModel,
            fanSizeMm: item.fanSizeMm,
            vinylStickersLe: item.vinylStickersLe || "",
            namePlateLe: item.namePlateLe || "",
            packingLe: item.packingLe || "",
            labourCostLe: item.labourCostLe || "",
            internalTransportationLe: item.internalTransportationLe || "",
            boltsAndNutsKg: item.boltsAndNutsKg || "",
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/accessories-pricing/${id}`, {
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
            const response = await fetch(`${API_BASE_URL}/api/accessories-pricing/${id}`, {
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

    const handleAddItem = async () => {
        if (!newItem.sr || !newItem.fanModel || !newItem.fanSizeMm) {
            setAlert({ type: "error", message: "Sr, Fan Model, and Fan Size are required" });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/accessories-pricing`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(newItem),
            });

            if (response.ok) {
                const createdItem = await response.json();
                setItems([...items, createdItem].sort((a, b) => {
                    if (a.fanModel !== b.fanModel) return a.fanModel.localeCompare(b.fanModel);
                    return a.fanSizeMm - b.fanSizeMm;
                }));
                setShowAddForm(false);
                setNewItem({
                    sr: "",
                    fanModel: "",
                    fanSizeMm: "",
                    vinylStickersLe: "",
                    namePlateLe: "",
                    packingLe: "",
                    labourCostLe: "",
                    internalTransportationLe: "",
                    boltsAndNutsKg: "",
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

    // Calculate preview price with VAT for display
    const calculatePreviewPrice = (data) => {
        const vinyl = parseFloat(data.vinylStickersLe) || 0;
        const namePlate = parseFloat(data.namePlateLe) || 0;
        const packing = parseFloat(data.packingLe) || 0;
        const labour = parseFloat(data.labourCostLe) || 0;
        const transport = parseFloat(data.internalTransportationLe) || 0;
        const boltsKg = parseFloat(data.boltsAndNutsKg) || 0;

        return (vinyl + namePlate + packing + labour + transport + (boltsKg * boltsPrice)).toFixed(2);
    };

    if (loading) {
        return (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                py={20}
            >
                <Spinner size="xl" color="var(--btn-secondary)" />
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
                <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                    <Badge bg="var(--badge-secondary-bg)" color="var(--btn-secondary)" px={3} py={1} borderRadius="md">
                        Accessories
                    </Badge>
                    <ExportImportButtons exportPath="/api/centrifugal/data/export/accessory-pricing" importPath="/api/centrifugal/data/import/accessory-pricing" onImportDone={fetchData} />
                    <Text color="var(--text-muted)" fontSize="sm">
                        {items.length} items
                    </Text>
                    <Text color="var(--text-muted)" fontSize="sm">|</Text>
                    <Text color="#f59e0b" fontSize="sm">
                        Bolts & Nuts Price (Sr.24): {boltsPrice.toFixed(2)} L.E/kg
                    </Text>
                </Box>
                <Button
                    bg="var(--btn-secondary)"
                    color="white"
                    _hover={{ bg: "var(--btn-secondary-hover)" }}
                    leftIcon={<FaPlus />}
                    onClick={() => setShowAddForm(true)}
                >
                    Add Item
                </Button>
            </Box>

            {/* Add Item Form */}
            {showAddForm && (
                <Box
                    bg="var(--bg-card)"
                    borderRadius="lg"
                    border="1px solid var(--border-color)"
                    p={6}
                    mb={6}
                >
                    <Heading as="h3" size="md" color="var(--text-primary)" mb={4}>
                        Add New Accessory Item
                    </Heading>
                    <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={4}>
                        <Input
                            placeholder="Sr."
                            value={newItem.sr}
                            onChange={(e) => setNewItem({ ...newItem, sr: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Input
                            placeholder="Fan Model"
                            value={newItem.fanModel}
                            onChange={(e) => setNewItem({ ...newItem, fanModel: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Input
                            placeholder="Fan Size (mm)"
                            type="number"
                            value={newItem.fanSizeMm}
                            onChange={(e) => setNewItem({ ...newItem, fanSizeMm: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Input
                            placeholder="Vinyl Stickers (L.E)"
                            type="number"
                            value={newItem.vinylStickersLe}
                            onChange={(e) => setNewItem({ ...newItem, vinylStickersLe: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Input
                            placeholder="Name Plate (L.E)"
                            type="number"
                            value={newItem.namePlateLe}
                            onChange={(e) => setNewItem({ ...newItem, namePlateLe: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Input
                            placeholder="Packing (L.E)"
                            type="number"
                            value={newItem.packingLe}
                            onChange={(e) => setNewItem({ ...newItem, packingLe: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Input
                            placeholder="Labour Cost (L.E)"
                            type="number"
                            value={newItem.labourCostLe}
                            onChange={(e) => setNewItem({ ...newItem, labourCostLe: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Input
                            placeholder="Internal Transport (L.E)"
                            type="number"
                            value={newItem.internalTransportationLe}
                            onChange={(e) => setNewItem({ ...newItem, internalTransportationLe: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Input
                            placeholder="Bolts & Nuts (kg)"
                            type="number"
                            step="0.01"
                            value={newItem.boltsAndNutsKg}
                            onChange={(e) => setNewItem({ ...newItem, boltsAndNutsKg: e.target.value })}
                            bg="var(--bg-page)"
                            color="var(--text-primary)"
                            border="1px solid var(--border-color)"
                            _placeholder={{ color: "var(--text-muted)" }}
                        />
                        <Box>
                            <Input
                                placeholder="Price with VAT"
                                type="text"
                                value={calculatePreviewPrice(newItem)}
                                bg="var(--bg-card)"
                                color="var(--text-muted)"
                                border="1px solid var(--border-color)"
                                disabled
                                _disabled={{ opacity: 0.7, cursor: "not-allowed" }}
                            />
                            <Text fontSize="xs" color="#f59e0b" mt={1}>
                                Auto-calculated
                            </Text>
                        </Box>
                    </Box>
                    <Box display="flex" gap={3} mt={4}>
                        <Button
                            bg="var(--btn-primary)"
                            color="white"
                            _hover={{ bg: "var(--btn-primary-hover)" }}
                            leftIcon={<FaSave />}
                            onClick={handleAddItem}
                        >
                            Save
                        </Button>
                        <Button
                            variant="outline"
                            borderColor="var(--border-color)"
                            color="var(--text-primary)"
                            _hover={{ bg: "var(--bg-elevated)" }}
                            leftIcon={<FaTimes />}
                            onClick={() => setShowAddForm(false)}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Accessories Table */}
            <Box
                className="admin-table-container"
                borderWidth="1px"
                borderRadius="lg"
                borderColor="var(--border-color)"
                bg="var(--bg-card)"
                overflowX="auto"
                boxShadow="0 1px 3px rgba(0,0,0,0.08)"
            >
                <Table.Root bg="transparent" w="100%">
                    <Table.Header bg="var(--table-header-bg)" color="var(--text-primary)">
                        <Table.Row bg="var(--table-header-bg)" color="var(--text-primary)">
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Sr.
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Fan Model
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Size (mm)
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Vinyl Stickers
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Name Plate
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Packing
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Labour Cost
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Internal Transport
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Bolts & Nuts (kg)
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderRight="1px solid var(--border-color)" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                    Price with VAT
                                    <Badge bg="#f59e0b20" color="#d97706" fontSize="9px" px={1} borderRadius="sm">
                                        Auto
                                    </Badge>
                                </Box>
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--text-primary)" fontWeight="600" borderBottom="2px solid var(--table-header-border)" py={3} px={3} textAlign="center">
                                Actions
                            </Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body borderColor="var(--border-color)">
                        {items.map((item, idx) => {
                            const rowBg = idx % 2 === 0 ? "var(--bg-page)" : "var(--bg-card)";
                            return (
                                <Table.Row
                                    key={item.id}
                                    bg={rowBg}
                                    color="var(--text-primary)"
                                    _hover={{ bg: "var(--bg-elevated)" }}
                                >
                                    {editingId === item.id ? (
                                        <>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    value={editForm.sr}
                                                    onChange={(e) => setEditForm({ ...editForm, sr: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    value={editForm.fanModel}
                                                    onChange={(e) => setEditForm({ ...editForm, fanModel: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    value={editForm.fanSizeMm}
                                                    onChange={(e) => setEditForm({ ...editForm, fanSizeMm: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    value={editForm.vinylStickersLe}
                                                    onChange={(e) => setEditForm({ ...editForm, vinylStickersLe: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    value={editForm.namePlateLe}
                                                    onChange={(e) => setEditForm({ ...editForm, namePlateLe: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    value={editForm.packingLe}
                                                    onChange={(e) => setEditForm({ ...editForm, packingLe: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    value={editForm.labourCostLe}
                                                    onChange={(e) => setEditForm({ ...editForm, labourCostLe: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    value={editForm.internalTransportationLe}
                                                    onChange={(e) => setEditForm({ ...editForm, internalTransportationLe: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.boltsAndNutsKg}
                                                    onChange={(e) => setEditForm({ ...editForm, boltsAndNutsKg: e.target.value })}
                                                    bg="var(--bg-page)"
                                                    color="var(--text-primary)"
                                                    border="1px solid var(--border-color)"
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={2} px={2}>
                                                <Input
                                                    size="sm"
                                                    type="text"
                                                    value={calculatePreviewPrice(editForm)}
                                                    bg="var(--bg-card)"
                                                    color="var(--text-muted)"
                                                    border="1px solid var(--border-color)"
                                                    disabled
                                                    _disabled={{ opacity: 0.7, cursor: "not-allowed" }}
                                                />
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" py={2} px={2}>
                                                <Box display="flex" gap={2}>
                                                    <Button
                                                        size="xs"
                                                        bg="var(--btn-primary)"
                                                        color="white"
                                                        _hover={{ bg: "var(--btn-primary-hover)" }}
                                                        onClick={() => handleSaveEdit(item.id)}
                                                    >
                                                        <FaSave />
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        borderColor="var(--border-color)"
                                                        color="var(--text-primary)"
                                                        _hover={{ bg: "var(--bg-elevated)" }}
                                                        onClick={handleCancelEdit}
                                                    >
                                                        <FaTimes />
                                                    </Button>
                                                </Box>
                                            </Table.Cell>
                                        </>
                                    ) : (
                                        <>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.sr}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.fanModel}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.fanSizeMm}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.vinylStickersLe != null ? item.vinylStickersLe.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.namePlateLe != null ? item.namePlateLe.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.packingLe != null ? item.packingLe.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.labourCostLe != null ? item.labourCostLe.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.internalTransportationLe != null ? item.internalTransportationLe.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                {item.boltsAndNutsKg != null ? item.boltsAndNutsKg.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--success)" py={2} px={3} textAlign="center" fontWeight="bold">
                                                {item.priceWithVatLe != null ? item.priceWithVatLe.toFixed(2) : "-"}
                                            </Table.Cell>
                                            <Table.Cell borderColor="var(--border-color)" color="var(--text-primary)" py={2} px={3} textAlign="center">
                                                <Box display="flex" gap={2} justifyContent="center">
                                                    <Button
                                                        size="xs"
                                                        bg="var(--btn-secondary)"
                                                        color="white"
                                                        _hover={{ bg: "var(--btn-secondary-hover)" }}
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        bg="var(--btn-danger)"
                                                        color="white"
                                                        _hover={{ bg: "var(--btn-danger-hover)" }}
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
                    bg="rgba(0, 0, 0, 0.7)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={1000}
                >
                    <Box
                        bg="var(--bg-card)"
                        borderRadius="lg"
                        border="1px solid var(--border-color)"
                        p={6}
                        maxW="400px"
                        w="90%"
                    >
                        <Heading as="h3" size="md" color="var(--text-primary)" mb={4}>
                            Confirm Delete
                        </Heading>
                        <Text color="var(--text-muted)" mb={6}>
                            Are you sure you want to delete this accessory item? This action cannot be undone.
                        </Text>
                        <Box display="flex" gap={3} justifyContent="flex-end">
                            <Button
                                variant="outline"
                                borderColor="var(--border-color)"
                                color="var(--text-primary)"
                                _hover={{ bg: "var(--bg-elevated)" }}
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                bg="var(--btn-danger)"
                                color="white"
                                _hover={{ bg: "var(--btn-danger-hover)" }}
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
