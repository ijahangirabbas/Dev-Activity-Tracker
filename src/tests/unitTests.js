"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var idleDetector_1 = require("../tracking/idleDetector");
var sessionManager_1 = require("../sessions/sessionManager");
var database_1 = require("../storage/database");
function assert(condition, message) {
    if (!condition) {
        throw new Error("Assertion Failed: ".concat(message));
    }
    console.log("[PASS] ".concat(message));
}
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
}
// 1. Test Idle Detector
function testIdleDetector() {
    return __awaiter(this, void 0, void 0, function () {
        var idleStates, detector;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n--- Testing Idle Detector ---');
                    idleStates = [];
                    detector = new idleDetector_1.IdleDetector(2, function (isIdle) {
                        idleStates.push(isIdle);
                    });
                    detector.start();
                    assert(!detector.isIdle(), 'Should start in active state');
                    // Record activity to refresh
                    detector.recordActivity();
                    return [4 /*yield*/, sleep(1000)];
                case 1:
                    _a.sent();
                    assert(!detector.isIdle(), 'Should remain active within timeout');
                    // Wait for idle transition
                    return [4 /*yield*/, sleep(1500)];
                case 2:
                    // Wait for idle transition
                    _a.sent();
                    assert(detector.isIdle(), 'Should become idle after timeout');
                    assert(idleStates.length === 1 && idleStates[0] === true, 'Idle callback should be triggered with true');
                    // Resume activity
                    detector.recordActivity();
                    assert(!detector.isIdle(), 'Should transition back to active on activity');
                    assert(idleStates.length === 2 && idleStates[1] === false, 'Idle callback should be triggered with false');
                    detector.stop();
                    console.log('Idle Detector tests completed.');
                    return [2 /*return*/];
            }
        });
    });
}
// 2. Test Session Manager
function testSessionManager() {
    console.log('\n--- Testing Session Manager ---');
    var sm = new sessionManager_1.SessionManager();
    var session = sm.startSession('Test Project', 'C:\\Test', 'test-repo', 'main');
    assert(session !== null, 'Session should be created');
    assert(session.workspaceName === 'Test Project', 'Workspace name should match');
    assert(session.branch === 'main', 'Branch should match');
    // Accumulate times
    sm.updateSessionTimes('coding', 10);
    sm.updateSessionTimes('reading', 20);
    sm.updateSessionTimes('debugging', 5);
    var current = sm.getCurrentSession();
    assert(current !== null, 'Current session should not be null');
    assert(current.codingTime === 10, 'Coding time should accumulate');
    assert(current.readingTime === 20, 'Reading time should accumulate');
    assert(current.debuggingTime === 5, 'Debugging time should accumulate');
    // Record file activity
    sm.recordFileActivity('src/main.ts', 'main.ts', 'TypeScript', true, 15);
    sm.recordFileActivity('src/main.ts', 'main.ts', 'TypeScript', false, 5);
    var fileStats = current.files['src/main.ts'];
    assert(fileStats !== undefined, 'File stats should exist for src/main.ts');
    assert(fileStats.editsCount === 1, 'Edits count should be 1');
    assert(fileStats.readsCount === 1, 'Reads count should be 1');
    assert(fileStats.timeSpent === 20, 'File time spent should be 20 seconds');
    assert(current.languages['TypeScript'] === 20, 'Language TypeScript time should be 20');
    // End session
    var ended = sm.endSession();
    assert(ended !== null, 'Ended session should be returned');
    assert(sm.getCurrentSession() === null, 'Current session should be cleared after end');
    console.log('Session Manager tests completed.');
}
// 3. Test Database Service
function testDatabaseService() {
    console.log('\n--- Testing Database Service ---');
    var tempDir = path.join(__dirname, 'temp_db_test');
    // Clean up if exists
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    var db = new database_1.DatabaseService(tempDir);
    var schema = db.getDatabase();
    assert(schema.version === 1, 'Database version should be 1');
    assert(Object.keys(schema.projects).length === 0, 'Should start with empty projects list');
    // Create a mock session
    var mockSession = {
        id: 'test_session_123',
        startTime: Date.now() - 3600 * 1000, // 1 hour ago
        endTime: Date.now(),
        duration: 3600,
        workspaceName: 'Acme UI',
        workspacePath: 'C:\\Acme',
        repository: 'acme-repo',
        branch: 'feat-1',
        codingTime: 2000,
        readingTime: 1000,
        debuggingTime: 600,
        terminalTime: 0,
        gitTime: 0,
        testingTime: 0,
        aiTime: 0,
        editsCount: 15,
        readsCount: 20,
        files: {},
        languages: { 'TypeScript': 3000 },
        terminalCommands: [],
        terminalSessionsCount: 1,
        gitCommitsCount: 2,
        debugSessionsCount: 1,
        testRunsSuccess: 0,
        testRunsFailed: 0,
        timeline: []
    };
    // Add session
    db.addSession(mockSession, 14400);
    // Validate aggregates
    var updatedSchema = db.getDatabase();
    assert(updatedSchema.sessions.length === 1, 'Sessions list should contain 1 session');
    assert(updatedSchema.projects['Acme UI'] !== undefined, 'Project Acme UI should be created');
    var proj = updatedSchema.projects['Acme UI'];
    assert(proj.totalTime === 3600, 'Project total time should be 3600');
    assert(proj.commitsCount === 2, 'Project commits count should match session commits');
    assert(proj.languages['TypeScript'] === 3000, 'Project language time should aggregate');
    var todayStr = new Date().toISOString().slice(0, 10);
    var daily = updatedSchema.dailyProgress[todayStr];
    assert(daily !== undefined, 'Daily progress for today should exist');
    assert(daily.developmentTime === 3600, 'Daily development time should match session duration');
    assert(daily.codingTime === 2000, 'Daily coding time should match session codingTime');
    // Test Backup
    var backupPath = db.backup();
    assert(fs.existsSync(backupPath), 'Backup file should be created');
    // Test Restore
    db.getDatabase().sessions = [];
    db.save();
    assert(db.getDatabase().sessions.length === 0, 'Database sessions should be cleared for restore test');
    db.restore(backupPath);
    assert(db.getDatabase().sessions.length === 1, 'Sessions should be restored from backup');
    assert(db.getDatabase().sessions[0].id === 'test_session_123', 'Restored session ID should match');
    // Clean up
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    console.log('Database Service tests completed.');
}
// 4. Test Multi-Window Active Session Merge Coordination
function testMultiProcessMerge() {
    console.log('\n--- Testing Multi-Window Active Session Merge ---');
    var tempDir = path.join(__dirname, 'temp_db_merge_test');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    var db = new database_1.DatabaseService(tempDir);
    var mockSessionA = {
        id: 'active_session_A',
        startTime: Date.now() - 600 * 1000,
        endTime: Date.now(),
        duration: 600,
        workspaceName: 'Project Alpha',
        workspacePath: 'C:\\Alpha',
        repository: 'alpha-repo',
        branch: 'main',
        codingTime: 400,
        readingTime: 200,
        debuggingTime: 0,
        terminalTime: 0,
        gitTime: 0,
        testingTime: 0,
        aiTime: 0,
        editsCount: 10,
        readsCount: 5,
        files: {},
        languages: { 'TypeScript': 600 },
        terminalCommands: [],
        terminalSessionsCount: 0,
        gitCommitsCount: 0,
        debugSessionsCount: 0,
        testRunsSuccess: 0,
        testRunsFailed: 0,
        timeline: []
    };
    var mockSessionB = {
        id: 'active_session_B',
        startTime: Date.now() - 300 * 1000,
        endTime: Date.now(),
        duration: 300,
        workspaceName: 'Project Beta',
        workspacePath: 'C:\\Beta',
        repository: 'beta-repo',
        branch: 'main',
        codingTime: 100,
        readingTime: 200,
        debuggingTime: 0,
        terminalTime: 0,
        gitTime: 0,
        testingTime: 0,
        aiTime: 0,
        editsCount: 2,
        readsCount: 8,
        files: {},
        languages: { 'Python': 300 },
        terminalCommands: [],
        terminalSessionsCount: 0,
        gitCommitsCount: 0,
        debugSessionsCount: 0,
        testRunsSuccess: 0,
        testRunsFailed: 0,
        timeline: []
    };
    // Write active sessions representing concurrent windows
    db.writeActiveSession('win_A', mockSessionA);
    db.writeActiveSession('win_B', mockSessionB);
    // Verify that active sessions exist and count matches
    var activeList = db.getActiveSessions();
    assert(activeList.length === 2, 'Should retrieve two active sessions');
    assert(activeList.some(function (s) { return s.id === 'active_session_A'; }), 'Should retrieve active session A');
    assert(activeList.some(function (s) { return s.id === 'active_session_B'; }), 'Should retrieve active session B');
    // Verify merge calculations in database representation
    var merged = db.getMergedLiveDatabase(activeList, 14400);
    assert(merged.sessions.some(function (s) { return s.id === 'active_session_A'; }), 'Merged database should contain active session A');
    assert(merged.sessions.some(function (s) { return s.id === 'active_session_B'; }), 'Merged database should contain active session B');
    assert(merged.projects['Project Alpha'] !== undefined, 'Project Alpha stats should be aggregated');
    assert(merged.projects['Project Beta'] !== undefined, 'Project Beta stats should be aggregated');
    // Clean up sessions
    db.deleteActiveSession('win_A');
    db.deleteActiveSession('win_B');
    assert(db.getActiveSessions().length === 0, 'Active sessions list should be empty after delete');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    console.log('Multi-Window Active Session Merge tests completed.');
}
function runAll() {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, testIdleDetector()];
                case 1:
                    _a.sent();
                    testSessionManager();
                    testDatabaseService();
                    testMultiProcessMerge();
                    console.log('\n==================================');
                    console.log('ALL UNIT TESTS COMPLETED SUCCESSFULLY!');
                    console.log('==================================');
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    console.error('\n!!! TEST FAILURE !!!');
                    console.error(e_1);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
runAll();
