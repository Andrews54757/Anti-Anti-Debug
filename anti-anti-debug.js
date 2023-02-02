!(() => {
    console.log("Anti-anti-debug loaded! Happy debugging!")
    var _open = (a, b, c) => {
        console.log("tried open", a, b, c);
    };
    var _createElement = document.createElement;
    document.createElement = function (el, o) {
        var string = el.toString();
        var element = _createElement.apply(document, [string, o]);
        if (string.toLowerCase() == "iframe") {
            element.addEventListener("load", () => {
                try {
                    element.contentWindow.window.console = window.console;
                } catch (e) {

                }
            });
        }
        return element;
    }

    var _clear = window.console.clear;

    window.console.clear = function () {

    }

    var _log = window.console.log;

    window.console.log = function () {
        var args = Array.from(arguments);
        _log.apply(console, args.map((a) => {

            if (typeof a === 'function') return "Redacted Function";
            if (typeof a !== 'object' || a === null) return a;
            var props = Object.getOwnPropertyDescriptors(a)
            for (var name in props) {
                if (props[name].get !== undefined) return "Redacted";
                if (name === 'toString') {
                    return "Redacted Str";
                }
            }
            return a;
        }))
    }
    window.console.table = function (obj) {
        console.log("Redacted table")
    }
    window.console.clear = function () {
        console.log("Prevented clear")
    }

})();

(() => {
    var _constructor = window.Function.prototype.constructor;
    // Hook Function.prototype.constructor
    window.Function.prototype.constructor = function () {
        var fnContent = arguments[0];
        if (fnContent) {
            if (fnContent.includes('debugger')) { // An anti-debugger is attempting to stop debugging
                return (function () { });
            }
        }
        // Execute the normal function constructor if nothing unusual is going on
        return _constructor.apply(this, arguments);
    };
    window.Function.prototype.constructor.prototype = _constructor.prototype;
})()

