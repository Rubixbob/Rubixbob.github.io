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
	constructor(time, name, type, potency, damage, dps) {
		this.time = time;
		this.name = name;
		this.type = type;
		this.potency = potency;
		this.damage = damage;
		this.dps = dps;
	}

	display() {
		console.log(this.time + " " + this.name + " " + this.type + " " + this.potency + " " + this.damage + " " + this.dps);
	}
}

function generateHistory(rotationDom) {
	var RotationHistory = [];
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
		RotationHistory.push(new RotationEvent(eTime, eName, eType, ePot, eDmg, eDps));
	});
	RotationHistory.forEach(e => {e.display();});
	return RotationHistory;
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