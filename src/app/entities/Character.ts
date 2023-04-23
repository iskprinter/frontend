export interface CharacterLocation {
  solar_system_id: number;
  station_id?: number;
  structure_id?: number;
  systemId: number;
  regionId: number;
}

export interface CharacterSkills {
  skills: {
    active_skill_level: number,
    skill_id: number,
    skillpoints_in_skill: number,
    trained_skill_level: number
  }[];
}

export interface Character {
  id: number;
  name: string;
  location?: CharacterLocation;
  skills?: CharacterSkills;
}
