const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    username : {
        type :String ,
        required :true ,
        unique :true
    },
    password :{
        type :String ,
        required :true
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;