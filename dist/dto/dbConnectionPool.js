const mysql = require("mysql");
const oracledb = require("oracledb");
const { Pool } = require("pg");
const { str2int } = require("../utils/string");
const { waitForDB } = require("../utils/timeout");
const { ProcessQueue } = require("../vo/processQueue");

oracledb.poolTimeout = 10; // Never terminate
oracledb.maxRows = 50000;

function DBConnectionPool(config, options) {
    this.config = config;
    this.options = options;

    /** mysql, oracle, postgresql */
    this.mysql = new Map();
    this.oracle = new Map();
    this.postgres = new Map();

    /** pools */
    this.pools = new Map();
    this.configStruct = new Map();
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
    this.configStruct.clear();
};

DBConnectionPool.prototype.init = async function () {
    await this.reset();
    let data = this.config.get();

    await Promise.all(
        Object.entries(data).map(async ([key, val]) => {
            this.configStruct.set(key, val);
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

DBConnectionPool.prototype.mysqlConnection = function (key, value) {
    return new Promise((resolve) => {
        value = str2int(value);

        let pool = mysql.createPool(value);
        this.pools.set(key, pool);

        if (this.mysql.has(key) == false) {
            this.mysql.set(key, new ProcessQueue(this.options.conCurrentSQL));
        }

        return resolve();
    });
};

DBConnectionPool.prototype.oracleConnection = function (key, value) {
    return new Promise(async (resolve) => {
        value = str2int(value);
        let pool = null;

        try {
            pool = await oracledb.createPool({ ...value });
        } catch (err) {
            pool = {};
            pool.getConnection = (callback) => {
                callback(err, null);
            };
            pool.close = () => {};
        }

        this.pools.set(key, pool);

        if (this.oracle.has(key) == false) {
            this.oracle.set(key, new ProcessQueue(this.options.conCurrentSQL));
        }

        resolve();
    });
};

DBConnectionPool.prototype.postgresConnection = function (key, value) {
    return new Promise((resolve) => {
        value = str2int(value);

        let pool = new Pool(value);
        this.pools.set(key, pool);

        if (this.postgres.has(key) == false) {
            this.postgres.set(key, new ProcessQueue(this.options.conCurrentSQL));
        }

        resolve();
    });
};

DBConnectionPool.prototype.getMySQL = function (key) {
    if (this.mysql.has(key)) {
        let self = this;
        let queue = this.mysql.get(key);
        return function (callback) {
            queue.push(self.process(key, queue, self.mysqlConnection.bind(self), callback));
        };
    } else {
        return null;
    }
};

DBConnectionPool.prototype.getOracle = function (key) {
    if (this.oracle.has(key)) {
        let self = this;
        let queue = this.oracle.get(key);
        return function (callback) {
            queue.push(self.process(key, queue, self.oracleConnection.bind(self), callback));
        };
    } else {
        return null;
    }
};

DBConnectionPool.prototype.getPostgres = function (key) {
    if (this.postgres.has(key)) {
        let self = this;
        let queue = this.postgres.get(key);
        return function (callback) {
            queue.push(self.process(key, queue, self.postgresConnection.bind(self), callback));
        };
    } else {
        return null;
    }
};

DBConnectionPool.prototype.process = function (key, queue, connection, callback) {
    let self = this;
    return async function innerProcess(idx) {
        let pool = self.pools.get(key);

        pool.getConnection = pool.getConnection || pool.connect;

        pool.getConnection(async (err, conn, release) => {
            if (err) {
                if (queue.autoRepairCount < self.options.attemptRepairCount && self.options.autoRepair == true) {
                    queue.autoRepairCount = queue.autoRepairCount + 1;
                    self.pools.delete(key);
                    await self.poolClose(pool);
                    await connection(key, self.configStruct.get(key));
                    return innerProcess(idx);
                } else {
                    callback(err);
                    throw new Error(err);
                }
            }

            callback(err, conn);

            if (typeof release == "undefined") {
                return conn.release();
            } else {
                return release();
            }
        });
    };
};

DBConnectionPool.prototype.poolClose = async function (pool) {
    if (typeof pool != "undefined" && typeof pool.end == "function") {
        await pool.end();
    }

    if (typeof pool != "undefined" && typeof pool.close == "function") {
        await pool.close();
    }
};

module.exports.DBConnectionPool = DBConnectionPool;
