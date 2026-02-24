import * as svc from "./centrifugalExcel.service.js";

function makeExportHandler(exportFn) {
  return async (req, res) => {
    try { await exportFn(res); }
    catch (e) { console.error("Export error:", e); res.status(500).json({ error: e.message }); }
  };
}

function makeImportHandler(importFn) {
  return async (req, res) => {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) return res.status(400).json({ error: "fileBase64 is required" });
      const result = await importFn(fileBase64);
      res.json(result);
    } catch (e) {
      console.error("Import error:", e);
      res.status(500).json({ error: e.message });
    }
  };
}

export const exportCentrifugalFanData = makeExportHandler(svc.exportCentrifugalFanData);
export const importCentrifugalFanData = makeImportHandler(svc.importCentrifugalFanData);
export const exportPulleys = makeExportHandler(svc.exportPulleys);
export const importPulleys = makeImportHandler(svc.importPulleys);
export const exportBeltStandards = makeExportHandler(svc.exportBeltStandards);
export const importBeltStandards = makeImportHandler(svc.importBeltStandards);
export const exportPulleyStandards = makeExportHandler(svc.exportPulleyStandards);
export const importPulleyStandards = makeImportHandler(svc.importPulleyStandards);
export const exportCasingPricingAll = makeExportHandler(svc.exportCasingPricingAll);
export const importCasingPricingAll = makeImportHandler(svc.importCasingPricingAll);
export const exportAccessoryPricing = makeExportHandler(svc.exportAccessoryPricing);
export const importAccessoryPricing = makeImportHandler(svc.importAccessoryPricing);
export const exportAxialImpellerBlades = makeExportHandler(svc.exportAxialImpellerBlades);
export const importAxialImpellerBlades = makeImportHandler(svc.importAxialImpellerBlades);
export const exportAxialImpellerHubs = makeExportHandler(svc.exportAxialImpellerHubs);
export const importAxialImpellerHubs = makeImportHandler(svc.importAxialImpellerHubs);
export const exportAxialImpellerFrames = makeExportHandler(svc.exportAxialImpellerFrames);
export const importAxialImpellerFrames = makeImportHandler(svc.importAxialImpellerFrames);
export const exportAxialCasingPricing = makeExportHandler(svc.exportAxialCasingPricing);
export const importAxialCasingPricing = makeImportHandler(svc.importAxialCasingPricing);
