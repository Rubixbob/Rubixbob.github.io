document.body.setAttribute("data-theme", (!localStorage["theme"] || localStorage["theme"] === "dark") ? "dark" : "");
console.log(document.body.getAttribute("data-theme"));