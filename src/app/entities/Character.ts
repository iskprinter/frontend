import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Order } from './Order';

export interface CharacterLocation {
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
