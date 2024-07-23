export type BeamWarehouseErrorsType = {
  noSuchRecord: (params: { woodNaming: string }) => string;
  notEnoughVolume: (params: {
    warehouseVolume: string | number;
    newRecordVolume: string | number;
    woodNaming: string;
  }) => string;
};

export type WoodWarehouseErrorsType = {
  noSuchRecord: (params: {
    woodCondition: string;
    woodType: string;
    woodClass: string;
    dimension: string;
  }) => string;
  notEnoughAmount: (params: {
    warehouseAmount: string | number;
    newRecordAmount: string | number;
    woodCondition: string;
    woodType: string;
    woodClass: string;
    dimension: string;
  }) => string;
};
