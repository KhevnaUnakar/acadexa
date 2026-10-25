const express = require("express");
const createAcademicRecordController = require("../controllers/academicRecordController");

const createAcademicRecordRoutes = (Model, fields, populates = []) => {
    const router = express.Router();
    const controller = createAcademicRecordController(Model, fields, populates);

    router.get("/", controller.getAll);
    router.post("/", controller.create);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.remove);

    return router;
};

module.exports = createAcademicRecordRoutes;
