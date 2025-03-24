class Stats {
	constructor(wd, str, dh, crit, det, sks, activeEffects) {
		this.wd = wd;
		this.wDelay = 2.80;
		this.str = str;
		this.dh = dh;
		this.crit = crit;
		this.det = det;
		this.sks = sks;
		this.activeEffects = activeEffects;
		this.globalDmgMult = 1;
		this.piercingDmgMult = 1;
		this.dhRateBonus = 0;
		this.critRateBonus = 0;
		this.CTDamage = 0;
        this.arrow = 0;
        this.type1 = 0;
        this.type2 = 0;
        this.haste = 0;
        this.feyWind = 0;
        this.riddleOfFire = 100;
        this.astralUmbral = 100;
        
        this.jobMod = 115;
        
        // Lvl 70
        // this.lvlModAP = 125;
        // this.lvlModMain = 292;
        // this.lvlModSub = 364;
        // this.lvlModDiv = 2170;
        
        // Lvl 80
        // this.lvlModAP = 165;
        // this.lvlModMain = 340;
        // this.lvlModSub = 380;
        // this.lvlModDiv = 3300;
        
        // Lvl 90
        // this.lvlModAP = 195;
        // this.lvlModMain = 390;
        // this.lvlModSub = 400;
        // this.lvlModDiv = 1900;
        
        // Lvl 100
        this.lvlModAP = 237;
        this.lvlModMain = 440;
        this.lvlModSub = 420;
        this.lvlModDiv = 2780;
	}

	copy() {
		return new Stats(this.wd, this.str, this.dh, this.crit, this.det, this.sks, this.activeEffects);
	}

	updateEffects(timedEffect){
        var effect = timedEffect.effect;
		switch (effect.type) {
			case "Damage":
				this.globalDmgMult = 1;
				this.activeEffects.forEach(ef => {
					if (ef.effect.type === "Damage") {
						if (ef.royalRoad === "Enhanced")
							this.globalDmgMult *= ef.effect.enhancedValue;
						else if (ef.royalRoad === "Expanded")
							this.globalDmgMult *= ef.effect.expandedValue;
						else if (ef.coda > 0)
							this.globalDmgMult *= 1 + (ef.effect.value - 1) * ef.coda;
						// else if (ef.emboldenStacks > 0)
						// 	this.globalDmgMult *= (ef.effect.value + ef.emboldenStacks * ef.effect.stackValue);
						else
							this.globalDmgMult *= ef.effect.value;
					}
				});
				break;
			case "Piercing":
				this.piercingDmgMult = 1;
				this.activeEffects.forEach(ef => {
					if (ef.effect.type === "Piercing") {
						this.piercingDmgMult *= ef.effect.value;
					}
				});
				break;
			case "DoT":
				if (effect.name === "Chaotic Spring") {
					if (this.activeEffects.findIndex(ef => ef.effect.name === effect.name) >= 0) {
						this.CTDamage = timedEffect.dotDamage;
					} else {
						this.CTDamage = 0;
					}
				}
				break;
			case "Crit":
				this.critRateBonus = 0;
				this.activeEffects.forEach(ef => {
					if (ef.effect.type === "Crit" || ef.effect.type === "DCrit") {
						if (ef.royalRoad === "Enhanced")
							this.critRateBonus += ef.effect.enhancedValue;
						else if (ef.royalRoad === "Expanded")
							this.critRateBonus += ef.effect.expandedValue;
						else
							this.critRateBonus += ef.effect.value;
					}
				});
				break;
			case "DH":
				this.dhRateBonus = 0;
				this.activeEffects.forEach(ef => {
					if (ef.effect.type === "DH" || ef.effect.type === "DCrit") {
						this.dhRateBonus += ef.effect.value;
					}
				});
				break;
			case "DCrit":
				this.critRateBonus = 0;
				this.dhRateBonus = 0;
				this.activeEffects.forEach(ef => {
					if (ef.effect.type === "Crit" || ef.effect.type === "DCrit") {
						if (ef.royalRoad === "Enhanced")
							this.critRateBonus += ef.effect.enhancedValue;
						else if (ef.royalRoad === "Expanded")
							this.critRateBonus += ef.effect.expandedValue;
						else
							this.critRateBonus += ef.effect.value;
					}
					if (ef.effect.type === "DH" || ef.effect.type === "DCrit") {
						this.dhRateBonus += ef.effect.value;
					}
				});
				break;
			case "Speed":
				switch (effect.name) {
                    // case "The Arrow":
                    //     if (this.activeEffects.findIndex(ef => ef.effect.name === effect.name) >= 0) {
					// 		if (timedEffect.royalRoad === "Enhanced")
					// 			this.arrow = effect.enhancedValue;
					// 		else if (timedEffect.royalRoad === "Expanded")
					// 			this.arrow = effect.expandedValue;
					// 		else
					// 			this.arrow = effect.value;
                    //     } else
                    //         this.arrow = 0;
                    //     break;
                    // case "Fey Wind":
                    //     if (this.activeEffects.findIndex(ef => ef.effect.name === effect.name) >= 0)
                    //         this.feyWind = effect.value;
                    //     else
                    //         this.feyWind = 0;
                    //     break;
                    default:
                        console.log("Effect " + effect.name + " needs to be implemented");
                        break;
				}
				break;
			case "Special":
				if (effect.name === "Medicated") {
					if (this.activeEffects.findIndex(ef => ef.effect.name === effect.name) >= 0)
						this.str += effect.value;
					else
						this.str -= effect.value;
				}
			default:
				break;
		}
	}

	wdMod() {
		return Math.floor(this.lvlModMain * this.jobMod / 1000 + this.wd);
	}

	aaMod() {
		return Math.floor((Math.floor(this.lvlModMain * this.jobMod / 1000) + this.wd) * (this.wDelay / 3));
	}

	strMod() {
		return Math.floor((this.lvlModAP * (this.str - this.lvlModMain) / this.lvlModMain) + 100) / 100;
	}

	dhRate() {
		return Math.min(Math.floor((this.dh - this.lvlModSub) * 550 / this.lvlModDiv) / 1000 + this.dhRateBonus, 1);
	}

	dhDamage() {
		return 1.25;
	}

	dhMod() {
		return 1 + this.dhRate() * (this.dhDamage() - 1);
	}

	critRate() {
		return Math.min(Math.floor(50 + (this.crit - this.lvlModSub) * 200 / this.lvlModDiv) / 1000 + this.critRateBonus, 1);
	}

	critDamage() {
		return Math.floor(1400 + (this.crit - this.lvlModSub) * 200 / this.lvlModDiv) / 1000;
	}

	critMod() {
		return 1 + this.critRate() * (this.critDamage() - 1);
	}

	autoCritMod() {
		return 1 + this.critRateBonus * (this.critDamage() - 1);
	}

	detMod() {
		return Math.floor(1000 + (this.det - this.lvlModMain) * 140 / this.lvlModDiv) / 1000;
	}

	sksMod() {
		return Math.floor(1000 + (this.sks - this.lvlModSub) * 130 / this.lvlModDiv) / 1000;
	}

	gcd() {
        var GCDm = Math.floor(2.5 * (1000 - Math.floor(130 * (this.sks - this.lvlModSub) / this.lvlModDiv)));
        var A = Math.floor(Math.floor(Math.floor((100 - this.arrow) * (100 - this.type1) / 100) * (100 - this.haste) / 100) - this.feyWind);
        var B = (100 - this.type2) / 100;
        var GCDc = Math.floor(Math.floor(Math.floor(Math.ceil(A * B) * GCDm / 100) * this.riddleOfFire / 1000) * this.astralUmbral / 100);
        return GCDc / 100;
		// return     Math.floor(2.5 * (1 - Math.floor((this.sks - this.lvlModSub) * 130 / this.lvlModDiv) / 1000) * 100) / 100;
	}

	aaDelay() {
        var A = Math.floor(Math.floor(Math.floor((100 - this.arrow) * (100 - this.type1) / 100) * (100 - this.haste) / 100) - this.feyWind);
        var B = (100 - this.type2) / 100;
		return Math.floor(Math.floor(Math.floor(this.wDelay * 100 * Math.ceil(A * B) / 10) * this.riddleOfFire / 1000) * this.astralUmbral / 100) / 100;
	}

	actionDamage(potency) {
		return potency / 100 * this.wdMod() * this.strMod() * this.detMod() * this.dhMod() * this.critMod() * this.globalDmgMult * this.piercingDmgMult;
	}

	actionDamageLS(potency) {
		return potency / 100 * this.wdMod() * this.strMod() * this.detMod() * this.dhMod() * this.critDamage() * this.globalDmgMult * this.piercingDmgMult * this.autoCritMod();
	}

	aaDamage() {
		return 90 / 100 * this.aaMod() * this.strMod() * this.detMod() * this.sksMod() * this.dhMod() * this.critMod() * this.globalDmgMult * this.piercingDmgMult;
	}

	dotDamage(potency) {
		return potency / 100 * this.wdMod() * this.strMod() * this.detMod() * this.sksMod() * this.dhMod() * this.critMod() * this.globalDmgMult;
	}
}

