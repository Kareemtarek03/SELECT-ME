import { PrismaClient } from "@prisma/client";
import * as pricingUtils from "../shared/pricingUtils.js";
import {
    recalculateAllMotorPrices,
    recalculateAllCablePrices,
    recalculateAllCableLugsAndHeatShrinkPrices,
    recalculateAllElectricalPrices,
    isMotorPricingTrigger,
    isCablePricingTrigger,
    isCableLugsHeatShrinkTrigger,
    DOLLAR_RATE_SR,
    ELECTRICAL_MOTORS_SR,
    ELECTRICAL_CABLES_SR,
    ELECTRICAL_COMPONENT_SR,
} from "../../AxialMotorData/axialMotorPricing.service.js";

const prisma = new PrismaClient();

// Extract constants and functions
const BOLTS_AND_NUTS_SR = pricingUtils.BOLTS_AND_NUTS_SR;
const recalculateAllAccessoriesPrices = pricingUtils.recalculateAllAccessoriesPrices;

console.log(">>> SERVICE LOADED - BOLTS_AND_NUTS_SR:", BOLTS_AND_NUTS_SR);
console.log(">>> SERVICE LOADED - recalculateAllAccessoriesPrices:", typeof recalculateAllAccessoriesPrices);
console.log(">>> SERVICE LOADED - Motor Pricing Triggers: DOLLAR_RATE_SR=", DOLLAR_RATE_SR, ", ELECTRICAL_MOTORS_SR=", ELECTRICAL_MOTORS_SR);
console.log(">>> SERVICE LOADED - Cable Pricing Triggers: ELECTRICAL_CABLES_SR=", ELECTRICAL_CABLES_SR, ", ELECTRICAL_COMPONENT_SR=", ELECTRICAL_COMPONENT_SR);

/**
 * Pricing Items Service
 * Handles CRUD operations for pricing_items table
 */
