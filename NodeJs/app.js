const express = require("express");

const app = express();

app.use(express.json());

// middleware roda primeiro, antes de todas as rotas.
// app.use((req, res, next) => {
//     console.log("Acessou o middleware!");
//     next();
// });

function validaContato(req, res, next) {
    if (!req.body.email) {
        return res.json({
            erro: true,
            mensagem: "Necessário informar o campo e-mail!",
        });
    };
    return next();
};

app.get("/", (req, res) => {
    res.send("Bem vindo Marcelo!");
});

app.get("/contatos", (req, res) => {
    return res.json([
        {
            "nome": "Marcelo",
            "email": "mcortinho@gmail.com"
        },
        {
            "nome": "Fabiane",
            "email": "fabiane@gmail.com"
        },
        {
            "nome": "João",
            "email": "jmc@gmail.com"
        },
    ]);
});

app.get("/contatos/:id", (req, res) => {
    const { id } = req.params
    const { situacao } = req.query;
    return res.json([
        {
            id,
            nome: "Marcelo",
            email: "mcortinho@gmail.com",
            situacao
        },
    ]);
});

app.post("/contato", validaContato, (req, res) => {
    var { nome, email } = req.body;
    return res.json({
        nome,
        email
    });
});

app.put("/contato/:id", validaContato, (req, res) => {
    const { id } = req.params;
    var { nome, email, _id } = req.body;
    return res.json({
        id,
        _id,
        nome,
        email
    });
});

app.delete("/contato/:id", (req, res) => {
    const { id } = req.params;
    return res.json({
        id
    });
});

app.listen(8080, () => {
    console.log("Servidor iniciado na porta 8080: http://localhost:8080");
});