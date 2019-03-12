var raidBuffLightboxJobIndex = 0; // Will have to be passed as a parameter maybe
var standardComp = ["war", "pld", "sch", "ast", "nin", "brd", "smn"];
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
    $("#columns").children().each(function(index) {$(this).attr("width", $("#headers").children().eq(index).width() + "px");});
    $("#timeline").children().children().each(function(findex) { $(this).css("width", `${$("#columns").get(0).getBoundingClientRect().width}px`); });
    $("#groupEffects").children().each(function(index) { $(this).css("left", $("#groupEffectsHeader").children(`[name="${$(this).attr("name")}"][jobIndex="${$(this).attr("jobIndex")}"]`).position().left + "px"); });
}

var imagesToLoad = 0;
var imagesLoaded = 0;

effects.forEach(function (ef) {
    if (ef.displaySelf) {
        var effect = $("<img></img>").attr({name: ef.name, class: `${ef.type}`, src: `images/effects/${ef.name}.png`}).one("load", function() {
            imagesLoaded++;
            if (imagesLoaded === imagesToLoad)
                fitColumns();
        }).each(function() {
            $("#effectsHeader").append(this);
            imagesToLoad++;
            if (this.complete)
                $(this).trigger('load');
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

                if (RotationHistory.length === 0)
                    updateDps();
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
			if (parentId === "rotation" || parentId === "cds") {
				var name = $(element).attr("name");
				var time = $(element).attr("time");
				return name + "<br/>" + time + "s";
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
	$("#cds").children().filter(function(index) {return $(this).attr("name") === $(element).attr("name") && Number($(this).attr("time")) === Number($(element).attr("time")) + getRecastTime($(element).attr("name"));}).remove();
	
    resetDps();

    var idx = $("#rotation").children().index(element);
    if (Number($(element).attr("time")) < 0) {
        setStartTime(startTime + getAnimationLock($(element).attr("name")));
        idx = 0;
    }
    $(element).remove();
    updateRotationAfterIndex(idx);

    if ($("#rotation").children().length >0)
        updateDps();
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
	var rect = $("#columns").get(0).getBoundingClientRect();
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
    if ($("#effectsHeader").children(`[name="${name}"]`).length > 0) {
        var posLeft = $("#effectsHeader").children(`[name="${name}"]`).position().left;
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
        
        $("#effects").append($("<div></div>").attr({"class": "effect", "time": `${beginTime.toFixed(3)}`, "endTime": `${endTime.toFixed(3)}`})
            .css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`,
                  "border": `solid 3px ${borderColor}`}));
        addTimeUntil(endTime + 5);
    }
}

function drawGroupEffect(name, beginTime, endTime, royalRoad) {
    if ($("#groupEffectsHeader").children(`[name="${name}"][jobIndex="${raidBuffLightboxJobIndex}"]`).length > 0) {
        var posLeft = $("#groupEffectsHeader").children(`[name="${name}"][jobIndex="${raidBuffLightboxJobIndex}"]`).position().left;
        var posWidth = $("#groupEffectsHeader").children(`[name="${name}"][jobIndex="${raidBuffLightboxJobIndex}"]`).width() - 8;
        var posTop = (beginTime - startTime) * scale;
        var posHeight = (endTime - beginTime) * scale - 6;
        
        var effect = effects.find(ef => name === ef.name);
        var backgroundColor = "rgb(255,60,60)";
        // if (effect.hasOwnProperty("backgroundColor"))
            // backgroundColor = effect.backgroundColor;
        var borderColor = "rgb(128, 30, 30)";
        // if (effect.hasOwnProperty("borderColor"))
            // borderColor = effect.borderColor;
        
        var wrapper = $("<div></div>");
        wrapper.attr({"class": "effect", "name": name, "jobIndex": raidBuffLightboxJobIndex, "time": `${beginTime.toFixed(3)}`, "endTime": `${endTime.toFixed(3)}`});
        if (royalRoad)
            wrapper.attr("royalRoad", royalRoad);
        wrapper.css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`,
                     "border": `solid 3px ${borderColor}`, "cursor": "pointer"});
        wrapper.click(function() { // TODO : find permanent solution
            $(this).remove();
            if (name === "The Arrow" || name === "Fey Wind") {
                updateGcdTimeline();
                updateRotationAfterIndex(0);
            }
            if ($("#rotation").children().length > 0)
                resetAndUpdateDps();
        });
        
        var overlay = $("<div></div>");
        overlay.css({"position": "relative", "left": "-3px", "top": "-3px", "width": `${posWidth+6}px`, "height": "0px", "background-color": "black", "opacity": "0.7"});
        overlay.attr("endtime", endTime);
        
        wrapper.append(overlay);
        $("#groupEffects").append(wrapper);
        addTimeUntil(endTime + 5);
    }
}

function updateGroupEffectOverlay(name, beginTime, endTime, jobIndex) {
    var wrapper = $("#groupEffects").children(`[name="${name}"][jobIndex="${jobIndex}"]`);
    var overlay = wrapper.children();
    overlay.attr("endtime", endTime);
    
    var posTop = (endTime - beginTime) * scale - 3;
    var posHeight = (Number(wrapper.attr("endTime")) - endTime) * scale;
    
    overlay.css({"top": `${posTop}px`, "height": `${posHeight}px`});
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
    var posWidth = 36;
    var zIndex = 1;
    var beginTime, backgroundColor;
    var effect = effects.find(ef => "Blood of the Dragon" === ef.name);
    
    var botdDiv = function(beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex) {
        return $("<div></div>").attr({"time": `${beginTime.toFixed(3)}`, "endTime": `${eTime.toFixed(3)}`})
        .css({"position": "absolute", "left": `${posLeft}px`, "top": `${posTop}px`, "height": `${posHeight}px`, "width": `${posWidth}px`, "background-color": `${backgroundColor}`, "z-index": `${zIndex}`});
    };
    
    switch (type) {
        case "blood":
            beginTime = botdObject.bloodStart;
            backgroundColor = effect.backgroundColor;
            var posTop = Math.round((beginTime - startTime) * scale + 1);
            var posHeight = Math.round((eTime - beginTime) * scale);
            $("#botd").append(botdDiv(beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex));
            break;
        case "life":
            beginTime = botdObject.lifeStart;
            backgroundColor = effect.lifeColor;
            var posTop = Math.round((beginTime - startTime) * scale + 1);
            var posHeight = Math.round((eTime - beginTime) * scale);
            var lifeDiv = botdDiv(beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex);
            
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
                $("#botd").append(botdDiv(beginTime, eTime, posLeft, posTop, posHeight, posWidth, backgroundColor, zIndex).css("border-radius", "3px"));
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

function displayDps(dps, time) {
    var pos = (time - startTime) * scale;
    $("#dps").append($(`<div>${dps}</div>`).attr("time", `${time.toFixed(3)}`).css({"position": "absolute", "left": "0px", "top": `${pos}px`}));
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
        } else if (e.type === "effectBegin") {
            if (e.timedEffect.displaySelf) {
                drawEffect(e.name, e.timedEffect.beginTime, e.timedEffect.endTime);
            } else if (e.timedEffect.hasOwnProperty("jobIndex")) {
                // update group effect with overlay
                updateGroupEffectOverlay(e.name, e.timedEffect.beginTime, e.timedEffect.endTime, e.timedEffect.jobIndex);
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
                if (botdObject.eyeCount === 3) { // Blood end | Life start
                    drawBotd("blood", botdObject, e.time);
                    drawBotd("eye", botdObject, e.time);
                    botdObject.eyeCount = 0;
                    botdObject.lifeStart = e.time;
                }
                break;
            case "Mirage Dive":
                if (botdObject.eyeCount >= 0) { // When blood/life up
                    botdObject.eyeTime[botdObject.eyeCount] = e.time;
                    botdObject.eyeCount = Math.min(botdObject.eyeCount + 1, 3);
                }
                break;
            default:
                break;
        }
    });
    $("#DPSout").val($("#dps").children().last().html());
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
    $("#timeline").empty();
	$("#timeline").append($("<div></div>").attr("time", "0").css("height", "0px"));
    $("#cds").empty();
    $("#DPSout").val("");
    resetDps();
    addTimeUntil(20);
    startTime = 0;
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
    openerAddAction("Elusive Jump");
    openerAddAction("Heavy Thrust");
    openerAddAction("Diversion");
    openerAddAction("Dragon Sight");
    openerAddAction("Impulse Drive");
    openerAddAction("Battle Litany");
    openerAddAction("Blood for Blood");
    openerAddAction("Disembowel");
    openerAddAction("Potion");
    openerAddAction("Chaos Thrust");
    openerAddAction("Jump");
    openerAddAction("Wheeling Thrust");
    openerAddAction("Geirskogul");
    openerAddAction("Mirage Dive");
    openerAddAction("Fang and Claw");
    openerAddAction("Dragonfire Dive");
    openerAddAction("True Thrust");
    openerAddAction("Spineshatter Dive");
    openerAddAction("Vorpal Thrust");
    openerAddAction("Life Surge");
    openerAddAction("Mirage Dive");
    openerAddAction("Full Thrust");
    openerAddAction("Fang and Claw");
    openerAddAction("Wheeling Thrust");

    updateDps();
});

$("#loadRotation").click(function() {
    clearRotation();
    var savedRotationObject = JSON.parse(savedRotation);
    stats.wd = savedRotationObject.wd;
    stats.str = savedRotationObject.str;
    stats.dh = savedRotationObject.dh;
    stats.crit = savedRotationObject.crit;
    stats.det = savedRotationObject.det;
    stats.sks = savedRotationObject.sks;
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

    updateDps();
});

$("#saveRotation").click(function() {
    var savedRotationObject = {
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
    savedRotation = JSON.stringify(savedRotationObject);
    console.log(savedRotation);
});

$("#threeMinRotation").click(function() {
    clearRotation();
    var savedRotationObject = threeMinRotation;
    stats.wd = savedRotationObject.wd;
    stats.str = savedRotationObject.str;
    stats.dh = savedRotationObject.dh;
    stats.crit = savedRotationObject.crit;
    stats.det = savedRotationObject.det;
    stats.sks = savedRotationObject.sks;
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

    updateDps();
});

$("#debugButton").click(function() {
    RotationHistory.forEach(function(item) { item.display(); });
});

function trimInput(element) {
    if(Number(element.val()) < Number(element.attr("min")))
        element.val(element.attr("min"));
    if(Number(element.val()) > Number(element.attr("max")))
        element.val(element.attr("max"));
}

// $("#GCD").blur(function(){ // TODO : Replace by stats
//     trimInput($("#GCD"));
//     $("#GCD").val(Math.trunc($("#GCD").val() * 100) / 100);
//     if ($("#rotation").children().length > 0) {
//         updateStartTime();
//         updateRotationAfterIndex(0);
//         resetAndUpdateDps();
//     }
// });
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
    $("#DHoutRate").val(stats.dhRate());
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
});

$("#CRITin").change(function() {
    trimInput($("#CRITin"));
    $("#CRITin").val(Math.trunc($("#CRITin").val()));
    stats.crit = Number($("#CRITin").val());
    $("#CRITout").val(stats.critMod());
    $("#CRIToutRate").val(stats.critRate());
    $("#CRIToutDmg").val(stats.critDamage());
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
    $("#SKSoutGCD").val(stats.gcd());
    if ($("#rotation").children().length > 0) {
        updateStartTime();
        updateRotationAfterIndex(0);
        resetAndUpdateDps();
    }
});

$(window).bind('mousewheel DOMMouseScroll', function(event) 
{
    if(event.ctrlKey == true)
    {
        event.preventDefault();
        var scrollTopOffset = Number($(".scrollable").attr("scrollTop")) || 0;
        var scrollTime = ($(".scrollable").scrollTop() + scrollTopOffset) / scale;

        if(event.originalEvent.deltaY > 0) {
            scale /= 1.1;
        } else {
            scale *= 1.1;
        }
        $("#timeline").children().css("height", `${scale}px`);
        var value = $("#timeline").children().eq(0).attr("time");
        $("#timeline").children().eq(0).css("height", `${(Math.ceil(value)-value) * scale}px`);

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
            
            var overlay = $(this).children();
            endTime = overlay.attr("endtime");
            var posTop = (endTime - beginTime) * scale - 3;
            var posHeight = (Number($(this).attr("endTime")) - endTime) * scale;
            overlay.css({"top": `${posTop}px`, "height": `${posHeight}px`});
        });

        $("#cds").children().each(function(index) {
            var offCdPosition = ($(this).attr("time") - startTime) * scale;
            $(this).css("top", `${offCdPosition}px`);
        });

        $("#dps").children().each(function(index) {
            var pos = ($(this).attr("time") - startTime) * scale;
            $(this).css("top", `${pos}px`);
        });
        $(".scrollable").attr("scrollTop", (scrollTime * scale) % 1);
        $(".scrollable").scrollTop(scrollTime * scale);
    } else {
        $(".scrollable").attr("scrollTop", 0);
    }
});

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
    if ($("#raidBuffLightboxBalance").prop("checked"))
        selectCard("The Balance");
});

