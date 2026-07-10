"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdleDetector = void 0;
var IdleDetector = /** @class */ (function () {
    function IdleDetector(timeoutSeconds, onIdleStateChanged) {
        this.timeoutMs = timeoutSeconds * 1000;
        this.lastActivityTime = Date.now();
        this.isIdleState = false;
        this.onIdleStateChanged = onIdleStateChanged;
    }
    IdleDetector.prototype.start = function () {
        var _this = this;
        this.lastActivityTime = Date.now();
        this.isIdleState = false;
        // Check state every second
        this.intervalId = setInterval(function () {
            _this.checkIdle();
        }, 1000);
    };
    IdleDetector.prototype.stop = function () {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    };
    IdleDetector.prototype.updateTimeout = function (timeoutSeconds) {
        this.timeoutMs = timeoutSeconds * 1000;
    };
    IdleDetector.prototype.recordActivity = function () {
        this.lastActivityTime = Date.now();
        if (this.isIdleState) {
            this.isIdleState = false;
            this.onIdleStateChanged(false);
        }
    };
    IdleDetector.prototype.checkIdle = function () {
        if (this.isIdleState) {
            return;
        }
        var now = Date.now();
        if (now - this.lastActivityTime >= this.timeoutMs) {
            this.isIdleState = true;
            this.onIdleStateChanged(true);
        }
    };
    IdleDetector.prototype.isIdle = function () {
        return this.isIdleState;
    };
    IdleDetector.prototype.getLastActivityTime = function () {
        return this.lastActivityTime;
    };
    return IdleDetector;
}());
exports.IdleDetector = IdleDetector;
