const { TYPE_INI } = require("./const");

const options = {
    type: TYPE_INI,
    path: "/home/vnoc/junho/sejong-db-connection-pool/db.ini",
    autoRepair: true,
    attemptRepairCount: 10,
    conCurrentSQL: 50,
    waitingForDB: 2000,
};

module.exports.options = options;
