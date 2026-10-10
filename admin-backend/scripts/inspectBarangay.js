const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

const mongoose = require("mongoose");

require("dotenv").config();

const MONGODB_ID =
  "6ac3ced63abd7c7367aa0ce4";

async function inspectBarangay() {
  try {
    console.log(
      "\nConnecting to MongoDB..."
    );

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "MongoDB connected successfully.\n"
    );

    const db =
      mongoose.connection.db;

    const doc =
      await db
        .collection("barangays")
        .findOne({
          _id: new mongoose.Types.ObjectId(
            MONGODB_ID
          ),
        });

    console.log(
      "================================="
    );

    console.log(
      "RAW BARANGAY DOCUMENT"
    );

    console.log(
      "=================================\n"
    );

    if (!doc) {
      console.log(
        "No document found."
      );
    } else {
      console.log(
        JSON.stringify(
          doc,
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error(
      "\nInspection failed:",
      error.message
    );
  } finally {
    await mongoose.disconnect();
  }
}

inspectBarangay();