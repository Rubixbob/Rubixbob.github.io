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
	}

	updateEffects(timedEffect){
        var effect = timedEffect.effect;
		switch (effect.type) {
			case "Damage":
				this.globalDmgMult = 1;
				this.activeEffects.forEach(ef => {
					if (ef.type === "Damage") {
						this.globalDmgMult *= ef.value;
					}
				});
				break;
			case "Piercing":
				this.piercingDmgMult = 1;
				this.activeEffects.forEach(ef => {
					if (ef.type === "Piercing") {
						this.piercingDmgMult *= ef.value;
					}
				});
				break;
			case "DoT":
				if (effect.name === "Chaos Thrust") {
					if (this.activeEffects.findIndex(ef => ef.name === effect.name) >= 0) {
						this.CTDamage = timedEffect.dotDamage;
					} else {
						this.CTDamage = 0;
					}
				}
				break;
			case "Crit":
				this.critRateBonus = 0;
				this.activeEffects.forEach(ef => {
					if (ef.type === "Crit") {
						this.critRateBonus += ef.value;
					}
				});
				break;
			case "DH":
				this.dhRateBonus = 0;
				this.activeEffects.forEach(ef => {
					if (ef.type === "DH") {
						this.dhRateBonus += ef.value;
					}
				});
				break;
			case "Speed":
				// TODO
				break;
			case "Special":
				if (effect.name === "Medicated") {
					if (this.activeEffects.findIndex(ef => ef.name === effect.name) >= 0) {
						this.str += effect.value;
					} else {
						this.str -= effect.value;
					}
				}
			default:
				break;
		}
	}

	wdMod() {
		return Math.floor(292 * 115 / 1000 + this.wd);
	}

	aaMod() {
		return Math.floor((Math.floor(292 * 115 / 1000) + this.wd) * (this.wDelay / 3));
	}

	strMod() {
		return Math.floor((125 * (this.str - 292) / 292) + 100) / 100;
	}

	dhRate() {
		return Math.min(Math.floor((this.dh - 364) * 550 / 2170) / 1000 + this.dhRateBonus, 1);
	}

	dhDamage() {
		return 1.25;
	}

	dhMod() {
		return 1 + this.dhRate() * (this.dhDamage() - 1);
	}

	critRate() {
		return Math.min(Math.floor(50 + (this.crit - 364) * 200 / 2170) / 1000 + this.critRateBonus, 1);
	}

	critDamage() {
		return Math.floor(1400 + (this.crit - 364) * 200 / 2170) / 1000;
	}

	critMod() {
		return 1 + this.critRate() * (this.critDamage() - 1);
	}

	detMod() {
		return Math.floor(1000 + (this.det - 292) * 130 / 2170) / 1000;
	}

	sksMod() {
		return Math.floor(1000 + (this.sks - 364) * 130 / 2170) / 1000;
	}

	gcd() {
		return Math.floor(2.5 * (1 - Math.floor((this.sks - 364) * 130 / 2170) / 1000) * 100) / 100;
	}

	actionDamage(potency) {
		return potency / 100 * this.wdMod() * this.strMod() * this.detMod() * this.dhMod() * this.critMod() * this.globalDmgMult * this.piercingDmgMult;
	}

	actionDamageLS(potency) {
		return potency / 100 * this.wdMod() * this.strMod() * this.detMod() * this.dhMod() * this.critDamage() * this.globalDmgMult * this.piercingDmgMult;
	}

	aaDamage() {
		return 110 / 100 * this.aaMod() * this.strMod() * this.detMod() * this.sksMod() * this.dhMod() * this.critMod() * this.globalDmgMult * this.piercingDmgMult;
	}

	dotDamage(potency) {
		return potency / 100 * this.wdMod() * this.strMod() * this.detMod() * this.sksMod() * this.dhMod() * this.critMod() * this.globalDmgMult;
	}
}

