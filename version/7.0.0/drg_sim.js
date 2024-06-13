var raidBuffLightboxJobIndex = 0; // Will have to be passed as a parameter maybe
var raidBuffLightboxEditMode = false;
var raidBuffLightboxEditElement;
// var standardComp = ["nin", "brd", "smn", "sch", "ast", "war", "pld"];
// var standardComp = ["nin", "war", "war", "war", "war", "war", "war"];
var standardComp = ["nin", "brd", "smn", "sch", "whm", "war", "pld"];
var startTime = 0;
var RotationHistory = [];
var savedRotation;
var stats = new Stats(0, 0, 0, 0, 0, 0, []);
var gcdTimeline = [];

actions.forEach(function (ac) {
    var action = $("<div></div>").attr({name: ac.name, class: `action draggable ${ac.type}`});
	if (ac.hasOwnProperty("delayed"))
		action.attr("delayed", ac.delayed);
    if (ac.hasOwnProperty("id"))
        action.attr("id", ac.id);
    action.append($("<div></div>").attr("class", "actionImage").css("background-image", `url("../../images/${ac.name}.png")`));
    $(`#${ac.group}`).append(action);
});

function fitColumns() {
    $("#columns").children().each(function(index) {$(this).css("width", $("#headers").children().eq(index).width() + "px");});
    var timelineWidth = `${$("#columns").get(0).getBoundingClientRect().width-$("#dps").get(0).getBoundingClientRect().width}px`;
    $("#timeline").children().children().css("width", timelineWidth);
    $("#groupEffects").children().each(function(index) { $(this).css("left", $("#groupEffectsHeader").children(`[name="${effects.find(ef => $(this).attr("name") === ef.name).groupAction}"][jobIndex="${$(this).attr("jobIndex")}"]`).position().left + "px"); });
    $("#scrollableDiv").css("height", `${$("#mainDiv").get(0).getBoundingClientRect().height+$("#mainDiv").get(0).getBoundingClientRect().top-$("#scrollableDiv").get(0).getBoundingClientRect().top}px`);
    $("#effects").children().each(function(index) {
        var hide = !$("#effectsHeader").children(`[name="${$(this).attr("name")}"]`).children("input").prop("checked");
        var posLeft = $("#effectsHeader").children(`[name="${$(this).attr("name")}"]`).position().left + 1;
        var posWidth = $("#effectsHeader").children(`[name="${$(this).attr("name")}"]`).width() - 8;
        $(this).css({"left": `${posLeft}px`, "width": `${posWidth}px`});
        $(this).prop("hidden", hide);
    });
    
    var totalWidth = parseInt($("#leftDiv").css("width")) + parseInt($("#leftDiv").css("padding") || $("#leftDiv").css("paddingLeft")) * 2 + $("#midDiv").get(0).getBoundingClientRect().width + parseInt($("#rightDiv").css("width")) + parseInt($("#rightDiv").css("padding") || $("#rightDiv").css("paddingLeft")) * 2;
    if ($("#mainDiv").get(0).getBoundingClientRect().width < totalWidth) {
        // Collapse
        $("#leftDiv").css("display", "none");
        $("#rightDiv").css("display", "none");
        $("#leftExpand").css({"display": "inline-block"});
        $("#rightExpand").css({"display": "inline-block"});
        if ($("#leftExpand").attr("expanded") === "true")
            $("#leftDiv").css({"display": "", "position": "absolute", "top": "0px", "left": `${$("#midDiv").get(0).getBoundingClientRect().left}px`, "z-index": "2"});
        else
            $("#leftDiv").css({"display": "none", "position": "", "top": "", "left": "", "z-index": ""});
    
        if ($("#rightExpand").attr("expanded") === "true")
            $("#rightDiv").css({"display": "", "position": "absolute", "top": "0px", "right": `${$("#midDiv").get(0).getBoundingClientRect().left}px`, "z-index": "2"});
        else
            $("#rightDiv").css({"display": "none", "position": "", "top": "", "right": "", "z-index": ""});
    } else {
        // Expand
        $("#leftDiv").css({"display": "", "position": "", "top": "", "left": "", "z-index": ""});
        $("#rightDiv").css({"display": "", "position": "", "top": "", "right": "", "z-index": ""});
        $("#leftExpand").css("display", "");
        $("#rightExpand").css("display", "");
    }
}

var imagesToLoad = 0;
var imagesLoaded = 0;

effects.forEach(function (ef) {
    if (ef.displaySelf) {
        var wrapper = $("<div></div>").attr("name", ef.name).css("display", "inline-block");
        var checkBox = $("<input type='checkbox'/>").css({"display": "none", "margin": "auto"});
        var savedEffects = {};
        if (localStorage["effects"])
            savedEffects = JSON.parse(localStorage["effects"]);
        $(checkBox).prop("checked", savedEffects[ef.name] !== undefined ? savedEffects[ef.name] : true);
        var effect = $("<img></img>").css("cursor", "pointer").attr("src", `../../images/effects/${ef.name}.png`).prop("hidden", !$(checkBox).prop("checked")).one("load", function() {
            imagesLoaded++;
            if (imagesLoaded === imagesToLoad)
                fitColumns();
        }).each(function() {
            $(wrapper).append(this);
            $(wrapper).append(checkBox);
            $("#effectsHeader").append(wrapper);
            addTooltip(this, "effectHeader");
            imagesToLoad++;
            if (this.complete)
                $(this).trigger('load');
        }).click(function() {
            $(checkBox).prop("checked", !$(checkBox).prop("checked"));
            checkBox.change();
        });
        checkBox.change(function() {
            effect.prop("hidden", !$(checkBox).prop("checked"));
            var savedEffects = {};
            if (localStorage["effects"])
                savedEffects = JSON.parse(localStorage["effects"]);
            savedEffects[ef.name] = $(checkBox).prop("checked");
            localStorage["effects"] = JSON.stringify(savedEffects);
            fitColumns();
        });
    }
});


    var dndHandler = {
        draggedElement: null,
        // clone: null,

        applyActionsEvents: function(element, type) {
            element.draggable = true;

            var dndHandler = this;
            
            addTooltip(element, type);

            element.addEventListener('dragstart', function(e) {
                var target = e.target;
                while ($(target.parentNode).hasClass('draggable')) {
                    target = target.parentNode;
                }
                $(target).children(".suggestionsOverlay, .suggestionsOverlayText").remove();
                dndHandler.draggedElement = target.cloneNode(true);
                dndHandler.applyRotationEvents(dndHandler.draggedElement);
                e.dataTransfer.setData('text/plain', '');
            });

            element.addEventListener('click', function(e) {
                var target = e.target;
                while ($(target.parentNode).hasClass('draggable')) {
                    target = target.parentNode;
                }
                $(target).children(".suggestionsOverlay, .suggestionsOverlayText").remove();
                var clonedElement = target.cloneNode(true);
                dndHandler.applyRotationEvents(clonedElement);
                addActionAtIndex(clonedElement, $("#rotation").children().length);

                autoFillRaidBuffs(false);
                resetAndUpdateDps();
                // playUntil($("#rotation").children(), RotationHistory, Number($(clonedElement).attr("time")));
                // var lastEvent = RotationHistory[RotationHistory.length - 1];
                // displayDps(Math.floor(lastEvent.dps), lastEvent.time);
                // getEffects(lastEvent.name).forEach(ef => {
                //     var activationTime = ef.activationTime === undefined ? 0 : ef.activationTime;
                //     var beginTime = Number(lastEvent.time) + Number(activationTime);
                //     drawEffect(ef.name, beginTime, beginTime + Number(ef.duration));
                //     // TODO : Add time until end of last effect
                // });

                var scrollValue = parseInt($("#rotation").children().last().css("top"), 10) - 400;
                $("#scrollableDiv").animate({scrollTop:scrollValue}, 50, "linear");
            });
        },

        applyDropEvents: function(dropper) {
            var dndHandler = this;

            dropper.addEventListener('dragover', function(e) {
                e.preventDefault();
                var target = e.target;
                while (target.className.indexOf('dropper') === -1) {
                    target = target.parentNode;
                }

                // Move action to spot below pointer
                var curIdx = $("#rotation").children().index(dndHandler.draggedElement);
                if (curIdx === -1) {
                    // console.log(dndHandler.draggedElement);
                    curIdx = $("#rotation").children().length;
					addActionAtIndex(dndHandler.draggedElement, curIdx);
                    resetDps();
				}
                var startTime = Number($("#timeline").children().first().attr("time"));
                var time = (e.clientY-target.getBoundingClientRect().top) / scale + startTime;
                var idx = $("#rotation").children().filter(function(index) {
                    return Number($(this).attr("time")) + getAnimationLock($(this).attr("name")) / 2 <= time && index !== curIdx;
                }).length;
                if (idx !== curIdx) {
                    resetDps();
                    if (idx > curIdx) {
                        for (var i = curIdx; i < idx; i++) {
                            addActionAtIndex($("#rotation").children().get(i+1), i);
                        }
                        addActionAtIndex(dndHandler.draggedElement, idx);
                        updateRotationAfterIndex(idx + 1);
                    } else if (idx < curIdx) {
                        addActionAtIndex(dndHandler.draggedElement, idx);
                        updateRotationAfterIndex(idx + 1);
                    }
                }

                // Snap to previous or next action
                if (!$(dndHandler.draggedElement).hasClass("Weaponskill") && idx !== 0 && idx !== $("#rotation").children().length) {
                    var prevGcd = $("#rotation").children().filter(function(index) {return index < idx && $(this).hasClass("Weaponskill");}).last();
                    var prevOgcds = $("#rotation").children().filter(function(index) {return index < idx && index > $("#rotation").children().index(prevGcd);});

                    var prevAc = $(dndHandler.draggedElement).prev();
                    var minTime = Number(prevAc.attr("time")) + getAnimationLock(prevAc.attr("name"));
                    if (prevGcd.length > 0)
                        minTime = Number(prevGcd.attr("time")) + getAnimationLock(prevGcd.attr("name"));
                    prevOgcds.each(function(index) {minTime += getAnimationLock($(this).attr("name"));});
                    var nextAc = $(dndHandler.draggedElement).next();
                    var maxTime = Number(nextAc.attr("time"));
                    var midTime = (minTime + maxTime) / 2;
                    var delayed = $(dndHandler.draggedElement).attr("delayed");
                    if (time <= midTime && delayed !== "false")
                        $(dndHandler.draggedElement).attr("delayed", "false");
                    else if (time > midTime && delayed !== "true")
                        $(dndHandler.draggedElement).attr("delayed", "true");

                    if ($(dndHandler.draggedElement).attr("delayed") !== delayed) {
                        resetDps();
                        var prevTime = $(dndHandler.draggedElement).attr("time");
                        addActionAtIndex(dndHandler.draggedElement, idx);
                        if (prevTime !== $(dndHandler.draggedElement).attr("time"))
                            updateRotationAfterIndex(idx + 1);
                    }
                }

                if (RotationHistory.length === 0) {
                    autoFillRaidBuffs(false);
                    updateDps();
                }
				// $("#rotation").children().filter(function(index) {
				// 	return index > idx && $(this).attr("name") === $(dndHandler.draggedElement).attr("name");
				// }).each(function(index) {
				// 	addActionAtIndex(this, $("#rotation").children().index(this));
				// });
            });

            dropper.addEventListener('dragleave', function dragleaveAction(e) {
                if (!$("#rotation").get(0).contains(e.relatedTarget)) {
					if ($(e.relatedTarget).css("height") === "1px" && $(e.relatedTarget).css("z-index") === "1") {
						$(e.relatedTarget).one('dragleave', dragleaveAction);
					} else {
						var tempClone = dndHandler.draggedElement.cloneNode(true);
						tempClone.removeAttribute("time");
						dndHandler.applyRotationEvents(tempClone);
						removeAction(dndHandler.draggedElement);
						dndHandler.draggedElement = tempClone;
					}
                }
            });
        },

        applyRotationEvents: function(element) {
            element.draggable = true;

            var dndHandler = this;
            
            addTooltip(element, "rotation");

            element.addEventListener('dragstart', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') !== -1) {
                    target = target.parentNode;
                }
                dndHandler.draggedElement = target;
                e.dataTransfer.setData('text/plain', '');
            });

            element.addEventListener('click', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') !== -1) {
                    target = target.parentNode;
                }
                removeAction(target);
            });
        }
    };

    $(".draggable").each(function(index) { dndHandler.applyActionsEvents(this, "action"); });
    $(".dropper").each(function(index) { dndHandler.applyDropEvents(this); });
	
function addTooltip(element, type) {
    $(element).mouseover(function(e) {
        var content = getTooltipContent(element, type);
        if (type !== "savedRotations" && type !== "iconButton") {
            $(document.body).append($("<div></div>").attr("class", "tooltip").html(content));
            var posTop = $("#midDiv").get(0).getBoundingClientRect().top + $("#midDiv").get(0).getBoundingClientRect().height - $(".tooltip").get(0).getBoundingClientRect().height;
            posTop = Math.max(Math.min(e.pageY + 10, posTop), $("#midDiv").get(0).getBoundingClientRect().top);
            $(".tooltip").css({"top": `${posTop}px`, "left": `${e.pageX + 10}px`});
        } else {
            $("#savedRotationsLightbox .content").append($("<div></div>").attr("class", "tooltip").html(content));
            var rect = $("#savedRotationsLightbox").get(0).getBoundingClientRect();
            $(".tooltip").css({"top": `${e.pageY-rect.top}px`, "left": `${e.pageX-rect.left + 10}px`});
        }
    }).mousemove(function(e) {
        if ($(".tooltip").length && type !== "savedRotations" && type !== "iconButton") {
            var posTop = $("#midDiv").get(0).getBoundingClientRect().top + $("#midDiv").get(0).getBoundingClientRect().height - $(".tooltip").get(0).getBoundingClientRect().height;
            posTop = Math.max(Math.min(e.pageY + 10, posTop), $("#midDiv").get(0).getBoundingClientRect().top);
            $(".tooltip").css({"top": `${posTop}px`, "left": `${e.pageX + 10}px`});
        } else {
            var rect = $("#savedRotationsLightbox").get(0).getBoundingClientRect();
            $(".tooltip").css({"top": `${e.pageY-rect.top}px`, "left": `${e.pageX-rect.left + 10}px`});
        }
    }).mouseout(function(e) {
        $(".tooltip").remove();
    }).click(function(e) {
        $(".tooltip").remove();
    }).on("dragstart", function(e) {
        $(".tooltip").remove();
    });
}
	
function addGroupEffectTooltip(element) {
    var tooltipTimer;
    var tooltip;
    $(element).mouseover(function(e) {
        clearTimeout(tooltipTimer);
        if (tooltip)
            return;
        $(".tooltip").remove();
        var content = getTooltipContent(element, "groupEffect");
        tooltip = $("<div></div>").attr("class", "tooltip").css({"min-width": "150px", "max-width": "250px", "top": "0px", "left": "0px"}).html(content);
        
        var buttonLine = $("<div></div>").css({"display": "flex", "justify-content": "flex-end"});
        
        var deleteButton = $("<button class='ui icon button'><i class='icon trash alternate'></i></button>").css({"padding": "4px"});
        $(deleteButton).click(function() {
            $(".tooltip").remove();
            deleteGroupEffect(element);
        });
        buttonLine.append(deleteButton);
        
        var editButton = $("<button class='ui icon button'><i class='icon cog'></i></button>").css({"padding": "4px", "margin-right": "0px"});
        $(editButton).click(function() {
            $(".tooltip").remove();
            raidBuffLightboxEditMode = true;
            raidBuffLightboxEditElement = element;
            setUpRaidBuffLightbox($(element).attr("name"), Number($(element).attr("jobIndex")), element);
            $("#raidBuffLightbox").modal("show");
        });
        buttonLine.append(editButton);
        
        tooltip.append(buttonLine);
        
        $(document.body).append(tooltip);
        
        var posTop = $("#midDiv").get(0).getBoundingClientRect().top + $("#midDiv").get(0).getBoundingClientRect().height - $(".tooltip").get(0).getBoundingClientRect().height;
        posTop = Math.max(Math.min(e.pageY - 10, posTop), $("#midDiv").get(0).getBoundingClientRect().top);
        tooltip.css({"top": `${posTop}px`, "left": `${element.getBoundingClientRect().right}px`});
        
        $(tooltip).mouseover(function(e) {
            clearTimeout(tooltipTimer);
        }).mousemove(function(e) {
            clearTimeout(tooltipTimer);
        }).mouseout(function(e) {
            tooltipTimer = setTimeout(function() { $(tooltip).remove(); tooltip = null; }, 200);
        });
    }).mouseout(function(e) {
        tooltipTimer = setTimeout(function() { $(tooltip).remove(); tooltip = null; }, 200);
    });
    
}
	
