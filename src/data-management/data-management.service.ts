import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { BeamArrivalService } from 'src/beam-arrival/beam-arrival.service';
import { BeamInService } from 'src/beam-in/beam-in.service';
import { BeamShipmentService } from 'src/beam-shipment/beam-shipment.service';
import { BeamSizeService } from 'src/beam-size/beam-size.service';
import { BeamWarehouseService } from 'src/beam-warehouse/beam-warehouse.service';
import { DryerChamberDataService } from 'src/dryer-chamber-data/dryer-chamber-data.service';
import { DryerChamberService } from 'src/dryer-chamber/dryer-chamber.service';
import { RolesService } from 'src/roles/roles.service';
import { WarehouseService } from 'src/warehouse/warehouse.service';
import { WoodArrivalService } from 'src/wood-arrival/wood-arrival.service';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { WoodConditionService } from 'src/wood-condition/wood-condition.service';
import { WoodShipmentService } from 'src/wood-shipment/wood-shipment.service';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { WorkshopDailyDataService } from 'src/workshop-daily-data/workshop-daily-data.service';
import { WorkshopOutService } from 'src/workshop-out/workshop-out.service';
import { WorkshopService } from 'src/workshop/workshop.service';

@Injectable()
export class DataManagementService {
  constructor(
    private rolesService: RolesService,
    private woodConditionService: WoodConditionService,
    private woodTypeService: WoodTypeService,
    private woodClassService: WoodClassService,
    private beamSizeService: BeamSizeService,
    private workshopService: WorkshopService,
    private authService: AuthService,
    private beamInService: BeamInService,
    private workshopOutService: WorkshopOutService,
    private woodArrivalService: WoodArrivalService,
    private woodShipmentService: WoodShipmentService,
    private warehouseService: WarehouseService,
    private dryerChamberService: DryerChamberService,
    private dryerChamberDataService: DryerChamberDataService,
    private workshopDailyDataService: WorkshopDailyDataService,

    private beamArrivalService: BeamArrivalService,
    private beamShipmentService: BeamShipmentService,
    private beamWarehouseService: BeamWarehouseService,
  ) {}

  async createBaseEntities() {
    const roles = await this.rolesService.getAllRoles();

    if (roles.length !== 0) {
      throw new HttpException('Данные в базе уже есть', HttpStatus.BAD_REQUEST);
    }

    // Создание ролей
    await this.rolesService.createRole({
      name: 'SUPERADMIN',
      description: 'Суперадмин. Может все',
    });
    await this.rolesService.createRole({
      name: 'ADMIN',
      description: 'Админ. Может просматривать и редактировать данные',
    });
    await this.rolesService.createRole({
      name: 'USER',
      description: 'Пользователь. Может просматривать данные',
    });

    // Создание суперадмина
    await this.authService.register({
      fullName: 'Суперадминов Суперадмин Суперадминович',
      password: 'password123',
      login: 'superadmin',
      roleId: 1,
    });

    // Создание цехов
    await this.workshopService.createWorkshop({
      name: 'Цех 1',
      priceOfRawMaterials: 1111,
      sawingPrice: 1111,
    });
    await this.workshopService.createWorkshop({
      name: 'Цех 2',
      priceOfRawMaterials: 2222,
      sawingPrice: 2222,
    });
    await this.workshopService.createWorkshop({
      name: 'Цех 3',
      priceOfRawMaterials: 3333,
      sawingPrice: 3333,
    });

    // Создание состояний доски
    await this.woodConditionService.createWoodCondition({ name: 'Сухая' });
    await this.woodConditionService.createWoodCondition({ name: 'Сырая' });

    // Создание пород леса
    await this.woodTypeService.createWoodType({ name: 'Ель' });
    await this.woodTypeService.createWoodType({ name: 'Сосна' });
    await this.woodTypeService.createWoodType({ name: 'Хвоя' });

    // Создание сортов доски
    await this.woodClassService.createWoodClass({ name: 'Первый' });
    await this.woodClassService.createWoodClass({ name: 'Второй' });
    await this.woodClassService.createWoodClass({ name: 'Третий' });
    await this.woodClassService.createWoodClass({ name: 'Рыночный' });

    // Создание размеров леса
    await this.updateBeamSizes();
  }

