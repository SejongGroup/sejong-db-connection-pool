function waitForDB(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

module.exports.waitForDB = waitForDB;
