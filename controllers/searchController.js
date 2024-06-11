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
  console.log('Received query:', query); // Log the received query to the console

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

    // Store all car data
    const allCarData = [];
    let temp = 0;
    for (const model of carModels) {
      console.log(temp);
      temp++;
      console.log("request being sent to :", `https://api.api-ninjas.com/v1/cars?model=${model}`);
      await new Promise((resolve, reject) => {
        request.get({
          url: `https://api.api-ninjas.com/v1/cars?model=${model}`,
          headers: {
            'X-Api-Key': 'wHRbXCNuHiknJSdBNdGFmA==kJMxyCDTb0O5HcJp'
          },
        }, async function (error, response, body) {
          if (error) {
            console.error('Request failed:', error);
            reject(error);
          } else if (response.statusCode != 200) {
            console.error('Error:', response.statusCode, body.toString('utf8'));
            reject(new Error(`Error: ${response.statusCode}`));
          } else {
            const carData = JSON.parse(body);
            if (Array.isArray(carData)) {
              carData.forEach(car => allCarData.push(car));
            } else {
              allCarData.push(carData); // Push directly if carData is not an array
            }
            resolve();
          }
        });
      });
    }

    for (let i = 0; i < allCarData.length; i++) {
      console.log(i, allCarData[i]);
    }
    console.log("Entering try catch")

    const carDescriptions = [];

    try {
      // Generate descriptions for all car data
      for (let i = 0; i < allCarData.length; i++) {
        console.log("Breaking on this iteration: " + i);

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

      console.log("ABOUT TO SEND REQUEST TO EMBEDDING SERVICE");

      // Send car descriptions to the Python service for embedding
      const pythonResponse = await axios.post('http://localhost:5005/embed', { car_data: carDescriptions });

      console.log("Request sent successfully to python service");

      res.json("End of /embed endpoint. Goodbye!");

    } catch (pythonError) {
      console.error('Error communicating with Python service:', pythonError);
      res.status(500).json({ error: 'Failed to fetch embeddings from Python service' });
    }
  } catch (error) {
    console.error('Error getting car models from OpenAI:', error);
    res.status(500).json({ error: 'Failed to get car models from OpenAI' });
  }
};
