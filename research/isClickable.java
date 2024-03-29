https://stackoverflow.com/questions/446892/how-to-find-event-listeners-on-a-dom-node-in-javascript-or-in-debugging
i can just check the "onclick" property
--------
how does selenium detect if button is clickable?
-------
do i want useCapture?
https://www.w3schools.com/js/js_htmldom_eventlistener.asp
---------
function listAllEventListeners() {
  const allElements = Array.prototype.slice.call(document.querySelectorAll('*'));
  allElements.push(document);
  allElements.push(window);

  const types = [];

  for (let ev in window) {
    if (/^on/.test(ev)) types[types.length] = ev;
  }

  let elements = [];
  for (let i = 0; i < allElements.length; i++) {
    const currentElement = allElements[i];
    for (let j = 0; j < types.length; j++) {
      if (typeof currentElement[types[j]] === 'function') {
        elements.push({
          "node": currentElement,
          "type": types[j],
          "func": currentElement[types[j]].toString(),
        });
      }
    }
  }

  return elements.sort(function(a,b) {
    return a.type.localeCompare(b.type);
  });
}
console.log(listAllEventListeners());