class RotationEvent {
	constructor(time, name, type, potency, actionDamage, aaDamage, dotDamage, aaTick, dotTick, cumulDamage, dps, timedEffect) {
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

function initGroupEffects(groupEffectsDom, effectsToActivate, effectsToEnd) {
    $(groupEffectsDom).each(function() {
        var ef = effects.find(e => e.name === $(this).attr("name"));
        var beginTime = Number($(this).attr("time"));
        var endTime = Number($(this).attr("endtime"));
        var idx = 0;
        timedEffect = {effect: ef, beginTime: beginTime, endTime: endTime};
        while (effectsToActivate[idx] !== undefined && effectsToActivate[idx].beginTime < beginTime) { idx++; }
        effectsToActivate.splice(idx, 0, timedEffect);

        var efIdx = effectsToEnd.findIndex(e => e.effect.name === ef.name);
        if (efIdx >= 0 && !ef.stackable) {
            timedEffect = effectsToEnd.splice(efIdx, 1)[0];
            timedEffect.endTime = endTime;
        }
        idx = 0;
        while (effectsToEnd[idx] !== undefined && effectsToEnd[idx].endTime < endTime) { idx++; }
        effectsToEnd.splice(idx, 0, timedEffect);
    });
}

function generateHistory(rotationDom, rotationHistory, stats, groupEffectsDom) {
	var activeEffects = [];
	stats.activeEffects = activeEffects;
	var curAction = rotationDom.first();
	var nextAction = curAction;
	var time = Number(curAction.attr("time"));
	var lastTime = time;
	var cumulDamage = 0;
	var effectsToActivate = [];
	var effectsToEnd = [];
    
    initGroupEffects(groupEffectsDom, effectsToActivate, effectsToEnd);

	var eType = "action"; // TODO : init if raid buff if 1st

	while (eType !== "done") {
		var eName = "";
		var ePot = 0;
		var eDmg = 0;
        var eAaTick = stats.aaDamage();
        var eDotTick = stats.CTDamage;
		var eAaDmg = ((time >= 0 ? time : 0) - (lastTime >= 0 ? lastTime : 0)) / stats.wDelay * eAaTick;
		var eDotDmg = ((time >= 0 ? time : 0) - (lastTime >= 0 ? lastTime : 0)) / 3 * eDotTick;
		var timedEffect;
		switch (eType) {
			case "action":
				curAction = nextAction;
				nextAction = nextAction.next();
				eName = curAction.attr("name");
				ePot = getPotency(eName);

				// Potency modifiers
				switch(eName) {
	            	case "Jump":
	            	case "Spineshatter Dive":
	            		var BotDEffect = activeEffects.find(ef => ef.name === "Blood of the Dragon") || activeEffects.find(ef => ef.name === "Life of the Dragon");
	            		if (BotDEffect)
	            			ePot *= BotDEffect.value;
	            		break;
	            	case "Fang and Claw":
	            		var FCEffect = activeEffects.find(ef => ef.name === "Sharper Fang and Claw");
	            		if (FCEffect) {
	            			ePot += FCEffect.value;
	            		} else {
	            			ePot = 0;
	            			// TODO : throw exception
	            		}
	            		break;
	            	case "Wheeling Thrust":
	            		var WTEffect = activeEffects.find(ef => ef.name === "Enhanced Wheeling Thrust");
	            		if (WTEffect) {
	            			ePot += WTEffect.value;
	            		} else {
	            			ePot = 0;
	            			// TODO : throw exception
	            		}
	            		break;
            		default:
            			break;
	            }

	            // Action damage
                if (getType(eName) === "Weaponskill" && activeEffects.findIndex(ef => ef.name === "Life Surge") >= 0) {
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
                    if (eName === "Fang and Claw" && ef.name === "Enhanced Wheeling Thrust") {
                    	var FCEffect = activeEffects.find(ef => ef.name === "Sharper Fang and Claw");
                    	if (FCEffect && FCEffect.value)
                        	return;
                        else
                        	ef.value = 100;
                    } else if (eName === "Wheeling Thrust" && ef.name === "Sharper Fang and Claw") {
                    	var WTEffect = activeEffects.find(ef => ef.name === "Enhanced Wheeling Thrust");
                    	if (WTEffect && WTEffect.value)
                        	return;
                        else
                        	ef.value = 100;
                    }

                    // Re-use BotD
                    if (ef.name === "Blood of the Dragon") {
	            		var BotDIdx = effectsToEnd.findIndex(ef => ef.effect.name === "Blood of the Dragon");
	            		if (BotDIdx >= 0) {
	            			if (!effectsToEnd[BotDIdx].effect.life) {
		            			var BotDEffect = effectsToEnd.splice(BotDIdx, 1)[0];
		            			BotDEffect.endTime = Math.max(BotDEffect.endTime, time + 20);
				                var idx = 0;
				                while (effectsToEnd[idx] !== undefined && effectsToEnd[idx].endTime < BotDEffect.endTime) { idx++; }
				                effectsToEnd.splice(idx, 0, BotDEffect);
				            }
				            return;
	            		}
                    }

	                var activationTime = ef.activationTime === undefined ? 0 : ef.activationTime;
	                var beginTime = Number((time + activationTime).toFixed(3));
	                var endTime = Number((beginTime + ef.duration).toFixed(3));
	                var idx = 0;
	                timedEffect = {effect: ef, beginTime: beginTime, endTime: endTime, displaySelf: true};
	                while (effectsToActivate[idx] !== undefined && effectsToActivate[idx].beginTime < beginTime) { idx++; }
	                effectsToActivate.splice(idx, 0, timedEffect);

	                var oldTimedEffect = effectsToEnd.find(e => e.effect.name === ef.name);
            		if (oldTimedEffect !== undefined && oldTimedEffect.beginTime < timedEffect.beginTime && oldTimedEffect.endTime > timedEffect.beginTime && !ef.stackable) {
                        effectsToEnd.splice(effectsToEnd.indexOf(oldTimedEffect), 1);
            			oldTimedEffect.endTime = timedEffect.beginTime;
                        idx = 0;
                        while (effectsToEnd[idx] !== undefined && effectsToEnd[idx].endTime < oldTimedEffect.endTime) { idx++; }
                        effectsToEnd.splice(idx, 0, oldTimedEffect);
            		}
	                idx = 0;
	                while (effectsToEnd[idx] !== undefined && effectsToEnd[idx].endTime < endTime) { idx++; }
	                effectsToEnd.splice(idx, 0, timedEffect);
                    
                    // Compute CT DoT damage
                    if (ef.name === "Chaos Thrust") {
                        timedEffect.dotDamage = stats.dotDamage(ef.value);
                    }
	            });
                
                // Consuming effects
	            switch(eName) {
	            	case "Mirage Dive":
	            		var MDEffect = effectsToEnd.splice(effectsToEnd.findIndex(ef => ef.effect.name === "Dive Ready"), 1)[0];
	            		if (MDEffect) {
		            		MDEffect.endTime = time;
		            		effectsToEnd.unshift(MDEffect);
		            	}
	            		break;
	            	case "Fang and Claw":
	            		var FCEffect = effectsToEnd.splice(effectsToEnd.findIndex(ef => ef.effect.name === "Sharper Fang and Claw"), 1)[0];
	            		if (FCEffect) {
		            		FCEffect.endTime = time;
		            		effectsToEnd.unshift(FCEffect);
		            	}
	            		break;
	            	case "Wheeling Thrust":
	            		var WTEffect = effectsToEnd.splice(effectsToEnd.findIndex(ef => ef.effect.name === "Enhanced Wheeling Thrust"), 1)[0];
	            		if (WTEffect) {
		            		WTEffect.endTime = time;
		            		effectsToEnd.unshift(WTEffect);
		            	}
	            		break;
            		default:
            			break;
	            }

				// BotD interactions
				switch(eName) {
	            	case "Fang and Claw":
	            	case "Wheeling Thrust":
	            	case "Sonic Thrust":
	            		var BotDIdx = effectsToEnd.findIndex(ef => ef.effect.name === "Blood of the Dragon");
	            		if (BotDIdx >= 0 && !effectsToEnd[BotDIdx].effect.life) {
	            			var BotDEffect = effectsToEnd.splice(BotDIdx, 1)[0];
	            			BotDEffect.endTime = Math.min(BotDEffect.endTime + 10, time + 30);
			                var idx = 0;
			                while (effectsToEnd[idx] !== undefined && effectsToEnd[idx].endTime < BotDEffect.endTime) { idx++; }
			                effectsToEnd.splice(idx, 0, BotDEffect);
	            		}
	            		break;
	            	case "Mirage Dive":
	            		var BotDEffect = effectsToEnd.find(ef => ef.effect.name === "Blood of the Dragon");
	            		if (BotDEffect)
	            			BotDEffect.effect.eyes = Math.min(BotDEffect.effect.eyes + 1, 3);
	            		break;
	            	case "Geirskogul":
	            		var BotDEffect = effectsToEnd.find(ef => ef.effect.name === "Blood of the Dragon");
	            		if (BotDEffect && BotDEffect.effect.eyes === 3) {
	            			BotDEffect.effect.eyes = 0;
	            			BotDEffect.effect.life = true;
	            			if (BotDEffect.endTime < time + 20) {
	            				effectsToEnd.splice(effectsToEnd.indexOf(BotDEffect), 1);
		            			BotDEffect.endTime = Math.max(BotDEffect.endTime, time + 20);
				                var idx = 0;
				                while (effectsToEnd[idx] !== undefined && effectsToEnd[idx].endTime < BotDEffect.endTime) { idx++; }
				                effectsToEnd.splice(idx, 0, BotDEffect);
	            			}
	            		}
	            		break;
            		default:
            			break;
	            }
	            break;
            case "effectBegin":
            	timedEffect = effectsToActivate.shift();

            	// Check if not already active
            	if (activeEffects.findIndex(ef => ef.name === timedEffect.effect.name) < 0 || timedEffect.effect.stackable)
                    activeEffects.push(timedEffect.effect);
            	stats.updateEffects(timedEffect);
            	eName = timedEffect.effect.name;
            	break;
            case "effectEnd":
            	timedEffect = effectsToEnd.shift();
            	activeEffects.splice(activeEffects.indexOf(timedEffect.effect), 1);
            	stats.updateEffects(timedEffect);
            	eName = timedEffect.effect.name;
            	timedEffect.endTime = time;
            	switch(eName) {
	            	case "Enhanced Wheeling Thrust":
	            	case "Sharper Fang and Claw":
	            		timedEffect.effect.value = 0;
	            		break;
	            	case "Blood of the Dragon":
	            		if (timedEffect.effect.life) {
	            			timedEffect.effect.life = false;
	            			timedEffect.endTime = time + 20;
			                var idx = 0;
			                while (effectsToEnd[idx] !== undefined && effectsToEnd[idx].endTime < timedEffect.endTime) { idx++; }
			                effectsToEnd.splice(idx, 0, timedEffect);
			            	activeEffects.push(timedEffect.effect);
			            	stats.updateEffects(timedEffect);
	            		} else {
	            			timedEffect.effect.eyes = 0;
	            		}
	            		break;
            		default:
            			break;
            	}
            	break;
            default:
		}

		cumulDamage += eDmg + eAaDmg + eDotDmg;
		var eDps = time <= 0 ? 0 : cumulDamage / time;
		rotationHistory.push(new RotationEvent(time, eName, eType, ePot, eDmg, eAaDmg, eDotDmg, eAaTick, eDotTick, cumulDamage, eDps, timedEffect));

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
	return Number(recast);
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

function getEffectDuration(actionName) {
    var duration = 0;
    var effect = effects.find(ac => actionName === ac.name);
    if (effect.hasOwnProperty("duration"))
        duration = effect.duration;
    return Number(duration);
}