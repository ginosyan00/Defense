import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("3D code splitting boundary", () => {
  it("does not import three.js from masterplan module", () => {
    const masterplanDir = path.join(
      process.cwd(),
      "src/components/masterplan",
    );
    const files = [
      "InteractiveMasterplan.tsx",
      "MasterplanViewport.tsx",
      "MasterplanSvgOverlay.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(masterplanDir, file), "utf8");
      expect(source).not.toMatch(/three|@react-three/);
    }
  });

  it("loads Building3DViewer through dynamic import with ssr:false when used", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/components/building-3d/Building3DViewerLazy.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("ssr: false");
    expect(source).toContain("Building3DViewer");
  });
});

describe("building page 3D island", () => {
  it("mounts lazy 3D viewer without a static three.js import", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/app/projects/[projectSlug]/districts/[districtSlug]/buildings/[buildingSlug]/page.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("Building3DViewerLazy");
    expect(source).toContain("BuildingRenderViewer");
    expect(source).not.toMatch(/from ["']three["']|from ["']@react-three/);
    expect(source).not.toMatch(
      /from ["']@\/components\/building-3d\/Building3DViewer["']/,
    );
  });
});
