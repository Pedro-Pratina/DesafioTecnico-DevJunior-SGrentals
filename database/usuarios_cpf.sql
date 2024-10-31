create table usuarios_cpf (
    id_pessoa_cpf int not null,
    id_empresa int not null,
    nome_pessoa varchar(100) not null,
    cpf bit(12) not null,
    tipo varchar(21) not null,
    primary key (id_pessoa_cpf),
    foreign key (id_empresa) references empresas(id)
);