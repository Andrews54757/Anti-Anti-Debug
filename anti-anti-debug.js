!(() => {
    console.log("Anti-anti-debug loaded! Happy debugging!")

    /**
     * Save original methods before we override them
     */
    const originals = {
        createElement: document.createElement,
        log: console.log,
        table: console.table,
        clear: console.clear,
        functionConstructor: window.Function.prototype.constructor,
        setInterval: window.setInterval,
        createElement: document.createElement,
        toString: Function.prototype.toString,
        addEventListener: window.addEventListener
    }

    /**
     * Cutoffs for logging. After cutoff is reached, will no longer log anti debug warnings.
     */
    const cutoffs = {
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
        }
    }

    /**
     * Decides if anti debug warnings should be logged
     */
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
            originals.log("Limit reached! Will now ignore " + type)
            cutoff.tripped = true;
            return false;
        }

        return true;
    }

    window.console.log = function (...args) {
        // Keep track of redacted arguments
        let redactedCount = 0;

        // Filter arguments for detectors
        const newArgs = args.map((a) => {

            // Don't print functions.
            if (typeof a === 'function') {
                redactedCount++;
                return "Redacted Function";
            }

            // Passthrough if primitive
            if (typeof a !== 'object' || a === null) return a;

            // For objects, scan properties
            var props = Object.getOwnPropertyDescriptors(a)
            for (var name in props) {
                
                // Redact custom getters
                if (props[name].get !== undefined) {
                    redactedCount++;
                    return "Redacted Getter";
                }

                // Also block toString overrides
                if (name === 'toString') {
                    redactedCount++;
                    return "Redacted Str";
                }
            }

            // Defeat Performance Detector
            // https://github.com/theajack/disable-devtool/blob/master/src/detector/sub-detector/performance.ts
            if (Array.isArray(a) && a.length === 50 && typeof a[0] === "object") {
                redactedCount++;
                return "Redacted LargeObjArray";
            }

            return a;
        });

        // If most arguments are redacted, its probably spam
        if (redactedCount >= Math.max(args.length - 1, 1)) {
            if (!shouldLog("redactedLog")) {
                return;
            }
        }

        originals.log.apply(console, newArgs)
    }
   
    window.console.table = function (obj) {
        if (shouldLog("table")) {
            originals.log("Redacted table");
        }
    }

    window.console.clear = function () {
        if (shouldLog("table")) {
            originals.log("Prevented clear");
        }
    }

    window.Function.prototype.constructor = function (...args) {
        var fnContent = args[0];
        if (fnContent) {
            if (fnContent.includes('debugger')) { // An anti-debugger is attempting to stop debugging
                if (shouldLog("debugger")) {
                    originals.log("Prevented debugger");
                }
                args[0] = args[0].replaceAll("debugger",""); // remove debugger statements
            }
        }
        return originals.functionConstructor.apply(this, args);
    }

    window.Function.prototype.constructor.prototype = originals.constructor.prototype;

    window.setInterval = function (...args) {
        const string = originals.toString.apply(args[0]);
        // Regexp tests for https://github.com/theajack/disable-devtool
        if (/if.*;try.*=.*catch.*\(.*\).*finally.*==.*typeof/.test(string)) {
               originals.log("Prevented anti-debug interval (matched regexp)", {
                    fnString: string
               });
            return;
        }
        return originals.setInterval.apply(window, args);
    }
    
    document.createElement = function (el, o) {
        var string = el.toString();
        var element = originals.createElement.apply(document, [string, o]);
        if (string.toLowerCase() === "iframe") {
            element.addEventListener("load", () => {
                try {
                    element.contentWindow.window.console = window.console;
                } catch (e) {

                }
            });
        }
        return element;
    }
})()