class RotationEvent {
	constructor(time, name, type, potency, actionDamage, aaDamage, dotDamage, aaTick, dotTick, cumulDamage, gcdDps, oGcdDps, dotDps, aaDps, dps, timedEffect) {
		this.time = time;
		this.name = name;
		this.type = type;
		this.potency = potency;
		this.actionDamage = actionDamage;
		this.aaDamage = aaDamage;
		this.dotDamage = dotDamage;
		this.aaTick = aaTick;
		this.dotTick = dotTick;
		this.cumulDamage = cumulDamage;
        this.gcdDps = gcdDps;
        this.oGcdDps = oGcdDps;
        this.dotDps = dotDps;
        this.aaDps = aaDps;
		this.dps = dps;
		this.timedEffect = timedEffect;
	}

	display() {
		console.log(this.time + " " + this.name + " " + this.type + ", Action Damage: " + this.actionDamage);
        console.log("  Potency: " + this.potency + ", Cumul Damage: " + this.cumulDamage + ", DPS: " + this.dps);
        console.log("  AA Tick: " + this.aaTick + ", DoT Tick: " + this.dotTick);
        console.log("  AA Damage: " + this.aaDamage + ", DoT Damage: " + this.dotDamage);
	}
}

function deleteAfter(rotationHistory, beginTime) {
	var idx = rotationHistory.length;
	for (i = 0; i < rotationHistory.length; i++) {
		if (Number($(rotationHistory[i]).attr("time")) > beginTime) {
			idx = i;
			break;
		}
	}
	// console.log("Deleting " + (rotationHistory.length - idx) + " actions");
	rotationHistory.splice(idx);
}

