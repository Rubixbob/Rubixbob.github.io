actions.forEach(function (ac) {
    var action = $("<div></div>").attr({name: ac.name, class: `action draggable ${ac.type}`});
    action.append($("<div></div>").attr("class", "actionImage").css("background-image", `url("images/${ac.name}.png")`));
    $(`#${ac.group}`).append(action);
});

(function() {
    var dndHandler = {
        draggedElement: null,
        // clone: null,

        applyActionsEvents: function(element) {
            element.draggable = true;

            var dndHandler = this;

            element.addEventListener('dragstart', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') != -1) {
                    target = target.parentNode;
                }
                dndHandler.draggedElement = target.cloneNode(true);
                dndHandler.applyRotationEvents(dndHandler.draggedElement);
                e.dataTransfer.setData('text/plain', '');
            });

            element.addEventListener('click', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') != -1) {
                    target = target.parentNode;
                }
                var clonedElement = target.cloneNode(true);
                dndHandler.applyRotationEvents(clonedElement);
                addActionAtIndex(clonedElement, $("#rotation").children().length);
                var scrollValue = parseInt($("#rotation").children().last().css("top"), 10) - 200;
                $(".scrollable").animate({scrollTop:scrollValue}, 50, "linear");
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

                // Move action to spot below pointer
                var curIdx = $("#rotation").children().index(dndHandler.draggedElement);
                if (curIdx === -1)
                    curIdx = $("#rotation").children().length;
                addActionAtIndex(dndHandler.draggedElement, curIdx);
                var startTime = Number($("#timeline").children().first().attr("time"));
                var time = (e.clientY-target.getBoundingClientRect().top) / scale + startTime;
                var idx = $("#rotation").children().filter(function(index) {
                    return Number($(this).attr("time")) + getAnimationLock($(this).attr("name")) / 2 <= time
                        && index != curIdx;
                }).length;
                if (idx > curIdx) {
                    addActionAtIndex($("#rotation").children().eq(idx), idx-1);
                    addActionAtIndex(dndHandler.draggedElement, idx);
                    updateRotationAfterIndex(idx + 1);
                } else if (idx < curIdx) {
                    addActionAtIndex(dndHandler.draggedElement, idx);
                    addActionAtIndex($("#rotation").children().eq(idx+1), idx+1);
                    updateRotationAfterIndex(idx + 1);
                }

                // Snap to previous or next action
                if ($(dndHandler.draggedElement).hasClass("Weaponskill") || idx === 0 || idx === $("#rotation").children().length)
                    return;
                var prevAc = $(dndHandler.draggedElement).prev();
                var minTime = Number(prevAc.attr("time")) + getAnimationLock(prevAc.attr("name"));
                var nextAc = $(dndHandler.draggedElement).next();
                var maxTime = Number(nextAc.attr("time"));
                var midTime = (minTime + maxTime) / 2;
                var delayed = $(dndHandler.draggedElement).attr("delayed")
                if (time <= midTime) {
                    if (delayed === "true" || delayed === undefined) {
                        $(dndHandler.draggedElement).attr("delayed", "false");
                        addActionAtIndex(dndHandler.draggedElement, idx);
                    }
                } else {
                    if (delayed === "false" || delayed === undefined) {
                        $(dndHandler.draggedElement).attr("delayed", "true");
                        addActionAtIndex(dndHandler.draggedElement, idx);
                    }
                }
            });

            dropper.addEventListener('dragleave', function(e) {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    var tempClone = dndHandler.draggedElement.cloneNode(true);
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
            });

            element.addEventListener('click', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') != -1) {
                    target = target.parentNode;
                }
                removeAction(target);
            });
        }
    };

    $(".draggable").each(function(index) { dndHandler.applyActionsEvents(this); });
    $(".dropper").each(function(index) { dndHandler.applyDropEvents(this); });
})();

