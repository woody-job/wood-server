import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { BeamInService } from 'src/beam-in/beam-in.service';
import { BeamSizeService } from 'src/beam-size/beam-size.service';
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
    await this.woodClassService.createWoodClass({ name: 'Рыночный' });
    await this.woodClassService.createWoodClass({ name: 'Браун' });

    // Создание размеров леса
    await this.beamSizeService.createManyBeamSizes([
      {
        diameter: 8,
        volume: 0.045,
      },
      {
        diameter: 13,
        volume: 0.108,
      },
      {
        diameter: 9,
        volume: 0.055,
      },
      {
        diameter: 10,
        volume: 0.065,
      },
      {
        diameter: 11,
        volume: 0.08,
      },
      {
        diameter: 12,
        volume: 0.093,
      },
      {
        diameter: 14,
        volume: 0.123,
      },
      {
        diameter: 15,
        volume: 0.136,
      },
      {
        diameter: 16,
        volume: 0.155,
      },
      {
        diameter: 17,
        volume: 0.173,
      },
      {
        diameter: 18,
        volume: 0.194,
      },
      {
        diameter: 19,
        volume: 0.208,
      },
      {
        diameter: 20,
        volume: 0.23,
      },
      {
        diameter: 21,
        volume: 0.255,
      },
      {
        diameter: 22,
        volume: 0.28,
      },
      {
        diameter: 23,
        volume: 0.303,
      },
      {
        diameter: 24,
        volume: 0.33,
      },
      {
        diameter: 25,
        volume: 0.361,
      },
      {
        diameter: 26,
        volume: 0.39,
      },
      {
        diameter: 27,
        volume: 0.418,
      },
      {
        diameter: 28,
        volume: 0.45,
      },
      {
        diameter: 29,
        volume: 0.486,
      },
      {
        diameter: 30,
        volume: 0.52,
      },
      {
        diameter: 31,
        volume: 0.554,
      },
      {
        diameter: 32,
        volume: 0.59,
      },
      {
        diameter: 33,
        volume: 0.622,
      },
      {
        diameter: 34,
        volume: 0.66,
      },
      {
        diameter: 35,
        volume: 0.699,
      },
      {
        diameter: 36,
        volume: 0.74,
      },
      {
        diameter: 37,
        volume: 0.777,
      },
      {
        diameter: 38,
        volume: 0.82,
      },
      {
        diameter: 39,
        volume: 0.856,
      },
      {
        diameter: 40,
        volume: 0.9,
      },
      {
        diameter: 41,
        volume: 0.953,
      },
      {
        diameter: 42,
        volume: 1,
      },
      {
        diameter: 43,
        volume: 1.041,
      },
      {
        diameter: 44,
        volume: 1.09,
      },
      {
        diameter: 45,
        volume: 1.139,
      },
      {
        diameter: 46,
        volume: 1.19,
      },
      {
        diameter: 47,
        volume: 1.246,
      },
      {
        diameter: 48,
        volume: 1.3,
      },
      {
        diameter: 49,
        volume: 1.354,
      },
      {
        diameter: 50,
        volume: 1.41,
      },
    ]);
  }

  async deleteUserCreatedData() {
    // Удаление всех входов в цеха
    await this.beamInService.deleteAllBeamIn();

    // Удаление всех выходов из цехов
    await this.workshopOutService.deleteAllWorkshopOut();

    // Удаление всех ежедневных данных о работе цехов
    await this.workshopDailyDataService.deleteAllWorkshopDailyData();

    // Удаление всех поступлений
    await this.woodArrivalService.deleteAllWoodArrival();

    // Удаление всех отгрузок
    await this.woodShipmentService.deleteAllWoodShipment();

    // Удаление всех записей на складе
    await this.warehouseService.deleteAllWarehouseRecords();

    // Удаление всех записей о работе сушилок
    await this.dryerChamberDataService.deleteAllDryerChamberData();

    // Удаление всех сушилок
    await this.dryerChamberService.deleteAllDryerChamber();
  }
}
