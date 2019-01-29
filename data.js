var actions = [
	{ name: "True Thrust",
	  shortName: "TT",
	  description: "Delivers an attack with a potency of 160.",
	  potency: 150,
	  type: "Weaponskill",
	  group: "combo1"},
	{ name: "Vorpal Thrust",
	  shortName: "VT",
	  description: "Delivers an attack with a potency of 100.<br/>Combo Action: True Thrust<br/>Combo Potency: 250",
	  potency: 260,
	  type: "Weaponskill",
	  group: "combo1"},
	{ name: "Full Thrust",
	  shortName: "FT",
	  description: "Delivers an attack with a potency of 100.<br/>Combo Action: Vorpal Thrust<br/>Combo Potency: 450<br/>Blood of the Dragon Combo Bonus: Grants Sharper Fang and Claw<br/>Duration: 10s",
	  potency: 450,
	  effects: ["Sharper Fang and Claw"],
	  type: "Weaponskill",
	  group: "combo1"},
	{ name: "Fang and Claw",
	  shortName: "FC",
	  description: "Delivers an attack with a potency of 260.<br/>300 when executed from a target's flank.<br/>Can only be executed while under the effect of both Blood of the Dragon and Sharper Fang and Claw.<br/>Additional Effect: Extends Blood of the Dragon duration by 10s to a maximum of 30s",
	  potency: 300,
	  effects: ["Enhanced Wheeling Thrust"],
	  type: "Weaponskill",
	  group: "combo1"},

	{ name: "Impulse Drive",
	  shortName: "ID",
	  description: "Delivers an attack with a potency of 200.",
	  potency: 200,
	  type: "Weaponskill",
	  group: "combo2"},
	{ name: "Disembowel",
	  shortName: "DE",
	  description: "Delivers an attack with a potency of 100.<br/>Combo Action: Impulse Drive<br/>Combo Potency: 240<br/>Combo Bonus: Reduces target's piercing resistance by 5%<br/>Duration: 30s",
	  potency: 240,
	  effects: ["Piercing Resistance Down"],
	  type: "Weaponskill",
	  group: "combo2"},
	{ name: "Chaos Thrust",
	  shortName: "CT",
	  description: "Delivers an attack with a potency of 100.<br/>140 when executed from a target's rear.<br/>Combo Action: Disembowel<br/>Combo Potency: 240<br/>Rear Combo Potency: 280<br/>Combo Bonus: Damage over time<br/>Potency: 35<br/>Duration: 30s<br/>Blood of the Dragon Combo Bonus: Grants Enhanced Wheeling Thrust<br/>Duration: 10s",
	  potency: 280,
	  effects: ["Chaos Thrust", "Enhanced Wheeling Thrust"],
	  type: "Weaponskill",
	  group: "combo2"},
	{ name: "Wheeling Thrust",
	  shortName: "WT",
	  description: "Delivers an attack with a potency of 260.<br/>300 when executed from a target's rear.<br/>Can only be executed while under the effect of both Blood of the Dragon and Enhanced Wheeling Thrust.<br/>Additional Effect: Extends Blood of the Dragon duration by 10s to a maximum of 30s",
	  potency: 300,
	  effects: ["Sharper Fang and Claw"],
	  type: "Weaponskill",
	  group: "combo2"},

	{ name: "Heavy Thrust",
	  shortName: "HT",
	  description: "Delivers an attack with a potency of 150.<br/>190 when executed from a target's flank.<br/>Additional Effect: Increases damage dealt by 10%<br/>Duration: 30s",
	  potency: 190,
	  effects: ["Heavy Thrust"],
	  type: "Weaponskill",
	  group: "miscgcd"},
	{ name: "Piercing Talon",
	  shortName: "PT",
	  description: "Delivers a ranged attack with a potency of 120.",
	  potency: 120,
	  type: "Weaponskill",
	  group: "miscgcd"},
	{ name: "Doom Spike",
	  shortName: "DS",
	  description: "Delivers an attack with a potency of 140 to all enemies in a straight line before you.",
	  potency: 140,
	  type: "Weaponskill",
	  group: "miscgcd"},
	{ name: "Sonic Thrust",
	  shortName: "ST",
	  description: "Delivers an attack with a potency of 100 to all enemies in a straight line before you.<br/>Combo Action: Doom Spike<br/>Combo Potency: 180<br/>Combo Bonus: Increases Blood of the Dragon duration by 10s to a maximum of 30s",
	  potency: 180,
	  type: "Weaponskill",
	  group: "miscgcd"},

	{ name: "Blood for Blood",
	  shortName: "BfB",
	  description: "Increases damage dealt by 15% and damage suffered by 10%.<br/>Duration: 20s",
	  recast: 80,
	  delayed: "true",
	  effects: ["Blood for Blood"],
	  type: "Ability",
	  group: "buff"},
	{ name: "Dragon Sight",
	  shortName: "DS",
	  description: "Grants Right Eye to self and Left Eye to target party member, increasing your damage dealt by 10% and the target party member's damage dealt by 5%, as long as target remains within 12 yalms.<br/>Duration: 20s",
	  recast: 120,
	  delayed: "true",
	  effects: ["Right Eye"],
	  type: "Ability",
	  group: "buff"},
	{ name: "Battle Litany",
	  shortName: "BL",
	  description: "Increases critical hit rate of self and nearby party members by 15%.<br/>Duration: 20s",
	  recast: 180,
	  delayed: "true",
	  effects: ["Battle Litany"],
	  type: "Ability",
	  group: "buff"},
	{ name: "Life Surge",
	  shortName: "LS",
	  description: "Ensures critical damage for first weaponskill used while Life Surge is active. Damage dealt will be absorbed as HP, up to 10% of maximum HP.<br/>Duration: 10s",
	  recast: 50,
	  effects: ["Life Surge"],
	  type: "Ability",
	  group: "buff"},
	{ name: "Blood of the Dragon",
	  shortName: "BotD",
	  description: "Increases potency of Jump and Spineshatter Dive by 30%.<br/>Duration: 20s<br/>Additional Effect: Grants Sharper Fang and Claw upon successfully executing Full Thrust, or Enhanced Wheeling Thrust upon successfully executing Chaos Thrust<br/>Duration: 10s<br/>Effects end upon reuse or upon using a weaponskill other than Fang and Claw or Wheeling Thrust.<br/>Cannot be executed while under the effect of Life of the Dragon.",
	  recast: 30,
	  delayed: "true",
	  effects: ["Blood of the Dragon"],
	  type: "Ability",
	  group: "buff"},
	{ name: "Potion",
	  shortName: "Pot",
	  description: "This diluted brew temporarily increases strength, but for twice the duration of similar potions.<br/>Item Level 350<br/>Consumable Bonuses (Duration: 30s) (Recast: 5m / HQ 4m30s)<br/>Strength +8% (Cap: 180) HQ +10% / Cap: 225",
	  recast: 270,
	  animLock: 1.3,
	  delayed: "true",
	  effects: ["Medicated"],
	  type: "Ability",
	  group: "buff"},

	{ name: "Jump",
	  shortName: "Jump",
	  description: "Delivers a jumping attack with a potency of 260. Returns you to your original position after the attack is made.<br/>Additional Effect: Grants Dive Ready<br/>Duration: 15s<br/>Cannot be executed while bound.",
	  potency: 260,
	  recast: 30,
	  animLock: 1.3,
	  effects: ["Dive Ready"],
	  type: "Ability",
	  group: "ogcd"},
	{ name: "Spineshatter Dive",
	  shortName: "SSD",
	  description: "Delivers a jumping attack with a potency of 210.<br/>Additional Effect: Stun<br/>Duration: 2s<br/>Additional Effect: Grants Dive Ready<br/>Duration: 15s<br/>Cannot be executed while bound.",
	  potency: 210,
	  recast: 60,
	  animLock: 1.3,
	  effects: ["Dive Ready"],
	  type: "Ability",
	  group: "ogcd"},
	{ name: "Dragonfire Dive",
	  shortName: "DFD",
	  description: "Delivers a jumping fire-based attack with a potency of 320 to all nearby enemies. Cannot be executed while bound.",
	  potency: 320,
	  recast: 120,
	  animLock: 1.3,
	  type: "Ability",
	  group: "ogcd"},
	{ name: "Mirage Dive",
	  shortName: "MD",
	  description: "Delivers an attack with a potency of 210.<br/>Additional Effect: Strengthens the gaze of your Dragon Gauge by 1 while under the effect of Blood of the Dragon or Life of the Dragon<br/>Can only be executed when Dive Ready.",
	  potency: 210,
	  recast: 1,
	  type: "Ability",
	  group: "ogcd"},
	{ name: "Geirskogul",
	  shortName: "GK",
	  description: "Delivers an attack with a potency of 230 to all enemies in a straight line before you.<br/>Can only be executed while under the effect of Blood of the Dragon.<br/>Additional Effect: Changes Blood of the Dragon to Life of the Dragon<br/>Dragon Gauge Cost: 3",
	  potency: 230,
	  recast: 30,
	  type: "Ability",
	  group: "ogcd"},
	{ name: "Nastrond",
	  shortName: "NS",
	  description: "Delivers an attack with a potency of 330 to all enemies in a straight line before you.<br/>Can only be executed while under the effect of Life of the Dragon.",
	  potency: 330,
	  recast: 10,
	  type: "Ability",
	  group: "ogcd"},
	{ name: "Elusive Jump",
	  shortName: "EJ",
	  description: "Executes a jump to a location 15 yalms behind you, while removing any Heavy or Bind effects.<br/>Additional Effect: Reduces enmity by half",
	  recast: 30,
	  animLock: 1.3,
	  type: "Ability",
	  group: "ogcd"},

	{ name: "Second Wind",
	  shortName: "SW",
	  description: "Instantly restores own HP.<br/>Cure Potency: 500<br/>Cure potency varies with current attack power.",
	  potency: 500,
	  recast: 120,
	  type: "Ability",
	  group: "crossrole"},
	{ name: "Arm's Length",
	  shortName: "AL",
	  description: "Creates a barrier nullifying most knockback and draw-in effects.<br/>Duration: 5s<br/>Additional Effect: Slow +20% when barrier is struck<br/>Duration: 15s",
	  recast: 60,
	  effects: ["Arm's Length"],
	  type: "Ability",
	  group: "crossrole"},
	{ name: "Leg Sweep",
	  shortName: "LS",
	  description: "Stuns target.<br/>Duration: 3s",
	  recast: 40,
	  type: "Ability",
	  group: "crossrole"},
	{ name: "Diversion",
	  shortName: "Div",
	  description: "Reduces enmity generation.<br/>Duration: 30s",
	  recast: 120,
	  delayed: "true",
	  effects: ["Diversion"],
	  type: "Ability",
	  group: "crossrole"},
	{ name: "Invigorate",
	  shortName: "Inv",
	  description: "Instantly restores 400 TP.",
	  potency: 400,
	  recast: 120,
	  type: "Ability",
	  group: "crossrole"},
	{ name: "Bloodbath",
	  shortName: "BB",
	  description: "Converts a portion of physical damage dealt into HP.<br/>Duration: 20s",
	  recast: 90,
	  delayed: "true",
	  effects: ["Bloodbath"],
	  type: "Ability",
	  group: "crossrole"},
	{ name: "Goad",
	  shortName: "Goad",
	  description: "Refreshes TP of a single party member.<br/>Duration: 30s",
	  potency: 30,
	  effectDuration: 30,
	  recast: 180,
	  type: "Ability",
	  group: "crossrole"},
	{ name: "Feint",
	  shortName: "Feint",
	  description: "Lowers target's strength and dexterity by 10%.<br/>Duration: 10s",
	  recast: 120,
	  effects: ["Feint"],
	  type: "Ability",
	  group: "crossrole"},
	{ name: "Crutch",
	  shortName: "Crutch",
	  description: "Removes Bind and Heavy from target party member other than self.",
	  potency: 150,
	  recast: 90,
	  type: "Ability",
	  group: "crossrole"},
	{ name: "True North",
	  shortName: "TN",
	  description: "Nullifies all action direction requirements.<br/>Duration: 15s",
	  recast: 150,
	  delayed: "true",
	  effects: ["True North"],
	  type: "Ability",
	  group: "crossrole"},

	{ name: "Delay",
	  shortName: "Delay",
	  description: "Will be turned into a downtime manager later",
	  animLock: 1.05,
	  type: "Ability",
	  group: "other"}
];

