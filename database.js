const express = require('express');
const oracledb = require('oracledb');
const userDB = "AGOMEZ";
const passwordDB = "1234";
const connectionStringDB = "localhost/XEPDB1";
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
const axios = require('axios');
const esp32Endpoint = '192.168.1.111:80';

async function createConnection() {
  try {
    const con = await oracledb.getConnection({
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

async function getTables(con) {
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
        resultado: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 4000 },
        destinatarios: destinatarios,
        asunto: asunto,
        mensaje: mensaje
      }
    );

    const outputValue = result.outBinds.resultado;
    console.log('Resultado de la función:', outputValue);
    return result;

  } catch (error) {
    console.error('Error al ejecutar la función de Oracle:', error);
    throw error;
  }
}
async function getPassengers(con) {

  try {
    const result = await con.execute('SELECT * FROM SAFE_PASAJERO');
    return result.rows;
  } catch (error) {
    console.error('Error al obtener pasajeros:', error);
  } finally {
    if (con) {
      try {
        await con.close();
      } catch (error) {
        console.error('Error al cerrar la conexión:', error);
      }
    }
  }
}

async function setPassenger(pasajero, con) {
  try {
    const { pasa_cedula, pasa_pasaporte, pasa_primer_nombre, pasa_segundo_nombre, pasa_primer_apellido, pasa_segundo_apellido, pasa_fk_pais, pasa_lugar_residencia, pasa_fecha_nacimiento, pasa_nacionalidad } = pasajero;

    const fechaNacimiento = new Date(pasa_fecha_nacimiento);
    const fechaNacimientoFormatted = fechaNacimiento.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    await con.execute(
      `INSERT INTO SAFE_PASAJERO (PASA_CEDULA, PASA_PASAPORTE, "PASA_PRIMER-NOMBRE", "PASA_SEGUNDO-NOMBRE", "PASA_PRIMER-APELLIDO", "PASA_SEGUNDO-APELLIDO", "PASA_FK-PAIS", "PASA_LUGAR-RESIDENCIA", "PASA_FECHA-NACIMIENTO", PASA_NACIONALIDAD) VALUES (:pasa_cedula, :pasa_pasaporte, :pasa_primer_nombre, :pasa_segundo_nombre, :pasa_primer_apellido, :pasa_segundo_apellido, :pasa_fk_pais, :pasa_lugar_residencia, TO_TIMESTAMP(:fecha_nacimiento, 'YYYY-MM-DD HH24:MI:SS'), :pasa_nacionalidad)`,
      {
        pasa_cedula,
        pasa_pasaporte,
        pasa_primer_nombre,
        pasa_segundo_nombre,
        pasa_primer_apellido,
        pasa_segundo_apellido,
        pasa_fk_pais,
        pasa_lugar_residencia,
        fecha_nacimiento: fechaNacimientoFormatted,
        pasa_nacionalidad
      }
    );
    console.log('Pasajero insertado con éxito');
  } catch (error) {
    console.error('Error al insertar pasajero:', error);
  } finally {
    if (con) {
      try {
        await con.close();
      } catch (error) {
        console.error('Error al cerrar la conexión:', error);
      }
    }
  }
}


