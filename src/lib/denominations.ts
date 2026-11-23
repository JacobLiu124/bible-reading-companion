export const DENOMINATIONS = [
  { value: "anglican", label: "Anglican/Episcopal" },
  { value: "baptist", label: "Baptist" },
  { value: "lutheran", label: "Lutheran" },
  { value: "methodist", label: "Methodist" },
  { value: "presbyterian_reformed", label: "Presbyterian/Reformed" },
  { value: "pentecostal_charismatic", label: "Pentecostal/Charismatic" },
  { value: "non_denominational", label: "Non-denominational" },
  { value: "other_protestant", label: "Other Protestant" },
] as const;

export type Denomination = (typeof DENOMINATIONS)[number]["value"];
export const DENOMINATION_VALUES = DENOMINATIONS.map((d) => d.value) as [Denomination, ...Denomination[]];

export function denominationLabel(value: string | null | undefined): string | null {
  return DENOMINATIONS.find((d) => d.value === value)?.label ?? null;
}
