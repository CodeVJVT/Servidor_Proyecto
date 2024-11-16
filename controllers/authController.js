const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro de usuario
exports.register = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Verifica si el usuario ya existe
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'El usuario ya existe' });

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear nuevo usuario
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (err) {
        res.status(500).json({ message: 'Error al registrar usuario', error: err.message });
    }
};

// Inicio de sesión
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Buscar usuario en la base de datos
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Credenciales incorrectas' });

        // Verificar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Credenciales incorrectas' });

        // Generar el token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'secretKey', { expiresIn: '1h' });
        res.header('auth-token', token).json({ message: 'Login exitoso', token });
    } catch (err) {
        res.status(500).json({ message: 'Error en el login', error: err.message });
    }
};
