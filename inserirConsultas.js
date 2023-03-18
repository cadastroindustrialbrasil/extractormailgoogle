const mysql = require('mysql');
const fs = require('fs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Cria a conexão com o banco de dados
const connection = mysql.createConnection({
    host: 'sh-pro20.hostgator.com.br',
    user: 'eduard72_felipe',
    password: 'oQnD~rzZWG&9',
    database: 'eduard72_consultagoogle'
  });

// Conecta ao banco de dados
connection.connect();

// Abre o arquivo de texto para leitura
const stream = fs.createReadStream('consultas.txt', { encoding: 'utf8' });

// Lê o arquivo linha por linha
let lineNumber = 1;
stream.on('data', (chunk) => {
  const lines = chunk.split('\n');
  lines.forEach((line) => {
    // Insere a linha na tabela do banco de dados
    const sql = line;
    delay(100)
    connection.query(sql, (error, results, fields) => {
      if (error) {
        console.error(`Erro na linha ${lineNumber}: ${error}`);
      } else {
        console.log(`Linha ${lineNumber} inserida com sucesso!`);
      }
      lineNumber++;
    });
  });
});

// Fecha a conexão
stream.on('end', () => {
  connection.end();
});
