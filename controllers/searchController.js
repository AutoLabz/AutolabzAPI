import { Client } from '@elastic/elasticsearch';
import request from 'request';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const search = async (req, res) => {

  const { query } = req.body;
  console.log('Received query:', query); // Log the received query to the console

  request.get({
    url: 'https://api.api-ninjas.com/v1/cars?model=' + query,
    headers: {
      'X-Api-Key': 'wHRbXCNuHiknJSdBNdGFmA==kJMxyCDTb0O5HcJp'
    },
  }, async function(error, response, body) {
    if(error) return console.error('Request failed:', error);
    else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
    else {
      //console.log(body) 

      // Assume body is a JSON string and parse it
      const carData = JSON.parse(body);
      const carDescriptions = []

      //console.log(carData)

      /**
       *  const prompt = {
        prompt: `I will provide you a JSON OBJECT for a car. Take this and create a description value which describes the car based on all other values. Make sure to include all other values in the description while keeping the description string as descriptive yet short as possible. Here is the car object: ${JSON.stringify(carData)}`,
        max_tokens: 150
      };
       */
     

      //const prompt2 = "I will provide you a JSON OBJECT for a car. Take this and create a description value which describes the car based on all other values. Make sure to include all other values in the description while keeping the description string as descriptive yet short as possible. Here is the car object:"

      
     //console.log(text);
      
      
      try {

        const descriptions = [];
        // Iterate through carData and construct prompts
        for (const car of carData) {
          const prompt = `I will provide you a JSON OBJECT for a car. Take this and create a description value which describes the car based on all other values. Make sure to include all other values in the description while keeping the description string as descriptive yet short as possible. Here is the car object: ${JSON.stringify(car)}`;
          
          const result = await model.generateContent(prompt);
          //console.log(result)
          const geminiresponse = result.response;
          const description = geminiresponse.text();
          //console.log(description);
          car.description = description;
          carDescriptions.push(car.description)
          //console.log(car)
        }
        
        console.log("ABOUT TO SEND REQUEST TO EMBEDDING SERVICE")
        //console.log(result.response.text());


        // Send request to the Python service to get embeddings
        const pythonResponse = await axios.post('http://localhost:5005/embed', { car_data: carDescriptions });

        console.log("Request sent sucessfully to python service")
        // Process the response from the Python service
        const embeddings = pythonResponse.data.embeddings;

        console.log(embeddings.shape)
        // Return the embeddings as part of the response
        res.json({ carData, embeddings });

      } catch (pythonError) {
        console.error('Error communicating with Python service:', pythonError);
        res.status(500).json({ error: 'Failed to fetch embeddings from Python service' });
      }
    }
  });
  
};

