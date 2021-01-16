import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Order } from './Order';

export class Character {

  id: number;
  name: string;
  location: {
    solarSystemId: number,
    solarSystemName: string,
    constellationId: number,
    constellationName: string,
    regionId: number,
    regionName: string,
    stationId: number | undefined,
    structureId: number | undefined,
    structureName?: string | undefined,
  };
  orders: Order[];
  portrait: string;
  skills: {
    skillId: number,
    activeSkillLevel: number,
  }[];
  walletBalance: number;

  constructor(
    private authenticatorService: AuthenticatorService
  ) { };

  async getLocation(): Promise<Character> {

    // Get basic location data, including solar system ID
    const characterLocationResponse = await this.authenticatorService.eveRequest<any>(
      'get',
      `https://esi.evetech.net/latest/characters/${this.id}/location/`
    );
    const locationData: any = characterLocationResponse.body;

    // Get solar system name and parent constellation ID
    const solarSystemResponse = await this.authenticatorService.eveRequest<any>(
      'get',
      `https://esi.evetech.net/latest/universe/systems/${locationData.solar_system_id}`
    );
    const solarSystemData: any = solarSystemResponse.body;

    // Get constellation name and parent region ID
    const constellationResponse = await this.authenticatorService.eveRequest<any>(
      'get',
      `https://esi.evetech.net/latest/universe/constellations/${solarSystemData.constellation_id}`
    );
    const constellationData: any = constellationResponse.body;

    // Get region name
    const regionResponse = await this.authenticatorService.eveRequest<any>(
      'get',
      `https://esi.evetech.net/latest/universe/regions/${constellationData.region_id}`
    );
    const regionData: any = regionResponse.body;

    this.location = {
      solarSystemId: locationData.solar_system_id,
      solarSystemName: solarSystemData.name,
      constellationId: solarSystemData.constellation_id,
      constellationName: constellationData.name,
      regionId: constellationData.region_id,
      regionName: regionData.name,
      stationId: locationData.station_id,
      structureId: locationData.structure_id,
      structureName: locationData.structure_name,
    };

    if (!this.location.structureId) {
      return this;
    }

    const structureInfoResponse = await this.authenticatorService.eveRequest<any>(
      'get',
      `https://esi.evetech.net/latest/universe/structures/${this.location.structureId}`
    );
    this.location.structureName = structureInfoResponse.body.name;

    return this;
  }

  async getOrders(): Promise<Character> {
    const response = await this.authenticatorService.eveRequest<any>(
      'get',
      `https://esi.evetech.net/latest/characters/${this.id}/orders/`
    );
    const orders: any[] = response.body;
    this.orders = orders.map((order) => ({
      isBuyOrder: order.is_buy_order,
      locationId: order.location_id,
      typeId: order.type_id
    }));
    return this;
  }

  async getPortrait(): Promise<Character> {
    const response = await this.authenticatorService.eveRequest<any>(
      'get',
      `https://esi.evetech.net/latest/characters/${this.id}/portrait/`
    );
    this.portrait = response.body.px128x128;
    return this;
  }

  async getSkills(): Promise<Character> {
    const response = await this.authenticatorService.eveRequest<any>(
      'get',
      `https://esi.evetech.net/latest/characters/${this.id}/skills/`
    );
    const skillData: any[] = response.body.skills;
    this.skills = skillData.map((skill) => ({
      skillId: skill.skill_id,
      activeSkillLevel: skill.active_skill_level,
    }));
    return this;
  }

  async getWalletBalance(): Promise<Character> {
    const response = await this.authenticatorService.eveRequest<number>(
      'get',
      `https://esi.evetech.net/latest/characters/${this.id}/wallet/`
    );
    const walletBalance: number = response.body;
    this.walletBalance = walletBalance;
    return this;
  }

}
