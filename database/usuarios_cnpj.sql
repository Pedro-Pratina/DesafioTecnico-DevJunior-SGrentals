create table usuarios_cnpj (
	id_empresa_cnpj int not null,
    id_empresa int not null,
    nome_empresa varchar(100) not null,
    cnpj bit(14) not null,
    tipo varchar(10),
    primary key (id_empresa_cnpj),
    foreign key (id_empresa) references empresas(id)
);