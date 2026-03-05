import { Router } from "express";
import { getDB } from "../db/connection.js";
import { ObjectId } from "mongodb";

const router = Router();

// CREATE income
router.post("/", async (req, res) => {
  const { userId, amount, category, description, date } = req.body;

  if (!userId || amount === undefined || !category) {
    return res
      .status(400)
      .json({ error: "userId, amount, and category are required." });
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number." });
  }

  try {
    const db = getDB();
    // date validation
    let parsedDate = new Date();
      if (date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: "Date format invalid." });
        }
        parsedDate = d;
      }
    
    const result = await db.collection("income").insertOne({
      userId,
      amount: Number(amount),
      category,
      description: description || "",   
      date: parsedDate,
      createdAt: new Date(),
    });

    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all income (optionally filter by userId)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;

    const records = await db
      .collection("income")
      .find(filter)
      .sort({ date: -1 })
      .toArray();

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single income record
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const record = await db
      .collection("income")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!record)
      return res.status(404).json({ error: "Income record not found." });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE income
router.put("/:id", async (req, res) => {
  const { amount, category, description, date } = req.body;

  try {
    const db = getDB();
    const updates = {};
    if (amount !== undefined) {
      if (isNaN(amount) || Number(amount) <= 0) {
        return res
          .status(400)
          .json({ error: "Amount must be a positive number." });
      }
      updates.amount = Number(amount);
    }
    if (category) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: "Invalid date format." });
      }
      updates.date = d;
    }

    const result = await db
      .collection("income")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Income record not found." });
    }

    res.json({ message: "Income updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE income
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const result = await db
      .collection("income")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Income record not found." });
    }

    res.json({ message: "Income deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
