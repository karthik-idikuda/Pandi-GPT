const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is loaded to read from .env file

const connectDB = async () => {
  try {
    // Read the DB_URI from environment variables
    const dbURI = process.env.DB_URI;
    if (!dbURI) {
      console.error('❌ Error: Database URI (DB_URI) is not defined in the .env file.');
      process.exit(1); // Exit if the database URI is missing
    }

    // Connect to MongoDB with options for better compatibility
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);

    // Provide a stack trace in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }

    process.exit(1); // Exit with failure if unable to connect
  }
};

// Listen to MongoDB connection events (optional, for better debugging)
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose is connected to the database.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('ℹ️ Mongoose connection is disconnected.');
});

// Optional: Close the connection when the application exits
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('ℹ️ Mongoose connection is closed due to app termination.');
  process.exit(0);
});

module.exports = connectDB;
