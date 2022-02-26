const { dbInstance } = require("../dist");

const options = {
    type: "INI",
    path: "../db.ini",
    autoRepair: false,
};

async function hello() {
    let a = await dbInstance(options);
    // let cdr = a.getOracle(0);

    // cdr((err, conn) => {
    //     conn.execute("select * from DUAL", (err, res) => {
    //         console.log(res);
    //     });
    // });

    // setTimeout(async () => {
    //     await a.init();

    //     let cdr2 = a.getOracle(0);

    //     cdr2((err, conn) => {
    //         if (err) {
    //             return console.log(err);
    //         }

    //         conn.execute("select * from DUAL", (err, res) => {
    //             console.log(res);
    //         });
    //     });
    // }, 3000);

    let cdr2 = a.getMySQL(0);

    cdr2((err, conn) => {
        conn.query("select * from test", (err, res) => {
            console.log(res);
        });
    });
}

hello();
