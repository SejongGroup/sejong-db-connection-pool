const mysql = require("mysql");
const oracledb = require("oracledb");
const { Pool } = require("pg");
const { str2int } = require("../utils/string");
const { waitForDB } = require("../utils/timeout");

function DBConnectionPool(config, autoRepair = false) {
    this.config = config;

    /** mysql, oracle, postgresql */
    this.mysql = [];
    this.oracle = [];
    this.postgres = [];

    /** pools */
    this.pools = [];
    this.autoRepair = {
        use: autoRepair,
        count: 0,
    };
}

DBConnectionPool.prototype.reset = async function () {
    await Promise.all(
        this.pools.map(async (pool) => {
            if (typeof pool != "undefined" && typeof pool.end == "function") {
                await pool.end();
            }

            if (typeof pool != "undefined" && typeof pool.close == "function") {
                await pool.close();
            }
        })
    );

    this.mysql = [];
    this.oracle = [];
    this.postgres = [];

    this.pools = [];
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

DBConnectionPool.prototype.mysqlConnection = async function (key, value) {
    value = str2int(value);
    let pool = mysql.createPool(value);
    let self = this;
    this.pools.push(pool);

    this.mysql.push((idx) => {
        return function (callback) {
            pool.getConnection(async (err, conn) => {
                if (err) {
                    if (self.autoRepair.use == true && self.autoRepair.count < 5) {
                        await waitForDB(1000);
                        await self.init();
                        self.autoRepair.count = self.autoRepair.count + 1;
                        return self.getMySQL(idx)(callback);
                    }

                    return callback(err);
                }

                self.autoRepair.count = 0;
                callback(null, conn);
                return conn.release();
            });
        };
    });
};

DBConnectionPool.prototype.oracleConnection = async function (key, value) {
    return new Promise((resolve) => {
        value = str2int(value);
        let self = this;

        oracledb.createPool(value, (err, pool) => {
            this.pools.push(pool);

            /** 함수 호출 */
            this.oracle.push((idx) => {
                return async function (callback) {
                    if (err) {
                        if (self.autoRepair.use == true && self.autoRepair.count < 5) {
                            await waitForDB(1000);
                            await self.init();
                            self.autoRepair.count = self.autoRepair.count + 1;
                            return self.getOracle(idx)(callback);
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
                };
            });

            resolve();
        });
    });
};

DBConnectionPool.prototype.postgresConnection = async function (key, value) {
    value = str2int(value);
    let pool = new Pool(value);
    let self = this;
    this.pools.push(pool);

    this.postgres.push((idx) => {
        return function (callback) {
            pool.connect(async (err, client, release) => {
                if (err) {
                    if (self.autoRepair.use == true && self.autoRepair.count < 5) {
                        await waitForDB(1000);
                        await self.init();
                        self.autoRepair.count = self.autoRepair.count + 1;
                        return self.getPostgres(idx)(callback);
                    }

                    return callback(err);
                }

                self.autoRepair.count = 0;
                callback(null, client);
                return release();
            });
        };
    });
};

DBConnectionPool.prototype.getMySQL = function (idx) {
    return this.mysql[idx](idx);
};

DBConnectionPool.prototype.getOracle = function (idx) {
    return this.oracle[idx](idx);
};

DBConnectionPool.prototype.getPostgres = function (idx) {
    return this.postgres[idx](idx);
};

module.exports.DBConnectionPool = DBConnectionPool;
