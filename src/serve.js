const express = require('express');
const sql = require('mysql2');
const app = express();
const cors = require('cors')
const porta = 3000

app.use(cors())
app.use(express.json())

const conectBanco = sql.createConnection({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test_dev'
});

conectBanco.connect((err) => {
    if (err) {console.log(err)}
    else {console.log('conectado')}
})

app.listen(porta, () => {
    console.log(`Aberto na porta: ${porta}`)
})

app.post('/test-receber', (req, res) => {
    console.log(req.body)
    const info = req.body.nome;
    res.json({  message: "Chegou as info"  })
    console.log(info)
})

app.post('/cadastro_empresa', (req, res) => {
    const nome = req.body.nome
    const razao = req.body.razao
    const cnpj = req.body.cnpj
    const endereco = req.body.endereco
    const tipo = req.body.tipo

    const confirmarInexistencia = `select count(cnpj) as resultado from empresas where cnpj = ${cnpj};`
    conectBanco.query(confirmarInexistencia, (err, result) => {
        const resultado = result[0].resultado
        if (resultado !== 0) {
            console.log('F')
            console.log(resultado)
        }
        console.log('ta liberado')
        console.log(resultado)
    })
    res.json({ message: 'Chegou as info'})
    console.log(nome, razao, cnpj, endereco, tipo)
})