import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function seedFanData() {
  console.log("🌬️ Seeding FanData...");
  // Clear existing fan data
  await prisma.fanData.deleteMany({});
  const fans = JSON.parse(fs.readFileSync("./server/axialFan.json", "utf-8"));

  for (const fanJson of fans) {
    await prisma.fanData.create({
      data: {
        No: fanJson.No,
        Model: fanJson.Model,
        AFS: fanJson["AF-S"],
        AFL: fanJson["AF-L"],
        WF: fanJson.WF,
        ARTF: fanJson.ARTF,
        SF: fanJson.SF,
        ABSFC: fanJson["ABSF-C"],
        ABSFS: fanJson["ABSF-S"],
        SABF: fanJson.SABF,
        SARTF: fanJson.SARTF,
        AJF: fanJson.AJF,
        bladesSymbol: fanJson.Blades.symbol,
        bladesMaterial: fanJson.Blades.material,
        noBlades: fanJson.Blades.noBlades,
        bladesAngle: fanJson.Blades.angle,
        hubType: fanJson.hubType,
        impellerConf: fanJson.Impeller.conf,
        impellerInnerDia: fanJson.Impeller.innerDia,
        desigDensity: fanJson.desigDensity,
        RPM: fanJson.RPM,
        airFlow: JSON.stringify(fanJson.airFlow),
        totPressure: JSON.stringify(fanJson.totPressure),
        velPressure: JSON.stringify(fanJson.velPressure),
        staticPressure: JSON.stringify(fanJson.staticPressure),
        fanInputPow: JSON.stringify(fanJson.fanInputPow),
      },
    });
  }

  console.log("✅ FanData seeded successfully!");
}

async function seedMotorData() {
  console.log("⚙️ Seeding MotorData...");
  const motors = JSON.parse(
    fs.readFileSync("./server/MotorData.json", "utf-8")
  );

  if (Array.isArray(motors)) {
    for (const motorJson of motors) {
      await prisma.motorData.create({
        data: {
          material: motorJson.material,
          model: motorJson.model,
          powerKW: motorJson.powerKW,
          speedRPM: motorJson.speedRPM,
          NoPoles: motorJson.NoPoles,
          rated: motorJson.rated ? JSON.stringify(motorJson.rated) : null,
          DOL: motorJson.DOL ? JSON.stringify(motorJson.DOL) : null,
          starDelta: motorJson.starDelta ? JSON.stringify(motorJson.starDelta) : null,
          powerFactor: motorJson.powerFactor,
          Phase: motorJson.Phase,
          frameSize: motorJson.frameSize,
          shaftDia: motorJson.shaftDia,
          shaftLength: motorJson.shaftLength,
          shaftFeather: motorJson.shaftFeather,
          IE: motorJson.IE,
          frontBear: motorJson.frontBear,
          rearBear: motorJson.rearBear || "",
          noiseLvl: motorJson.noiseLvl,
          weightKg: motorJson.weightKg,
          effCurve: motorJson.effCurve ? JSON.stringify(motorJson.effCurve) : null,
          NoCapacitors: motorJson.NoCapacitors,
          NoPhases: motorJson.NoPhases,
          insClass: motorJson.insClass,
          powerHorse: motorJson.powerHorse,
          netpower: motorJson.netpower,
        },
      });
    }
    console.log(`✅ Seeded ${motors.length} motor records successfully!`);
  } else {
    // Single object
    await prisma.motorData.create({
      data: {
        material: motors.material,
        model: motors.model,
        powerKW: motors.powerKW,
        speedRPM: motors.speedRPM,
        NoPoles: motors.NoPoles,
        rated: motors.rated ? JSON.stringify(motors.rated) : null,
        DOL: motors.DOL ? JSON.stringify(motors.DOL) : null,
        starDelta: motors.starDelta ? JSON.stringify(motors.starDelta) : null,
        powerFactor: motors.powerFactor,
        Phase: motors.Phase,
        frameSize: motors.frameSize,
        shaftDia: motors.shaftDia,
        shaftLength: motors.shaftLength,
        shaftFeather: motors.shaftFeather,
        IE: motors.IE,
        frontBear: motors.frontBear,
        rearBear: motors.rearBear || "",
        noiseLvl: motors.noiseLvl,
        weightKg: motors.weightKg,
        effCurve: motors.effCurve ? JSON.stringify(motors.effCurve) : null,
        NoCapacitors: motors.NoCapacitors,
        NoPhases: motors.NoPhases,
        insClass: motors.insClass,
        powerHorse: motors.powerHorse,
        netpower: motors.netpower,
      },
    });
    console.log(`✅ Seeded 1 motor record successfully!`);
  }

  console.log("✅ MotorData seeded successfully!");
}

