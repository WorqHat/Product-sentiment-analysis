import fetch from 'node-fetch';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(express.json());
app.use('/public', express.static('./public'));

async function handleRequest(req, res) {
    const apiKey = process.env.WORQHAT_API_KEY;
    const userInput = req.body;
    const questionText = JSON.stringify(userInput)

    try {
        let response = {};
        console.log("questionText",questionText.userInput)
        console.log("userInput",userInput.userInput)
        console.log("Checkingtype",typeof questionText)
        console.log("CheckinguserInput",typeof userInput)

        // Check if the user input is a URL
        console.log("checkingurl",isURL(userInput.userInput))
        if (isURL(userInput.userInput)) {
            // URL Sentiment Extraction
            const urlOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url_path: userInput.userInput
                    // training_data:"You are URL sentiment analyzer.The user will provide url link of products as an input and you are going to fetch the data of reviews from that and based on majority of the reviews you will provide sentiments.Provide positive and negative words extracted from top reviews for the url input provided by user.",
                    // training_data:"You are URL sentiment analyzer.The user will provide url link of products as an input are you are going to fetch the data of reviews from web page.Then you have to extract the sentiments and display that sentiment which is in majority in that web page. provide positive and negative words extracted from top reviews for the url input provided by user.",
                    // training_data:"You are a URL sentiment analyzer. The user will provide a URL link of a product page as an input, and you will fetch the data of reviews from that webpage. Your task is to analyze sentiments.Determine the sentiment based on the type of reviews that are most prevalent on the product's webpage. If the majority of reviews are positive, you should display a positive sentiment; if the majority are negative, display a negative sentiment.Additionally, you should extract positive and negative words from the top reviews to provide more detailed feedback. Limit the extracted words to a maximum of 5-6 positive and negative words each. These words should represent the most commonly used positive and negative terms found in the reviews.Ensure that your analysis provides accurate results and that the feedback is informative and helpful to the user in understanding the overall sentiment and key aspects mentioned in the reviews.",
                    // training_data:"You're a URL sentiment analyzer. Users input a product page link, and you analyze review data to determine sentiment.Provide positive and negative words present in the reviews.",
                    // randomness: 0.1
                }),
            };

            const urlResponse = await fetch('https://api.worqhat.com/api/ai/v2/web-extract', urlOptions);
            const urlResult = await urlResponse.json();
            console.log("urlResult",urlResult)
            // Determine majority sentiment from URL
            let positiveCount = 0;
            let negativeCount = 0;
            if (urlResult && urlResult.reviews && urlResult.reviews.length > 0) {
                urlResult.reviews.forEach(review => {
                    if (review.sentiment.toLowerCase().includes('positive')) {
                        positiveCount++;
                    } else if (review.sentiment.toLowerCase().includes('negative')) {
                        negativeCount++;
                    }
                });

                if (positiveCount > negativeCount) {
                    response.urlSentiment = {
                        overallSentiment: 'Positive',
                        emoji: '😊',
                        color: 'green',
                        positiveWords: ['positive', 'good', 'excellent'], // Example positive words
                        negativeWords: ['negative', 'bad', 'poor'] // Example negative words
                    };
                } else (negativeCount > positiveCount) 
                {
                    response.urlSentiment = {
                        overallSentiment: 'Negative',
                        emoji: '😢',
                        color: 'red',
                        positiveWords: ['positive', 'good', 'excellent'], // Example positive words
                        negativeWords: ['negative', 'bad', 'poor'] // Example negative words
                    };
                } 
            }
        } else {
            // Text Sentiment Analysis
            const textOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversation_history: [
                        { 
                          "review_text": "It is very comfortable and very warm to wear but a little bit short so and the hands are bit long",
                          "sentiment": ` Positive.😊 \n Advantages :- Comfortable and warm to wear.\n Suggestions :- packaging can be improved. \n `
                        },
                        { 
                          "review_text": "The boatz earphones were very bad and sound quality was not good.",
                          "sentiment": ` Negative.😢 \n Disadvantages :- poor sound quality.\n Suggestions :- Enhance sound performance for better user experience. \n `
                         }
                      ],
                    preserve_history: true,
                    question: questionText,
                    randomness: 0.1,
                    response_type: "text",
                    stream_data: false,
                    training_data: "You are a sentiment analysis model named SentimentAI. Your task is to analyze sentiments expressed in product reviews and provide detailed feedback. You should be able to handle input in both text and URL format. If the input is text, analyze the sentiment and provide feedback including advantages (for positive sentiment) and disadvantages (for negative sentiment) of the product, along with suggestions for improvement. If the input is a URL pointing to a product page with multiple reviews, calculate the average sentiment of all reviews and provide feedback accordingly. Ensure to provide clear and concise responses in a structured format. When analyzing sentiments, consider both positive and negative aspects mentioned in the reviews. Be sensitive to the context and tone of the reviews to accurately assess sentiment. Your responses should be informative and helpful to the user in understanding the overall sentiment and areas for improvement."
                    //training_data:"You are sentiment analysis model.The user will provide text of products as an input are you are going to fetch the data of reviews from that and based on majority of the reviews you will provide sentiments.Provide positive and negative words extracted from top reviews for the url input provided by user.",
                }),
            };

            const textResponse = await fetch('https://api.worqhat.com/api/ai/content/v2', textOptions);
            const textResult = await textResponse.json();

            console.log(textResult);

            res.send(textResult)

        }

        res.send(textResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

function isURL(str) {
    // Simple URL validation
    return /^(.com|http|https):\/\/[^ "]+$/.test(str);
}


app.post('/', handleRequest);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(process.env.PORT, () => {
    console.log(`Server listening on port: ${process.env.PORT}`);
});
