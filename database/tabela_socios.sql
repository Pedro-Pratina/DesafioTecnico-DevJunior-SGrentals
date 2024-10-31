create table socios (
	id_socios int not null,
    id_empresa int not null,
    nome varchar(50) not null,
    primary key (id_socios),
    foreign key (id_empresa) references empresas(id)
);