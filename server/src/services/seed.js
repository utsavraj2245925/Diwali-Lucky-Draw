const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    const existingAdmin = await Admin.findOne({ username: adminUsername });

    if (existingAdmin) {
      console.log('Admin already exists. Skipping seed.');
      return;
    }

    const admin = new Admin({
      username: adminUsername,
      password: adminPassword
    });

    await admin.save();
    console.log(`Initial admin created: ${adminUsername}`);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

module.exports = seedAdmin;
