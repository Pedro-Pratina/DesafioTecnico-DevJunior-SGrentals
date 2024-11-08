const express = require('express');
const sql = require('mysql2');
const app = express();
const cors = require('cors')
const porta = 3000

app.use(cors())
app.use(express.json())

//conectar Banco de Dados
const conectBanco = sql.createConnection({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test_dev'
});

//Teste
conectBanco.connect((err) => {
    if (err) {console.log(err)}
    else {console.log('conectado')}
})

app.listen(porta, () => {
    console.log(`Aberto na porta: ${porta}`)
})

//Teste de envio
app.post('/test-receber', (req, res) => {
    console.log(req.body)
    const info = req.body.nome;
    res.json({  message: "Chegou as info"  })
    console.log(info)
})

//Funções de cadastro.
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
            return res.status(400).json({ message: 'CNPJ já cadastrado!' });
        } else {
            conectBanco.query(cadastroAprovado, (erro, respostaCadatroEmpresa) => {
                if (respostaCadatroEmpresa == undefined) {
                    return res.status(400).json({ message: `Erro ao inserir no banco de dados!`})
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

app.post('/usuario_cadastro', (req, res) => {
    const cpf = req.body.cpf
    const nome = req.body.nome
    const cnpj = req.body.cnpj
    const tipo = req.body.tipo
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

//Comandos de buscas
app.get('/empresa_puxar', (req, res) => {
    const {cnpj, tipo, inicial, socios} = req.body
    console.log(cnpj, tipo, inicial, socios)

    let puxarDados = `select * from empresas where 1=1`

    const filtroCnpj = ` and cnpj = ${cnpj}`
    const filtroTipo = ` and tipo = "${tipo}"`
    const filtroInicial = ` and nome like "${inicial}%"`

    if(cnpj) {
        puxarDados += filtroCnpj
    }
    if(tipo) {
        puxarDados += filtroTipo
    }
    if(inicial) {
        puxarDados += filtroInicial
    }

    console.log(puxarDados)

    if(socios && cnpj) {
        const puxarSocios = `select * from socios where id_empresa = ${cnpj}`
        let listaSocios = []

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
    } else if (socios && !cnpj) {
        return res.status(400).json([{ message: `Para saber os sócios é necessário o CNPJ da empresa!`}])
    }

    if(!socios) {
        conectBanco.query(puxarDados, (err, resp) => {
            let respostaConstruida = []
            resp.map((mapeado) => {
                const {nome, razao_social, cnpj, endereco, tipo} = mapeado

                respostaConstruida.push(
                    [{message: `Empresa: ${nome}`}, { detalhes: {
                        "Nome da empresa": `${nome}`,
                        "Razão Social": `${razao_social}`,
                        "CNPJ": `${cnpj}`,
                        "Endereço": `${endereco}`,
                        "Tipo": `${tipo}`
                    }}]
                )
            })
            console.log(respostaConstruida)
            res.status(200).json(respostaConstruida)
        })
    }
})

app.get('/usuario_puxar', (req, res) => {
    const {cnpj, cpf, perfil, status} = req.body
    let pesquisarUsuario = `select empresas.nome as 'empresa', usuarios.cpf, usuarios.nome, empresa_usuario.tipo as 'perfil', empresa_usuario.status_atual as 'status' from usuarios inner join empresa_usuario on usuarios.cpf = empresa_usuario.id_usuario inner join empresas on empresas.cnpj = empresa_usuario.id_empresa where 0=0`

    const porCpf = ` and usuarios.cpf = '${cpf}'`
    const porPerfil = ` and empresa_usuario.tipo like '${perfil.substr(0,2)}%'`
    const porStatus = ` and empresa_usuario.status_atual like '${status.substr(0,2)}%'`
    const porCnpj = ` and empresa_usuario.id_empresa = '${cnpj}'`

    if(cpf){
        pesquisarUsuario += porCpf;
    }
    if(perfil){
        pesquisarUsuario += porPerfil;
    }
    if(status){
        pesquisarUsuario += porStatus;
    }
    if(cnpj){
        pesquisarUsuario += porCnpj;
    }


    conectBanco.query(pesquisarUsuario, (err, resp)=> {
        
        if(err){
            return res.status(500).json({ message: 'erro ao consultar!'})
        } else {
            let montarResposta = []
            resp.map((eita) => {
                const {empresa, cpf, nome, perfil, status} = eita
                console.log(cnpj, cpf, nome, perfil, status)
                montarResposta.push(
                    [{message: `CNPJ Empresa: ${empresa}`}, { detalhes: {
                        "Nome usuário": `${nome}`,
                        "CPF": `${cpf}`,
                        "Perfil": `${perfil}`,
                        "Status": `${status}`
                    }}]
                )
            })
            console.log(`Pesquisa de usuário feita!`)
            res.status(200).json(montarResposta)
        }
    })
})

//Comandos de delatar
app.delete('/deletar_empresa', (req, res) => {
    const cnpj = req.body.cnpj

    const deletaLigacoes = `delete from empresa_usuario where id_empresa = ${cnpj}`
    const deletaSocios = `delete from socios where id_empresa = ${cnpj}`
    const deletaRegistro = `delete from empresas where cnpj = ${cnpj}`

    const tiraSafe = `set sql_safe_updates = 0`
    conectBanco.query(tiraSafe, (err, resp) => {})

    conectBanco.query(deletaLigacoes, (err, resp) => {
        if(err){
            return res.status(500).json({ message: `Erro ao deletar as ligações da empresa!`})
        }
        conectBanco.query(deletaSocios, (erro, resposta) => {
            if(erro){
                return resp.status(500).json({ message: `Erro ao deletar sócios`})
            }
            conectBanco.query(deletaRegistro, (erroFinal, respostaFinal) => {
                if(erroFinal){
                   return res.status(500).json({ message: `Erro ao deletar o registro da empresa!`})
                }
                res.status(200).json({ message: `Empresa deletada com sucesso!`})
            })
        })
    })
})

app.delete('/delete_socios', (req, res) => {
    const contrato = req.body.numeroContrato
    const cnpj = req.body.cnpj

    const deleteSocio = `delete from socios where id_socios = ${contrato} and id_empresa = ${cnpj}`

    const tiraSafe = `set sql_safe_updates = 0`
    conectBanco.query(tiraSafe, (err, resp) => {})

    conectBanco.query(deleteSocio, (err, resp) => {
        if(err){
            return res.status(500).json({ message: `Erro ao deletar!`})
        }
        res.status(200).json({ message: `Sócio deletado!`})
    })
})

app.delete('/delete_usuario', (req, res) => {
    const cpf = req.body.cpf

    const consultarLigacoes = `select count(id_usuario) as quantLigacoes from empresa_usuario where id_usuario = ${cpf}`
    const deletarLigacoes = `delete from empresa_usuario where id_usuario = ${cpf}`
    const deletarRegistro = `delete from usuarios where cpf = ${cpf}`

    const tiraSafe = `set sql_safe_updates = 0`
    conectBanco.query(tiraSafe, (err, resp) => {})

    conectBanco.query(consultarLigacoes, (erroConsulta, respostaConsulta) => {
        if(respostaConsulta[0].quantLigacoes !== 0){
            conectBanco.query(deletarLigacoes, (err, resp) => {
                if(err){
                    return res.status(500).json({ message: `Erro ao deletar ligações do usuário!`})
                }
                conectBanco.query(deletarRegistro, (erro, resposta) => {
                    if(erro){
                        return res.status(500).json({ message: `Erro ao deletar usuário!`})
                    }
                    console.log(`Usuário e ligações deletados!`)
                    res.status(200).json({ message: `Usuário deletado com sucesso!`})
                })
            })
        } else {
            conectBanco.query(deletarRegistro, (erro, resposta) => {
                if(erro){
                    return res.status(500).json({ message: `Erro ao deletar usuário!`})
                }
                console.log(`Usuário deletado!`)
                res.status(200).json({ message: `Usuário deletado com sucesso!`})
            })
        }
    })

})

//Comandos de edição.
app.put('/editar_empresa', (req, res) => {
    const {cnpj, nome, razao_social, endereco, tipo}  = req.body

    if(!cnpj){
        return res.status(400).json({ message: `É necessário o CNPJ da empresa!`})
    }

    let dadosAlterar = ``

    const nomeSet = `nome = '${nome}',`
    const razaoSet = `razao_social = '${razao_social}',`
    const enderecoSet = `endereco = '${endereco}',`
    const tipoSet = `tipo = '${tipo}',`

    if(nome){
        dadosAlterar += nomeSet
    }
    if(razao_social){
        dadosAlterar += razaoSet
    }
    if(endereco){
        dadosAlterar += enderecoSet
    }
    if(tipo){
        dadosAlterar += tipoSet
    }
    
    let editarEmpresa = `update empresas set ${dadosAlterar} cnpj = ${cnpj} where cnpj = ${cnpj}`

    const tiraSafe = `set sql_safe_updates = 0`
    conectBanco.query(tiraSafe, (err, resp) => {})

    conectBanco.query(editarEmpresa, (err,resp) => {
        if(err){
            return res.status(500).json({ message: `Erro ao Editar empresa!`})
        }
        res.status(200).json({ message: `Dados editado com sucesso!`})
    })
})

app.put('/editar_usuarios', (req, res) => {
    const {cpf, nome, cnpj, perfil, status} = req.body

    if(perfil && !cnpj || status && !cnpj){
        return res.status(400).json({ message: `Para editar o perfil do usuário ou ativa ou inativar, é necessário o CNPJ da empresa!`})
    }

    let editarUsuario = `update usuarios set nome = '${nome}' where cpf = ${cpf}`

    let parametros = ``

    const perfilSet = ` tipo = '${perfil}',`
    const statusSet = ` status_atual = '${status}',`

    if(perfil){
        parametros += perfilSet
    }
    if(status){
        parametros += statusSet
    }

    let editarStatusPerfil = `update empresa_usuario set ${parametros} id_empresa = ${cnpj} where id_empresa = ${cnpj} and id_usuario = ${cpf}`
    
    const tiraSafe = `set sql_safe_updates = 0`
    conectBanco.query(tiraSafe, (err, resp) => {})

    if(perfil || status){
        conectBanco.query(editarStatusPerfil, (err, resp) => {
            if(err){
                console.log(err)
                return res.status(500).json({ message: `Erro ao editar perfil ou status!`})
            }
            if(nome){
                conectBanco.query(editarUsuario, (erro, resposta) => {
                    if(erro){
                        return res.status(500).json({ message: `Erro ao editar usuário!`})
                    }
                    res.status(200).json({ message: `Usuário editado com sucesso!`})
                })
            } else {
                res.status(200).json({ message: `Usuário editado com sucesso!`})
            }
        })
    } else if (nome) {
        conectBanco.query(editarUsuario, (erro, resposta) => {
            if(erro){
                return res.status(500).json({ message: `Erro ao editar usuário!`})
            }
            res.status(200).json({ message: `Usuário editado com sucesso!`})
        })
    }
})

app.put('/editar_socio', (req, res) => {
    const id_socios = req.body.contrato
    const id_empresa = req.body.cnpj
    const nome = req.body.nome

    const editarSocio = `update socios set nome = '${nome}' where id_empresa = ${id_empresa} and id_socios = ${id_socios}`

    const tiraSafe = `set sql_safe_updates = 0`
    conectBanco.query(tiraSafe, (err, resp) => {})

    if(!id_empresa||!id_socios||!nome) {
        return res.status(400).json({ message: `Informações faltando!`})
    }

    conectBanco.query(editarSocio, (err, resp) => {
        if(err){
            return res.status(500).json({ message: `Erro ao editar Sócio!`})
        }
        res.status(200).json({ message: `Editado com sucesso!`})
    })
})