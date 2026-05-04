require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// CONFIGURATION - PUT YOUR DATA HERE
const API_KEY = process.env.API_KEY; 
const LOCATION_ID = '1'; // e.g., 1 = England

app.use(express.json());
app.use(express.static('public')); // Serves the HTML file

app.get('/api/scores', async (req, res) => {
    const teamName = req.query.team;

    if (!teamName) {
        return res.status(400).json({ error: "Please provide a team name." });
    }

    try {
        // 1. Get list of all teams to find the ID of the team you typed
        const teamsUrl = `https://v3.football.api-sports.io/teams?team_name=${encodeURIComponent(teamName)}&limit=2&apikey=${API_KEY}`;
        const teamsRes = await axios.get(teamsUrl);

        if (teamsRes.data.teams.length === 0) {
            return res.json({ error: "Team not found. Try spelling it exactly (e.g., 'Man Utd' not 'Manchester Utd')", suggestions: [] });
        }

        const teamId = teamsRes.data.teams[0].id;

        // 2. Fetch the scores/standings for that specific team
        const scoresUrl = `https://v3.football.api-sports.io/fixtures?teams=${teamId}&tournament=${LOCATION_ID}&from=${new Date().setDate(new Date().getDate() - 1)}&to=${new Date().setDate(new Date().getDate() + 1)}&apikey=${API_KEY}`;
        
        // Note: API-Football free tier might return historical fixtures. 
        // We will filter for games where the team played today/yesterday.
        const scoresRes = await axios.get(scoresUrl);

        const today = new Date().toISOString().split('T')[0];
        
        // Filter logic to show recent games
        const recentFixtures = scoresRes.data.response.filter(fix => {
            const fixDate = new Date(fix.date).toISOString().split('T')[0];
            return fixDate === today || fixDate === new Date().toISOString().split('T')[0]; 
            // Note: The API returns dates as strings, comparison might need adjustment depending on API version
        });

        res.json({
            team: teamName,
            scores: recentFixtures
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error. Check your API Key." });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

