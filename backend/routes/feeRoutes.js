const express = require("express");
const router = express.Router();

const {
    createFee,
    getAllFees,
    addPayment
} = require("../controllers/feeController");

router.post("/", createFee);
router.get("/", getAllFees);
router.post("/:id/payments", addPayment);

module.exports = router;
