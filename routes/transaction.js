/*
  transaction.js -- Router for the Transaction
*/
const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const User = require("../models/User");

/*
this is a very simple server which maintains a key/value
store using an object where the keys and values are lists of strings

*/

isLoggedIn = (req, res, next) => {
  if (res.locals.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

// get the value associated to the key
router.get("/transaction", isLoggedIn, async (req, res, next) => {
  const sortBy = req.query.sortBy;
  let transactions = [];
  if (sortBy) {
    transactions = await Transaction.find({ userId: req.user._id }).sort({
      [sortBy]: 1,
    });
  } else {
    transactions = await Transaction.find({ userId: req.user._id });
  }
  res.render("transaction", { transactions });
});

/* add the value in the body to the list associated to the key */
router.post("/transaction", isLoggedIn, async (req, res, next) => {
  const transaction = new Transaction({
    description: req.body.description,
    amount: req.body.amount,
    category: req.body.category,
    date: req.body.date,
    userId: req.user._id,
  });
  await transaction.save();
  res.redirect("/transaction");
});

// delete the item with the given id
router.get(
  "/transaction/remove/:transactionId",
  isLoggedIn,
  async (req, res, next) => {
    await Transaction.deleteOne({ _id: req.params.transactionId });
    res.redirect("/transaction");
  }
);

// edit the item with the given id
router.get(
  "/transaction/edit/:transactionId",
  isLoggedIn,
  async (req, res, next) => {
    const transaction = await Transaction.findById(req.params.transactionId);
    res.locals.transaction = transaction;
    res.render("transactionEdit");
  }
);

// update the item with the given id
router.post(
  "/transaction/updateTransaction",
  isLoggedIn,
  async (req, res, next) => {
    const { transactionId, description, amount, category, date } = req.body;
    await Transaction.findOneAndUpdate(
      { _id: transactionId },
      { $set: { description, amount, category, date } }
    );
    res.redirect("/transaction");
  }
);

// summarize the items by category
router.get("/transaction/byCategory", isLoggedIn, async (req, res, next) => {
  let results = await Transaction.aggregate([
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.render("byCategory", { results });
});

module.exports = router;
