const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: 50,
    max: 300
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: 20,
    max: 500
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 10,
    max: 120
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female']
  },
  activityLevel: {
    type: String,
    required: [true, 'Activity level is required'],
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },
  dailyCalorieGoal: {
    type: Number,
    default: 2000
  },
  bmr: {
    type: Number,
    default: 0
  },
  tdee: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate BMR using Mifflin-St Jeor Equation
userSchema.methods.calculateBMR = function() {
  if (this.gender === 'male') {
    return Math.round(10 * this.weight + 6.25 * this.height - 5 * this.age + 5);
  } else {
    return Math.round(10 * this.weight + 6.25 * this.height - 5 * this.age - 161);
  }
};

// Calculate TDEE based on activity level
userSchema.methods.calculateTDEE = function() {
  const bmr = this.calculateBMR();
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  return Math.round(bmr * (activityMultipliers[this.activityLevel] || 1.55));
};

// Auto-calculate BMR and TDEE before saving
userSchema.pre('save', function(next) {
  if (this.isModified('weight') || this.isModified('height') || this.isModified('age') || this.isModified('gender') || this.isModified('activityLevel')) {
    this.bmr = this.calculateBMR();
    this.tdee = this.calculateTDEE();
    if (!this.dailyCalorieGoal || this.dailyCalorieGoal === 2000) {
      this.dailyCalorieGoal = this.tdee;
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
