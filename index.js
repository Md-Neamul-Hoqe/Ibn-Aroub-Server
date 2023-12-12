require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
});
/* database name */
const DB = "ibn-aroub";

const app = express();

const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:6173', 'https://ibn-aroub-portfolio.surge.sh'
    ],
}));

app.use(express.json())


const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@projects.mqfabmq.mongodb.net/${DB}?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const IA_database = client.db(DB);
        const projectCollection = IA_database.collection('projects');
        const emailCollection = IA_database.collection('emails');

        /**
         * ====================================
         * Projects APIs
         * ====================================
         */
        /* Get all projects */
        app.get('/api/v1/projects', async (_req, res) => {
            try {
                const result = await projectCollection.find().toArray();

                res.send(result)
            } catch (error) {
                res.status(500).send({ error: true, message: error.message })
            }
        })

        /* Send Email */
        app.post('/api/v1/send-message', async (req, res) => {

            const userMessage = req.body;

            /* Save to database */
            await emailCollection.insertOne(userMessage);

            mg.messages
                .create(process.env.MAILGUN_SENDING_DOMAIN, {
                    from: userMessage?.email,
                    to: [ "mdneamul99@student.sust.edu" ],
                    subject: userMessage?.title,
                    text: userMessage?.name,
                    html: userMessage?.message
                })
                .then(msg => res.send(msg))
                .catch(err => console.log(err));
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
        console.log("server is running.");
    }
}
run().catch(console.dir);














app.get('/', (req, res) => {
    res.send('Ibn Aroub Server is running...')
})

app.listen(port, () => {
    console.log(`Ibn Aroub app listening on port ${port}`)
})