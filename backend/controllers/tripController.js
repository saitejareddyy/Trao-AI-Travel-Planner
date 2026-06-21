const Trip = require('../models/Trip');

// Exponential backoff executor for external API resilience
async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const responseText = await response.text();
      console.warn(`Attempt failed with status ${response.status}: ${responseText}`);
      
      if (response.status === 429 && retries > 0) {
        console.log(`Rate limited. Waiting ${delay}ms and retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw new Error(`External API Error: Status Code ${response.status} - ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper to clean and parse JSON response from LLM, stripping markdown code block fences if present
function cleanAndParseJSON(text) {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    const match = cleanText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (match) {
      cleanText = match[1];
    }
  }
  return JSON.parse(cleanText.trim());
}

// Helper to query Gemini API (with adaptive model fallback)
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
  }

  // We can try to use gemini-2.5-flash, if it fails or rates limit, we can also try gemini-1.5-flash as fallback
  const models = [
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];

  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    try {
      console.log(`Querying model: ${model}`);
      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const parsedResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!parsedResponseText) {
        throw new Error(`Could not extract content from model ${model} response.`);
      }

      return cleanAndParseJSON(parsedResponseText);
    } catch (err) {
      console.error(`Error querying ${model}:`, err.message);
      lastError = err;
      // Continue to next model if this one fails
    }
  }

  throw lastError || new Error('All Gemini API requests failed.');
}

// Generate new itinerary
exports.generateNewTrip = async (req, res) => {
  const { destination, durationDays, budgetTier, interests, season } = req.body;
  const userId = req.user.id;

  if (!destination || !durationDays || !budgetTier) {
    return res.status(400).json({ message: 'Destination, duration, and budget tier are required' });
  }

  const travelSeason = season || 'General';
  const interestsList = (interests && interests.length > 0) ? interests.join(', ') : 'General sightseeing';

  const prompt = `
    Create a highly detailed, professional travel plan for a ${durationDays}-day trip to ${destination}.
    Budget tier preference is "${budgetTier}" (which dictates average lodging, meal, and activity costs).
    Interests of the traveler: ${interestsList}.
    The trip will take place during the season: ${travelSeason}.

    You must output ONLY a valid JSON object matching this structure EXACTLY (do not include markdown syntax outside of the JSON block):
    {
      "itinerary": [
        {
          "dayNumber": 1,
          "activities": [
            { 
              "title": "Activity name", 
              "description": "Engaging details of the activity (1-2 sentences)", 
              "estimatedCostUSD": 25, 
              "timeOfDay": "Morning" 
            }
          ]
        }
      ],
      "hotels": [
        { 
          "name": "Recommended Hotel Name", 
          "tier": "Budget Friendly | Mid Range | Luxury", 
          "estimatedCostNightUSD": 110, 
          "rating": "4.5/5" 
        }
      ],
      "estimatedBudget": {
        "transport": 120,
        "accommodation": 300,
        "food": 150,
        "activities": 100,
        "total": 670
      },
      "packingList": [
        { 
          "item": "Passport", 
          "category": "Documents", 
          "isPacked": false 
        }
      ]
    }

    Guideline rules:
    1. The itinerary array MUST have exactly ${durationDays} items, one for each day.
    2. Generate 2 to 4 activities per day (distributed across 'Morning', 'Afternoon', 'Evening').
    3. Suggest at least 3 hotels matching the destination, labeled with the correct tier.
    4. Make the estimated budget itemized sums match typical realistic costs for the destination and budget tier. The total must be the sum of accommodation, food, activities, and transport.
    5. The packingList MUST include:
       - Travel documents (category 'Documents').
       - Specific clothing matching the destination's climate during the '${travelSeason}' season (category 'Clothing').
       - Activity-specific equipment matching the activities and interests (category 'Gear').
       - General items (category 'Other').
       Generate at least 8-12 packing items total.
  `;

  try {
    const cleanResult = await callGemini(prompt);

    // Save user isolated trip directly into MongoDB
    const newTrip = new Trip({
      userId,
      destination,
      durationDays,
      budgetTier,
      interests: interests || [],
      itinerary: cleanResult.itinerary,
      hotels: cleanResult.hotels,
      estimatedBudget: cleanResult.estimatedBudget,
      packingList: cleanResult.packingList
    });

    const savedTrip = await newTrip.save();
    return res.status(201).json(savedTrip);
  } catch (error) {
    console.error("Critical AI Generation Error:", error);
    return res.status(500).json({ 
      message: "Fail-safe: API encountered an error processing your trip. Please check your credentials or try again." 
    });
  }
};