// function playUntil(rotationDom, rotationHistory, endTime) {
// 	// For logs
// 	var actionsNb = rotationHistory.length;
	
// 	var stats = new Stats(109, 3207, 1611, 2557, 1796, 655);
// 	var time = rotationDom.first().attr("time") - 1;
// 	var cumulDamage = 0;
// 	if (rotationHistory.length > 0) {
// 		time = rotationHistory[rotationHistory.length - 1].time;
// 		cumulDamage = rotationHistory[rotationHistory.length - 1].cumulDamage;
// 	}
// 	var actionsToPlay = rotationDom.filter(function(index) {return Number($(this).attr("time")) > time;});
// 	var curAction = actionsToPlay.first();
// 	time = Number(curAction.attr("time"));
// 	while (time <= endTime) {
// 		// console.log ("time: " + time + ", endTime: " + endTime);
// 		var eName = curAction.attr("name");
// 		var eType = "action";
// 		var ePot = getPotency(eName);
// 		var eDmg = stats.actionDamage(ePot);
// 		cumulDamage += eDmg;
// 		var eDps = time <= 0 ? 0 : cumulDamage / time;
// 		rotationHistory.push(new RotationEvent(time, eName, eType, ePot, eDmg, cumulDamage, eDps));
// 		curAction = curAction.next();
// 		time = Number(curAction.attr("time"));
// 	}
	
// 	// console.log("Added " + (rotationHistory.length - actionsNb) + " actions, from " + actionsNb + " to " + rotationHistory.length);
// }

function addToActivate(effect, list) {
    addToList(effect, list, "beginTime");
}

function addToEnd(effect, list) {
    addToList(effect, list, "endTime");
}

function addToList(effect, list, property) {
    var idx = 0;
    while (list[idx] !== undefined && list[idx][property] < effect[property]) { idx++; }
    list.splice(idx, 0, effect);
}

function initGroupEffects(groupEffectsDom, effectsToActivate, effectsToEnd) {
    $(groupEffectsDom).each(function() {
        var ef = effects.find(e => e.name === $(this).attr("name"));
        var beginTime = Number($(this).attr("time"));
        var endTime = Number($(this).attr("endtime"));
        var timedEffect = {effect: ef, beginTime: beginTime, endTime: endTime, jobIndex: $(this).attr("jobIndex")};
        if (this.hasAttribute("royalRoad"))
        	timedEffect.royalRoad = $(this).attr("royalRoad");
        // if (this.hasAttribute("emboldenStacks"))
        // 	timedEffect.emboldenStacks = Number($(this).attr("emboldenStacks"));
        if (this.hasAttribute("coda"))
        	timedEffect.coda = Number($(this).attr("coda"));
        addToActivate(timedEffect, effectsToActivate);
        addToEnd(timedEffect, effectsToEnd);
    });
}

