import { Injectable } from '@angular/core';
import { Character, CharacterLocation } from 'src/app/entities/Character';
import { AuthenticatorService } from '../authenticator/authenticator.service';

@Injectable({ providedIn: 'root' })
export class CharacterService {

  constructor(
    private authenticatorService: AuthenticatorService
  ) { }

  async getCharacter(): Promise<Character> {

    type BasicCharacterDataResponse = {
      CharacterID: number;
      CharacterName: string;
      ExpiresOn: string;
      Scopes: string;
      TokenType: string;
      CharacterOwnerHash: string;
      IntellectualProperty: string;
    };

    const response = await this.authenticatorService.eveRequest<BasicCharacterDataResponse>(
      'get',
      'https://login.eveonline.com/oauth/verify'
    );
    const characterData = response.body;
    const character = new Character(
      this.authenticatorService
    );
    character.id = characterData.CharacterID;
    character.name = characterData.CharacterName;
    return character;

  }

  async getLocationOfCharacter(character: Character): Promise<CharacterLocation> {

    // Get basic location data, including solar system ID
    type CharacterLocationResponse = {
      solar_system_id: number;
      station_id: number;
      structure_id: number;
    };
    const characterLocationResponse = await this.authenticatorService.eveRequest<CharacterLocationResponse>(
      'get',
      `https://esi.evetech.net/latest/characters/${character.id}/location/`
    );
    const characterLocationData = characterLocationResponse.body;

    // Get solar system name and parent constellation ID
    type SystemDataResponse = {
      constellation_id: number;
      name: string;
      planets: {
        asteroid_belts: number[],
        moons: number[],
        planet_id: number,
      }[];
      position: {
        x: number,
        y: number,
        z: number
      };
      security_class: string;
      security_status: number;
      star_id: number;
      stargates: number[];
      stations: number[];
      system_id: number;
    };
    const solarSystemResponse = await this.authenticatorService.eveRequest<SystemDataResponse>(
      'get',
      `https://esi.evetech.net/latest/universe/systems/${characterLocationData.solar_system_id}`
    );
    const solarSystemData = solarSystemResponse.body;

    // Get constellation name and parent region ID
    type ConstellationDataResponse = {
      constellation_id: Number;
      name: string;
      position: {
        x: number,
        y: number,
        z: number
      };
      region_id: number;
      systems: number[];
    }
    const constellationResponse = await this.authenticatorService.eveRequest<ConstellationDataResponse>(
      'get',
      `https://esi.evetech.net/latest/universe/constellations/${solarSystemData.constellation_id}`
    );
    const constellationData = constellationResponse.body;

    // Get region name
    type RegionDataResponse = {
      constellations: number[];
      description: string;
      name: string;
      region_id: number;

    };
    const regionResponse = await this.authenticatorService.eveRequest<RegionDataResponse>(
      'get',
      `https://esi.evetech.net/latest/universe/regions/${constellationData.region_id}`
    );
    const regionData = regionResponse.body;

    // Get structure name if applicable
    let structureData;
    if (characterLocationData.structure_id) {
      type StructureDataResponse = {
        name: string;
        owner_id: number;
        position: {
          x: number,
          y: number,
          z: number
        };
        solar_system_id: number;
        type_id: number;
      };
      const structureInfoResponse = await this.authenticatorService.eveRequest<StructureDataResponse>(
        'get',
        `https://esi.evetech.net/latest/universe/structures/${characterLocationData.structure_id}`
      );
      structureData = structureInfoResponse.body;
    }

    return {
      solarSystemId: characterLocationData.solar_system_id,
      solarSystemName: solarSystemData.name,
      constellationId: solarSystemData.constellation_id,
      constellationName: constellationData.name,
      regionId: constellationData.region_id,
      regionName: regionData.name,
      stationId: characterLocationData.station_id,
      structureId: characterLocationData.structure_id,
      structureName: structureData ? structureData.name : undefined
    };

  }

}
