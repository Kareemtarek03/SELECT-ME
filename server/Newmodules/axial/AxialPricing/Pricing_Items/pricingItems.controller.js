import { PricingItemsService } from "./pricingItems.service.js";

/**
 * Pricing Items Controller
 * Handles HTTP request/response logic for pricing items
 */
export const PricingItemsController = {
    // ========================
    // Category Controllers
    // ========================

    async getCategories(req, res) {
        try {
            const categories = await PricingItemsService.getCategories();
            res.json(categories);
        } catch (error) {
            console.error("Get categories error:", error);
            res.status(500).json({ error: "Failed to fetch pricing categories" });
        }
    },

    async getCategoryByName(req, res) {
        try {
            const category = await PricingItemsService.getCategoryByName(req.params.name);
            if (!category) {
                return res.status(404).json({ error: "Category not found" });
            }
            res.json(category);
        } catch (error) {
            console.error("Get category error:", error);
            res.status(500).json({ error: "Failed to fetch category" });
        }
    },

    async getCategoryById(req, res) {
        try {
            const category = await PricingItemsService.getCategoryById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: "Category not found" });
            }
            res.json(category);
        } catch (error) {
            console.error("Get category error:", error);
            res.status(500).json({ error: "Failed to fetch category" });
        }
    },

    async createCategory(req, res) {
        try {
            const { name, displayName, description } = req.body;

            if (!name || !displayName) {
                return res.status(400).json({ error: "Name and display name are required" });
            }

            const category = await PricingItemsService.createCategory({
                name,
                displayName,
                description,
            });

            await PricingItemsService.logAction(
                req.user.id,
                "CATEGORY_CREATE",
                category.id,
                null,
                `Created pricing category: ${displayName}`,
                null,
                category
            );

            res.status(201).json(category);
        } catch (error) {
            console.error("Create category error:", error);
            if (error.code === "P2002") {
                return res.status(400).json({ error: "Category name already exists" });
            }
            res.status(500).json({ error: "Failed to create category" });
        }
    },

    async updateCategory(req, res) {
        try {
            const oldCategory = await PricingItemsService.getCategoryById(req.params.id);
            if (!oldCategory) {
                return res.status(404).json({ error: "Category not found" });
            }

            const category = await PricingItemsService.updateCategory(req.params.id, req.body);

            await PricingItemsService.logAction(
                req.user.id,
                "CATEGORY_UPDATE",
                category.id,
                null,
                `Updated pricing category: ${category.displayName}`,
                oldCategory,
                category
            );

            res.json(category);
        } catch (error) {
            console.error("Update category error:", error);
            res.status(500).json({ error: "Failed to update category" });
        }
    },

    async deleteCategory(req, res) {
        try {
            const category = await PricingItemsService.getCategoryById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: "Category not found" });
            }

            await PricingItemsService.deleteCategory(req.params.id);

            await PricingItemsService.logAction(
                req.user.id,
                "CATEGORY_DELETE",
                parseInt(req.params.id),
                null,
                `Deleted pricing category: ${category.displayName}`,
                category,
                null
            );

            res.json({ message: "Category deleted successfully" });
        } catch (error) {
            console.error("Delete category error:", error);
            res.status(500).json({ error: "Failed to delete category" });
        }
    },

    // ========================
    // Item Controllers
    // ========================

    async getItemsByCategory(req, res) {
        try {
            const items = await PricingItemsService.getItemsByCategory(req.params.categoryId);
            res.json(items);
        } catch (error) {
            console.error("Get items error:", error);
            res.status(500).json({ error: "Failed to fetch pricing items" });
        }
    },

    async getItemById(req, res) {
        try {
            const item = await PricingItemsService.getItemById(req.params.id);
            if (!item) {
                return res.status(404).json({ error: "Item not found" });
            }
            res.json(item);
        } catch (error) {
            console.error("Get item error:", error);
            res.status(500).json({ error: "Failed to fetch item" });
        }
    },

    async createItem(req, res) {
        try {
            const { categoryId, sr, description, unit, updatedDate, priceWithoutVat, priceWithVat } = req.body;

            if (!categoryId || !sr || !description || !unit) {
                return res.status(400).json({ error: "Category ID, Sr, description, and unit are required" });
            }

            const item = await PricingItemsService.createItem({
                categoryId,
                sr,
                description,
                unit,
                updatedDate,
                priceWithoutVat,
                priceWithVat,
            });

            await PricingItemsService.logAction(
                req.user.id,
                "ITEM_CREATE",
                parseInt(categoryId),
                item.id,
                `Created pricing item: ${description}`,
                null,
                item
            );

            res.status(201).json(item);
        } catch (error) {
            console.error("Create item error:", error);
            res.status(500).json({ error: "Failed to create item" });
        }
    },

    async updateItem(req, res) {
        console.log(`\n>>> CONTROLLER: updateItem called for ID=${req.params.id}`);
        console.log(`>>> CONTROLLER: Request body:`, JSON.stringify(req.body));
        try {
            const oldItem = await PricingItemsService.getItemById(req.params.id);
            if (!oldItem) {
                return res.status(404).json({ error: "Item not found" });
            }

            console.log(`>>> CONTROLLER: Calling PricingItemsService.updateItem...`);
            const item = await PricingItemsService.updateItem(req.params.id, req.body);
            console.log(`>>> CONTROLLER: Service returned successfully`);

            await PricingItemsService.logAction(
                req.user.id,
                "ITEM_UPDATE",
                oldItem.categoryId,
                item.id,
                `Updated pricing item: ${item.description}`,
                oldItem,
                item
            );

            res.json(item);
        } catch (error) {
            console.error("Update item error:", error);
            res.status(500).json({ error: "Failed to update item" });
        }
    },

    async deleteItem(req, res) {
        try {
            const item = await PricingItemsService.getItemById(req.params.id);
            if (!item) {
                return res.status(404).json({ error: "Item not found" });
            }

            await PricingItemsService.deleteItem(req.params.id);

            await PricingItemsService.logAction(
                req.user.id,
                "ITEM_DELETE",
                item.categoryId,
                parseInt(req.params.id),
                `Deleted pricing item: ${item.description}`,
                item,
                null
            );

            res.json({ message: "Item deleted successfully" });
        } catch (error) {
            console.error("Delete item error:", error);
            res.status(500).json({ error: "Failed to delete item" });
        }
    },

    // ========================
    // Logs Controller
    // ========================

    async getLogs(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const result = await PricingItemsService.getLogs(page, limit);
            res.json(result);
        } catch (error) {
            console.error("Get logs error:", error);
            res.status(500).json({ error: "Failed to fetch pricing logs" });
        }
    },

    async exportTemplate(req, res) {
        try {
            const categoryName = req.query.categoryName || "axial_pricing";
            const buffer = await PricingItemsService.exportTemplate(categoryName);
            const filename = `PricingItems-${categoryName}-template.xlsx`;
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.send(buffer);
        } catch (error) {
            console.error("Export template error:", error);
            res.status(500).json({ error: error.message || "Failed to export template" });
        }
    },

    async importTemplate(req, res) {
        try {
            const { fileBase64, filename, categoryName = "axial_pricing" } = req.body;
            if (!fileBase64) {
                return res.status(400).json({ error: "fileBase64 is required" });
            }
            const buffer = Buffer.from(fileBase64, "base64");
            const result = await PricingItemsService.importFromExcel(buffer, categoryName);
            res.json({
                message: `Import complete: ${result.updated} item(s) updated.`,
                updated: result.updated,
                errors: result.errors,
            });
        } catch (error) {
            console.error("Import template error:", error);
            res.status(500).json({ error: error.message || "Failed to import template" });
        }
    },
};

export default PricingItemsController;