function generateHistory(rotationDom, rotationHistory, stats, groupEffectsDom) {
	var activeEffects = stats.activeEffects;
	var curAction = rotationDom.first();
	var nextAction = curAction;
	var time = Number(curAction.attr("time"));
	var lastTime = time;
	var cumulGcdDamage = 0;
	var cumulOGcdDamage = 0;
	var cumulDotDamage = 0;
	var cumulAaDamage = 0;
	var cumulDamage = 0;
	var effectsToActivate = [];
	var effectsToEnd = [];

	// effects.find(ef => ef.name === "Life of the Dragon").eyes = 0;
	effects.find(ef => ef.name === "Firstminds' Focus").scales = 0;

	var eType = "action";
    
    initGroupEffects(groupEffectsDom, effectsToActivate, effectsToEnd);
    if (effectsToActivate.length > 0) {
        if (effectsToActivate[0].beginTime <= time) {
            eType = "effectBegin";
            time = effectsToActivate[0].beginTime;
            lastTime = time;
        }
    }

	while (eType !== "done") {
		var eName = "";
		var ePot = 0;
		var eDmg = 0;
        var eAaTick = stats.aaDamage();
        var eDotTick = stats.CTDamage;
		var eAaDmg = ((time >= 0 ? time : 0) - (lastTime >= 0 ? lastTime : 0)) / stats.aaDelay() * eAaTick;
		var eDotDmg = ((time >= 0 ? time : 0) - (lastTime >= 0 ? lastTime : 0)) / 3 * eDotTick;
		var timedEffect;
        
        // Overwrite effect
        if (eType === "effectBegin") {
            timedEffect = effectsToActivate[0];
            // If fresh Embolden application, place low stack first so it will be overwritten by fresh Embolden
            // if (timedEffect.effect.name === "Embolden" && timedEffect.emboldenStacks === effects.find(ef => ef.name === "Embolden").maxStacks) {
            //     var emboldenList = effectsToActivate.filter(ef => ef.effect.name === "Embolden" && ef.beginTime === time);
            //     if (emboldenList.length > 1) {
            //         effectsToActivate.splice(effectsToActivate.indexOf(emboldenList[1]), 1); // Assumes list order is preserved
            //         effectsToActivate.unshift(emboldenList[1]);
            //     }
            // }
            
            var activeIdx = activeEffects.findIndex(ef => ef.effect.name === timedEffect.effect.name);
            if (timedEffect.effect.groupAction === "Draw")
                activeIdx = activeEffects.findIndex(ef => ef.effect.groupAction === "Draw");
            if (timedEffect.effect.groupAction === "The Wanderer's Minuet" || timedEffect.effect.groupAction === "Mage's Ballad" || timedEffect.effect.groupAction === "Army's Paeon")
                activeIdx = activeEffects.findIndex(ef => ef.effect.groupAction === "The Wanderer's Minuet" || ef.effect.groupAction === "Mage's Ballad" || ef.effect.groupAction === "Army's Paeon");
            if (activeIdx >= 0 && !timedEffect.effect.stackable) {
                eType = "effectEnd";
                
                var oldTimedEffect = activeEffects[activeIdx];
                if (effectsToEnd.indexOf(oldTimedEffect) >= 0 && oldTimedEffect.beginTime <= timedEffect.beginTime && oldTimedEffect.endTime > timedEffect.beginTime) {
                    effectsToEnd.splice(effectsToEnd.indexOf(oldTimedEffect), 1);
                    oldTimedEffect.endTime = timedEffect.beginTime;
                    effectsToEnd.unshift(oldTimedEffect);
                
                    // Embolden : Delete all next stacks toActivate/toEnd
                    // if (timedEffect.effect.name === "Embolden") {
                    //     var emboldenEffect = effects.find(ef => ef.name === "Embolden");
                    //     var emboldenBeginTime = (oldTimedEffect.beginTime - (emboldenEffect.maxStacks - oldTimedEffect.emboldenStacks) * emboldenEffect.stackDuration).toFixed(3);
                    //     for (var currentStacks = oldTimedEffect.emboldenStacks - 1; currentStacks > 0; currentStacks--) {
                    //         var currentTime = (Number(emboldenBeginTime) + (emboldenEffect.maxStacks - currentStacks) * emboldenEffect.stackDuration).toFixed(3);
                    //         effectsToActivate.splice(effectsToActivate.findIndex(e => e.effect.name === "Embolden" && e.beginTime.toFixed(3) === currentTime && e.jobIndex === oldTimedEffect.jobIndex && e.emboldenStacks === currentStacks), 1);
                    //         effectsToEnd.splice(effectsToEnd.findIndex(e => e.effect.name === "Embolden" && e.beginTime.toFixed(3) === currentTime && e.jobIndex === oldTimedEffect.jobIndex && e.emboldenStacks === currentStacks), 1);
                    //     }
                    // }
                }
            }
        }
        
		switch (eType) {
			case "action":
				curAction = nextAction;
				nextAction = nextAction.next();
				eName = curAction.attr("name");
				ePot = getPotency(eName);

				// Potency modifiers
				switch(eName) {
	            	// case "Jump":
	            	// case "High Jump":
	            	// case "Spineshatter Dive":
	            	// 	var BotDEffect = activeEffects.find(ef => ef.effect.name === "Blood of the Dragon") || activeEffects.find(ef => ef.effect.name === "Life of the Dragon");
	            	// 	if (BotDEffect)
	            	// 		ePot *= BotDEffect.effect.value;
	            	// 	break;
	            	// case "Fang and Claw":
	            	// 	var FCEffect = activeEffects.find(ef => ef.effect.name === "Fang and Claw Bared");
	            	// 	if (FCEffect)
	            	// 		ePot += FCEffect.effect.value;
	            	// 	else
	            	// 		ePot = 0;
	            	// 	break;
	            	// case "Wheeling Thrust":
	            	// 	var WTEffect = activeEffects.find(ef => ef.effect.name === "Wheel in Motion");
	            	// 	if (WTEffect)
	            	// 		ePot += WTEffect.effect.value;
	            	// 	else
	            	// 		ePot = 0;
	            	// 	break;
					case "Piercing Talon":
	            		var EPTEffect = activeEffects.find(ef => ef.effect.name === "Enhanced Piercing Talon");
	            		if (EPTEffect) {
	            			ePot += EPTEffect.effect.value;
		                    var EPTToEnd = effectsToEnd.splice(effectsToEnd.findIndex(ef => ef.effect.name === "Enhanced Piercing Talon"), 1)[0];
		                    EPTToEnd.endTime = time;
		                    effectsToEnd.unshift(EPTToEnd);
	            		}
						break;
            		default:
            			break;
	            }

	            // Action damage
                if (getType(eName) === "Weaponskill" && activeEffects.findIndex(ef => ef.effect.name === "Life Surge") >= 0) {
                	eDmg = stats.actionDamageLS(ePot);
                	// Consuming LS
                    var LSEffect = effectsToEnd.splice(effectsToEnd.findIndex(ef => ef.effect.name === "Life Surge"), 1)[0];
                    LSEffect.endTime = time;
                    effectsToEnd.unshift(LSEffect);
                } else {
                	eDmg = stats.actionDamage(ePot);
                }

                // Activating effects
				getEffects(eName).forEach(ef => {
                    // Lance Mastery
                    // if (eName === "Fang and Claw") {
                    // 	var FCEffect = activeEffects.find(ef => ef.effect.name === "Fang and Claw Bared");
                    // 	if (ef.name === "Wheel in Motion") {
	                //     	if (FCEffect && FCEffect.effect.value)
	                //         	return;
	                //         else
	                //         	ef.value = 100;
	                //     } else if (ef.name === "Draconian Fire" && !(FCEffect && FCEffect.effect.value))
	                //     	return;
                    // } else if (eName === "Wheeling Thrust") {
                    // 	var WTEffect = activeEffects.find(ef => ef.effect.name === "Wheel in Motion");
                    // 	if (ef.name === "Fang and Claw Bared") {
	                //     	if (WTEffect && WTEffect.effect.value)
	                //         	return;
	                //         else
	                //         	ef.value = 100;
	                //     } else if (ef.name === "Draconian Fire" && !(WTEffect && WTEffect.effect.value))
	                //     	return;
                    // }

                    // Re-use BotD
                    // if (ef.name === "Blood of the Dragon") {
	            	// 	var BotDIdx = effectsToEnd.findIndex(ef => ef.effect.name === "Blood of the Dragon");
	            	// 	if (BotDIdx >= 0) {
	            	// 		if (!effectsToEnd[BotDIdx].effect.life) {
		            // 			var BotDEffect = effectsToEnd.splice(BotDIdx, 1)[0];
		            // 			BotDEffect.endTime = time + 30;
                    //             addToEnd(BotDEffect, effectsToEnd);
				    //         }
				    //         return;
	            	// 	}
                    // }

                    // LotD
                    // if (ef.name === "Life of the Dragon") {
	            	// 	var LotDEffect = effects.find(ef => ef.name === "Life of the Dragon");
	            	// 	if (LotDEffect && LotDEffect.eyes < 2) {
	            	// 		return;
	            	// 	}
                    // }

	                var activationTime = ef.activationTime === undefined ? 0 : ef.activationTime;
	                var beginTime = Number((time + activationTime).toFixed(3));
	                var endTime = Number((beginTime + ef.duration).toFixed(3));
	                timedEffect = {effect: ef, beginTime: beginTime, endTime: endTime, displaySelf: true};
	                // Nastrond ready stacks
	                if (eName === "Geirskogul" && ef.name === "Nastrond Ready") {
	                	timedEffect.nastrondStacks = 1;
	                }
                    addToActivate(timedEffect, effectsToActivate);

	                var oldTimedEffect = effectsToEnd.find(e => e.effect.name === ef.name);
            		if (oldTimedEffect !== undefined && oldTimedEffect.beginTime < timedEffect.beginTime && oldTimedEffect.endTime > timedEffect.beginTime && !ef.stackable) {
                        effectsToEnd.splice(effectsToEnd.indexOf(oldTimedEffect), 1);
            			oldTimedEffect.endTime = timedEffect.beginTime;
                        addToEnd(oldTimedEffect, effectsToEnd);
            		}
                    addToEnd(timedEffect, effectsToEnd);
                    
                    // Compute CT DoT damage
                    if (ef.name === "Chaotic Spring") {
                        timedEffect.dotDamage = stats.dotDamage(ef.value);
                    }
	            });
                
                // Consuming effects
                var REName = getRequiredEffect(eName);
                if (REName) {
                    var REIdx = effectsToEnd.findIndex(ef => ef.effect.name === REName);
                    if (REIdx >= 0) {
                        var REEffect = effectsToEnd.splice(REIdx, 1)[0];
                        if (REEffect) {
                        	// Next stack of nastrond ready
		                    if (REName === "Nastrond Ready" && REEffect.nastrondStacks > 1) {
		                    	timedEffect = {effect: REEffect.effect, beginTime: time, endTime: REEffect.endTime, displaySelf: true, nastrondStacks: REEffect.nastrondStacks - 1};
		                    	addToActivate(timedEffect, effectsToActivate);
		                    	addToEnd(timedEffect, effectsToEnd);
		                    }
                            REEffect.endTime = time;
                            effectsToEnd.unshift(REEffect);
                        }
                    } else {
                        eDmg = 0;
                        // TODO: Exception need effect
                    }
                }
                
                // Cancel SFC, EWT and RTR when using another Weaponskill
                if (getType(eName) === "Weaponskill") {
                    ["Raiden Thrust"].forEach(elt => {
                        if (eName !== elt) {
                            var REIdx = effectsToEnd.findIndex(ef => ef.effect.name === getRequiredEffect(elt));
                            if (REIdx >= 0 && activeEffects.findIndex(ef => ef.effect.name === getRequiredEffect(elt)) >= 0) {
                                var REEffect = effectsToEnd.splice(REIdx, 1)[0];
                                if (REEffect) {
                                    REEffect.endTime = time;
                                    effectsToEnd.unshift(REEffect);
                                }
                            }
                        }
                    });
                }

				// BotD interactions
				switch(eName) {
	            	// case "Fang and Claw":
	            	// case "Wheeling Thrust":
	            	// case "Sonic Thrust":
	            	// case "Coerthan Torment":
	            	// 	var BotDIdx = effectsToEnd.findIndex(ef => ef.effect.name === "Blood of the Dragon");
	            	// 	if (BotDIdx >= 0 && !effectsToEnd[BotDIdx].effect.life) {
	            	// 		var BotDEffect = effectsToEnd.splice(BotDIdx, 1)[0];
	            	// 		BotDEffect.endTime = Math.min(BotDEffect.endTime + 10, time + 30);
                    //         addToEnd(BotDEffect, effectsToEnd);
	            	// 	}
	            	// 	break;
	            	// case "Mirage Dive":
	            	// 	var LotDEffect = effects.find(ef => ef.name === "Life of the Dragon");
	            	// 	if (LotDEffect)
	            	// 		LotDEffect.eyes = Math.min(LotDEffect.eyes + 1, 2);
	            	// 	break;
	            	// case "Geirskogul":
	            	// 	var LotDEffect = effects.find(ef => ef.name === "Life of the Dragon");
	            	// 	if (LotDEffect && LotDEffect.eyes === 2) {
	            	// 		LotDEffect.eyes = 0;
	            	// 	}
	            	// 	break;
            		default:
            			break;
	            }

	            // Firstminds' Focus
	            switch(eName) {
	            	case "Raiden Thrust":
	            	case "Draconian Fury":
	            		var FiFoEffect = effects.find(ef => ef.name === "Firstminds' Focus");
	            		if (FiFoEffect)
	            			FiFoEffect.scales = Math.min(FiFoEffect.scales + 1, 2);
	            		break;
	            	case "Wyrmwind Thrust":
	            		var FiFoEffect = effects.find(ef => ef.name === "Firstminds' Focus");
	            		if (FiFoEffect && FiFoEffect.scales === 2) {
	            			FiFoEffect.scales = 0;
	            		}
	            		break;
            		default:
            			break;
	        	}

	            break;
            case "effectBegin":
            	timedEffect = effectsToActivate.shift();

            	// Check if not already active
            	if (activeEffects.findIndex(ef => ef.effect.name === timedEffect.effect.name) < 0 || timedEffect.effect.stackable)
                    activeEffects.push(timedEffect);
            	stats.updateEffects(timedEffect);
            	eName = timedEffect.effect.name;
            	break;
            case "effectEnd":
            	timedEffect = effectsToEnd.shift();
            	activeEffects.splice(activeEffects.indexOf(timedEffect), 1);
            	stats.updateEffects(timedEffect);
            	eName = timedEffect.effect.name;
            	timedEffect.endTime = time;
            	if (eName == "Life of the Dragon") {
            		// End Starcross Ready if it's up
                    var SRIdx = effectsToEnd.findIndex(ef => ef.effect.name === "Starcross Ready");
                    if (SRIdx >= 0 && activeEffects.findIndex(ef => ef.effect.name === "Starcross Ready") >= 0) {
                        var SREffect = effectsToEnd.splice(SRIdx, 1)[0];
                        if (SREffect) {
                            SREffect.endTime = time;
                            effectsToEnd.unshift(SREffect);
                        }
                    }
            	}
            	// switch(eName) {
	            // 	case "Wheel in Motion":
	            // 	case "Fang and Claw Bared":
	            // 		timedEffect.effect.value = 0;
	            // 		break;
	            // 	// case "Blood of the Dragon":
	            // 	// 	if (timedEffect.effect.life) {
	            // 	// 		timedEffect.effect.life = false;
	            // 	// 		timedEffect.endTime = time + 30;
                //     //         addToEnd(timedEffect, effectsToEnd);
			    //     //     	activeEffects.push(timedEffect);
			    //     //     	stats.updateEffects(timedEffect);
	            // 	// 	} else {
	            // 	// 		timedEffect.effect.eyes = 0;
	            // 	// 	}
	            // 	// 	break;
            	// 	default:
            	// 		break;
            	// }
            	break;
            default:
		}

		cumulDamage += eDmg + eAaDmg + eDotDmg;
        if (eType === "action" && eDmg > 0) {
            if (getType(eName) === "Weaponskill")
                cumulGcdDamage += eDmg;
            else
                cumulOGcdDamage += eDmg;
        }
		cumulDotDamage += eDotDmg;
		cumulAaDamage += eAaDmg;
		var eGcdDps = time <= 0 ? 0 : cumulGcdDamage / time;
		var eOGcdDps = time <= 0 ? 0 : cumulOGcdDamage / time;
		var eDotDps = time <= 0 ? 0 : cumulDotDamage / time;
		var eAaDps = time <= 0 ? 0 : cumulAaDamage / time;
		var eDps = time <= 0 ? 0 : cumulDamage / time;
		rotationHistory.push(new RotationEvent(time, eName, eType, ePot, eDmg, eAaDmg, eDotDmg, eAaTick, eDotTick, cumulDamage, eGcdDps, eOGcdDps, eDotDps, eAaDps, eDps, timedEffect));

		lastTime = time;
		eType = "done";
		if (effectsToEnd.length > 0) {
			eType = "effectEnd";
			time = effectsToEnd[0].endTime;
		}
		if (effectsToActivate.length > 0) {
			if (eType === "done" || effectsToActivate[0].beginTime < time) {
				eType = "effectBegin";
				time = effectsToActivate[0].beginTime;
			}
		}
		if (nextAction.length > 0) {
			if (eType === "done" || Number(nextAction.attr("time")) < time) {
				eType = "action";
				time = Number(nextAction.attr("time"));
			}
		}
	}

	return rotationHistory;
}

