actions.forEach(function (ac) {
    var action = $("<div></div>").attr({name: ac.name, class: `action draggable ${ac.type}`});
	if (ac.hasOwnProperty("delayed"))
		action.attr("delayed", ac.delayed);
    action.append($("<div></div>").attr("class", "actionImage").css("background-image", `url("images/${ac.name}.png")`));
    $(`#${ac.group}`).append(action);
});

var imagesToLoad = effects.length;
var imagesLoaded = 0;

effects.forEach(function (ef) {
    var effect = $("<img></img>").attr({name: ef.name, class: `${ef.type}`, src: `images/effects/${ef.name}.png`}).one("load", function() {
        imagesLoaded++;
        if (imagesLoaded == imagesToLoad) {
            $("#columns").children().each(function(index) {$(this).attr("width", $("#headers").children().eq(index).width() + "px");});
            clearRotation();
            // drawEffect("Blood of the Dragon", 0, 5.5);
            // drawEffect("Right Eye", 5.5, 7);
        }
    }).each(function() {
        if (this.complete) {
            $(this).trigger('load');
        }
    });;
    $("#effectsHeader").append(effect);
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
                var clonedElement = target.cloneNode(true);
                dndHandler.applyRotationEvents(clonedElement);
                addActionAtIndex(clonedElement, $("#rotation").children().length);
                var scrollValue = parseInt($("#rotation").children().last().css("top"), 10) - 200;
                $(".scrollable").animate({scrollTop:scrollValue}, 50, "linear");
                $(".tooltip").remove();
            });
			
			element.addEventListener('mouseover', function(e) {
				var target = e.target;
                while ($(target.parentNode).hasClass('action')) {
                    target = target.parentNode;
                }
				
				var content = dndHandler.getTooltipContent(target);
				$(document.body).append($("<div></div>").attr("class", "tooltip").css({"top": `${e.pageY + 10}px`, "left": `${e.pageX + 10}px`}).html(content));
			});
			
			element.addEventListener('mousemove', function(e) {
				$(".tooltip").css({"top": `${e.pageY + 10}px`, "left": `${e.pageX + 10}px`});
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
                while (target.className.indexOf('dropper') == -1) {
                    target = target.parentNode;
                }



        // var simTime = startTime;
        // if (idx > 0)
        //     simTime = Number($(element).prev().attr("time"));
        // // console.log($(element).attr("name") + " " + $(element).attr("time") + " " + simTime);
        // deleteAfter(RotationHistory, simTime);
        // removeEffectsAfter(simTime);
        // removeDpsAfter(simTime);
        // playUntil($("#rotation").children(), RotationHistory, Number($(element).attr("time")));

        // RotationHistory.forEach(e => {
        //     if (e.time >= simTime) {
        //         displayDps(Math.floor(e.dps), e.time);
        //         getEffects(e.name).forEach(ef => {
        //             var activationTime = ef.activationTime == undefined ? 0 : ef.activationTime;
        //             drawEffect(ef.name, Number(e.time) + Number(activationTime), Number(e.time) + Number(ef.duration) + Number(activationTime));
        //         });
        //     }
        // });


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
                    return Number($(this).attr("time")) + getAnimationLock($(this).attr("name")) / 2 <= time && index != curIdx;
                }).length;
                if (idx > curIdx) {
                    addActionAtIndex($("#rotation").children().get(idx), idx-1);
                    addActionAtIndex(dndHandler.draggedElement, idx);
                    updateRotationAfterIndex(idx + 1);
                } else if (idx < curIdx) {
                    addActionAtIndex(dndHandler.draggedElement, idx);
                    updateRotationAfterIndex(idx + 1);
                }
                if (idx - curIdx >= 2)
                    console.log("We shouldn't be here, curIdx = " + curIdx + ", idx = " + idx);

                // Snap to previous or next action
                if ($(dndHandler.draggedElement).hasClass("Weaponskill") || idx === 0 || idx === $("#rotation").children().length)
                    return;

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
                if (time <= midTime) {
                    if (delayed === "false")
						return;
					$(dndHandler.draggedElement).attr("delayed", "false");
                } else {
                    if (delayed === "true")
						return;
					$(dndHandler.draggedElement).attr("delayed", "true");
                }
                var prevTime = $(dndHandler.draggedElement).attr("time");
				addActionAtIndex(dndHandler.draggedElement, idx);
                if (prevTime != $(dndHandler.draggedElement).attr("time"))
                    updateRotationAfterIndex(idx + 1);
				// $("#rotation").children().filter(function(index) {
				// 	return index > idx && $(this).attr("name") === $(dndHandler.draggedElement).attr("name");
				// }).each(function(index) {
				// 	addActionAtIndex(this, $("#rotation").children().index(this));
				// });
            });

            dropper.addEventListener('dragleave', function(e) {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    var tempClone = dndHandler.draggedElement.cloneNode(true);
					tempClone.removeAttribute("time");
                    dndHandler.applyRotationEvents(tempClone);
                    removeAction(dndHandler.draggedElement);
                    dndHandler.draggedElement = tempClone;
                }
            });
        },

        applyRotationEvents: function(element) {
            element.draggable = true;

            var dndHandler = this;

            element.addEventListener('dragstart', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') != -1) {
                    target = target.parentNode;
                }
                dndHandler.draggedElement = target;
                e.dataTransfer.setData('text/plain', '');
				$(".tooltip").remove();
            });

            element.addEventListener('click', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') != -1) {
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
				
				var content = dndHandler.getTooltipContent(target);
				$(document.body).append($("<div></div>").attr("class", "tooltip").css({"top": `${e.pageY + 10}px`, "left": `${e.pageX + 10}px`}).html(content));
			});
			
			element.addEventListener('mousemove', function(e) {
				$(".tooltip").css({"top": `${e.pageY + 10}px`, "left": `${e.pageX + 10}px`});
			});
			
			element.addEventListener('mouseout', function(e) {
				$(".tooltip").remove();
			});
        },
		
		getTooltipContent: function(element) {
			var parentId = $(element.parentNode).attr("id");
			if (parentId == "rotation" || parentId == "cds") {
				var name = $(element).attr("name");
				var time = $(element).attr("time");
				return name + "<br/>" + time;
			} else {
				var name = $(element).attr("name");
				var type = getType(name);
				var recast = getRecastTime(name);
				var desc = getDescription(name);
				return name + "<br/>" + type + "<br/>" + "Recast: " + recast + "s" + "<br/>" + desc;
			}
		}
    };

    $(".draggable").each(function(index) { dndHandler.applyActionsEvents(this); });
    $(".dropper").each(function(index) { dndHandler.applyDropEvents(this); });

