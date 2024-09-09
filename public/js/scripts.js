document.addEventListener('DOMContentLoaded', function () {
    // Dropdown Menu Toggle
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', function () {
            dropdownContent.classList.toggle('active');
        });
    }

    // Handle Registration
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert('Registration successful! Please log in.');
                    window.location.href = '/login'; // Redirect to the login page
                } else {
                    const errorText = await response.text();
                    alert('Registration failed: ' + errorText);
                }
            } catch (error) {
                console.error('Error registering user:', error);
            }
        });
    }

    // Handle Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    localStorage.setItem('token', result.token); // Store JWT token
                    alert('Login successful!');

                    // Redirect based on user role
                    if (result.role === 'farmer') {
                        window.location.href = '/farmers.html'; // Redirect to farmers interface
                    } else if (result.role === 'buyer') {
                        window.location.href = '/buyer-interface'; // Redirect to buyer interface
                    }
                } else {
                    const errorText = await response.text();
                    alert('Login failed: ' + errorText);
                }
            } catch (error) {
                console.error('Error logging in:', error);
            }
        });
    }

    // Handle Adding Product to Cart
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const productId = this.dataset.productId;
            const quantity = 1; // Default quantity; modify as needed
            const token = localStorage.getItem('token');

            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Include Bearer token
                    },
                    body: JSON.stringify({ product_id: productId, quantity: quantity })
                });

                if (response.ok) {
                    alert('Item added to cart');
                } else {
                    const errorText = await response.text();
                    alert('Failed to add item to cart: ' + errorText);
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
            }
        });
    });

    // Fetch and Display Products
    const productListing = document.getElementById('products');
    if (productListing) {
        fetchProducts();
    }

    async function fetchProducts() {
        try {
            const response = await fetch('/products');
            if (response.ok) {
                const products = await response.json();
                renderProducts(products);
            } else {
                console.error('Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    function renderProducts(products) {
        const productListing = document.getElementById('products');
        if (!productListing) return;

        productListing.innerHTML = ''; // Clear existing content
        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.classList.add('product');
            productElement.innerHTML = `
                <h3>${product.name}</h3>
                <img src="${product.image}" alt="${product.name}" />
                <p>${product.description}</p>
                <p>Category: ${product.category}</p>
                <p>Price: $${product.price}</p>
                <button class="add-to-cart" data-product-id="${product.id}">Add to Cart</button>
            `;
            productListing.appendChild(productElement);
        });

        // Re-attach event listeners for dynamically added buttons
        attachAddToCartListeners();
    }

    function attachAddToCartListeners() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', async function () {
                const productId = this.dataset.productId;
                const quantity = 1; // Default quantity; modify as needed
                const token = localStorage.getItem('token');

                try {
                    const response = await fetch('/cart/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ product_id: productId, quantity: quantity })
                    });

                    if (response.ok) {
                        alert('Item added to cart');
                    } else {
                        const errorText = await response.text();
                        alert('Failed to add item to cart: ' + errorText);
                    }
                } catch (error) {
                    console.error('Error adding to cart:', error);
                }
            });
        });
    }
});
