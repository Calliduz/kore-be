import mongoose from 'mongoose';
import 'dotenv/config';
import { User } from '../src/models/User.model.js';
import { Product } from '../src/models/Product.model.js';
import { Order } from '../src/models/Order.model.js';
import { RefreshToken } from '../src/models/RefreshToken.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kore_ecommerce';

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await RefreshToken.deleteMany({});
    console.log('✅ Database cleared');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      email: 'admin@kore.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
      failedLoginAttempts: 0,
    });
    console.log('✅ Admin user created (admin@kore.com / Admin123!)');

    // Create regular test user
    console.log('👤 Creating test user...');
    await User.create({
      email: 'user@test.com',
      password: 'User123!',
      name: 'Test User',
      role: 'user',
      failedLoginAttempts: 0,
    });
    console.log('✅ Test user created (user@test.com / User123!)');

    // Create sample products
    console.log('📦 Creating sample products...');
    const products = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-canceling wireless headphones with 30-hour battery life. Features active noise cancellation, comfortable over-ear design, and crystal-clear audio quality.',
        price: 149.99,
        category: 'Electronics',
        stock: 50,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
        isActive: true,
      },
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt. Available in multiple colors. Made from 100% certified organic cotton.',
        price: 29.99,
        category: 'Clothing',
        stock: 200,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
        isActive: true,
      },
      {
        name: 'Smart LED Desk Lamp',
        description: 'Energy-efficient LED desk lamp with adjustable brightness and color temperature. Features USB charging port and touch controls.',
        price: 59.99,
        category: 'Home & Garden',
        stock: 75,
        images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
        isActive: true,
      },
      {
        name: 'Yoga Mat Pro',
        description: 'Extra-thick professional yoga mat with non-slip surface. Includes carrying strap. Perfect for yoga, pilates, and floor exercises.',
        price: 45.00,
        category: 'Sports',
        stock: 120,
        images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
        isActive: true,
      },
      {
        name: 'JavaScript: The Definitive Guide',
        description: 'Comprehensive guide to JavaScript programming. Covers ES6+ features, async programming, and modern web development practices.',
        price: 49.99,
        category: 'Books',
        stock: 30,
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
        isActive: true,
      },
      {
        name: 'Mechanical Gaming Keyboard',
        description: 'RGB mechanical keyboard with Cherry MX switches. Programmable keys, dedicated media controls, and aircraft-grade aluminum frame.',
        price: 129.99,
        category: 'Electronics',
        stock: 40,
        images: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500'],
        isActive: true,
      },
      {
        name: 'Running Shoes Pro',
        description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper. Ideal for daily training and racing.',
        price: 119.99,
        category: 'Sports',
        stock: 85,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
        isActive: true,
      },
      {
        name: 'Ceramic Coffee Mug Set',
        description: 'Set of 4 handcrafted ceramic coffee mugs. Microwave and dishwasher safe. Each mug holds 12oz.',
        price: 34.99,
        category: 'Home & Garden',
        stock: 60,
        images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500'],
        isActive: true,
      },
      {
        name: 'Wireless Charging Pad',
        description: 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator.',
        price: 24.99,
        category: 'Electronics',
        stock: 150,
        images: ['https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=500'],
        isActive: true,
      },
      {
        name: 'Leather Wallet',
        description: 'Genuine leather bifold wallet with RFID blocking. Multiple card slots and ID window.',
        price: 39.99,
        category: 'Accessories',
        stock: 100,
        images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=500'],
        isActive: true,
      },
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} sample products`);

    // Create a sample order for the admin user
    console.log('📋 Creating sample order...');
    await Order.create({
      user: adminUser._id,
      orderItems: [
        {
          product: createdProducts[0]._id,
          name: createdProducts[0].name,
          qty: 1,
          price: createdProducts[0].price,
          image: createdProducts[0].images[0],
        },
        {
          product: createdProducts[1]._id,
          name: createdProducts[1].name,
          qty: 2,
          price: createdProducts[1].price,
          image: createdProducts[1].images[0],
        },
      ],
      shippingAddress: {
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
      },
      paymentMethod: 'stripe',
      taxPrice: 20.99,
      shippingPrice: 10.00,
      totalPrice: 240.96,
      isPaid: true,
      paidAt: new Date(),
      isDelivered: false,
    });
    console.log('✅ Created sample order');

    // Display summary
    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Products: ${await Product.countDocuments()}`);
    console.log(`   Orders: ${await Order.countDocuments()}`);

    console.log('\n✅ Seed completed successfully!');
    console.log('👤 Admin login: admin@kore.com / Admin123!');
    console.log('👤 User login: user@test.com / User123!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
