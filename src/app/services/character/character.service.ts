import { Buffer } from 'buffer/';
import { Injectable } from '@angular/core';
import { Character } from 'src/app/entities/Character';
import { CharacterLocation } from 'src/app/entities/CharacterLocation';
import { Order } from 'src/app/entities/Order';
import { Skill } from 'src/app/entities/Skill';
import { AuthenticatorService } from '../authenticator/authenticator.service';
import { resolve } from 'path';

@Injectable({ providedIn: 'root' })
export class CharacterService {

  constructor(
    private authenticatorService: AuthenticatorService
  ) { }

  async getCharacterFromToken(): Promise<Character> {

    const accessToken = this.authenticatorService.getAccessToken();
    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = JSON.parse(Buffer.from(base64, 'base64').toString());

    const character: Character = {
      id: Number(/CHARACTER:EVE:(?<id>\d+)/.exec(jsonPayload.sub).groups.id),
      name: jsonPayload.name,
    };

    return character;

  }

  async getLocationOfCharacter(character: Character): Promise<CharacterLocation> {
    return new Promise((resolve, reject) => {

      // Get basic location data, including solar system ID
      type CharacterLocationResponse = {
        solar_system_id: number;
        station_id?: number;
        structure_id?: number;
      };
      this.authenticatorService.eveRequest<CharacterLocationResponse>(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/location/`
      ).subscribe((characterLocationData) => {

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
        this.authenticatorService.eveRequest<SystemDataResponse>(
          'get',
          `https://esi.evetech.net/latest/universe/systems/${characterLocationData.solar_system_id}`
        ).subscribe((solarSystemData) => {

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
          this.authenticatorService.eveRequest<ConstellationDataResponse>(
            'get',
            `https://esi.evetech.net/latest/universe/constellations/${solarSystemData.constellation_id}`
          ).subscribe((constellationData) => {

            // Get region name
            type RegionDataResponse = {
              constellations: number[];
              description: string;
              name: string;
              region_id: number;

            };
            this.authenticatorService.eveRequest<RegionDataResponse>(
              'get',
              `https://esi.evetech.net/latest/universe/regions/${constellationData.region_id}`
            ).subscribe((regionData) => {

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
                this.authenticatorService.eveRequest<StructureDataResponse>(
                  'get',
                  `https://esi.evetech.net/latest/universe/structures/${characterLocationData.structure_id}`
                ).subscribe((structureData) => {
                  return resolve({
                    solarSystemId: characterLocationData.solar_system_id,
                    solarSystemName: solarSystemData.name,
                    constellationId: solarSystemData.constellation_id,
                    constellationName: constellationData.name,
                    regionId: constellationData.region_id,
                    regionName: regionData.name,
                    stationId: characterLocationData.station_id,
                    structureId: characterLocationData.structure_id,
                    structureName: structureData ? structureData.name : undefined
                  });
                });
              }

              // Get station name if applicable
              let stationData;
              if (characterLocationData.station_id) {
                type StationDataResponse = {
                  max_dockable_ship_volume: number;
                  name: string;
                  office_rental_cost: number;
                  owner: number;
                  position: {
                    x: number,
                    y: number,
                    z: number
                  };
                  race_id: number;
                  reprocessing_efficiency: number;
                  reprocessing_stations_take: number;
                  services: string[];
                  station_id: number;
                  system_id: number;
                  type_id: number;
                };
                this.authenticatorService.eveRequest<StationDataResponse>(
                  'get',
                  `https://esi.evetech.net/latest/universe/stations/${characterLocationData.station_id}`
                ).subscribe((stationData) => {
                  return resolve({
                    solarSystemId: characterLocationData.solar_system_id,
                    solarSystemName: solarSystemData.name,
                    constellationId: solarSystemData.constellation_id,
                    constellationName: constellationData.name,
                    regionId: constellationData.region_id,
                    regionName: regionData.name,
                    stationId: characterLocationData.station_id,
                    stationName: stationData ? stationData.name : undefined,
                    structureId: characterLocationData.structure_id,
                  });
                })
              }



            });
          });
        });
      });
    });

  }

  async getOrdersOfCharacter(character: Character): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      type CharacterOrdersResponse = {
        duration: number;
        escrow: number;
        is_buy_order: boolean;
        is_corporation: boolean;
        issued: string;
        location_id: number;
        min_volume: number;
        order_id: number;
        price: number;
        range: string;
        region_id: number;
        type_id: number;
        volume_remain: number;
        volume_total: number;
      }[];
      this.authenticatorService.eveRequest<CharacterOrdersResponse>(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/orders/`
      ).subscribe((orderData) => {
        const orders = orderData.map((order) => ({
          isBuyOrder: order.is_buy_order,
          locationId: order.location_id,
          typeId: order.type_id
        }));
        return resolve(orders);
      });
    });
  }

  async getPortraitOfCharacter(character: Character): Promise<string> {
    return new Promise((resolve, reject) => {
      type CharacterPortraitResponse = {
        px128x128: string;
        px256x256: string;
        px512x512: string;
        px64x64: string;
      };
      this.authenticatorService.eveRequest<CharacterPortraitResponse>(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/portrait/`
      ).subscribe({
        next: (portraitData) => {
          const portrait = portraitData.px128x128;
          return resolve(portrait);
        },
        error: (err) => reject(err),
      });
    });
  }

  async getSkillsOfCharacter(character: Character): Promise<Skill[]> {
    return new Promise((resolve, reject) => {
      type CharacterSkillResponse = {
        skills: {
          active_skill_level: number;
          skill_id: number;
          skillpoints_in_skill: number;
          trained_skill_level: number;
        }[];
        total_sp: number;
        unallocated_sp: number;
      };
      this.authenticatorService.eveRequest<CharacterSkillResponse>(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/skills/`
      ).subscribe((skillData) => {
        const skills = skillData.skills.map((skill) => ({
          skillId: skill.skill_id,
          activeSkillLevel: skill.active_skill_level,
        }));
        return resolve(skills);
      });
    });
  }

  async getWalletBalanceOfCharacter(character: Character): Promise<number> {
    return new Promise((resolve, reject) => {
      this.authenticatorService.eveRequest<number>(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/wallet/`
      ).subscribe((walletBalance) => {
        return resolve(walletBalance);
      });
    });
  }

}
