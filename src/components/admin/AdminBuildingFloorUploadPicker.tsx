"use client";

import { useRouter } from "next/navigation";
import {
  BuildingRenderViewer,
  type BuildingRenderFloor,
} from "@/components/building/BuildingRenderViewer";

type AdminBuildingFloorUploadPickerProps = {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  currentFloorNumber: number;
  currentFloorId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  viewBox: string;
  buildingName: string;
  floors: BuildingRenderFloor[];
};

export function AdminBuildingFloorUploadPicker({
  projectSlug,
  districtSlug,
  buildingSlug,
  currentFloorNumber,
  currentFloorId,
  imageUrl,
  imageWidth,
  imageHeight,
  viewBox,
  buildingName,
  floors,
}: AdminBuildingFloorUploadPickerProps) {
  const router = useRouter();

  const openUploadForFloor = (floor: BuildingRenderFloor) => {
    const href = `/admin/projects/${projectSlug}/districts/${districtSlug}/buildings/${buildingSlug}/floors/${floor.floorNumber}#upload`;

    if (floor.floorNumber === currentFloorNumber) {
      const panel = document.getElementById("upload");
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.dispatchEvent(new Event("open-floor-plan-upload"));
      return;
    }

    router.push(href);
  };

  return (
    <BuildingRenderViewer
      compact
      imageUrl={imageUrl}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      viewBox={viewBox}
      buildingName={buildingName}
      initialActiveFloorId={currentFloorId}
      floors={floors}
      onFloorClick={openUploadForFloor}
    />
  );
}
