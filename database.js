const oracle = require('oracledb');
const userDB = "AGOMEZ";
const passwordDB = "1234";
const connectionStringDB= "localhost/XEPDB1";
var con;

async function createConnection(){
    try {
        con = await oracle.getConnection({
            user: userDB,
            password: passwordDB,
            connectionString: connectionStringDB
        });

        console.log('Conexión exitosa !!!!');
    } catch (err) {
        console.log('Error al crear la conexión ', err);
    }
}

async function closeConnection(){
    try {
        if(con){
            try {
                await con.close();
                console.log('Conexión cerrada');
            } catch (error) {
                console.log('Error al cerrar la conexión ', error);
            }
        }
    } catch (err) {
        console.log('Error al crear la conexión ', err);
    }
}

async function getTables(){
    try {
        const result = await con.execute(
            `SELECT table_name FROM all_tables WHERE owner = :owner`,
            [userDB]
        );
        return result.rows.map(row => row[0]);
    } catch (err) {
        console.error('Error al obtener las tablas', err);
        return [];
    }
}

async function run(){
    await createConnection();
    const tables = await getTables();
    console.log('Tablas en la base de datos:', tables);
    await closeConnection();
}

run();