function getTooltipContent(element, type) {
    var content;
    switch (type) {
        case "rotation":
            var name = $(element).attr("name");
            var time = $(element).attr("time");
            var damage = $(element).attr("damage");
            if (Number(damage) > 0)
                content = name + "<br/>" + "Damage: " + damage + "<br/>" + time + "s";
            else
                content = name + "<br/>" + time + "s";
            break;
        case "cd":
            var name = $(element).attr("name");
            var time = $(element).attr("time");
            content = name + "<br/>" + time + "s";
            break;
        case "effect":
            var name = $(element).attr("name");
            var time = $(element).attr("time");
            var endTime = $(element).attr("endTime");
            content = name + "<br/>" + "From " + time + "s" + "<br/>" + "To " + endTime + "s";
            break;
        case "groupEffect":
            var name = $(element).attr("name");
            var time = $(element).attr("time");
            var endTime = $(element).children("div").attr("endTime");
            var desc = getEffectDescription(name);
            content = name + "<br/>" + "From " + time + "s" + "<br/>" + "To " + endTime + "s" + "<br/>" + desc;
            break;
        case "effectHeader":
            var name = $(element.parentNode).attr("name");
            var desc = getEffectDescription(name);
            content = name + "<br/>" + desc + "<br/>" + "<br/>" + "Click to Hide/Unhide";
            break;
        case "groupEffectHeader":
            var name = $(element).attr("name");
            var job = getGroupJob(name);
            var recast = getGroupDisplayRecastTime(name);
            var desc = getGroupDescription(name);
            content = name + "<br/>" + job.toUpperCase() + "<br/>" + "Recast: " + recast + "s" + "<br/>" + desc;
            break;
        case "checkboxButton":
            if ($(element).attr("id") === "raidBuffAuto")
                content = "(Recommended) Automatically adds all raid buffs";
            else {
                var job = $("#group .ui-selectmenu-text").get($(".checkboxButton:not(#raidBuffAuto)").index(element)).textContent;
                content = "(Recommended) Automatically adds raid buffs for this job (" + job + ")";
            }
            break;
        case "clearGroupButton":
            if ($(element).attr("id") === "raidBuffClear")
                content = "Clears all raid buffs";
            else {
                var job = $("#group .ui-selectmenu-text").get($(".clearGroupButton:not(#raidBuffClear)").index(element)).textContent;
                content = "Clears all raid buffs of this job (" + job + ")";
            }
            break;
        case "suggestion":
            var name = $(element).attr("name");
            content = name;
            break;
        case "wd":
            var dmgMult = $("#WDout").val();
            var aaDmgMult = $("#WDoutAa").val();
            content = "Damage multiplier: " + dmgMult + "<br/>" + "Auto attack damage multiplier: " + aaDmgMult;
            break;
        case "str":
            var dmgMult = $("#STRout").val();
            content = "Damage multiplier: " + dmgMult;
            break;
        case "dh":
            var dhChance = $("#DHoutRate").val();
            var dmgMult = $("#DHout").val();
            content = "Direct hit chance: " + dhChance + "<br/>" + "Average damage multiplier: " + dmgMult;
            break;
        case "crit":
            var critChance = $("#CRIToutRate").val();
            var critDmg = $("#CRIToutDmg").val();
            var dmgMult = $("#CRITout").val();
            content = "Critical hit chance: " + critChance + "<br/>" + "Critical hit damage: " + critDmg + "<br/>" + "Average damage multiplier: " + dmgMult;
            break;
        case "det":
            var dmgMult = $("#DETout").val();
            content = "Damage multiplier: " + dmgMult;
            break;
        case "sks":
            var sksGcd = $("#SKSoutGCD").val();
            var dmgMult = $("#SKSout").val();
            content = "GCD: " + sksGcd + "<br/>" + "Damage multiplier: " + dmgMult + " (only affects auto attacks and DoTs)";
            break;
        case "latency":
            var lat = $("#Latency").val();
            content = "Time added to animation lock: " + lat + "ms" + "<br/>" + "Adjust this value to reflect your in-game animation lock";
            break;
        case "dps":
            var gcdDps = Number($("#DPSout").attr("gcdDps")) || 0;
            var oGcdDps = Number($("#DPSout").attr("oGcdDps")) || 0;
            var dotDps = Number($("#DPSout").attr("dotDps")) || 0;
            var aaDps = Number($("#DPSout").attr("aaDps")) || 0;
            var dps = Number($("#DPSout").val()) || 1;
            // content = "Weaponskills: " + gcdDps.toFixed(0) + " " + (gcdDps / dps * 100).toFixed(2) + "%" + "<br/>"
                    // + "Abilities: " + oGcdDps.toFixed(0) + " " + (oGcdDps / dps * 100).toFixed(2) + "%" + "<br/>"
                    // + "DoTs: " + dotDps.toFixed(0) + " " + (dotDps / dps * 100).toFixed(2) + "%" + "<br/>"
                    // + "Auto attacks: " + aaDps.toFixed(0) + " " + (aaDps / dps * 100).toFixed(2) + "%";
            content = "<table><tr><td>Weaponskills</td><td>" + gcdDps.toFixed(0)  + "</td><td>" + (gcdDps / dps * 100).toFixed(2)  + "%</td></tr>"
                           + "<tr><td>Abilities</td><td>"    + oGcdDps.toFixed(0) + "</td><td>" + (oGcdDps / dps * 100).toFixed(2) + "%</td></tr>"
                           + "<tr><td>DoTs</td><td>"         + dotDps.toFixed(0)  + "</td><td>" + (dotDps / dps * 100).toFixed(2)  + "%</td></tr>"
                           + "<tr><td>Auto attacks</td><td>" + aaDps.toFixed(0)   + "</td><td>" + (aaDps / dps * 100).toFixed(2)   + "%</td></tr></table>";
            break;
        case "savedRotations":
            content = "Rotations are saved locally in the cache of your browser, and data might be lost when clearing the cache.<br/>The share functionality can be used to save them in the database.";
            break;
        case "iconButton":
            switch ($(element).children(i).get(0).classList[1]) {
                case "folder":
                    content = "Open";
                    break;
                case "trash":
                    content = "Delete";
                    break;
                case "share":
                    content = "Share";
                    break;
                case "save":
                    content = "Save";
                    break;
                default:
                    break;
            }
            break;
        case "action":
            var name = $(element).attr("name");
            var acType = getType(name);
            var recast = getRecastTime(name);
            var desc = getDescription(name);
            content = name + "<br/>" + acType + "<br/>" + "Recast: " + recast + "s" + "<br/>" + desc;
            break;
        default:
            content = "Not implemented";
            break;
    }
    return content;
}

function addActionAtIndex(element, idx, checkDelay = true) {
    var rotation = $("#rotation").children();
    var eltName = element.getAttribute("name");
    var eltTime = Number(element.getAttribute("time"));
    var isWeaponskill = $(element).hasClass("Weaponskill");
    var isAbility = $(element).hasClass("Ability");

	// Saves associated next possible usage
	var nextUsage;
	if (isAbility && rotation.index(element) >= 0) {
        nextUsage = $("#cds").children(`[abilityTime="${eltTime.toFixed(3)}"]`).first();
    }
    
    // Re-adjusts previous delayed abilities
    var ogcdsToDelay = null,
        delayList = [];
    var previousGcds = rotation.filter(function(index) {return index < idx && $(this).hasClass("Weaponskill");});
	var nextGcd = rotation.filter(function(index) {return index > idx && $(this).hasClass("Weaponskill");}).first();
    if (previousGcds.length > 0 && checkDelay && (nextGcd.length > 0 || isWeaponskill)) {
        lastGcdIdx = rotation.index(previousGcds.last());
        ogcdsToDelay = rotation.filter(function(index) {return index < idx && index > lastGcdIdx;});
        ogcdsToDelay.each(function(index) {
            var ret = $(this).attr("delayed");
            $(this).attr("delayed", "false");
            if (ret !== undefined) {
                delayList.push(ret);
            } else {
                delayList.push("false");
            }
        }).toArray();
        ogcdsToDelay.each(function(index) {addActionAtIndex(this, lastGcdIdx + (index + 1), false);});
    }

    var time = startTime;
    if (idx > 0) {
        // GCD
		if (isWeaponskill) {
			var timeGcd = startTime;
			if (previousGcds.length > 0) {
                var previousGcdTime = Number(previousGcds.last().attr("time"));
                var gcdValue = gcdAt(previousGcdTime);
				timeGcd = (previousGcdTime * 100 + gcdValue * 100) / 100;
            }
			time = Math.max(time, timeGcd);
		}
		// CD recast
		else if (isAbility) {
			var timeCd = startTime;
            var maxCharges = getCharges(eltName);
            var cdRefreshes = rotation.filter(function(index) {return index < idx && this.getAttribute("name") === eltName;})
                                      .map(function(index) {return $("#cds").children(`[abilityTime="${this.getAttribute("time")}"]`).first();});

            if (cdRefreshes.length >= maxCharges) {
                timeCd = Number(cdRefreshes.get(-maxCharges).attr("time"));
            }
			time = Math.max(time, timeCd);
		}
        // Anim lock
        var previousAc = rotation.eq(idx - 1);
        var incr = getAnimationLock(previousAc.attr("name"));
        var animLockTime = (Number(previousAc.attr("time")) * 100 + incr * 100) / 100;
        time = Math.max(time, animLockTime);
    }

    // Delayed ability
    if ($(element).attr("delayed") === "true" && idx < rotation.length - 1 && previousGcds.length > 0) {
        var delayTime = startTime;
        if (rotation.index(element) === idx) {
            delayTime = (Number($(element).next().attr("time")) * 100 - getAnimationLock(eltName) * 100) / 100;
        } else {
            delayTime = (Number( rotation.eq(idx).attr("time")) * 100 - getAnimationLock(eltName) * 100) / 100;
        }
        time = Math.max(time, delayTime);
    }

    // Pre pull
    if (time <= 0) {
		if (getPotency(eltName) === 0) {
			if (rotation.filter(function(index) {return this.getAttribute("time") < 0;}).index(element) === -1) {
				var acAnimLock = getAnimationLock(eltName);
				setStartTime(startTime - acAnimLock);
				time -= acAnimLock;
				updateRotationBeforeIndex(idx);
			}
		} else {
			time = 0;
		}
    }
	if (time > 0 && getPotency(eltName) === 0 && eltTime < 0) {
        setStartTime(startTime + getAnimationLock(eltName));
		updateRotationBeforeIndex(idx);
	}

    // Display position
    var position = (time - startTime) * scale;
    var offset = 1;
    if (isAbility)
        offset += 30;
    var animLockHeight = scale * getAnimationLock(eltName);
    var addedElt = $(element).attr("time", `${time.toFixed(3)}`).css({"position": "absolute", "top": `${position}px`, "left": `${offset}px`, "height": `${animLockHeight}px`});

    // Adding action
    if (idx > 0)
        $("#rotation").children().eq(idx-1).after(addedElt);
    else
        $("#rotation").prepend(addedElt);
    addTimeUntil(time + 5);

    // Re-adjusts previous delayed abilities
    if (previousGcds.length > 0 && checkDelay && (nextGcd.length > 0 || isWeaponskill)) {
        ogcdsToDelay.each(function(index) {$(this).attr("delayed", delayList[index]);});
        $(ogcdsToDelay.get().reverse()).each(function(index) {addActionAtIndex(this, idx - (index + 1), false);});
    }
	
	// Adding next possible usage to Cooldowns
	if (isAbility) {
		var offCdTime = time + getRecastTime(eltName);

        var cdRefreshes = rotation.filter(function(index) {return index < idx && this.getAttribute("name") === eltName;})
                                  .map(function(index) {return $("#cds").children(`[abilityTime="${this.getAttribute("time")}"]`).first();});
        if (cdRefreshes.length > 0) {
            var lastRefresh = Number(cdRefreshes.get(-1).attr("time"));
            if (lastRefresh > time) {
                offCdTime = lastRefresh + getRecastTime(eltName);
            }
        }

		var offCdPosition = (offCdTime - startTime) * scale;
		if (nextUsage === undefined || nextUsage.length === 0) {
			nextUsage = $(element.cloneNode(true));
			dndHandler.applyActionsEvents(nextUsage.get(0), "cd");
		}
        var leftPosition = $("#cds").children().filter(function(index) {return this.getAttribute("time") === offCdTime.toFixed(3) && Number(this.getAttribute("abilityTime")) < time;}).length * 5;
		$(nextUsage).attr("time", `${offCdTime.toFixed(3)}`).attr("abilityTime", `${time.toFixed(3)}`).css({"position": "absolute", "top": `${offCdPosition}px`, "left": `${leftPosition}px`, "height": "", "z-index": "3"});
		$("#cds").append(nextUsage);
		addTimeUntil(offCdTime + 5);
	}
}

function removeAction(element) {
	// Removing associated next possible usage
    $("#cds").children(`[abilityTime="${$(element).attr("time")}"]`).remove();
	
    resetDps();

    var idx = $("#rotation").children().index(element);
    if (Number($(element).attr("time")) < 0) {
        setStartTime(startTime + getAnimationLock($(element).attr("name")));
        idx = 0;
    }
    $(element).remove();
    updateRotationAfterIndex(idx);

    if ($("#rotation").children().length > 0)
        updateDps();
    else
        updateSuggestions();
}

function updateRotationAfterIndex(idx) {
    // var doOneStep = function(timestamp) {
        // var initTime = Date.now();
        // while (Date.now() - initTime < 1000/60) {
            // var elt = $("#rotation").children().get(index);
            // if (elt) {
                // addActionAtIndex(elt, index);
                // index++;
            // } else
                // return;
        // }
        // requestAnimationFrame(doOneStep);
    // }
    // requestAnimationFrame(doOneStep);
    $("#rotation").children().filter(function(index) {return index >= idx;}).each(function(index) {
        addActionAtIndex(this, index + idx);
    });
}

function updateRotationBeforeIndex(idx) {
    $("#rotation").children().filter(function(index) {return index < idx;}).each(function(index) {
        addActionAtIndex(this, index);
    });
}

function hideTimelineOverlap(index = 0) {
    var values = [1, 2, 5, 10, 20, 30, 60, 120, 300];
    var divider = Math.min(Math.ceil(20/scale), 300);
    if (!values.includes(divider)) {
        var itr = 0;
        while (values[itr] < divider) {
            itr++;
        }
        divider = values[itr];
    }
    var firstTime = Math.ceil(Number($("#timeline").children().first().attr("time")));
    $("#timeline").children(`:gt(${index})`).each(function(idx) {
        if ((firstTime + idx + index) % divider === 0)
            this.style.visibility = "visible";
        else
            this.style.visibility = "hidden";
    });
}

function timeDiv(time, width) {
	var tDiv = $(`<div>${time}</div>`).attr("time", `${time.toFixed(3)}`).css("height", `${scale}px`);
	tDiv.prepend($("<div></div>").addClass("timeSeparator").css("width", `${width}px`));
    return tDiv;
}

function addTimeUntil(time) {
    var currentMax = -1;
    var width;
    if ($("#timeline").children().length > 1)
        currentMax = Number($("#timeline").children().last().attr("time"));
    if (currentMax + 1 <= time) {
        width = $("#columns").get(0).getBoundingClientRect().width - $("#dps").get(0).getBoundingClientRect().width;
        for (i = currentMax + 1; i <= time; i++) {
            $("#timeline").append(timeDiv(i, width));
        }
        hideTimelineOverlap(currentMax + 1);
    }
}

function drawEffect(name, beginTime, endTime, nastrondStacks) {
    var effectHeader = $("#effectsHeader").children(`[name="${name}"]`);
    if (effectHeader.length > 0) {
        var headerWidth = 24;
        var borderWidth = 3;
        var effectMargin = 1;
        var index = $("#effectsHeader").children().index(effectHeader);
        var hide = effectHeader.children("img").prop("hidden");
        var posLeft = effectMargin + 1 + headerWidth * index;
        var posWidth = headerWidth - (borderWidth + effectMargin) * 2;
        var posTop = (beginTime - startTime) * scale;
        var posHeight = (endTime - beginTime) * scale - borderWidth * 2;
        
        var effect = effects.find(ef => name === ef.name);
        var backgroundColor = "rgb(255,60,60)";
        if (effect.hasOwnProperty("backgroundColor"))
            backgroundColor = effect.backgroundColor;
        var borderColor = "rgb(128, 30, 30)";
        if (effect.hasOwnProperty("borderColor"))
            borderColor = effect.borderColor;
        
        var wrapper = $("<div></div>");
        wrapper.attr({"class": "effect", "name": name, "time": `${beginTime.toFixed(3)}`, "endTime": `${endTime.toFixed(3)}`});
        wrapper.css({"left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`,
                     "border": `solid ${borderWidth}px ${borderColor}`});
        wrapper.prop("hidden", hide);
        
        var imgName = `${name}.png`;
        if (name === "Nastrond Ready") {
            imgName = `${name}${nastrondStacks}.png`;
        }
        var icon = $("<img></img>").attr("src", `../../images/effects/${imgName}`).addClass("effectIcon");
        wrapper.append(icon);
        
        $("#effects").append(wrapper);
        addTooltip(wrapper.get(0), "effect");
        addTimeUntil(endTime + 5);
    }
}

