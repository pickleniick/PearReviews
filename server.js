const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // For password hashing
const jwt = require('jsonwebtoken');  // For JWT tokens
require('dotenv').config();  // To use .env for environment variables
const User = require('./models/User');  // Import the User model
const auth = require('./middleware/auth');
const Paper = require('./models/Paper');  // Import the Paper model
const Review = require('./models/Review');  // Import the Review model
const path = require('path');

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);  // Remove this line if you're not using it
const paperRoutes = require('./routes/papers');
const reviewRoutes = require('./routes/reviews');

app.use('/auth', authRoutes);
app.use('/papers', paperRoutes);
app.use('/reviews', reviewRoutes);



const app = express();

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection
const dbURI = 'mongodb+srv://nxlarue:pearreviews12345@pearreviewscluster.mu8nb.mongodb.net/?retryWrites=true&w=majority&appName=PearReviewsCluster';
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Registration route
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create a new user and hash the password
    user = new User({
      email,
      password: await bcrypt.hash(password, 10)  // Hash the password
    });

    await user.save();  // Save the user in the database
    res.json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare the password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Protected route to add a paper to the user's library
app.post('/library/add', auth, (req, res) => {
  // Add logic to add a paper to the user's library
  const userId = req.user;  // User ID from the JWT token
  const { paperId } = req.body;

  // Here you would typically add the paper to the user's library in the database
  res.json({ msg: `Paper ${paperId} added to the library for user ${userId}` });
});



// Route to add a paper to the user's library (protected by auth middleware)
app.post('/library/add-paper', auth, async (req, res) => {
  const { title, author, year } = req.body;

  try {
    // Create a new paper
    const newPaper = new Paper({
      title,
      author,
      year,
      addedBy: req.user  // The user ID from the JWT token
    });

    // Save the paper to the database
    await newPaper.save();

    res.json({ msg: 'Paper added to your library', paper: newPaper });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Route to get all papers in the user's library
app.get('/library', auth, async (req, res) => {
  try {
    // Find all papers added by the logged-in user
    const papers = await Paper.find({ addedBy: req.user });

    res.json(papers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Route to submit a review and rating for a paper (protected by auth middleware)
app.post('/papers/:paperId/review', auth, async (req, res) => {
  const { rating, reviewText } = req.body;

  try {
    // Create a new review
    const newReview = new Review({
      paper: req.params.paperId,
      user: req.user,  // The user ID from the JWT token
      rating,
      reviewText
    });

    // Save the review to the database
    await newReview.save();

    res.json({ msg: 'Review submitted successfully', review: newReview });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route to fetch all reviews and the average rating for a paper
app.get('/papers/:paperId/reviews', async (req, res) => {
  try {
    // Find all reviews for the given paper
    const reviews = await Review.find({ paper: req.params.paperId }).populate('user', 'email');

    // Calculate the average rating
    const totalRatings = reviews.reduce((acc, review) => acc + review.rating, 0);
    const avgRating = totalRatings / reviews.length || 0;

    res.json({
      reviews,
      averageRating: avgRating
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


app.get('/search', async (req, res) => {
  const { title, author, year } = req.query;

  try {
    // Build a search query based on the provided criteria
    let query = {};

    if (title) {
      query.title = { $regex: title, $options: 'i' };  // 'i' for case-insensitive search
    }
    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }
    if (year) {
      query.year = year;
    }

    // Search for papers that match the criteria
    const papers = await Paper.find(query);

    // Return the search results
    res.json(papers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Route to view a user's profile (protected by auth middleware)
app.get('/profile', auth, async (req, res) => {
  try {
    // Find the logged-in user's data
    const user = await User.findById(req.user).select('-password');  // Exclude password

    // Find all papers the user has added
    const papers = await Paper.find({ addedBy: req.user });

    // Find all reviews the user has written
    const reviews = await Review.find({ user: req.user });

    res.json({
      user,
      papers,
      reviews
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});




// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route to serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