// Retrieve all trips for logged in user
exports.getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(trips);
  } catch (error) {
    console.error('Fetch trips error:', error);
    return res.status(500).json({ message: 'Error retrieving your trips' });
  }
};

// Get a single trip
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }
    return res.json(trip);
  } catch (error) {
    console.error('Fetch trip by ID error:', error);
    return res.status(500).json({ message: 'Error retrieving trip' });
  }
};

// Update general trip (used for list checks, inline activity additions etc.)
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }
    return res.json(trip);
  } catch (error) {
    console.error('Update trip error:', error);
    return res.status(500).json({ message: 'Error updating trip' });
  }
};

// Delete a trip
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }
    return res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    return res.status(500).json({ message: 'Error deleting trip' });
  }
};

// Regenerate specific day's activities
exports.regenerateDay = async (req, res) => {
  const { dayNumber, feedback } = req.body;
  const tripId = req.params.id;

  if (!dayNumber || !feedback) {
    return res.status(400).json({ message: 'Day number and feedback are required' });
  }

  try {
    const trip = await Trip.findOne({ _id: tripId, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    const currentDay = trip.itinerary.find(day => day.dayNumber === Number(dayNumber));
    if (!currentDay) {
      return res.status(404).json({ message: `Day ${dayNumber} does not exist in the itinerary` });
    }

    const prompt = `
      You are modifying Day ${dayNumber} of an existing trip itinerary to ${trip.destination}.
      The budget tier is "${trip.budgetTier}".
      
      Current Activities for Day ${dayNumber}:
      ${JSON.stringify(currentDay.activities)}

      The traveler has provided the following modification request/feedback:
      "${feedback}"

      Based on this feedback, regenerate the activities for Day ${dayNumber}.
      You must output ONLY a valid JSON object matching this structure EXACTLY (do not include markdown syntax outside the JSON block):
      {
        "dayNumber": ${dayNumber},
        "activities": [
          {
            "title": "Activity name",
            "description": "Engaging details of the activity (1-2 sentences)",
            "estimatedCostUSD": 20,
            "timeOfDay": "Morning | Afternoon | Evening"
          }
        ]
      }
      
      Ensure estimated costs reflect the target budget tier ("${trip.budgetTier}").
    `;

    const dayUpdate = await callGemini(prompt);

    // Update the specific day's activities
    trip.itinerary = trip.itinerary.map(day => {
      if (day.dayNumber === Number(dayNumber)) {
        return {
          ...day,
          activities: dayUpdate.activities
        };
      }
      return day;
    });

    // Recalculate activities cost in estimated budget
    let totalActivitiesCost = 0;
    trip.itinerary.forEach(day => {
      day.activities.forEach(act => {
        totalActivitiesCost += (act.estimatedCostUSD || 0);
      });
    });

    trip.estimatedBudget.activities = totalActivitiesCost;
    trip.estimatedBudget.total = 
      (trip.estimatedBudget.accommodation || 0) +
      (trip.estimatedBudget.food || 0) +
      (trip.estimatedBudget.transport || 0) +
      totalActivitiesCost;

    const savedTrip = await trip.save();
    return res.json(savedTrip);

  } catch (error) {
    console.error("Critical Day Regeneration Error:", error);
    return res.status(500).json({ 
      message: "Fail-safe: API encountered an error regenerating this day. Please check your credentials or try again." 
    });
  }
};