function drawGroupEffect(name, jobIndex, beginTime, endTime, coda/*, royalRoad, celestialOpposition, timeDilation, emboldenStacks*/) {
    var effect = effects.find(ef => name === ef.name);
    var columnName = effect.groupAction;
    
    if ($("#groupEffectsHeader").children(`[name="${columnName}"][jobIndex="${jobIndex}"]`).length <= 0) { // TODO : name = draw for cards
        return;
    }
    var borderWidth = 3;
    var posLeft = $("#groupEffectsHeader").children(`[name="${columnName}"][jobIndex="${jobIndex}"]`).position().left + 1;
    var posWidth = $("#groupEffectsHeader").children(`[name="${columnName}"][jobIndex="${jobIndex}"]`).width() - borderWidth * 2;
    var posTop = (beginTime - startTime) * scale;
    var posHeight = (endTime - beginTime) * scale - borderWidth * 2;
    
    var backgroundColor = effect.backgroundColor;
    var borderColor = effect.borderColor;
    
    var wrapper = $("<div></div>");
    wrapper.attr({"class": "effect", "name": name, "jobIndex": jobIndex, "time": `${beginTime.toFixed(3)}`, "endTime": `${endTime.toFixed(3)}`});
    if (coda)
        wrapper.attr("coda", coda);
    // if (royalRoad)
    //     wrapper.attr("royalRoad", royalRoad);
    // if (celestialOpposition)
    //     wrapper.attr("celestialOpposition", celestialOpposition);
    // if (timeDilation)
    //     wrapper.attr("timeDilation", timeDilation);
    // if (emboldenStacks)
    //     wrapper.attr("emboldenStacks", emboldenStacks);
    wrapper.addClass("groupEffect");
    wrapper.css({"left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`, "border": `solid ${borderWidth}px ${borderColor}`});
    
    var icon = $("<img></img>");
    // if (emboldenStacks)
    //     icon.attr("src", `../../images/effects/${name+emboldenStacks}.png`);
    // else
        icon.attr("src", `../../images/effects/${name}.png`);
    icon.addClass("groupEffectIcon");
    wrapper.append(icon);
    
    var overlay = $("<div></div>");
    overlay.addClass("groupEffectOverlay");
    overlay.attr("endtime", `${endTime.toFixed(3)}`);
    wrapper.append(overlay);
    
    $("#groupEffects").append(wrapper);
    addGroupEffectTooltip(wrapper.get(0));
    addTimeUntil(endTime + 5);
}

function updateGroupEffectOverlay(name, beginTime, endTime, jobIndex/*, emboldenStacks*/) {
    var wrapper = $("#groupEffects").children(`[name="${name}"][jobIndex="${jobIndex}"][time="${beginTime.toFixed(3)}"]`);
    // if (emboldenStacks > 1 && endTime < Number(wrapper.attr("endtime"))) {
    //     var nextStackTime = beginTime + effects.find(ef => ef.name === "Embolden").stackDuration;
    //     updateGroupEffectOverlay(name, nextStackTime, nextStackTime, jobIndex, emboldenStacks - 1);
    // }
    var overlay = wrapper.children("div");
    overlay.attr("endtime", `${endTime.toFixed(3)}`);
    
    var posTop = (endTime - beginTime) * scale - 3;
    var posHeight = (Number(wrapper.attr("endTime")) - endTime) * scale;
    
    overlay.css({"top": `${posTop}px`, "height": `${posHeight}px`});
}

function deleteGroupEffect(element) {
    // if ($(element).attr("name") === "Embolden") {
    //     var emboldenEffect = effects.find(ef => ef.name === "Embolden");
    //     var emboldenBeginTime = ($(element).attr("time") - (emboldenEffect.maxStacks - $(element).attr("emboldenStacks")) * emboldenEffect.stackDuration).toFixed(3);
    //     for (var currentStacks = emboldenEffect.maxStacks; currentStacks > 0; currentStacks--) {
    //         var currentTime = (Number(emboldenBeginTime) + (emboldenEffect.maxStacks - currentStacks) * emboldenEffect.stackDuration).toFixed(3);
    //         $("#groupEffects").children(`[name="${$(element).attr("name")}"][jobIndex="${$(element).attr("jobIndex")}"][time="${currentTime}"]`).first().remove();
    //     }
    // } else
        $(element).remove();
    
    // Speed buffs
    // if ($(element).attr("name") === "The Balance" || $(element).attr("name") === "The Spear" || $(element).attr("name") === "The Arrow" || $(element).attr("name") === "Fey Wind") {
        // updateGcdTimeline();
        // updateRotationAfterIndex(0);
    // }
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
}

// function getColors(elt) {
//     var img = $(elt).children("img").get(0);
//     var canvas = document.createElement('canvas');
//     canvas.width = img.width;
//     canvas.height = img.height;
//     var count = 0;
//     var r = 0;
//     var g = 0;
//     var b = 0;
//     var r2 = 0;
//     var g2 = 0;
//     var b2 = 0;
//     var colors = new Map();
//     try {
//         canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
//         for (i = 0; i < img.width; i++) {
//             for  (j = 0; j < img.height; j++) {
//                 p = canvas.getContext('2d').getImageData(i, j, 1, 1).data;
//                 var pr = p[0];
//                 var pg = p[1];
//                 var pb = p[2];
//                 var interval = 8;
//                 if (pr != 0 || pg != 0 || pb != 0) {
//                     pr = Math.floor(pr / interval) * interval + interval / 2;
//                     pg = Math.floor(pg / interval) * interval + interval / 2;
//                     pb = Math.floor(pb / interval) * interval + interval / 2;
//                     var key = pr + pg * 256 + pb * 256 * 256;
//                     var val = colors.get(key);
//                     if (val === undefined)
//                         val = 0;
//                     var coef = 1/Math.sqrt((Math.pow(img.width/2-i,2)+Math.pow(img.height/2-j,2))/30+1);
//                     colors.set(key, val + coef);

//                     count++;
//                     r += pr;
//                     g += pg;
//                     b += pb;
//                 }
//             }
//         }
//         r /= count;
//         g /= count;
//         b /= count;
//         r2 = r / 2;
//         g2 = g / 2;
//         b2 = b / 2;
//         var mainColor = 0;
//         var secondColor = 0;
//         var mainColorUses = 0;
//         var secondColorUses = 0;
//         for (var [key, val] of colors) {
//             if ((val) > mainColorUses) {
//                 secondColorUses = mainColorUses;
//                 secondColor = mainColor;
//                 mainColorUses = val;
//                 mainColor = key;
//             } else if ((val) > secondColorUses) {
//                 secondColorUses = val;
//                 secondColor = key;
//             }
//         }
//         console.log("Main color: " + mainColor + ", used " + mainColorUses + " times");
//         console.log("Second color: " + secondColor + ", used " + secondColorUses + " times");
//         b = Math.floor(mainColor / 256 / 256);
//         g = Math.floor(mainColor / 256 - b * 256);
//         r = Math.floor(mainColor - b * 256 * 256 - g * 256);
//         b2 = Math.floor(secondColor / 256 / 256);
//         g2 = Math.floor(secondColor / 256 - b2 * 256);
//         r2 = Math.floor(secondColor - b2 * 256 * 256 - g2 * 256);
//         console.log("r: " + r + ", g: " + g + " , b: " + b + " , main color check: " + (r + g * 256 + b * 256 * 256));
//         console.log("r2: " + r2 + ", g2: " + g2 + " , b2: " + b2 + " , second color check: " + (r2 + g2 * 256 + b2 * 256 * 256));
//         var grey = Math.max(r, g, b);
//         var grey2 = Math.max(r2, g2, b2);
//         if (grey2 > grey) {
//             var r3 = r;
//             var g3 = g;
//             var b3 = b;
//             r = r2;
//             g = g2;
//             b = b2;
//             r2 = r3;
//             g2 = g3;
//             b2 = b3;
//         }
//     } catch {
//         r = 255;
//         g = 60;
//         b = 60;
//         r2 = 127;
//         g2 = 30;
//         b2 = 30;
//     }
//     $(elt).css({"background-color": `rgb(${r},${g},${b})`,
//               "border": `solid 3px rgb(${r2},${g2},${b2})`});
// }

function drawBotd(type, botdObject, eTime) {
    var posWidth = 25;
    var posLeft = ($("#botd").get(0).getBoundingClientRect().width - posWidth) / 2;
    var zIndex = 1;
    var beginTime, backgroundColor;
    var effect = effects.find(ef => "Life of the Dragon" === ef.name);
    
    var botdDiv = function(name, beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex) {
        return $("<div></div>").attr({"name": name, "time": `${beginTime.toFixed(3)}`, "endTime": `${eTime.toFixed(3)}`})
        .css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`, "z-index": `${zIndex}`});
    };
    
    switch (type) {
        case "blood":
            beginTime = botdObject.bloodStart;
            backgroundColor = effect.backgroundColor;
            var posTop = Math.round((beginTime - startTime) * scale + 1);
            var posBot = Math.round((eTime - startTime) * scale + 1);
            var posHeight = posBot - posTop;
            $("#botd").append(botdDiv(type, beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex));
            break;
        case "life":
            beginTime = botdObject.lifeStart;
            backgroundColor = effect.lifeColor;
            var posTop = Math.round((beginTime - startTime) * scale + 1);
            var posBot = Math.round((eTime - startTime) * scale + 1);
            var posHeight = posBot - posTop;
            var lifeDiv = botdDiv(type, beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex);
            
            // for (var i = 1; i <= 2; i++) {
            //     var posTop = Math.round((eTime - 10 * i - beginTime) * scale);
            //     lifeDiv.prepend($("<div></div>").attr("time", `${(eTime - 10 * i).toFixed(3)}`)
            //         .css({"position": "absolute", "top": `${posTop}px`, "height": "2px", "width": `${posWidth}px`, "background-color": "orange", "z-index": "3"}));
            // }
            $("#botd").append(lifeDiv);
            break;
        case "eye":
            for (var i = 0; i < botdObject.eyeCount; i++) {
                posLeftEye = 11 * i + 3 + posLeft;
                posWidth = 8;
                beginTime = botdObject.eyeTime[i];
                backgroundColor = effect.eyeColor;
                zIndex = 2;
                var posTop = Math.round((beginTime - startTime) * scale + 1);
                var posBot = Math.round((eTime - startTime) * scale + 1);
                var posHeight = posBot - posTop;
                $("#botd").append(botdDiv(type + (i + 1), beginTime, eTime, posLeftEye, posTop, posHeight, posWidth, backgroundColor, zIndex).css("border-radius", "3px"));
            }
            break;
        default:
            return;
    }

    // addTimeUntil(eTime + 5);
}

function drawFifo(type, fifoObject, eTime) {
    var posWidth = 25;
    var posLeft = ($("#fifo").get(0).getBoundingClientRect().width - posWidth) / 2;
    var zIndex = 1;
    var beginTime, backgroundColor;
    var effect = effects.find(ef => "Firstminds' Focus" === ef.name);
    
    var fifoDiv = function(name, beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex) {
        return $("<div></div>").attr({"name": name, "time": `${beginTime.toFixed(3)}`, "endTime": `${eTime.toFixed(3)}`})
        .css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`, "z-index": `${zIndex}`});
    };
    
    switch (type) {
        case "fifo":
            beginTime = fifoObject.fifoStart;
            backgroundColor = effect.backgroundColor;
            var posTop = Math.round((beginTime - startTime) * scale + 1);
            var posBot = Math.round((eTime - startTime) * scale + 1);
            var posHeight = posBot - posTop;
            $("#fifo").append(fifoDiv(type, beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex));
            break;
        case "scale":
            for (var i = 0; i < fifoObject.scaleCount; i++) {
                posLeftScale = 11 * i + 3 + posLeft;
                posWidth = 8;
                beginTime = fifoObject.scaleTime[i];
                backgroundColor = effect.scaleColor;
                zIndex = 2;
                var posTop = Math.round((beginTime - startTime) * scale + 1);
                var posBot = Math.round((eTime - startTime) * scale + 1);
                var posHeight = posBot - posTop;
                $("#fifo").append(fifoDiv(type + (i + 1), beginTime, eTime, posLeftScale, posTop, posHeight, posWidth, backgroundColor, zIndex).css("border-radius", "3px"));
            }
            break;
        default:
            return;
    }
}

function deleteEffect(name, beginTime) {
	$("#effects").children().filter(function(index) {return $(this).attr("name") === name && Number($(this).attr("time")) === beginTime;}).remove();
}

function removeEffectsAfter(beginTime) {
	$("#effects").children().filter(function(index) {return Number($(this).attr("time")) > beginTime;}).remove();
}

function hideDpsOverlap() {
    var elt = $("#dps").children().first();
    var lastVisible = elt;
    var lastVisibleTop = parseInt(lastVisible.css("top"));
    while (elt.next().length > 0) {
        elt = elt.next();
        var eltDps = elt.children();
        if (lastVisibleTop + 16 < parseInt(elt.css("top"))) {
            elt.css("visibility", "");
            lastVisible = elt;
            lastVisibleTop = parseInt(lastVisible.css("top"));
        } else {
            elt.css("visibility", "hidden");
        }
    }
}

function displayDps(e, width) {
    var pos = (e.time - startTime) * scale + 1;
    var wrapper = $("<div></div>").attr({"time": `${e.time.toFixed(3)}`, "gcdDps": e.gcdDps, "oGcdDps": e.oGcdDps, "dotDps": e.dotDps, "aaDps": e.aaDps}).addClass("dpsSeparator").css({"top": `${pos}px`, "width": `${width}px`});
    var dpsText = $(`<div>${Math.floor(e.dps)}</div>`).addClass("dpsText");
    wrapper.append(dpsText);
    $("#dps").append(wrapper);
}

function removeDpsAfter(beginTime) {
	$("#dps").children().filter(function(index) {return Number($(this).attr("time")) > beginTime;}).remove();
}

function updateDps() {
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    var botdObject = {bloodStart: RotationHistory[0].time, eyeTime: [], lifeStart: 0, eyeCount: 0};
    var fifoObject = {fifoStart: RotationHistory[0].time, scaleTime: [], scaleCount: 0};
    var dpsWidth = $("#dps").get(0).getBoundingClientRect().width;
    RotationHistory.forEach(e => {
        if (e.type === "action") {
            displayDps(e, dpsWidth);
            $("#rotation").children(`[time='${e.time.toFixed(3)}']`).attr("damage", Math.round(e.actionDamage));
        } else if (e.type === "effectBegin") {
            if (e.timedEffect.displaySelf) {
                drawEffect(e.name, e.timedEffect.beginTime, e.timedEffect.endTime, e.timedEffect.nastrondStacks);
            } else if (e.timedEffect.hasOwnProperty("jobIndex")) {
                // Update group effect with overlay
                // var emboldenStacks;
                // if (e.timedEffect.hasOwnProperty("emboldenStacks"))
                //     emboldenStacks = e.timedEffect.emboldenStacks;
                updateGroupEffectOverlay(e.name, e.timedEffect.beginTime, e.timedEffect.endTime, e.timedEffect.jobIndex/*, emboldenStacks*/);
            }
        }
        switch(e.name) {
            // case "Blood of the Dragon":
            //     if (e.type === "effectBegin") { // Blood start
            //         botdObject.bloodStart = e.time;
            //         botdObject.eyeCount = 0;
            //     } else if (e.type === "effectEnd") {
            //         if (e.timedEffect.endTime === e.time) { // Blood end
            //             drawBotd("blood", botdObject, e.time);
            //             drawBotd("eye", botdObject, e.time);
            //             botdObject.eyeCount = -1;
            //         } else { // Life end
            //             drawBotd("life", botdObject, e.time);
            //             botdObject.bloodStart = e.time;
            //         }
            //     }
            //     break;
            case "Life of the Dragon":
                if (e.type === "effectBegin") {
                    drawBotd("blood", botdObject, e.time);
                    botdObject.lifeStart = e.time;
                }
                if (e.type === "effectEnd") {
                    drawBotd("life", botdObject, e.time);
                    botdObject.bloodStart = e.time;
                }
                break;
            // case "Geirskogul":
                // if (botdObject.eyeCount === 2) { // Blood end | Life start
                    // drawBotd("blood", botdObject, e.time);
                //     drawBotd("eye", botdObject, e.time);
                //     botdObject.eyeCount = 0;
                    // botdObject.lifeStart = e.time;
                // }
                // break;
            // case "Mirage Dive":
            //     // if (botdObject.eyeCount >= 0) { // When blood/life up
            //         botdObject.eyeTime[botdObject.eyeCount] = e.time;
            //         botdObject.eyeCount = Math.min(botdObject.eyeCount + 1, 2);
            //     // }
            //     break;
            default:
                break;
        }

        switch(e.name) {
            case "Raiden Thrust":
            case "Draconian Fury":
                fifoObject.scaleTime[fifoObject.scaleCount] = e.time;
                fifoObject.scaleCount = Math.min(fifoObject.scaleCount + 1, 2);
                break;
            case "Wyrmwind Thrust":
                if (fifoObject.scaleCount === 2) {
                    drawFifo("scale", fifoObject, e.time);
                    fifoObject.scaleCount = 0;
                }
                break;
            default:
                break;
        }
    });
    drawBotd("blood", botdObject, Number($("#timeline").children().last().attr("time")) + 1);
    // drawBotd("eye", botdObject, Number($("#timeline").children().last().attr("time")) + 1);
    drawFifo("fifo", fifoObject, Number($("#timeline").children().last().attr("time")) + 1);
    drawFifo("scale", fifoObject, Number($("#timeline").children().last().attr("time")) + 1);
    hideDpsOverlap();
    var lastDps = $("#dps").children().last();
    $("#DPSout").val(lastDps.children().html()).attr({"gcdDps": lastDps.attr("gcdDps"), "oGcdDps": lastDps.attr("oGcdDps"), "dotDps": lastDps.attr("dotDps"), "aaDps": lastDps.attr("aaDps")});
    updateSuggestions();
}

