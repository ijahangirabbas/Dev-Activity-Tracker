"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdleDetector = void 0;
class IdleDetector {
    timeoutMs;
    lastActivityTime;
    isIdleState;
    intervalId;
    onIdleStateChanged;
    constructor(timeoutSeconds, onIdleStateChanged) {
        this.timeoutMs = timeoutSeconds * 1000;
        this.lastActivityTime = Date.now();
        this.isIdleState = false;
        this.onIdleStateChanged = onIdleStateChanged;
    }
    start() {
        this.lastActivityTime = Date.now();
        this.isIdleState = false;
        // Check state every second
        this.intervalId = setInterval(() => {
            this.checkIdle();
        }, 1000);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
    updateTimeout(timeoutSeconds) {
        this.timeoutMs = timeoutSeconds * 1000;
    }
    recordActivity() {
        this.lastActivityTime = Date.now();
        if (this.isIdleState) {
            this.isIdleState = false;
            this.onIdleStateChanged(false);
        }
    }
    checkIdle() {
        if (this.isIdleState) {
            return;
        }
        const now = Date.now();
        if (now - this.lastActivityTime >= this.timeoutMs) {
            this.isIdleState = true;
            this.onIdleStateChanged(true);
        }
    }
    isIdle() {
        return this.isIdleState;
    }
    getLastActivityTime() {
        return this.lastActivityTime;
    }
}
exports.IdleDetector = IdleDetector;
