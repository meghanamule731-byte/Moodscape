

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");


const app = express();
const PORT = 5000;

var journalFile = path.join(__dirname, "journal.json");

var journalEntries = [];
var usersFile = path.join(__dirname, "users.json");

var users = [];

if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

if (fs.existsSync(journalFile)) {
    journalEntries = JSON.parse(fs.readFileSync(journalFile, "utf8"));
}

app.use(cors());
app.use(express.json());


// Home
app.get("/", (req, res) => {
    res.send("Moodscape Backend is Working!");
});

app.post("/signup", async (req, res) => {

    var username = req.body.username;
    var password = req.body.password;

    if (!username || !password) {
        return res.json({
            message: "Username and password are required."
        });
    }

    var existingUser = users.find(function(user) {
        return user.username == username;
    });

    if (existingUser) {
        return res.json({
            message: "Username already exists."
        });
    }

    var hashedPassword = await bcrypt.hash(password, 10);

    users.push({
        username: username,
        password: hashedPassword
    });

    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );

    res.json({
        message: "Signup successful! 🎉"
    });
});

app.post("/login", async (req, res) => {

    var username = req.body.username;
    var password = req.body.password;

    if (!username || !password) {
        return res.json({
            message: "Username and password are required."
        });
    }

    var user = users.find(function(user) {
        return user.username == username;
    });

    if (!user) {
        return res.json({
            message: "User not found."
        });
    }

    var passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        return res.json({
            message: "Incorrect password."
        });
    }

    res.json({
        message: "Login successful! 🎉",
        username: user.username
    });
});

// Mood
app.post("/mood", (req, res) => {

    var mood = req.body.mood;
    var suggestion = "";

    if (mood == "Happy") {
        suggestion = "Keep smiling and enjoy this moment! 😊";
    }
    else if (mood == "Sad") {
        suggestion = "Take some rest and talk to someone you trust. 💙";
    }
    else if (mood == "Calm") {
        suggestion = "Enjoy this peaceful moment. 😌";
    }
    else if (mood == "Angry") {
        suggestion = "Take a deep breath and give yourself some time. 🌿";
    }
    else if (mood == "Anxious") {
        suggestion = "Take slow breaths and focus on the present. 🌸";
    }
    else if (mood == "Loved") {
        suggestion = "Share your happiness with someone special. ❤️";
    }
    else if (mood == "Tired") {
        suggestion = "Take a break and get some proper rest. 😴";
    }
    else if (mood == "Excited") {
        suggestion = "Use your energy to do something creative! ✨";
    }

    res.json({
        message: "Your mood is: " + mood,
        suggestion: suggestion
    });
});


// Journal
// Journal
app.post("/journal", (req, res) => {
    
    var username=req.body.username;
    var mood = req.body.mood;
    var journal = req.body.journal;

    var entry = {
        username: username,
        mood: mood,
        journal: journal,
        date: new Date()
    };

    journalEntries.push(entry);

    fs.writeFileSync(
    journalFile,
    JSON.stringify(journalEntries, null, 2)
);

    console.log("Journal received!");
    console.log("Mood:", mood);
    console.log("Journal:", journal);

    res.json({
        message: "Journal saved successfully! 📝"
    });
});

// Get Journal History
app.get("/journal", (req, res) => {

    var username = req.query.username;

    var userEntries = journalEntries.filter(function(entry) {
        return entry.username == username;
    });

    res.json(userEntries);

});

// Get Mood Statistics
app.get("/mood-stats", (req, res) => {

    var username = req.query.username;

    var stats = {};

    journalEntries.forEach(function(entry) {

        if (entry.username == username) {

            if (stats[entry.mood]) {
                stats[entry.mood]++;
            }
            else {
                stats[entry.mood] = 1;
            }

        }

    });

    res.json(stats);

});

app.post("/analyze-mood", (req, res) => {

    var journal = req.body.journal;

    if (!journal || journal.trim() == "") {
        return res.json({
            analysis: "Please write something in your journal first ✍️"
        });
    }

    var text = journal.toLowerCase();

    var positiveWords = [
        "happy", "good", "great", "excited",
        "love", "loved", "amazing", "wonderful",
        "joy", "fun", "success", "proud"
    ];

    var negativeWords = [
        "sad", "bad", "angry", "stress",
        "stressed", "worried", "anxious",
        "tired", "lonely", "upset", "fear",
        "hate", "difficult"
    ];

    var positiveCount = 0;
    var negativeCount = 0;

    positiveWords.forEach(function(word) {
        if (text.includes(word)) {
            positiveCount++;
        }
    });

    negativeWords.forEach(function(word) {
        if (text.includes(word)) {
            negativeCount++;
        }
    });

    var mood = "";
    var suggestion = "";

    if (positiveCount > negativeCount) {
        mood = "Positive 😊";
        suggestion = "Keep enjoying the positive moments and continue doing things that make you feel good. ✨";
    }
    else if (negativeCount > positiveCount) {
        mood = "Needs Care 💙";
        suggestion = "Take some time for yourself, breathe slowly, and consider talking to someone you trust.";
    }
    else {
        mood = "Balanced 😌";
        suggestion = "Your emotions seem balanced. Keep checking in with yourself and give yourself time to reflect.";
    }

    var analysis =
        "<strong>Mood:</strong> " + mood +
        "<br><br>" +
        "<strong>Positive words:</strong> " + positiveCount +
        "<br>" +
        "<strong>Negative words:</strong> " + negativeCount +
        "<br><br>" +
        "<strong>Suggestion:</strong> " + suggestion;

    res.json({
        analysis: analysis
    });
});
// Start server
app.listen(PORT, () => {
    console.log("Server running at http://localhost:5000");
});