  async updateBeamSizes() {
    await this.beamSizeService.deleteAllBeamSizes();

    // 6 метров
    await this.beamSizeService.createManyBeamSizes([
      {
        diameter: 10,
        volume: 0.065,
        length: 6,
      },
      {
        diameter: 11,
        volume: 0.08,
        length: 6,
      },
      {
        diameter: 12,
        volume: 0.093,
        length: 6,
      },
      {
        diameter: 13,
        volume: 0.108,
        length: 6,
      },
      {
        diameter: 14,
        volume: 0.123,
        length: 6,
      },
      {
        diameter: 15,
        volume: 0.139,
        length: 6,
      },
      {
        diameter: 16,
        volume: 0.155,
        length: 6,
      },
      {
        diameter: 17,
        volume: 0.174,
        length: 6,
      },
      {
        diameter: 18,
        volume: 0.194,
        length: 6,
      },
      {
        diameter: 19,
        volume: 0.212,
        length: 6,
      },
      {
        diameter: 20,
        volume: 0.23,
        length: 6,
      },
      {
        diameter: 21,
        volume: 0.255,
        length: 6,
      },
      {
        diameter: 22,
        volume: 0.28,
        length: 6,
      },
      {
        diameter: 23,
        volume: 0.305,
        length: 6,
      },
      {
        diameter: 24,
        volume: 0.33,
        length: 6,
      },
      {
        diameter: 25,
        volume: 0.36,
        length: 6,
      },
      {
        diameter: 26,
        volume: 0.39,
        length: 6,
      },
      {
        diameter: 27,
        volume: 0.42,
        length: 6,
      },
      {
        diameter: 28,
        volume: 0.45,
        length: 6,
      },
      {
        diameter: 29,
        volume: 0.485,
        length: 6,
      },
      {
        diameter: 30,
        volume: 0.52,
        length: 6,
      },
      {
        diameter: 31,
        volume: 0.555,
        length: 6,
      },
      {
        diameter: 32,
        volume: 0.59,
        length: 6,
      },
      {
        diameter: 33,
        volume: 0.625,
        length: 6,
      },
      {
        diameter: 34,
        volume: 0.66,
        length: 6,
      },
      {
        diameter: 35,
        volume: 0.7,
        length: 6,
      },
      {
        diameter: 36,
        volume: 0.74,
        length: 6,
      },
      {
        diameter: 37,
        volume: 0.78,
        length: 6,
      },
      {
        diameter: 38,
        volume: 0.82,
        length: 6,
      },
      {
        diameter: 39,
        volume: 0.86,
        length: 6,
      },
      {
        diameter: 40,
        volume: 0.9,
        length: 6,
      },
      {
        diameter: 41,
        volume: 0.95,
        length: 6,
      },
      {
        diameter: 42,
        volume: 1,
        length: 6,
      },
      {
        diameter: 43,
        volume: 1.045,
        length: 6,
      },
      {
        diameter: 44,
        volume: 1.09,
        length: 6,
      },
      {
        diameter: 45,
        volume: 1.14,
        length: 6,
      },
      {
        diameter: 46,
        volume: 1.19,
        length: 6,
      },
      {
        diameter: 47,
        volume: 1.245,
        length: 6,
      },
      {
        diameter: 48,
        volume: 1.3,
        length: 6,
      },
      {
        diameter: 49,
        volume: 1.355,
        length: 6,
      },
      {
        diameter: 50,
        volume: 1.41,
        length: 6,
      },
      {
        diameter: 51,
        volume: 1.47,
        length: 6,
      },
      {
        diameter: 52,
        volume: 1.53,
        length: 6,
      },
      {
        diameter: 53,
        volume: 1.59,
        length: 6,
      },
      {
        diameter: 54,
        volume: 1.65,
        length: 6,
      },
      {
        diameter: 55,
        volume: 1.715,
        length: 6,
      },
      {
        diameter: 56,
        volume: 1.78,
        length: 6,
      },
      {
        diameter: 57,
        volume: 1.875,
        length: 6,
      },
      {
        diameter: 58,
        volume: 1.91,
        length: 6,
      },
      {
        diameter: 59,
        volume: 1.98,
        length: 6,
      },
      {
        diameter: 60,
        volume: 2.05,
        length: 6,
      },
      {
        diameter: 61,
        volume: 2.115,
        length: 6,
      },
      {
        diameter: 62,
        volume: 2.18,
        length: 6,
      },
      {
        diameter: 63,
        volume: 2.25,
        length: 6,
      },
      {
        diameter: 64,
        volume: 2.32,
        length: 6,
      },
      {
        diameter: 65,
        volume: 2.38,
        length: 6,
      },
      {
        diameter: 66,
        volume: 2.44,
        length: 6,
      },
      {
        diameter: 67,
        volume: 2.505,
        length: 6,
      },
      {
        diameter: 68,
        volume: 2.57,
        length: 6,
      },
      {
        diameter: 69,
        volume: 2.645,
        length: 6,
      },
    ]);

    // 4 метра
    await this.beamSizeService.createManyBeamSizes([
      {
        diameter: 10,
        volume: 0.037,
        length: 4,
      },
      {
        diameter: 11,
        volume: 0.045,
        length: 4,
      },
      {
        diameter: 12,
        volume: 0.053,
        length: 4,
      },
      {
        diameter: 13,
        volume: 0.062,
        length: 4,
      },
      {
        diameter: 14,
        volume: 0.073,
        length: 4,
      },
      {
        diameter: 15,
        volume: 0.084,
        length: 4,
      },
      {
        diameter: 16,
        volume: 0.095,
        length: 4,
      },
      {
        diameter: 17,
        volume: 0.107,
        length: 4,
      },
      {
        diameter: 18,
        volume: 0.12,
        length: 4,
      },
      {
        diameter: 19,
        volume: 0.134,
        length: 4,
      },
      {
        diameter: 20,
        volume: 0.147,
        length: 4,
      },
      {
        diameter: 21,
        volume: 0.163,
        length: 4,
      },
      {
        diameter: 22,
        volume: 0.178,
        length: 4,
      },
      {
        diameter: 23,
        volume: 0.194,
        length: 4,
      },
      {
        diameter: 24,
        volume: 0.21,
        length: 4,
      },
      {
        diameter: 25,
        volume: 0.23,
        length: 4,
      },
      {
        diameter: 26,
        volume: 0.25,
        length: 4,
      },
      {
        diameter: 27,
        volume: 0.27,
        length: 4,
      },
      {
        diameter: 28,
        volume: 0.29,
        length: 4,
      },
      {
        diameter: 29,
        volume: 0.31,
        length: 4,
      },
      {
        diameter: 30,
        volume: 0.33,
        length: 4,
      },
      {
        diameter: 31,
        volume: 0.355,
        length: 4,
      },
      {
        diameter: 32,
        volume: 0.38,
        length: 4,
      },
      {
        diameter: 33,
        volume: 0.405,
        length: 4,
      },
      {
        diameter: 34,
        volume: 0.43,
        length: 4,
      },
      {
        diameter: 35,
        volume: 0.455,
        length: 4,
      },
      {
        diameter: 36,
        volume: 0.48,
        length: 4,
      },
      {
        diameter: 37,
        volume: 0.505,
        length: 4,
      },
      {
        diameter: 38,
        volume: 0.53,
        length: 4,
      },
      {
        diameter: 39,
        volume: 0.555,
        length: 4,
      },
      {
        diameter: 40,
        volume: 0.58,
        length: 4,
      },
      {
        diameter: 41,
        volume: 0.61,
        length: 4,
      },
      {
        diameter: 42,
        volume: 0.64,
        length: 4,
      },
      {
        diameter: 43,
        volume: 0.67,
        length: 4,
      },
      {
        diameter: 44,
        volume: 0.7,
        length: 4,
      },
      {
        diameter: 45,
        volume: 0.735,
        length: 4,
      },
      {
        diameter: 46,
        volume: 0.77,
        length: 4,
      },
      {
        diameter: 47,
        volume: 0.805,
        length: 4,
      },
      {
        diameter: 48,
        volume: 0.84,
        length: 4,
      },
      {
        diameter: 49,
        volume: 0.875,
        length: 4,
      },
      {
        diameter: 50,
        volume: 0.91,
        length: 4,
      },
      {
        diameter: 51,
        volume: 0.95,
        length: 4,
      },
      {
        diameter: 52,
        volume: 0.99,
        length: 4,
      },
      {
        diameter: 53,
        volume: 1.03,
        length: 4,
      },
      {
        diameter: 54,
        volume: 1.07,
        length: 4,
      },
      {
        diameter: 55,
        volume: 1.115,
        length: 4,
      },
      {
        diameter: 56,
        volume: 1.16,
        length: 4,
      },
      {
        diameter: 57,
        volume: 1.205,
        length: 4,
      },
      {
        diameter: 58,
        volume: 1.25,
        length: 4,
      },
      {
        diameter: 59,
        volume: 1.29,
        length: 4,
      },
      {
        diameter: 60,
        volume: 1.33,
        length: 4,
      },
      {
        diameter: 61,
        volume: 1.38,
        length: 4,
      },
      {
        diameter: 62,
        volume: 1.43,
        length: 4,
      },
      {
        diameter: 63,
        volume: 1.475,
        length: 4,
      },
      {
        diameter: 64,
        volume: 1.52,
        length: 4,
      },
      {
        diameter: 65,
        volume: 1.565,
        length: 4,
      },
      {
        diameter: 66,
        volume: 1.61,
        length: 4,
      },
      {
        diameter: 67,
        volume: 1.655,
        length: 4,
      },
      {
        diameter: 68,
        volume: 1.7,
        length: 4,
      },
      {
        diameter: 69,
        volume: 1.75,
        length: 4,
      },
    ]);
  }

