const express = require("express");
const controller = require("../controllers/admissionController");

const router = express.Router();

router.get("/", controller.getAll);
router.post("/", controller.create);
router.post("/:id/approve", controller.approve);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
