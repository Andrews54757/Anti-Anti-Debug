var sc = document.createElement('script');
sc.src = chrome.runtime.getURL("anti-anti-debug.js");
var it = document.head || document.documentElement;

it.appendChild(sc)
sc.remove();