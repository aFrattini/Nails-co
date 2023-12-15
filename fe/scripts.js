// Variables globales para almacenar la lista de productos, el carrito y el total
let productList = [];
let carrito = [];
let total = 0;
let productIds = []; // Agrega esta línea para definir productIds



// Añade un producto al carrito de compras y actualiza el total.
function add(productId, price) {
    console.log("Añadiendo producto con ID: ", productId);
    const product = productList.find(p => p.id === productId);
    if (product && product.stock > 0) {
        product.stock--;
        // Almacenar objeto del producto en lugar del solo ID
        carrito.push({ ...product, quantity: 1 }); // Asumiendo que quieres 1 cantidad por defecto
        // Añadir el ID del producto al array de IDs de productos
        productIds.push({ id: productId, quantity: 1 });
        total += price;
        document.getElementById("checkout").innerHTML = `Pagar $${total}`;
        displayProducts();
        saveCart(); // Guardar el estado actual del carrito en localStorage
        console.log("Carrito después de añadir producto: ", carrito);
        console.log("productsIds despues de añadir productos", productIds);


    } else {
        console.log("Producto no encontrado o sin stock.");
    }

    if (product && product.stock === 0) {
        const productButton = document.querySelector(`[data-product-id="${productId}"]`);
        if (productButton) {
            productButton.disabled = true;
            productButton.textContent = "Sin stock";
        }
    }
    // Guardar el carrito en localStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));
    localStorage.setItem('productIds', JSON.stringify(productIds));
    console.log("IDs de productos en el carrito: ", productIds); // Agrega esta línea
}




// Guardar carrito en localStorage
function saveCart() {
    console.log("Guardando carrito en localStorage");
    localStorage.setItem('carrito', JSON.stringify(carrito));
    localStorage.setItem('total', total);
}

// Cargar carrito desde localStorage
function loadCart() {
    console.log("Cargando carrito desde localStorage");
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    total = parseFloat(localStorage.getItem('total')) || 0;
    console.log("Carrito cargado: ", carrito);
}

//Abre pagina del carrito
async function pay() {
    window.location.href = 'cart.html';
}


// Cargar carrito al cargar la página
window.onload = () => {
    if (window.location.pathname.endsWith('/cart.html')) {
        loadCart();
        loadCartDetails();
    } else if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) {
        loadCart();
        fetchProducts();
    }
};


function loadCartDetails() {
    // Carga el carrito y la lista de productos desde localStorage
    const storedCart = JSON.parse(localStorage.getItem('carrito')) || [];
    const storedProductList = JSON.parse(localStorage.getItem('productList')) || [];
    const productIds = JSON.parse(localStorage.getItem('productIds')) || [];
    console.log("products", productIds);

    // Obtener los contenedores del DOM donde mostraremos los productos
    const cartItemsContainer = document.getElementById('cartItems');
    const totalContainer = document.getElementById('total');

    // Limpia el contenido actual
    cartItemsContainer.innerHTML = '';
    totalContainer.textContent = `Total: $${total}`;

    // Verificam que el carrito no esté vacío
    if (storedCart.length === 0) {
        cartItemsContainer.innerHTML = 'No hay productos en el carrito.';
        return;
    }

    // Crea un objeto para agrupar productos por ID y llevar un registro de la cantidad
    const groupedProducts = {};

    // Recorre el carrito y agrupa los productos
    storedCart.forEach(cartItem => {
        const productId = cartItem.id;
        if (!groupedProducts[productId]) {
            groupedProducts[productId] = { product: cartItem, quantity: 1 };
        } else {
            groupedProducts[productId].quantity++;
        }
    });

    // Recorre los productos agrupados y los mouestra
    Object.values(groupedProducts).forEach(groupedProduct => {
        const { product, quantity } = groupedProduct;
        const itemHtml = `
            <div class="cart-item">
                <span>${product.name} - Cantidad: ${quantity}</span>
                <span>$${product.price * quantity}</span>
                <!-- Añade aquí más detalles si es necesario -->
            </div>`;
        cartItemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    });

    // Actualiza el total
    const cartTotal = Object.values(groupedProducts).reduce((acc, groupedProduct) => {
        const { product, quantity } = groupedProduct;
        return acc + product.price * quantity;
    }, 0);
    totalContainer.textContent = `Total: $${cartTotal}`;
}