function resetDps() {
    $("#botd").empty();
    $("#fifo").empty();
    $("#effects").empty();
    $("#dps").empty();
    RotationHistory = [];
}

function resetAndUpdateDps() {
    resetDps();
    updateDps();
}

function clearRotation() {
	$("#rotation").empty();
    setStartTime(0);
    $("#timeline").empty();
	$("#timeline").append($("<div></div>").attr("time", "0").css("height", "0px"));
    $("#cds").empty();
    $("#DPSout").val("0");
    resetDps();
    addTimeUntil(20);
    $("#scrollableDiv").scrollTop(0);
    updateSuggestions();
}

$("#clearRotation").click(clearRotation);

function openerAddAction(actionName, delayed) {
    var action = actions.find(ac => actionName === ac.name);
    var target = $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).get(0);
    var clonedElement = target.cloneNode(true);
    dndHandler.applyRotationEvents(clonedElement);
    addActionAtIndex(clonedElement, $("#rotation").children().length);
    
    if (delayed !== undefined)
        $(clonedElement).attr("delayed", delayed);
}

$("#opener").click(function(){
    clearRotation();
    openerAddAction("True Thrust");
    openerAddAction("Potion");
    openerAddAction("Spiral Blow");
    openerAddAction("Lance Charge");
    openerAddAction("Chaotic Spring");
    openerAddAction("Battle Litany");
    openerAddAction("Geirskogul");
    openerAddAction("Wheeling Thrust");
    openerAddAction("High Jump");
    openerAddAction("Life Surge");
    openerAddAction("Drakesbane");
    openerAddAction("Dragonfire Dive");
    openerAddAction("Nastrond");
    openerAddAction("Raiden Thrust");
    openerAddAction("Stardiver");
    openerAddAction("Lance Barrage");
    openerAddAction("Life Surge");
    openerAddAction("Mirage Dive");
    openerAddAction("Heavens' Thrust");
    openerAddAction("Starcross");
    openerAddAction("Nastrond");
    openerAddAction("Fang and Claw");
    openerAddAction("Rise of the Dragon");
    openerAddAction("Nastrond");
    openerAddAction("Drakesbane");
    openerAddAction("Raiden Thrust");
    openerAddAction("Wyrmwind Thrust");

    autoFillRaidBuffs(false);
    updateDps();
});

function generateNextRotationName(rots) {
    var idx = rots.length + 1;
    while (rots.indexOf("Rotation " + idx) >= 0) idx++;
    return `Rotation ${idx}`;
}

function getTimeDisplay(time) {
    var min = Math.floor(time / 60).toFixed(0);
    var sec = (time % 60).toFixed(0);
    return (min > 0 ? min + "m" : "") + sec + "s";
}

function checkAndDisplayEmpty(rots, body) {
    if (!rots.length && !$("#rotation").children().length)
        body.append("<tr><td colspan='5'>No data available, create a rotation to save it here</td></tr>");
}

function loadRotationRow(rotName, rots, body, saving) {
    var rot = JSON.parse(localStorage[rotName]);
    var row = $("<tr></tr>");
    var nameCell = $("<td></td>");
    if(rot.id)
        nameCell.append(`<a href="${rot.id}">${rot.name}</a>`);
    else
        nameCell.append(rot.name);
    row.append(nameCell);
    row.append($(`<td>${rot.dps}</td>`).css("text-align", "right"));
    row.append($(`<td>${getTimeDisplay(rot.length)}</td>`).css("text-align", "right"));
    row.append($(`<td>${rot.gcd.toFixed(2)}</td>`));
    var openButton = $("<button class='ui icon button'><i class='icon folder open'></i></button>").css({"padding": "4px", "background-color": "rgba(255,255,255,0)"});
    var deleteButton = $("<button class='ui icon button'><i class='icon trash alternate'></i></button>").css({"padding": "4px", "background-color": "rgba(255,255,255,0)"});
    var shareButton = $("<button class='ui icon button'><i class='icon share'></i></button>").css({"padding": "4px", "background-color": "rgba(255,255,255,0)"});
    var confirmLabel = $("<strong><label>Delete?</label></strong>").css({"display": "none"});
    var yesButton = $("<button class='ui icon button'><i class='icon checkmark'></i></button>").css({"padding": "4px", "background-color": "green", "display": "none", "margin": "0px 2px 0px 2px"});
    var noButton = $("<button class='ui icon button'><i class='icon close'></i></button>").css({"padding": "4px", "background-color": "red", "display": "none"});
    var savedLabel = $("<strong><label>Rotation saved!</label></strong>").css({"display": "none"});
    var sharedLabel = $("<strong><label>Name updated with the URL!</label></strong>").css({"display": "none"});
    openButton.click(function() {
        // Set version to 5.0.0 when undefined and save again
        if (rot.version == undefined) {
            rot.version = "5.0.0";
            localStorage[rotName] = JSON.stringify(rot);
        }
        // Check version of rot and redirect if needed
        if (rot.version != version) {
            localStorage["LoadingRotation"] = rot.name;
            window.location.href = `/version/${rot.version}`;
        }
        loadRotation(rot);
        $("#savedRotationsLightbox").modal("hide");
    });
    deleteButton.click(function() {
        openButton.css("display", "none");
        deleteButton.css("display", "none");
        shareButton.css("display", "none");
        confirmLabel.css("display", "inline-block");
        yesButton.css("display", "inline-block");
        noButton.css("display", "inline-block");
    });
    shareButton.click(function() {
        $.post("/", rot, function(data) {
            if (data) {
                rot.id = data;
                localStorage[rot.name] = JSON.stringify(rot);
                nameCell.html(`<a href="${rot.id}">${nameCell.html()}</a>`);
                openButton.css("display", "none");
                deleteButton.css("display", "none");
                shareButton.css("display", "none");
                sharedLabel.css("display", "inline-block");
                setTimeout(function() {
                    sharedLabel.animate({opacity: 0}, 1000, function() {
                        openButton.css("display", "inline-block");
                        deleteButton.css("display", "inline-block");
                        shareButton.css("display", "inline-block");
                        sharedLabel.css({"display": "none", "opacity": 1});
                    });
                }, 2000);
            }
        });
    });
    yesButton.click(function() {
        localStorage.removeItem(rotName);
        rots.splice(rots.indexOf(rotName), 1);
        localStorage["Rotations"] = JSON.stringify(rots);
        row.remove();
        if ($("#rotation").children().length)
            $("#savedRotationsNameInput").attr("placeholder", generateNextRotationName(rots));
        checkAndDisplayEmpty(rots, body)
    });
    noButton.click(function() {
        openButton.css("display", "inline-block");
        deleteButton.css("display", "inline-block");
        shareButton.css("display", "inline-block");
        confirmLabel.css("display", "none");
        yesButton.css("display", "none");
        noButton.css("display", "none");
    });
    addTooltip(openButton, "iconButton");
    addTooltip(deleteButton, "iconButton");
    addTooltip(shareButton, "iconButton");
    var buttonsCell = $("<td></td>");
    buttonsCell.append(openButton);
    buttonsCell.append(deleteButton);
    buttonsCell.append(shareButton);
    buttonsCell.append(confirmLabel);
    buttonsCell.append(yesButton);
    buttonsCell.append(noButton);
    buttonsCell.append(savedLabel);
    buttonsCell.append(sharedLabel);
    row.append(buttonsCell);
    body.append(row);

    if (saving) {
        openButton.css("display", "none");
        deleteButton.css("display", "none");
        shareButton.css("display", "none");
        savedLabel.css("display", "inline-block");
        setTimeout(function() {
            savedLabel.animate({opacity: 0}, 1000, function() {
                openButton.css("display", "inline-block");
                deleteButton.css("display", "inline-block");
                shareButton.css("display", "inline-block");
                savedLabel.css({"display": "none", "opacity": 1});
            });
        }, 2000);
    }
}

$("#manageRotations").click(function() {
    var rots = [];
    if (localStorage["Rotations"])
        rots = JSON.parse(localStorage["Rotations"]);
    var body = $("#savedRotationsTable").children("tbody");
    body.children().remove();
    rots.forEach(function(rotName) {
        loadRotationRow(rotName, rots, body);
    });
    if ($("#rotation").children().length) {
        var row = $("<tr></tr>").addClass("firstLine");
        var nameInput = $("<input id='savedRotationsNameInput' type='text'></input>").attr("placeholder", generateNextRotationName(rots)).css("text-align", "center");
        row.append($("<td></td>").append(nameInput));
        row.append($(`<td>${$("#dps").children().last().children().html()}</td>`).css("text-align", "right"));
        row.append($(`<td>${getTimeDisplay(Number($("#rotation").children().last().attr("time")))}</td>`).css("text-align", "right"));
        row.append($(`<td>${Number($("#SKSoutGCD").val()).toFixed(2)}</td>`));
        var saveButton = $("<button class='ui icon button'><i class='icon save'></i></button>").css({"padding": "4px", "background-color": "rgba(255,255,255,0)"});
        var warningLabel = $("<strong><label>That name is already used!</label></strong>").css({"display": "none", "color": "red"});
        saveButton.click(function() {
            warningLabel.css("display", "none");
            var rotName = nameInput.val() || nameInput.attr("placeholder");
            if (rots.indexOf(rotName) >= 0) {
                warningLabel.css("display", "inline-block");
                return;
            }
            var savedRotationObject = {
                name: rotName,
                version: version,
                dps: Number($("#dps").children().last().children().html()),
                length: Number($("#rotation").children().last().attr("time")),
                gcd: Number($("#SKSoutGCD").val()),
                wd: stats.wd,
                str: stats.str,
                dh: stats.dh,
                crit: stats.crit,
                det: stats.det,
                sks: stats.sks,
                actions: []
            };
            $("#rotation").children().each(function(index) {
                var id = $(this).attr("id");
                if ($(this).attr("delayed") !== undefined)
                    savedRotationObject.actions.push({i: id, d: ($(this).attr("delayed") === "true" ? "1" : "0")});
                else
                    savedRotationObject.actions.push({i: $(this).attr("id")});
            });
            rots.push(rotName);
            localStorage["Rotations"] = JSON.stringify(rots);
            localStorage[rotName] = JSON.stringify(savedRotationObject);
            loadRotationRow(rotName, rots, body, true);
            row.prop("hidden", true);
        });
        addTooltip(saveButton, "iconButton");
        row.append($("<td></td>").append(saveButton).append(warningLabel));
        body.prepend(row);
    }
    checkAndDisplayEmpty(rots, body)
    $("#savedRotationsLightbox").modal("show");
});

addTooltip($("#savedRotationstooltip").get(0), "savedRotations");

function loadRotation(rotation) {
    clearRotation();
    $("#WDin").val(rotation.wd);
    $("#STRin").val(rotation.str);
    $("#DHin").val(rotation.dh);
    $("#CRITin").val(rotation.crit);
    $("#DETin").val(rotation.det);
    $("#SKSin").val(rotation.sks);
    $("#WDin").change();
    $("#STRin").change();
    $("#DHin").change();
    $("#CRITin").change();
    $("#DETin").change();
    $("#SKSin").change();
    rotation.actions.forEach(ac => {
        if (ac.hasOwnProperty("d"))
            openerAddAction(actions.find(a => a.id == ac.i).name, (ac.d === "1" ? "true" : "false"));
        else
            openerAddAction(actions.find(a => a.id == ac.i).name);
    });

    autoFillRaidBuffs(false);
    updateDps();
    
    // var doOneStep = function(timestamp) {
        // var initTime = Date.now();
        // while (Date.now() - initTime < 1000/60) {
            // var ac = rotation.actions[index];
            // if (ac.hasOwnProperty("d"))
                // openerAddAction(actions[ac.i].name, (ac.d === "1" ? "true" : "false"));
            // else
                // openerAddAction(actions[ac.i].name);
            
            // index++;
            
            // if (index >= rotation.actions.length) {
                // autoFillRaidBuffs(false);
                // updateDps();
                // return;
            // }
        // }
        // requestAnimationFrame(doOneStep);
    // }
    // requestAnimationFrame(doOneStep);
}

$("#sixMinRotation").click(function() {
    loadRotation(sixMinRotation);
});

function displayDebug() {
    RotationHistory.forEach(function(item) { item.display(); });
}

$("#hideEffectsButton").click(function() {
    $("#effectsHeader").children().each(function() {
        var effectImg = $(this).children("img");
        var checkBox = $(this).children("input");
        var checkBoxDisplay = checkBox.css("display") === "none" ? "block" : "none";
        checkBox.css("display", checkBoxDisplay);
        if (checkBoxDisplay === "block") {
            effectImg.prop("hidden", false);
        } else {
            effectImg.prop("hidden", !checkBox.prop("checked"));
        }
    });
    fitColumns();
});

$("#convertRotation").click(function() {
    $("#exportRotationConfirm").prop("hidden", true);
    $("#convertRotationLightbox").modal("show");
});

$("#pasteImportRotation").on("paste", function(e) {
    var rotation = e.originalEvent.clipboardData.getData("text").split("\n");
    $("#convertRotationLightbox").modal("hide");
    clearRotation();
    rotation.forEach(ac => {
        if (ac)
            openerAddAction(ac.replace("\r", ""));
    });

    autoFillRaidBuffs(false);
    updateDps();
    return false;
})

$("#exportRotation").click(function() {
    var rotation = [];
    $("#rotation").children().each(function(index) {
        rotation.push($(this).attr("name"));
    });
    $("#exportRotationText").prop("hidden", false);
    $("#exportRotationText").val(rotation.join("\r\n"));
    $("#exportRotationText").get(0).select();
    document.execCommand("copy");
    $("#exportRotationText").prop("hidden", true);
    $("#exportRotationConfirm").prop("hidden", false);
});

$("#themeCheckbox .checkbox").checkbox({
    onChange : function() {
        $("body").attr("data-theme", $(this.parentNode).checkbox("is checked") ? "dark" : "");
        localStorage["theme"] = $(this.parentNode).checkbox("is checked") ? "dark" : "light";
    }
});

if (!localStorage["theme"] || localStorage["theme"] === "dark")
    $("#themeCheckbox .checkbox").checkbox("set checked");

function toggleExpandPanel(self, side) {
    if ($(self).attr("expanded") === "true") {
        $(self).attr("expanded", "false");
        $(`#${side}Div`).css({"display": "none", "position": "", "top": "", "z-index": ""});
        $(`#${side}Div`).css(side, "");
    } else {
        $(self).attr("expanded", "true");
        $(`#${side}Div`).css({"display": "", "position": "absolute", "top": "0px", "z-index": "2"});
        $(`#${side}Div`).css(side, `${$("#midDiv").get(0).getBoundingClientRect().left}px`);
    }
    $(`#${side}ExpandIcon`).toggleClass("double angle chevron left right");
}

$("#leftExpand").click(function() { toggleExpandPanel(this, "left"); });

$("#rightExpand").click(function() { toggleExpandPanel(this, "right"); });

