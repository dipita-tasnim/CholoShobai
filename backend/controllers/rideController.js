const Ride = require('../models/rideModel');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Get all rides
//Serach ride
const getRides = async (req, res) => {
  try {
    const { from, to, date, time, preference } = req.query;
    const query = {};

    // Use regex for text-based fields
    if (from) query.startingPoint = { $regex: from, $options: 'i' };
    if (to) query.destination = { $regex: to, $options: 'i' };
    
    // Handle preference with special case for "Both"
    if (preference) {
      if (preference === "Both") {
        // Search for either "Both" or "Male, Female"
        query.preference = { 
          $in: [
            { $regex: "Both", $options: 'i' },
            { $regex: "Male, Female", $options: 'i' }
          ]
        };
      } else {
        // For Male or Female, use exact case-insensitive match
        query.preference = { $regex: `^${preference}$`, $options: 'i' };
      }
    }

    // Handle date format variations
    if (date) {
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = dateObj.toLocaleString('en-US', { month: 'long' });
      
      // Create a regex pattern that matches the day and month but is flexible with the year
      const datePattern = new RegExp(`^${day} ${month}, \\d{4}$`, 'i');
      query.date = datePattern;
    }

    // Handle time format variations
    if (time) {
      // Use direct matching for time since it's already in the correct format
      query.time = time;
    }

    const rides = await Ride.find(query)
      .populate('user_id', 'fullname.firstname fullname.lastname email')
      .sort({ createdAt: -1 });

    res.status(200).json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
};

// Get a single ride (with joined users populated)
const getRide = async (req, res) => {
  const { id } = req.params;

  try {
    const ride = await Ride.findById(id)
      .populate('user_id', 'fullname email')
      .populate({
        path: 'joinedUserIds.user',
        select: 'fullname email'
      });
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
  
    const responseData = {
      ...ride.toObject(),
      user_id: ride.user_id,
      joinedUserIds: ride.joinedUserIds || []
    };
  
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ride info' });
  }
};

// Get rides created by the logged-in user
const getMyRides = async (req, res) => {
  try {
    const userId = req.user._id;
    const rides = await Ride.find({ user_id: userId })
      .populate('user_id', 'fullname.firstname fullname.lastname email')
      .populate('joinedUserIds.user', 'fullname.firstname fullname.lastname email')
      .sort({ createdAt: -1 });

    res.status(200).json(rides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your rides' });
  }
};

// Create a new ride
const createRide = async (req, res) => {
  const { startingPoint, destination, date, time, availableSlots, preference } = req.body;

  try {
    const ride = await Ride.create({
      startingPoint,
      destination,
      date,
      time,
      availableSlots,
      preference,
      user_id: req.user._id
    });

    res.status(201).json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a ride
const deleteRide = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Invalid ride ID' });
  }

  const ride = await Ride.findOneAndDelete({ _id: id, user_id: req.user._id });

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found or unauthorized' });
  }

  res.status(200).json({ message: 'Ride deleted successfully', ride });
};

// Update a ride
const updateRide = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Invalid ride ID' });
  }

  const ride = await Ride.findOneAndUpdate(
    { _id: id, user_id: req.user._id },
    req.body,
    { new: true }
  );

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found or unauthorized' });
  }

  res.status(200).json(ride);
};

// Update ride status (open, closed)
const updateRideStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: id, user_id: req.user._id },
      { status },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found or unauthorized' });
    }

    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const joinRide = async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Ensure joinedUserIds is an array
    if (!ride.joinedUserIds) {
      ride.joinedUserIds = [];
    }

    // Check if user has already joined
    const existingJoinIndex = ride.joinedUserIds.findIndex(
      (entry) => entry.user.toString() === userId.toString()
    );
    
    if (existingJoinIndex !== -1) {
      // User is leaving the ride
      ride.joinedUserIds.splice(existingJoinIndex, 1);
    } else {
      // User is joining the ride
      ride.joinedUserIds.push({ 
        user: userId, 
        status: "pending" 
      });
    }

    // Save the ride
    const savedRide = await ride.save();

    // Populate the user data before sending response
    const populatedRide = await Ride.findById(savedRide._id)
      .populate('user_id', 'fullname email')
      .populate({
        path: 'joinedUserIds.user',
        select: 'fullname email'
      });

    res.status(200).json({ 
      message: existingJoinIndex !== -1 ? "Successfully left ride" : "Successfully joined ride", 
      ride: populatedRide 
    });
  } catch (err) {
    console.error('Join ride error:', err);
    res.status(500).json({ message: "Server error" });
  }
};


// Update joined user's status (confirm/cancel)
const updateJoinedUserStatus = async (req, res) => {
  const { id: rideId, userId } = req.params;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const joinedUser = ride.joinedUserIds.find(entry =>
      entry.user.toString() === userId
    );

    if (!joinedUser) {
      return res.status(404).json({ error: 'User not found in joined list' });
    }

    joinedUser.status = status;
    await ride.save();

    const populatedRide = await ride.populate('joinedUserIds.user', 'fullname.firstname fullname.lastname email');

    res.status(200).json(populatedRide);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update joined user status' });
  }
};

module.exports = {
  getRides,
  getRide,
  createRide,
  deleteRide,
  updateRide,
  getMyRides,
  updateRideStatus,
  joinRide,
  updateJoinedUserStatus
};


