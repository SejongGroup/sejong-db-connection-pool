const mysql = require("mysql");
const oracledb = require("oracledb");
const { Pool } = require("pg");
const { str2int } = require("../utils/string");
const { waitForDB } = require("../utils/timeout");

function DBConnectionPool(config, autoRepair = false) {
    this.config = config;

    /** mysql, oracle, postgresql */
    this.mysql = new Map();
    this.oracle = new Map();
    this.postgres = new Map();

    /** pools */
    this.pools = new Map();
    this.autoRepair = {
        use: autoRepair,
        count: 0,
    };
}

DBConnectionPool.prototype.reset = async function () {
    for await (const iterator of this.pools) {
        let pool = iterator[1];
        if (typeof pool != "undefined" && typeof pool.end == "function") {
            await pool.end();
        }

        if (typeof pool != "undefined" && typeof pool.close == "function") {
            await pool.close();
        }
    }

    this.mysql.clear();
    this.oracle.clear();
    this.postgres.clear();

    this.pools.clear();
};

DBConnectionPool.prototype.init = async function () {
    await this.reset();
    let data = this.config.get();

    await Promise.all(
        Object.entries(data).map(async ([key, val]) => {
            if (key.match("mysql")) {
                this.mysqlConnection(key, val);
            } else if (key.match("oracle")) {
                await this.oracleConnection(key, val);
            } else if (key.match("postgres")) {
                await this.postgresConnection(key, val);
            }
        })
    );
};

DBConnectionPool.prototype.deleteConnection = async function (pool, key) {
    if (typeof pool != "undefined" && typeof pool.end == "function") {
        await pool.end();
    }

    if (typeof pool != "undefined" && typeof pool.close == "function") {
        await pool.close();
    }

    this.pools.delete(key);
    this.autoRepair.count = this.autoRepair.count + 1;
    await waitForDB(1000);
};

DBConnectionPool.prototype.mysqlConnection = async function (key, value) {
    value = str2int(value);
    let pool = mysql.createPool(value);
    let self = this;
    this.pools.set(key, pool);

    this.mysql.set(key, (callback) => {
        pool.getConnection(async (err, conn) => {
            if (err) {
                if (self.autoRepair.use == true && self.autoRepair.count < 5) {
                    this.mysql.delete(key);
                    await this.deleteConnection(pool, key);
                    await this.mysqlConnection(key, value);
                    return self.getMySQL(key)(callback);
                }

                return callback(err);
            }

            self.autoRepair.count = 0;
            callback(null, conn);
            return conn.release();
        });
    });
};

DBConnectionPool.prototype.oracleConnection = async function (key, value) {
    return new Promise((resolve) => {
        value = str2int(value);
        let self = this;

        oracledb.createPool(value, (err, pool) => {
            this.pools.set(key, pool);

            /** 함수 호출 */
            this.oracle.set(key, async (callback) => {
                if (err) {
                    if (self.autoRepair.use == true && self.autoRepair.count < 5) {
                        this.oracle.delete(key);
                        await this.deleteConnection(pool, key);
                        await this.oracleConnection(key, value);
                        return self.getOracle(key)(callback);
                    }
                    return callback(err);
                }

                self.autoRepair.count = 0;
                pool.getConnection((err2, conn) => {
                    if (err2) {
                        conn.release();
                        return callback(err);
                    }

                    callback(null, conn);
                    return conn.release();
                });
            });

            resolve();
        });
    });
};

DBConnectionPool.prototype.postgresConnection = async function (key, value) {
    value = str2int(value);
    let pool = new Pool(value);
    let self = this;
    this.pools.set(key, pool);

    this.postgres.set(key, (callback) => {
        pool.connect(async (err, client, release) => {
            if (err) {
                if (self.autoRepair.use == true && self.autoRepair.count < 5) {
                    this.postgres.delete(key);
                    await this.deleteConnection(pool, key);
                    await this.postgresConnection(key, value);
                    return self.getPostgres(key)(callback);
                }

                return callback(err);
            }

            self.autoRepair.count = 0;
            callback(null, client);
            return release();
        });
    });
};

DBConnectionPool.prototype.getMySQL = function (key) {
    if (this.mysql.has(key)) {
        return this.mysql.get(key);
    } else {
        return null;
    }
};

DBConnectionPool.prototype.getOracle = function (key) {
    if (this.oracle.has(key)) {
        return this.oracle.get(key);
    } else {
        return null;
    }
};

DBConnectionPool.prototype.getPostgres = function (key) {
    if (this.postgres.has(key)) {
        return this.postgres.get(key);
    } else {
        return null;
    }
};

DBConnectionPool.prototype.getMySQLIdx = function (idx) {
    let mysqlIter = this.mysql.entries();
    for (let i = 0; i < idx - 1; i++) {
        mysqlIter.next();
    }

    let key = mysqlIter.next().value[0];

    if (typeof key != "undefined") {
        return this.getMySQL(key);
    } else {
        return null;
    }
};

DBConnectionPool.prototype.getOracleIdx = function (idx) {
    let oracleIter = this.oracle.entries();
    for (let i = 0; i < idx - 1; i++) {
        oracleIter.next();
    }

    let key = oracleIter.next().value[0];

    if (typeof key != "undefined") {
        return this.getOracle(key);
    } else {
        return null;
    }
};

DBConnectionPool.prototype.getPostgresIdx = function (idx) {
    let postgresIter = this.postgres.entries();
    for (let i = 0; i < idx - 1; i++) {
        postgresIter.next();
    }

    let key = postgresIter.next().value[0];

    if (typeof key != "undefined") {
        return this.getPostgres(key);
    } else {
        return null;
    }
};

module.exports.DBConnectionPool = DBConnectionPool;
