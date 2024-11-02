create table socios (
	id_socios char(3) not null,
    id_empresa char(14) not null,
    nome varchar(50) not null,
    primary key (id_socios),
    foreign key (id_empresa) references empresas(cnpj)
);