async function seedCentrifugalFanData() {
  console.log("🌀 Seeding CentrifugalFanData...");
  await prisma.centrifugalFanData.deleteMany({});

  const centrifugalFans = JSON.parse(
    fs.readFileSync("./server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFan.json", "utf-8")
  );

  for (const fan of centrifugalFans) {
    await prisma.centrifugalFanData.create({
      data: {
        bladesType: fan.Blades?.Type,
        bladesModel: fan.Blades?.Model,
        minSpeedRPM: fan.Blades?.minSpeedRPM,
        highSpeedRPM: fan.Blades?.highSpeedRPM,
        impellerType: fan.Impeller?.impellerType,
        fanShaftDiameter: fan.Impeller?.fanShaftDiameter,
        innerDiameter: fan.Impeller?.innerDiameter,
        desigDensity: fan.desigDensity,
        RPM: fan.RPM,
        airFlow: JSON.stringify(fan.airFlow),
        totPressure: JSON.stringify(fan.totPressure),
        velPressure: JSON.stringify(fan.velPressure),
        staticPressure: JSON.stringify(fan.staticPressure),
        fanInputPow: JSON.stringify(fan.fanInputPow),
      },
    });
  }
  console.log(`✅ Seeded ${centrifugalFans.length} centrifugal fan records!`);
}

async function seedCentrifugalMotorData() {
  console.log("⚙️ Seeding CentrifugalMotorData...");
  await prisma.centrifugalMotorData.deleteMany({});

  const motors = JSON.parse(
    fs.readFileSync("./server/Newmodules/centrifugal/CentrifugalFanData/MotorData.json", "utf-8")
  );

  if (Array.isArray(motors)) {
    for (const motor of motors) {
      // Handle different field naming conventions in centrifugal motor data
      const parseFloat_ = (val) => {
        if (val === null || val === undefined || val === "") return null;
        const parsed = parseFloat(String(val).replace(/,/g, ""));
        return isNaN(parsed) ? null : parsed;
      };
      const parseInt_ = (val) => {
        if (val === null || val === undefined || val === "") return null;
        const parsed = parseInt(String(val).replace(/,/g, ""), 10);
        return isNaN(parsed) ? null : parsed;
      };

      await prisma.centrifugalMotorData.create({
        data: {
          material: motor.Material || motor.material,
          model: motor.Model || motor.model,
          powerKW: parseFloat_(motor["Power (kW)"] || motor.powerKW),
          speedRPM: parseFloat_(motor["Speed (RPM)"] || motor.speedRPM),
          NoPoles: parseInt_(motor["No of Poles"] || motor.NoPoles),
          rated: null,
          DOL: null,
          starDelta: null,
          powerFactor: parseFloat_(motor["Power factor Cos φ"] || motor.powerFactor),
          Phase: parseInt_(motor.Phase),
          frameSize: parseInt_(motor["Frame Size (mm)"] || motor.frameSize),
          shaftDia: parseFloat_(motor["Shaft Diameter (mm)"] || motor.shaftDia),
          shaftLength: parseFloat_(motor["Shaft Length (mm)"] || motor.shaftLength),
          shaftFeather: parseFloat_(motor["Shaft Feather Key Length (mm)"] || motor.shaftFeather),
          IE: parseInt_(motor.IE),
          frontBear: motor["front Brearing"] || motor.frontBear,
          rearBear: motor["Rear Bearing"] || motor.rearBear || "",
          noiseLvl: parseInt_(motor["Noise Level (dB-A)"] || motor.noiseLvl),
          weightKg: parseFloat_(motor["Weight (KG)"] || motor.weightKg),
          effCurve: null,
          NoCapacitors: parseInt_(motor["No. of Capacitors"] || motor.NoCapacitors),
          NoPhases: parseInt_(motor["No. of Phases"] || motor.NoPhases),
          insClass: motor["Insulation Class"] || motor.insClass,
          powerHorse: null,
          netpower: null,
        },
      });
    }
    console.log(`✅ Seeded ${motors.length} centrifugal motor records!`);
  }
}