var effects = [
	{ name: "Heavy Thrust",
	  shortName: "HT",
	  description: "Damage dealt is increased.",
	  value: 1.1,
	  duration: 30,
	  activationTime: 1.1,
      backgroundColor: "rgb(240, 208, 144)",
      borderColor: "rgb(208, 176, 144)",
	  type: "Damage"},
	{ name: "Piercing Resistance Down",
	  shortName: "DE",
	  description: "Piercing resistance is reduced.",
	  value: 1.05,
	  duration: 30,
	  activationTime: 1.6,
      backgroundColor: "rgb(160, 32, 32)",
      borderColor: "rgb(160, 160, 160)",
	  type: "Piercing"},
	{ name: "Chaos Thrust",
	  shortName: "CT",
	  description: "Wounds are bleeding, causing damage over time.",
	  value: 35,
	  duration: 30,
	  activationTime: 1.6,
      backgroundColor: "rgb(154, 126, 165)",
      borderColor: "rgb(77, 63, 83)",
	  type: "DoT"},
	{ name: "Blood for Blood",
	  shortName: "BfB",
	  description: "Increasing damage dealt while increasing damage taken.",
	  value: 1.15,
	  duration: 20,
	  activationTime: 0.6,
      backgroundColor: "rgb(144, 16, 16)",
      borderColor: "rgb(16, 16, 16)",
	  type: "Damage"},
	{ name: "Right Eye",
	  shortName: "DS",
	  description: "Damage dealt is increased.",
	  value: 1.1,
	  duration: 20,
	  activationTime: 0.6,
      backgroundColor: "rgb(183, 67, 44)",
      borderColor: "rgb(91, 34, 22)",
	  type: "Damage"},
	{ name: "Battle Litany",
	  shortName: "BL",
	  description: "Critical hit rate is increased.",
	  value: 0.15,
	  duration: 20,
	  activationTime: 0.6,
      backgroundColor: "rgb(208, 240, 240)",
      borderColor: "rgb(16, 208, 208)",
	  type: "Crit"},
	{ name: "Medicated",
	  shortName: "Pot",
	  description: "Performance is being enhanced by a medicinal item.",
	  value: 225,
	  duration: 30,
	  activationTime: 0.93,
      backgroundColor: "rgb(48, 80, 144)",
      borderColor: "rgb(80, 48, 16)",
	  type: "Special"},
	  
	{ name: "Life Surge",
	  shortName: "LS",
	  description: "Next weaponskill will result in a critical hit with resulting damage being absorbed as HP.",
	  duration: 10,
      backgroundColor: "rgb(176, 48, 16)",
      borderColor: "rgb(144, 16, 16)",
	  type: "Special"},
	{ name: "Dive Ready",
	  shortName: "DR",
	  description: "Able to execute Mirage Dive.",
	  duration: 15,
      backgroundColor: "rgb(108, 138, 191)",
      borderColor: "rgb(54, 69, 95)",
	  type: "Special"},
	{ name: "Sharper Fang and Claw",
	  shortName: "SFC",
	  description: "Able to execute Fang and Claw.",
	  duration: 10,
	  value: 0,
      backgroundColor: "rgb(208, 240, 240)",
      borderColor: "rgb(112, 48, 16)",
	  type: "Special"},
	{ name: "Enhanced Wheeling Thrust",
	  shortName: "EWT",
	  description: "Able to execute Wheeling Thrust.",
	  duration: 10,
	  value: 0,
      backgroundColor: "rgb(144, 80, 48)",
      borderColor: "rgb(16, 16, 16)",
	  type: "Special"},
	{ name: "Blood of the Dragon",
	  shortName: "BotD",
	  description: "Potency of Jump and Spineshatter Dive are increased.",
	  value: 1.3,
	  duration: 20,
	  eyes: 0,
	  life: false,
      backgroundColor: "rgb(156, 252, 252)",
      eyeColor: "rgb(12, 20, 20)",
      lifeColor: "rgb(255,60,60)",
	  type: "Special"},
	// { name: "Life of the Dragon",
	//   shortName: "LotD",
	//   description: "",
	//   value: 1.3,
	//   duration: 20,
	//   type: ""},

	{ name: "Arm's Length",
	  shortName: "AL",
	  description: "Slowing enemies when attacked. Immune to most knockback and draw-in effects.",
	  duration: 5,
	  activationTime: 0.6,
      backgroundColor: "rgb(16, 16, 48)",
      borderColor: "rgb(8, 8, 24)",
	  type: "Special"},
	{ name: "Diversion",
	  shortName: "Div",
	  description: "Enmity generation is reduced.",
	  duration: 30,
	  activationTime: 0.6,
      backgroundColor: "rgb(104, 167, 147)",
      borderColor: "rgb(52, 83, 74)",
	  type: "Special"},
	{ name: "Bloodbath",
	  shortName: "BB",
	  description: "Physical attacks generate HP equal to a portion of damage dealt.",
	  duration: 20,
	  activationTime: 0.6,
      backgroundColor: "rgb(80, 16, 16)",
      borderColor: "rgb(48, 16, 16)",
	  type: "Special"},
	{ name: "Feint",
	  shortName: "Feint",
	  description: "Strength and dexterity are reduced.",
	  duration: 10,
	  activationTime: 0.6,
      backgroundColor: "rgb(137, 87, 83)",
      borderColor: "rgb(69, 44, 42)",
	  type: "Special"},
	{ name: "True North",
	  shortName: "TN",
	  description: "All action direction requirements are nullified.",
	  duration: 15,
	  activationTime: 0.6,
      backgroundColor: "rgb(208, 144, 80)",
      borderColor: "rgb(104, 72, 40)",
	  type: "Special"}
];

var defaultAnimLock = 0.7;
var scale = 60;