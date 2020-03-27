
// simple test to check if running on a mobile or not.
export function isMobile() {
    return window.matchMedia("only screen and (max-width: 760px)").matches;
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

/**
 *
 * @param obj: obj of pvkey:val pairs
 * @param pv_fields: actor's list of pv fields in the correct order, found in sitedata.actors.[actorID].pv_fields
 * @returns Array of PVs for url inputing.
 */
export function pvObj2array(obj, pv_fields) {
    //this.state.pv_values is used in this method
    let fields = Object.keys(obj);
    return pv_fields.map((f_name) => {
        // Only give hidden value if the key is in pv_values.
        // Previously used || assignement, which caused FK filter values being sent as PVs
        let value;
        if (fields.includes(f_name + "Hidden")) value = obj[f_name + "Hidden"];
        else value = obj[f_name];

        if (value === undefined) value = null;
        return value
    })
}


export function find_cellIndex(target) {
    if (target.cellIndex !== undefined) return target.cellIndex;
    if (target.parentElement) return find_cellIndex(target.parentElement);
}


export function deepCompare() {
    var i, l, leftChain, rightChain;

    function compare2Objects(x, y) {
        var p;

        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
            return true;
        }

        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on the step where we compare prototypes
        if (x === y) {
            return true;
        }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        // At last checking prototypes as good as we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }

        if (x.constructor !== y.constructor) {
            return false;
        }

        if (x.prototype !== y.prototype) {
            return false;
        }

        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
            return false;
        }

        // Quick checking of one object being a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }

            switch (typeof (x[p])) {
                case 'object':
                case 'function':

                    leftChain.push(x);
                    rightChain.push(y);

                    if (!compare2Objects(x[p], y[p])) {
                        return false;
                    }

                    leftChain.pop();
                    rightChain.pop();
                    break;

                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    }

    if (arguments.length < 1) {
        return true; //Die silently? Don't know how to handle such case, please help...
        // throw "Need two or more arguments to compare";
    }

    for (i = 1, l = arguments.length; i < l; i++) {

        leftChain = []; //Todo: this can be cached
        rightChain = [];

        if (!compare2Objects(arguments[0], arguments[i])) {
            return false;
        }
    }

    return true;
}

export function mapReverse(array, fn) {
    return array.reduceRight(function (result, el) {
        result.push(fn(el));
        return result;
    }, []);
}
/**
 * Create a hash INT from a string
 */
export function hashCode(string) {
  let hash = 0, i, chr;
  if (string.length === 0) return hash;
  for (i = 0; i < string.length; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export function objectToFormData(obj, rootName, ignoreList) {
    var formData = new FormData();

    function appendFormData(data, root) {
        if (!ignore(root)) {
            root = root || '';
            if (data instanceof File) {
                formData.append(root, data);
            } else if (Array.isArray(data)) {
                for (var i = 0; i < data.length; i++) {
                    appendFormData(data[i], root + '[' + i + ']');
                }
            } else if (typeof data === 'object' && data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        if (root === '') {
                            appendFormData(data[key], key);
                        } else {
                            appendFormData(data[key], root + '.' + key);
                        }
                    }
                }
            } else {
                if (data !== null && typeof data !== 'undefined') {
                    formData.append(root, data);
                }
            }
        }
    }

    function ignore(root) {
        return Array.isArray(ignoreList)
            && ignoreList.some(function (x) {
                return x === root;
            });
    }

    appendFormData(obj, rootName);

    return formData;
}


