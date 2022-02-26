# <div align="center"> db-connection-pool </div>

<div align="center">

db-connection-pool 라이브러리는 Mysql 사용자와 Oracle 사용자를 위해 만들었습니다.

</div>

### 요약

> 해당 라이브러리는 MySQL과 Oracle의 사용을 여러대 사용하거나, 여러 서버에서 같은 설정파일을 이용하여 데이터베이스를 관리 및 접근할 때 유용할 것입니다.

설정파일을 통해 데이터베이스를 만들고, 데이터베이스의 접근은 사전에 만들어 놓은 Pool 객체에서 Connection 객체를 통해 접근하실 수 있습니다.

아래 설정을 통해 데이터베이스를 쉽게 접근하세요.

## Installation

From npm:

```sh
npm install --save db-connection-pool
```

## Usage

### Importing

이 라이브러리는 CJS 형태로 제공되며 자바스크립트와 타입스크립트 프로젝트 모두에서 사용할 수 있습니다.

아래는 CJS 형태에서 임포트를 하기 위한 방법입니다.

```ts
const { dbInstance } = require("db-connection-pool");
```

### Examples

먼저 데이터베이스의 설정 파일을 정의합니다.

```ini
[mysql1]
host=localhost
user=root
password=root2
port=3306
database=test
connectionLimit=4

[oracle_cdr]
user=root
password=root
connectString=localhost/XE
poolAlias=cdr1
poolIncrement=0
poolMax=4
poolMin=4
poolPingInterval=30
```

그리고 해당 라이브러리를 사용하여 편리하게 데이터베이스를 접근할 수 있습니다.

```ts
const options = {
    type: "INI" /* 데이터베이스 설정 파일의 확장자 (ini, json 지원) */,
    path: "db.ini" /* 데이터베이스 설정 파일의 위치 */,
    autoRepair:
        false /* 데이터베이스의 접근 객체가 에러가 발생 시에 자동으로 리페어 해주는 역할 */,
};

async function hello() {
    let a = await dbInstance(options); /* 데이터베이스 인스턴스를 생성합니다. */
    let cdr = a.getOracle(0); /* 오라클 인스턴스를 가져옵니다 */

    cdr((err, conn) => {
        conn.execute("select * from DUAL", (err, res) => {
            console.log(res);
        });
    });

    let cdr2 = a.getMySQL(0); /* MySQL 인스턴스를 가져옵니다 */

    cdr2((err, conn) => {
        conn.query("select * from test", (err, res) => {
            console.log(res);
        });
    });
}

hello();
```

## HomePage

Github © [Page](https://github.com/A-big-fish-in-a-small-pond)

NPM © [Page](https://www.npmjs.com/org/a-big-fish-in-a-small-pond)

## License

MIT © [Park and Kim](http://github.com/nusgnojkrap)

MIT © [Park and Kim](http://github.com/libtv)
