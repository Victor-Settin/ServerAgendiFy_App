const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const port = 3001;

// Conectando ao MongoDB

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
mongoose
    .connect(
        `mongodb+srv://VictorSettin:zkyqwGQXxjcMFoTD@loginsystemapi.xejs9sk.mongodb.net/LoginSystemAPI?retryWrites=true&w=majority`,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => {
        console.log("Conexão com MongoDB Atlas estabelecida!");
    })
    .catch((err) => {
        console.log("Erro ao conectar com o MongoDB Atlas:", err);
    });

// Middleware para analisar o corpo das requisições
app.use(express.json());

// Adicionando o middleware do cors
app.use(cors());

const profissionalSchema = new mongoose.Schema({
    nameestablishment: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
        type: String,
        required: true,
        select: false,
        set: (password) => bcrypt.hashSync(password, 10),
    },
    userType: { type: String },
    registrationDate: { type: Date, default: Date.now },
});

const clienteSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
        type: String,
        required: true,
        select: false,
        set: (password) => bcrypt.hashSync(password, 10),
    },
    userType: { type: String },
    registrationDate: { type: Date, default: Date.now },
});

// Modelo Profissional
const Profissional = mongoose.model("Profissional", profissionalSchema);

// Modelo Cliente
const Cliente = mongoose.model("Cliente", clienteSchema);

// Rota para criar um novo cliente
app.post("/clientes", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const cliente = new Cliente({
            username,
            email,
            password,
            userType: "client",
        });
        await cliente.save();
        res.status(200).json(cliente);
        console.log("cliente Criado com sucesso!");
    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            // código de erro para campos únicos duplicados
            const field = Object.keys(err.keyValue)[0]; // obtém o nome do campo que causou a duplicidade

            let typeInput = "";
            let errorMessage = "";

            if (field === "email") {
                typeInput = "email";
                errorMessage = "O email informado já está em uso.";
            } else if (field === "username") {
                typeInput = "username";
                errorMessage = "O nome de usuário informado já está em uso.";
            } else {
                typeInput = "unknown";
                errorMessage = "Erro ao cadastrar novo Cliente.";
            }

            res.status(400).json({ typeInput, errorMessage }); // retorna mensagem de erro com o tipo e mensagem
        } else {
            res.status(500).send("Erro ao cadastrar novo Cliente.");
        }
    }
});

// Rota para criar um novo profissional
app.post("/profissionais", async (req, res) => {
    try {
        const { username, email, password, nameestablishment } = req.body;

        const profissional = new Profissional({
            nameestablishment,
            username,
            email,
            password,
            userType: "professional",
        });
        await profissional.save();
        res.status(200).json(profissional);
        console.log("profissional Criado com sucesso!");
    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            // código de erro para campos únicos duplicados
            const field = Object.keys(err.keyValue)[0]; // obtém o nome do campo que causou a duplicidade

            let typeInput = "";
            let errorMessage = "";

            if (field === "email") {
                typeInput = "email";
                errorMessage = "O email informado já está em uso.";
            } else if (field === "username") {
                typeInput = "username";
                errorMessage = "O nome de usuário informado já está em uso.";
            } else {
                typeInput = "unknown";
                errorMessage = "Erro ao cadastrar novo Profissional.";
            }

            res.status(400).json({ typeInput, errorMessage }); // retorna mensagem de erro com o tipo e mensagem
        } else {
            res.status(500).send("Erro ao cadastrar novo Profissional.");
        }
    }
});

app.post("/loginAcess", async (req, res) => {
    console.log("Requisição de login recebida!");

    try {
        const { usernameOrEmail, password, userType } = req.body;
        console.log(usernameOrEmail, password, userType);

        // Verifica o userType e busca somente os cadastros correspondentes
        let User;
        if (userType === "professional") {
            User = Profissional;
        } else if (userType === "client") {
            User = Cliente;
        } else {
            return res.status(400).json({ message: "userType inválido" });
        }

        const usernameOrEmailRegex = new RegExp(
            `^${usernameOrEmail.trim()}$`,
            "i"
        );

        const user = await User.findOne({
            $or: [
                { username: usernameOrEmailRegex },
                { email: usernameOrEmailRegex },
            ],
            userType,
        }).select("+password");

        if (!user) {
            return res
                .status(401)
                .json({ message: "Nome de usuário ou e-mail inválido" });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: "Senha incorreta" });
        }

        res.status(200).json({
            message: "Login efetuado com sucesso!",
            user,
        });
        console.log("Login efetuado com sucesso!");
    } catch (err) {
        console.log(err);
        res.status(500).send("Erro ao efetuar login.");
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
