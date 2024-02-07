const express = require('express');
const oracle = require('oracledb');
const userDB = "AGOMEZ";
const passwordDB = "1234";
const connectionStringDB= "localhost/XEPDB1";
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

async function createConnection(){
    try {
        const con = await oracle.getConnection({
            user: userDB,
            password: passwordDB,
            connectionString: connectionStringDB
        });

        console.log('Conexión exitosa !!!!');
        return con;
    } catch (err) {
        console.log('Error al crear la conexión ', err);
        throw err;
    }
}

async function getTables(con){
    try {
        const result = await con.execute(
            `SELECT table_name FROM all_tables WHERE owner = :owner`,
            [userDB]
        );
        return result.rows.map(row => row[0]);
    } catch (err) {
        console.error('Error al obtener las tablas', err);
        throw err;
    }
}


async function enviarCorreoClinica(destinatarios, asunto, mensaje, con) {
  
    try {

      const result = await con.execute(
        `BEGIN :resultado := fun_enviar_correo_clinica(:destinatarios, :asunto, :mensaje); END;`,
        {
          resultado: { dir: oracle.BIND_OUT, type: oracle.STRING, maxSize: 4000 },
          destinatarios: destinatarios,
          asunto: asunto,
          mensaje: mensaje
        }
      );

      const outputValue = result.outBinds.resultado;
      console.log('Resultado de la función:', outputValue);
      return outputValue;
  
    } catch (error) {
      console.error('Error al ejecutar la función de Oracle:', error);
      throw error;
    }
  }
app.get('/tables', async (req, res) => {
    try {
        const con = await createConnection();
        const tables = await getTables(con);
        await con.close();
        res.json(tables);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las tablas' });
    }
});
app.post('/sendEmail', async (req, res) => {
    const { destinatarios, asunto, mensaje } = req.body;
    try {
        const con = await createConnection();
      const result = await enviarCorreoClinica(destinatarios, asunto, mensaje, con);
      res.status(200).json({ message: result });
      await con.close();
    } catch (error) {
      res.status(500).json({ error: 'Error al enviar el correo clínica' });
    }
  });

app.listen(3000, () => {
    console.log('Servidor en ejecución en el puerto 3000');
});
