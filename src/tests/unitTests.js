"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const idleDetector_1 = require("../tracking/idleDetector");
const sessionManager_1 = require("../sessions/sessionManager");
const database_1 = require("../storage/database");
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
    console.log(`[PASS] ${message}`);
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// 1. Test Idle Detector
async function testIdleDetector() {
    console.log('\n--- Testing Idle Detector ---');
    let idleStates = [];
    const detector = new idleDetector_1.IdleDetector(2, (isIdle) => {
        idleStates.push(isIdle);
    });
    detector.start();
    assert(!detector.isIdle(), 'Should start in active state');
    // Record activity to refresh
    detector.recordActivity();
    await sleep(1000);
    assert(!detector.isIdle(), 'Should remain active within timeout');
    // Wait for idle transition
    await sleep(1500);
    assert(detector.isIdle(), 'Should become idle after timeout');
    assert(idleStates.length === 1 && idleStates[0] === true, 'Idle callback should be triggered with true');
    // Resume activity
    detector.recordActivity();
    assert(!detector.isIdle(), 'Should transition back to active on activity');
    assert(idleStates.length === 2 && idleStates[1] === false, 'Idle callback should be triggered with false');
    detector.stop();
    console.log('Idle Detector tests completed.');
}
// 2. Test Session Manager
function testSessionManager() {
    console.log('\n--- Testing Session Manager ---');
    const sm = new sessionManager_1.SessionManager();
    const session = sm.startSession('Test Project', 'C:\\Test', 'test-repo', 'main');
    assert(session !== null, 'Session should be created');
    assert(session.workspaceName === 'Test Project', 'Workspace name should match');
    assert(session.branch === 'main', 'Branch should match');
    // Accumulate times
    sm.updateSessionTimes('coding', 10);
    sm.updateSessionTimes('reading', 20);
    sm.updateSessionTimes('debugging', 5);
    const current = sm.getCurrentSession();
    assert(current !== null, 'Current session should not be null');
    assert(current.codingTime === 10, 'Coding time should accumulate');
    assert(current.readingTime === 20, 'Reading time should accumulate');
    assert(current.debuggingTime === 5, 'Debugging time should accumulate');
    // Record file activity
    sm.recordFileActivity('src/main.ts', 'main.ts', 'TypeScript', true, 15);
    sm.recordFileActivity('src/main.ts', 'main.ts', 'TypeScript', false, 5);
    const fileStats = current.files['src/main.ts'];
    assert(fileStats !== undefined, 'File stats should exist for src/main.ts');
    assert(fileStats.editsCount === 1, 'Edits count should be 1');
    assert(fileStats.readsCount === 1, 'Reads count should be 1');
    assert(fileStats.timeSpent === 20, 'File time spent should be 20 seconds');
    assert(current.languages['TypeScript'] === 20, 'Language TypeScript time should be 20');
    // End session
    const ended = sm.endSession();
    assert(ended !== null, 'Ended session should be returned');
    assert(sm.getCurrentSession() === null, 'Current session should be cleared after end');
    console.log('Session Manager tests completed.');
}
// 3. Test Database Service
function testDatabaseService() {
    console.log('\n--- Testing Database Service ---');
    const tempDir = path.join(__dirname, 'temp_db_test');
    // Clean up if exists
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    const db = new database_1.DatabaseService(tempDir);
    const schema = db.getDatabase();
    assert(schema.version === 1, 'Database version should be 1');
    assert(Object.keys(schema.projects).length === 0, 'Should start with empty projects list');
    // Create a mock session
    const mockSession = {
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
    const updatedSchema = db.getDatabase();
    assert(updatedSchema.sessions.length === 1, 'Sessions list should contain 1 session');
    assert(updatedSchema.projects['Acme UI'] !== undefined, 'Project Acme UI should be created');
    const proj = updatedSchema.projects['Acme UI'];
    assert(proj.totalTime === 3600, 'Project total time should be 3600');
    assert(proj.commitsCount === 2, 'Project commits count should match session commits');
    assert(proj.languages['TypeScript'] === 3000, 'Project language time should aggregate');
    const todayStr = new Date().toISOString().slice(0, 10);
    const daily = updatedSchema.dailyProgress[todayStr];
    assert(daily !== undefined, 'Daily progress for today should exist');
    assert(daily.developmentTime === 3600, 'Daily development time should match session duration');
    assert(daily.codingTime === 2000, 'Daily coding time should match session codingTime');
    // Test Backup
    const backupPath = db.backup();
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
async function runAll() {
    try {
        await testIdleDetector();
        testSessionManager();
        testDatabaseService();
        console.log('\n==================================');
        console.log('ALL UNIT TESTS COMPLETED SUCCESSFULLY!');
        console.log('==================================');
    }
    catch (e) {
        console.error('\n!!! TEST FAILURE !!!');
        console.error(e);
        process.exit(1);
    }
}
runAll();
