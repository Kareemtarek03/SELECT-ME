import { parsePrice, calculateAccessoryPriceWithVat, getBoltsAndNutsPrice } from "../shared/pricingUtils.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

/**
 * Helper function to dynamically calculate priceWithVatLe for an accessory
 * This ensures the price is always current based on the latest Bolts & Nuts price
 * @param {Object} accessory - The accessory record from database
 * @param {number} boltsPrice - The current Bolts & Nuts price per KG
 * @returns {Object} - Accessory with recalculated priceWithVatLe
 */
const computeAccessoryPrice = (accessory, boltsPrice) => {
    const vinylStickers = parsePrice(accessory.vinylStickersLe) || 0;
    const namePlate = parsePrice(accessory.namePlateLe) || 0;
    const packing = parsePrice(accessory.packingLe) || 0;
    const labourCost = parsePrice(accessory.labourCostLe) || 0;
    const internalTransportation = parsePrice(accessory.internalTransportationLe) || 0;
    const boltsAndNutsKg = parsePrice(accessory.boltsAndNutsKg) || 0;

    // Formula: sum of costs + (bolts_kg * bolts_price_with_vat)
    // No extra VAT multiplication, no electrical factor
    const priceWithVatLe = Math.round((
        vinylStickers +
        namePlate +
        packing +
        labourCost +
        internalTransportation +
        (boltsAndNutsKg * boltsPrice)
    ) * 100) / 100;

    return {
        ...accessory,
        priceWithVatLe,
    };
};

/**
 * Accessories Pricing Service
 * Handles CRUD operations for accessory_pricing table
 * 
 * IMPORTANT: priceWithVatLe is ALWAYS dynamically calculated on fetch
 * using the current Bolts & Nuts price (sr=24) from pricing_items
 */
export const AccessoriesService = {
    /**
     * Get all accessories with dynamically calculated prices
     */
    async getAll() {
        const accessories = await prisma.accessoryPricing.findMany({
            orderBy: [
                { fanModel: "asc" },
                { fanSizeMm: "asc" },
            ],
        });

        // Get current Bolts & Nuts price for dynamic calculation
        const boltsPrice = await getBoltsAndNutsPrice();

        // Recalculate priceWithVatLe for each accessory
        return accessories.map(acc => computeAccessoryPrice(acc, boltsPrice));
    },

    /**
     * Get accessory by ID with dynamically calculated price
     */
    async getById(id) {
        const accessory = await prisma.accessoryPricing.findUnique({
            where: { id: parseInt(id) },
        });

        if (!accessory) return null;

        // Get current Bolts & Nuts price for dynamic calculation
        const boltsPrice = await getBoltsAndNutsPrice();

        return computeAccessoryPrice(accessory, boltsPrice);
    },

    /**
     * Get accessories by fan model with dynamically calculated prices
     */
    async getByFanModel(fanModel) {
        const accessories = await prisma.accessoryPricing.findMany({
            where: { fanModel },
            orderBy: { fanSizeMm: "asc" },
        });

        // Get current Bolts & Nuts price for dynamic calculation
        const boltsPrice = await getBoltsAndNutsPrice();

        return accessories.map(acc => computeAccessoryPrice(acc, boltsPrice));
    },

    /**
     * Get accessory by fan model and size with dynamically calculated price
     * Used for fetching pricing in Results Page
     */
    async getByFanModelAndSize(fanModel, fanSizeMm) {
        const accessory = await prisma.accessoryPricing.findFirst({
            where: {
                fanModel,
                fanSizeMm: parseInt(fanSizeMm),
            },
        });

        if (!accessory) return null;

        // Get current Bolts & Nuts price for dynamic calculation
        const boltsPrice = await getBoltsAndNutsPrice();

        return computeAccessoryPrice(accessory, boltsPrice);
    },

    /**
     * Create a new accessory
     * Note: priceWithVatLe is always calculated server-side
     */
    async create(data) {
        const priceWithVatLe = await calculateAccessoryPriceWithVat(data);

        return await prisma.accessoryPricing.create({
            data: {
                sr: parseInt(data.sr),
                fanModel: data.fanModel,
                fanSizeMm: parseInt(data.fanSizeMm),
                vinylStickersLe: parsePrice(data.vinylStickersLe),
                namePlateLe: parsePrice(data.namePlateLe),
                packingLe: parsePrice(data.packingLe),
                labourCostLe: parsePrice(data.labourCostLe),
                internalTransportationLe: parsePrice(data.internalTransportationLe),
                boltsAndNutsKg: parsePrice(data.boltsAndNutsKg),
                priceWithVatLe,
            },
        });
    },

    /**
     * Update an accessory
     * Note: priceWithVatLe is always recalculated server-side
     */
    async update(id, data) {
        const existing = await prisma.accessoryPricing.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existing) {
            throw new Error("Accessory not found");
        }

        const updateData = {};

        if (data.sr !== undefined) updateData.sr = parseInt(data.sr);
        if (data.fanModel !== undefined) updateData.fanModel = data.fanModel;
        if (data.fanSizeMm !== undefined) updateData.fanSizeMm = parseInt(data.fanSizeMm);
        if (data.vinylStickersLe !== undefined) updateData.vinylStickersLe = parsePrice(data.vinylStickersLe);
        if (data.namePlateLe !== undefined) updateData.namePlateLe = parsePrice(data.namePlateLe);
        if (data.packingLe !== undefined) updateData.packingLe = parsePrice(data.packingLe);
        if (data.labourCostLe !== undefined) updateData.labourCostLe = parsePrice(data.labourCostLe);
        if (data.internalTransportationLe !== undefined) updateData.internalTransportationLe = parsePrice(data.internalTransportationLe);
        if (data.boltsAndNutsKg !== undefined) updateData.boltsAndNutsKg = parsePrice(data.boltsAndNutsKg);

        // Merge existing data with updates for VAT calculation
        const mergedData = {
            vinylStickersLe: updateData.vinylStickersLe ?? existing.vinylStickersLe,
            namePlateLe: updateData.namePlateLe ?? existing.namePlateLe,
            packingLe: updateData.packingLe ?? existing.packingLe,
            labourCostLe: updateData.labourCostLe ?? existing.labourCostLe,
            internalTransportationLe: updateData.internalTransportationLe ?? existing.internalTransportationLe,
            boltsAndNutsKg: updateData.boltsAndNutsKg ?? existing.boltsAndNutsKg,
        };

        // Always recalculate priceWithVatLe
        updateData.priceWithVatLe = await calculateAccessoryPriceWithVat(mergedData);

        return await prisma.accessoryPricing.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
    },

    /**
     * Delete an accessory
     */
    async delete(id) {
        return await prisma.accessoryPricing.delete({
            where: { id: parseInt(id) },
        });
    },

    /**
     * Get Bolts & Nuts price (for frontend display)
     */
    async getBoltsAndNutsPrice() {
        return await getBoltsAndNutsPrice();
    },
};

export default AccessoriesService;
