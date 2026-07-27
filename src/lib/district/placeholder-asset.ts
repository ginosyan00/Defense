export type DistrictPlaceholderAsset = {
  id: string;
  imageUrl: string;
  mobileImageUrl: string;
  width: number;
  height: number;
  viewBox: string;
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
};

/**
 * Shared public + admin placeholder contract so mapping coords stay aligned.
 */
export function getDistrictPlaceholderAsset(
  districtSlug: string,
): DistrictPlaceholderAsset {
  if (districtSlug === "district-a") {
    return {
      id: `placeholder-${districtSlug}`,
      imageUrl: "/masterplans/district-a-aerial.png",
      mobileImageUrl: "/masterplans/district-a-aerial.png",
      width: 1024,
      height: 512,
      viewBox: "0 0 1024 512",
      initialZoom: 1,
      minZoom: 1,
      maxZoom: 4,
    };
  }

  const known = districtSlug === "district-b" ? "district-b" : "district-b";
  return {
    id: `placeholder-${districtSlug}`,
    imageUrl: `/masterplans/${known}-placeholder.svg`,
    mobileImageUrl: `/masterplans/${known}-placeholder.svg`,
    width: 2000,
    height: 1400,
    viewBox: "0 0 2000 1400",
    initialZoom: 1,
    minZoom: 1,
    maxZoom: 4,
  };
}
