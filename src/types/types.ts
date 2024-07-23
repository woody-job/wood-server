export type WarehouseErrorsType = {
  noSuchRecord: () => string;
  notEnoughVolume: (
    warehouseVolume: string | number,
    newRecordVolume: string | number,
  ) => string;
};
