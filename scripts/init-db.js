// MongoDB Initialization Script
// Run with: mongosh < scripts/init-db.js
// Or in MongoDB Compass: Open shell and paste contents

// Switch to the database
use kore_ecommerce;

// ==============================================
// CREATE COLLECTIONS WITH VALIDATION
// ==============================================

// Users Collection
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "name"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^\\S+@\\S+\\.\\S+$",
          description: "Email must be a valid email format"
        },
        password: {
          bsonType: "string",
          minLength: 8,
          description: "Password must be at least 8 characters"
        },
        name: {
          bsonType: "string",
          minLength: 2,
          maxLength: 100,
          description: "Name must be 2-100 characters"
        },
        role: {
          bsonType: "string",
          enum: ["user", "admin"],
          description: "Role must be 'user' or 'admin'"
        },
        failedLoginAttempts: {
          bsonType: "int",
          minimum: 0,
          description: "Failed login attempts count"
        },
        lockUntil: {
          bsonType: ["date", "null"],
          description: "Account lock expiry time"
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// Create unique index on email
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

print("✅ Users collection created with indexes");

// RefreshTokens Collection
db.createCollection("refreshtokens", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "token", "family", "expiresAt"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "Reference to user"
        },
        token: {
          bsonType: "string",
          description: "JWT refresh token"
        },
        family: {
          bsonType: "string",
          description: "Token family for rotation tracking"
        },
        expiresAt: {
          bsonType: "date",
          description: "Token expiry time"
        },
        isRevoked: {
          bsonType: "bool",
          description: "Whether token is revoked"
        }
      }
    }
  }
});

// Create indexes for refresh tokens
db.refreshtokens.createIndex({ token: 1 }, { unique: true });
db.refreshtokens.createIndex({ userId: 1, isRevoked: 1 });
db.refreshtokens.createIndex({ family: 1, isRevoked: 1 });
db.refreshtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

print("✅ RefreshTokens collection created with indexes");

// Products Collection
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "description", "price", "category"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 2,
          maxLength: 200,
          description: "Product name"
        },
        description: {
          bsonType: "string",
          maxLength: 2000,
          description: "Product description"
        },
        price: {
          bsonType: "number",
          minimum: 0,
          description: "Product price"
        },
        category: {
          bsonType: "string",
          description: "Product category"
        },
        stock: {
          bsonType: "int",
          minimum: 0,
          description: "Stock quantity"
        },
        images: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "Product images URLs"
        },
        isActive: {
          bsonType: "bool",
          description: "Whether product is active"
        }
      }
    }
  }
});

// Create indexes for products
db.products.createIndex({ _id: 1, isActive: 1 });
db.products.createIndex({ category: 1, isActive: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ name: "text", description: "text" }); // Text search index

print("✅ Products collection created with indexes");

// ==============================================
// SEED DATA (Optional - for development)
// ==============================================

// Admin user (password: Admin123!)
// Note: This is a bcrypt hash - in production, use the API to create users
db.users.insertOne({
  email: "admin@kore.com",
  // Hash for "Admin123!" with bcrypt salt rounds 12
  password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aSs6p/FZLMXBJi",
  name: "Admin User",
  role: "admin",
  failedLoginAttempts: 0,
  lockUntil: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("✅ Admin user seeded (email: admin@kore.com)");

// Sample products
const categories = ["Electronics", "Clothing", "Home & Garden", "Sports", "Books"];

const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "Premium noise-canceling wireless headphones with 30-hour battery life. Features active noise cancellation, comfortable over-ear design, and crystal-clear audio quality.",
    price: 149.99,
    category: "Electronics",
    stock: 50,
    images: ["https://example.com/headphones1.jpg"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Organic Cotton T-Shirt",
    description: "Comfortable and sustainable organic cotton t-shirt. Available in multiple colors. Made from 100% certified organic cotton.",
    price: 29.99,
    category: "Clothing",
    stock: 200,
    images: ["https://example.com/tshirt1.jpg"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Smart LED Desk Lamp",
    description: "Energy-efficient LED desk lamp with adjustable brightness and color temperature. Features USB charging port and touch controls.",
    price: 59.99,
    category: "Home & Garden",
    stock: 75,
    images: ["https://example.com/lamp1.jpg"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Yoga Mat Pro",
    description: "Extra-thick professional yoga mat with non-slip surface. Includes carrying strap. Perfect for yoga, pilates, and floor exercises.",
    price: 45.00,
    category: "Sports",
    stock: 120,
    images: ["https://example.com/yogamat1.jpg"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "JavaScript: The Definitive Guide",
    description: "Comprehensive guide to JavaScript programming. Covers ES6+ features, async programming, and modern web development practices.",
    price: 49.99,
    category: "Books",
    stock: 30,
    images: ["https://example.com/jsbook1.jpg"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.products.insertMany(sampleProducts);

print("✅ Sample products seeded");

// ==============================================
// VERIFICATION
// ==============================================

print("\n📊 Database Statistics:");
print(`   Users: ${db.users.countDocuments()}`);
print(`   RefreshTokens: ${db.refreshtokens.countDocuments()}`);
print(`   Products: ${db.products.countDocuments()}`);

print("\n📑 Collection Indexes:");
print("   Users indexes:", JSON.stringify(db.users.getIndexes().map(i => i.name)));
print("   RefreshTokens indexes:", JSON.stringify(db.refreshtokens.getIndexes().map(i => i.name)));
print("   Products indexes:", JSON.stringify(db.products.getIndexes().map(i => i.name)));

print("\n✅ MongoDB initialization complete!");
print("🔗 Database: kore_ecommerce");
print("👤 Admin login: admin@kore.com / Admin123!");
