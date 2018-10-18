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
                var time = (e.clientY-target.getBoundingClientRect().top) / scale;
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
                    var idx = $("#rotation").children().index(dndHandler.draggedElement);
                    $(dndHandler.draggedElement).remove();
                    updateRotationAfterIndex(idx);
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
                var idx = $("#rotation").children().index(target);
                $(target).remove();
                updateRotationAfterIndex(idx);
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

    var time = 0;
    if (idx > 0) {
        // GCD
        var timeGcd = 0;
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
    if ($(element).attr("delayed") === "true" && idx != $("#rotation").children().length) {
        var delayTime = 0;
        if ($("#rotation").children().index(element) == idx) {
            delayTime = (Number($(element).next().attr("time")) * 100 - getAnimationLock($(element).attr("name")) * 100) / 100;
        } else {
            delayTime = (Number( $("#rotation").children().eq(idx).attr("time")) * 100 - getAnimationLock($(element).attr("name")) * 100) / 100;
        }
        time = Math.max(time, delayTime);
    }

    // Display position
    var position = time * scale;
    var offset = 1;
    if ($(element).hasClass("Ability"))
        offset += 30;
    var animLockHeight = scale * getAnimationLock($(element).attr("name"));
    var addedElt = $(element).attr("time", `${time}`).css({"position": "absolute", "top": `${position}px`, "left": `${offset}px`, "height": `${animLockHeight}px`});

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

function updateRotationAfterIndex(idx) {
    $("#rotation").children().filter(function(index) {return index >= idx;}).each(function(index) {
        addActionAtIndex(this, index + idx);
    });
}

function addTime(time) {
	var position = time * scale + document.getElementById("timeline").getBoundingClientRect().top;
    $("#timeline").append($(`<div>${time}</div>`).attr("time", `${time}`).css("height", `${scale}px`).get());
}

function addTimeUntil(time) {
    var currentMax = -1;
    if ($("#timeline").children().length > 0)
        currentMax = Number($("#timeline").children().last().attr("time"));
    for (i = currentMax + 1; i <= time; i++) {
        addTime(i);
    }
}

function getAnimationLock(actionName) {
    var animLock = defaultAnimLock;
    var action = actions.find(ac => actionName === ac.name);
    if (action.hasOwnProperty("animLock"))
        animLock = action.animLock;
    return Number($("#Latency").val()) / 1000 + Number(animLock);
}

addTimeUntil(20);

$("#clearRotation").click(function(){
    $("#rotation").empty();
    $("#timeline").empty();
    addTimeUntil(20);
});

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
    $("#rotation").empty();
    $("#timeline").empty();
    openerAddAction("Heavy Thrust");
    openerAddAction("Blood of the Dragon");
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

$("#GCD").blur(function(){updateRotationAfterIndex(0);});
$("#Latency").blur(function(){updateRotationAfterIndex(0);});