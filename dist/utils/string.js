function str2int(obj) {
    let b = Object.entries(obj).reduce((current, [key, value]) => {
        if (typeof value == "string" && value.match(/^[0-9]+$/)) {
            return {
                ...current,
                [key]: Number(value),
            };
        } else {
            return {
                ...current,
                [key]: value,
            };
        }
    }, {});
    delete obj;
    return b;
}

module.exports.str2int = str2int;
