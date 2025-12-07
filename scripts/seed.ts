import mongoose from 'mongoose';
import 'dotenv/config';
import { User } from '../src/models/User.model.js';
import { Product } from '../src/models/Product.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kore_ecommerce';

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create admin user (password will be hashed by User model pre-save hook)
    console.log('👤 Creating admin user...');
    await User.create({
      email: 'admin@kore.com',
      password: 'Admin123!',  // Plain password - will be hashed by pre-save hook
      name: 'Admin User',
      role: 'admin',
      failedLoginAttempts: 0,
    });
    console.log('✅ Admin user created (admin@kore.com / Admin123!)');

    // Create sample products
    console.log('📦 Creating sample products...');
    const products = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-canceling wireless headphones with 30-hour battery life. Features active noise cancellation, comfortable over-ear design, and crystal-clear audio quality.',
        price: 149.99,
        category: 'Electronics',
        stock: 50,
        images: ['https://example.com/headphones1.jpg'],
        isActive: true,
      },
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt. Available in multiple colors. Made from 100% certified organic cotton.',
        price: 29.99,
        category: 'Clothing',
        stock: 200,
        images: ['https://example.com/tshirt1.jpg'],
        isActive: true,
      },
      {
        name: 'Smart LED Desk Lamp',
        description: 'Energy-efficient LED desk lamp with adjustable brightness and color temperature. Features USB charging port and touch controls.',
        price: 59.99,
        category: 'Home & Garden',
        stock: 75,
        images: ['https://example.com/lamp1.jpg'],
        isActive: true,
      },
      {
        name: 'Yoga Mat Pro',
        description: 'Extra-thick professional yoga mat with non-slip surface. Includes carrying strap. Perfect for yoga, pilates, and floor exercises.',
        price: 45.00,
        category: 'Sports',
        stock: 120,
        images: ['https://example.com/yogamat1.jpg'],
        isActive: true,
      },
      {
        name: 'JavaScript: The Definitive Guide',
        description: 'Comprehensive guide to JavaScript programming. Covers ES6+ features, async programming, and modern web development practices.',
        price: 49.99,
        category: 'Books',
        stock: 30,
        images: ['https://example.com/jsbook1.jpg'],
        isActive: true,
      },
    ];

    await Product.insertMany(products);
    console.log(`✅ Created ${products.length} sample products`);

    // Display summary
    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Products: ${await Product.countDocuments()}`);

    console.log('\n✅ Seed completed successfully!');
    console.log('👤 Admin login: admin@kore.com / Admin123!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
