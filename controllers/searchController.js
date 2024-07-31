// controllers/searchController.js
import { Client } from '@elastic/elasticsearch';
import request from 'request';
import axios from 'axios';
import 'dotenv/config';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const search = async (req, res) => {
  const { query } = req.body;
  console.log('Received query:', query);

  const carmodelPrompt = "List 25 unique car models of various types (sedans, SUVs, trucks, electric cars, hybrids, sports cars) from different manufacturers worldwide. Exclude manufacturer names (e.g., Honda, Toyota, Ford) and separate each model name with a comma. Limit the response to exactly 25 unique models.";

  try {
    const listofmodelsResponse = await openai.chat.completions.create({
      messages: [
        {
          "role": "system",
          "content": "You are a helpful assistant who knows everything about different types of cars. You should know most to all car brands and their relevant car makes and models including other information about them including trims and specs and details."
        },
        {
          "role": "user",
          "content": carmodelPrompt
        }
      ],
      model: "gpt-4o",
    });

    const carModelsText = listofmodelsResponse.choices[0].message.content;
    const carModels = carModelsText.split(',').map(model => model.trim());

    console.log("Here are the models:", carModels);

    const allCarData = [];
    for (const model of carModels) {
      console.log("Request being sent to:", `https://api.api-ninjas.com/v1/cars?model=${model}`);
      await new Promise((resolve, reject) => {
        request.get({
          url: `https://api.api-ninjas.com/v1/cars?model=${model}`,
          headers: {
            'X-Api-Key': process.env.API_NINJAS_KEY
          },
        }, async function (error, response, body) {
          if (error) {
            console.error('Request failed:', error);
            reject(error);
          } else if (response.statusCode !== 200) {
            console.error('Error:', response.statusCode, body.toString('utf8'));
            reject(new Error(`Error: ${response.statusCode}`));
          } else {
            const carData = JSON.parse(body);
            if (Array.isArray(carData)) {
              carData.forEach(car => allCarData.push(car));
            } else {
              allCarData.push(carData);
            }
            resolve();
          }
        });
      });
    }

    const carDescriptions = [];
    for (let i = 0; i < allCarData.length; i++) {
      const descriptionPrompt = `I will provide you a JSON OBJECT for a car. Take this and create a description value which describes the car based on all other values. Make sure to include all other values in the description while keeping the description string as descriptive yet short as possible. Here is the car object: ${JSON.stringify(allCarData[i])}`;
      const descriptionResponse = await openai.chat.completions.create({
        messages: [
          {
            "role": "system",
            "content": "You are a helpful assistant who can generate descriptive text based on given car data."
          },
          {
            "role": "user",
            "content": descriptionPrompt
          }
        ],
        model: "gpt-4o",
      });

      const description = descriptionResponse.choices[0].message.content.trim();
      allCarData[i].description = description;
      carDescriptions.push(allCarData[i].description);
    }

    const pythonResponse = await axios.post('http://localhost:5005/embedDescriptions', { car_data: carDescriptions });
    for (let i = 0; i < allCarData.length; i++) {
      allCarData[i].vectorID = pythonResponse.data[i];
    }

    res.json("End of /embed endpoint. Goodbye!");

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred during the search process' });
  }
};