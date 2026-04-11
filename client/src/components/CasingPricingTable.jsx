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
  _placeholder: { color: "var(--text-muted)" },
};

const INITIAL_FORM = {
  model: "",
  sizeMm: "",
  casingWeightKgWithoutScrap: "",
  scrapPercentage: "",
  casingCircumferenceMeter: "",
  laserTimeMinutes: "",
  bendingLine: "",
  rolling: "",
  paintingDiameter: "",
  profitPercentage: "",
  accessory1Description: "",
  accessory1PriceWithoutVat: "",
  accessory2Description: "",
  accessory2PriceWithoutVat: "",
};

const HEADERS = [
  "Model",
  "Size (mm)",
  "Weight (kg) w/o Scrap",
  "Scrap %",
  "Weight w/ Scrap",
  "Circumference (m)",
  "Laser Time (min)",
  "Bending Line",
  "Rolling",
  "Painting Ø",
  "Profit %",
  "Accessory 1 Desc",
  "Accessory 1 Price",
  "Accessory 2 Desc",
  "Accessory 2 Price",
  "Total Cost w/ VAT",
  "Total Cost w/o Scrap",
  "Actions",
];

export default function CasingPricingTable({
  casings,
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
    "/api/pricing/axial-casing/casings",
    INITIAL_FORM,
    onUpdate,
    getAuthHeaders,
    setAlert,
    "Casing",
  );

  const formatNumber = (price) => {
    if (price === null || price === undefined) return "—";
    const num = typeof price === "number" ? price : parseFloat(price);
    if (isNaN(num)) return "—";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <>
      <AddFormBox
        title="Add New Casing"
        open={showAddForm}
        onSave={handleCreateNew}
        onCancel={() => {
          setShowAddForm(false);
          setNewItem(INITIAL_FORM);
        }}
      >
        <Input
          placeholder="Model"
          value={newItem.model}
          onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Size (mm)"
          type="number"
          value={newItem.sizeMm}
          onChange={(e) => setNewItem({ ...newItem, sizeMm: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Weight (kg) w/o Scrap"
          type="number"
          value={newItem.casingWeightKgWithoutScrap}
          onChange={(e) =>
            setNewItem({
              ...newItem,
              casingWeightKgWithoutScrap: e.target.value,
            })
          }
          {...inputProps}
        />
        <Input
          placeholder="Scrap %"
          type="number"
          value={newItem.scrapPercentage}
          onChange={(e) =>
            setNewItem({ ...newItem, scrapPercentage: e.target.value })
          }
          {...inputProps}
        />
        <Input
          placeholder="Circumference (m)"
          type="number"
          value={newItem.casingCircumferenceMeter}
          onChange={(e) =>
            setNewItem({ ...newItem, casingCircumferenceMeter: e.target.value })
          }
          {...inputProps}
        />
        <Input
          placeholder="Laser Time (min)"
          type="number"
          value={newItem.laserTimeMinutes}
          onChange={(e) =>
            setNewItem({ ...newItem, laserTimeMinutes: e.target.value })
          }
          {...inputProps}
        />
        <Input
          placeholder="Bending Line"
          type="number"
          value={newItem.bendingLine}
          onChange={(e) =>
            setNewItem({ ...newItem, bendingLine: e.target.value })
          }
          {...inputProps}
        />
        <Input
          placeholder="Rolling"
          type="number"
          value={newItem.rolling}
          onChange={(e) => setNewItem({ ...newItem, rolling: e.target.value })}
          {...inputProps}
        />
        <Input
          placeholder="Painting Ø"
          type="number"
          value={newItem.paintingDiameter}
          onChange={(e) =>
            setNewItem({ ...newItem, paintingDiameter: e.target.value })
          }
          {...inputProps}
        />
        <Input
          placeholder="Profit %"
          type="number"
          value={newItem.profitPercentage}
          onChange={(e) =>
            setNewItem({ ...newItem, profitPercentage: e.target.value })
          }
          {...inputProps}
        />
        <Input
          placeholder="Accessory 1 Desc"
          value={newItem.accessory1Description}
          onChange={(e) =>
            setNewItem({ ...newItem, accessory1Description: e.target.value })
          }
          {...inputProps}
        />
        <Input
          placeholder="Accessory 1 Price"
          type="number"
          value={newItem.accessory1PriceWithoutVat}
          onChange={(e) =>
            setNewItem({
              ...newItem,
              accessory1PriceWithoutVat: e.target.value,
            })
          }
          {...inputProps}
        />
        <Input
          placeholder="Accessory 2 Desc"
          value={newItem.accessory2Description}
          onChange={(e) =>
            setNewItem({ ...newItem, accessory2Description: e.target.value })
          }
          {...inputProps}
        />
        <Input
          placeholder="Accessory 2 Price"
          type="number"
          value={newItem.accessory2PriceWithoutVat}
          onChange={(e) =>
            setNewItem({
              ...newItem,
              accessory2PriceWithoutVat: e.target.value,
            })
          }
          {...inputProps}
        />
      </AddFormBox>

      <PricingTableWrapper
        title="Casing"
        onAdd={() => setShowAddForm(!showAddForm)}
      >
        <Table.Root bg="var(--bg-card)" w="100%">
          <Table.Header bg="var(--table-header-bg)" color="var(--text-primary)">
            <Table.Row bg="var(--table-header-bg)" color="var(--text-primary)">
              {HEADERS.map((header, idx) => (
                <HeaderCell key={header} isLast={idx === HEADERS.length - 1}>
                  {header}
                </HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body borderColor="var(--border-color)">
            {casings.map((item, idx) => {
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
                        value={editForm.model}
                        onChange={(e) =>
                          setEditForm({ ...editForm, model: e.target.value })
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
                        value={editForm.casingWeightKgWithoutScrap}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            casingWeightKgWithoutScrap: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.scrapPercentage}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            scrapPercentage: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <TableCell>
                        {editForm.casingWeightKgWithoutScrap &&
                        editForm.scrapPercentage
                          ? (
                              parseFloat(editForm.casingWeightKgWithoutScrap) *
                              (1 + parseFloat(editForm.scrapPercentage) / 100)
                            ).toFixed(3)
                          : "-"}
                      </TableCell>
                      <EditableCell
                        value={editForm.casingCircumferenceMeter}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            casingCircumferenceMeter: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.laserTimeMinutes}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            laserTimeMinutes: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.bendingLine}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bendingLine: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.rolling}
                        onChange={(e) =>
                          setEditForm({ ...editForm, rolling: e.target.value })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.paintingDiameter}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            paintingDiameter: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.profitPercentage}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            profitPercentage: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.accessory1Description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            accessory1Description: e.target.value,
                          })
                        }
                      />
                      <EditableCell
                        value={editForm.accessory1PriceWithoutVat}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            accessory1PriceWithoutVat: e.target.value,
                          })
                        }
                        type="number"
                      />
                      <EditableCell
                        value={editForm.accessory2Description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            accessory2Description: e.target.value,
                          })
                        }
                      />
                      <EditableCell
                        value={editForm.accessory2PriceWithoutVat}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            accessory2PriceWithoutVat: e.target.value,
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
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{formatNumber(item.sizeMm)}</TableCell>
                      <TableCell>
                        {formatNumber(item.casingWeightKgWithoutScrap)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(item.scrapPercentage)}
                      </TableCell>
                      <TableCell>
                        {item.weightWithScrap
                          ? item.weightWithScrap.toFixed(3)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {formatNumber(item.casingCircumferenceMeter)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(item.laserTimeMinutes)}
                      </TableCell>
                      <TableCell>{formatNumber(item.bendingLine)}</TableCell>
                      <TableCell>{formatNumber(item.rolling)}</TableCell>
                      <TableCell>
                        {formatNumber(item.paintingDiameter)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(item.profitPercentage)}
                      </TableCell>
                      <TableCell>{item.accessory1Description || "-"}</TableCell>
                      <TableCell>
                        {formatNumber(item.accessory1PriceWithoutVat) || "-"}
                      </TableCell>
                      <TableCell>{item.accessory2Description || "-"}</TableCell>
                      <TableCell>
                        {formatNumber(item.accessory2PriceWithoutVat) || "-"}
                      </TableCell>
                      <TableCell isCalculated>
                        {formatNumber(item.totalCostWithVat ?? item.totalCost)}
                      </TableCell>
                      <TableCell isCalculated>
                        {formatNumber(item.totalCostWoScrap)}
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
        itemName="casing"
      />
    </>
  );
}