$("#raidBuffLightboxSpear").change(function() {
    if ($("#raidBuffLightboxSpear").prop("checked"))
        selectCard("The Spear");
});

$("#raidBuffLightboxArrow").change(function() {
    if ($("#raidBuffLightboxArrow").prop("checked"))
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
    adjustCardDuration();
});

$("#raidBuffLightboxExpanded").change(function() {
    adjustCardDuration();
});

$("#raidBuffLightboxExtended").change(function() {
    adjustCardDuration();
});

$("#raidBuffLightboxEnhanced").change(function() {
    adjustCardDuration();
});

$("#raidBuffLightboxCelestialOpposition").change(function() {
    adjustCardDuration();
});

$("#raidBuffLightboxTimeDilation").change(function() {
    adjustCardDuration();
});

function setUpRaidBuffLightbox(name) {
    $("#raidBuffLightboxTitle").val(name); // Don't delete, this value is used in the OK call
    $("#raidBuffLightboxImg").attr("src", `images/effects/${name}.png`);
    $("#raidBuffLightboxStartTimeInput").val(0);
    $("#raidBuffLightboxDurationInput").val(getEffectDuration(name));
    $("#raidBuffLightboxDurationOutput").val(getEffectDuration(name));
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
            $(`#raidBuffLightbox${name.substring(4)}`).prop("checked", true).change();
            $("#raidBuffLightboxExpanded").prop("checked", true).change();
            $("#raidBuffLightboxCelestialOpposition").prop("checked", true).change();
            $("#raidBuffLightboxTimeDilation").prop("checked", false).change();
            $("#raidBuffLightboxCardsRow").prop("hidden", false);
            $("#raidBuffLightboxRoadRow").prop("hidden", false);
            $("#raidBuffLightboxAstRow").prop("hidden", false);
            break;
        default:
            $("#raidBuffLightboxNoEffect").prop("checked", true).change();
            $("#raidBuffLightboxCelestialOpposition").prop("checked", false).change();
            $("#raidBuffLightboxTimeDilation").prop("checked", false).change();
            $("#raidBuffLightboxCardsRow").prop("hidden", true);
            $("#raidBuffLightboxRoadRow").prop("hidden", true);
            $("#raidBuffLightboxAstRow").prop("hidden", true);
            break;
    }
}