function addActionAtIndex(element, idx, checkDelay = true) {
	// Saves associated next possible usage
	var nextUsage;
	if ($("#rotation").children().index(element) > 0)
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
            if (ret != undefined) {
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
			if (previousGcds.length > 0)
				timeGcd = (Number(previousGcds.last().attr("time")) * 100 + Number($("#GCD").val()) * 100) / 100;
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
        if ($("#rotation").children().index(element) == idx) {
            delayTime = (Number($(element).next().attr("time")) * 100 - getAnimationLock($(element).attr("name")) * 100) / 100;
        } else {
            delayTime = (Number( $("#rotation").children().eq(idx).attr("time")) * 100 - getAnimationLock($(element).attr("name")) * 100) / 100;
        }
        time = Math.max(time, delayTime);
    }

    // Pre pull
    if (time <= 0) {
		if (getPotency($(element).attr("name")) == 0) {
			if ($("#rotation").children().filter(function(index) {return $(this).attr("time") < 0;}).index(element) == -1) {
				var acAnimLock = getAnimationLock($(element).attr("name"));
				setStartTime(startTime - acAnimLock);
				time -= acAnimLock;
				updateRotationBeforeIndex(idx);
			}
		} else {
			time = 0;
		}
    }
	if (time > 0 && getPotency($(element).attr("name")) == 0 && Number($(element).attr("time")) < 0) {
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
		if (nextUsage == undefined || nextUsage.length == 0) {
			nextUsage = $(element.cloneNode(true));
			dndHandler.applyActionsEvents(nextUsage.get(0));
		}
		$(nextUsage).attr("time", `${offCdTime.toFixed(3)}`).css({"position": "absolute", "top": `${offCdPosition}px`, "left": "", "height": ""});
		$("#cds").append(nextUsage);
		addTimeUntil(offCdTime + 5);
	}

	// // if (checkDelay) {
 //        var simTime = startTime;
 //        if (idx > 0)
 //            simTime = Number($(element).prev().attr("time"));
 //        // console.log($(element).attr("name") + " " + $(element).attr("time") + " " + simTime);
 //        deleteAfter(RotationHistory, simTime);
 //        removeEffectsAfter(simTime);
 //        removeDpsAfter(simTime);
 //        playUntil($("#rotation").children(), RotationHistory, Number($(element).attr("time")));

 //        RotationHistory.forEach(e => {
	// 		if (e.time >= simTime) {
	// 			displayDps(Math.floor(e.dps), e.time);
	// 			getEffects(e.name).forEach(ef => {
	// 				var activationTime = ef.activationTime == undefined ? 0 : ef.activationTime;
	// 				drawEffect(ef.name, Number(e.time) + Number(activationTime), Number(e.time) + Number(ef.duration) + Number(activationTime));
	// 			});
	// 		}
	// 	});
		// console.log(RotationHistory);
	// }
    // TODO : Add time until end of last effect
}