  async addPlanedWoodCondition() {
    await this.woodConditionService.createWoodCondition({
      name: 'Строганая',
    });
  }

  async updateBrownWoodClass() {
    const oldWoodClass = (await this.woodClassService.getAllWoodClasses()).find(
      (woodClass) => woodClass.name === 'Браун',
    );

    if (oldWoodClass) {
      await this.woodClassService.updateWoodClass({
        id: oldWoodClass.id,
        name: 'Третий',
      });
    }
  }

  async deleteUserCreatedData() {
    // Удаление всех входов в цеха
    await this.beamInService.deleteAllBeamIn();

    // Удаление всех выходов из цехов
    await this.workshopOutService.deleteAllWorkshopOut();

    // Удаление всех ежедневных данных о работе цехов
    await this.workshopDailyDataService.deleteAllWorkshopDailyData();

    // Удаление всех поступлений доски
    await this.woodArrivalService.deleteAllWoodArrival();

    // Удаление всех поступлений сырья
    await this.beamArrivalService.deleteAllBeamArrival();

    // Удаление всех отгрузок доски
    await this.woodShipmentService.deleteAllWoodShipment();

    // Удаление всех отгрузок сырья
    await this.beamShipmentService.deleteAllBeamShipment();

    // Удаление всех записей на складе доски
    await this.warehouseService.deleteAllWarehouseRecords();

    // Удаление всех записей на складе сырья
    await this.beamWarehouseService.deleteAllWarehouseRecords();

    // Удаление всех записей о работе сушилок
    await this.dryerChamberDataService.deleteAllDryerChamberData();

    // Удаление всех сушилок
    await this.dryerChamberService.deleteAllDryerChamber();
  }
}
