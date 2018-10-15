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
                // dndHandler.clone = dndHandler.draggedElement.cloneNode(true);
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
                // this.className = 'dropper drop_hover';
                var curIdx = $("#rotation").children().index(dndHandler.draggedElement);
                if (curIdx === -1)
                    curIdx = $("#rotation").children().length;
                addActionAtIndex(dndHandler.draggedElement, curIdx);
                var time = (e.clientY-target.getBoundingClientRect().top) / scale;
                var idx = $("#rotation").children().filter(function(index) {
                    return Number($(this).attr("time")) + getAnimationLock($(this).attr("name")) / 2 <= time
                        && index != curIdx;
                }).length;
                // console.log(idx);
                if (idx === curIdx)
                    return;
                else if (idx > curIdx) {
                    addActionAtIndex($("#rotation").children().eq(idx), idx-1);
                    addActionAtIndex(dndHandler.draggedElement, idx);
                } else {
                    addActionAtIndex(dndHandler.draggedElement, idx);
                    addActionAtIndex($("#rotation").children().eq(idx+1), idx+1);
                }
                updateRotationAfterIndex(idx + 1);
            });

            dropper.addEventListener('dragleave', function(e) {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    var tempClone = dndHandler.draggedElement.cloneNode(true);
                    var idx = $("#rotation").children().index(dndHandler.draggedElement);
                    $(dndHandler.draggedElement).remove();
                    updateRotationAfterIndex(idx);
                    dndHandler.draggedElement = tempClone;
                }
                // this.className = 'dropper';
            });

            dropper.addEventListener('drop', function(e) {
                var target = e.target,
                    draggedElement = dndHandler.draggedElement,
                    clonedElement = draggedElement.cloneNode(true);

                while (target.className.indexOf('dropper') == -1) {
                    target = target.parentNode;
                }

                // target.className = 'dropper';

                dndHandler.applyRotationEvents(dndHandler.draggedElement);
                // addActionAtIndex(clonedElement, $("#rotation").children().length);
                // if (draggedElement.parentNode.id === "rotation")
                // 	draggedElement.parentNode.removeChild(draggedElement);
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
                // dndHandler.clone = dndHandler.draggedElement.cloneNode(true);
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

var scale = 60;
var gcd = 2.5;

function addActionAtIndex(element, idx) {
    var time = 0;
    if (idx > 0) {
        var timeGcd = 0;
        var gcds = $("#rotation").children().filter(function(index) {return index < idx && $(this).hasClass("Weaponskill");});
        if ($(element).hasClass("Weaponskill") && gcds.length > 0)
            timeGcd = (Number(gcds.last().attr("time")) * 100 + gcd * 100) / 100;
        //animlock
        var previousAc = $("#rotation").children().filter(function(index) {return index < idx;}).last();
        var incr = getAnimationLock(previousAc.attr("name"));
        // if (lastAc.name === "Delay") // TODO : Delay
        //     incr = Number($("#rotation").children(".Weaponskill").last().attr("time"))
        time = (Number(previousAc.attr("time")) * 100 + incr * 100) / 100;
        time = Math.max(time, timeGcd);
    }

    var position = time * scale;
    var offset = 1;
    if ($(element).hasClass("Ability"))
        offset += 30;
    var animLockHeight = scale * getAnimationLock($(element).attr("name"));
    var addedElt = $(element).attr("time", `${time}`).css({"position": "absolute", "top": `${position}px`, "left": `${offset}px`, "height": `${animLockHeight}px`});
    if (idx > 0)
        $("#rotation").children().eq(idx-1).after(addedElt);
    else
        $("#rotation").prepend(addedElt);
    addTimeUntil(time + 5);
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
    return animLock;
}

addTimeUntil(20);

$("#clearRotation").click(function(){
    $("#rotation").empty();
    $("#timeline").empty();
    addTimeUntil(20);
});

$("#opener").click(function(){
    $("#rotation").empty();
    $("#timeline").empty();
    addTimeUntil(20);
    var action = actions.find(ac => "Impulse Drive" === ac.name);
    $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).click();
    action = actions.find(ac => "Life Surge" === ac.name);
    $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).click();
    action = actions.find(ac => "Life Surge" === ac.name);
    $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).click();
    action = actions.find(ac => "Impulse Drive" === ac.name);
    $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).click();
    action = actions.find(ac => "Life Surge" === ac.name);
    $("#actions").children(`#${action.group}`).children(`[name="${action.name}"]`).click();
});