const mongoose = require('mongoose');

const food = mongoose.Schema({
    ProductName: "",
    PriceGross: "",
    VAT: "",
    PriceNet: "",
    Stock: "",
    Image:""
});


module.exports = mongoose.model("food", food);