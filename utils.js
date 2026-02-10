
const DB_KEY = 'vibe_game_sqlite_db';
const CURRENT_USER_KEY = 'vibe_game_current_user';

const Utils = {
    db: null,
    isInitialized: false,

    // Initialize Database
    init: async () => {
        if (Utils.isInitialized) return;

        try {
            const SQL = await initSqlJs({
                locateFile: file => `vendor/${file}`
            });

            const savedDb = localStorage.getItem(DB_KEY);
            if (savedDb) {
                const u8 = new Uint8Array(JSON.parse(savedDb));
                Utils.db = new SQL.Database(u8);
            } else {
                Utils.db = new SQL.Database();
                Utils.createTables();
            }
            Utils.isInitialized = true;
            console.log("SQLite Database Initialized");
        } catch (err) {
            console.error("Failed to initialize SQLite:", err);
            alert("数据库加载失败，请刷新页面重试");
        }
    },

    createTables: () => {
        Utils.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                uuid TEXT PRIMARY KEY,
                nickname TEXT UNIQUE,
                password TEXT,
                created_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_uuid TEXT,
                game TEXT,
                score INTEGER,
                date INTEGER,
                FOREIGN KEY(user_uuid) REFERENCES users(uuid)
            );
        `);
        Utils.saveDB();
    },

    saveDB: () => {
        try {
            const data = Utils.db.export();
            const arr = Array.from(data);
            localStorage.setItem(DB_KEY, JSON.stringify(arr));
        } catch (e) {
            console.error("Save DB failed (Quota exceeded?)", e);
            alert("存储空间不足，无法保存数据！");
        }
    },

    // Generate UUID
    generateUUID: () => {
        if (crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // User Management
    getCurrentUser: () => JSON.parse(localStorage.getItem(CURRENT_USER_KEY)),
    setCurrentUser: (user) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)),
    logout: () => localStorage.removeItem(CURRENT_USER_KEY),

    register: async (nickname, password) => {
        if (!Utils.db) await Utils.init();
        
        try {
            const uuid = Utils.generateUUID();
            const last4 = uuid.slice(-4);
            const fullNickname = `${nickname}#${last4}`;
            const now = Date.now();

            // Check if this full nickname somehow already exists (extremely unlikely but possible)
            const stmt = Utils.db.prepare("SELECT * FROM users WHERE nickname = :nickname");
            stmt.bind({ ':nickname': fullNickname });
            if (stmt.step()) {
                stmt.free();
                // If it exists, we could try again with a new UUID, but for simplicity:
                return { success: false, message: '系统繁忙，请重试（昵称冲突）' };
            }
            stmt.free();
            
            Utils.db.run("INSERT INTO users VALUES (?, ?, ?, ?)", [uuid, fullNickname, password, now]);
            Utils.saveDB();

            const newUser = { uuid, nickname: fullNickname, password, createdAt: now };
            Utils.setCurrentUser(newUser);
            return { success: true, user: newUser };
        } catch (e) {
            console.error(e);
            return { success: false, message: '注册失败: ' + e.message };
        }
    },

    login: async (nicknameWithSuffix, password) => {
        if (!Utils.db) await Utils.init();

        try {
            const stmt = Utils.db.prepare("SELECT * FROM users WHERE nickname = :nickname AND password = :password");
            stmt.bind({ ':nickname': nicknameWithSuffix, ':password': password });
            
            if (stmt.step()) {
                const user = stmt.getAsObject();
                stmt.free();

                // Double check: verify last 4 of UUID matches suffix in nickname
                const parts = user.nickname.split('#');
                const suffix = parts[parts.length - 1];
                if (user.uuid.slice(-4) !== suffix) {
                    return { success: false, message: '账号数据异常' };
                }

                Utils.setCurrentUser(user);
                return { success: true, user };
            }
            stmt.free();
            return { success: false, message: '用户名或密码错误' };
        } catch (e) {
            console.error(e);
            return { success: false, message: '登录失败' };
        }
    },

    // Score Management
    saveScore: async (game, score) => {
        if (!Utils.db) await Utils.init();
        const user = Utils.getCurrentUser();
        if (!user) return;

        try {
            Utils.db.run("INSERT INTO scores (user_uuid, game, score, date) VALUES (?, ?, ?, ?)", 
                [user.uuid, game, score, Date.now()]);
            Utils.saveDB();
        } catch (e) {
            console.error("Save score failed", e);
        }
    },

    getLeaderboard: async (game) => {
        if (!Utils.db) await Utils.init();
        
        try {
            // Join users to get nicknames
            const stmt = Utils.db.prepare(`
                SELECT s.score, s.date, u.nickname, u.uuid 
                FROM scores s 
                JOIN users u ON s.user_uuid = u.uuid 
                WHERE s.game = :game 
                ORDER BY s.score DESC 
                LIMIT 10
            `);
            stmt.bind({ ':game': game });
            
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
        } catch (e) {
            console.error("Get leaderboard failed", e);
            return [];
        }
    },

    getUserDisplay: (user) => {
        if (!user) return '';
        // If the nickname already has the #XXXX suffix, don't add it again
        if (user.nickname.includes('#')) {
            return user.nickname;
        }
        const last4 = user.uuid.slice(-4);
        return `${user.nickname} #${last4}`;
    },

    // Export/Import
    exportLeaderboard: async (game) => {
        if (!Utils.db) await Utils.init();
        try {
            const stmt = Utils.db.prepare(`
                SELECT s.score, s.date, s.game, u.nickname, u.uuid
                FROM scores s
                JOIN users u ON s.user_uuid = u.uuid
                WHERE s.game = :game
            `);
            stmt.bind({ ':game': game });
            const data = [];
            while(stmt.step()) {
                data.push(stmt.getAsObject());
            }
            stmt.free();
            return { success: true, data };
        } catch (e) {
            console.error("Export failed:", e);
            return { success: false, message: e.message };
        }
    },

    importLeaderboard: async (jsonContent) => {
        if (!Utils.db) await Utils.init();
        try {
            const data = JSON.parse(jsonContent);
            if (!Array.isArray(data)) throw new Error("无效的数据格式：必须是数组");
            
            console.log("Starting import of", data.length, "items");
            let count = 0;
            Utils.db.exec("BEGIN TRANSACTION");
            
            try {
                for (const item of data) {
                    if (!item.uuid || item.score === undefined || !item.nickname) {
                        console.warn("Skipping invalid item:", item);
                        continue;
                    }
                    
                    // 1. Ensure nickname format is consistent (Nickname#Last4)
                    let finalNickname = item.nickname;
                    if (!finalNickname.includes('#')) {
                        finalNickname = `${finalNickname}#${item.uuid.slice(-4)}`;
                    }
                    
                    // 2. Ensure user exists. 
                    Utils.db.run(`
                        INSERT OR IGNORE INTO users (uuid, nickname, password, created_at)
                        VALUES (?, ?, ?, ?)
                    `, [item.uuid, finalNickname, '', item.date || Date.now()]);
                    
                    // 3. Insert score if not exists
                    const check = Utils.db.prepare(`
                        SELECT id FROM scores 
                        WHERE user_uuid = ? AND game = ? AND score = ? AND date = ?
                    `);
                    check.bind([item.uuid, item.game || 'snake', item.score, item.date]);
                    const exists = check.step();
                    check.free();

                    if (!exists) {
                        Utils.db.run(`
                            INSERT INTO scores (user_uuid, game, score, date)
                            VALUES (?, ?, ?, ?)
                        `, [item.uuid, item.game || 'snake', item.score, item.date]);
                        count++;
                    }
                }
                Utils.db.exec("COMMIT");
                Utils.saveDB();
                console.log("Import finished. Added", count, "scores.");
                return { success: true, count };
            } catch (innerErr) {
                Utils.db.exec("ROLLBACK");
                console.error("Import transaction failed:", innerErr);
                throw innerErr;
            }
        } catch (e) {
            console.error("Import failed:", e);
            return { success: false, message: e.message };
        }
    }
};