function removeAction(element) {
	// Removing associated next possible usage
	$("#cds").children().filter(function(index) {return $(this).attr("name") === $(element).attr("name") && Number($(this).attr("time")) === Number($(element).attr("time")) + getRecastTime($(element).attr("name"));}).remove();
	
    var idx = $("#rotation").children().index(element);
    if (Number($(element).attr("time")) < 0) {
        setStartTime(startTime + getAnimationLock($(element).attr("name")));
        idx = 0;
    }
    $(element).remove();
    updateRotationAfterIndex(idx);
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

function timeDiv(time) {
	var tDiv = $(`<div>${time}</div>`).attr("time", `${time.toFixed(3)}`).css("height", `${scale}px`);
	var rect = $("#timeline").parent().get(0).getBoundingClientRect();
	tDiv.prepend($("<div></div>").css({"position": "absolute", "left": "0px", "height": "1px", "width": `${rect.width}px`, "background-color": "black", "z-index": "1"}));
    return tDiv;
}

function addTimeUntil(time) {
    var currentMax = -1;
    if ($("#timeline").children().length > 1)
        currentMax = Number($("#timeline").children().last().attr("time"));
    for (i = currentMax + 1; i <= time; i++) {
        $("#timeline").append(timeDiv(i));
    }
}

function drawEffect(name, beginTime, endTime) {
    var posLeft = $("#effectsHeader").children(`[name="${name}"]`).position().left;
    var posWidth = $("#effectsHeader").children(`[name="${name}"]`).width() - 8;
    var posTop = (beginTime - startTime) * scale;
    var posHeight = (endTime - beginTime) * scale - 6;
    $("#effects").append($("<div></div>").attr({"class": "effect", "time": `${beginTime.toFixed(3)}`})
        .css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": "rgb(255,60,60)",
              "border": "solid 3px rgb(128, 30, 30)"}));
}

function deleteEffect(name, beginTime) {
	$("#effects").children().filter(function(index) {return $(this).attr("name") == name && Number($(this).attr("time")) == beginTime;}).remove();
}

function removeEffectsAfter(beginTime) {
	$("#effects").children().filter(function(index) {return Number($(this).attr("time")) > beginTime;}).remove();
}

function displayDps(dps, time) {
    var pos = (time - startTime) * scale;
    $("#dps").append($(`<div>${dps}</div>`).attr("time", `${time.toFixed(3)}`).css({"position": "absolute", "left": "0px", "top": `${pos}px`}));
}