function trimInput(element) {
    if(Number(element.val()) < Number(element.attr("min")))
        element.val(element.attr("min"));
    if(Number(element.val()) > Number(element.attr("max")))
        element.val(element.attr("max"));
}

$("#Latency").blur(function(){
    trimInput($("#Latency"));
    $("#Latency").val(Math.trunc($("#Latency").val()));
    if ($("#rotation").children().length > 0) {
    	updateStartTime();
        updateRotationAfterIndex(0);
        resetAndUpdateDps();
    }
});

$("#WDin").change(function() {
    trimInput($("#WDin"));
    $("#WDin").val(Math.trunc($("#WDin").val()));
    stats.wd = Number($("#WDin").val());
    $("#WDout").val(stats.wdMod());
    $("#WDoutAa").val(stats.aaMod());
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
});

$("#STRin").change(function() {
    trimInput($("#STRin"));
    $("#STRin").val(Math.trunc($("#STRin").val()));
    stats.str = Number($("#STRin").val());
    $("#STRout").val(stats.strMod());
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
});

$("#DHin").change(function() {
    trimInput($("#DHin"));
    $("#DHin").val(Math.trunc($("#DHin").val()));
    stats.dh = Number($("#DHin").val());
    $("#DHout").val(stats.dhMod());
    $("#DHoutRate").val((stats.dhRate() * 100).toFixed(1) + "%");
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
});

$("#CRITin").change(function() {
    trimInput($("#CRITin"));
    $("#CRITin").val(Math.trunc($("#CRITin").val()));
    stats.crit = Number($("#CRITin").val());
    $("#CRITout").val(stats.critMod().toFixed(6));
    $("#CRIToutRate").val((stats.critRate() * 100).toFixed(1) + "%");
    $("#CRIToutDmg").val((stats.critDamage() * 100).toFixed(1) + "%");
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
});

$("#DETin").change(function() {
    trimInput($("#DETin"));
    $("#DETin").val(Math.trunc($("#DETin").val()));
    stats.det = Number($("#DETin").val());
    $("#DETout").val(stats.detMod());
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
});

$("#SKSin").change(function() {
    trimInput($("#SKSin"));
    $("#SKSin").val(Math.trunc($("#SKSin").val()));
    stats.sks = Number($("#SKSin").val());
    $("#SKSout").val(stats.sksMod());
    if (Number($("#SKSoutGCD").val()) !== stats.gcd())
        updateGcdTimeline();
    $("#SKSoutGCD").val(stats.gcd());
    if ($("#rotation").children().length > 0) {
        updateStartTime();
        updateRotationAfterIndex(0);
        resetAndUpdateDps();
    }
});

addTooltip($("#WDtooltip").get(0), "wd");
addTooltip($("#STRtooltip").get(0), "str");
addTooltip($("#DHtooltip").get(0), "dh");
addTooltip($("#CRITtooltip").get(0), "crit");
addTooltip($("#DETtooltip").get(0), "det");
addTooltip($("#SKStooltip").get(0), "sks");
addTooltip($("#Latencytooltip").get(0), "latency");
addTooltip($("#DPSout").get(0), "dps");

window.addEventListener("wheel", function(event) // TODO: ctrl + +/-, 2 point slide
{
    if(event.ctrlKey == true)
    {
        event.preventDefault();
        var scrollTopOffset = Number($("#scrollableDiv").attr("scrollTop")) || 0;
        var scrollTime = ($("#scrollableDiv").scrollTop() + scrollTopOffset) / scale;

        if(event.deltaY > 0) {
            scale /= 1.1;
        } else {
            scale *= 1.1;
        }
        $("#timeline").children().css("height", `${scale}px`);
        var value = $("#timeline").children().eq(0).attr("time");
        $("#timeline").children().eq(0).css("height", `${(Math.ceil(value)-value) * scale}px`);
        hideTimelineOverlap();

        $("#rotation").children().each(function(index) {
            var position = ($(this).attr("time") - startTime) * scale;
            var animLockHeight = scale * getAnimationLock($(this).attr("name"));
            $(this).css({"top": `${position}px`, "height": `${animLockHeight}px`});
        });

        $("#botd").children().each(function(index) {
            var beginTime = $(this).attr("time");
            var endTime = $(this).attr("endTime");
            var posTop = (beginTime - startTime) * scale + 1;
            var posHeight = (endTime - beginTime) * scale;
            $(this).css({"top": `${posTop}px`, "height": `${posHeight}px`});
            $(this).children().each(function(index) {
                var eTime = $(this).attr("time");
                var posTop = Math.round((eTime - beginTime) * scale);
                $(this).css("top", `${posTop}px`);
            })
        });

        $("#fifo").children().each(function(index) {
            var beginTime = $(this).attr("time");
            var endTime = $(this).attr("endTime");
            var posTop = (beginTime - startTime) * scale + 1;
            var posHeight = (endTime - beginTime) * scale;
            $(this).css({"top": `${posTop}px`, "height": `${posHeight}px`});
            $(this).children().each(function(index) {
                var eTime = $(this).attr("time");
                var posTop = Math.round((eTime - beginTime) * scale);
                $(this).css("top", `${posTop}px`);
            })
        });

        $("#effects").children().each(function(index) {
            var beginTime = $(this).attr("time");
            var endTime = $(this).attr("endTime");
            var posTop = (beginTime - startTime) * scale;
            var posHeight = (endTime - beginTime) * scale - 6;
            $(this).css({"top": `${posTop}px`, "height": `${posHeight}px`});
        });

        $("#groupEffects").children().each(function(index) {
            var beginTime = $(this).attr("time");
            var endTime = $(this).attr("endTime");
            var posTop = (beginTime - startTime) * scale;
            var posHeight = (endTime - beginTime) * scale - 6;
            $(this).css({"top": `${posTop}px`, "height": `${posHeight}px`});
            
            var overlay = $(this).children("div");
            endTime = Number(overlay.attr("endtime"));
            var posTop = (endTime - beginTime) * scale - 3;
            var posHeight = (Number($(this).attr("endTime")) - endTime) * scale;
            overlay.css({"top": `${posTop}px`, "height": `${posHeight}px`});
        });

        $("#cds").children().each(function(index) {
            var offCdPosition = ($(this).attr("time") - startTime) * scale;
            $(this).css("top", `${offCdPosition}px`);
        });

        $("#dps").children().each(function(index) {
            var pos = ($(this).attr("time") - startTime) * scale + 1;
            $(this).css("top", `${pos}px`);
        });
        hideDpsOverlap();
        
        $("#scrollableDiv").attr("scrollTop", (scrollTime * scale) % 1);
        $("#scrollableDiv").scrollTop(scrollTime * scale);
    } else {
        $("#scrollableDiv").attr("scrollTop", 0);
    }
}, { passive: false} );

// var resizeTimer;
$(window).resize(function() {
    fitColumns();
    // clearTimeout(resizeTimer);
    // resizeTimer = setTimeout(fitColumns, 2);
});

function setStartTime(value) {
    if (value < startTime) {
        var width = $("#columns").get(0).getBoundingClientRect().width - $("#dps").get(0).getBoundingClientRect().width;
        for (var i = 0; i < Math.ceil(startTime) - Math.ceil(value); i++) {
			$("#timeline").children().eq(0).after(timeDiv(Math.ceil(startTime) - i - 1, width));
        }
    } else {
        for (var i = 0; i < Math.ceil(value) - Math.ceil(startTime); i++) {
            $("#timeline").children().eq(1).remove();
        }
    }
	$("#timeline").children().eq(0).attr("time", `${value.toFixed(3)}`).css("height", `${(Math.ceil(value)-value) * scale}px`);
    startTime = value;
    $("#groupEffects").children().each(function(index) {
        var beginTime = $(this).attr("time");
        var endTime = $(this).attr("endTime");
        var posTop = (beginTime - startTime) * scale;
        var posHeight = (endTime - beginTime) * scale - 6;
        $(this).css({"top": `${posTop}px`, "height": `${posHeight}px`});
    });
    hideTimelineOverlap();
}

function updateStartTime() {
	var prePullTime = 0;
	$("#rotation").children().filter(function(index) {return $(this).attr("time") < 0;}).each(function(index) {prePullTime -= getAnimationLock($(this).attr("name"));});
	setStartTime(prePullTime);
}

function selectCard(cardName) {
    $("#raidBuffLightboxTitle").val(cardName);
    $("#raidBuffLightboxImg").attr("src", `../../images/effects/${cardName}.png`);
}

$("input[name='card']").change(function() {
    // console.log($(this).attr("value") + " " + $(this).prop("checked"));
    if (!$("#raidBuffLightboxCards").prop("hidden") && $(this).prop("checked"))
        selectCard($("input[name='card']:checked").attr("value"));
});

// function adjustCardDuration() {
//     var name;
//     if ($("#raidBuffLightboxBalance").prop("checked"))
//         name = "The Balance";
//     if ($("#raidBuffLightboxSpear").prop("checked"))
//         name = "The Spear";
//     if ($("#raidBuffLightboxArrow").prop("checked"))
//         name = "The Arrow";
//     if (!name) {
//         console.log("Card name not found!");
//         return;
//     }

//     var duration = getEffectDuration(name);
//     if ($("#raidBuffLightboxExtended").prop("checked"))
//         duration *= 2;
//     if ($("#raidBuffLightboxCelestialOpposition").prop("checked"))
//         duration += 10;
//     if ($("#raidBuffLightboxTimeDilation").prop("checked"))
//         duration += 15;
//     $("#raidBuffLightboxDurationInput").val(duration);
//     $("#raidBuffLightboxDurationOutput").val(duration);
// }

// $("#raidBuffLightboxNoEffect").change(function() {
//     if (!$("#raidBuffLightboxRoadRow").prop("hidden"))
//         adjustCardDuration();
// });

// $("#raidBuffLightboxExpanded").change(function() {
//     if (!$("#raidBuffLightboxRoadRow").prop("hidden"))
//         adjustCardDuration();
// });

// $("#raidBuffLightboxExtended").change(function() {
//     if (!$("#raidBuffLightboxRoadRow").prop("hidden"))
//         adjustCardDuration();
// });

// $("#raidBuffLightboxEnhanced").change(function() {
//     if (!$("#raidBuffLightboxRoadRow").prop("hidden"))
//         adjustCardDuration();
// });

// $("#raidBuffLightboxCelestialOpposition").change(function() {
//     if (!$("#raidBuffLightboxAstRow").prop("hidden"))
//         adjustCardDuration();
// });

// $("#raidBuffLightboxTimeDilation").change(function() {
//     if (!$("#raidBuffLightboxAstRow").prop("hidden"))
//         adjustCardDuration();
// });

function setUpRaidBuffLightbox(name, jobIndex, element) {
    $("#raidBuffLightboxTitle").val(name); // Don't delete, this value is used in the OK call
    $("#raidBuffLightboxImg").attr("src", `../../images/effects/${name}.png`);
    raidBuffLightboxJobIndex = jobIndex;
    var currentEffect = effects.find(ef => ef.name === name);
    if (raidBuffLightboxEditMode) {
        $("#raidBuffLightboxTitleMode").val("Edit");
        // if (name === "Embolden") {
        //     var emboldenBeginTime = ($(element).attr("time") - (currentEffect.maxStacks - $(element).attr("emboldenStacks")) * currentEffect.stackDuration).toFixed(3);
        //     $("#raidBuffLightboxStartTimeInput").val(emboldenBeginTime);
        //     // $("#raidBuffLightboxDurationInput").val(getEffectDuration(name));
        //     $("#raidBuffLightboxDuration").val(getEffectDuration(name));
        // } else {
            $("#raidBuffLightboxStartTimeInput").val($(element).attr("time"));
            // $("#raidBuffLightboxDurationInput").val((Number($(element).attr("endTime")) * 1000 - Number($(element).attr("time")) * 1000) / 1000);
            $("#raidBuffLightboxDuration").val((Number($(element).attr("endTime")) * 1000 - Number($(element).attr("time")) * 1000) / 1000);
        // }
        if (name === "Radiant Finale") {
            $("#raidBuffLightboxCoda").val($(element).attr("coda"));
        }
    } else {
        $("#raidBuffLightboxTitleMode").val("Add");
        var previousEffects = $("#groupEffects").children(`[name="${name}"][jobIndex="${jobIndex}"]`);
        if (currentEffect.groupAction === "Draw") {
            var groupAc = groupActions.find(ac => ac.name === currentEffect.groupAction);
            previousEffects = $("#groupEffects").children(`[jobIndex="${jobIndex}"]`).filter((idx, ef) => {return groupAc.effects.includes($(ef).attr("name"))});
        }
        // if (name === "Embolden")
        //     previousEffects = previousEffects.filter((idx, ef) => {return Number($(ef).attr("emboldenStacks")) === currentEffect.maxStacks});
        var useNumber = previousEffects.length;
        var useTime = getGroupOpenerTime(currentEffect.groupAction);
        if (useNumber > 0)
            useTime = Number(previousEffects.sort((a, b) => {return Number($(a).attr("time")) - Number($(b).attr("time"))}).last().attr("time")) + getGroupRecastTime(currentEffect.groupAction, useNumber - 1);
        
        $("#raidBuffLightboxStartTimeInput").val(useTime);
        // $("#raidBuffLightboxDurationInput").val(getEffectDuration(name, useNumber));
        $("#raidBuffLightboxDuration").val(getEffectDuration(name, useNumber));

        if (name === "Radiant Finale") {
            $("#raidBuffLightboxCoda").val(useNumber == 0 ? 1 : 3);
        }
    }
    if (name === "Radiant Finale") {
        $("#raidBuffLightboxCodaRow").prop("hidden", false);
    } else {
        $("#raidBuffLightboxCodaRow").prop("hidden", true);
    }
    // switch(name) {
    //     case "Hypercharge":
    //     case "Critical Up":
    //     case "Foe Requiem":
    //     case "Radiant Shield":
    //         $("#raidBuffLightboxDurationInput").prop("hidden", false);
    //         $("#raidBuffLightboxDurationOutput").prop("hidden", true);
    //         break;
    //     default:
    //         $("#raidBuffLightboxDurationInput").prop("hidden", true);
    //         $("#raidBuffLightboxDurationOutput").prop("hidden", false);
    //         break;
    // }
    // switch(name) {
    //     case "The Balance":
    //     case "The Spear":
    //     case "The Arrow":
    if (currentEffect.groupAction === "Draw") {
            // $("#raidBuffLightboxCardsRow").prop("hidden", false);
            // $("#raidBuffLightboxRoadRow").prop("hidden", false);
            // $("#raidBuffLightboxAstRow").prop("hidden", false);
            $("#raidBuffLightboxCards").prop("hidden", false);
            $(`input[value="${name}"]`).prop("checked", true).change();
            // $(`#raidBuffLightbox${name.substring(4)}`).prop("checked", true).change();
            // if (raidBuffLightboxEditMode) {
            //     $(`#raidBuffLightbox${$(element).attr("royalRoad")}`).prop("checked", true).change();
            //     $("#raidBuffLightboxCelestialOpposition").prop("checked", element.hasAttribute("CelestialOpposition")).change();
            //     $("#raidBuffLightboxTimeDilation").prop("checked", element.hasAttribute("TimeDilation")).change();
            // } else {
            //     $("#raidBuffLightboxExpanded").prop("checked", true).change();
            //     $("#raidBuffLightboxCelestialOpposition").prop("checked", true).change();
            //     $("#raidBuffLightboxTimeDilation").prop("checked", false).change();
            // }
            // break;
        // default:
    } else {
            // $("#raidBuffLightboxCardsRow").prop("hidden", true);
            // $("#raidBuffLightboxRoadRow").prop("hidden", true);
            // $("#raidBuffLightboxAstRow").prop("hidden", true);
            $("#raidBuffLightboxCards").prop("hidden", true);
            // $("#raidBuffLightboxNoEffect").prop("checked", true).change();
            // $("#raidBuffLightboxCelestialOpposition").prop("checked", false).change();
            // $("#raidBuffLightboxTimeDilation").prop("checked", false).change();
            // break;
    }
}