async function seedPulleyData() {
  console.log("🔧 Seeding PulleyData...");
  await prisma.pulleyData.deleteMany({});

  const pulleyDb = JSON.parse(
    fs.readFileSync("./server/Newmodules/centrifugal/CentrifugalFanData/pully database.json", "utf-8")
  );

  // Store the entire pulley database as a single record per belt section
  if (typeof pulleyDb === 'object') {
    for (const [beltSection, data] of Object.entries(pulleyDb)) {
      await prisma.pulleyData.create({
        data: {
          beltSection: beltSection,
          data: JSON.stringify(data),
        },
      });
    }
  }
  console.log("✅ PulleyData seeded!");
}

async function seedBeltLengthStandard() {
  console.log("📏 Seeding BeltLengthStandard...");
  await prisma.beltLengthStandard.deleteMany({});

  const beltLengths = JSON.parse(
    fs.readFileSync("./server/Newmodules/centrifugal/CentrifugalFanData/Belt Length per Standard.json", "utf-8")
  );

  if (typeof beltLengths === 'object') {
    for (const [beltSection, lengths] of Object.entries(beltLengths)) {
      await prisma.beltLengthStandard.create({
        data: {
          beltSection: beltSection,
          lengths: JSON.stringify(lengths),
        },
      });
    }
  }
  console.log("✅ BeltLengthStandard seeded!");
}

async function seedPulleyStandard() {
  console.log("⚙️ Seeding PulleyStandard...");
  await prisma.pulleyStandard.deleteMany({});

  const pulleyStandards = JSON.parse(
    fs.readFileSync("./server/Newmodules/centrifugal/CentrifugalFanData/Pulleys Standard .json", "utf-8")
  );

  if (Array.isArray(pulleyStandards)) {
    for (const standard of pulleyStandards) {
      await prisma.pulleyStandard.create({
        data: {
          beltSection: standard.beltSection || standard["Belt Section"],
          minPD: standard.minPD || standard["Min PD"],
          maxPD: standard.maxPD || standard["Max PD"],
        },
      });
    }
  } else if (typeof pulleyStandards === 'object') {
    for (const [beltSection, data] of Object.entries(pulleyStandards)) {
      await prisma.pulleyStandard.create({
        data: {
          beltSection: beltSection,
          minPD: data.minPD || data["Min PD"],
          maxPD: data.maxPD || data["Max PD"],
        },
      });
    }
  }
  console.log("✅ PulleyStandard seeded!");
}

async function main() {
  console.log("🚀 Starting full seed process...\n");

  // Axial fan data
  await seedFanData();
  await seedMotorData();

  // Centrifugal fan data
  await seedCentrifugalFanData();
  await seedCentrifugalMotorData();
  await seedPulleyData();
  await seedBeltLengthStandard();
  await seedPulleyStandard();

  console.log("\n🎉 All data seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
