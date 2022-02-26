const { options } = require("./const/options");
const { DBConnectionPool } = require("./dto/dbConnectionPool");
const { DBConfig } = require("./vo/config");

let pool = null;
let obj = {};

async function dbInstance(opt = options) {
    if (pool == null) {
        pool = new DBConnectionPool(new DBConfig(opt), opt.autoRepair);
        await pool.init();

        obj.getMySQL = pool.getMySQL.bind(pool);
        obj.getOracle = pool.getOracle.bind(pool);
        obj.init = pool.init.bind(pool);
    }

    return obj;
}

module.exports.dbInstance = dbInstance;