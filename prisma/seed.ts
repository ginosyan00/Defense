import {
  BuildingStatus,
  DistrictStatus,
  InteractionType,
  PrismaClient,
  ProjectStatus,
  SpatialVariant,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { slug: "defense-residence" },
    update: {
      name: "Defense Residence",
      description:
        "Ճարտարապետական թաղամաս՝ ինտերակտիվ aerial masterplan ներկայացմամբ։",
      status: ProjectStatus.PUBLISHED,
      location: "Yerevan, Armenia",
      publishedAt: new Date(),
    },
    create: {
      name: "Defense Residence",
      slug: "defense-residence",
      description:
        "Ճարտարապետական թաղամաս՝ ինտերակտիվ aerial masterplan ներկայացմամբ։",
      status: ProjectStatus.PUBLISHED,
      location: "Yerevan, Armenia",
      publishedAt: new Date(),
    },
  });

  await prisma.masterplanAsset.deleteMany({
    where: { projectId: project.id, districtId: null },
  });
  await prisma.masterplanAsset.create({
    data: {
      projectId: project.id,
      variant: SpatialVariant.DESKTOP,
      imageUrl: "/masterplans/placeholder-aerial.svg",
      mobileImageUrl: "/masterplans/placeholder-aerial.svg",
      width: 2400,
      height: 1600,
      viewBox: "0 0 2400 1600",
      initialZoom: 1,
      minZoom: 1,
      maxZoom: 4,
    },
  });

  const districts = [
    {
      slug: "district-a",
      name: "Թաղամաս Ա",
      markerLabel: "Ա",
      markerX: 0.28,
      markerY: 0.42,
      svgPath: "M 420 480 L 780 420 L 860 720 L 480 780 Z",
      status: DistrictStatus.AVAILABLE,
      sortOrder: 1,
      svgElementId: "district-a",
      planImage: "/masterplans/district-a-placeholder.svg",
      buildings: [
        {
          slug: "a1",
          name: "Շենք 01",
          buildingNumber: "1",
          markerLabel: "01",
          markerX: 0.32,
          markerY: 0.4,
          svgPath: "M 480 420 L 620 400 L 640 700 L 500 720 Z",
          sortOrder: 1,
        },
        {
          slug: "a2",
          name: "Շենք 02",
          buildingNumber: "2",
          markerLabel: "02",
          markerX: 0.48,
          markerY: 0.42,
          svgPath: "M 780 430 L 920 410 L 940 700 L 800 720 Z",
          sortOrder: 2,
        },
        {
          slug: "a3",
          name: "Շենք 03",
          buildingNumber: "3",
          markerLabel: "03",
          markerX: 0.64,
          markerY: 0.4,
          svgPath: "M 1120 410 L 1260 400 L 1280 690 L 1140 710 Z",
          sortOrder: 3,
        },
        {
          slug: "a4",
          name: "Շենք 04",
          buildingNumber: "4",
          markerLabel: "04",
          markerX: 0.78,
          markerY: 0.42,
          svgPath: "M 1400 420 L 1540 400 L 1560 690 L 1420 710 Z",
          sortOrder: 4,
        },
      ],
    },
    {
      slug: "district-b",
      name: "Թաղամաս Բ",
      markerLabel: "Բ",
      markerX: 0.58,
      markerY: 0.36,
      svgPath: "M 1180 360 L 1580 320 L 1680 640 L 1240 700 Z",
      status: DistrictStatus.AVAILABLE,
      sortOrder: 2,
      svgElementId: "district-b",
      planImage: "/masterplans/district-b-placeholder.svg",
      buildings: [
        {
          slug: "b1",
          name: "Շենք 01",
          buildingNumber: "1",
          markerLabel: "01",
          markerX: 0.36,
          markerY: 0.42,
          svgPath: "M 560 400 L 720 380 L 740 720 L 580 740 Z",
          sortOrder: 1,
        },
        {
          slug: "b2",
          name: "Շենք 02",
          buildingNumber: "2",
          markerLabel: "02",
          markerX: 0.52,
          markerY: 0.4,
          svgPath: "M 860 390 L 1020 370 L 1040 720 L 880 740 Z",
          sortOrder: 2,
        },
        {
          slug: "b3",
          name: "Շենք 03",
          buildingNumber: "3",
          markerLabel: "03",
          markerX: 0.68,
          markerY: 0.42,
          svgPath: "M 1180 400 L 1340 390 L 1360 720 L 1200 740 Z",
          sortOrder: 3,
        },
      ],
    },
    {
      slug: "district-g",
      name: "Թաղամաս Գ",
      markerLabel: "Գ",
      markerX: 0.72,
      markerY: 0.62,
      svgPath: "M 1480 860 L 1860 820 L 1920 1120 L 1520 1180 Z",
      status: DistrictStatus.COMING_SOON,
      sortOrder: 3,
      svgElementId: "district-g",
      planImage: "/masterplans/district-a-placeholder.svg",
      buildings: [],
    },
    {
      slug: "district-d",
      name: "Թաղամաս Դ",
      markerLabel: "Դ",
      markerX: 0.38,
      markerY: 0.7,
      svgPath: "M 640 980 L 980 940 L 1040 1220 L 700 1280 Z",
      status: DistrictStatus.SOLD_OUT,
      sortOrder: 4,
      svgElementId: "district-d",
      planImage: "/masterplans/district-a-placeholder.svg",
      buildings: [],
    },
  ] as const;

  for (const district of districts) {
    const row = await prisma.district.upsert({
      where: {
        projectId_slug: {
          projectId: project.id,
          slug: district.slug,
        },
      },
      update: {
        name: district.name,
        description: `${district.name}՝ մոտիկ aerial render և շենքերի ընտրություն։`,
        markerLabel: district.markerLabel,
        markerX: district.markerX,
        markerY: district.markerY,
        svgPath: district.svgPath,
        interactionType: InteractionType.MARKER_AND_POLYGON,
        status: district.status,
        sortOrder: district.sortOrder,
        svgElementId: district.svgElementId,
      },
      create: {
        projectId: project.id,
        name: district.name,
        slug: district.slug,
        description: `${district.name}՝ մոտիկ aerial render և շենքերի ընտրություն։`,
        markerLabel: district.markerLabel,
        markerX: district.markerX,
        markerY: district.markerY,
        svgPath: district.svgPath,
        interactionType: InteractionType.MARKER_AND_POLYGON,
        status: district.status,
        sortOrder: district.sortOrder,
        svgElementId: district.svgElementId,
      },
    });

    await prisma.masterplanAsset.deleteMany({ where: { districtId: row.id } });
    await prisma.masterplanAsset.create({
      data: {
        projectId: project.id,
        districtId: row.id,
        variant: SpatialVariant.DESKTOP,
        imageUrl: district.planImage,
        mobileImageUrl: district.planImage,
        width: 2000,
        height: 1400,
        viewBox: "0 0 2000 1400",
        initialZoom: 1,
        minZoom: 1,
        maxZoom: 4,
      },
    });

    for (const building of district.buildings) {
      const buildingRow = await prisma.building.upsert({
        where: {
          districtId_slug: {
            districtId: row.id,
            slug: building.slug,
          },
        },
        update: {
          name: building.name,
          buildingNumber: building.buildingNumber,
          description: `${building.name}՝ interactive building entry (floors Phase 4, 3D Phase 6).`,
          markerLabel: building.markerLabel,
          markerX: building.markerX,
          markerY: building.markerY,
          svgPath: building.svgPath,
          interactionType: InteractionType.MARKER_AND_POLYGON,
          status: BuildingStatus.UNDER_CONSTRUCTION,
          sortOrder: building.sortOrder,
          svgElementId: `building-${building.slug}`,
        },
        create: {
          districtId: row.id,
          name: building.name,
          slug: building.slug,
          buildingNumber: building.buildingNumber,
          description: `${building.name}՝ interactive building entry (floors Phase 4, 3D Phase 6).`,
          markerLabel: building.markerLabel,
          markerX: building.markerX,
          markerY: building.markerY,
          svgPath: building.svgPath,
          interactionType: InteractionType.MARKER_AND_POLYGON,
          status: BuildingStatus.UNDER_CONSTRUCTION,
          sortOrder: building.sortOrder,
          svgElementId: `building-${building.slug}`,
        },
      });

      for (let floorNumber = 1; floorNumber <= 5; floorNumber += 1) {
        await prisma.floor.upsert({
          where: {
            buildingId_floorNumber: {
              buildingId: buildingRow.id,
              floorNumber,
            },
          },
          update: {
            name: `Հարկ ${floorNumber}`,
            meshName: `Floor_${String(floorNumber).padStart(2, "0")}`,
            sortOrder: floorNumber,
          },
          create: {
            buildingId: buildingRow.id,
            floorNumber,
            name: `Հարկ ${floorNumber}`,
            meshName: `Floor_${String(floorNumber).padStart(2, "0")}`,
            sortOrder: floorNumber,
          },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
