export type KPIs = {
  targetValue: number;
  inprocessValue: number;
  confirmValue: number;
  validatedValue: number;
  totalValue: number;
  totalVsTargetValue: number;
  totalVsTargetValuePerc: number;
  mixTargetValue: number;
  mixActualValue: number;
  targetQuantity: number;
  inprocessQuantity: number;
  confirmQuantity: number;
  validatedQuantity: number;
  totalQuantity?: number;
  totalVsTargetQuantity: number;
  totalVsTargetQuantityPerc: number;
  mixTargetQuantity: number;
  mixActualQuantity: number;
  nbAcsBuy: number;
  acs: number;
};

export type Category = {
  id: string;
  name: string;
  totalProducts: number;
  kpis: KPIs;
  children?: Category[];
};