function refreshGroupMember(index, value) {
    var updateSpeed = false;
    var loopCount = $("#groupEffects").children(`[jobIndex="${index}"]`).length;
     // if ($("#groupEffects").children(`[jobIndex="${index}"][name="The Balance"], [jobIndex="${index}"][name="The Spear"], [jobIndex="${index}"][name="The Arrow"], [jobIndex="${index}"][name="Fey Wind"]`).length > 0)
     //     updateSpeed = true;
    $("#groupEffectsHeader").children(`[jobIndex="${index}"]`).remove();
    $("#groupEffects").children(`[jobIndex="${index}"]`).remove();
    
    memberActions = groupActions.filter(ac => ac.job === value);
    if (memberActions.length > 0) {
        var raidImagesToLoad = 0;
        var raidImagesLoaded = 0;
        var idx = 0;
        while (idx < $("#groupEffectsHeader").children().length && $("#groupEffectsHeader").children().eq(idx).attr("jobIndex") <= index) { idx++; }
        memberActions.forEach(function (ac) {
            var wrapper = $("<div></div>").attr({name: ac.name, class: "raidBuff", jobIndex: index});

            var effect = $("<img></img>").attr({src: `../../images/group/${ac.name}.png`}).css({"width": 22}).one("load", function() {
                raidImagesLoaded++;
                if (raidImagesLoaded === raidImagesToLoad)
                    fitColumns();
            }).each(function() {
                $(wrapper).click(function() {
                    raidBuffLightboxEditMode = false;
                    setUpRaidBuffLightbox(ac.effects[0], index);
                    $("#raidBuffLightbox").modal("show");
                });
                
                wrapper.append(this);
                
                if (idx > 0)
                    $("#groupEffectsHeader").children().eq(idx-1).after(wrapper);
                else
                    $("#groupEffectsHeader").prepend(wrapper);
                addTooltip(wrapper.get(0), "groupEffectHeader");
                
                idx++;
                raidImagesToLoad++;
                if (this.complete)
                    $(this).trigger('load');
            });
        });
    } else {
        fitColumns();
    }
    
    if ($("#group tr td input").eq(index).prop("checked"))
        loopCount += autoFillRaidBuffsOfJob(index, false);
    if (updateSpeed) {
        updateGcdTimeline();
        updateRotationAfterIndex(0);
    }
    if ($("#rotation").children().length > 0 && loopCount > 0) {
        resetAndUpdateDps();
    }
    
    var savedComp = standardComp;
    if (localStorage["partyComp"])
        savedComp = JSON.parse(localStorage["partyComp"]);
    savedComp[index] = value;
    localStorage["partyComp"] = JSON.stringify(savedComp);
}

$("#raidBuffLightboxConfirm").click(function() {
    if (raidBuffLightboxEditMode)
        deleteGroupEffect(raidBuffLightboxEditElement);
    var title = $("#raidBuffLightboxTitle").val();
    var coda;
    if (title === "Radiant Finale") {
        coda = Math.round(Number($("#raidBuffLightboxCoda").val()));
    }
    // var royalRoad;
    // var celestialOpposition;
    // var timeDilation;
    // var emboldenStacks;
    // if ($("#raidBuffLightboxExpanded").prop("checked"))
    //     royalRoad = "Expanded";
    // if ($("#raidBuffLightboxEnhanced").prop("checked"))
    //     royalRoad = "Enhanced";
    // if ($("#raidBuffLightboxExtended").prop("checked"))
    //     royalRoad = "Extended";
    // if ($("#raidBuffLightboxNoEffect").prop("checked"))
    //     royalRoad = "NoEffect";
    // if ($("#raidBuffLightboxCelestialOpposition").prop("checked"))
    //     celestialOpposition = true;
    // if ($("#raidBuffLightboxTimeDilation").prop("checked"))
    //     timeDilation = true;
    // if (title === "Embolden") {
    //     var emboldenEffect = effects.find(ef => ef.name === "Embolden");
    //     var beginTime = Number($("#raidBuffLightboxStartTimeInput").val());
    //     emboldenStacks = emboldenEffect.maxStacks;
    //     while (emboldenStacks > 0) {
    //         drawGroupEffect(title, raidBuffLightboxJobIndex, beginTime, beginTime + emboldenEffect.stackDuration, royalRoad, celestialOpposition, timeDilation, emboldenStacks);
    //         beginTime += emboldenEffect.stackDuration;
    //         emboldenStacks--;
    //     }
    // } else
        drawGroupEffect(title, raidBuffLightboxJobIndex, Number($("#raidBuffLightboxStartTimeInput").val()), Number($("#raidBuffLightboxStartTimeInput").val()) + Number($("#raidBuffLightboxDuration").val()), coda/*, royalRoad, celestialOpposition, timeDilation, emboldenStacks*/);
    // if (title === "The Balance" || title === "The Spear" || title === "The Arrow" || title === "Fey Wind") {
    //     updateGcdTimeline();
    //     updateRotationAfterIndex(0);
    // }
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
});

$.widget("custom.iconselectmenu", $.ui.selectmenu, {
    _renderItem: function(ul, item) {
        var li = $("<li>"),
        wrapper = $("<div>", { text: item.label });

        if (item.disabled)
            li.addClass("ui-state-disabled");

        $("<span>", {
            style: item.element.attr("data-style"),
            "class": "ui-icon " + item.element.attr("data-class")
        }).appendTo(wrapper);

        return li.append(wrapper).appendTo(ul);
    },

    _renderButtonItem: function(item) {
        var buttonItem = $("<span>", { "class": "ui-selectmenu-text" });
        this._setText(buttonItem, item.label);

        $("<span>", {
            style: item.element.attr( "data-style" ),
            "class": "ui-icon " + item.element.attr( "data-class" )
        }).appendTo( buttonItem );

        return buttonItem;
    }
});

for (i = 0; i < 6; i++) {
    $("#group").append($("#group tr").get(1).cloneNode(true));
}

$("#group tr td select").each(function() {
    $(this).iconselectmenu({ change: function(event, data) {
        refreshGroupMember($("#group tr td select").index($(event.target)), data.item.value);
}}).iconselectmenu("menuWidget").addClass("ui-menu-icons customicons"); });

var savedComp = standardComp;
if (localStorage["partyComp"])
    savedComp = JSON.parse(localStorage["partyComp"]);
for (i = 0; i < 7; i++) {
    $("#group tr td select").eq(i).val(savedComp[i]);
    $("#group tr td select").eq(i).iconselectmenu("refresh");
    var rectTop = $("#group .ui-selectmenu-button").get(i).getBoundingClientRect().top + $("#group .ui-selectmenu-button").get(i).getBoundingClientRect().height + 3 + 8;
    $("#group tr td select").eq(i).iconselectmenu("menuWidget").css({"max-height": `calc(100vh - ${rectTop}px)`, "min-height": "100px"});
    refreshGroupMember(i, savedComp[i]);
}

$(".checkboxButton").each((idx, elt) => addTooltip(elt, "checkboxButton"));
$(".clearGroupButton").each((idx, elt) => addTooltip(elt, "clearGroupButton"));

$("#suggestions").draggable({cancel: ".action", containment: "parent"});

function effectRemainingAt(name, time) {
    var result = 0;
    $("#effects").children(`[name="${name}"]`).each((idx,elt) => { if (Number($(elt).attr("endTime")) > time && Number($(elt).attr("time")) <= time) result = Number($(elt).attr("endTime")) - time;});
    return result;
}

function isEffectUpAt(name, time) {
    return effectRemainingAt(name, time) > 0;
}

function botDRemainingAt(type, time) {
    var result = 0;
    $("#botd").children(`[name="${type}"]`).each((idx,elt) => { if (Number($(elt).attr("endTime")) > time && Number($(elt).attr("time")) <= time) result = Number($(elt).attr("endTime")) - time;});
    return result;
}

function isBotDUpAt(type, time) {
    return botDRemainingAt(type, time) > 0;
}

function isWwtReadyAt(time) {
    var result = false;
    $("#fifo").children(`[name="scale2"]`).each((idx,elt) => { if (Number($(elt).attr("endTime")) > time && Number($(elt).attr("time")) <= time) result = true;});
    return result;
}

function cdAt(name, time) {
    var result = 0;

    var charges = getCharges(name);
    var cds = $("#cds").children(`[name="${name}"]`);
    if (cds.length >= charges) {
        var nextUse = cds.eq(-charges);
        if (Number($(nextUse).attr("time")) > time)
            result = Number($(nextUse).attr("time")) - time;
    }

    return result;
}

function isOffCdAt(name, time) {
    return cdAt(name, time) <= 0;
}

function addSuggestion(name, type, value) {
    var action = actions.find(ac => name === ac.name);
    var target = $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).get(0);
    var clonedElement = target.cloneNode(true);
    var actionImg = $(clonedElement).children(".actionImage").get(0);
    dndHandler.applyActionsEvents(clonedElement, "suggestion");
    $("#suggestions").append(clonedElement);

    if (type) {
        var ovTxt = $(`<div>${value ? (value > 10 ? value.toFixed(1) : value.toFixed(2)) : ""}</div>`);
        ovTxt.addClass("suggestionsOverlayText");
        var ovDiv = $("<div></div>");
        ovDiv.addClass("suggestionsOverlay");

        switch (type) {
            case "cooldown":
                $(clonedElement).append(ovDiv);
                $(clonedElement).append(ovTxt);
                break;
            case "cooldownEnd":
                $(clonedElement).append(ovDiv);
                ovTxt.css("color", "lime");
                $(clonedElement).append(ovTxt);
                break;
            case "clipping":
                ovDiv.css("background-color", "red");
                $(clonedElement).append(ovDiv);
                break;
            case "active":
                ovDiv.css("background-color", "white");
                $(clonedElement).append(ovDiv);
                ovTxt.css("color", "orange");
                $(clonedElement).append(ovTxt);
                break;
            case "activeEnd":
                ovDiv.css("background-color", "white");
                $(clonedElement).append(ovDiv);
                ovTxt.css("color", "red");
                $(clonedElement).append(ovTxt);
                break;
            default:
                break;
        }
    }
}

function resetSuggestions() {
    $("#suggestions").children(".action").remove();
}

function updateSuggestions() {
    resetSuggestions();
    
    var lastAc = $("#rotation").children().last();
    var lastWs = $("#rotation").children(".Weaponskill").last();
    var currentTime = 0;
    // Start with end of anim lock of last action
    if (lastAc.length)
        currentTime = (Number(lastAc.attr("time")) * 1000 + getAnimationLock(lastAc.attr("name")) * 1000) / 1000;

    // if (!isBotDUpAt("blood", currentTime) && !isBotDUpAt("life", currentTime))
    //     addSuggestion("Blood of the Dragon");

    var nextGcdTime = 0;
    if (lastWs.length) {
        var lastWsTime = Number(lastWs.attr("time"));
        // Adjusting for clipping
        nextGcdTime = Math.max(currentTime, (lastWsTime * 1000 + gcdAt(lastWsTime) * 1000) / 1000);
        if (isEffectUpAt("Draconian Fire", nextGcdTime))
            addSuggestion("Raiden Thrust");
        else if (lastWs.attr("name") === "Wheeling Thrust" || lastWs.attr("name") === "Fang and Claw")
            addSuggestion("Drakesbane");
        else if (lastWs.attr("name") === "Chaotic Spring")
            addSuggestion("Wheeling Thrust");
        else if (lastWs.attr("name") === "Heavens' Thrust")
            addSuggestion("Fang and Claw");
        else if (lastWs.attr("name") === "Spiral Blow")
            addSuggestion("Chaotic Spring");
        else if (lastWs.attr("name") === "Lance Barrage")
            addSuggestion("Heavens' Thrust");
        else if (lastWs.attr("name") === "True Thrust" || lastWs.attr("name") === "Raiden Thrust") {
            if (isEffectUpAt("Power Surge", nextGcdTime + 4 * gcdAt(nextGcdTime)))
                addSuggestion("Lance Barrage");
            else
                addSuggestion("Spiral Blow");
        } else
            addSuggestion("True Thrust");
    } else {
        addSuggestion("True Thrust");
    }

    ["Lance Charge", "Battle Litany", "Geirskogul", "Nastrond", "Stardiver", "Starcross", "High Jump", "Mirage Dive", "Dragonfire Dive", "Rise of the Dragon", "Wyrmwind Thrust", "Life Surge", "Potion"].forEach(elt => {
        var latestTime = nextGcdTime - getAnimationLock(elt);
        var cdAtCurrentTime = cdAt(elt, currentTime);
        var displayCD = 5;
        if (elt === "Battle Litany" || elt === "Geirskogul" || elt === "Lance Charge" || elt === "Potion")
            displayCD = 20;
        if (elt === "Stardiver" && !isBotDUpAt("life", cdAtCurrentTime + currentTime))
            return;
        if (elt === "Nastrond" && !isEffectUpAt("Nastrond Ready", currentTime))
            return;
        if (elt === "Mirage Dive" && !isEffectUpAt("Dive Ready", currentTime))
            return;
        if (elt === "Rise of the Dragon" && !isEffectUpAt("Dragon's Flight", currentTime))
            return;
        if (elt === "Starcross" && !isEffectUpAt("Starcross Ready", currentTime))
            return;
        if (elt === "Wyrmwind Thrust" && !isWwtReadyAt(cdAtCurrentTime + currentTime))
            return;
        if (isOffCdAt(elt, latestTime)) { // Available in this GCD
            var remainingTime;
            if (elt === "Life Surge" && $("#suggestions").children(`[name="Heavens' Thrust"], [name="Drakesbane"]`).length === 0)
                return;
            if (elt === "Stardiver")
                remainingTime = botDRemainingAt("life", currentTime);
            else if (elt === "Nastrond")
                remainingTime = effectRemainingAt("Nastrond Ready", currentTime);
            else if (elt === "Mirage Dive")
                remainingTime = effectRemainingAt("Dive Ready", currentTime);
            else if (elt === "Rise of the Dragon")
                remainingTime = effectRemainingAt("Dragon's Flight", currentTime);
            else if (elt === "Starcross")
                remainingTime = effectRemainingAt("Starcross Ready", currentTime);
            if (isOffCdAt(elt, currentTime)) { // Available now
                if (remainingTime < longAnimLock) // Active buff ends very soon
                        addSuggestion(elt, "activeEnd", remainingTime);
                else if (latestTime >= currentTime || currentTime === 0) { // No clipping (time and eyes)
                    if (remainingTime < 5) // Active buff ends soon
                        addSuggestion(elt, "active", remainingTime);
                    else
                        addSuggestion(elt);
                } else
                    addSuggestion(elt, "clipping");
            } else // Available after small delay
                addSuggestion(elt, "cooldownEnd", cdAtCurrentTime);
        } else if (cdAtCurrentTime > 0 && cdAtCurrentTime <= displayCD) // Available soon
            addSuggestion(elt, "cooldown", cdAtCurrentTime);
        else if (cdAtCurrentTime === 0) // Off CD during last oGCD while clipping
            addSuggestion(elt, "clipping");
    });
    
    var titleWidth = $("#suggestionsTitle").get(0).getBoundingClientRect().width;
    var boxWidth = $("#suggestions").get(0).getBoundingClientRect().width;
    if (boxWidth <= titleWidth) {
        $("#suggestions").css({"min-width": `${titleWidth - (boxWidth - $("#suggestions").width())}px`, "border-top-right-radius": "0px"});
    } else {
        $("#suggestions").css({"border-top-right-radius": ""});
    }
}

$("#suggestions").css({"left": `${$("#scrollableDiv").get(0).getBoundingClientRect().left+$("#scrollableDiv").get(0).getBoundingClientRect().width/2-$("#suggestions").get(0).getBoundingClientRect().width/2}px`});

updateSuggestions();

$("#suggestions").css({"top": `${$("#mainDiv").get(0).getBoundingClientRect().height+$("#mainDiv").get(0).getBoundingClientRect().top-$("#suggestions").get(0).getBoundingClientRect().height}px`});

function autoFillSingleRaidBuff(name, jobIndex) {
    if ($("#rotation").children().length === 0)
        return 0;
    var rotationTime = Number($("#rotation").children().last().attr("time"));
    var loopCount = 0;
    var effectName = groupActions.find(ac => ac.name === name).effects[0];
    
    // var emboldenEffect;
    // if (name === "Embolden")
    //     emboldenEffect = effects.find(ef => ef.name === "Embolden");
    
    while (true) {
        var coda;
        // var royalRoad;
        // var celestialOpposition;
        // var timeDilation;
        // var emboldenStacks;
        var previousEffects = $("#groupEffects").children(`[name="${effectName}"][jobIndex="${jobIndex}"]`);
        // if (name === "Embolden")
        //     previousEffects = previousEffects.filter((idx, ef) => {return Number($(ef).attr("emboldenStacks")) === emboldenEffect.maxStacks});
        var useNumber = previousEffects.length;
        var useTime = getGroupOpenerTime(name);
        var duration = getEffectDuration(effectName, useNumber);
        if (useNumber > 0) {
            if (name === "Draw" || name === "Fey Wind" || name === "Radiant Shield") // Only use in opener
                break;
            previousEffects = previousEffects.sort((a, b) => {return Number($(a).attr("time")) - Number($(b).attr("time"))});
            useTime = Number(previousEffects.last().attr("time")) + getGroupRecastTime(name, useNumber - 1);
        }
        if (useTime > rotationTime + 5)
            break;
        
        // if (name === "Draw") {
        //     royalRoad = "Expanded";
        //     celestialOpposition = true;
        //     duration += 10;
        //     timeDilation = false;
        // }
        
        if (name === "Radiant Finale") {
            coda = (useNumber == 0 ? 1 : 3);
        }
        // if (name === "Embolden") {
        //     var beginTime = useTime;
        //     emboldenStacks = emboldenEffect.maxStacks;
        //     while (emboldenStacks > 0) {
        //         drawGroupEffect(effectName, jobIndex, beginTime, beginTime + emboldenEffect.stackDuration, royalRoad, celestialOpposition, timeDilation, emboldenStacks);
        //         beginTime += emboldenEffect.stackDuration;
        //         emboldenStacks--;
        //     }
        // } else
            drawGroupEffect(effectName, jobIndex, useTime, useTime + duration, coda/*, royalRoad, celestialOpposition, timeDilation, emboldenStacks*/);
        loopCount++;
    }
    
    // if (loopCount > 0 && (effectName === "The Balance" || effectName === "The Spear" || effectName === "The Arrow" || effectName === "Fey Wind")) {
    //     updateGcdTimeline();
    //     updateRotationAfterIndex(0);
    // }
    return loopCount;
}

