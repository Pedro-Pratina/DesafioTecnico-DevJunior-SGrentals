create table empresa_usuarios (
    id_empresa char(14) not null,
    id_usuario char(11) not null,
    tipo varchar(24) not null,
    status_atual varchar(7),
    foreign key (id_empresa) references empresas(cnpj),
    foreign key (id_usuario) references usuarios(cpf)
)