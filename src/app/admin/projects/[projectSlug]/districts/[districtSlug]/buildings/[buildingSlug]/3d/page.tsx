import Link from "next/link";
import { notFound } from "next/navigation";
import { Building3dMapper } from "@/components/admin/Building3dMapper";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{
    projectSlug: string;
    districtSlug: string;
    buildingSlug: string;
  }>;
};

export default async function AdminBuilding3dPage({ params }: PageProps) {
  const { projectSlug, districtSlug, buildingSlug } = await params;

  const building = await prisma.building.findFirst({
    where: {
      slug: buildingSlug,
      district: {
        slug: districtSlug,
        project: { slug: projectSlug },
      },
    },
    include: {
      floors: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!building) notFound();

  // Conventional mesh names for procedural preview + admin mapping.
  // When a GLB is uploaded later, map Floor_XX names to its meshes here.
  const discoveredMeshes = [
    "Ground",
    ...building.floors.map(
      (floor) => floor.meshName || `Floor_${String(floor.floorNumber).padStart(2, "0")}`,
    ),
    "Roof",
  ];

  return (
    <main className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
        >
          ← Admin
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          3D mesh mapping · {building.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--mp-ink-muted)]">
          {building.model3dUrl
            ? `GLB՝ ${building.model3dUrl}`
            : "GLB դեռ չկա — public page-ը ցույց է տալիս procedural 3D preview՝ այս mesh անուններով։"}
        </p>
      </div>

      <Building3dMapper
        projectSlug={projectSlug}
        districtSlug={districtSlug}
        buildingSlug={buildingSlug}
        model3dUrl={building.model3dUrl}
        discoveredMeshes={discoveredMeshes}
        initialFloors={building.floors.map((floor) => ({
          id: floor.id,
          floorNumber: floor.floorNumber,
          name: floor.name,
          meshName: floor.meshName,
        }))}
      />
    </main>
  );
}
