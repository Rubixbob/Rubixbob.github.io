class Stats {
	constructor(wd, str, dh, crit, det, sks) {
		this.wd = wd;
		this.wDelay = 2.88;
		this.str = str;
		this.dh = dh;
		this.crit = crit;
		this.det = det;
		this.sks = sks;
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
		return Math.floor((this.dh - 364) * 550 / 2170) / 1000;
	}

	dhDamage() {
		return 1.25;
	}

	dhMod(dhRateBonus) {
		return 1 + (this.dhRate() + dhRateBonus) * (this.dhDamage() - 1);
	}

	critRate() {
		return 0.05 + Math.floor((this.crit - 364) * 200 / 2170) / 1000;
	}

	critDamage() {
		return 1.40 + Math.floor((this.crit - 364) * 200 / 2170) / 1000;
	}

	critMod(critRateBonus) {
		return 1 + (this.critRate() + critRateBonus) * (this.critDamage() - 1);
	}

	detMod() {
		return 1 + Math.floor((this.det - 292) * 130 / 2170) / 1000;
	}

	sksMod() {
		return 1 + Math.floor((this.sks - 364) * 130 / 2170) / 1000;
	}

	actionDamage(potency) {
		return potency / 100 * this.wdMod() * this.strMod() * this.detMod() * this.dhMod(0) * this.critMod(0);
	}
}

class RotationEvent {
	constructor(time, name, type, potency, damage, cumulDamage, dps) {
		this.time = time;
		this.name = name;
		this.type = type;
		this.potency = potency;
		this.damage = damage;
		this.cumulDamage = cumulDamage;
		this.dps = dps;
	}

	display() {
		console.log(this.time + " " + this.name + " " + this.type + " " + this.potency + " " + this.damage + " " + this.dps);
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
	console.log("Deleting " + (rotationHistory.length - idx) + " actions");
	rotationHistory.splice(idx);
}

function playUntil(rotationDom, rotationHistory, endTime) {
	// For logs
	var actionsNb = rotationHistory.length;
	
	var stats = new Stats(109, 3207, 1611, 2557, 1796, 655);
	var time = rotationDom.first().attr("time") - 1;
	var cumulDamage = 0;
	if (rotationHistory.length > 0) {
		time = rotationHistory[rotationHistory.length - 1].time;
		cumulDamage = rotationHistory[rotationHistory.length - 1].cumulDamage;
	}
	var actionsToPlay = rotationDom.filter(function(index) {return Number($(this).attr("time")) > time;});
	var curAction = actionsToPlay.first();
	time = Number(curAction.attr("time"));
	while (time <= endTime) {
		// console.log ("time: " + time + ", endTime: " + endTime);
		var eName = curAction.attr("name");
		var eType = "action";
		var ePot = getPotency(eName);
		var eDmg = stats.actionDamage(ePot);
		cumulDamage += eDmg;
		var eDps = time <= 0 ? 0 : cumulDamage / time;
		rotationHistory.push(new RotationEvent(time, eName, eType, ePot, eDmg, cumulDamage, eDps));
		curAction = curAction.next();
		time = Number(curAction.attr("time"));
	}
	
	console.log("Added " + (rotationHistory.length - actionsNb) + " actions, from " + actionsNb + " to " + rotationHistory.length);
}

function generateHistory(rotationDom, rotationHistory) {
	var stats = new Stats(109, 3207, 1611, 2557, 1796, 655);
	var cumulDamage = 0;
	rotationDom.each(function(index) {
		var eTime = $(this).attr("time");
		var eName = $(this).attr("name");
		var eType = "action";
		var ePot = getPotency(eName);
		var eDmg = stats.actionDamage(ePot);
		cumulDamage += eDmg;
		var eDps = eTime == 0 ? 0 : cumulDamage / eTime;
		rotationHistory.push(new RotationEvent(eTime, eName, eType, ePot, eDmg, cumulDamage, eDps));
	});
	// rotationHistory.forEach(e => {e.display();});
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
	var recast = Number($("#GCD").val());
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