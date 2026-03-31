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
  bladeType: "",
  lengthMm: "",
  bladeWeightKg: "",
  bladeMoldCost: "",
  bladeMachiningCost: "",
  bladeTransportCost: "",
  bladePackingCost: "",
  steelBallsCost: "",
  bladeFactor: "",
};

const HEADERS = [
  "Symbol",
  "Material",
  "Type",
  "Length (mm)",
  "Weight (kg)",
  "Mold Cost",
  "Machining",
  "Transport",
  "Packing",
  "Steel Balls",
  "Blade Factor",
  "Total Cost w/ VAT",
  "Actions",
];

export default function ImpellerBladesTable({
  blades,
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
    "/api/pricing/axial-impeller/blades",
    INITIAL_FORM,
    onUpdate,
    getAuthHeaders,
    setAlert,
    "Blade"
  );

  return (
    <>
      <AddFormBox
        title="Add New Blade"
        open={showAddForm}
        onSave={handleCreateNew}
        onCancel={() => {
          setShowAddForm(false);
          setNewItem(INITIAL_FORM);
        }}
      >
        <Input
          placeholder="Symbol"
          value={newItem.symbol}
          onChange={(e) => setNewItem({ ...newItem, symbol: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Material"
          value={newItem.material}
          onChange={(e) => setNewItem({ ...newItem, material: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Type"
          value={newItem.bladeType}
          onChange={(e) => setNewItem({ ...newItem, bladeType: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Length (mm)"
          type="number"
          value={newItem.lengthMm}
          onChange={(e) => setNewItem({ ...newItem, lengthMm: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Weight (kg)"
          type="number"
          value={newItem.bladeWeightKg}
          onChange={(e) => setNewItem({ ...newItem, bladeWeightKg: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Mold Cost"
          type="number"
          value={newItem.bladeMoldCost}
          onChange={(e) => setNewItem({ ...newItem, bladeMoldCost: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Machining"
          type="number"
          value={newItem.bladeMachiningCost}
          onChange={(e) => setNewItem({ ...newItem, bladeMachiningCost: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Transport"
          type="number"
          value={newItem.bladeTransportCost}
          onChange={(e) => setNewItem({ ...newItem, bladeTransportCost: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Packing"
          type="number"
          value={newItem.bladePackingCost}
          onChange={(e) => setNewItem({ ...newItem, bladePackingCost: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Steel Balls"
          type="number"
          value={newItem.steelBallsCost}
          onChange={(e) => setNewItem({ ...newItem, steelBallsCost: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Blade Factor"
          type="number"
          step="0.01"
          value={newItem.bladeFactor}
          onChange={(e) => setNewItem({ ...newItem, bladeFactor: e.target.value })}
          {...inputProps}
        />
      </AddFormBox>

      <PricingTableWrapper
        title="Blade"
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
            {blades.map((item, idx) => {
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
                        value={editForm.bladeType}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bladeType: e.target.value,
                          })
                        }
                      />
                      <EditableCell
                        value={editForm.lengthMm}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lengthMm: e.target.value })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.bladeWeightKg}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bladeWeightKg: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.bladeMoldCost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bladeMoldCost: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.bladeMachiningCost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bladeMachiningCost: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.bladeTransportCost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bladeTransportCost: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.bladePackingCost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bladePackingCost: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.steelBallsCost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            steelBallsCost: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.bladeFactor}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bladeFactor: e.target.value,
                          })
                        }
                        type="number"
                        step="0.01"
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
                      <TableCell>{item.bladeType}</TableCell>
                      <TableCell>{item.lengthMm}</TableCell>
                      <TableCell>{item.bladeWeightKg}</TableCell>
                      <TableCell>{item.moldCostWithVat}</TableCell>
                      <TableCell>{item.machiningCostWithVat}</TableCell>
                      <TableCell>{item.transportationCost}</TableCell>
                      <TableCell>{item.packingCost}</TableCell>
                      <TableCell>{item.steelBallsCost}</TableCell>
                      <TableCell>
                        {item.bladeFactor != null
                          ? Number(item.bladeFactor).toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.totalCost != null
                          ? Number(item.totalCost).toFixed(2)
                          : "-"}
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
        itemName="blade"
      />
    </>
  );
}
