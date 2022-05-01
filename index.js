const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({
            message: 'unauthorized access'
        });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({
                message: 'forbidden access'
            });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
    // console.log(authHeader);
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.e04hb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("foodExpress").collection("service");
        const orderCollection = client.db("foodExpress").collection("order");
        console.log('Genius Car DB Connected!');

        // AUTH
        // node
        // require('crypto').randomBytes(64).toString('hex')
        app.post('/login', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
                expiresIn: '1d'
            });
            res.send({token});
        })

        // get all services
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        // get one service
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        // post one service
        app.post('/service', async (req, res) => {
            const service = req.body;
            console.log(service);
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        })

        // delete one service
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })

        // post order api
        app.post('/order', async (req, res) => {
            const order = req.body;
            // console.log(order);
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // order collection api
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            // console.log(email);
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            } else {
                return res.status(403).send({
                    message: 'forbidden access'
                });
            }
        })

        // random parameter test
        app.get('/hero', async (req, res) => {
            res.send('Hero going to meet Heroku');
        })
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World');
})

app.listen(port, () => {
    console.log('Port for genius car service started with', port);
})
