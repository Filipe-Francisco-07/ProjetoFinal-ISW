const express = require('express');
const axios = require('axios');
const cors = require('cors');
const oracledb = require('oracledb');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json()); 

async function connectToDatabase() 
  return await oracledb.getConnection({
    user: "admin",
    password: "V3Ae!TDT.uGK4kR",
    connectionString: "(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.sa-saopaulo-1.oraclecloud.com))(connect_data=(service_name=gccf76a8dab17ef_myclouddb_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))"
  });
}

app.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/grr7dzhnrfiq/b/bucket-teste/o/teste.txt');
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar o objeto');
  }
});

app.post('/insert', async (req, res) => {
  const { id, data } = req.body;

  if (!id || !data) {
    return res.status(400).send('Campos "id" e "data" são obrigatórios');
  }

  let connection;

  try {
    connection = await connectToDatabase();
    const sql = `INSERT INTO nodetab (id, data) VALUES (:1, :2)`;
    await connection.execute(sql, [id, data], { autoCommit: true });
    res.send('Dados inseridos com sucesso!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao inserir dados no banco');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

app.get('/get-all', async (req, res) => {
  let connection;

  try {
    console.log('Rota /get-all chamada');
    connection = await connectToDatabase(); // Certifique-se de que a função connectToDatabase está correta
    const result = await connection.execute('SELECT * FROM nodetab');
    console.log('Dados retornados:', result.rows);
    res.json(result.rows); // Retorna os dados no formato JSON
  } catch (error) {
    console.error('Erro ao consultar dados:', error);
    res.status(500).send('Erro ao consultar dados no banco');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Erro ao fechar conexão:', err);
      }
    }
  }
});

app.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  let connection;

  try {
    connection = await connectToDatabase();
    const sql = 'DELETE FROM nodetab WHERE id = :1';
    const result = await connection.execute(sql, [id], { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).send('Registro não encontrado');
    }

    res.send('Registro excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir dados:', error);
    res.status(500).send('Erro ao excluir dados no banco');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Erro ao fechar conexão:', err);
      }
    }
  }
});


app.listen(port, () => {
  console.log(`Server teste at http://localhost:${port}`);
});

