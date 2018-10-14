actions.forEach(function (ac) {
    var action = $("<div></div>").attr({name: ac.name, class: `action draggable ${ac.type}`});
    action.append($("<div></div>").attr("class", "actionImage").css("background-image", `url("images/${ac.name}.png")`));
    $(`#${ac.group}`).append(action);
});

(function() {
    var dndHandler = {
        draggedElement: null,

        applyDragEvents: function(element) {
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
        },

        applyDropEvents: function(dropper) {
            dropper.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.className = 'dropper drop_hover';
            });

            dropper.addEventListener('dragleave', function() {
                this.className = 'dropper';
            });

            var dndHandler = this;

            dropper.addEventListener('drop', function(e) {
                var target = e.target,
                    draggedElement = dndHandler.draggedElement,
                    clonedElement = draggedElement.cloneNode(true);

                while (target.className.indexOf('dropper') == -1) {
                    target = target.parentNode;
                }

                target.className = 'dropper';

                dndHandler.applyDragEvents(clonedElement);
                dndHandler.applyClickToDeleteEvents(clonedElement);
                addActionAtIndex(clonedElement, $("#rotation").children().length);
                if (draggedElement.parentNode.id === "rotation")
                	draggedElement.parentNode.removeChild(draggedElement);
            });
        },

        applyClickEvents: function(element) {
        	var dndHandler = this;
        	element.addEventListener('click', function(e) {
        		var target = e.target;
                while (target.parentNode.className.indexOf('draggable') != -1) {
                    target = target.parentNode;
                }
                var clonedElement = target.cloneNode(true);
        		dndHandler.applyDragEvents(clonedElement);
                dndHandler.applyClickToDeleteEvents(clonedElement);
        		addActionAtIndex(clonedElement, $("#rotation").children().length);
        	});
        },

        applyClickToDeleteEvents: function(element) {
            var dndHandler = this;
            element.addEventListener('click', function(e) {
                var target = e.target;
                while (target.parentNode.className.indexOf('draggable') != -1) {
                    target = target.parentNode;
                }
                var idx = $("#rotation").children().index(target);
                $(target).remove();
                $("#rotation").children().filter(function(index) {return index >= idx;}).each(function(index) {
                    var clonedElement = this.cloneNode(true);
                    dndHandler.applyDragEvents(clonedElement);
                    dndHandler.applyClickToDeleteEvents(clonedElement);
                    addActionAtIndex(clonedElement, index + idx);
                    this.remove();
                });
            });
        }
    };

    $(".draggable").each(function(index) { dndHandler.applyDragEvents(this); dndHandler.applyClickEvents(this); });
    $(".dropper").each(function(index) { dndHandler.applyDropEvents(this); });
})();

var scale = 60;
var gcd = 2.5;

function addAction(element, time = 0) {
	if (time == 0 && $("#rotation").children().length > 0) {
        var timeGcd = 0;
        if ($(element).hasClass("Weaponskill") && $("#rotation").children(".Weaponskill").length > 0)
            timeGcd = (Number($("#rotation").children(".Weaponskill").last().attr("time")) * 100 + gcd * 100) / 100;
        //animlock
        var incr = defaultAnimLock;
        var lastAc = actions.find(ac => $("#rotation").children().last().attr("name") === ac.name);
        if (lastAc.hasOwnProperty("animLock"))
            incr = lastAc.animLock;
        // if (lastAc.name === "Delay") // TODO : Delay
        //     incr = Number($("#rotation").children(".Weaponskill").last().attr("time"))
        time = (Number($("#rotation").children().last().attr("time")) * 100 + incr * 100) / 100;
        time = Math.max(time, timeGcd);
	}
	var position = time * scale;
    var offset = 2;
    if ($(element).hasClass("Ability"))
        offset += 30;
    var animLockHeight = scale * defaultAnimLock;
    curAc = actions.find(ac => $(element).attr("name") === ac.name);
    if (curAc.hasOwnProperty("animLock"))
        animLockHeight = scale * curAc.animLock;
    var addedElt = $(element).attr("time", `${time}`).css({"position": "absolute", "top": `${position}px`, "left": `${offset}px`, "height": `${animLockHeight}px`});
    $("#rotation").append(addedElt);
    addTimeUntil(time + 5);
}

function addActionAtIndex(element, idx) {
    console.log(element);
    console.log(idx);
    var time = 0;
    if (idx > 0) {
        var timeGcd = 0;
        if ($(element).hasClass("Weaponskill") && $("#rotation").children().filter(function(index) {return index < idx && $(this).hasClass("Weaponskill");}).length > 0)
            timeGcd = (Number($("#rotation").children().filter(function(index) {return index < idx && $(this).hasClass("Weaponskill");}).last().attr("time")) * 100 + gcd * 100) / 100;
        console.log(timeGcd);
        //animlock
        var incr = defaultAnimLock;
        var lastAc = actions.find(ac => $("#rotation").children().filter(function(index) {return index < idx;}).last().attr("name") === ac.name);
        if (lastAc.hasOwnProperty("animLock"))
            incr = lastAc.animLock;
        // if (lastAc.name === "Delay") // TODO : Delay
        //     incr = Number($("#rotation").children(".Weaponskill").last().attr("time"))
        time = (Number($("#rotation").children().filter(function(index) {return index < idx;}).last().attr("time")) * 100 + incr * 100) / 100;
        console.log(time);
        time = Math.max(time, timeGcd);
    }

    var position = time * scale;
    var offset = 2;
    if ($(element).hasClass("Ability"))
        offset += 30;
    var animLockHeight = scale * defaultAnimLock;
    curAc = actions.find(ac => $(element).attr("name") === ac.name);
    if (curAc.hasOwnProperty("animLock"))
        animLockHeight = scale * curAc.animLock;
    var addedElt = $(element).attr("time", `${time}`).css({"position": "absolute", "top": `${position}px`, "left": `${offset}px`, "height": `${animLockHeight}px`});
    if (idx > 0)
        $("#rotation").children().eq(idx-1).after(addedElt);
    else
        $("#rotation").prepend(addedElt);
    addTimeUntil(time + 5);
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

addTimeUntil(10);

$("#clearRotation").click(function(){
    $("#rotation").empty();
    $("#timeline").empty();
    addTimeUntil(10);
});