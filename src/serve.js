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
    const cadastroAprovado = `insert into empresas (nome, razao_social, cnpj, endereco, tipo) value ('${nome}', '${razao}', ${cnpj}, '${endereco}', '${tipo}');`
    conectBanco.query(confirmarInexistencia, (err, resposta) => {
        const resultado = resposta[0].resultado
        if (resultado !== 0) {
            console.log('Já existe esse cadastro!')
            return res.status(400).json({ message: 'CNPJ já cadastrado!' });
        } else {
            conectBanco.query(cadastroAprovado, (erro, respostaCadatroEmpresa) => {
                if (respostaCadatroEmpresa == undefined) {
                    res.status(400).json({ message: `Erro ao inserir no banco de dados!`})
                }
                res.status(200).json({ message: `Cadastrado com sucesso`})
                console.log(`Cadastrado!`)
            })
        }
    })
})

app.post('/cadastrar_socio', (req, res) => {
    const nome_socio = req.body.nome
    const codigo_parceria = req.body.num_contato
    const socio_empresa = req.body.empresa

    const conferirInexistencia = `select count(id_socios) as quantidadeExistente from socios where id_socios = ${codigo_parceria} and id_empresa = ${socio_empresa}`
    const cadastrarSocio = `insert into socios (id_socios, id_empresa, nome) value (${codigo_parceria}, ${socio_empresa}, '${nome_socio}')`

    conectBanco.query(conferirInexistencia, (erro, resp) => {
        const leituraResp = resp[0].quantidadeExistente

        if (leituraResp !== 0) {
            console.log(`Já a registro`)
            return res.status(400).json({ message: `Socio já cadastrado! O contrato de numero: ${codigo_parceria} já tem registro!`})
        } else {
            conectBanco.query(cadastrarSocio, (err, resposta) => {
                if (resposta == undefined) {
                    return res.status(400).json({ message: `Erro ao cadastrar`})
                }
                console.log(`Sucesso ao cadastrar socio!`)
                res.status(200).json({ message: `Socio cadastrado com sucesso! Numero do contrato registrado: ${codigo_parceria}.`})
            })
        }
    })
})



//Usuario

app.post('/usuario_cadastro', (req, res) => {
    const cpf = req.body.cpf
    const nome = req.body.nome
    const cnpj = req.body.cnpj
    const tipo = req.body.perfil
    const status = req.body.status

    const conferirRegistro = `select count(cpf) as buscaCpf from usuarios where cpf = ${cpf}`
    const conferirLigacao = `select count(id_empresa) as registradoPelaEmpresa from empresa_usuario where id_empresa = ${cnpj} and id_usuario = ${cpf}`
    const inserirRegistro = `insert into usuarios(cpf, nome) value (${cpf}, '${nome}')`
    const inserirLigacao = `insert into empresa_usuario(id_empresa, id_usuario, tipo, status_atual) value (${cnpj}, ${cpf}, '${tipo}', '${status}')`

    conectBanco.query(conferirRegistro, (err, resp) => {
        const leituraResp = resp[0].buscaCpf
        if(leituraResp !== 0) {
            conectBanco.query(conferirLigacao, (erro, conferirLigacaoResp) => {
                const leituraResposta = conferirLigacaoResp[0].registradoPelaEmpresa
                console.log(leituraResposta)
                if(leituraResposta !== 0) {
                    return res.status(400).json({ message: 'Esse usuario já foi registrado pela empresa!'})
                } else {
                    conectBanco.query(inserirLigacao, (falha, sinal) => {
                        return res.status(207).json({ message: 'O usuario vínculado a empresa! Usuario já era existente!' })
                    })
                }
            })
        } else {
            conectBanco.query(inserirRegistro, (erro, resposta) => {
                conectBanco.query(inserirLigacao, (falha, sinal) => {
                    res.status(200).json({ message: 'Usuario inserido, e vínculado a empresa!'})
                })
            })
        }
    })
})

// AQUI OS DE CONSULTAR !!


app.get('/empresa_puxar', (req, res) => {
    const cnpj = req.body.cnpj
    let listaSocios = []
    
    
    const puxarDados = `select * from empresas where cnpj = ${cnpj}`
    const puxarSocios = `select * from socios where id_empresa = ${cnpj}`
    conectBanco.query(puxarSocios, (err, resp) => {
        const quantidadeSocios = resp.length
        for(let i = 0; i < quantidadeSocios; i++) {
            listaSocios.push({"NomeDoSócio": `${resp[i].nome}`, "CodigoDeContrato": `${resp[i].id_socios}`})
        }
    })
    
    conectBanco.query(puxarDados, (err, resp) => {
        const resposta = resp[0]
        const nome = resposta.nome
        const razao = resposta.razao_social
        const cnpj = resposta.cnpj
        const endereco = resposta.endereco
        const tipo = resposta.tipo
        console.log(listaSocios)
        res.status(200).json([{message: `Empresa: ${nome}`}, { detalhes: {
            "Nome da empresa": `${nome}`,
            "Razão Social": `${razao}`,
            "CNPJ": `${cnpj}`,
            "Endereço": `${endereco}`,
            "Sócios": listaSocios,
            "Tipo": `${tipo}`
        }}])
    })
})