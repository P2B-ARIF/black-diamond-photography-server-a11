const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER_Name}:${process.env.DB_USER_PASSWORD}@cluster0.beqkzcx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const tokenHeader = req.headers.authorization
    if (!tokenHeader) {
        return res.status(401).json({
            status: 401,
            message: 'Unauthorized'
        })
    }
    const token = tokenHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: "unauthorized access" })
        }
        req.decoded = decoded;
        next()
    })
}

async function server() {
    try {
        const servicesCollection = client.db('photography').collection('services')
        const reviewCollection = client.db('photography').collection('reviews')

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token })
            console.log({ token });
        })

        app.get('/homeServices', async (req, res) => {
            const query = {}
            const cursor = servicesCollection.find(query)
            const results = await cursor.sort({date: -1}).limit(3).toArray()
            res.send(results)
            // console.log(results);
        })

        app.get('/Services', async (req, res) => {
            const query = {}
            const cursor = servicesCollection.find(query)
            const results = await cursor.toArray()
            res.send(results)
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const cursor = await servicesCollection.findOne(query)
            res.send(cursor)
        })

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const cursor = await servicesCollection.findOne(query)
            res.send(cursor)
        })

        app.post('/reviews', async (req, res) => {
            const query = req.body
            const cursor = await reviewCollection.insertOne(query)
            res.send(cursor)
            // console.log(cursor)
        })

        app.get('/reviews', async (req, res) => {
            const query = {}
            const cursor = reviewCollection.find(query)
            const results = await cursor.toArray()
            res.send(results)
            // console.log(results)
        })

        app.get('/myReviews', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const cursor = reviewCollection.find(query)
            const results = await cursor.toArray()
            res.send(results)
        })

        app.post('/addService', async (req, res) => {
            const query = req.body;
            const service = await servicesCollection.insertOne(query)
            res.send(service)
            // console.log(service)
        })

        app.get('/editReviews/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const cursor = await reviewCollection.findOne(query)
            res.send(cursor)
        })


        app.put('/editReview/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const updateTextArea = req.body;
            const options = { upsert: true }
            const updateDoc = { $set: { textarea: updateTextArea.text } }
            const result = await reviewCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })

        app.delete('/deleteReview/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(query)
            res.send(result)
            console.log(result)
        })

        app.get('/review/:id', async (req, res) => {
            const id = req.query.id;
            const query = { service_id: id }
            const cursor = reviewCollection.find(query)
            const results = await cursor.toArray()
            res.send(results)
        })


    } finally { }
}
server().catch(err => console.error(err))

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})