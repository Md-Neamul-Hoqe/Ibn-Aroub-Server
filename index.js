require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');

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
        'http://localhost:6173',
    ],
    credentials: true
}));

app.use(express.json())
app.use(cookieParser())


const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        console.log('the token to be verified: ', token);

        if (!token) return res.status(401).send({ message: 'Unauthorized access' })

        jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            // console.log(err);
            if (err) return res.status(401).send({ message: 'You are not authorized' })

            // console.log(decoded);
            req.user = decoded;
            next();
        })
    } catch (error) {
        // console.log(error);
        res.status(500).send({ message: 'Internal server error' });
    }
}
const setTokenCookie = async (req, res, next) => {
    const user = req.body;

    console.log(user);

    if (user?.email) {
        const token = jsonwebtoken.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

        console.log('Token generated: ', token);

        res
            .cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

            })
        // req.cookie
        next();
    }
}

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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const IA_database = client.db(DB);
        const projectCollection = IA_database.collection('projects');
        const emailCollection = IA_database.collection('emails');

        /* Auth api */
        app.post('/api/v1/auth/jwt', setTokenCookie, async (req, res) => {
            try {
                const { token } = req?.cookies;

                console.log('token in cookie: ', token, 'The cookies: ', req?.cookies);

                if (!token) return res.status(400).send({ success: false, message: 'Cookie set failed' })
                res.send({ success: true })
            } catch (error) {
                res.status(500).send({ error: true, message: error.message })
            }

        })

        /* user logout then clear cookie */
        app.post('/api/v1/user/logout', async (req, res) => {
            try {
                const user = req.body;
                console.log('logged out user: ', user);

                res.clearCookie('token', { maxAge: 0 }).send({ success: true })
            } catch (error) {
                res.status(500).send({ error: true, message: error.message })
            }
        })

        /**
         * ====================================
         * Projects APIs
         * ====================================
         */
        /* Get all projects */
        app.get('/api/v1/projects', async (_req, res) => {

            try {
                const result = await projectCollection.find().toArray();

                // console.log(result);

                res.send(result)
            } catch (error) {
                res.status(500).send({ error: true, message: error.message })
            }
        })

        /* Send Email */
        app.post('/api/v1/send-message', async (req, res) => {

            const userMessage = req.body;
            // console.log(userMessage);

            /* Save to database */
            const result = await emailCollection.insertOne(userMessage);

            // console.log(result);

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