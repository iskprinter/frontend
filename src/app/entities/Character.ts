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

export interface Character {

  id: number;
  name: string;
  // location: CharacterLocation;
  // orders: Order[];
  // portrait: string;
  // skills: {
  //   skillId: number,
  //   activeSkillLevel: number,
  // }[];
  // walletBalance: number;

};
