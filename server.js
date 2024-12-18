const express = require('express');
const axios = require('axios');
const cors = require('cors');
const oracledb = require('oracledb');
const multer = require('multer');
const oci = require('oci-sdk');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json()); 

const storage = multer.memoryStorage();
const upload = multer({ storage });

const provider = new oci.common.ConfigFileAuthenticationDetailsProvider(
  process.env.OCI_CONFIG_PATH || '~/.oci/config'
);


const namespaceName = 'grr7dzhnrfiq';
const bucketName = 'bucket-teste';

const objectStorageClient = new oci.objectstorage.ObjectStorageClient({ authenticationDetailsProvider: provider });

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  try {
    const putObjectRequest = {
      namespaceName: namespaceName,
      bucketName: bucketName,
      objectName: file.originalname,
      putObjectBody: file.buffer,
    };

    await objectStorageClient.putObject(putObjectRequest);

    res.send('Arquivo enviado com sucesso para o Object Storage.');
  } catch (error) {
    console.error('Erro ao fazer upload para o Object Storage:', error);
    res.status(500).send('Erro ao fazer upload do arquivo.');
  }
});

async function connectToDatabase() {
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
    connection = await connectToDatabase(); 
    const result = await connection.execute('SELECT * FROM nodetab');
    console.log('Dados retornados:', result.rows);
    res.json(result.rows); 
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

app.put('/update', async (req, res) => {
  const { id, data } = req.body;

  if (!id || !data) {
    return res.status(400).send('Campos \"id\" e \"data\" são obrigatórios');
  }

  let connection;

  try {
    connection = await connectToDatabase();
    const sql = `UPDATE nodetab SET data = :1 WHERE id = :2`;
    const result = await connection.execute(sql, [data, id], { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).send('Registro não encontrado');
    }

    res.send('Dados atualizados com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    res.status(500).send('Erro ao atualizar dados no banco');
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
