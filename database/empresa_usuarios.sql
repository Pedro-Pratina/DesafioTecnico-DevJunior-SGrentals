create table empresa_usuarios (
    id_empresa int not null,
    id_usuario char(11) not null,
    tipo varchar(21) not null,
    status_atual varchar(7),
    foreign key (id_empresa) references empresas(id),
    foreign key (id_usuario) references usuarios(cpf)
)