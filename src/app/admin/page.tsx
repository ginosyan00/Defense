import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminHomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    include: {
      districts: {
        orderBy: { sortOrder: "asc" },
        include: {
          buildings: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  return (
    <main className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Mapping editors
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)]">
          Place markers, draw polygons, bind SVG element IDs and GLB mesh names
          without typing CSS pixels.
        </p>
        <p className="mt-3">
          <Link
            href="/admin/mapping-lab"
            className="border border-[var(--mp-ink)] px-3 py-2 text-xs uppercase tracking-[0.14em]"
          >
            Universal mapping lab (MVP)
          </Link>
        </p>
      </div>

      {projects.map((project) => (
        <section key={project.id} className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              {project.name}
            </h2>
            <Link
              href={`/admin/projects/${project.slug}/masterplan`}
              className="border border-[var(--mp-ink)] px-3 py-2 text-xs uppercase tracking-[0.14em]"
            >
              Masterplan editor
            </Link>
          </div>

          <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
            {project.districts.map((district) => (
              <li key={district.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm">{district.name}</p>
                    <p className="text-xs text-[var(--mp-ink-muted)]">
                      {district.buildings.length} buildings
                    </p>
                  </div>
                  <Link
                    href={`/admin/projects/${project.slug}/districts/${district.slug}`}
                    className="text-xs uppercase tracking-[0.14em] underline-offset-4 hover:underline"
                  >
                    Building editor
                  </Link>
                </div>
                {district.buildings.length > 0 ? (
                  <ul className="mt-3 space-y-1 pl-3 text-xs text-[var(--mp-ink-muted)]">
                    {district.buildings.map((building) => (
                      <li key={building.id} className="flex flex-wrap gap-3">
                        <span>{building.name}</span>
                        <Link
                          href={`/admin/projects/${project.slug}/districts/${district.slug}/buildings/${building.slug}/floors/1`}
                          className="underline-offset-4 hover:underline"
                        >
                          Apartment map
                        </Link>
                        <Link
                          href={`/admin/projects/${project.slug}/districts/${district.slug}/buildings/${building.slug}/render`}
                          className="underline-offset-4 hover:underline"
                        >
                          Building floors
                        </Link>
                        <Link
                          href={`/admin/projects/${project.slug}/districts/${district.slug}/buildings/${building.slug}/3d`}
                          className="underline-offset-4 hover:underline"
                        >
                          3D meshes
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
