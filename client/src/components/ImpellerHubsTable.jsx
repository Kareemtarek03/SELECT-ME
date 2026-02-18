import React from "react";
import { Table, Input } from "@chakra-ui/react";
import { usePricingTableActions } from "../hooks/usePricingTableActions";
import DeleteConfirmModal from "./pricing/DeleteConfirmModal";
import PricingTableWrapper from "./pricing/PricingTableWrapper";
import AddFormBox from "./pricing/AddFormBox";
import {
  TableCell,
  EditableCell,
  HeaderCell,
} from "./pricing/PricingTableCell";
import { EditModeButtons, ViewModeButtons } from "./pricing/ActionButtons";

const inputProps = {
  bg: "var(--bg-page)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-color)",
  _placeholder: { color: "var(--text-muted-2)" },
};

const INITIAL_FORM = {
  symbol: "",
  material: "",
  hubType: "Fixed",
  sizeMm: "",
  weightKg: "",
  moldCost: "",
  machiningCost: "",
  transportCost: "",
  packingCost: "",
};

const HEADERS = [
  "Symbol",
  "Material",
  "Hub Type",
  "Size (mm)",
  "Weight (kg)",
  "Mold Cost",
  "Machining",
  "Transport",
  "Packing",
  "Total Cost w/ VAT",
  "Actions",
];

export default function ImpellerHubsTable({
  hubs,
  onUpdate,
  getAuthHeaders,
  setAlert,
}) {
  const {
    editingId,
    editForm,
    setEditForm,
    showAddForm,
    setShowAddForm,
    newItem,
    setNewItem,
    deleteConfirm,
    setDeleteConfirm,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleCreateNew,
    handleDelete,
  } = usePricingTableActions(
    "/api/pricing/axial-impeller/hubs",
    INITIAL_FORM,
    onUpdate,
    getAuthHeaders,
    setAlert,
    "Hub"
  );

  return (
    <>
      <AddFormBox
        title="Add New Hub"
        open={showAddForm}
        onSave={handleCreateNew}
        onCancel={() => {
          setShowAddForm(false);
          setNewItem(INITIAL_FORM);
        }}
      >
        <Input placeholder="Symbol" value={newItem.symbol} onChange={(e) => setNewItem({ ...newItem, symbol: e.target.value })} {...inputProps} />
        <Input placeholder="Material" value={newItem.material} onChange={(e) => setNewItem({ ...newItem, material: e.target.value })} {...inputProps} />
        <Input placeholder="Hub Type" value={newItem.hubType} onChange={(e) => setNewItem({ ...newItem, hubType: e.target.value })} {...inputProps} />
        <Input placeholder="Size (mm)" type="number" value={newItem.sizeMm} onChange={(e) => setNewItem({ ...newItem, sizeMm: e.target.value })} {...inputProps} />
        <Input placeholder="Weight (kg)" type="number" value={newItem.weightKg} onChange={(e) => setNewItem({ ...newItem, weightKg: e.target.value })} {...inputProps} />
        <Input placeholder="Mold Cost" type="number" value={newItem.moldCost} onChange={(e) => setNewItem({ ...newItem, moldCost: e.target.value })} {...inputProps} />
        <Input placeholder="Machining" type="number" value={newItem.machiningCost} onChange={(e) => setNewItem({ ...newItem, machiningCost: e.target.value })} {...inputProps} />
        <Input placeholder="Transport" type="number" value={newItem.transportCost} onChange={(e) => setNewItem({ ...newItem, transportCost: e.target.value })} {...inputProps} />
        <Input placeholder="Packing" type="number" value={newItem.packingCost} onChange={(e) => setNewItem({ ...newItem, packingCost: e.target.value })} {...inputProps} />
      </AddFormBox>

      <PricingTableWrapper
        title="Hub"
        onAdd={() => setShowAddForm(!showAddForm)}
      >
        <Table.Root bg="var(--bg-card)" w="100%">
          <Table.Header bg="var(--bg-card)" color="var(--text-primary)">
            <Table.Row bg="var(--bg-card)" color="var(--text-primary)">
              {HEADERS.map((header, idx) => (
                <HeaderCell key={header} isLast={idx === HEADERS.length - 1}>
                  {header}
                </HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body borderColor="var(--border-color)">
            {hubs.map((item, idx) => {
              console.log("Rendering hub item:", item);
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
                      <EditableCell
                        value={editForm.symbol}
                        onChange={(e) =>
                          setEditForm({ ...editForm, symbol: e.target.value })
                        }
                      />
                      <EditableCell
                        value={editForm.material}
                        onChange={(e) =>
                          setEditForm({ ...editForm, material: e.target.value })
                        }
                      />
                      <EditableCell
                        value={editForm.hubType}
                        onChange={(e) =>
                          setEditForm({ ...editForm, hubType: e.target.value })
                        }
                      />
                      <EditableCell
                        value={editForm.sizeMm}
                        onChange={(e) =>
                          setEditForm({ ...editForm, sizeMm: e.target.value })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.weightKg}
                        onChange={(e) =>
                          setEditForm({ ...editForm, weightKg: e.target.value })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.moldCost}
                        onChange={(e) =>
                          setEditForm({ ...editForm, moldCost: e.target.value })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.machiningCost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            machiningCost: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.transportCost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            transportCost: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.packingCost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            packingCost: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <TableCell>-</TableCell>
                      <TableCell isLast>
                        <EditModeButtons
                          onSave={() => handleSaveEdit(item.id)}
                          onCancel={handleCancelEdit}
                        />
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{item.symbol}</TableCell>
                      <TableCell>{item.material}</TableCell>
                      <TableCell>{item.hubType}</TableCell>
                      <TableCell>{item.sizeMm}</TableCell>
                      <TableCell>{item.hubWeightKg}</TableCell>
                      <TableCell>{item.moldCostWithVat}</TableCell>
                      <TableCell>{item.machiningCostWithVat}</TableCell>
                      <TableCell>{item.transportationCost}</TableCell>
                      <TableCell>{item.packingCost}</TableCell>
                      <TableCell>
                        {item.totalCost ? item.totalCost.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell isLast>
                        <ViewModeButtons
                          onEdit={() => handleEdit(item)}
                          onDelete={() => setDeleteConfirm(item.id)}
                        />
                      </TableCell>
                    </>
                  )}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </PricingTableWrapper>

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        itemName="hub"
      />
    </>
  );
}