function generateGcdTimeline(gcdTimeline, stats, groupSpeedEffectsDom) {
	if (groupSpeedEffectsDom.length <= 0)
		return;
	var activeEffects = stats.activeEffects;
	var effectsToActivate = [];
	var effectsToEnd = [];
    initGroupEffects(groupSpeedEffectsDom, effectsToActivate, effectsToEnd);
	var time = effectsToActivate[0].beginTime;

	var eType = "effectBegin";

	while (eType !== "done") {
		var timedEffect;
        
        // Overwrite effect
        if (eType === "effectBegin") {
            timedEffect = effectsToActivate[0];
            
            var activeIdx = activeEffects.findIndex(ef => ef.effect.name === timedEffect.effect.name);
            if (timedEffect.effect.groupAction === "Draw")
                activeIdx = activeEffects.findIndex(ef => ef.effect.groupAction === "Draw");
            if (activeIdx >= 0 && !timedEffect.effect.stackable) {
                eType = "effectEnd";
                
                var oldTimedEffect = activeEffects[activeIdx];
                if (effectsToEnd.indexOf(oldTimedEffect) >= 0 && oldTimedEffect.beginTime <= timedEffect.beginTime && oldTimedEffect.endTime > timedEffect.beginTime) {
                    effectsToEnd.splice(effectsToEnd.indexOf(oldTimedEffect), 1);
                    oldTimedEffect.endTime = timedEffect.beginTime;
                    effectsToEnd.unshift(oldTimedEffect);
                }
            }
        }

		switch (eType) {
			case "effectBegin":
	        	timedEffect = effectsToActivate.shift();

	        	// Check if not already active
	        	if (activeEffects.findIndex(ef => ef.effect.name === timedEffect.effect.name) < 0 || timedEffect.effect.stackable)
	                activeEffects.push(timedEffect);
	        	stats.updateEffects(timedEffect);
	        	break;
	        case "effectEnd":
	        	timedEffect = effectsToEnd.shift();
	        	activeEffects.splice(activeEffects.indexOf(timedEffect), 1);
	        	stats.updateEffects(timedEffect);
	        	timedEffect.endTime = time;
	        	break;
	        default:
		}

		if (gcdTimeline.length === 0 || gcdTimeline[gcdTimeline.length - 1].gcd != stats.gcd())
			gcdTimeline.push({ time: time, gcd: stats.gcd() });

		eType = "done";
		if (effectsToEnd.length > 0) {
			eType = "effectEnd";
			time = effectsToEnd[0].endTime;
		}
		if (effectsToActivate.length > 0) {
			if (eType === "done" || effectsToActivate[0].beginTime < time) {
				eType = "effectBegin";
				time = effectsToActivate[0].beginTime;
			}
		}
	}
}