function removeDpsAfter(beginTime) {
	$("#dps").children().filter(function(index) {return Number($(this).attr("time")) > beginTime;}).remove();
}

function clearRotation() {
	$("#rotation").empty();
    $("#timeline").empty();
	$("#timeline").append($("<div></div>").attr("time", "0").css("height", "0px"));
    $("#cds").empty();
    $("#effects").empty();
    $("#dps").empty();
    addTimeUntil(20);
    startTime = 0;
}

$("#clearRotation").click(clearRotation);

function openerAddAction(actionName, delayed) {
    var action = actions.find(ac => actionName === ac.name);
    $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).click();
    if (delayed == true)
        $("#rotation").children().last().attr("delayed", "true");
    else if (delayed == false)
        $("#rotation").children().last().attr("delayed", "false");
}

$("#opener").click(function(){
    jQuery.fx.off = true;
    clearRotation();
    openerAddAction("Blood of the Dragon");
    openerAddAction("Elusive Jump");
    openerAddAction("Heavy Thrust");
    openerAddAction("Diversion");
    openerAddAction("Battle Litany");
    openerAddAction("Impulse Drive");
    openerAddAction("Dragon Sight");
    openerAddAction("Blood for Blood");
    openerAddAction("Disembowel");
    openerAddAction("Potion");
    openerAddAction("Chaos Thrust");
    openerAddAction("Jump");
    openerAddAction("Wheeling Thrust");
    openerAddAction("Mirage Dive");
    openerAddAction("Geirskogul");
    openerAddAction("Fang and Claw");
    openerAddAction("Dragonfire Dive");
    openerAddAction("True Thrust");
    openerAddAction("Spineshatter Dive");
    openerAddAction("Vorpal Thrust");
    openerAddAction("Mirage Dive");
    openerAddAction("Life Surge");
    openerAddAction("Full Thrust");
    openerAddAction("Fang and Claw");
    openerAddAction("Wheeling Thrust");
    $(".scrollable").scrollTop(0);
    jQuery.fx.off = false;
});

$("#GCD").blur(function(){
    if(Number($("#GCD").val()) < Number($("#GCD").attr("min")))
        $("#GCD").val($("#GCD").attr("min"));
    if(Number($("#GCD").val()) > Number($("#GCD").attr("max")))
        $("#GCD").val($("#GCD").attr("max"));
    $("#GCD").val(Math.trunc($("#GCD").val() * 100) / 100);
    updateRotationAfterIndex(0);
});
$("#Latency").blur(function(){
    if(Number($("#Latency").val()) < Number($("#Latency").attr("min")))
        $("#Latency").val($("#Latency").attr("min"));
    if(Number($("#Latency").val()) > Number($("#Latency").attr("max")))
        $("#Latency").val($("#Latency").attr("max"));
    $("#Latency").val(Math.trunc($("#Latency").val()));
	updateStartTime();
    updateRotationAfterIndex(0);
});

$("#Scale").blur(function(){
    if(Number($("#Scale").val()) < Number($("#Scale").attr("min")))
        $("#Scale").val($("#Scale").attr("min"));
    if(Number($("#Scale").val()) > Number($("#Scale").attr("max")))
        $("#Scale").val($("#Scale").attr("max"));
    $("#Scale").val(Math.trunc($("#Scale").val() * 100) / 100);
    scale = $("#Scale").val();
    $("#timeline").empty();
    $("#timeline").append($("<div></div>").attr("time", "0").css("height", "0px"));
    setStartTime(0);
    updateStartTime();
    updateRotationAfterIndex(0);
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
}

function updateStartTime() {
	var prePullTime = 0;
	$("#rotation").children().filter(function(index) {return $(this).attr("time") < 0;}).each(function(index) {prePullTime -= getAnimationLock($(this).attr("name"));});
	setStartTime(prePullTime);
}

var startTime = 0;
var RotationHistory = [];
clearRotation();