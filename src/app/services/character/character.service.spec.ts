import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Character, CharacterLocation } from 'src/app/entities/Character';
import { Order } from 'src/app/entities/Order';
import { Skill } from 'src/app/entities/Skill';
import { AuthenticatorService } from '../authenticator/authenticator.service';

import { CharacterService } from './character.service';

describe('CharacterService', () => {

  let service: CharacterService;
  let mockAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;
  let character: Character;
  let characterLocationData;

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthenticatorService,
          useValue: jasmine.createSpyObj('AuthenticatorService', ['eveRequest'])
        }
      ]
    });

    mockAuthenticatorService = TestBed.inject(AuthenticatorService) as jasmine.SpyObj<AuthenticatorService>;
    service = TestBed.inject(CharacterService);

    // Create a default character (some tests will reinstantiate this)
    character = new Character(mockAuthenticatorService);
    character.id = 95448633;
    character.name = 'Kronn 8';

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCharacterFromToken', () => {

    const arrangeHappyLocationResponses = () => {
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/location/`
      )
        .and.resolveTo(new HttpResponse<CharacterLocation>({ status: 200, body: characterLocationData }));

      const solarSystemData = {
        "constellation_id": 20000696,
        "name": "1DQ1-A",
        "planets": [
          {
            "asteroid_belts": [
              40301370,
              40301371
            ],
            "planet_id": 40301369
          },
          {
            "moons": [
              40301373
            ],
            "planet_id": 40301372
          }
        ],
        "position": {
          "x": -447952852626296900,
          "y": 41564891575706370,
          "z": -242241754479548450
        },
        "security_class": "G2",
        "security_status": -0.3857823312282562,
        "star_id": 40301368,
        "stargates": [
          50010993,
          50010994
        ],
        "system_id": 30004759
      };
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/universe/systems/${characterLocationData.solar_system_id}`
      )
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: solarSystemData }));

      const constellationData = {
        "constellation_id": 20000696,
        "name": "O-EIMK",
        "position": {
          "x": -452185250857639400,
          "y": 38472040193308660,
          "z": -252225986192191550
        },
        "region_id": 10000060,
        "systems": [
          30004759,
          30004760
        ]
      };
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/universe/constellations/${solarSystemData.constellation_id}`
      )
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: constellationData }));

      const regionData = {
        "constellations": [
          20000688,
          20000689,
          20000690,
        ],
        "description": "Bloody Omir ran away\r\nHiding from the light of day\r\nMade a base out in the night\r\nFar far from the Empire's might\r\nHolders think they all are safe\r\nProtected by the Emp'ror's grace\r\nSilly people, they should know\r\nYou shall reap just what you sow\r\nBloody Omir's coming back\r\nMonsters from the endless black\r\nWading through a crimson flood\r\nOmir's come to drink your blood<br><br><i>- Nursery Ryhme</i>",
        "name": "Delve",
        "region_id": 10000060
      };
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/universe/regions/${constellationData.region_id}`
      )
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: regionData }));

    };

    beforeEach(() => {

      // Set default character location
      characterLocationData = {
        solar_system_id: 30004759
      };

    });

    it('should properly fetch basic character data from token', async () => {

      // Arrange
      const tokenData = {
        "CharacterID": 95465499,
        "CharacterName": "CCP Bartender",
        "ExpiresOn": "2017-07-05T14:34:16.5857101",
        "Scopes": "esi-characters.read_standings.v1",
        "TokenType": "Character",
        "CharacterOwnerHash": "lots_of_letters_and_numbers",
        "IntellectualProperty": "EVE"
      };
      mockAuthenticatorService.eveRequest
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: tokenData }));

      // Act
      character = await service.getCharacterFromToken();

      // Assert
      expect(character.id).toBe(95465499);
      expect(character.name).toBe('CCP Bartender');

    });

    it('should properly fetch the location of a character in a station', async () => {

      // Arrange
      arrangeHappyLocationResponses();
      characterLocationData.station_id = 60003760;
      const stationData = {
        "max_dockable_ship_volume": 50000000,
        "name": "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
        "office_rental_cost": 2637554868,
        "owner": 1000035,
        "position": {
          "x": -107303362560,
          "y": -18744975360,
          "z": 436489052160
        },
        "race_id": 1,
        "reprocessing_efficiency": 0.5,
        "reprocessing_stations_take": 0.05,
        "services": [
          "reprocessing-plant",
          "market",
        ],
        "station_id": 60003760,
        "system_id": 30000142,
        "type_id": 52678
      };
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/universe/stations/${characterLocationData.station_id}`
      )
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: stationData }));

      // Act
      const characterLocation: CharacterLocation = await service.getLocationOfCharacter(character);

      // Assert
      expect(characterLocation.solarSystemId).toBe(30004759);
      expect(characterLocation.solarSystemName).toBe('1DQ1-A');
      expect(characterLocation.constellationName).toBe('O-EIMK');
      expect(characterLocation.regionName).toBe('Delve');
      expect(characterLocation.stationId).toBe(60003760);
      expect(characterLocation.stationName).toBe('Jita IV - Moon 4 - Caldari Navy Assembly Plant');
      expect(characterLocation.structureId).toBe(undefined);
      expect(characterLocation.structureName).toBe(undefined);

    });

    it('should properly fetch the location of a character in a structure', async () => {

      // Arrange
      characterLocationData.structure_id = 1030049082711;
      arrangeHappyLocationResponses();
      const structureData = {
        "name": "1DQ1-A - 1-st Imperial Palace",
        "owner_id": 1344654522,
        "position": {
          "x": 5096713631031,
          "y": -2641212396896,
          "z": 4144292994520
        },
        "solar_system_id": 30004759,
        "type_id": 35834
      };
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/universe/structures/${characterLocationData.structure_id}`
      )
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: structureData }));

      // Act
      const characterLocation: CharacterLocation = await service.getLocationOfCharacter(character);

      // Assert
      expect(characterLocation.solarSystemId).toBe(30004759);
      expect(characterLocation.solarSystemName).toBe('1DQ1-A');
      expect(characterLocation.constellationName).toBe('O-EIMK');
      expect(characterLocation.regionName).toBe('Delve');
      expect(characterLocation.stationId).toBe(undefined);
      expect(characterLocation.stationName).toBe(undefined);
      expect(characterLocation.structureId).toBe(1030049082711);
      expect(characterLocation.structureName).toBe('1DQ1-A - 1-st Imperial Palace');

    });

    it('should properly fetch the location of a character when undocked', async () => {

      // Arrange
      arrangeHappyLocationResponses();

      // Act
      const characterLocation: CharacterLocation = await service.getLocationOfCharacter(character);

      // Assert
      expect(characterLocation.solarSystemId).toBe(30004759);
      expect(characterLocation.solarSystemName).toBe('1DQ1-A');
      expect(characterLocation.constellationName).toBe('O-EIMK');
      expect(characterLocation.regionName).toBe('Delve');
      expect(characterLocation.stationId).toBe(undefined);
      expect(characterLocation.stationName).toBe(undefined);
      expect(characterLocation.structureId).toBe(undefined);
      expect(characterLocation.structureName).toBe(undefined);

    });

  });

  describe('getOrdersOfCharacter', () => {

    it('should properly fetch the orders of a character', async () => {

      // Arrange
      const orderData = [
        {
          "duration": 90,
          "escrow": 61941160,
          "is_buy_order": true,
          "is_corporation": false,
          "issued": "2020-10-20T02:24:16Z",
          "c": 1030049082711,
          "min_volume": 1,
          "order_id": 5826829163,
          "price": 86510,
          "range": "station",
          "region_id": 10000060,
          "type_id": 25590,
          "volume_remain": 716,
          "volume_total": 1720
        },
        {
          "duration": 90,
          "escrow": 18009000,
          "is_buy_order": false,
          "is_corporation": false,
          "issued": "2020-10-20T13:34:27Z",
          "location_id": 1030049082711,
          "min_volume": 1,
          "order_id": 5827105254,
          "price": 2001000,
          "range": "station",
          "region_id": 10000060,
          "type_id": 32340,
          "volume_remain": 9,
          "volume_total": 9
        },
      ];
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/orders/`
      )
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: orderData }));

      // Act
      const characterOrders: Order[] = await service.getOrdersOfCharacter(character);

      // Assert
      expect(characterOrders).toEqual([
        {
          isBuyOrder: orderData[0].is_buy_order,
          locationId: orderData[0].location_id,
          typeId: orderData[0].type_id,
        },
        {
          isBuyOrder: orderData[1].is_buy_order,
          locationId: orderData[1].location_id,
          typeId: orderData[1].type_id,
        }
      ]);

    });

  });

  describe('getPortraitOfCharacter', () => {

    it('should properly fetch the portrait of a character', async () => {

      // Arrange
      const portraitData = {
        px128x128: "https://images.evetech.net/characters/95448633/portrait?tenant=tranquility&size=128",
        px256x256: "https://images.evetech.net/characters/95448633/portrait?tenant=tranquility&size=256",
        px512x512: "https://images.evetech.net/characters/95448633/portrait?tenant=tranquility&size=512",
        px64x64: "https://images.evetech.net/characters/95448633/portrait?tenant=tranquility&size=64"
      };
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/portrait/`
      )
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: portraitData }));

      // Act
      const characterPortrait: string = await service.getPortraitOfCharacter(character);

      // Assert
      expect(characterPortrait).toEqual(portraitData.px128x128);

    });

  });

  describe('getSkillsOfCharacter', () => {

    it('should properly fetch the skills of a character', async () => {

      // Arrange
      const skillData = {
        "skills": [
          {
            "active_skill_level": 3,
            "skill_id": 28164,
            "skillpoints_in_skill": 24000,
            "trained_skill_level": 3
          },
          {
            "active_skill_level": 4,
            "skill_id": 3427,
            "skillpoints_in_skill": 90510,
            "trained_skill_level": 4
          }
        ],
        "total_sp": 79304252,
        "unallocated_sp": 0
      };
      mockAuthenticatorService.eveRequest.withArgs(
        'get',
        `https://esi.evetech.net/latest/characters/${character.id}/skills/`
      )
        .and.resolveTo(new HttpResponse<any>({ status: 200, body: skillData }));

      // Act
      const characterSkills: Skill[] = await service.getSkillsOfCharacter(character);

      // Assert
      expect(characterSkills).toEqual([
        {
          skillId: skillData.skills[0].skill_id,
          activeSkillLevel: skillData.skills[0].active_skill_level,
        },
        {
          skillId: skillData.skills[1].skill_id,
          activeSkillLevel: skillData.skills[1].active_skill_level,
        }
      ]);

    });

  });

});