function addActionAtIndex(element, idx) {
    // Re-adjusts previous delayed abilities
    var ogcdsToDelay = null,
        delayList = [];
    var previousGcds = $("#rotation").children().filter(function(index) {return index < idx && $(this).hasClass("Weaponskill");});
    if (previousGcds.length > 0) {
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
        ogcdsToDelay.each(function(index) {addActionAtIndex(this, lastGcdIdx + (index + 1));});
    }

    var time = startTime;
    if (idx > 0) {
        // GCD
        var timeGcd = startTime;
        var gcds = $("#rotation").children().filter(function(index) {return index < idx && $(this).hasClass("Weaponskill");});
        if ($(element).hasClass("Weaponskill") && gcds.length > 0)
            timeGcd = (Number(gcds.last().attr("time")) * 100 + Number($("#GCD").val()) * 100) / 100;
        // Anim lock
        var previousAc = $("#rotation").children().filter(function(index) {return index < idx;}).last();
        var incr = getAnimationLock(previousAc.attr("name"));
        var animLockTime = (Number(previousAc.attr("time")) * 100 + incr * 100) / 100;
        time = Math.max(animLockTime, timeGcd);
    }

    // Delayed ability
    if ($(element).attr("delayed") === "true" && idx < $("#rotation").children().length - 1) {
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
				console.log("not pre pull");
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
            console.log("pre pull");
        console.log(startTime);
        setStartTime(startTime + getAnimationLock($(element).attr("name")));
        console.log(startTime);
        console.log(time);
		updateRotationBeforeIndex(idx);
	}

    // Display position
    var position = (time - startTime) * scale;
    var offset = 1;
    if ($(element).hasClass("Ability"))
        offset += 30;
    var animLockHeight = scale * getAnimationLock($(element).attr("name"));
    var addedElt = $(element).attr({"time": `${time.toFixed(3)}`, "title": `${time.toFixed(3)}`}).css({"position": "absolute", "top": `${position}px`, "left": `${offset}px`, "height": `${animLockHeight}px`});

    // Adding action
    if (idx > 0)
        $("#rotation").children().eq(idx-1).after(addedElt);
    else
        $("#rotation").prepend(addedElt);
    addTimeUntil(time + 5);

    // Re-adjusts previous delayed abilities
    if (previousGcds.length > 0) {
        ogcdsToDelay.each(function(index) {$(this).attr("delayed", delayList[index]);});
        $(ogcdsToDelay.get().reverse()).each(function(index) {addActionAtIndex(this, idx - (index + 1));});
    }
}

function removeAction(element) {
    var idx = $("#rotation").children().index(element);
    if (Number($(element).attr("time")) < 0) {
        console.log(startTime);
        setStartTime(startTime + getAnimationLock($(element).attr("name")));
        console.log(startTime);
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
	var rect = $("#timeline").parent().get()[0].getBoundingClientRect();
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

function getAnimationLock(actionName) {
    var animLock = defaultAnimLock;
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("animLock"))
        animLock = action.animLock;
    return (Number($("#Latency").val()) + Number(animLock) * 1000) / 1000;
}

function getPotency(actionName) {
    var potency = 0;
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("potency"))
        potency = action.potency;
    return Number(potency);
}

function clearRotation() {
	$("#rotation").empty();
    $("#timeline").empty();
	$("#timeline").append($("<div></div>").attr("time", "0").css("height", "0px"));
    addTimeUntil(20);
    startTime = 0;
}

$("#clearRotation").click(function(){ clearRotation(); });

function openerAddAction(actionName) {
    var action = actions.find(ac => actionName === ac.name);
    $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).click();
}

function openerAddDelayedAction(actionName) {
    openerAddAction(actionName);
    $("#rotation").children().last().attr("delayed", "true");
}

$("#opener").click(function(){
    jQuery.fx.off = true;
    clearRotation();
    openerAddAction("Blood of the Dragon");
    openerAddAction("Elusive Jump");
    openerAddAction("Heavy Thrust");
    openerAddAction("Diversion");
    openerAddDelayedAction("Battle Litany");
    openerAddAction("Impulse Drive");
    openerAddDelayedAction("Dragon Sight");
    openerAddDelayedAction("Blood for Blood");
    openerAddAction("Disembowel");
    openerAddDelayedAction("Potion");
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
clearRotation();