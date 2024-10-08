const mongoose = require('mongoose');

// Define the Paper schema
const paperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Create and export the Paper model
const Paper = mongoose.model('Paper', paperSchema);
module.exports = Paper;
