const { dbInstance } = require("../dist");

const options = {
    type: "INI",
    path: "../db.ini",
    autoRepair: false,
};

async function hello() {
    let a = await dbInstance(options);
    let cdr = a.getOracle("oracle1");

    cdr((err, conn) => {
        if (err) {
            return console.log(err);
        }

        conn.execute("select * from DUAL", (err, res) => {
            console.log(res);
        });
    });

    let cdr2 = a.getPostgres("postgresql1");

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

    let cdr3 = a.getMySQL("mysql1");

    cdr3((err, conn) => {
        if (err) {
            return console.log(err);
        }

        conn.query("select * from test", (err, res) => {
            console.log(res);
        });
    });

    let cdr4 = a.getPostgresIdx(0);

    cdr4((err, conn) => {
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
}

hello();