function getAnimationLock(actionName) {
    var animLock = defaultAnimLock;
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("animLock"))
        animLock = action.animLock;
    return (Number($("#Latency").val()) + Number(animLock) * 1000) / 1000;
}

function getRecastTime(actionName) {
	var recast = Number($("#SKSoutGCD").val());
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("recast"))
        recast = action.recast;
    // else if (action.hasOwnProperty("chargeTime"))
    //     recast = action.chargeTime;
	return Number(recast);
}

function getCharges(actionName) {
	var charges = 1;
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("charges"))
        charges = action.charges;
	return Number(charges);
}

function getPotency(actionName) {
    var potency = 0;
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("potency"))
        potency = action.potency;
    return Number(potency);
}

function getDescription(actionName) {
    var description = "";
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("description"))
        description = action.description;
    return description;
}

function getType(actionName) {
    var type = "";
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("type"))
        type = action.type;
    return type;
}

function getEffects(actionName) {
    var actionEffects = [];
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("effects")) {
        var effectsNames = action.effects;
        effectsNames.forEach(efn => actionEffects.push(effects.find(ef => efn === ef.name)));
    }
    return actionEffects;
}

function getRequiredEffect(actionName) {
    var requiredEffect = "";
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("requiredEffect"))
        requiredEffect = action.requiredEffect;
    return requiredEffect;
}

