var raidBuffLightboxJobIndex = 0; // Will have to be passed as a parameter maybe
var raidBuffLightboxEditMode = false;
var raidBuffLightboxEditElement;
// var standardComp = ["nin", "brd", "smn", "sch", "ast", "war", "pld"];
var standardComp = ["nin", "war", "war", "war", "war", "war", "war"];
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
    action.append($("<div></div>").attr("class", "actionImage").css("background-image", `url("images/${ac.name}.png")`));
    $(`#${ac.group}`).append(action);
});

function fitColumns() {
    // TODO : Adjust width of elements inside
    $("#columns").children().each(function(index) {$(this).css("width", $("#headers").children().eq(index).width() + "px");});
    $("#timeline").children().children().each(function(findex) { $(this).css("width", `${$("#columns").get(0).getBoundingClientRect().width-$("#dps").get(0).getBoundingClientRect().width}px`); });
    $("#groupEffects").children().each(function(index) { $(this).css("left", $("#groupEffectsHeader").children(`[name="${effects.find(ef => $(this).attr("name") === ef.name).groupAction}"][jobIndex="${$(this).attr("jobIndex")}"]`).position().left + "px"); });
    $("#scrollableDiv").css("height", `${$("#midDiv").get(0).getBoundingClientRect().height+$("#midDiv").get(0).getBoundingClientRect().top-$("#scrollableDiv").get(0).getBoundingClientRect().top}px`);
    $("#effects").children().each(function(index) {
        var hide = !$("#effectsHeader").children(`[name="${$(this).attr("name")}"]`).children("input").prop("checked");
        var posLeft = $("#effectsHeader").children(`[name="${$(this).attr("name")}"]`).position().left + 1;
        var posWidth = $("#effectsHeader").children(`[name="${$(this).attr("name")}"]`).width() - 8;
        $(this).css({"left": `${posLeft}px`, "width": `${posWidth}px`});
        $(this).prop("hidden", hide);
    });
}

var imagesToLoad = 0;
var imagesLoaded = 0;

effects.forEach(function (ef) {
    if (ef.displaySelf) {
        var wrapper = $("<div></div>").attr("name", ef.name).css("display", "inline-block");
        var checkBox = $("<input type='checkbox' checked/>").css({"display": "none", "margin": "auto"});
        var effect = $("<img></img>").css("cursor", "pointer").attr("src", `images/effects/${ef.name}.png`).one("load", function() {
            imagesLoaded++;
            if (imagesLoaded === imagesToLoad)
                fitColumns();
        }).each(function() {
            $(wrapper).append(this);
            $(wrapper).append(checkBox);
            $("#effectsHeader").append(wrapper);
            addTooltip(this);
            imagesToLoad++;
            if (this.complete)
                $(this).trigger('load');
        }).click(function() {
            $(checkBox).prop("checked", !$(checkBox).prop("checked"));
            checkBox.change();
        });
        checkBox.change(function() {
            if (checkBox.css("display") === "none") {
                effect.prop("hidden", !$(checkBox).prop("checked"));
            }
            fitColumns();
        });
    }
});


    var dndHandler = {
        draggedElement: null,
        // clone: null,

        applyActionsEvents: function(element) {
            element.draggable = true;

            var dndHandler = this;

            element.addEventListener('dragstart', function(e) {
                var target = e.target;
                while ($(target.parentNode).hasClass('draggable')) {
                    target = target.parentNode;
                }
                $(target).children(".suggestionsOverlay, .suggestionsOverlayText").remove();
                dndHandler.draggedElement = target.cloneNode(true);
                dndHandler.applyRotationEvents(dndHandler.draggedElement);
                e.dataTransfer.setData('text/plain', '');
                $(".tooltip").remove();
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
                $(".tooltip").remove();
            });
			
			element.addEventListener('mouseover', function(e) {
				var target = e.target;
                while ($(target.parentNode).hasClass('action')) {
                    target = target.parentNode;
                }
				
				var content = getTooltipContent(target);
				$(document.body).append($("<div></div>").attr("class", "tooltip").css({"top": `${e.pageY + 10}px`, "left": `${e.pageX + 10}px`}).html(content));
			});
			
			element.addEventListener('mousemove', function(e) {
                if ($(".tooltip").length) {
                    var posTop = $("#midDiv").get(0).getBoundingClientRect().top + $("#midDiv").get(0).getBoundingClientRect().height - $(".tooltip").get(0).getBoundingClientRect().height;
                    posTop = Math.max(Math.min(e.pageY + 10, posTop), $("#midDiv").get(0).getBoundingClientRect().top);
    				$(".tooltip").css({"top": `${posTop}px`, "left": `${e.pageX + 10}px`});
                }
			});
			
			element.addEventListener('mouseout', function(e) {
				$(".tooltip").remove();
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
				}
                var startTime = Number($("#timeline").children().first().attr("time"));
                var time = (e.clientY-target.getBoundingClientRect().top) / scale + startTime;
                var idx = $("#rotation").children().filter(function(index) {
                    return Number($(this).attr("time")) + getAnimationLock($(this).attr("name")) / 2 <= time && index !== curIdx;
                }).length;
                if (idx !== curIdx) {
                    if (idx - curIdx >= 2)
                        console.log("We shouldn't be here, curIdx = " + curIdx + ", idx = " + idx);
                    resetDps();
                    if (idx > curIdx) {
                        addActionAtIndex($("#rotation").children().get(idx), idx-1);
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

            element.addEventListener('dragstart', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') !== -1) {
                    target = target.parentNode;
                }
                dndHandler.draggedElement = target;
                e.dataTransfer.setData('text/plain', '');
				$(".tooltip").remove();
            });

            element.addEventListener('click', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') !== -1) {
                    target = target.parentNode;
                }
                removeAction(target);
				$(".tooltip").remove();
            });
			
			element.addEventListener('mouseover', function(e) {
				var target = e.target;
                while ($(target.parentNode).hasClass('action')) {
                    target = target.parentNode;
                }
				
				var content = getTooltipContent(target);
				$(document.body).append($("<div></div>").attr("class", "tooltip").css({"top": `${e.pageY + 10}px`, "left": `${e.pageX + 10}px`}).html(content));
			});
			
			element.addEventListener('mousemove', function(e) {
                if ($(".tooltip").length) {
                    var posTop = $("#midDiv").get(0).getBoundingClientRect().top + $("#midDiv").get(0).getBoundingClientRect().height - $(".tooltip").get(0).getBoundingClientRect().height;
                    posTop = Math.max(Math.min(e.pageY + 10, posTop), $("#midDiv").get(0).getBoundingClientRect().top);
    				$(".tooltip").css({"top": `${posTop}px`, "left": `${e.pageX + 10}px`});
                }
			});
			
			element.addEventListener('mouseout', function(e) {
				$(".tooltip").remove();
			});
        }
    };

    $(".draggable").each(function(index) { dndHandler.applyActionsEvents(this); });
    $(".dropper").each(function(index) { dndHandler.applyDropEvents(this); });
	
