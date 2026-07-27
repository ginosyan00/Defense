export const JOURNEY_STEPS = [
  {
    id: 1,
    label: "Թաղամաս",
    hint: "Ընտրիր թաղամասը masterplan-ից",
  },
  {
    id: 2,
    label: "Շենք",
    hint: "Ընտրիր շենքը թաղամասի պլանից",
  },
  {
    id: 3,
    label: "Հարկ",
    hint: "Ընտրիր հարկը շենքում",
  },
  {
    id: 4,
    label: "Բնակարան",
    hint: "Դիտիր մանրամասները և կապվիր",
  },
] as const;

export type JourneyStepId = (typeof JOURNEY_STEPS)[number]["id"];

export type JourneyHrefs = {
  1?: string;
  2?: string;
  3?: string;
  4?: string;
};