function refreshGroupMember(index, value) {
    $("#groupEffectsHeader").children(`[jobIndex="${index}"]`).remove();
    $("#groupEffects").children(`[jobIndex="${index}"]`).remove();
    if ($("#rotation").children().length > 0)
        resetAndUpdateDps();
    
    memberEffects = effects.filter(ef => ef.job === value);
    if (memberEffects.length > 0) {
        var raidImagesToLoad = 0;
        var raidImagesLoaded = 0;
        var idx = 0;
        while (idx < $("#groupEffectsHeader").children().length && $("#groupEffectsHeader").children().eq(idx).attr("jobIndex") <= index) { idx++; }
        memberEffects.forEach(function (ef) {
            var wrapper = $("<div></div>").attr({name: ef.name, class: "raidBuff", jobIndex: index});
            // wrapper.append($("<span class='ui-icon ui-icon-plus'></span>").css({"position": "absolute", "top": "36px", "left": "4px"}));

            var effect = $("<img></img>").attr({class: ef.type, src: `images/effects/${ef.name}.png`}).one("load", function() {
                raidImagesLoaded++;
                if (raidImagesLoaded === raidImagesToLoad)
                    fitColumns();
            }).each(function() {
                var plusButton = $("<button class='circular ui icon button'><i class='icon plus'></i></button>").css({"padding": "4px", "display": "block"});
                $(plusButton).click(function() {
                    setUpRaidBuffLightbox(ef.name);
                    raidBuffLightboxJobIndex = index;
                    $("#raidBuffLightbox").modal("show");
                });
                wrapper.append(this);
                wrapper.append(plusButton);
                
                if (idx > 0)
                    $("#groupEffectsHeader").children().eq(idx-1).after(wrapper);
                else
                    $("#groupEffectsHeader").prepend(wrapper);
                
                idx++;
                raidImagesToLoad++;
                if (this.complete)
                    $(this).trigger('load');
            });
        });
    } else {
        fitColumns();
    }
}

$("#raidBuffLightboxConfirm").click(function() {
    var title = $("#raidBuffLightboxTitle").val()
    var royalRoad;
    if ($("#raidBuffLightboxExpanded").prop("checked"))
        royalRoad = "Expanded";
    if ($("#raidBuffLightboxEnhanced").prop("checked"))
        royalRoad = "Enhanced";
    drawGroupEffect(title, Number($("#raidBuffLightboxStartTimeInput").val()), Number($("#raidBuffLightboxStartTimeInput").val()) + Number($("#raidBuffLightboxDurationInput").val()), royalRoad);
    if (title === "The Arrow" || title === "Fey Wind") {
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
    refreshGroupMember(i, standardComp[i]);
}

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
    generateGcdTimeline(gcdTimeline, tempStats, $("#groupEffects").children("[name='The Arrow'], [name='Fey Wind']"));
}