function addTooltip(element) {
    $(element).mouseover(function(e) {
        var content = getTooltipContent(element);
        $(document.body).append($("<div></div>").attr("class", "tooltip").css({"top": `${e.pageY + 10}px`, "left": `${e.pageX + 10}px`}).html(content));
    }).mousemove(function(e) {
        if ($(".tooltip").length) {
            var posTop = $("#midDiv").get(0).getBoundingClientRect().top + $("#midDiv").get(0).getBoundingClientRect().height - $(".tooltip").get(0).getBoundingClientRect().height;
            posTop = Math.max(Math.min(e.pageY + 10, posTop), $("#midDiv").get(0).getBoundingClientRect().top);
            $(".tooltip").css({"top": `${posTop}px`, "left": `${e.pageX + 10}px`});
        }
    }).mouseout(function(e) {
        $(".tooltip").remove();
    }).click(function(e) {
        $(".tooltip").remove();
    });
}
	
function addGroupEffectTooltip(element) { // TODO : get parent if icon // mo tooltip to effect shouldn't move tooltip
    var tooltipTimer;
    var tooltip;
    $(element).mouseover(function(e) {
        clearTimeout(tooltipTimer);
        if (tooltip)
            return;
        $(".tooltip").remove();
        var content = getTooltipContent(element);
        tooltip = $("<div></div>").attr("class", "tooltip").css({"min-width": "150px", "max-width": "250px"}).html(content);
        
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
	
function getTooltipContent(element) {
    var parentId = $(element.parentNode).attr("id");
    if (parentId === "rotation") {
        var name = $(element).attr("name");
        var time = $(element).attr("time");
        var damage = $(element).attr("damage");
        if (Number(damage) > 0)
            return name + "<br/>" + "Damage: " + damage + "<br/>" + time + "s";
        else
            return name + "<br/>" + time + "s";
    } else if (parentId === "cds") {
        var name = $(element).attr("name");
        var time = $(element).attr("time");
        return name + "<br/>" + time + "s";
    } else if (parentId === "effects") {
        var name = $(element).attr("name");
        var time = $(element).attr("time");
        var endTime = $(element).attr("endTime");
        return name + "<br/>" + "From " + time + "s" + "<br/>" + "To " + endTime + "s";
    } else if (parentId === "groupEffects") {
        var name = $(element).attr("name");
        var time = $(element).attr("time");
        var endTime = $(element).children("div").attr("endTime");
        var desc = getEffectDescription(name);
        return name + "<br/>" + "From " + time + "s" + "<br/>" + "To " + endTime + "s" + "<br/>" + desc;
    } else if ($(element.parentNode.parentNode).attr("id") === "effectsHeader") {
        var name = $(element.parentNode).attr("name");
        var desc = getEffectDescription(name);
        return name + "<br/>" + desc + "<br/>" + "<br/>" + "Click to Hide/Unhide";
    } else if (parentId === "groupEffectsHeader") {
        var name = $(element).attr("name");
        var job = getGroupJob(name);
        var recast = getGroupDisplayRecastTime(name);
        var desc = getGroupDescription(name);
        return name + "<br/>" + job.toUpperCase() + "<br/>" + "Recast: " + recast + "s" + "<br/>" + desc;
    } else if ($(element).hasClass("checkboxButton")) {
        if ($(element).attr("id") === "raidBuffAuto")
            return "(Recommended) Automatically adds all raid buffs";
        var job = $("#group .ui-selectmenu-text").get($(".checkboxButton:not(#raidBuffAuto)").index(element)).textContent;
        return "(Recommended) Automatically adds raid buffs for this job (" + job + ")";
    } else if ($(element).hasClass("clearGroupButton")) {
        if ($(element).attr("id") === "raidBuffClear")
            return "Clears all raid buffs";
        var job = $("#group .ui-selectmenu-text").get($(".clearGroupButton:not(#raidBuffClear)").index(element)).textContent;
        return "Clears all raid buffs of this job (" + job + ")";
    } else if (parentId === "suggestions") {
        var name = $(element).attr("name");
        return name;
    } else {
        var name = $(element).attr("name");
        var type = getType(name);
        var recast = getRecastTime(name);
        var desc = getDescription(name);
        return name + "<br/>" + type + "<br/>" + "Recast: " + recast + "s" + "<br/>" + desc;
    }
}

function addActionAtIndex(element, idx, checkDelay = true) {
	// Saves associated next possible usage
	var nextUsage;
	if ($("#rotation").children().index(element) >= 0)
		nextUsage = $("#cds").children().filter(function(index) {return $(this).attr("name") === $(element).attr("name") && Number($(this).attr("time")) === (Number($(element).attr("time")) * 1000 + getRecastTime($(element).attr("name")) * 1000) / 1000;}).first();
    
    // Re-adjusts previous delayed abilities
    var ogcdsToDelay = null,
        delayList = [];
    var previousGcds = $("#rotation").children().filter(function(index) {return index < idx && $(this).hasClass("Weaponskill");});
	var nextGcd = $("#rotation").children().filter(function(index) {return index > idx && $(this).hasClass("Weaponskill");}).first();
    if (previousGcds.length > 0 && checkDelay && (nextGcd.length > 0 || $(element).hasClass("Weaponskill"))) {
        lastGcdIdx = $("#rotation").children().index(previousGcds.last());
        ogcdsToDelay = $("#rotation").children().filter(function(index) {return index < idx && index > lastGcdIdx;});
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
		if ($(element).hasClass("Weaponskill")) {
			var timeGcd = startTime;
			if (previousGcds.length > 0) {
                var previousGcdTime = Number(previousGcds.last().attr("time"));
                var gcdValue = gcdAt(previousGcdTime);
				timeGcd = (previousGcdTime * 100 + gcdValue * 100) / 100;
            }
			time = Math.max(time, timeGcd);
		}
		// CD recast
		else if ($(element).hasClass("Ability")) {
			var timeCd = startTime;
			var cds = $("#rotation").children().filter(function(index) {return index < idx && $(this).attr("name") === $(element).attr("name");});
			if (cds.length > 0)
				timeCd = (Number(cds.last().attr("time")) * 100 + getRecastTime(cds.last().attr("name")) * 100) / 100;
			time = Math.max(time, timeCd);
		}
        // Anim lock
        var previousAc = $("#rotation").children().eq(idx - 1);
        var incr = getAnimationLock(previousAc.attr("name"));
        var animLockTime = (Number(previousAc.attr("time")) * 100 + incr * 100) / 100;
        time = Math.max(time, animLockTime);
    }

    // Delayed ability
    if ($(element).attr("delayed") === "true" && idx < $("#rotation").children().length - 1 && previousGcds.length > 0) {
        var delayTime = startTime;
        if ($("#rotation").children().index(element) === idx) {
            delayTime = (Number($(element).next().attr("time")) * 100 - getAnimationLock($(element).attr("name")) * 100) / 100;
        } else {
            delayTime = (Number( $("#rotation").children().eq(idx).attr("time")) * 100 - getAnimationLock($(element).attr("name")) * 100) / 100;
        }
        time = Math.max(time, delayTime);
    }

    // Pre pull
    if (time <= 0) {
		if (getPotency($(element).attr("name")) === 0) {
			if ($("#rotation").children().filter(function(index) {return $(this).attr("time") < 0;}).index(element) === -1) {
				var acAnimLock = getAnimationLock($(element).attr("name"));
				setStartTime(startTime - acAnimLock);
				time -= acAnimLock;
				updateRotationBeforeIndex(idx);
			}
		} else {
			time = 0;
		}
    }
	if (time > 0 && getPotency($(element).attr("name")) === 0 && Number($(element).attr("time")) < 0) {
        setStartTime(startTime + getAnimationLock($(element).attr("name")));
		updateRotationBeforeIndex(idx);
	}

    // Display position
    var position = (time - startTime) * scale;
    var offset = 1;
    if ($(element).hasClass("Ability"))
        offset += 30;
    var animLockHeight = scale * getAnimationLock($(element).attr("name"));
    var addedElt = $(element).attr("time", `${time.toFixed(3)}`).css({"position": "absolute", "top": `${position}px`, "left": `${offset}px`, "height": `${animLockHeight}px`});

    // Adding action
    if (idx > 0)
        $("#rotation").children().eq(idx-1).after(addedElt);
    else
        $("#rotation").prepend(addedElt);
    addTimeUntil(time + 5);

    // Re-adjusts previous delayed abilities
    if (previousGcds.length > 0 && checkDelay && (nextGcd.length > 0 || $(element).hasClass("Weaponskill"))) {
        ogcdsToDelay.each(function(index) {$(this).attr("delayed", delayList[index]);});
        $(ogcdsToDelay.get().reverse()).each(function(index) {addActionAtIndex(this, idx - (index + 1), false);});
    }
	
	// Adding next possible usage to Cooldowns
	if ($(element).hasClass("Ability")) {
		var offCdTime = time + getRecastTime($(element).attr("name"));
		var offCdPosition = (offCdTime - startTime) * scale;
		if (nextUsage === undefined || nextUsage.length === 0) {
			nextUsage = $(element.cloneNode(true));
			dndHandler.applyActionsEvents(nextUsage.get(0));
		}
		$(nextUsage).attr("time", `${offCdTime.toFixed(3)}`).css({"position": "absolute", "top": `${offCdPosition}px`, "left": "", "height": ""});
		$("#cds").append(nextUsage);
		addTimeUntil(offCdTime + 5);
	}
}

function removeAction(element) {
	// Removing associated next possible usage
	$("#cds").children().filter(function(index) {return $(this).attr("name") === $(element).attr("name") && Number($(this).attr("time")) === (Number($(element).attr("time")) * 1000 + getRecastTime($(element).attr("name")) * 1000) / 1000;}).remove();
	
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
    $("#rotation").children().filter(function(index) {return index >= idx;}).each(function(index) {
        addActionAtIndex(this, index + idx);
    });
}

function updateRotationBeforeIndex(idx) {
    $("#rotation").children().filter(function(index) {return index < idx;}).each(function(index) {
        addActionAtIndex(this, index);
    });
}

function hideTimelineOverlap() {
    var values = [1, 2, 5, 10, 20, 30, 60, 120, 300];
    var divider = Math.min(Math.ceil(20/scale), 300);
    if (!values.includes(divider)) {
        var itr = 0;
        while (values[itr] < divider) {
            itr++;
        }
        divider = values[itr];
    }
    $("#timeline").children().each(function() {
        if (Number($(this).attr("time")) % divider === 0)
            this.style.visibility = "visible";
        else
            this.style.visibility = "hidden";
    });
}

function timeDiv(time) {
	var tDiv = $(`<div>${time}</div>`).attr("time", `${time.toFixed(3)}`).css("height", `${scale}px`);
	var rect = $("#columns").get(0).getBoundingClientRect();
	tDiv.prepend($("<div></div>").css({"position": "absolute", "left": "0px", "height": "1px", "width": `${$("#columns").get(0).getBoundingClientRect().width-$("#dps").get(0).getBoundingClientRect().width}px`, "background-color": "black", "z-index": "1"}));
    return tDiv;
}

function addTimeUntil(time) {
    var currentMax = -1;
    if ($("#timeline").children().length > 1)
        currentMax = Number($("#timeline").children().last().attr("time"));
    for (i = currentMax + 1; i <= time; i++) {
        $("#timeline").append(timeDiv(i));
    }
    hideTimelineOverlap();
}

function drawEffect(name, beginTime, endTime) {
    if ($("#effectsHeader").children(`[name="${name}"]`).length > 0) {
        var hide = $("#effectsHeader").children(`[name="${name}"]`).children("img").prop("hidden");
        var posLeft = $("#effectsHeader").children(`[name="${name}"]`).position().left + 1;
        var posWidth = $("#effectsHeader").children(`[name="${name}"]`).width() - 8;
        var posTop = (beginTime - startTime) * scale;
        var posHeight = (endTime - beginTime) * scale - 6;
        
        var effect = effects.find(ef => name === ef.name);
        var backgroundColor = "rgb(255,60,60)";
        if (effect.hasOwnProperty("backgroundColor"))
            backgroundColor = effect.backgroundColor;
        var borderColor = "rgb(128, 30, 30)";
        if (effect.hasOwnProperty("borderColor"))
            borderColor = effect.borderColor;
        
        var wrapper = $("<div></div>");
        wrapper.attr({"class": "effect", "name": name, "time": `${beginTime.toFixed(3)}`, "endTime": `${endTime.toFixed(3)}`});
        wrapper.css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`,
                     "border": `solid 3px ${borderColor}`});
        wrapper.prop("hidden", hide);
        
        var icon = $("<img></img>");
        icon.attr("src", `images/effects/${name}.png`);
        icon.css({"position": "sticky", "margin-left": "-4px", "margin-top": "-3px", "margin-bottom": "-3px", "top": "0px"});
        wrapper.append(icon);
        
        $("#effects").append(wrapper);
        addTooltip(wrapper.get(0));
        addTimeUntil(endTime + 5);
    }
}

function drawGroupEffect(name, jobIndex, beginTime, endTime, royalRoad, celestialOpposition, timeDilation, emboldenStacks) {
    var effect = effects.find(ef => name === ef.name);
    var columnName = effect.groupAction;
    
    if ($("#groupEffectsHeader").children(`[name="${columnName}"][jobIndex="${jobIndex}"]`).length <= 0) { // TODO : name = draw for cards
        return;
    }
    var posLeft = $("#groupEffectsHeader").children(`[name="${columnName}"][jobIndex="${jobIndex}"]`).position().left + 1;
    var posWidth = $("#groupEffectsHeader").children(`[name="${columnName}"][jobIndex="${jobIndex}"]`).width() - 6;
    var posTop = (beginTime - startTime) * scale;
    var posHeight = (endTime - beginTime) * scale - 6;
    
    var backgroundColor = effect.backgroundColor;
    var borderColor = effect.borderColor;
    
    var wrapper = $("<div></div>");
    wrapper.attr({"class": "effect", "name": name, "jobIndex": jobIndex, "time": `${beginTime.toFixed(3)}`, "endTime": `${endTime.toFixed(3)}`});
    if (royalRoad)
        wrapper.attr("royalRoad", royalRoad);
    if (celestialOpposition)
        wrapper.attr("celestialOpposition", celestialOpposition);
    if (timeDilation)
        wrapper.attr("timeDilation", timeDilation);
    if (emboldenStacks)
        wrapper.attr("emboldenStacks", emboldenStacks);
    wrapper.css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`,
                 "border": `solid 3px ${borderColor}`, "cursor": "pointer"});
    
    var icon = $("<img></img>");
    if (emboldenStacks)
        icon.attr("src", `images/effects/${name+emboldenStacks}.png`);
    else
        icon.attr("src", `images/effects/${name}.png`);
    icon.css({"position": "sticky", "margin-left": "-4px", "margin-top": "-3px", "margin-bottom": "-3px", "top": "0px"});
    wrapper.append(icon);
    
    var overlay = $("<div></div>");
    overlay.css({"position": "absolute", "left": "-3px", "top": "-3px", "width": `${posWidth+6}px`, "height": "0px", "background-color": "#CCC", "opacity": "0.7"});
    overlay.attr("endtime", `${endTime.toFixed(3)}`);
    wrapper.append(overlay);
    
    $("#groupEffects").append(wrapper);
    addGroupEffectTooltip(wrapper.get(0));
    addTimeUntil(endTime + 5);
}

function updateGroupEffectOverlay(name, beginTime, endTime, jobIndex, emboldenStacks) {
    var wrapper = $("#groupEffects").children(`[name="${name}"][jobIndex="${jobIndex}"][time="${beginTime.toFixed(3)}"]`);
    if (emboldenStacks > 1 && endTime < Number(wrapper.attr("endtime"))) {
        var nextStackTime = beginTime + effects.find(ef => ef.name === "Embolden").stackDuration;
        updateGroupEffectOverlay(name, nextStackTime, nextStackTime, jobIndex, emboldenStacks - 1);
    }
    var overlay = wrapper.children("div");
    overlay.attr("endtime", `${endTime.toFixed(3)}`);
    
    var posTop = (endTime - beginTime) * scale - 3;
    var posHeight = (Number(wrapper.attr("endTime")) - endTime) * scale;
    
    overlay.css({"top": `${posTop}px`, "height": `${posHeight}px`});
}

function deleteGroupEffect(element) {
    if ($(element).attr("name") === "Embolden") {
        var emboldenEffect = effects.find(ef => ef.name === "Embolden");
        var emboldenBeginTime = ($(element).attr("time") - (emboldenEffect.maxStacks - $(element).attr("emboldenStacks")) * emboldenEffect.stackDuration).toFixed(3);
        for (var currentStacks = emboldenEffect.maxStacks; currentStacks > 0; currentStacks--) {
            var currentTime = (Number(emboldenBeginTime) + (emboldenEffect.maxStacks - currentStacks) * emboldenEffect.stackDuration).toFixed(3);
            $("#groupEffects").children(`[name="${$(element).attr("name")}"][jobIndex="${$(element).attr("jobIndex")}"][time="${currentTime}"]`).first().remove();
        }
    } else
        $(element).remove();
    if ($(element).attr("name") === "The Balance" || $(element).attr("name") === "The Spear" || $(element).attr("name") === "The Arrow" || $(element).attr("name") === "Fey Wind") {
        updateGcdTimeline();
        updateRotationAfterIndex(0);
    }
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
}

// function drawEffect(name, beginTime, endTime) {
//     var posLeft = $("#effectsHeader").children(`[name="${name}"]`).position().left;
//     var posWidth = $("#effectsHeader").children(`[name="${name}"]`).width() - 8;
//     var posTop = (beginTime - startTime) * scale;
//     var posHeight = (endTime - beginTime) * scale - 6;
//     var img = $("#effectsHeader").children().filter(function(index) {return $(this).attr("name") === name;}).get(0);
//     var canvas = document.createElement('canvas');
//     canvas.width = img.width;
//     canvas.height = img.height;
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
//                 var interval = 32;
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
//                 }
//             }
//         }
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
//     $("#effects").append($("<div></div>").attr({"class": "effect", "time": `${beginTime.toFixed(3)}`, "endTime": `${endTime.toFixed(3)}`})
//         .css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `rgb(${r},${g},${b})`,
//               "border": `solid 3px rgb(${r2},${g2},${b2})`}));
// }

function drawBotd(type, botdObject, eTime) {
    var posLeft = 1;
    var posWidth = 25;
    var zIndex = 1;
    var beginTime, backgroundColor;
    var effect = effects.find(ef => "Blood of the Dragon" === ef.name);
    
    var botdDiv = function(name, beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex) {
        return $("<div></div>").attr({"name": name, "time": `${beginTime.toFixed(3)}`, "endTime": `${eTime.toFixed(3)}`})
        .css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`, "z-index": `${zIndex}`});
    };
    
    switch (type) {
        case "blood":
            beginTime = botdObject.bloodStart;
            backgroundColor = effect.backgroundColor;
            var posTop = Math.round((beginTime - startTime) * scale + 1);
            var posHeight = Math.round((eTime - beginTime) * scale);
            $("#botd").append(botdDiv(type, beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex));
            break;
        case "life":
            beginTime = botdObject.lifeStart;
            backgroundColor = effect.lifeColor;
            var posTop = Math.round((beginTime - startTime) * scale + 1);
            var posHeight = Math.round((eTime - beginTime) * scale);
            var lifeDiv = botdDiv(type, beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex);
            
            for (var i = 1; i <= 2; i++) {
            var posTop = Math.round((eTime - 10 * i - beginTime) * scale);
                lifeDiv.prepend($("<div></div>").attr("time", `${(eTime - 10 * i).toFixed(3)}`)
                    .css({"position": "absolute", "top": `${posTop}px`, "height": "2px", "width": `${posWidth}px`, "background-color": "orange", "z-index": "3"}));
            }
            $("#botd").append(lifeDiv);
            break;
        case "eye":
            for (var i = 0; i < botdObject.eyeCount; i++) {
                posLeft = 11 * i + 4;
                posWidth = 8;
                beginTime = botdObject.eyeTime[i];
                backgroundColor = effect.eyeColor;
                zIndex = 2;
                var posTop = Math.round((beginTime - startTime) * scale + 1);
                var posHeight = Math.round((eTime - beginTime) * scale);
                $("#botd").append(botdDiv(type + (i + 1), beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex).css("border-radius", "3px"));
            }
            break;
        default:
            return;
    }

    addTimeUntil(eTime + 5);
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
    while (elt.next().length > 0) {
        elt = elt.next();
        var lastVisibleDps = lastVisible.children();
        var eltDps = elt.children();
        if (parseInt(lastVisible.css("top")) + lastVisibleDps.get(0).getBoundingClientRect().height < parseInt(elt.css("top"))) {
            elt.css("display", "flex");
            lastVisible = elt;
        } else {
            elt.css("display", "none");
        }
    }
}

function displayDps(dps, time) {
    var pos = (time - startTime) * scale + 1;
    var wrapper = $("<div></div>").attr("time", `${time.toFixed(3)}`).css({"position": "absolute", "display": "flex", "justify-content": "center", "left": "2px", "top": `${pos}px`, "height": "1px", "width": `${$("#dps").get(0).getBoundingClientRect().width}px`, "background-color": "black", "z-index": "2"});
    var dpsText = $(`<div>${dps}</div>`);
    wrapper.append(dpsText);
    $("#dps").append(wrapper);
    dpsText.css({"margin-top": `${-parseInt(window.getComputedStyle(dpsText.get(0)).fontSize, 10)/2}px`, "height": `${parseInt(window.getComputedStyle(dpsText.get(0)).fontSize, 10)}px`, "background-color": "#CCC", "margin-left": "auto", "margin-right": "auto"});
}

function removeDpsAfter(beginTime) {
	$("#dps").children().filter(function(index) {return Number($(this).attr("time")) > beginTime;}).remove();
}

function updateDps() {
    generateHistory($("#rotation").children(), RotationHistory, stats, $("#groupEffects").children());
    var botdObject = {bloodStart: 0, eyeTime: [], lifeStart: 0, eyeCount: -1};
    RotationHistory.forEach(e => {
        if (e.type === "action") {
            displayDps(Math.floor(e.dps), e.time);
            $("#rotation").children(`[time='${e.time.toFixed(3)}']`).attr("damage", Math.round(e.actionDamage));
        } else if (e.type === "effectBegin") {
            if (e.timedEffect.displaySelf) {
                drawEffect(e.name, e.timedEffect.beginTime, e.timedEffect.endTime);
            } else if (e.timedEffect.hasOwnProperty("jobIndex")) {
                // Update group effect with overlay
                var emboldenStacks;
                if (e.timedEffect.hasOwnProperty("emboldenStacks"))
                    emboldenStacks = e.timedEffect.emboldenStacks;
                updateGroupEffectOverlay(e.name, e.timedEffect.beginTime, e.timedEffect.endTime, e.timedEffect.jobIndex, emboldenStacks);
            }
        }
        switch(e.name) {
            case "Blood of the Dragon":
                if (e.type === "effectBegin") { // Blood start
                    botdObject.bloodStart = e.time;
                    botdObject.eyeCount = 0;
                } else if (e.type === "effectEnd") {
                    if (e.timedEffect.endTime === e.time) { // Blood end
                        drawBotd("blood", botdObject, e.time);
                        drawBotd("eye", botdObject, e.time);
                        botdObject.eyeCount = -1;
                    } else { // Life end
                        drawBotd("life", botdObject, e.time);
                        botdObject.bloodStart = e.time;
                    }
                }
                break;
            case "Geirskogul":
                if (botdObject.eyeCount === 2) { // Blood end | Life start
                    drawBotd("blood", botdObject, e.time);
                    drawBotd("eye", botdObject, e.time);
                    botdObject.eyeCount = 0;
                    botdObject.lifeStart = e.time;
                }
                break;
            case "Mirage Dive":
                if (botdObject.eyeCount >= 0) { // When blood/life up
                    botdObject.eyeTime[botdObject.eyeCount] = e.time;
                    botdObject.eyeCount = Math.min(botdObject.eyeCount + 1, 2);
                }
                break;
            default:
                break;
        }
    });
    hideDpsOverlap();
    $("#DPSout").val($("#dps").children().last().children().html());
    updateSuggestions();
}

function resetDps() {
    $("#botd").empty();
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
    $("#DPSout").val("");
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
    openerAddAction("Blood of the Dragon");
    openerAddAction("Potion");
    openerAddAction("True Thrust");
    openerAddAction("Dragon Sight");
    openerAddAction("Disembowel");
    openerAddAction("Battle Litany");
    openerAddAction("Lance Charge");
    openerAddAction("Chaos Thrust");
    openerAddAction("Wheeling Thrust");
    openerAddAction("Fang and Claw");
    openerAddAction("Geirskogul", true);
    openerAddAction("Raiden Thrust");
    openerAddAction("High Jump");
    openerAddAction("Vorpal Thrust");
    openerAddAction("Life Surge");
    openerAddAction("Mirage Dive");
    openerAddAction("Full Thrust");
    openerAddAction("Spineshatter Dive");
    openerAddAction("Fang and Claw");
    openerAddAction("Dragonfire Dive");
    openerAddAction("Wheeling Thrust");

    autoFillRaidBuffs(false);
    updateDps();
});

$("#manageRotations").click(function() { // TODO: message to say rotations are stored in cache
    var rots = []; // TODO: control if rots is an array, and if name not already used
    if (localStorage["Rotations"])
        rots = JSON.parse(localStorage["Rotations"]);
    $("#savedRotationsTable").children("tbody").remove();
    var body = $("<tbody></tbody>");
    rots.forEach(function(rotName) {
        var rot = JSON.parse(localStorage[rotName]);
        var row = $("<tr></tr>");
        row.append($(`<td>${rot.name}</td>`));
        row.append($(`<td>${rot.dps}</td>`));
        row.append($(`<td>${rot.length}</td>`));
        row.append($(`<td>${rot.gcd}</td>`));
        var openButton = $("<button class='ui icon button'><i class='icon folder open'></i></button>").css({"padding": "4px", "background-color": "#FFFFFF"});
        var deleteButton = $("<button class='ui icon button'><i class='icon trash alternate'></i></button>").css({"padding": "4px", "background-color": "#FFFFFF"});
        openButton.click(function() {
            loadRotation(rotName);
            $("#savedRotationsLightbox").modal("hide");
        });
        deleteButton.click(function() {
            // TODO: confirmation button
            localStorage.removeItem(rotName);
            rots.splice(rots.indexOf(rotName), 1);
            localStorage["Rotations"] = JSON.stringify(rots);
            row.remove();
        });
        row.append(openButton);
        row.append(deleteButton);
        body.append(row);
    });
        $("#savedRotationsTable").append(body);
    $("#savedRotationsLightbox").modal("show");
});

// $("#loadRotation").click(function() {
function loadRotation(rotName) {
    clearRotation();
    // var savedRotationObject = JSON.parse(savedRotation);
    var savedRotationObject = JSON.parse(localStorage[rotName]);
    $("#WDin").val(savedRotationObject.wd);
    $("#STRin").val(savedRotationObject.str);
    $("#DHin").val(savedRotationObject.dh);
    $("#CRITin").val(savedRotationObject.crit);
    $("#DETin").val(savedRotationObject.det);
    $("#SKSin").val(savedRotationObject.sks);
    $("#WDin").change();
    $("#STRin").change();
    $("#DHin").change();
    $("#CRITin").change();
    $("#DETin").change();
    $("#SKSin").change();
    savedRotationObject.actions.forEach(ac => {
        if (ac.hasOwnProperty("d"))
            openerAddAction(actions[ac.i].name, (ac.d === "1" ? "true" : "false"));
        else
            openerAddAction(actions[ac.i].name);
    });

    autoFillRaidBuffs(false);
    updateDps();
}
// });

$("#saveRotation").click(function() {
    var rots = []; // TODO: control if rots is an array, and if name not already used and not "Rotations"
    if (localStorage["Rotations"])
        rots = JSON.parse(localStorage["Rotations"]);
    var idx = rots.length + 1;
    while (rots.indexOf("Rotation " + idx) >= 0) idx++;
    var rotName = "Rotation " + idx;
    rots.push(rotName);
    localStorage["Rotations"] = JSON.stringify(rots);
    var savedRotationObject = {
        name: rotName,
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
    localStorage[rotName] = JSON.stringify(savedRotationObject);
    // savedRotation = JSON.stringify(savedRotationObject);
    // console.log(savedRotation);
});

$("#threeMinRotation").click(function() {
    clearRotation();
    var savedRotationObject = threeMinRotation;
    $("#WDin").val(savedRotationObject.wd);
    $("#STRin").val(savedRotationObject.str);
    $("#DHin").val(savedRotationObject.dh);
    $("#CRITin").val(savedRotationObject.crit);
    $("#DETin").val(savedRotationObject.det);
    $("#SKSin").val(savedRotationObject.sks);
    $("#WDin").change();
    $("#STRin").change();
    $("#DHin").change();
    $("#CRITin").change();
    $("#DETin").change();
    $("#SKSin").change();
    savedRotationObject.actions.forEach(ac => {
        if (ac.hasOwnProperty("d"))
            openerAddAction(actions[ac.i].name, (ac.d === "1" ? "true" : "false"));
        else
            openerAddAction(actions[ac.i].name);
    });

    autoFillRaidBuffs(false);
    updateDps();
});

$("#debugButton").click(function() {
    RotationHistory.forEach(function(item) { item.display(); });
});

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

var resizeTimer;
$(window).resize(function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitColumns, 20);
});

function setStartTime(value) {
    if (value < startTime) {
        for (var i = 0; i < Math.ceil(startTime) - Math.ceil(value); i++) {
			$("#timeline").children().eq(0).after(timeDiv(Math.ceil(startTime) - i - 1));
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
    $("#raidBuffLightboxImg").attr("src", `images/effects/${cardName}.png`);
}

$("#raidBuffLightboxBalance").change(function() {
    if (!$("#raidBuffLightboxCardsRow").prop("hidden") && $("#raidBuffLightboxBalance").prop("checked"))
        selectCard("The Balance");
});

$("#raidBuffLightboxSpear").change(function() {
    if (!$("#raidBuffLightboxCardsRow").prop("hidden") && $("#raidBuffLightboxSpear").prop("checked"))
        selectCard("The Spear");
});

$("#raidBuffLightboxArrow").change(function() {
    if (!$("#raidBuffLightboxCardsRow").prop("hidden") && $("#raidBuffLightboxArrow").prop("checked"))
        selectCard("The Arrow");
});

function adjustCardDuration() {
    var name;
    if ($("#raidBuffLightboxBalance").prop("checked"))
        name = "The Balance";
    if ($("#raidBuffLightboxSpear").prop("checked"))
        name = "The Spear";
    if ($("#raidBuffLightboxArrow").prop("checked"))
        name = "The Arrow";
    if (!name) {
        console.log("Card name not found!");
        return;
    }

    var duration = getEffectDuration(name);
    if ($("#raidBuffLightboxExtended").prop("checked"))
        duration *= 2;
    if ($("#raidBuffLightboxCelestialOpposition").prop("checked"))
        duration += 10;
    if ($("#raidBuffLightboxTimeDilation").prop("checked"))
        duration += 15;
    $("#raidBuffLightboxDurationInput").val(duration);
    $("#raidBuffLightboxDurationOutput").val(duration);
}

$("#raidBuffLightboxNoEffect").change(function() {
    if (!$("#raidBuffLightboxRoadRow").prop("hidden"))
        adjustCardDuration();
});

$("#raidBuffLightboxExpanded").change(function() {
    if (!$("#raidBuffLightboxRoadRow").prop("hidden"))
        adjustCardDuration();
});

$("#raidBuffLightboxExtended").change(function() {
    if (!$("#raidBuffLightboxRoadRow").prop("hidden"))
        adjustCardDuration();
});

$("#raidBuffLightboxEnhanced").change(function() {
    if (!$("#raidBuffLightboxRoadRow").prop("hidden"))
        adjustCardDuration();
});

$("#raidBuffLightboxCelestialOpposition").change(function() {
    if (!$("#raidBuffLightboxAstRow").prop("hidden"))
        adjustCardDuration();
});

$("#raidBuffLightboxTimeDilation").change(function() {
    if (!$("#raidBuffLightboxAstRow").prop("hidden"))
        adjustCardDuration();
});

function setUpRaidBuffLightbox(name, jobIndex, element) {
    $("#raidBuffLightboxTitle").val(name); // Don't delete, this value is used in the OK call
    $("#raidBuffLightboxImg").attr("src", `images/effects/${name}.png`);
    raidBuffLightboxJobIndex = jobIndex;
    var currentEffect = effects.find(ef => ef.name === name);
    if (raidBuffLightboxEditMode) {
        $("#raidBuffLightboxTitleMode").val("Edit");
        if (name === "Embolden") {
            var emboldenBeginTime = ($(element).attr("time") - (currentEffect.maxStacks - $(element).attr("emboldenStacks")) * currentEffect.stackDuration).toFixed(3);
            $("#raidBuffLightboxStartTimeInput").val(emboldenBeginTime);
            $("#raidBuffLightboxDurationInput").val(getEffectDuration(name));
            $("#raidBuffLightboxDurationOutput").val(getEffectDuration(name));
        } else {
            $("#raidBuffLightboxStartTimeInput").val($(element).attr("time"));
            $("#raidBuffLightboxDurationInput").val((Number($(element).attr("endTime")) * 1000 - Number($(element).attr("time")) * 1000) / 1000);
            $("#raidBuffLightboxDurationOutput").val((Number($(element).attr("endTime")) * 1000 - Number($(element).attr("time")) * 1000) / 1000);
        }
    } else {
        $("#raidBuffLightboxTitleMode").val("Add");
        var previousEffects = $("#groupEffects").children(`[name="${name}"][jobIndex="${jobIndex}"]`);
        if (currentEffect.groupAction === "Draw") {
            var groupAc = groupActions.find(ac => ac.name === currentEffect.groupAction);
            previousEffects = $("#groupEffects").children(`[jobIndex="${jobIndex}"]`).filter((idx, ef) => {return groupAc.effects.includes($(ef).attr("name"))});
        }
        if (name === "Embolden")
            previousEffects = previousEffects.filter((idx, ef) => {return Number($(ef).attr("emboldenStacks")) === currentEffect.maxStacks});
        var useNumber = previousEffects.length;
        var useTime = getGroupOpenerTime(currentEffect.groupAction);
        if (useNumber > 0)
            useTime = Number(previousEffects.sort((a, b) => {return Number($(a).attr("time")) - Number($(b).attr("time"))}).last().attr("time")) + getGroupRecastTime(currentEffect.groupAction, useNumber - 1);
        
        $("#raidBuffLightboxStartTimeInput").val(useTime);
        $("#raidBuffLightboxDurationInput").val(getEffectDuration(name, useNumber));
        $("#raidBuffLightboxDurationOutput").val(getEffectDuration(name, useNumber));
    }
    switch(name) {
        case "Hypercharge":
        case "Critical Up":
        case "Foe Requiem":
        case "Radiant Shield":
            $("#raidBuffLightboxDurationInput").prop("hidden", false);
            $("#raidBuffLightboxDurationOutput").prop("hidden", true);
            break;
        default:
            $("#raidBuffLightboxDurationInput").prop("hidden", true);
            $("#raidBuffLightboxDurationOutput").prop("hidden", false);
            break;
    }
    switch(name) {
        case "The Balance":
        case "The Spear":
        case "The Arrow":
            $("#raidBuffLightboxCardsRow").prop("hidden", false);
            $("#raidBuffLightboxRoadRow").prop("hidden", false);
            $("#raidBuffLightboxAstRow").prop("hidden", false);
            $(`#raidBuffLightbox${name.substring(4)}`).prop("checked", true).change();
            if (raidBuffLightboxEditMode) {
                $(`#raidBuffLightbox${$(element).attr("royalRoad")}`).prop("checked", true).change();
                $("#raidBuffLightboxCelestialOpposition").prop("checked", element.hasAttribute("CelestialOpposition")).change();
                $("#raidBuffLightboxTimeDilation").prop("checked", element.hasAttribute("TimeDilation")).change();
            } else {
                $("#raidBuffLightboxExpanded").prop("checked", true).change();
                $("#raidBuffLightboxCelestialOpposition").prop("checked", true).change();
                $("#raidBuffLightboxTimeDilation").prop("checked", false).change();
            }
            break;
        default:
            $("#raidBuffLightboxCardsRow").prop("hidden", true);
            $("#raidBuffLightboxRoadRow").prop("hidden", true);
            $("#raidBuffLightboxAstRow").prop("hidden", true);
            $("#raidBuffLightboxNoEffect").prop("checked", true).change();
            $("#raidBuffLightboxCelestialOpposition").prop("checked", false).change();
            $("#raidBuffLightboxTimeDilation").prop("checked", false).change();
            break;
    }
}

function refreshGroupMember(index, value) {
    var updateSpeed = false;
    var loopCount = $("#groupEffects").children(`[jobIndex="${index}"]`).length;
     if ($("#groupEffects").children(`[jobIndex="${index}"][name="The Balance"], [jobIndex="${index}"][name="The Spear"], [jobIndex="${index}"][name="The Arrow"], [jobIndex="${index}"][name="Fey Wind"]`).length > 0)
         updateSpeed = true;
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

            var effect = $("<img></img>").attr({src: `images/group/${ac.name}.png`}).css({"width": 22}).one("load", function() {
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
                addTooltip(wrapper.get(0));
                
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
}

$("#raidBuffLightboxConfirm").click(function() {
    if (raidBuffLightboxEditMode)
        deleteGroupEffect(raidBuffLightboxEditElement);
    var title = $("#raidBuffLightboxTitle").val();
    var royalRoad;
    var celestialOpposition;
    var timeDilation;
    var emboldenStacks;
    if ($("#raidBuffLightboxExpanded").prop("checked"))
        royalRoad = "Expanded";
    if ($("#raidBuffLightboxEnhanced").prop("checked"))
        royalRoad = "Enhanced";
    if ($("#raidBuffLightboxExtended").prop("checked"))
        royalRoad = "Extended";
    if ($("#raidBuffLightboxNoEffect").prop("checked"))
        royalRoad = "NoEffect";
    if ($("#raidBuffLightboxCelestialOpposition").prop("checked"))
        celestialOpposition = true;
    if ($("#raidBuffLightboxTimeDilation").prop("checked"))
        timeDilation = true;
    if (title === "Embolden") {
        var emboldenEffect = effects.find(ef => ef.name === "Embolden");
        var beginTime = Number($("#raidBuffLightboxStartTimeInput").val());
        emboldenStacks = emboldenEffect.maxStacks;
        while (emboldenStacks > 0) {
            drawGroupEffect(title, raidBuffLightboxJobIndex, beginTime, beginTime + emboldenEffect.stackDuration, royalRoad, celestialOpposition, timeDilation, emboldenStacks);
            beginTime += emboldenEffect.stackDuration;
            emboldenStacks--;
        }
    } else
        drawGroupEffect(title, raidBuffLightboxJobIndex, Number($("#raidBuffLightboxStartTimeInput").val()), Number($("#raidBuffLightboxStartTimeInput").val()) + Number($("#raidBuffLightboxDurationInput").val()), royalRoad, celestialOpposition, timeDilation, emboldenStacks);
    if (title === "The Balance" || title === "The Spear" || title === "The Arrow" || title === "Fey Wind") {
        updateGcdTimeline();
        updateRotationAfterIndex(0);
    }
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

for (i = 0; i < 7; i++) {
    $("#group tr td select").eq(i).val(standardComp[i]);
    $("#group tr td select").eq(i).iconselectmenu("refresh");
    var rectTop = $("#group .ui-selectmenu-button").get(i).getBoundingClientRect().top + $("#group .ui-selectmenu-button").get(i).getBoundingClientRect().height + 3 + 8;
    $("#group tr td select").eq(i).iconselectmenu("menuWidget").css({"max-height": `calc(100vh - ${rectTop}px)`, "min-height": "100px"});
    refreshGroupMember(i, standardComp[i]);
}

$(".checkboxButton, .clearGroupButton").each((idx, elt) => addTooltip(elt));

$("#suggestions").draggable({cancel: ".action", containment: "parent"});

function effectRemainingAt(name, time) {
    var result = 0;
    $("#effects").children(`[name="${name}"]`).each((idx,elt) => { if (Number($(elt).attr("endTime")) > time && Number($(elt).attr("time")) <= time) result = Number($(elt).attr("endTime")) - time;});
    return result;
}

function isEffectUpAt(name, time) {
    // var result = false;
    // $("#effects").children(`[name="${name}"]`).each((idx,elt) => { if (Number($(elt).attr("endTime")) > time && Number($(elt).attr("time")) <= time) result = true;});
    return effectRemainingAt(name, time) > 0;
}

function botDRemainingAt(type, time) {
    var result = 0;
    $("#botd").children(`[name="${type}"]`).each((idx,elt) => { if (Number($(elt).attr("endTime")) > time && Number($(elt).attr("time")) <= time) result = Number($(elt).attr("endTime")) - time;});
    return result;
}

function isBotDUpAt(type, time) {
    // var result = false;
    // $("#botd").children(`[name="${type}"]`).each((idx,elt) => { if (Number($(elt).attr("endTime")) > time && Number($(elt).attr("time")) <= time) result = true;});
    return botDRemainingAt(type, time) > 0;
}

function cdAt(name, time) {
    var result = 0;
    $("#cds").children(`[name="${name}"]`).each((idx,elt) => { if (Number($(elt).attr("time")) > time) result = Number($(elt).attr("time")) - time;});
    return result;
}

function isOffCdAt(name, time) {
    // var result = true;
    // $("#cds").children(`[name="${name}"]`).each((idx,elt) => { if (Number($(elt).attr("time")) > time) result = false;});
    return cdAt(name, time) <= 0;
}

function addSuggestion(name, type, value) {
    var action = actions.find(ac => name === ac.name);
    var target = $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).get(0);
    var clonedElement = target.cloneNode(true);
    var actionImg = $(clonedElement).children(".actionImage").get(0);
    dndHandler.applyActionsEvents(clonedElement);
    $("#suggestions").append(clonedElement);

    if (type) {
        var ovTxt = $(`<div>${value ? value.toFixed(2) : ""}</div>`);
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

    if (!isBotDUpAt("blood", currentTime) && !isBotDUpAt("life", currentTime))
        addSuggestion("Blood of the Dragon");

    var nextGcdTime = 0;
    if (lastWs.length) {
        var lastWsTime = Number(lastWs.attr("time"));
        // Adjusting for clipping
        nextGcdTime = Math.max(currentTime, (lastWsTime * 1000 + gcdAt(lastWsTime) * 1000) / 1000);
        if (isEffectUpAt("Raiden Thrust Ready", nextGcdTime))
            addSuggestion("Raiden Thrust");
        else if (isEffectUpAt("Enhanced Wheeling Thrust", nextGcdTime))
            addSuggestion("Wheeling Thrust");
        else if (isEffectUpAt("Sharper Fang and Claw", nextGcdTime))
            addSuggestion("Fang and Claw");
        else if (lastWs.attr("name") === "Disembowel")
            addSuggestion("Chaos Thrust");
        else if (lastWs.attr("name") === "Vorpal Thrust")
            addSuggestion("Full Thrust");
        else if (lastWs.attr("name") === "True Thrust" || lastWs.attr("name") === "Raiden Thrust") {
            if (isEffectUpAt("Disembowel", nextGcdTime + 4 * gcdAt(nextGcdTime)))
                addSuggestion("Vorpal Thrust");
            else
                addSuggestion("Disembowel");
        } else
            addSuggestion("True Thrust");
    } else {
        addSuggestion("True Thrust");
    }

    ["Mirage Dive", "Nastrond", "Stardiver", "Lance Charge", "Dragon Sight", "Battle Litany", "Life Surge", "Potion", "High Jump", "Spineshatter Dive", "Dragonfire Dive", "Geirskogul"].forEach(elt => {
        var latestTime = nextGcdTime - getAnimationLock(elt);
        var cdAtCurrentTime = cdAt(elt, currentTime);
        if (((elt === "Nastrond" || elt === "Stardiver") && !isBotDUpAt("life", cdAtCurrentTime + currentTime)) || (elt === "Mirage Dive" && !isEffectUpAt("Dive Ready", currentTime)))
            return;
        if (isOffCdAt(elt, latestTime)) { // Available in this GCD
            var remainingTime;
            if (elt === "Nastrond" || elt === "Stardiver")
                remainingTime = botDRemainingAt("life", currentTime);
            else if (elt === "Mirage Dive")
                remainingTime = effectRemainingAt("Dive Ready", currentTime);
            if (isOffCdAt(elt, currentTime)) { // Available now
                if (remainingTime < longAnimLock) // Active buff ends very soon
                        addSuggestion(elt, "activeEnd", remainingTime);
                else if ((latestTime >= currentTime || currentTime === 0) && (elt != "Mirage Dive" || !isBotDUpAt("eye2", currentTime))) { // No clipping (time and eyes)
                    if (remainingTime < 5) // Active buff ends soon
                        addSuggestion(elt, "active", remainingTime);
                    else
                        addSuggestion(elt);
                } else
                    addSuggestion(elt, "clipping");
            } else // Available after small delay
                addSuggestion(elt, "cooldownEnd", cdAtCurrentTime);
        } else if (cdAtCurrentTime > 0 && cdAtCurrentTime <= 5) // Available soon
            addSuggestion(elt, "cooldown", cdAtCurrentTime);
        else if (cdAtCurrentTime === 0) // Off CD during last oGCD while clipping
            addSuggestion(elt, "clipping");
    });
}

$("#suggestions").css({"left": `${$("#scrollableDiv").get(0).getBoundingClientRect().left+$("#scrollableDiv").get(0).getBoundingClientRect().width/2-$("#suggestions").get(0).getBoundingClientRect().width/2}px`});

updateSuggestions();

$("#suggestions").css({"top": `${$("#midDiv").get(0).getBoundingClientRect().height+$("#midDiv").get(0).getBoundingClientRect().top-$("#suggestions").get(0).getBoundingClientRect().height}px`});

function autoFillSingleRaidBuff(name, jobIndex) {
    if ($("#rotation").children().length === 0)
        return 0;
    var rotationTime = Number($("#rotation").children().last().attr("time"));
    var loopCount = 0;
    var effectName = groupActions.find(ac => ac.name === name).effects[0];
    
    var emboldenEffect;
    if (name === "Embolden")
        emboldenEffect = effects.find(ef => ef.name === "Embolden");
    
    while (true) {
        var royalRoad;
        var celestialOpposition;
        var timeDilation;
        var emboldenStacks;
        var previousEffects = $("#groupEffects").children(`[name="${effectName}"][jobIndex="${jobIndex}"]`);
        if (name === "Embolden")
            previousEffects = previousEffects.filter((idx, ef) => {return Number($(ef).attr("emboldenStacks")) === emboldenEffect.maxStacks});
        var useNumber = previousEffects.length;
        var useTime = getGroupOpenerTime(name);
        var duration = getEffectDuration(effectName, useNumber);
        if (useNumber > 0) {
            if (name === "Draw" || name === "Fey Wind" || name === "Radiant Shield")
                break;
            previousEffects = previousEffects.sort((a, b) => {return Number($(a).attr("time")) - Number($(b).attr("time"))});
            useTime = Number(previousEffects.last().attr("time")) + getGroupRecastTime(name, useNumber - 1);
        }
        if (useTime > rotationTime + 5)
            break;
        
        if (name === "Draw") {
            royalRoad = "Expanded";
            celestialOpposition = true;
            duration += 10;
            timeDilation = false;
        }
        
        if (name === "Embolden") {
            var beginTime = useTime;
            emboldenStacks = emboldenEffect.maxStacks;
            while (emboldenStacks > 0) {
                drawGroupEffect(effectName, jobIndex, beginTime, beginTime + emboldenEffect.stackDuration, royalRoad, celestialOpposition, timeDilation, emboldenStacks);
                beginTime += emboldenEffect.stackDuration;
                emboldenStacks--;
            }
        } else
            drawGroupEffect(effectName, jobIndex, useTime, useTime + duration, royalRoad, celestialOpposition, timeDilation, emboldenStacks);
        loopCount++;
    }
    
    if (loopCount > 0 && (effectName === "The Balance" || effectName === "The Spear" || effectName === "The Arrow" || effectName === "Fey Wind")) {
        updateGcdTimeline();
        updateRotationAfterIndex(0);
    }
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