export const PricingItemsService = {
    /**
     * Get all pricing categories
     */
    async getCategories() {
        return await prisma.pricingCategory.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { items: true },
                },
            },
        });
    },

    /**
     * Get a single category by name
     */
    async getCategoryByName(name) {
        return await prisma.pricingCategory.findUnique({
            where: { name },
            include: {
                items: {
                    orderBy: { sr: "asc" },
                },
            },
        });
    },

    /**
     * Get a single category by ID
     */
    async getCategoryById(id) {
        return await prisma.pricingCategory.findUnique({
            where: { id: parseInt(id) },
            include: {
                items: {
                    orderBy: { sr: "asc" },
                },
            },
        });
    },

    /**
     * Create a new pricing category
     */
    async createCategory(data) {
        return await prisma.pricingCategory.create({
            data: {
                name: data.name,
                displayName: data.displayName,
                description: data.description || null,
            },
        });
    },

    /**
     * Update a pricing category
     */
    async updateCategory(id, data) {
        return await prisma.pricingCategory.update({
            where: { id: parseInt(id) },
            data: {
                displayName: data.displayName,
                description: data.description,
            },
        });
    },

    /**
     * Delete a pricing category
     */
    async deleteCategory(id) {
        return await prisma.pricingCategory.delete({
            where: { id: parseInt(id) },
        });
    },

    /**
     * Get all items for a category
     */
    async getItemsByCategory(categoryId) {
        return await prisma.pricingItem.findMany({
            where: { categoryId: parseInt(categoryId) },
            orderBy: { sr: "asc" },
        });
    },

    /**
     * Get a single pricing item by ID
     */
    async getItemById(id) {
        return await prisma.pricingItem.findUnique({
            where: { id: parseInt(id) },
            include: { category: true },
        });
    },

    /**
     * Create a new pricing item
     */
    async createItem(data) {
        return await prisma.pricingItem.create({
            data: {
                categoryId: parseInt(data.categoryId),
                sr: parseInt(data.sr),
                description: data.description,
                unit: data.unit,
                updatedDate: data.updatedDate || null,
                priceWithoutVat: data.priceWithoutVat ? parseFloat(data.priceWithoutVat) : null,
                priceWithVat: data.priceWithVat ? parseFloat(data.priceWithVat) : null,
            },
        });
    },

    /**
     * Update a pricing item
     * If updating Bolts & Nuts (Sr=24), triggers recalculation of all accessories
     * Uses transaction to ensure data integrity
     */
    async updateItem(id, data) {
        // First, get the current item to check if it's Bolts & Nuts
        const currentItem = await prisma.pricingItem.findUnique({
            where: { id: parseInt(id) },
        });

        if (!currentItem) {
            throw new Error("Pricing item not found");
        }

        const updateData = {};

        if (data.sr !== undefined) updateData.sr = parseInt(data.sr);
        if (data.description !== undefined) updateData.description = data.description;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.updatedDate !== undefined) updateData.updatedDate = data.updatedDate;
        if (data.priceWithoutVat !== undefined) {
            updateData.priceWithoutVat = data.priceWithoutVat ? parseFloat(data.priceWithoutVat) : null;
        }
        if (data.priceWithVat !== undefined) {
            updateData.priceWithVat = data.priceWithVat ? parseFloat(data.priceWithVat) : null;
        }

        // Check if this is the Bolts & Nuts item (Sr = 21)
        const currentSr = parseInt(currentItem.sr);
        const isBoltsAndNuts = currentSr === BOLTS_AND_NUTS_SR;
        const isMotorPriceTrigger = isMotorPricingTrigger(currentSr);
        const hasPriceWithVat = data.priceWithVat !== undefined && data.priceWithVat !== "";

        console.log(`\n${"#".repeat(60)}`);
        console.log(`📝 PRICING ITEM UPDATE REQUEST`);
        console.log(`${"#".repeat(60)}`);
        console.log(`   Item ID: ${id}`);
        console.log(`   Current Sr: ${currentSr} (type: ${typeof currentSr})`);
        console.log(`   BOLTS_AND_NUTS_SR constant: ${BOLTS_AND_NUTS_SR} (type: ${typeof BOLTS_AND_NUTS_SR})`);
        console.log(`   Is Bolts & Nuts (Sr=24): ${isBoltsAndNuts}`);
        console.log(`   Is Motor Price Trigger (Sr=23 or 26): ${isMotorPriceTrigger}`);
        console.log(`   Has priceWithVat in request: ${hasPriceWithVat}`);
        console.log(`   data.priceWithVat value: "${data.priceWithVat}" (type: ${typeof data.priceWithVat})`);
        console.log(`   Full request data:`, JSON.stringify(data));
        console.log(`${"#".repeat(60)}`);

        // Update the pricing item
        const updatedItem = await prisma.pricingItem.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // If this is Bolts & Nuts, ALWAYS recalculate accessories when priceWithVat is in the update
        // This ensures accessories stay in sync even if the value didn't change
        if (isBoltsAndNuts && data.priceWithVat !== undefined) {
            console.log(`\n${"*".repeat(60)}`);
            console.log(`🔄 BOLTS & NUTS (Sr=24) UPDATE DETECTED!`);
            console.log(`   Old priceWithVat: ${currentItem.priceWithVat}`);
            console.log(`   New priceWithVat: ${updatedItem.priceWithVat}`);
            console.log(`🔄 Triggering recalculation of ALL accessory prices...`);
            console.log(`${"*".repeat(60)}\n`);

            try {
                // Pass the new price directly to avoid any caching issues
                const recalculatedAccessories = await recalculateAllAccessoriesPrices(updatedItem.priceWithVat);
                console.log(`✅ Successfully recalculated ${recalculatedAccessories.length} accessory prices`);
            } catch (recalcError) {
                console.error(`❌ Error recalculating accessory prices:`, recalcError);
                throw new Error(`Pricing item updated but failed to recalculate accessories: ${recalcError.message}`);
            }
        }

        // If this is Dollar Rate (Sr=26) or Electrical Motors (Sr=23), recalculate all motor prices
        if (isMotorPriceTrigger && data.priceWithVat !== undefined) {
            console.log(`\n${"*".repeat(60)}`);
            console.log(`🔄 MOTOR PRICING TRIGGER (Sr=${currentSr}) UPDATE DETECTED!`);
            console.log(`   Old priceWithVat: ${currentItem.priceWithVat}`);
            console.log(`   New priceWithVat: ${updatedItem.priceWithVat}`);
            console.log(`🔄 Triggering recalculation of ALL motor prices...`);
            console.log(`${"*".repeat(60)}\n`);

            try {
                const recalculatedMotors = await recalculateAllMotorPrices();
                console.log(`✅ Successfully recalculated ${recalculatedMotors.length} motor prices`);
            } catch (recalcError) {
                console.error(`❌ Error recalculating motor prices:`, recalcError);
                throw new Error(`Pricing item updated but failed to recalculate motor prices: ${recalcError.message}`);
            }
        }

        // If this is Electrical Cables (Sr=21), recalculate all cable prices
        if (isCablePricingTrigger(currentSr) && data.priceWithVat !== undefined) {
            console.log(`\n${"*".repeat(60)}`);
            console.log(`🔄 CABLE PRICING TRIGGER (Sr=${currentSr}) UPDATE DETECTED!`);
            console.log(`   Old priceWithVat: ${currentItem.priceWithVat}`);
            console.log(`   New priceWithVat: ${updatedItem.priceWithVat}`);
            console.log(`🔄 Triggering recalculation of ALL cable prices...`);
            console.log(`${"*".repeat(60)}\n`);

            try {
                const recalculatedCables = await recalculateAllCablePrices();
                console.log(`✅ Successfully recalculated ${recalculatedCables.length} cable prices`);
            } catch (recalcError) {
                console.error(`❌ Error recalculating cable prices:`, recalcError);
                throw new Error(`Pricing item updated but failed to recalculate cable prices: ${recalcError.message}`);
            }
        }

        // If this is Electrical Component Factor (Sr=22), recalculate all cable lugs and heat shrink prices
        if (isCableLugsHeatShrinkTrigger(currentSr) && data.priceWithVat !== undefined) {
            console.log(`\n${"*".repeat(60)}`);
            console.log(`🔄 CABLE LUGS & HEAT SHRINK TRIGGER (Sr=${currentSr}) UPDATE DETECTED!`);
            console.log(`   Old priceWithVat: ${currentItem.priceWithVat}`);
            console.log(`   New priceWithVat: ${updatedItem.priceWithVat}`);
            console.log(`🔄 Triggering recalculation of ALL cable lugs & heat shrink prices...`);
            console.log(`${"*".repeat(60)}\n`);

            try {
                const recalculatedLugs = await recalculateAllCableLugsAndHeatShrinkPrices();
                console.log(`✅ Successfully recalculated ${recalculatedLugs.length} cable lugs & heat shrink prices`);
            } catch (recalcError) {
                console.error(`❌ Error recalculating cable lugs & heat shrink prices:`, recalcError);
                throw new Error(`Pricing item updated but failed to recalculate cable lugs & heat shrink prices: ${recalcError.message}`);
            }
        }

        // If this is sr=21 or sr=22, also recalculate all electrical prices (Flex Connector, Gland, Brass Bar, Elec Box, Total)
        if ((isCablePricingTrigger(currentSr) || isCableLugsHeatShrinkTrigger(currentSr)) && data.priceWithVat !== undefined) {
            console.log(`\n${"*".repeat(60)}`);
            console.log(`🔄 ELECTRICAL PRICES TRIGGER (Sr=${currentSr}) UPDATE DETECTED!`);
            console.log(`🔄 Triggering recalculation of ALL electrical prices (Flex Connector, Gland, Brass Bar, Elec Box, Total)...`);
            console.log(`${"*".repeat(60)}\n`);

            try {
                const recalculatedElectrical = await recalculateAllElectricalPrices();
                console.log(`✅ Successfully recalculated ${recalculatedElectrical.length} electrical prices`);
            } catch (recalcError) {
                console.error(`❌ Error recalculating electrical prices:`, recalcError);
                throw new Error(`Pricing item updated but failed to recalculate electrical prices: ${recalcError.message}`);
            }
        }

        return updatedItem;
    },

    /**
     * Delete a pricing item
     */
    async deleteItem(id) {
        return await prisma.pricingItem.delete({
            where: { id: parseInt(id) },
        });
    },

    /**
     * Log pricing action for audit trail
     */
    async logAction(adminId, action, categoryId, itemId, details, oldValue, newValue) {
        return await prisma.pricingLog.create({
            data: {
                adminId,
                action,
                categoryId,
                itemId,
                details,
                oldValue: oldValue ? JSON.stringify(oldValue) : null,
                newValue: newValue ? JSON.stringify(newValue) : null,
            },
        });
    },

    /**
     * Get pricing logs with pagination
     */
    async getLogs(page = 1, limit = 20) {
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            prisma.pricingLog.findMany({
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: "desc" },
            }),
            prisma.pricingLog.count(),
        ]);

        return {
            logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        };
    },
};

export default PricingItemsService;
