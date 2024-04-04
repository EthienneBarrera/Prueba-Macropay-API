const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const secretKey = 'mysecretkey'; // Clave secreta para firmar y verificar los tokens JWT

app.use(bodyParser.json());

// Definir una lista de usuarios (simulando una base de datos)
let users = [
    { id: 1, name: "Ethienne Barrera", email: "ethiennebarrera@hotmail.com", password: "contraseña" },
    { id: 2, name: "Juan Perez", email: "juanperez@ehotmail.com", password: "contraseña" },
    { id: 3, name: "Jose Herrera", email: "joseh@hotmail.com", password: "contraseña" }
];

// Función para crear un nuevo usuario
function createUser(newUser) {
    users.push(newUser); // push agrega uno o mas elementos al final del array
}

// Función para leer todos los usuarios
function getUsers() {
    return users;
}

//Función para obtener un usuario por su ID
function getUserById(userId) {
    console.log(userId);
    return users.find(user => user.id === userId);
}

// Función para obtener un usuario por su correo electrónico
function getUserByEmail(email) {
    return users.find(user => user.email === email);
}

// Endpoint para registrar un nuevo usuario
app.post('/users/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).send('El nombre, el correo electrónico y la contraseña son obligatorios.');
    }

    if (getUserByEmail(email)) {
        return res.status(400).send('El correo electrónico ya está registrado.');
    }

    const newUser = {
        id: users.length + 1,
        name,
        email,
        password
    };

    createUser(newUser);
    res.status(201).send(newUser);
});

// Endpoint para iniciar sesión y generar un token JWT
app.post('/users/login', (req, res) => {
    const { email, password } = req.body;
    const user = getUserByEmail(email);

    if (!user || user.password !== password) {
        return res.status(401).send('Credenciales inválidas.');
    }

    // Generar el token JWT
    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

    res.send({ token });
});

// Middleware para verificar el token JWT en las solicitudes al CRUD
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403); // Forbidden
    }
}

// CRUD endpoints

// Endpoint para obtener todos los usuarios (solo accesible con token JWT válido)
app.get('/users', verifyToken, (req, res) => {
    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.sendStatus(403); // Forbidden
        } else {
            res.json(getUsers());
        }
    });
});

function updateUser(userId, updatedUserInfo) {
    let userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUserInfo };
    }
}

// Endpoint para editar la información de un usuario
app.put('/users/:id', verifyToken, (req, res) => {
    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.sendStatus(403); // Forbidden
        } else {
            const userId = parseInt(req.params.id);
            const { name, email } = req.body;

            if (!name || !email) {
                return res.status(400).send('El nombre y el correo electrónico son obligatorios.');
            }

            let user = getUserById(userId);
            if (!user) {
                return res.status(404).send('Usuario no encontrado.');
            }

            updateUser(userId, { name, email });
            res.status(200).send(`Usuario ${userId} actualizado correctamente.`);
        }
    });
});
// Función para eliminar un usuario
function deleteUser(userId) {
    users = users.filter(user => user.id !== userId);
}

app.delete('/users/:id', verifyToken, (req, res) => {
    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.sendStatus(403); // Forbidden
        } else {
            const userId = parseInt(req.params.id);
            let user = getUserById(userId);

            if (!user) {
                return res.status(404).send('Usuario no encontrado.');
            }

            deleteUser(userId);
            res.status(200).send(`Usuario ${userId} eliminado correctamente.`);
        }
    });
});

// Resto de endpoints CRUD (create, update, delete) se implementan de manera similar, pero con verificación de token.

// Ejemplo de uso:
console.log(getUsers());

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});