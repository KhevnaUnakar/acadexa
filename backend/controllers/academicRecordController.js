const mongoose = require("mongoose");

const createAcademicRecordController = (Model, fields, populates = []) => {
    const populateRecords = (query) =>
        populates.reduce((result, field) => result.populate(field), query);

    return {
        getAll: async (req, res) => {
            try {
                const records = await populateRecords(Model.find()).sort({ createdAt: -1 });
                return res.status(200).json({ count: records.length, records });
            } catch (error) {
                console.error(`Error fetching ${Model.modelName} records:`, error);
                return res.status(500).json({ message: `Unable to fetch ${Model.modelName.toLowerCase()} records.` });
            }
        },
        create: async (req, res) => {
            try {
                const record = await Model.create(
                    Object.fromEntries(fields.filter((field) => req.body[field] !== undefined)
                        .map((field) => [field, req.body[field]]))
                );
                return res.status(201).json({ message: "Record created successfully.", record });
            } catch (error) {
                if (error.code === 11000) {
                    return res.status(409).json({ message: "A record with these details already exists." });
                }
                if (error.name === "ValidationError" || error.name === "CastError") {
                    return res.status(400).json({ message: error.message });
                }
                console.error(`Error creating ${Model.modelName} record:`, error);
                return res.status(500).json({ message: `Unable to create ${Model.modelName.toLowerCase()} record.` });
            }
        },
        update: async (req, res) => {
            try {
                if (!mongoose.isValidObjectId(req.params.id)) {
                    return res.status(400).json({ message: "Invalid record ID." });
                }
                const updates = Object.fromEntries(fields
                    .filter((field) => req.body[field] !== undefined)
                    .map((field) => [field, req.body[field]]));
                if (Object.keys(updates).length === 0) {
                    return res.status(400).json({ message: "No valid fields provided." });
                }
                if (Model.modelName === "Examination") {
                    const existingRecord = await Model.findById(req.params.id);
                    if (!existingRecord) {
                        return res.status(404).json({ message: "Record not found." });
                    }
                    const totalMarks = updates.totalMarks ?? existingRecord.totalMarks;
                    const marksObtained = updates.marksObtained ?? existingRecord.marksObtained;
                    if (Number(marksObtained) > Number(totalMarks)) {
                        return res.status(400).json({ message: "Marks obtained cannot exceed total marks." });
                    }
                }
                const record = await Model.findByIdAndUpdate(
                    req.params.id,
                    { $set: updates },
                    { new: true, runValidators: true }
                );
                if (!record) {
                    return res.status(404).json({ message: "Record not found." });
                }
                return res.status(200).json({ message: "Record updated successfully.", record });
            } catch (error) {
                if (error.code === 11000) {
                    return res.status(409).json({ message: "A record with these details already exists." });
                }
                if (error.name === "ValidationError" || error.name === "CastError") {
                    return res.status(400).json({ message: error.message });
                }
                console.error(`Error updating ${Model.modelName} record:`, error);
                return res.status(500).json({ message: `Unable to update ${Model.modelName.toLowerCase()} record.` });
            }
        },
        remove: async (req, res) => {
            try {
                if (!mongoose.isValidObjectId(req.params.id)) {
                    return res.status(400).json({ message: "Invalid record ID." });
                }
                const record = await Model.findByIdAndDelete(req.params.id);
                if (!record) {
                    return res.status(404).json({ message: "Record not found." });
                }
                return res.status(200).json({ message: "Record deleted successfully." });
            } catch (error) {
                console.error(`Error deleting ${Model.modelName} record:`, error);
                return res.status(500).json({ message: `Unable to delete ${Model.modelName.toLowerCase()} record.` });
            }
        }
    };
};

module.exports = createAcademicRecordController;
