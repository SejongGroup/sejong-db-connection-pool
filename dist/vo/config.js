const fs = require("fs");
const { TYPE_INI, TYPE_JSON } = require("../const/const");
const { INIParser } = require("./ini");
const { JSONParser } = require("./json");

function DBConfig(opt) {
    this.data = null;
    this.opt = opt;
    this.strategy = null;
    this.file = null;
    this.init();
}

DBConfig.prototype.init = function () {
    if (this.opt.type == TYPE_INI) {
        this.strategy = new INIParser();
    } else if (this.opt.type == TYPE_JSON) {
        this.strategy = new JSONParser();
    } else {
        this.strategy = null;
    }

    this.fileLoad();
};

DBConfig.prototype.fileLoad = function () {
    this.data = fs.readFileSync(this.opt.path, "utf-8");
};

DBConfig.prototype.get = function () {
    return this.strategy.decode(this.data);
};

module.exports.DBConfig = DBConfig;
