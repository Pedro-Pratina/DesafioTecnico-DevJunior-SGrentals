create table empresas (
	id int auto_increment,
    nome varchar(100) not null,
    razao_social varchar(150) not null,
    cnpj char(14) not null unique,
    endereco varchar(200),
    tipo varchar(8) not null,
    primary key (id)
);