create table empresas (
	id int not null,
    nome varchar(100) not null,
    razao_social varchar(150) not null,
    cnpj bit(14) not null unique,
    endereco varchar(200),
    tipo varchar(8) not null,
    primary key (id)
);