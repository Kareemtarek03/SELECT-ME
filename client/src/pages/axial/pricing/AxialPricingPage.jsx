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
    Stack,
    Alert,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

export default function AxialPricingPage() {
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
                bg="var(--bg-page)"
                minH="100vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
                
            >
                <Spinner size="xl" color="var(--accent)" />
            </Box>
        );
    }

    return (
        <Box
            bg="var(--bg-page)"
            minH="100vh"
            
        >
            <Box  w="100%" >
                {/* Alert */}
                {alert && (
                    <Box
                        bg={alert.type === "success" ? "color-mix(in srgb, var(--success) 20%, transparent)" : "color-mix(in srgb, var(--error) 20%, transparent)"}
                        border="1px solid"
                        borderColor={alert.type === "success" ? "var(--success)" : "var(--error)"}
                        borderRadius="lg"
                        p={4}
                        mb={4}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Text color={alert.type === "success" ? "var(--success)" : "var(--error)"}>
                            {alert.message}
                        </Text>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAlert(null)}
                            color={alert.type === "success" ? "var(--success)" : "var(--error)"}
                        >
                            ✕
                        </Button>
                    </Box>
                )}

                {/* Header */}
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    
                >
                    <Box>
                        <Heading
                            as="h1"
                            size="xl"
                            color="var(--text-primary)"
                            fontWeight="bold"
                            mb={2}
                        >
                            Axial Pricing Management
                        </Heading>
                        <Text color="var(--text-muted)" fontSize="md">
                            Manage pricing data for axial fan components and materials
                        </Text>
                    </Box>
                    <Button
                        bg="var(--accent)"
                        color="var(--text-primary)"
                        _hover={{ bg: "var(--accent-hover)" }}
                        leftIcon={<FaPlus />}
                        onClick={() => setShowAddForm(true)}
                    >
                        Add Item
                    </Button>
                </Box>

                {/* Category Info */}
                {category && (
                    <Box
                        bg="var(--bg-card)"
                        borderRadius="lg"
                        border="1px solid var(--border-color)"
                        p={4}
                        mb={6}
                    >
                        <Box display="flex" alignItems="center" gap={3}>
                            <Badge bg="var(--accent)" color="var(--accent)" px={3} py={1} borderRadius="md">
                                {category.displayName}
                            </Badge>
                            <Text color="var(--text-muted-2)" fontSize="sm">
                                {items.length} items
                            </Text>
                        </Box>
                    </Box>
                )}

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
                            Add New Price List Item
                        </Heading>
                        <Box display="grid" gridTemplateColumns="repeat(6, 1fr)" gap={4}>
                            <Input
                                placeholder="Sr."
                                value={newItem.sr}
                                onChange={(e) => setNewItem({ ...newItem, sr: e.target.value })}
                                bg="var(--bg-page)"
                                color="var(--text-primary)"
                                border="1px solid var(--border-color)"
                                _placeholder={{ color: "var(--text-muted-2)" }}
                            />
                            <Input
                                placeholder="Description"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                bg="var(--bg-page)"
                                color="var(--text-primary)"
                                border="1px solid var(--border-color)"
                                _placeholder={{ color: "var(--text-muted-2)" }}
                                gridColumn="span 2"
                            />
                            <Input
                                placeholder="Unit"
                                value={newItem.unit}
                                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                bg="var(--bg-page)"
                                color="var(--text-primary)"
                                border="1px solid var(--border-color)"
                                _placeholder={{ color: "var(--text-muted-2)" }}
                            />
                            <Input
                                placeholder="Price w/o VAT"
                                type="number"
                                value={newItem.priceWithoutVat}
                                onChange={(e) => setNewItem({ ...newItem, priceWithoutVat: e.target.value })}
                                bg="var(--bg-page)"
                                color="var(--text-primary)"
                                border="1px solid var(--border-color)"
                                _placeholder={{ color: "var(--text-muted-2)" }}
                            />
                            <Input
                                placeholder="Price with VAT"
                                type="number"
                                value={newItem.priceWithVat}
                                onChange={(e) => setNewItem({ ...newItem, priceWithVat: e.target.value })}
                                bg="var(--bg-page)"
                                color="var(--text-primary)"
                                border="1px solid var(--border-color)"
                                _placeholder={{ color: "var(--text-muted-2)" }}
                            />
                        </Box>
                        <Box display="flex" gap={3} mt={4}>
                            <Button
                                bg="var(--success)"
                                color="var(--text-primary)"
                                _hover={{ bg: "var(--success-hover)" }}
                                leftIcon={<FaSave />}
                                onClick={handleAddItem}
                            >
                                Save
                            </Button>
                            <Button
                                bg="var(--text-muted-2)"
                                color="var(--text-primary)"
                                _hover={{ bg: "var(--border-color)" }}
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
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="var(--border-color)"
                    bg="var(--bg-card)"
                    overflow="hidden"
                >
                    <Table.Root bg="var(--bg-card)" w="100%">
                        <Table.Header bg="var(--bg-card)" color="var(--text-primary)">
                            <Table.Row bg="var(--bg-card)" color="var(--text-primary)">
                                <Table.ColumnHeader color="var(--text-primary)" borderRight="1px solid var(--border-color)" py={3} px={4} textAlign="center">
                                    Sr.
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--text-primary)" borderRight="1px solid var(--border-color)" py={3} px={4} textAlign="center">
                                    Description
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--text-primary)" borderRight="1px solid var(--border-color)" py={3} px={4} textAlign="center">
                                    Unit
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--text-primary)" borderRight="1px solid var(--border-color)" py={3} px={4} textAlign="center">
                                    Updated Date
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--text-primary)" borderRight="1px solid var(--border-color)" py={3} px={4} textAlign="center">
                                    Price w/o VAT
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--text-primary)" borderRight="1px solid var(--border-color)" py={3} px={4} textAlign="center">
                                    Price with VAT
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--text-primary)" py={3} px={4} textAlign="center">
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
                                        _hover={{ bg: "var(--border-color)" }}
                                    >
                                        {editingId === item.id ? (
                                            <>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={3} px={4}>
                                                    <Input
                                                        size="sm"
                                                        value={editForm.sr}
                                                        onChange={(e) => setEditForm({ ...editForm, sr: e.target.value })}
                                                        bg="var(--bg-page)"
                                                        color="var(--text-primary)"
                                                        border="1px solid var(--border-color)"
                                                    />
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={3} px={4}>
                                                    <Input
                                                        size="sm"
                                                        value={editForm.description}
                                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                        bg="var(--bg-page)"
                                                        color="var(--text-primary)"
                                                        border="1px solid var(--border-color)"
                                                    />
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={3} px={4}>
                                                    <Input
                                                        size="sm"
                                                        value={editForm.unit}
                                                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                                        bg="var(--bg-page)"
                                                        color="var(--text-primary)"
                                                        border="1px solid var(--border-color)"
                                                    />
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={3} px={4}>
                                                    <Input
                                                        size="sm"
                                                        value={editForm.updatedDate}
                                                        onChange={(e) => setEditForm({ ...editForm, updatedDate: e.target.value })}
                                                        bg="var(--bg-page)"
                                                        color="var(--text-primary)"
                                                        border="1px solid var(--border-color)"
                                                    />
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={3} px={4}>
                                                    <Input
                                                        size="sm"
                                                        type="number"
                                                        value={editForm.priceWithoutVat}
                                                        onChange={(e) => setEditForm({ ...editForm, priceWithoutVat: e.target.value })}
                                                        bg="var(--bg-page)"
                                                        color="var(--text-primary)"
                                                        border="1px solid var(--border-color)"
                                                    />
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" py={3} px={4}>
                                                    <Input
                                                        size="sm"
                                                        type="number"
                                                        value={editForm.priceWithVat}
                                                        onChange={(e) => setEditForm({ ...editForm, priceWithVat: e.target.value })}
                                                        bg="var(--bg-page)"
                                                        color="var(--text-primary)"
                                                        border="1px solid var(--border-color)"
                                                    />
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" py={3} px={4}>
                                                    <Box display="flex" gap={2}>
                                                        <Button
                                                            size="xs"
                                                            bg="var(--success)"
                                                            color="var(--text-primary)"
                                                            _hover={{ bg: "var(--success-hover)" }}
                                                            onClick={() => handleSaveEdit(item.id)}
                                                        >
                                                            <FaSave />
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            bg="var(--text-muted-2)"
                                                            color="var(--text-primary)"
                                                            _hover={{ bg: "var(--border-color)" }}
                                                            onClick={handleCancelEdit}
                                                        >
                                                            <FaTimes />
                                                        </Button>
                                                    </Box>
                                                </Table.Cell>
                                            </>
                                        ) : (
                                            <>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={3} px={4} textAlign="center">
                                                    {item.sr}
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={3} px={4} textAlign="center">
                                                    {item.description}
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={3} px={4} textAlign="center">
                                                    {item.unit}
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={3} px={4} textAlign="center">
                                                    {item.updatedDate || "-"}
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={3} px={4} textAlign="center">
                                                    {item.priceWithoutVat != null ? item.priceWithoutVat.toFixed(2) : "-"}
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" borderRight="1px solid var(--border-color)" color="var(--text-primary)" py={3} px={4} textAlign="center">
                                                    {item.priceWithVat != null ? item.priceWithVat.toFixed(2) : "-"}
                                                </Table.Cell>
                                                <Table.Cell borderColor="var(--border-color)" color="var(--text-primary)" py={3} px={4} textAlign="center">
                                                    <Box display="flex" gap={2}>
                                                        <Button
                                                            size="xs"
                                                            bg="var(--accent)"
                                                            color="var(--text-primary)"
                                                            _hover={{ bg: "var(--accent-hover)" }}
                                                            onClick={() => handleEdit(item)}
                                                        >
                                                            <FaEdit />
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            bg="var(--error)"
                                                            color="var(--text-primary)"
                                                            _hover={{ bg: "var(--error)" }}
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
                                Are you sure you want to delete this pricing item? This action cannot be undone.
                            </Text>
                            <Box display="flex" gap={3} justifyContent="flex-end">
                                <Button
                                    bg="var(--text-muted-2)"
                                    color="var(--text-primary)"
                                    _hover={{ bg: "var(--border-color)" }}
                                    onClick={() => setDeleteConfirm(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    bg="var(--error)"
                                    color="var(--text-primary)"
                                    _hover={{ bg: "var(--error)" }}
                                    onClick={() => handleDelete(deleteConfirm)}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
