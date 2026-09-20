/**
 * Comprehensive JavaScript Feature Demonstration
 * Concepts: OOP (Classes), Async/Await, Array Methods, Closures, Maps/Sets, Error Handling
 */

// 1. UNIQUE IDENTIFIER UTILITY (Closure & Generator concept)
const idGenerator = (() => {
    let count = 1000;
    return () => `PROD-${++count}`;
})();

// 2. CUSTOM ERROR CLASSES (Robust error management)
class InventoryError extends Error {
    constructor(message) {
        super(message);
        this.name = "InventoryError";
    }
}

// 3. PRODUCT CLASS (Object-Oriented Programming)
class Product {
    #id; // Private field
    #price;

    constructor(name, price, stock, category) {
        this.#id = idGenerator();
        this.name = name;
        this.#price = price;
        this.stock = stock;
        this.category = category;
    }

    get id() { return this.#id; }
    get price() { return this.#price; }

    // Setter with integrated data validation
    set price(newPrice) {
        if (newPrice < 0) throw new Error("Price cannot be negative.");
        this.#price = newPrice;
    }

    applyDiscount(percentage) {
        this.#price -= (this.#price * (percentage / 100));
    }
}

// 4. INVENTORY MANAGEMENT SYSTEM
class StoreInventory {
    constructor() {
        this.products = new Map(); // Fast lookups using Map
        this.categories = new Set(); // Track unique categories
    }

    addProduct(product) {
        this.products.set(product.id, product);
        this.categories.add(product.category);
    }

    // Advanced Array Methods (Filter, Map, Reduce)
    getProductsByCategory(category) {
        return Array.from(this.products.values())
            .filter(product => product.category.toLowerCase() === category.toLowerCase());
    }

    calculateTotalInventoryValue() {
        return Array.from(this.products.values())
            .reduce((total, prod) => total + (prod.price * prod.stock), 0);
    }

    // Asynchronous Mock Operation (Simulating a database fetch via Promise)
    fetchSupplierRestock(productId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.products.has(productId)) {
                    resolve({ id: productId, status: "SUCCESS", amount: 10 });
                } else {
                    reject(new InventoryError(`Product ${productId} not found for restocking.`));
                }
            }, 1500); // 1.5-second simulated latency
        });
    }
}

// 5. ORDER PROCESSING ENGINE (Async / Await and Event Simulation)
class OrderEngine {
    constructor(inventory) {
        this.inventory = inventory;
        this.orderHistory = [];
    }

    // Async pipeline managing order fulfillment
    async processOrder(customer, cartItems) {
        console.log(`\n⏳ Initializing order processing for ${customer}...`);
        
        try {
            let orderTotal = 0;
            const processedItems = [];

            // Iterating and validating cart items
            for (const item of cartItems) {
                const product = this.inventory.products.get(item.id);

                if (!product) {
                    throw new InventoryError(`Item ${item.id} does not exist in inventory.`);
                }

                if (product.stock < item.quantity) {
                    throw new InventoryError(`Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}`);
                }

                // Mutate state safely
                product.stock -= item.quantity;
                orderTotal += product.price * item.quantity;
                processedItems.push({ name: product.name, qty: item.quantity });
            }

            // Destructuring and rest parameters demo
            const orderReceipt = {
                orderId: Math.random().toString(36).substring(2, 9).toUpperCase(),
                customer,
                items: [...processedItems],
                total: parseFloat(orderTotal.toFixed(2)),
                timestamp: new Date().toISOString()
            };

            this.orderHistory.push(orderReceipt);
            return orderReceipt;

        } catch (error) {
            console.error(`❌ Order Failed: ${error.message}`);
            throw error; // Re-throw for downstream handling
        }
    }
}

// ==========================================
// INTERACTIVE EXECUTION & TESTING ENGINE
// ==========================================
async function runDemo() {
    console.log("=== STARTING JAVASCRIPT ENGINE DEMO ===");

    // Initialize Inventory
    const store = new StoreInventory();
    
    // Instantiate Products
    const laptop = new Product("Pro Laptop", 1299.99, 15, "Electronics");
    const mouse = new Product("Wireless Mouse", 49.99, 50, "Electronics");
    const chair = new Product("Ergonomic Chair", 249.50, 5, "Furniture");
    
    store.addProduct(laptop);
    store.addProduct(mouse);
    store.addProduct(chair);

    // Apply holiday discount to Furniture
    console.log(`\n🏷️ Applying 10% holiday discount to the ${chair.name}...`);
    chair.applyDiscount(10);

    // Calculate business metrics using Array helpers
    console.log(`📊 Total Unique Product Categories: ${store.categories.size}`);
    console.log(`💰 Total Stock valuation: $${store.calculateTotalInventoryValue().toFixed(2)}`);

    // Setup Order Process Engine
    const shopEngine = new OrderEngine(store);

    // Scenario A: Successful Order using Async/Await
    const customerCart = [
        { id: laptop.id, quantity: 2 },
        { id: mouse.id, quantity: 1 }
    ];

    try {
        const receipt = await shopEngine.processOrder("Alice Smith", customerCart);
        console.log("✅ Order Successful! Receipt Summary:", receipt);
    } catch (err) {
        // Handled internally, but caught here if thrown out
    }

    // Scenario B: Expected Failure (Out of stock trigger)
    const badCart = [
        { id: chair.id, quantity: 10 } // Only 5 available
    ];
    
    try {
        await shopEngine.processOrder("Bob Jones", badCart);
    } catch (err) {
        console.log("💡 Graceful Error Catch: Order sequence caught the stock issue properly.");
    }

    // Scenario C: Handling Async Promises with .then() / .catch()
    console.log(`\n🔄 Testing remote background supplier restock for item: ${laptop.id}...`);
    store.fetchSupplierRestock(laptop.id)
        .then(result => {
            console.log(`📦 Background Restock Complete! Result:`, result);
            store.products.get(result.id).stock += result.amount;
            console.log(`📈 New stock level for ${store.products.get(result.id).name}: ${store.products.get(result.id).stock}`);
            console.log("\n=== DEMO SEQUENCE FINISHED SUCCESSFULLY ===");
        })
        .catch(error => console.error("Restock failed:", error));
}

// Execute the application
runDemo();
