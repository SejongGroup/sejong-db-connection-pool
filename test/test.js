const { dbInstance } = require("../dist");

const options = {
    type: "INI",
    path: "../db.ini",
    autoRepair: false,
};

async function hello() {
    let a = await dbInstance(options);
    let cdr = a.getOracle(0);

    cdr((err, conn) => {
        conn.execute("select * from DUAL", (err, res) => {
            console.log(res);
        });
    });

    let cdr2 = a.getPostgres(0);

    cdr2((err, conn) => {
        if (err) {
            return console.log(err);
        }
        conn.query("SELECT NOW()", (err, result) => {
            if (err) {
                return console.error("Error executing query", err.stack);
            }
            console.log(result.rows);
        });
    });

    let cdr3 = a.getMySQL(0);

    cdr3((err, conn) => {
        conn.query("select * from test", (err, res) => {
            console.log(res);
        });
    });
}

hello();
