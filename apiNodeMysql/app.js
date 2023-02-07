const express = require("express");
var cors = require('cors');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { eAdmin } = require('./middlewares/auth');
const Usuario = require("./models/Usuario");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
    app.use(cors());
    next();
});

const getPagination = (page, size) => {
    const limit = size ? +size : 10;
    const offset = page ? page * limit : 0;

    console.log('2: ', page, size, limit, offset);

    return { limit, offset };
};


app.get("/users", eAdmin, async (req, res) => {
    const { page = 1, size = 10 } = req.query;
    const { limit, offset } = getPagination(page - 1, size);

    await Usuario.findAll({
        attributes: ['id', 'name', 'email', 'password'],
        order: [['id', 'DESC']],
        offset,
        limit
    })
        .then((users) => {
            return res.json({
                error: false,
                users
            });
        }).catch((erro) => {
            return res.status(400).json({
                error: true,
                code: 106,
                message: "Erro: Não foi possível executar a solicitação!"
            });
        });
});

app.get("/users/:id", eAdmin, async (req, res) => {
    const { id } = req.params;
    await Usuario.findByPk(id, {
        attributes: ['id', 'name', 'email', 'password']
    })
        .then((user) => {
            if (user == null) {
                return res.status(400).json({
                    error: true,
                    code: 106,
                    message: "Erro: Não foi encontrado o usuário informado! Verifique!"
                });
            }
            return res.json({
                error: false,
                user
            });
        }).catch((erro) => {
            return res.status(400).json({
                error: true,
                code: 106,
                message: "Erro: Não foi possível executar a solicitação!"
            });
        });
});

app.post("/users", eAdmin, async (req, res) => {
    var dados = req.body;
    dados.password = await bcrypt.hash(dados.password, 8);

    await Usuario.create(dados)
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário cadastrado com sucesso!"
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não cadastrado com sucesso!"
            });
        });
});

app.put("/users", eAdmin, async (req, res) => {
    const { id } = req.body;
    await Usuario.findByPk(id)
        .then((user) => {
            if (user == null) {
                return res.status(400).json({
                    error: true,
                    code: 106,
                    message: "Erro: Edição não efetuada.Não foi encontrado o usuário informado! Verifique!"
                });
            }
            console.log("OK");
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não encontrado. Verifique!"
            });
        });

    await Usuario.update(req.body, { where: { id } })
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário editado com sucesso!"
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                message: "Erro: Não foi possível executar a solicitação!"
            });
        });
});

app.put("/users-pwd", eAdmin, async (req, res) => {
    const { id, password } = req.body;

    await Usuario.findByPk(id)
        .then((user) => {
            if (user == null) {
                return res.status(400).json({
                    error: true,
                    code: 106,
                    message: "Erro: Edição não efetuada.Não foi encontrado o usuário informado! Verifique!"
                });
            }
            console.log("OK");
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não encontrado. Verifique!"
            });
        });

    var senhaCrypt = await bcrypt.hash(password, 8);

    await Usuario.update({ password: senhaCrypt }, { where: { id } })
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Senha editada com sucesso!"
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                message: "Erro: Não foi possível executar a solicitação!"
            });
        });
});

app.delete("/users/:id", eAdmin, async (req, res) => {
    const { id } = req.params;
    await Usuario.findByPk(id)
        .then((user) => {
            if (user == null) {
                return res.status(400).json({
                    error: true,
                    code: 106,
                    message: "Erro: Ação não efetuada.Não foi encontrado o usuário informado! Verifique!"
                });
            }
            console.log("OK");
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não encontrado. Verifique!"
            });
        });

    await Usuario.destroy({ where: { id } })
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário deletado com sucesso!"
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                message: "Erro: Não foi possível executar a solicitação!"
            });
        });
});



app.post('/login', async (req, res) => {
    const user = await Usuario.findOne({
        attributes: ['id', 'name', 'email', 'password'],
        where: {
            email: req.body.email
        }
    });
    if (user === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Usuário não encontrado!"
        });
    };

    if (!(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Senha inválida!"
        });
    };

    var token = jwt.sign({ id: user.id }, process.env.SECRET, {
        //expiresIn: 600 // 10min
        expiresIn: '7d', // 7 dia
    });

    return res.json({
        erro: false,
        mensagem: "Login realizado com sucesso!",
        token
    });
});

app.get("/val-token", eAdmin, async (req, res) => {
    await Usuario.findByPk(req.userId, {
        attributes: ['id', 'name', 'email']
    }).then((user) => {
        if (user === null) {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Necessário realizar o login para acessar a página!"
            });
        };

        return res.json({
            erro: false,
            user
        });
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Necessário realizar o login para acessar a página!"
        });
    });
});

app.listen(8081, () => {
    console.log("Servidor iniciado na porta 8081: http://localhost:8081");
});