function getEffectDuration(effectName, use) {
    var duration = 0;
    var effect = effects.find(ef => effectName === ef.name);
    if (effectName === "Foe Requiem" && use !== undefined && use % 2 === 1 && effect.hasOwnProperty("altDuration"))
        duration = effect.altDuration;
    else if (effect.hasOwnProperty("duration"))
        duration = effect.duration;
    return Number(duration);
}

function getEffectDescription(effectName) {
    var description = "";
    var effect = effects.find(ef => effectName === ef.name);
    if (effect.hasOwnProperty("description"))
        description = effect.description;
    return description;
}

function getGroupOpenerTime(actionName) {
    var openerTime = 0;
    var groupAction = groupActions.find(ac => actionName === ac.name);
    if (groupAction.hasOwnProperty("openerTime"))
        openerTime = groupAction.openerTime;
    return Number(openerTime);
}

function getGroupJob(actionName) {
    var job = "drg";
    var groupAction = groupActions.find(ac => actionName === ac.name);
    if (groupAction.hasOwnProperty("job"))
        job = groupAction.job;
    return job;
}

function getGroupRecastTime(actionName, use) {
    var recast = 0;
    var groupAction = groupActions.find(ac => actionName === ac.name);
    if (use !== undefined && groupAction.hasOwnProperty("usePattern"))
        recast = groupAction.usePattern[use % groupAction.usePattern.length];
    else if (groupAction.hasOwnProperty("recast"))
        recast = groupAction.recast;
    return Number(recast);
}

function getGroupDisplayRecastTime(actionName, use) {
    var recast = 0;
    var groupAction = groupActions.find(ac => actionName === ac.name);
    if (groupAction.hasOwnProperty("recast"))
        recast = groupAction.recast;
    return Number(recast);
}

function getGroupDescription(actionName) {
    var description = "";
    var groupAction = groupActions.find(ac => actionName === ac.name);
    if (groupAction.hasOwnProperty("description"))
        description = groupAction.description;
    return description;
}