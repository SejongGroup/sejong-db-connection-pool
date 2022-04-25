const { dbInstance } = require("../dist");

const options = {
    type: "INI" /** 데이터베이스 설정 파일 확장자 */,
    path: "/home/vnoc/junho/junho-naver-smart-api/db.ini" /** 데이터베이스 설정파일 경로 */,
    autoRepair: true /** 데이터베이스 접속 및 쿼리 진행 중 오류 발생 시 자동 리페어 기능 */,
    attemptRepairCount: 5 /** 자동리페어 기능을 수행하는 횟수 */,
    conCurrentSQL: 20 /** 하나의 데이터베이스를 동시 수행할 수 있는 최대 사용자 수 */,
    waitingForDB: 1000 /** 자동리페어 기능을 수행할 떄 기다리는 시간 */,
};

async function hello() {
    let a = await dbInstance(options);
    let cdr = a.getOracle("oracle");

    cdr((err, conn) => {
        if (err) {
            return console.log(err);
        }

        conn.execute("SELECT VNS_IDX FROM TB_VNS_IBIZ_NUMBER WHERE VNS_NUMBER = '050701009998'", (err, res) => {
            console.log(res);
        });
    });
}

hello();