function autoFillRaidBuffsOfJob(jobIndex, update) {
    if ($("#rotation").children().length === 0)
        return 0;
    var loopCount = 0;
    $("#groupEffectsHeader").children(`[jobIndex="${jobIndex}"]`).each(function() {
        loopCount += autoFillSingleRaidBuff($(this).attr("name"), jobIndex);
    });
    
    if (loopCount > 0 && update)
        resetAndUpdateDps();
    return loopCount;
}

function autoFillRaidBuffs(update) {
    if ($("#rotation").children().length === 0)
        return;
    var loopCount = 0;
    $("#groupEffectsHeader").children().each(function() {
        if ($(".checkboxButton:not(#raidBuffAuto)").children("input").eq(Number($(this).attr("jobIndex"))).prop("checked"))
            loopCount += autoFillSingleRaidBuff($(this).attr("name"), Number($(this).attr("jobIndex")));
    });
    
    if (loopCount > 0 && update)
        resetAndUpdateDps();
}

function changeCheckboxButton(element, action) {
    $(element).children("i").removeClass("check minus");
    switch(action) {
        case "check":
            $(element).children("input").prop("checked", true);
            $(element).children("input").prop("indeterminate", false);
            $(element).children("i").addClass("check");
            break;
        case "uncheck":
            $(element).children("input").prop("checked", false);
            $(element).children("input").prop("indeterminate", false);
            break;
        case "toggle":
            $(element).children("input").prop("checked", !$(element).children("input").prop("checked"));
            $(element).children("input").prop("indeterminate", false);
            if ($(element).children("input").prop("checked"))
                $(element).children("i").addClass("check");
            break;
        default: // indeterminate
            $(element).children("input").prop("checked", false);
            $(element).children("input").prop("indeterminate", true);
            $(element).children("i").addClass("minus");
            break;
    }
}

$(".checkboxButton").click(function(event) {
    if ($(this).attr("id") === "raidBuffAuto") {
        changeCheckboxButton(this, "toggle");
        
        $(this).attr("checkCount", $(this).children("input").prop("checked") ? 7 : 0);
        $(".checkboxButton:not(#raidBuffAuto)").each((idx, elt) => {changeCheckboxButton(elt, $(this).children("input").prop("checked") ? "check" : "uncheck");});
        
        if ($(this).children("input").prop("checked"))
            autoFillRaidBuffs(true);
    } else {
        changeCheckboxButton(this, "toggle");
        if ($(this).children("input").prop("checked")) {
            $("#raidBuffAuto").attr("checkCount", Number($("#raidBuffAuto").attr("checkCount")) + 1);
            autoFillRaidBuffsOfJob($(".checkboxButton:not(#raidBuffAuto)").index(this), true);
        } else
            $("#raidBuffAuto").attr("checkCount", Number($("#raidBuffAuto").attr("checkCount")) - 1);
        
        if (Number($("#raidBuffAuto").attr("checkCount")) === 0)
            changeCheckboxButton($("#raidBuffAuto").get(0), "uncheck");
        else if (Number($("#raidBuffAuto").attr("checkCount")) === 7)
            changeCheckboxButton($("#raidBuffAuto").get(0), "check");
        else
            changeCheckboxButton($("#raidBuffAuto").get(0), "indeterminate");
    }
});

$(".clearGroupButton").click(function(event) {
    var updateSpeed = false;
    var groupEffectsChildren;
    if ($(this).attr("id") === "raidBuffClear") {
        groupEffectsChildren = $("#groupEffects").children();
    } else {
        groupEffectsChildren = $("#groupEffects").children(`[jobIndex=${$(".clearGroupButton:not(#raidBuffClear)").index(this)}]`);
    }
    groupEffectsChildren.each(function() {
        if (!updateSpeed && ($(this).attr("name") === "The Balance" || $(this).attr("name") === "The Spear" || $(this).attr("name") === "The Arrow" || $(this).attr("name") === "Fey Wind"))
            updateSpeed = true;
        $(this).remove();
    });
    if (updateSpeed) {
        updateGcdTimeline();
        updateRotationAfterIndex(0);
    }
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
});

$("#WDin").change();
$("#STRin").change();
$("#DHin").change();
$("#CRITin").change();
$("#DETin").change();
$("#SKSin").change();
clearRotation();

if (localStorage["LoadingRotation"]) {
    loadRotation(JSON.parse(localStorage[localStorage["LoadingRotation"]]));
    localStorage.removeItem("LoadingRotation");
}

var pathList = window.location.pathname.split("/");
var urlPathName = pathList[pathList.length - 1];
if (urlPathName.length === 4) {
    $.post(`/${urlPathName}`, function(data) {
        loadRotation(data);
    });
}

function gcdAt(time) {
    if (gcdTimeline === undefined || gcdTimeline.length <= 0 || time < gcdTimeline[0].time)
        return Number($("#SKSoutGCD").val());
    var idx = 0;
    while (gcdTimeline[idx] !== undefined && gcdTimeline[idx].time <= time) { idx++; }
    return gcdTimeline[idx - 1].gcd;
}

function updateGcdTimeline() { // Do not call during history generation
    gcdTimeline = [];
    var tempStats = stats.copy(); // This will copy buffs if any is active
    if (tempStats.activeEffects.length !== 0)
        console.log("Active buff found, this might induce errors");
    generateGcdTimeline(gcdTimeline, tempStats, $("#groupEffects").children("[name='The Balance'], [name='The Spear'], [name='The Arrow'], [name='Fey Wind']"));
}

function generateCritValues() {
    var oldCrit = stats.crit;
    var dps = [];
    var result = [];
    var critMod;
    for (var i = stats.lvlModSub; i <= 5000; i++) {
        stats.crit = i;
        if (stats.critMod() !== critMod) {
            critMod = stats.critMod();
            RotationHistory = [];
            generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
        }
        var actionEvents = RotationHistory.filter(e => e.type === "action");
        dps.push(actionEvents[actionEvents.length - 1].dps);
    }
    for (var i = 0; i <= 5000 - stats.lvlModSub; i++) {
        result.push(dps[i] / dps[0]);
    }
    stats.crit = oldCrit;
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    return result;
}

function generateDhValues() {
    var oldDh = stats.dh;
    var dps = [];
    var result = [];
    var dhMod;
    for (var i = stats.lvlModSub; i <= 5000; i++) {
        stats.dh = i;
        if (stats.dhMod() !== dhMod) {
            dhMod = stats.dhMod();
            RotationHistory = [];
            generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
        }
        var actionEvents = RotationHistory.filter(e => e.type === "action");
        dps.push(actionEvents[actionEvents.length - 1].dps);
    }
    for (var i = 0; i <= 5000 - stats.lvlModSub; i++) {
        result.push(dps[i] / dps[0]);
    }
    stats.dh = oldDh;
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    return result;
}

function generateStrValues() {
    var oldStr = stats.str;
    var dps = [];
    var result = [];
    for (var i = stats.lvlModMain; i <= 8000; i++) {
        stats.str = i;
        RotationHistory = [];
        generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
        var actionEvents = RotationHistory.filter(e => e.type === "action");
        dps.push(actionEvents[actionEvents.length - 1].dps);
    }
    for (var i = 0; i <= 8000 - stats.lvlModMain; i++) {
        result.push(dps[i] / dps[0]);
    }
    stats.str = oldStr;
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    return result;
}

function generateSksValues(gcdMin, gcdMax) { // Use correct str value, impacted by potion otherwise
    if (!gcdMax) {
        if (!gcdMin) {
            gcdMin = stats.gcd();
            gcdMax = stats.gcd();
        } else
            gcdMax = gcdMin;
    }
    // var gcdValue = stats.gcd();
    var critValues;
    var dhValues;
    var oldCrit = stats.crit;
    var oldDh = stats.dh;
    var oldDet = stats.det;
    var oldSks = stats.sks;
    stats.crit = stats.lvlModSub;
    stats.dh = stats.lvlModSub;
    stats.det = stats.lvlModMain;
    
    var result = [];
    var lastSksMod;
    var lastGcd;
    var initSks;
    for (var i = stats.lvlModSub; i <= 5000; i++) {
        stats.sks = i;
        curGcd = stats.gcd();
        if (curGcd <= gcdMin && curGcd >= gcdMax) {
            if (!lastSksMod)
                initSks = i;
            if (curGcd !== lastGcd) {
                lastGcd = curGcd;
                console.log(curGcd);
                $("#SKSoutGCD").val(curGcd);
                updateGcdTimeline();
                loadRotation(JSON.parse(localStorage[(curGcd).toFixed(2)]));
                stats.crit = stats.lvlModSub;
                stats.dh = stats.lvlModSub;
                stats.det = stats.lvlModMain;
                stats.sks = i;
                // critValues = generateCritValues();
                // dhValues = generateDhValues();
            }
            if (stats.sksMod() !== lastSksMod) {
                lastSksMod = stats.sksMod();
                // console.log(lastSksMod);
                RotationHistory = [];
                generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
            }
            var actionEvents = RotationHistory.filter(e => e.type === "action");
            var lastEvent = actionEvents[actionEvents.length - 1];
            var sksValue = (lastEvent.aaDps / stats.aaMod() + (lastEvent.dps - lastEvent.aaDps) / stats.wdMod()) / stats.strMod();
            result.push(sksValue);
        }
    }
    // console.log(result);
    
    stats.crit = oldCrit;
    stats.dh = oldDh;
    stats.det = oldDet;
    stats.sks = oldSks;
    $("#SKSoutGCD").val(stats.gcd());
    updateGcdTimeline();
    if ($("#rotation").children().length > 0)
        updateRotationAfterIndex(0);
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    // Divide by everything but sks mod, use base value for substats
    // (%aa * aamod + (1-%aa) * wdmod) * strmod * critvalue * detmod * dhmod * sksvalue
    // var expectedDps = sksValue * ((lastEvent.aaDps / lastEvent.dps) * stats.aaMod() + (1 - (lastEvent.aaDps / lastEvent.dps)) * stats.wdMod()) * stats.strMod() * stats.detMod() * critValues[stats.crit - stats.lvlModSub] * dhValues[stats.dh - stats.lvlModSub];
    // console.log(expectedDps);
    console.log("initSks: " + initSks);
    console.log(JSON.stringify(result).replace(/,/g, "\n").replace(/\[/g, "").replace(/\]/g, ""));
    return { gcdMin: gcdMin, gcdMax: gcdMax, initSks: initSks, sksValues: result};
}