function init_WindowStateManager(win) {
    //Private variables
    var _LOCALSTORAGE_KEY = 'WINDOW_VALIDATION';
    var RECHECK_WINDOW_DELAY_MS = 100;
    var _initialized = false;
    var _isMainWindow = false;
    var _unloaded = false;
    var _windowArray;
    var _windowId;
    var _isNewWindowPromotedToMain = false;
    var _isFocusedPromotedToMain= false;
    var _onWindowUpdated;


    function WindowStateManager(isNewWindowPromotedToMain, isFocusedPromotedToMain, onWindowUpdated) {
        //this.resetWindows();
        _onWindowUpdated = onWindowUpdated;
        _isNewWindowPromotedToMain = isNewWindowPromotedToMain;
        _isFocusedPromotedToMain = isFocusedPromotedToMain;
        _windowId = Date.now().toString();

        bindUnload();

        determineWindowState.call(this);

        _initialized = true;

        _onWindowUpdated.call(this, this);
    }

    //Determine the state of the window
    //If its a main or child window
    function determineWindowState() {
        var self = this;
        var _previousState = _isMainWindow;

        _windowArray = localStorage.getItem(_LOCALSTORAGE_KEY);

        if (_windowArray === null || _windowArray === "NaN") {
            _windowArray = [];
        }
        else {
            _windowArray = JSON.parse(_windowArray);
        }

        if (_isFocusedPromotedToMain && document.hasFocus() && _initialized) {
            _windowArray.splice(_windowArray.indexOf(_windowId), 1);
            _windowArray.push(_windowId);
            _isMainWindow = true;
            localStorage.setItem(_LOCALSTORAGE_KEY, JSON.stringify(_windowArray))
        }

        else if (_initialized) {
            //Determine if this window should be promoted
            if (_windowArray.length <= 1 ||
                (_isNewWindowPromotedToMain ? _windowArray[_windowArray.length - 1] : _windowArray[0]) === _windowId) {
                _isMainWindow = true;
            }
            else {
                _isMainWindow = false;
            }
        }
        else {
            if (_windowArray.length === 0) {
                _isMainWindow = true;
                _windowArray[0] = _windowId;
                localStorage.setItem(_LOCALSTORAGE_KEY, JSON.stringify(_windowArray));
            }
            else {
                _isMainWindow = false;
                _windowArray.push(_windowId);
                localStorage.setItem(_LOCALSTORAGE_KEY, JSON.stringify(_windowArray));
            }
        }

        //If the window state has been updated invoke callback
        if (_previousState !== _isMainWindow) {
            _onWindowUpdated.call(this, this);
        }

        //Perform a recheck of the window on a delay
        setTimeout(function () {
            determineWindowState.call(self);
        }, RECHECK_WINDOW_DELAY_MS);
    }

    //Remove the window from the global count
    function removeWindow() {
        var __windowArray = JSON.parse(localStorage.getItem(_LOCALSTORAGE_KEY));
        for (var i = 0, length = __windowArray.length; i < length; i++) {
            if (__windowArray[i] === _windowId) {
                __windowArray.splice(i, 1); // pop out the current window
                break;
            }
        }
        //Update the local storage with the new array
        localStorage.setItem(_LOCALSTORAGE_KEY, JSON.stringify(__windowArray));
    }

    //Bind unloading events
    function bindUnload() {
        win.addEventListener('beforeunload', function () {
            if (!_unloaded) {
                removeWindow();
            }
        });
        win.addEventListener('unload', function () {
            if (!_unloaded) {
                removeWindow();
            }
        });
    }

    WindowStateManager.prototype.isMainWindow = function () {
        return _isMainWindow;
    };

    WindowStateManager.prototype.resetWindows = function () {
        localStorage.removeItem(_LOCALSTORAGE_KEY);
    };

    WindowStateManager.prototype.makeMain = function () {
        var _windowArray = JSON.parse(localStorage.getItem(_LOCALSTORAGE_KEY));
        _windowArray.splice(_windowArray.indexOf(_windowId), 1);
        _windowArray.push(_windowId);
        localStorage.setItem(_LOCALSTORAGE_KEY, JSON.stringify(_windowArray));
        // determineWindowState();
    };


    win.WindowStateManager = WindowStateManager;
};

if (!window.WindowStateManager) init_WindowStateManager(window);

// var WindowStateManager = new WindowStateManager(false, windowUpdated);
//
// function windowUpdated()
// {
//     "this" is a reference to the WindowStateManager
// statusWindow.className = (this.isMainWindow() ? 'main' : 'child');
// }
//Resets the count in case something goes wrong in code
//WindowStateManager.resetWindows()