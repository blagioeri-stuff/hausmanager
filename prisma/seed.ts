import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.maintenanceEntry.deleteMany();
  await prisma.document.deleteMany();
  await prisma.homeComponent.deleteMany();

  // Seed: Einfamilienhaus, Baujahr 2003
  const heizung = await prisma.homeComponent.create({
    data: {
      name: 'Ölheizung',
      typeKey: 'heizung',
      buildYear: 2008,
      notes: 'Viessmann Vitola, 25kW',
    },
  });

  const kueche = await prisma.homeComponent.create({
    data: {
      name: 'Küche EG',
      typeKey: 'kueche',
      buildYear: 2003,
      notes: 'Küche aus Hausbau, komplett mit Geräten',
    },
  });

  const badOG = await prisma.homeComponent.create({
    data: {
      name: 'Badezimmer OG',
      typeKey: 'badezimmer',
      buildYear: 2003,
    },
  });

  const badEG = await prisma.homeComponent.create({
    data: {
      name: 'WC Gäste EG',
      typeKey: 'wc',
      buildYear: 2003,
    },
  });

  const dach = await prisma.homeComponent.create({
    data: {
      name: 'Ziegeldach',
      typeKey: 'dach',
      buildYear: 2003,
      notes: 'Tonziegel, Steildach',
    },
  });

  const fenster = await prisma.homeComponent.create({
    data: {
      name: 'Fenster & Balkontüren',
      typeKey: 'fenster',
      buildYear: 2003,
      customCostChf: 30000,
      notes: '18 Elemente, 3-fach Verglasung',
    },
  });

  const fassade = await prisma.homeComponent.create({
    data: {
      name: 'Verputzte Fassade',
      typeKey: 'fassade',
      buildYear: 2003,
    },
  });

  const maler = await prisma.homeComponent.create({
    data: {
      name: 'Innenmalerarbeiten',
      typeKey: 'maler_innen',
      buildYear: 2018,
      notes: 'Letzte Renovation 2018',
    },
  });

  const geraete = await prisma.homeComponent.create({
    data: {
      name: 'Küchengeräte',
      typeKey: 'kuechen_geraete',
      buildYear: 2015,
    },
  });

  // Maintenance entries
  await prisma.maintenanceEntry.createMany({
    data: [
      {
        componentId: heizung.id,
        date: new Date('2024-09-15'),
        description: 'Jahresservice und Brennereinstellung',
        costChf: 380,
        serviceProvider: 'Heizung & Sanitär Müller AG',
      },
      {
        componentId: heizung.id,
        date: new Date('2023-09-20'),
        description: 'Jahresservice',
        costChf: 360,
        serviceProvider: 'Heizung & Sanitär Müller AG',
      },
      {
        componentId: heizung.id,
        date: new Date('2022-10-05'),
        description: 'Öltank gereinigt, Jahresservice',
        costChf: 520,
        serviceProvider: 'Heizung & Sanitär Müller AG',
      },
      {
        componentId: dach.id,
        date: new Date('2020-03-10'),
        description: 'Dachdecker: Moos entfernt, Ziegel kontrolliert, 3 Ziegel ersetzt',
        costChf: 890,
        serviceProvider: 'Dachdecker Stalder',
      },
      {
        componentId: kueche.id,
        date: new Date('2019-06-01'),
        description: 'Geschirrspüler ersetzt (Bosch)',
        costChf: 750,
        serviceProvider: 'Elektro Hürlimann',
      },
      {
        componentId: maler.id,
        date: new Date('2018-04-15'),
        description: 'Gesamte Innenflächen neu gestrichen',
        costChf: 8200,
        serviceProvider: 'Maler Bern GmbH',
      },
    ],
  });

  console.log('✅ Seed abgeschlossen:');
  console.log(`   ${await prisma.homeComponent.count()} Komponenten`);
  console.log(`   ${await prisma.maintenanceEntry.count()} Wartungseinträge`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
