const mongoose = require('mongoose');
require('dotenv').config();

// 1. Your current local database
const LOCAL_URI = "mongodb://localhost:27017/smartfinance";

// 2. Paste your new MongoDB Atlas connection string here
const ATLAS_URI = "mongodb://js2114oni_db_user:nFKLdHtW7J%40.Nrz@ac-grk1xjw-shard-00-00.vbahliy.mongodb.net:27017,ac-grk1xjw-shard-00-01.vbahliy.mongodb.net:27017,ac-grk1xjw-shard-00-02.vbahliy.mongodb.net:27017/smartfinance?ssl=true&replicaSet=atlas-ldg0ko-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function migrate() {
    if (ATLAS_URI.includes("REPLACE_THIS")) {
        console.log("❌ ERROR: Please open migrate.js and replace ATLAS_URI with your real Atlas connection string first!");
        process.exit(1);
    }

    console.log("Connecting to Local Database...");
    const localDb = mongoose.createConnection(LOCAL_URI);

    console.log("Connecting to Atlas Database...");
    const atlasDb = mongoose.createConnection(ATLAS_URI);

    // Wait for both to connect
    await Promise.all([
        new Promise(resolve => localDb.once('open', resolve)),
        new Promise(resolve => atlasDb.once('open', resolve))
    ]);

    console.log("✅ Both connected successfully!");

    // List of all your app's collections
    const collections = ['users', 'transactions', 'budgets', 'processedemails'];

    for (let colName of collections) {
        console.log(`\nMigrating collection: ${colName}...`);

        // Get all documents from local
        const localCollection = localDb.collection(colName);
        const docs = await localCollection.find({}).toArray();
        console.log(`Found ${docs.length} documents in local '${colName}'.`);

        if (docs.length > 0) {
            const atlasCollection = atlasDb.collection(colName);

            try {
                // Insert all documents into Atlas
                await atlasCollection.insertMany(docs);
                console.log(`✅ Successfully copied ${docs.length} documents to Atlas '${colName}'!`);
            } catch (err) {
                console.error(`❌ Error migrating ${colName}: It's possible data already exists here. Details:`, err.message);
            }
        }
    }

    console.log("\n🎉 Migration Complete! All your data has been safely copied to Atlas.");
    console.log("Next Step: Update the MONGO_URI in your .env file to your Atlas string.");
    process.exit(0);
}

migrate();
