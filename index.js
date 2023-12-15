// Módulos
const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const multer = require('multer');
const repository = require('./repository');
const { User } = require("./repository");
const { Product } = require('./repository'); // Importa Product aquí

// Express
const app = express();
const port = 3000;

// Codificación y JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sirve archivos estáticos (imágenes) desde una ruta específica
app.use("/images", express.static(path.join(__dirname, "fe/images")));

// Rutas para servir páginas HTML estáticas
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'fe/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'fe/register.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'fe/admin.html'));
});

// Ruta para obtener la lista de productos desde la base de datos
app.get("/api/products", async (req, res) => {
  try {
    const products = await repository.read();
    res.send(products);
  } catch (error) {
    res.status(500).send('Error interno del servidor');
  }
});

app.post("/api/pay", async (req, res) => {
  console.log("Datos recibidos en /api/pay:", req.body);

  try {
    // Recorre la solicitud y actualiza el stock de productos
    for (const item of req.body) {
      const product = await Product.findOne({ id: item.id });

      if (product && item.quantity > 0 && product.stock >= item.quantity) {
        product.stock -= item.quantity;
        console.log(`Actualizando stock para producto ${product.id}, nuevo stock: ${product.stock}`);
        await product.save(); // Guardar el producto actualizado
      } else {
        console.log(`Producto ${product.id} sin stock suficiente.`);
      }
    }

    res.status(200).send("Pago procesado correctamente");
  } catch (error) {
    console.error("Error al procesar pago:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// Ruta para registrar un nuevo usuario
app.post("/api/register", async (req, res) => {
  const { firstname, lastname, email, password, nif, address, phone } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Ya existe un usuario con este correo electrónico.");
    }

    const newUser = new User({
      firstname,
      lastname,
      email,
      password,
      nif,
      address,
      phone,
      role: 'customer',
    });

    await newUser.save();
    res.status(201).send("Registro exitoso");
  } catch (error) {
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para autenticar al usuario
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user)   {
      if (user.password === password) {
        const message = user.role === 'admin' 
          ? "Autenticación exitosa como admin" 
          : "Autenticación exitosa como cliente";
        res.status(200).json({ success: true, message });
      } else {
        res.status(401).json({ success: false, message: "Contraseña incorrecta" });
      }
    } else {
      res.status(401).json({ success: false, message: "Cliente no registrado" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// Configuración de Multer para la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'fe/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Ruta para añadir nuevos productos a la base de datos
app.post('/api/admin/products', upload.single('imageFile'), async (req, res) => {
  try {
    const newProduct = await repository.createProduct({
      name: req.body.name,
      price: req.body.price,
      imageFile: req.file,
      stock: req.body.stock,
    });

    res.status(200).send('Producto guardado exitosamente');
  } catch (error) {
    res.status(500).send('Error interno del servidor');
  }
});

app.use("/", express.static("fe"));

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
