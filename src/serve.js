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

//Cadastrar Empresa OK
app.post('/cadastro_empresa', (req, res) => {
    const nome = req.body.nome
    const razao = req.body.razao
    const cnpj = req.body.cnpj
    const endereco = req.body.endereco
    const tipo = req.body.tipo

    const confirmarInexistencia = `select count(cnpj) as resultado from empresas where cnpj = ${cnpj};`
    const cadastroAprovado = `insert into empresas (nome, razao_social, cnpj, endereco, tipo) values ('${nome}', '${razao}', '${cnpj}', '${endereco}', '${tipo}');`
    conectBanco.query(confirmarInexistencia, (err, resposta) => {
        const resultado = resposta[0].resultado
        if (resultado !== 0) {
            console.log('Já existe esse cadastro!')
            return res.status(400).json({ message: 'CNPJ já cadastrado' });
        }
        console.log('Não existe codigo continua!')
        conectBanco.query(cadastroAprovado, (erro, respostaCadatroEmpresa) => {
            if (respostaCadatroEmpresa == undefined) {
                res.status(400).json({ message: `Erro ao inserir no banco de dados!`})
            }
            res.status(200).json({ message: `Cadastrado com sucesso`})
        })
    })
})