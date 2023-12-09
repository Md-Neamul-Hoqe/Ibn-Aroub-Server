require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');

/* database name */
const DB = "swiftWheels-db";

const app = express();

const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        "https://mahogany-furniture-mnh.web.app",
        "https://mahogany-furniture-mnh.firebaseapp.com"
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

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@carsdoctordb.pehv7ki.mongodb.net/${DB}?retryWrites=true&w=majority`;

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

                console.log(result);

                res.send(result)
            } catch (error) {
                res.status(500).send({ error: true, message: error.message })
            }
        })

        // /* find Popular services */
        // app.get('/api/v1/popular-services', async (req, res) => {
        //     try {
        //         const { type } = req.query;

        //         const options = {
        //             projection: { title: 1, price: 1, img: 1, provider: 1, description: 1 }
        //         }

        //         if (type === "bikes") {
        //             const result = await bikeCollection.find({}, options).limit(4).toArray();
        //             return res.send(result)
        //         }
        //         const result = await carCollection.find({}, options).limit(4).toArray();

        //         // console.log(result);

        //         /* if not matched send empty array */
        //         return res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Get services provided by the user */
        // app.get('/api/v1/user/services/:email', verifyToken, async (req, res) => {
        //     try {
        //         const email = req?.params?.email;

        //         // console.log(email, req.user?.email, email === req?.user?.email);

        //         if (email !== req?.user?.email) return res.status(403).send({ message: 'Forbidden' })

        //         const query = { "provider.email": email }

        //         const bikes = await bikeCollection.find(query).toArray();

        //         const cars = await carCollection.find(query).toArray();

        //         const result = [ ...bikes, ...cars ];

        //         /* if not matched send empty array */
        //         return res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Get services of this provider */
        // app.get('/api/v1/same-provider-services/:email', async (req, res) => {
        //     try {
        //         const email = req.params.email;
        //         const { id } = req.query;

        //         // console.log(email);

        //         const query = { "provider.email": email, _id: { $ne: new ObjectId(id) } }

        //         const options = {
        //             projection: {
        //                 img: 1,
        //                 type: 1,
        //                 name: 1,
        //                 area: 1,
        //                 description: 1,
        //                 price: 1,
        //                 status: 1,
        //             }
        //         }
        //         // console.log(email, query);

        //         const bikes = await bikeCollection.find(query, options).toArray();

        //         const cars = await carCollection.find(query, options).toArray();

        //         const result = [ ...bikes, ...cars ];
        //         // console.log([ ...bikes, ...cars ]);

        //         /* if not matched send empty array */
        //         return res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Get a service by ID */
        // app.get('/api/v1/services/:id', async (req, res) => {
        //     try {
        //         const { id } = req.params;

        //         console.log("Service id: ", id);

        //         const query = { _id: new ObjectId(id) }

        //         // if (type === "bikes") {

        //         const result1 = await bikeCollection.find(query).toArray();
        //         if (!result1.length) {
        //             const result = await carCollection.find(query).toArray();

        //             console.log('the service: (244)', result);

        //             /* if not matched send empty array */
        //             return res.send(result)
        //         }

        //         return res.send(result1)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Get a service by Title */
        // app.get('/api/v1/filtered-services/:title', async (req, res) => {
        //     try {
        //         const { title } = req.params;
        //         const { type } = req.query;

        //         // console.log("Service title: ", title);

        //         const query = { title: { $regex: title, $options: 'i' } }

        //         if (type === "bikes") {
        //             const result = await bikeCollection.find(query).toArray();

        //             // console.log(result);

        //             /* if not matched send empty array */
        //             return res.send(result)
        //         }
        //         const result = await carCollection.find(query).toArray();

        //         // console.log(result);
        //         return res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* get by ids */
        // app.post('/api/v1/services', async (req, res) => {

        //     try {
        //         const { ids } = req.body;

        //         console.log("Service ids: ", ids);

        //         const objectIds = ids.map(id => new ObjectId(id))

        //         const query = { _id: { $in: objectIds } }

        //         // if (type === "bikes") {
        //         const options = {
        //             projection: { _id: 1 }
        //         }

        //         const bikes = await bikeCollection.find(query, options).toArray();
        //         // console.log(result);
        //         // }
        //         const cars = await carCollection.find(query, options).toArray();

        //         const result = [ ...bikes, ...cars ];
        //         console.log([ ...bikes, ...cars ]);

        //         /* if not matched send empty array */
        //         return res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Add / Host a service */
        // app.post('/api/v1/create-service', verifyToken, async (req, res) => {

        //     try {
        //         const service = req.body;

        //         if (service.provider?.email !== req.user?.email) return res.status(403).send({ message: 'Forbidden' })

        //         console.log(service);
        //         if (service?.type === 'bikes') {
        //             const result = await bikeCollection.insertOne(service)

        //             // console.log(result);
        //             return res.send(result)
        //         }
        //         const result = await carCollection.insertOne(service)

        //         // console.log(result);
        //         res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Update service by ID */
        // app.patch('/api/v1/update-service/:id', async (req, res) => {

        //     try {
        //         const { id } = req.params;
        //         const { type } = req.query;
        //         const updatedService = req.body;

        //         console.log("Update services: ", id);

        //         const query = { _id: new ObjectId(id) }

        //         if (type === 'bikes') {
        //             const result = await bikeCollection.updateOne(
        //                 query,
        //                 { $set: { ...updatedService } },
        //             );

        //             console.log(result);
        //             return res.send(result)
        //         }

        //         const result = await carCollection.updateOne(
        //             query,
        //             { $set: { ...updatedService } },
        //         );
        //         console.log(result);

        //         return res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* delete provided service */
        // app.delete('/api/v1/user/delete-service/:id', verifyToken, async (req, res) => {

        //     try {
        //         const { id } = req.params;
        //         const { email } = req.query;

        //         // console.log("Delete service: ", id, email);

        //         if (email !== req?.user?.email) return res.status(403).send({ message: 'Forbidden' })

        //         const query = { _id: new ObjectId(id), "provider.email": email };

        //         const result1 = await bikeCollection.deleteOne(query)
        //         if (result1?.data?.deletedCount)
        //             return res.send(result1)

        //         const result = await carCollection.deleteOne(query)

        //         // console.log(result);
        //         res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Get all bookings */
        // app.get('/api/v1/bookings/:email', verifyToken, async (req, res) => {
        //     try {
        //         const email = req.params.email;

        //         console.log("Bookings:", email, req.user.email);

        //         if (email !== req?.user?.email) return res.status(403).send({ message: 'Forbidden' })

        //         const result = await bookingCollection.find({ "Owner.email": email }).toArray();

        //         // console.log('Bookings: ', result);

        //         res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Get a booking by id */
        // app.get('/api/v1/bookings/:id', async (req, res) => {
        //     try {
        //         const id = req.params.id;
        //         const query = { _id: new ObjectId(id) }

        //         const options = {
        //             projection: {
        //                 count: 1
        //             }
        //         }
        //         console.log("The booking: ", id, query, options);

        //         const result = await bookingCollection.findOne(query, options);

        //         // console.log(result);

        //         res.send(result)
        //     } catch (error) {
        //         console.log(error);
        //         res.status(500).send({ message: 'Internal server error' });
        //     }
        // })

        // /* delete a booking */
        // app.delete('/api/v1/user/cancel-booking/:id', verifyToken, async (req, res) => {

        //     try {
        //         const { id } = req.params;
        //         const { email } = req.query;

        //         // console.log(id, email);

        //         if (email !== req.user?.email) return res.status(403).send({ message: 'Forbidden' })

        //         const query = { _id: new ObjectId(id), "Owner.email": email };
        //         const result = await bookingCollection.deleteOne(query)

        //         /* Update Provider schedule */
        //         if (result.deletedCount) {
        //             const query1 = { _id: new ObjectId(id) }
        //             const serviceStatus = {
        //                 $set: {
        //                     statusInfo: {
        //                         status: 'available',
        //                         income: null,
        //                         schedule: null
        //                     }
        //                 }
        //             }

        //             const result1 = await bikeCollection.updateOne(
        //                 query1,
        //                 serviceStatus,
        //             );

        //             if (!result1.modifiedCount) {
        //                 await carCollection.updateOne(
        //                     query1,
        //                     serviceStatus,
        //                 );
        //             }

        //             if (result1.modifiedCount) result.driverInformed = true;
        //         }

        //         // console.log(result);
        //         res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* booked a service [customize for desired solution] */
        // app.patch('/api/v1/update-booking/:id', async (req, res) => {
        //     try {
        //         const { id } = req.params;
        //         const booking = req.body;
        //         // booking._id = new ObjectId(id);

        //         const query = { _id: new ObjectId(id) }

        //         const Update = {
        //             $set: {
        //                 ...booking
        //             }
        //         }

        //         console.log(
        //             "Update booking: ", Update
        //         );

        //         const result = await bookingCollection.updateOne(query, Update, { upsert: true })


        //         // console.log(result);

        //         return res.send(result)
        //     } catch (error) {
        //         console.log(error);
        //         res.status(500).send({ message: 'Internal server error' });
        //     }
        // })

        // app.post('/api/v1/book-service', async (req, res) => {
        //     try {
        //         const booking = req?.body;
        //         const { id } = req?.query;

        //         booking._id = new ObjectId(id)

        //         console.log("Book service: ", booking);

        //         const result = await bookingCollection.insertOne(booking)

        //         return res.send(result)
        //     } catch (error) {
        //         console.log(error);
        //         res.status(500).send({ message: error?.message });
        //     }
        // })

        // /* Get the testimonials */
        // app.get('/api/v1/testimonials', async (_req, res) => {
        //     try {
        //         const result = await testimonialCollection.find().toArray();

        //         // console.log(result);

        //         res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

        // /* Post a testimonial */
        // app.post('/api/v1/post-testimonials', async (req, res) => {

        //     try {
        //         const comment = req.body;
        //         const result = await testimonialCollection.insertOne(comment);

        //         console.log(result);

        //         res.send(result)
        //     } catch (error) {
        //         res.status(500).send({ error: true, message: error.message })
        //     }
        // })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
        console.log("server is running.");
    }
}
run().catch(console.dir);














app.get('/', (req, res) => {
    res.send('SwiftWheels Server is running...')
})

app.listen(port, () => {
    console.log(`SwiftWheels app listening on port ${port}`)
})