//Verifica usuario registrado
async function verifyUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("/api/login", {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const responseData = await response.json();
        if (response.ok && responseData.success) {
            // Elimina el formulario de inicio de sesión
            document.querySelector('.login-form').remove();
            // Si el usuario es válido, procede con la compra
            processPurchase();
        } else {
            alert("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
        }
    } catch (error) {
        alert("Error al iniciar sesión: " + error.message);
    }
}

//Procesa la compra
async function processPurchase() {
    try {
        // Cargar productIds desde el localStorage
        const productIds = JSON.parse(localStorage.getItem('productIds')) || [];

        console.log("Enviando al backend los siguientes IDs de productos:", productIds);

        const response = await fetch("/api/pay", {
            method: "post",
            body: JSON.stringify(productIds),
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            carrito = []; 
            total = 0; 
            localStorage.setItem('carrito', JSON.stringify(carrito));
            localStorage.setItem('total', total.toString());

            alert("Compra finalizada con éxito.");
            // Redirigimos al usuario o recargamos la página
            window.location.href = 'index.html';
        } else {
            alert("Hubo un problema al procesar la compra.");
        }
    } catch (error) {
        alert(`Error al intentar pagar: ${error.message}`);
    }
}



//Envía un nuevo producto al servidor para ser guardado.
async function submitNewProduct() {
    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('imageFile', document.getElementById('productImage').files[0]);
    formData.append('stock', document.getElementById('productStock').value);

    try {
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            body: formData,
        });

        // Verifica si la respuesta del servidor es exitosa
        if (response.ok) {
            // Oculta el formulario y muestra el mensaje de éxito
            document.getElementById("productForm").style.display = "none";
            document.getElementById("productSuccessMessage").style.display = "block";
        } else {
            // Si la respuesta del servidor no es exitosa, muestra un mensaje de error
            const errorText = await response.text();
            console.error('Error en la respuesta del servidor:', errorText);
            alert("Error al guardar el producto: " + errorText);
        }
    } catch (error) {
        // Maneja cualquier error que ocurra durante la solicitud fetch
        console.error('Error al realizar la solicitud:', error);
        alert("Error al guardar el producto. Revisa la consola para más detalles.");
    }
}



// Funciones para redirigir al usuario a diferentes páginas
function redirectToHome() { window.location.href = "/"; }
function redirectToLogin() { window.location.href = '/login'; }
function redirectToRegister() { window.location.href = '/register'; }
function redirectToAdmin() { window.location.href = '/admin'; }


//Muestra los productos en la página.
function displayProducts(products) {
    if (!products || products.length === 0) {
        return;
    }

    let productsHTML = '';
    productList = products;

    products.forEach(p => {
        let buttonHTML = p.stock === 0
            ? `<button disabled class="button-add disabled">Sin stock</button>`
            : `<button class="button-add" onclick="add(${p.id}, ${p.price})">Agregar</button>`;

        productsHTML += `
            <div class="product-container">
                <h3>${p.name}</h3>
                <img src="${p.image}" />
                <h1>$${p.price}</h1>
                ${buttonHTML}
            </div>`;
    });

    document.getElementById('page-content').innerHTML = productsHTML;
}

//Login
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const responseData = await response.json();

        if (response.ok && responseData.success) {
            if (responseData.message.includes('admin')) {
                // Redirige a la página de administrador si el role es Admin
                window.location.href = "/admin.html";
            } else {
                // Muestra mensaje de inicio de sesión exitoso para clientes si el role es Customer
                document.getElementById("loginSuccessMessage").style.display = "block";
                const loginsignupContainer = document.querySelector(".loginsignup-container");
                if (loginsignupContainer) {
                    loginsignupContainer.style.display = "none";
                }
            }
        } else if (response.status === 401) {
            if (responseData.message === 'Contraseña incorrecta') {
                // Mostrar mensaje de contraseña incorrecta
                alert("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
                window.location.reload();
            } else {
                // Mostrar mensaje de cliente no registrado
                document.getElementById("loginFailedMessage").style.display = "block";
            }
        } else {
            alert("Error inesperado al intentar iniciar sesión. Por favor, inténtalo de nuevo.");
        }

        // Ocultar el formulario en todos los casos
        const loginsignupContainer = document.querySelector(".loginsignup-container");
        if (loginsignupContainer) {
            loginsignupContainer.style.display = "none";
        }
    } catch (error) {
        alert(`Error al intentar iniciar sesión: ${error.message}`);
    }
}


//Registra un nuevo usuario.
async function register() {
    const formData = {
        firstname: document.getElementById("firstname").value,
        lastname: document.getElementById("lastname").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        nif: document.getElementById("nif").value,
        address: document.getElementById("address").value,
        phone: document.getElementById("phone").value,
    };

    if (Object.values(formData).some(value => !value)) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            document.getElementById("successMessage").style.display = "block";
            const loginsignupContainer = document.querySelector(".loginsignup-container");
            if (loginsignupContainer) {
                loginsignupContainer.style.display = "none"; // Ocultar el contenedor del formulario
            }
        } else {
            // En caso de respuesta no exitosa, mostrar un mensaje al usuario
            const errorText = await response.text();
            console.error('Error en la respuesta:', errorText);
            alert("Error al registrar usuario. Por favor, inténtelo de nuevo.");
        }
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
        alert("Error al registrar usuario. Revisa la consola para más detalles.");
    }
}



//Carga los productos al cargar la página solo si es la Home
window.onload = async () => {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        await fetchProducts();
    }
};

//Obtiene la lista de productos del servidor y los guarda en localStorage.
async function fetchProducts() {
    try {
        const response = await fetch("/api/products");
        const products = await response.json();
        productList = products; // Asegúrate de que esta es la lista global
        localStorage.setItem('productList', JSON.stringify(productList)); // Almacenar en localStorage
        console.log("Productos cargados desde el servidor y guardados en localStorage:", productList);
        displayProducts(productList);
    } catch (error) {
        console.error("Error al obtener productos:", error);
    }
}