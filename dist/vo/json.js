function JSONParser() {}

JSONParser.prototype.encode = function (str) {
    return JSON.stringify(str);
};

JSONParser.prototype.decode = function (str) {
    return JSON.parse(str);
};

module.exports.JSONParser = JSONParser;
