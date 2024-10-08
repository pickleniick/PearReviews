const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true  // Ensure email is unique
  },
  password: {
    type: String,
    required: true  // Password is required
  },
  date: {
    type: Date,
    default: Date.now  // Automatically assign the current date
  }
});

// Create the User model using the schema
const User = mongoose.model('User', userSchema);

// Export the model so it can be used in other parts of the app
module.exports = User;