function getAdjustedDpsAt(cutTime) {

    var avgGcdDps = stats.actionDamage(actions.find(ac => "Raiden Thrust" === ac.name).potency
                                     + actions.find(ac => "Spiral Blow" === ac.name).potency
                                     + actions.find(ac => "Chaotic Spring" === ac.name).potency
                                     + actions.find(ac => "Wheeling Thrust" === ac.name).potency
                                     + actions.find(ac => "Drakesbane" === ac.name).potency
                                     + actions.find(ac => "Raiden Thrust" === ac.name).potency
                                     + actions.find(ac => "Lance Barrage" === ac.name).potency
                                     + actions.find(ac => "Heavens' Thrust" === ac.name).potency
                                     + actions.find(ac => "Fang and Claw" === ac.name).potency
                                     + actions.find(ac => "Drakesbane" === ac.name).potency)
                    * effects.find(ef => "Power Surge" === ef.name).value / (10 * stats.gcd());
    
    // Damage from buffs
    var LCEffect = effects.find(ef => ef.name === "Lance Charge");
    var LCValue = LCEffect.value;
    var LotDEffect = effects.find(ef => ef.name === "Life of the Dragon");
    var LotDValue = LotDEffect.value;
    // var DSEffect = effects.find(ef => ef.name === "Right Eye");
    // var DSValue = DSEffect.value;
    var BLEffect = effects.find(ef => ef.name === "Battle Litany");
    var BLValue = BLEffect.value;
    // Without
    LCEffect.value = 1;
    LotDEffect.value = 1;
    // DSEffect.value = 1;
    BLEffect.value = 0;
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    var unbuffedGcdDamage = RotationHistory[RotationHistory.length - 1].gcdDps * RotationHistory[RotationHistory.length - 1].time;
    var unbuffedOgcdDamage = RotationHistory[RotationHistory.length - 1].oGcdDps * RotationHistory[RotationHistory.length - 1].time;
    var unbuffedDotDamage = RotationHistory[RotationHistory.length - 1].dotDps * RotationHistory[RotationHistory.length - 1].time;
    var unbuffedAaDamage = RotationHistory[RotationHistory.length - 1].aaDps * RotationHistory[RotationHistory.length - 1].time;
    var unbuffedDamage = RotationHistory[RotationHistory.length - 1].cumulDamage;
    // LC
    LCEffect.value = LCValue;
    LotDEffect.value = 1;
    // DSEffect.value = 1;
    BLEffect.value = 0;
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    var LCGcdGain = RotationHistory[RotationHistory.length - 1].gcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedGcdDamage;
    var LCOgcdGain = RotationHistory[RotationHistory.length - 1].oGcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedOgcdDamage;
    var LCDotGain = RotationHistory[RotationHistory.length - 1].dotDps * RotationHistory[RotationHistory.length - 1].time - unbuffedDotDamage;
    var LCAaGain = RotationHistory[RotationHistory.length - 1].aaDps * RotationHistory[RotationHistory.length - 1].time - unbuffedAaDamage;
    var LCGain = RotationHistory[RotationHistory.length - 1].cumulDamage - unbuffedDamage; // / $("#rotation").children("[name='Lance Charge']").length;
    // LotD
    LCEffect.value = 1;
    LotDEffect.value = LotDValue;
    // DSEffect.value = 1;
    BLEffect.value = 0;
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    var LotDGcdGain = RotationHistory[RotationHistory.length - 1].gcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedGcdDamage;
    var LotDOgcdGain = RotationHistory[RotationHistory.length - 1].oGcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedOgcdDamage;
    var LotDDotGain = RotationHistory[RotationHistory.length - 1].dotDps * RotationHistory[RotationHistory.length - 1].time - unbuffedDotDamage;
    var LotDAaGain = RotationHistory[RotationHistory.length - 1].aaDps * RotationHistory[RotationHistory.length - 1].time - unbuffedAaDamage;
    var LotDGain = RotationHistory[RotationHistory.length - 1].cumulDamage - unbuffedDamage; // / $("#rotation").children("[name='Geirskogul']").length;
    // DS
    // LCEffect.value = 1;
    // DSEffect.value = DSValue;
    // BLEffect.value = 0;
    // RotationHistory = [];
    // generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    // var DSGcdGain = RotationHistory[RotationHistory.length - 1].gcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedGcdDamage;
    // var DSOgcdGain = RotationHistory[RotationHistory.length - 1].oGcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedOgcdDamage;
    // var DSDotGain = RotationHistory[RotationHistory.length - 1].dotDps * RotationHistory[RotationHistory.length - 1].time - unbuffedDotDamage;
    // var DSAaGain = RotationHistory[RotationHistory.length - 1].aaDps * RotationHistory[RotationHistory.length - 1].time - unbuffedAaDamage;
    // var DSGain = RotationHistory[RotationHistory.length - 1].cumulDamage - unbuffedDamage; // / $("#rotation").children("[name='Dragon Sight']").length;
    // BL
    LCEffect.value = 1;
    LotDEffect.value = 1;
    // DSEffect.value = 1;
    BLEffect.value = BLValue;
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    var BLGcdGain = RotationHistory[RotationHistory.length - 1].gcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedGcdDamage;
    var BLOgcdGain = RotationHistory[RotationHistory.length - 1].oGcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedOgcdDamage;
    var BLDotGain = RotationHistory[RotationHistory.length - 1].dotDps * RotationHistory[RotationHistory.length - 1].time - unbuffedDotDamage;
    var BLAaGain = RotationHistory[RotationHistory.length - 1].aaDps * RotationHistory[RotationHistory.length - 1].time - unbuffedAaDamage;
    var BLGain = RotationHistory[RotationHistory.length - 1].cumulDamage - unbuffedDamage; // / $("#rotation").children("[name='Battle Litany']").length;
    // All
    LCEffect.value = LCValue;
    LotDEffect.value = LotDValue;
    // DSEffect.value = DSValue;
    BLEffect.value = BLValue;
    RotationHistory = [];
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    var allBuffsGcdGain = RotationHistory[RotationHistory.length - 1].gcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedGcdDamage;
    var allBuffsOgcdGain = RotationHistory[RotationHistory.length - 1].oGcdDps * RotationHistory[RotationHistory.length - 1].time - unbuffedOgcdDamage;
    var allBuffsDotGain = RotationHistory[RotationHistory.length - 1].dotDps * RotationHistory[RotationHistory.length - 1].time - unbuffedDotDamage;
    var allBuffsAaGain = RotationHistory[RotationHistory.length - 1].aaDps * RotationHistory[RotationHistory.length - 1].time - unbuffedAaDamage;
    var allBuffsGain = RotationHistory[RotationHistory.length - 1].cumulDamage - unbuffedDamage;

    var LCGcdDamage = (LCGcdGain + LCGcdGain / (LCGcdGain + LotDGcdGain + BLGcdGain) * (allBuffsGcdGain - (LCGcdGain + LotDGcdGain + BLGcdGain))) / $("#rotation").children("[name='Lance Charge']").length;
    var LCOgcdDamage = (LCOgcdGain + LCOgcdGain / (LCOgcdGain + LotDOgcdGain + BLOgcdGain) * (allBuffsOgcdGain - (LCOgcdGain + LotDOgcdGain + BLOgcdGain))) / $("#rotation").children("[name='Lance Charge']").length;
    var LCDotDamage = (LCDotGain + LCDotGain / (LCDotGain + LotDDotGain + BLDotGain) * (allBuffsDotGain - (LCDotGain + LotDDotGain + BLDotGain))) / $("#rotation").children("[name='Lance Charge']").length;
    var LCAaDamage = (LCAaGain + LCAaGain / (LCAaGain + LotDAaGain + BLAaGain) * (allBuffsAaGain - (LCAaGain + LotDAaGain + BLAaGain))) / $("#rotation").children("[name='Lance Charge']").length;
    var LCDamage = (LCGain + LCGain / (LCGain + LotDGain + BLGain) * (allBuffsGain - (LCGain + LotDGain + BLGain))) / $("#rotation").children("[name='Lance Charge']").length;

    var LotDGcdDamage = (LotDGcdGain + LotDGcdGain / (LCGcdGain + LotDGcdGain + BLGcdGain) * (allBuffsGcdGain - (LCGcdGain + LotDGcdGain + BLGcdGain))) / $("#rotation").children("[name='Geirskogul']").length;
    var LotDOgcdDamage = (LotDOgcdGain + LotDOgcdGain / (LCOgcdGain + LotDOgcdGain + BLOgcdGain) * (allBuffsOgcdGain - (LCOgcdGain + LotDOgcdGain + BLOgcdGain))) / $("#rotation").children("[name='Geirskogul']").length;
    var LotDDotDamage = (LCDotGain + LCDotGain / (LCDotGain + LotDDotGain + BLDotGain) * (allBuffsDotGain - (LCDotGain + LotDDotGain + BLDotGain))) / $("#rotation").children("[name='Geirskogul']").length;
    var LotDAaDamage = (LotDAaGain + LotDAaGain / (LCAaGain + LotDAaGain + BLAaGain) * (allBuffsAaGain - (LCAaGain + LotDAaGain + BLAaGain))) / $("#rotation").children("[name='Geirskogul']").length;
    var LotDDamage = (LotDGain + LotDGain / (LCGain + LotDGain + BLGain) * (allBuffsGain - (LCGain + LotDGain + BLGain))) / $("#rotation").children("[name='Geirskogul']").length;
    
    // var DSGcdDamage = (DSGcdGain + DSGcdGain / (LCGcdGain + DSGcdGain + BLGcdGain) * (allBuffsGcdGain - (LCGcdGain + DSGcdGain + BLGcdGain))) / $("#rotation").children("[name='Dragon Sight']").length;
    // var DSOgcdDamage = (DSOgcdGain + DSOgcdGain / (LCOgcdGain + DSOgcdGain + BLOgcdGain) * (allBuffsOgcdGain - (LCOgcdGain + DSOgcdGain + BLOgcdGain))) / $("#rotation").children("[name='Dragon Sight']").length;
    // var DSDotDamage = (DSDotGain + DSDotGain / (LCDotGain + DSDotGain + BLDotGain) * (allBuffsDotGain - (LCDotGain + DSDotGain + BLDotGain))) / $("#rotation").children("[name='Dragon Sight']").length;
    // var DSAaDamage = (DSAaGain + DSAaGain / (LCAaGain + DSAaGain + BLAaGain) * (allBuffsAaGain - (LCAaGain + DSAaGain + BLAaGain))) / $("#rotation").children("[name='Dragon Sight']").length;
    // var DSDamage = (DSGain + DSGain / (LCGain + DSGain + BLGain) * (allBuffsGain - (LCGain + DSGain + BLGain))) / $("#rotation").children("[name='Dragon Sight']").length;
    
    var BLGcdDamage = (BLGcdGain + BLGcdGain / (LCGcdGain + LotDGcdGain + BLGcdGain) * (allBuffsGcdGain - (LCGcdGain + LotDGcdGain + BLGcdGain))) / $("#rotation").children("[name='Battle Litany']").length;
    var BLOgcdDamage = (BLOgcdGain + BLOgcdGain / (LCOgcdGain + LotDOgcdGain + BLOgcdGain) * (allBuffsOgcdGain - (LCOgcdGain + LotDOgcdGain + BLOgcdGain))) / $("#rotation").children("[name='Battle Litany']").length;
    var BLDotDamage = (BLDotGain + BLDotGain / (LCDotGain + LotDDotGain + BLDotGain) * (allBuffsDotGain - (LCDotGain + LotDDotGain + BLDotGain))) / $("#rotation").children("[name='Battle Litany']").length;
    var BLAaDamage = (BLAaGain + BLAaGain / (LCAaGain + LotDAaGain + BLAaGain) * (allBuffsAaGain - (LCAaGain + LotDAaGain + BLAaGain))) / $("#rotation").children("[name='Battle Litany']").length;
    var BLDamage = (BLGain + BLGain / (LCGain + LotDGain + BLGain) * (allBuffsGain - (LCGain + LotDGain + BLGain))) / $("#rotation").children("[name='Battle Litany']").length;

    var damageToRemove = 0;
    var remove = false;
    var removeTime;
    var actionEvents = RotationHistory.filter(e => e.type === "action" && getType(e.name) === "Weaponskill" && e.time < cutTime);
    var lastGcds = actionEvents.filter((ac, idx) => {
        return idx >= actionEvents.length - 10;
    });
    lastGcds.forEach((ac, idx) => {
        if (remove)
            damageToRemove += ac.actionDamage;
        else if (ac.name === "Drakesbane" && (idx > 0 && lastGcds[idx - 1].name === "Fang and Claw" || lastGcds[idx + 2].name === "Spiral Blow")) {
            remove = true;
            removeTime = ac.time + stats.gcd();
        }
    });
    var lastAc = lastGcds[lastGcds.length - 1];
    var adjustedGcdDamage = lastAc.gcdDps * lastAc.time - damageToRemove + (cutTime - removeTime) * avgGcdDps;
    var adjustedOgcdDamage = lastAc.oGcdDps * lastAc.time;
    var adjustedDotDamage = lastAc.dotDps * lastAc.time + (cutTime - lastAc.time) * (lastAc.dotTick / 3);
    var adjustedAaDamage = lastAc.aaDps * lastAc.time + (cutTime - lastAc.time) * (lastAc.aaTick / stats.wDelay);
    var adjustedDamage = lastAc.cumulDamage - damageToRemove
                       + (cutTime - removeTime) * avgGcdDps
                       + (cutTime - lastAc.time) * (lastAc.aaTick / stats.wDelay + lastAc.dotTick / 3);

    // Abilities penalties
    var abilitiesToCheck = ["High Jump", "Dragonfire Dive", "Geirskogul", "Lance Charge", "Battle Litany"];
    // var onCdAbilities = $("#cds").children().filter((idx, ac) => { return Number($(ac).attr("time")) > cutTime; });
    var onCdAbilities = [];
    abilitiesToCheck.forEach((ab, idx) => {
        onCdAbilities.push($("#cds").children(`[name="${ab}"]`).sort((a, b) => {return Number($(a).attr("time")) - Number($(b).attr("time"))}).last());
    });
    onCdAbilities.forEach((ac, idx) => {
        var acName = $(ac).attr("name");
        var ACdmg = 0;
        var gcdDamagePenalty = 0;
        var ogcdDamagePenalty = 0;
        var dotDamagePenalty = 0;
        var aaDamagePenalty = 0;
        var damagePenalty = 0;
        switch(acName) {
            case "High Jump":
                var MDdmg = 0;
                $("#rotation").children(`[name="${acName}"]`).each(function(idx) { ACdmg += Number($(this).attr("damage")); });
                ACdmg /= $("#rotation").children(`[name="${acName}"]`).length;
                $("#rotation").children("[name='Mirage Dive']").each(function(idx) { MDdmg += Number($(this).attr("damage")); });
                MDdmg /= $("#rotation").children("[name='Mirage Dive']").length;

                damagePenalty = (ACdmg + MDdmg) * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);

                ogcdDamagePenalty = damagePenalty;
                break;
            // case "Spineshatter Dive":
            case "Dragonfire Dive":
                var RotDdmg = 0;
                $("#rotation").children(`[name="${acName}"]`).each(function(idx) { ACdmg += Number($(this).attr("damage")); });
                ACdmg /= $("#rotation").children(`[name="${acName}"]`).length;
                $("#rotation").children("[name='Rise of the Dragon']").each(function(idx) { RotDdmg += Number($(this).attr("damage")); });
                RotDdmg /= $("#rotation").children("[name='Rise of the Dragon']").length;

                damagePenalty = (ACdmg + RotDdmg) * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                
                ogcdDamagePenalty = damagePenalty;
                break;
            case "Geirskogul":
                var NASdmg = 0;
                var SDdmg = 0;
                var SCdmg = 0;
                $("#rotation").children(`[name="${acName}"]`).each(function(idx) { ACdmg += Number($(this).attr("damage")); });
                ACdmg /= $("#rotation").children(`[name="${acName}"]`).length;
                $("#rotation").children("[name='Nastrond']").each(function(idx) { NASdmg += Number($(this).attr("damage")); });
                NASdmg /= $("#rotation").children("[name='Nastrond']").length;
                $("#rotation").children("[name='Stardiver']").each(function(idx) { SDdmg += Number($(this).attr("damage")); });
                SDdmg /= $("#rotation").children("[name='Stardiver']").length;
                $("#rotation").children("[name='Starcross']").each(function(idx) { SCdmg += Number($(this).attr("damage")); });
                SCdmg /= $("#rotation").children("[name='Starcross']").length;

                damagePenalty = (ACdmg + NASdmg * 3 + SDdmg + SCdmg) * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                
                ogcdDamagePenalty = damagePenalty;

                gcdDamagePenalty = LotDGcdDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                ogcdDamagePenalty += LotDOgcdDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                dotDamagePenalty = LotDDotDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                aaDamagePenalty = LotDAaDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                damagePenalty = LotDDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                break;
            case "Lance Charge":
                gcdDamagePenalty = LCGcdDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                ogcdDamagePenalty = LCOgcdDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                dotDamagePenalty = LCDotDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                aaDamagePenalty = LCAaDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                damagePenalty = LCDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                break;
            // case "Dragon Sight":
            //     gcdDamagePenalty = DSGcdDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
            //     ogcdDamagePenalty = DSOgcdDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
            //     dotDamagePenalty = DSDotDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
            //     aaDamagePenalty = DSAaDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
            //     damagePenalty = DSDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
            case "Battle Litany":
                gcdDamagePenalty = BLGcdDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                ogcdDamagePenalty = BLOgcdDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                dotDamagePenalty = BLDotDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                aaDamagePenalty = BLAaDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                damagePenalty = BLDamage * (Number($(ac).attr("time")) - cutTime) / getRecastTime(acName);
                break;
            default:
                break;
        }
        // console.log(acName);
        // console.log(damagePenalty * getRecastTime(acName) / (Number($(ac).attr("time")) - cutTime));
        // console.log(damagePenalty);
        adjustedGcdDamage -= gcdDamagePenalty;
        adjustedOgcdDamage -= ogcdDamagePenalty;
        adjustedDotDamage -= dotDamagePenalty;
        adjustedAaDamage -= aaDamagePenalty;
        adjustedDamage -= damagePenalty;
    });

    var adjustedGcdDps = adjustedGcdDamage / cutTime;
    var adjustedOgcdDps = adjustedOgcdDamage / cutTime;
    var adjustedDotDps = adjustedDotDamage / cutTime;
    var adjustedAaDps = adjustedAaDamage / cutTime;
    var adjustedDps = adjustedDamage / cutTime;

    // console.log(adjustedGcdDps);
    // console.log((adjustedGcdDps / adjustedDps * 100).toFixed(2)  + "%");
    // console.log(adjustedOgcdDps);
    // console.log((adjustedOgcdDps / adjustedDps * 100).toFixed(2)  + "%");
    // console.log(adjustedDotDps);
    // console.log((adjustedDotDps / adjustedDps * 100).toFixed(2)  + "%");
    // console.log(adjustedAaDps);
    // console.log((adjustedAaDps / adjustedDps * 100).toFixed(2)  + "%");

    // var critValues = generateCritValues();
    
    // var gcdPps = adjustedGcdDps * 100 / stats.wdMod() / stats.strMod() / stats.detMod() / stats.dhMod() / critValues[stats.crit - stats.lvlModSub];
    // var ogcdPps = adjustedOgcdDps * 100 / stats.wdMod() / stats.strMod() / stats.detMod() / stats.dhMod() / critValues[stats.crit - stats.lvlModSub];
    // var dotPps = adjustedDotDps * 100 / stats.wdMod() / stats.strMod() / stats.detMod() / stats.sksMod() / stats.dhMod() / critValues[stats.crit - stats.lvlModSub];
    // var aaPps = adjustedAaDps * 100 / stats.aaMod() / stats.strMod() / stats.detMod() / stats.sksMod() / stats.dhMod() / critValues[stats.crit - stats.lvlModSub];

    // console.log(gcdPps);
    // console.log(ogcdPps);
    // console.log(dotPps);
    // console.log(aaPps);

    return adjustedGcdDps + adjustedOgcdDps + adjustedDotDps + adjustedAaDps;
    // return adjustedDps;
}

function rotationComp() {
    var result = "";
    for (var i = 250; i >= 231; i--) {
        console.log((i/100).toFixed(2));
        loadRotation(eval("rot" + i));
        result += (i/100).toFixed(2) + "\t" + getAdjustedDpsAt(360) + "\n";
    }
    console.log(result);
}

// function verifyQuickDps() {
//     var gcdPps = 197.5301113790231;
//     var ogcdPps = 90.86466283215798;
//     var dotPps = 19.38855748511087;
//     var aaPps = 48.24474676764367;
//     var critValues = generateCritValues();

//     var adjustedGcdDps = gcdPps / 100 * stats.wdMod() * stats.strMod() * stats.detMod() * stats.dhMod() * critValues[stats.crit - stats.lvlModSub];
//     var adjustedOgcdDps = ogcdPps / 100 * stats.wdMod() * stats.strMod() * stats.detMod() * stats.dhMod() * critValues[stats.crit - stats.lvlModSub];
//     var adjustedDotDps = dotPps / 100 * stats.wdMod() * stats.strMod() * stats.detMod() * stats.sksMod() * stats.dhMod() * critValues[stats.crit - stats.lvlModSub];
//     var adjustedAaDps = aaPps / 100 * stats.aaMod() * stats.strMod() * stats.detMod() * stats.sksMod() * stats.dhMod() * critValues[stats.crit - stats.lvlModSub];

//     console.log("Quick Dps:    " + (adjustedGcdDps + adjustedOgcdDps + adjustedDotDps + adjustedAaDps));
//     console.log("Adjusted Dps: " + getAdjustedDpsAt(360));
// }