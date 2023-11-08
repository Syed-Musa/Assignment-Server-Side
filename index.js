const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000

app.use(cors({
  origin: [
    'online-markets-de019.web.app',
    'online-markets-de019.firebaseapp.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jv3edzu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares
const logger = async(req, res, next) =>{
  console.log('called', req.host, req.originalUrl)
  next();
};

// const verifyToken = async(req, res, next) =>{
//   const token = req.cookies?.token;
//   // console.log('token verified', token)
//   if(!token){
//     return res.status(401).send({message: 'unaothorized access'})
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
//     if(err){
//       return res.status(401).send({message: 'unaothorized access'})
//     }
//     req.user = decoded;
//     next();
//   })
// }

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const jobsCollection = client.db('onlineMarket').collection('jobs');
    const companyCollection = client.db('onlineMarket').collection('companies');

    app.post('/jwt', logger, async(req, res)=>{
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
        
      })
      .send({success: true});
    })

    app.get('/jobs', logger, async(req, res)=>{
      const cursor = jobsCollection.find();
      console.log('valid in the token', req.user)
      console.log('from valid token', req.user);
      const result = await cursor.toArray();
      // const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });    

    app.get('/jobs/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const options = {
        projection: { deedline: 1, price: 1, det_id: 1, images: 1},
      };
      const result = await jobsCollection.findOne(query, options);
      res.send(result);
    });

    app.post('/jobs', async(req, res)=>{
      const newJobs = req.body;
      console.log(newJobs);
      const result = await jobsCollection.insertOne(newJobs);
      res.send(result);
    });

    app.get('/postedjob', logger, async(req, res)=>{
      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post('/postedjob', async(req, res)=>{
      const postedData = req.body;
      console.log(postedData);
      const result = await jobsCollection.insertOne(postedData);
      res.send(result);
    });

    app.put('/postedjob/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        },
      };
      const result = await jobsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/postedjob/:id', async(req ,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/companies', async(req, res)=>{
      const cursor = companyCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.use('/', (req, res)=>{
    res.send('Market place job running')
});

app.listen(port, ()=>{
    console.log(`The marketplace jobs is running on port ${port}`)
});