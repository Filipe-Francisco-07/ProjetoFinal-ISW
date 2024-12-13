import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [bucketData, setBucketData] = useState(''); 
  const [databaseData, setDatabaseData] = useState([]); 
  const [formData, setFormData] = useState({ id: '', text: '' }); 
  const [responseMessage, setResponseMessage] = useState(''); 

  const fetchBucketData = async () => {
    try {
      const response = await fetch('http://localhost:3001');
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados do bucket: ${response.statusText}`);
      }
      const result = await response.text();
      setBucketData(result);
    } catch (error) {
      console.error('Erro ao buscar dados do bucket:', error);
      setBucketData('Erro ao buscar os dados do bucket.');
    }
  };

  const fetchDatabaseData = async () => {
    try {
      const response = await fetch('http://localhost:3001/get-all');
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados do banco: ${response.statusText}`);
      }
      const result = await response.json();
      setDatabaseData(result);
    } catch (error) {
      console.error('Erro ao buscar dados do banco:', error);
    }
  };

  const submitData = async () => {
    try {
      const response = await fetch('http://localhost:3001/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formData.id, data: formData.text }),
      });

      const result = await response.text();
      setResponseMessage(result);
      setFormData({ id: '', text: '' });
      fetchDatabaseData(); 
    } catch (error) {
      console.error('Erro ao enviar os dados:', error);
      setResponseMessage('Erro ao enviar os dados');
    }
  };

  const deleteData = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.text();
      setResponseMessage(result);
      fetchDatabaseData();
    } catch (error) {
      console.error('Erro ao excluir os dados:', error);
      setResponseMessage('Erro ao excluir os dados');
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Frontend Completo</h1>

        <h2>Dados do Bucket</h2>
        <button onClick={fetchBucketData}>Buscar Dados do Bucket</button>
        <pre>{bucketData}</pre>

        <h2>Inserir Dados no Banco</h2>
        <input
          type="number"
          name="id"
          placeholder="ID"
          value={formData.id}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="text"
          placeholder="Texto"
          value={formData.text}
          onChange={handleInputChange}
        />
        <button onClick={submitData}>Enviar</button>
        {responseMessage && <p>{responseMessage}</p>}

        <h2>Dados do Banco</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Texto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {databaseData.map((item) => (
              <tr key={item[0]}>
                <td>{item[0]}</td>
                <td>{item[1]}</td>
                <td>
                  <button onClick={() => deleteData(item[0])}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </header>
    </div>
  );
}

export default App;

