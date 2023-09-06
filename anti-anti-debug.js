!(() => {
    console.log("Anti-anti-debug loaded! Happy debugging!")
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

    let cutoffs = {
        table: {
            amount: 5,
            within: 5000
        },
        clear: {
            amount: 5,
            within: 5000
        },
        redactedLog: {
            amount: 5,
            within: 5000
        },
        debugger: {
            amount: 10,
            within: 10000
        },
        interval: {
            amount: 10,
            within: 10000
        }
    }

    var _log = window.console.log;
 
    function shouldLog(type) {
        const cutoff = cutoffs[type];
        if (cutoff.tripped) return false;
        cutoff.current = cutoff.current || 0;
        const now = Date.now();
        cutoff.last = cutoff.last || now;

        if (now - cutoff.last > cutoff.within) {
            cutoff.current = 0;
        }

        cutoff.last = now;
        cutoff.current++;

        if (cutoff.current > cutoff.amount) {
            _log("Limit reached! Will now ignore " + type)
            cutoff.tripped = true;
            return false;
        }

        return true;
    }

    window.console.log = function () {
        var args = Array.from(arguments);

        let redactedCount = 0;
        const newArgs = args.map((a) => {

            if (typeof a === 'function') {
                redactedCount++;
                return "Redacted Function";
            }
            if (typeof a !== 'object' || a === null) return a;
            var props = Object.getOwnPropertyDescriptors(a)
            for (var name in props) {
                if (props[name].get !== undefined) {
                    redactedCount++;
                    return "Redacted";
                }
                if (name === 'toString') {
                    redactedCount++;
                    return "Redacted Str";
                }
            }

            // Defeat Performance Detector
            // https://github.com/theajack/disable-devtool/blob/master/src/detector/sub-detector/performance.ts
            if (Array.isArray(a) && a.length === 50 && typeof a[0] === "object") {
                redactedCount++;
                return "Redacted ObjArray";
            }

            return a;
        });

        if (redactedCount >= Math.max(args.length - 1, 1)) {
            if (!shouldLog("redactedLog")) {
                return;
            }
        }

        _log.apply(console, newArgs)
    }
   
    window.console.table = function (obj) {
        if (shouldLog("table")) {
            _log("Redacted table");
        }
    }

    window.console.clear = function () {
        if (shouldLog("table")) {
            _log("Prevented clear");
        }
    }

    var _constructor = window.Function.prototype.constructor;
    // Hook Function.prototype.constructor
    window.Function.prototype.constructor = function () {
        var fnContent = arguments[0];
        if (fnContent) {
            if (fnContent.includes('debugger')) { // An anti-debugger is attempting to stop debugging
                if (shouldLog("debugger")) {
                    _log("Prevented debugger");
                }
                return (function () { });
            }
        }
        // Execute the normal function constructor if nothing unusual is going on
        return _constructor.apply(this, arguments);
    };
    window.Function.prototype.constructor.prototype = _constructor.prototype;

    const oldSetInterval = window.setInterval;
    const nativeToString = Function.prototype.toString;
    window.setInterval = function (fn, ...args) {
        const string = nativeToString.apply(fn);

        // Regexp tests for https://github.com/theajack/disable-devtool
        if (/if.*;try.*=.*catch.*\(.*\).*finally.*==.*typeof/.test(string)) {
            if (shouldLog("interval")) {
                _log("Prevented anti-debug interval (matched regexp)");
            }
            return;
        } else
        if (string.includes('debugger')) {
            if (shouldLog("debugger")) {
                _log("Prevented debugger");
            }
            return;
        }
        return oldSetInterval(fn, ...args);
    }
})()

