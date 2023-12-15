const mongoose = require('mongoose');

// Establece el modo de depuración de Mongoose
mongoose.set('debug', true);

// Establece la conexión con MongoDB utilizando Mongoose
mongoose.connect('mongodb+srv://antonellafrattini:YtoHwp2zCrujVzKg@nails-co.uckzz2w.mongodb.net/nails_co', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conexión exitosa a MongoDB')) // Mensaje de éxito al conectar
  .catch(error => console.error('Error al conectar a MongoDB:', error)); // Manejo de errores de conexión

// Define el esquema de datos para los productos
const ProductSchema = new mongoose.Schema({
  id: Number,
  name: String,
  price: Number,
  image: String,
  stock: Number,
});

// Define el esquema de datos para los usuarios
const UserSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  nif: String,
  address: String,
  phone: String,
  role: { type: String, default: 'customer' }, // 'customer' o 'admin'
});

// Crea modelos de Mongoose para Productos y Usuarios
const Product = mongoose.model('Product', ProductSchema);
const User = mongoose.model('User', UserSchema);

// Leer productos de la base de datos
async function read() {
  try {
    const products = await Product.find();
    return products;
  } catch (error) {
    console.error('Error al leer productos desde MongoDB:', error);
    throw error; // Lanza el error para manejo externo
  }
}

// Escribir o actualizar productos en la base de datos
async function write(products) {
  try {
    await Product.deleteMany({}); // Elimina todos los productos existentes
    await Product.insertMany(products); // Inserta los nuevos productos
  } catch (error) {
    console.error('Error al escribir productos en MongoDB:', error);
    throw error; // Lanza el error para manejo externo
  }
}

// Crea un nuevo producto en la base de datos
async function createProduct(product) {
  try {
    const { name, price, imageFile, stock } = product;
    const filename = `images/${imageFile.filename}`; // Construye la ruta del archivo de imagen

    // Crea un nuevo producto con los datos proporcionados
    const newProduct = new Product({
      name,
      price,
      image: filename,
      stock,
    });
    
    await newProduct.save(); // Guarda el producto en la base de datos
    return newProduct; // Retorna el producto creado
  } catch (error) {
    console.error('Error al crear nuevo producto:', error);
    throw error; // Lanza el error para manejo externo
  }
}

// Exporta las funciones y modelos para ser utilizados en otros archivos
module.exports = {
  read,
  write,
  User,
  Product,
  createProduct
};
