const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Check if MongoDB is running locally
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout for server selection
        };
        
        console.log(`Attempting to connect to MongoDB at: ${process.env.MONGODB_URI}`);
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        console.error('Please make sure MongoDB is running on your system.');
        console.error('If using Atlas, ensure your IP is whitelisted.');
        process.exit(1);
    }
};

module.exports = connectDB; 