async function actualizarPasajero(pasajero, con) {

  try {
    let { pasa_cedula, pasa_pasaporte, pasa_primer_nombre, pasa_segundo_nombre, pasa_primer_apellido, pasa_segundo_apellido, pasa_fk_pais, pasa_lugar_residencia, pasa_fecha_nacimiento, pasa_nacionalidad } = pasajero;

    const fechaNacimiento = new Date(pasa_fecha_nacimiento);
    const fechaNacimientoFormatted = fechaNacimiento.toISOString().replace(/T/, ' ').replace(/\..+/, '');


    await con.execute(
      `UPDATE SAFE_PASAJERO SET "PASA_PRIMER-NOMBRE" = :pasa_primer_nombre, "PASA_SEGUNDO-NOMBRE" = :pasa_segundo_nombre, "PASA_PRIMER-APELLIDO" = :pasa_primer_apellido, "PASA_SEGUNDO-APELLIDO" = :pasa_segundo_apellido, "PASA_FK-PAIS" = :pasa_fk_pais, "PASA_LUGAR-RESIDENCIA" = :pasa_lugar_residencia, "PASA_FECHA-NACIMIENTO" = TO_TIMESTAMP(:pasa_fecha_nacimiento, 'YYYY-MM-DD HH24:MI:SS'), PASA_NACIONALIDAD = :pasa_nacionalidad WHERE PASA_CEDULA = :pasa_cedula AND PASA_PASAPORTE = :pasa_pasaporte`,
      {
        pasa_primer_nombre,
        pasa_segundo_nombre,
        pasa_primer_apellido,
        pasa_segundo_apellido,
        pasa_fk_pais,
        pasa_lugar_residencia,
        pasa_fecha_nacimiento: fechaNacimientoFormatted,
        pasa_nacionalidad,
        pasa_cedula,
        pasa_pasaporte
      }
    );
    console.log('Pasajero actualizado con éxito');
  } catch (error) {
    console.error('Error al actualizar pasajero:', error);
  } finally {
    if (con) {
      try {
        await con.close();
      } catch (error) {
        console.error('Error al cerrar la conexión:', error);
      }
    }
  }
}
async function insertarPais(pais, con) {
  try {
      const {pais_nombre } = pais;
      await con.execute(
          `INSERT INTO SAFE_PAIS (PAIS_ID, PAIS_NOMBRE) VALUES (SEC_PAIS.NEXTVAL, :pais_nombre)`,
          {
              pais_nombre
          }
      );
      await con.commit();
      console.log('País insertado con éxito');
  } catch (error) {
      console.error('Error al insertar país:', error);
  } finally {
      if (con) {
          try {
              await con.close();
          } catch (error) {
              console.error('Error al cerrar la conexión:', error);
          }
      }
  }
}
async function releOn() {
  const url = `http://${esp32Endpoint}/releOn`;
  try {
      const response = await axios.get(url);
      if (response.status === 200) {
          console.log('La petición a releOn fue exitosa:', response.data);
      } else {
          console.error('La petición a releOn no fue exitosa. Código de estado:', response.status);
      }
  } catch (error) {
      console.error('Error al hacer la petición a releOn:', error);
  }
}

async function releOff() {
  const url = `http://${esp32Endpoint}/releOff`;
  try {
      const response = await axios.get(url);
      if (response.status === 200) {
          console.log('La petición a releOff fue exitosa:', response.data);
      } else {
          console.error('La petición a releOff no fue exitosa. Código de estado:', response.status);
      }
  } catch (error) {
      console.error('Error al hacer la petición a releOff:', error);
  }
}
app.get('/releOn', async (req, res) => {
  try {
    await releOn();
    res.status(200).send('Rele On');
  } catch (error) {
    res.status(500).json({ error: 'Error al llamar releOn' });
  }
});
app.get('/releOff', async (req, res) => {
  try {
    await releOff();
    res.status(200).send('Rele OFF');
  } catch (error) {
    res.status(500).json({ error: 'Error al llamar releOff' });
  }
});

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

app.get('/getPassengers', async (req, res) => {
  try {
    const con = await createConnection();
    const pasajeros = await getPassengers(con);
    res.json(pasajeros);
  } catch (error) {
    console.error('Error al obtener pasajeros:', error);
    res.status(500).json({ error: 'Error al obtener pasajeros' });
  }
});


app.post('/setPassenger', async (req, res) => {
  try {
    const nuevoPasajero = req.body;
    const con = await createConnection();
    await setPassenger(nuevoPasajero, con);
    res.status(201).json({ mensaje: 'Pasajero insertado con éxito' });
  } catch (error) {
    console.error('Error al insertar pasajero:', error);
    res.status(500).json({ error: 'Error al insertar pasajero' });
  }
});


app.post('/pasajeros/:cedula/:pasaporte', async (req, res) => {
  try {
    const { cedula, pasaporte } = req.params;
    const datosPasajero = req.body;
    const con = await createConnection();
    await actualizarPasajero({ pasa_cedula: cedula, pasa_pasaporte: pasaporte, ...datosPasajero }, con);
    res.json({ mensaje: 'Pasajero actualizado con éxito' });
  } catch (error) {
    console.error('Error al actualizar pasajero:', error);
    res.status(500).json({ error: 'Error al actualizar pasajero' });
  }
});
app.post('/setCountry', async (req, res) => {
  try {
      const pais = req.body;
      const con = await createConnection();
      await insertarPais(pais, con);
      res.status(201).json({ mensaje: 'País insertado con éxito' });
  } catch (error) {
      console.error('Error al insertar país:', error);
      res.status(500).json({ error: 'Error al insertar país' });
  }
});
app.listen(3000, () => {
  console.log('Servidor en ejecución en el puerto 3000');
});
