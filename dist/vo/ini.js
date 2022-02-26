const ini = require("ini");

function INIParser() {}

INIParser.prototype.encode = function (str) {
    return ini.encode(str);
};

INIParser.prototype.decode = function (str) {
    return ini.decode(str);
};

module.exports.INIParser = INIParser;
