import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Order } from './Order';

export type CharacterLocation = {
  solarSystemId: number;
  solarSystemName: string;
  constellationId: number;
  constellationName: string;
  regionId: number;
  regionName: string,
  stationId?: number;
  stationName?: string;
  structureId?: number;
  structureName?: string;
}

export class Character {

  id: number;
  name: string;
  location: CharacterLocation;
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
