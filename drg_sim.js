actions.weaponskills.forEach(function (ac) {
	var acId = ac.name.replace("'", "").replace(/\s/g, "");
	$("#weaponskills").append($("<div></div>").attr({id: acId, class: "action draggable"}).css({"background-image": `url("images/${ac.name}.png")`, "background-repeat": "no-repeat", "background-color": "cyan"}).get());
});

actions.abilities.forEach(function (ac) {
	var acId = ac.name.replace("'", "").replace(/\s/g, "");
	$("#abilities").append($("<div></div>").attr({id: acId, class: "action draggable"}).css({"background-image": `url("images/${ac.name}.png")`, "background-repeat": "no-repeat"}).get());
});

(function() {
    var dndHandler = {
        draggedElement: null, // Propriété pointant vers l'élément en cours de déplacement

        applyDragEvents: function(element) {
            element.draggable = true;

            var dndHandler = this; // Cette variable est nécessaire pour que l'événement « dragstart » ci-dessous accède facilement au namespace « dndHandler »

            element.addEventListener('dragstart', function(e) {
                dndHandler.draggedElement = e.target; // On sauvegarde l'élément en cours de déplacement
                e.dataTransfer.setData('text/plain', ''); // Nécessaire pour Firefox
            });
        },

        applyDropEvents: function(dropper) {
            dropper.addEventListener('dragover', function(e) {
                e.preventDefault(); // On autorise le drop d'éléments
                this.className = 'dropper drop_hover'; // Et on applique le style adéquat à notre zone de drop quand un élément la survole
            });

            dropper.addEventListener('dragleave', function() {
                this.className = 'dropper'; // On revient au style de base lorsque l'élément quitte la zone de drop
            });

            var dndHandler = this; // Cette variable est nécessaire pour que l'événement « drop » ci-dessous accède facilement au namespace « dndHandler »

            dropper.addEventListener('drop', function(e) {
                var target = e.target,
                    draggedElement = dndHandler.draggedElement, // Récupération de l'élément concerné
                    clonedElement = draggedElement.cloneNode(true); // On créé immédiatement le clone de cet élément

                while (target.className.indexOf('dropper') == -1) { // Cette boucle permet de remonter jusqu'à la zone de drop parente
                    target = target.parentNode;
                }

                target.className = 'dropper'; // Application du style par défaut

                dndHandler.applyDragEvents(clonedElement); // Nouvelle application des événements qui ont été perdus lors du cloneNode()
                addAction(clonedElement);
                if (draggedElement.parentNode.id === "rotation")
                	draggedElement.parentNode.removeChild(draggedElement);
            });
        },

        applyClickEvents: function(element) {
        	var dndHandler = this;
        	element.addEventListener('click', function(e) {
        		var target = e.target,
        			clonedElement = target.cloneNode(true);
        		dndHandler.applyDragEvents(clonedElement);
        		addAction(clonedElement);
        	});
        }
    };

    $(".draggable").each(function(index) { dndHandler.applyDragEvents(this); dndHandler.applyClickEvents(this); });
    $(".dropper").each(function(index) { dndHandler.applyDropEvents(this); });
})();

var scale = 60;

function addAction(element, time = 0) {
	if (time == 0 && $("#rotation").children().length > 0) {
		time = Number($("#rotation").children().last().attr("time")) + 0.7; // TODO: check GCD + clip
	}
	var position = time * scale;
	$("#rotation").append($(element).attr("time", `${time}`).css({"position": "absolute", "top": `${position}px`}));
}

function addTime(time) {
	var position = time * scale + document.getElementById("timeline").getBoundingClientRect().top;
    //$("#timeline").append($(`<div>${time}</div>`).attr("time", `${time}`).css({"position": "absolute", "top": `${position}px`}).get());
    $("#timeline").append($(`<div>${time}</div>`).attr("time", `${time}`).css("height", `${scale}px`).get());
}

for (i = 0; i < 10; i++) {
	addTime(i);
}